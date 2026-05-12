-- Harden resumes + applications: indexes, updated_at on resumes, status check,
-- FK ownership (resume_id / job_id must belong to the same user_id), RLS initplan fix.

-- ---------------------------------------------------------------------------
-- Resumes: track last metadata change (parsing/structured updates can set this)
-- ---------------------------------------------------------------------------
alter table public.resumes
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

create index if not exists applications_resume_id_idx on public.applications (resume_id);
create index if not exists applications_user_status_idx on public.applications (user_id, status);

-- ---------------------------------------------------------------------------
-- Applications: status must match app constants (lib/constants/applications.ts)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_status_valid'
  ) then
    alter table public.applications
      add constraint applications_status_valid
      check (
        status in (
          'draft',
          'tailored',
          'applied',
          'interviewing',
          'offer',
          'rejected',
          'closed'
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Ensure resume_id / job_id rows are owned by the same user (RLS alone is not enough)
-- ---------------------------------------------------------------------------
create or replace function public.applications_enforce_fk_ownership()
returns trigger
language plpgsql
as $$
begin
  if new.resume_id is not null then
    if not exists (
      select 1
      from public.resumes r
      where r.id = new.resume_id
        and r.user_id = new.user_id
    ) then
      raise exception 'resume_id must reference a resume owned by the same user';
    end if;
  end if;

  if new.job_id is not null then
    if not exists (
      select 1
      from public.jobs j
      where j.id = new.job_id
        and j.user_id = new.user_id
    ) then
      raise exception 'job_id must reference a job owned by the same user';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists applications_enforce_fk_ownership on public.applications;
create trigger applications_enforce_fk_ownership
before insert or update of user_id, resume_id, job_id on public.applications
for each row
execute function public.applications_enforce_fk_ownership();

comment on table public.resumes is
  'User resume files (private storage path), extracted text, and structured JSON.';
comment on table public.applications is
  'Job application tracker: links optional job + resume, tailoring output, ATS hints, Kanban status.';

-- ---------------------------------------------------------------------------
-- RLS: use (select auth.uid()) so Postgres evaluates uid once per statement
-- ---------------------------------------------------------------------------
drop policy if exists "resumes_select_own" on public.resumes;
drop policy if exists "resumes_insert_own" on public.resumes;
drop policy if exists "resumes_update_own" on public.resumes;
drop policy if exists "resumes_delete_own" on public.resumes;

create policy "resumes_select_own" on public.resumes
  for select using ((select auth.uid()) = user_id);
create policy "resumes_insert_own" on public.resumes
  for insert with check ((select auth.uid()) = user_id);
create policy "resumes_update_own" on public.resumes
  for update using ((select auth.uid()) = user_id);
create policy "resumes_delete_own" on public.resumes
  for delete using ((select auth.uid()) = user_id);

drop policy if exists "applications_select_own" on public.applications;
drop policy if exists "applications_insert_own" on public.applications;
drop policy if exists "applications_update_own" on public.applications;
drop policy if exists "applications_delete_own" on public.applications;

create policy "applications_select_own" on public.applications
  for select using ((select auth.uid()) = user_id);
create policy "applications_insert_own" on public.applications
  for insert with check ((select auth.uid()) = user_id);
create policy "applications_update_own" on public.applications
  for update using ((select auth.uid()) = user_id);
create policy "applications_delete_own" on public.applications
  for delete using ((select auth.uid()) = user_id);
