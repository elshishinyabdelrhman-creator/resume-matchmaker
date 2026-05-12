-- Resumes + applications tailoring columns.
-- Safe when 00001_core / 00005 already ran: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

-- ---------------------------------------------------------------------------
-- Resumes
-- id, user_id, storage_path, file_name, mime_type, parsed_text, structured_data, created_at
-- ---------------------------------------------------------------------------

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  parsed_text text,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes (user_id);

alter table public.resumes
  add column if not exists structured_data jsonb not null default '{}'::jsonb;

comment on table public.resumes is 'Uploaded resume files + extracted text and structured JSON.';
comment on column public.resumes.structured_data is 'Parsed resume sections (JSON).';

-- ---------------------------------------------------------------------------
-- Applications (adds job_title, tailored_resume, ats_score, keyword_gaps)
-- Keeps job_id, role_title, source_url, notes, updated_at for existing app code.
-- ---------------------------------------------------------------------------

alter table public.applications
  add column if not exists job_title text;

-- Backfill from legacy column name, then enforce NOT NULL (matches role_title).
update public.applications
set job_title = role_title
where job_title is null;

alter table public.applications
  alter column job_title set not null;

alter table public.applications
  add column if not exists tailored_resume text;

alter table public.applications
  add column if not exists ats_score integer;

alter table public.applications
  add column if not exists keyword_gaps jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applications_ats_score_range'
  ) then
    alter table public.applications
      add constraint applications_ats_score_range
      check (ats_score is null or (ats_score >= 0 and ats_score <= 100));
  end if;
end $$;

comment on column public.applications.job_title is 'Display title for the role (kept in sync with role_title for legacy code).';
comment on column public.applications.tailored_resume is 'Latest AI-tailored resume (Markdown).';
comment on column public.applications.ats_score is 'Heuristic or model ATS-style score 0–100.';
comment on column public.applications.keyword_gaps is 'JSON array of strings: missing or weak keywords vs. the JD.';

-- Keep job_title and role_title aligned when only one is provided (legacy inserts use role_title).
create or replace function public.applications_sync_job_title_role_title()
returns trigger
language plpgsql
as $$
begin
  if new.job_title is null or length(trim(new.job_title)) = 0 then
    new.job_title := new.role_title;
  end if;
  if new.role_title is null or length(trim(new.role_title)) = 0 then
    new.role_title := new.job_title;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_sync_job_title_role_title on public.applications;
create trigger applications_sync_job_title_role_title
before insert or update on public.applications
for each row
execute function public.applications_sync_job_title_role_title();
