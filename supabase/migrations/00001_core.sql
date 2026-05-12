-- Resume Matchmaker core schema (run via Supabase CLI or SQL editor)

create extension if not exists "pgcrypto";

-- Profiles mirror auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

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

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  resume_id uuid references public.resumes on delete set null,
  company text not null,
  role_title text not null,
  job_description text,
  source_url text,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications (user_id);

create table if not exists public.ats_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications on delete cascade,
  resume_id uuid references public.resumes on delete set null,
  overall_score int not null check (overall_score between 0 and 100),
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ats_scores_application_id_idx on public.ats_scores (application_id);

create table if not exists public.tailor_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  application_id uuid references public.applications on delete set null,
  resume_id uuid references public.resumes on delete set null,
  input_jd_excerpt text,
  suggestions jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists tailor_runs_user_id_idx on public.tailor_runs (user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.ats_scores enable row level security;
alter table public.tailor_runs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "resumes_select_own" on public.resumes for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes for update using (auth.uid() = user_id);
create policy "resumes_delete_own" on public.resumes for delete using (auth.uid() = user_id);

create policy "applications_select_own" on public.applications for select using (auth.uid() = user_id);
create policy "applications_insert_own" on public.applications for insert with check (auth.uid() = user_id);
create policy "applications_update_own" on public.applications for update using (auth.uid() = user_id);
create policy "applications_delete_own" on public.applications for delete using (auth.uid() = user_id);

create policy "ats_scores_select_own" on public.ats_scores for select using (
  exists (
    select 1 from public.applications a
    where a.id = ats_scores.application_id and a.user_id = auth.uid()
  )
  or exists (
    select 1 from public.resumes r
    where r.id = ats_scores.resume_id and r.user_id = auth.uid()
  )
);
create policy "ats_scores_insert_own" on public.ats_scores for insert with check (
  exists (
    select 1 from public.applications a
    where a.id = ats_scores.application_id and a.user_id = auth.uid()
  )
  or exists (
    select 1 from public.resumes r
    where r.id = ats_scores.resume_id and r.user_id = auth.uid()
  )
);

create policy "tailor_runs_select_own" on public.tailor_runs for select using (auth.uid() = user_id);
create policy "tailor_runs_insert_own" on public.tailor_runs for insert with check (auth.uid() = user_id);

-- New user profile row
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
