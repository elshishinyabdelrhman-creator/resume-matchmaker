-- Optional columns aligned with optimize flow (strengths/improvements also in tailor_runs.suggestions).

alter table public.applications
  add column if not exists strengths jsonb not null default '[]'::jsonb;

alter table public.applications
  add column if not exists improvements jsonb not null default '[]'::jsonb;

alter table public.applications
  add column if not exists applied_date date;

comment on column public.applications.strengths is 'AI summary: resume strengths vs JD (JSON array of strings).';
comment on column public.applications.improvements is 'AI summary: improvement suggestions (JSON array of strings).';
comment on column public.applications.applied_date is 'When the candidate applied (optional).';
