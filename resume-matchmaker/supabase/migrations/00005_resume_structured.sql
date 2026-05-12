alter table public.resumes
  add column if not exists structured_data jsonb not null default '{}'::jsonb;

comment on column public.resumes.structured_data is 'Parsed resume sections (JSON).';
