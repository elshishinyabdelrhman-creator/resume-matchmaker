-- Private bucket for resume files. Object key convention: {user_id}/{uuid}-{filename}

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resumes_bucket_select_own"
on storage.objects for select
using (
  bucket_id = 'resumes'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "resumes_bucket_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'resumes'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "resumes_bucket_update_own"
on storage.objects for update
using (
  bucket_id = 'resumes'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "resumes_bucket_delete_own"
on storage.objects for delete
using (
  bucket_id = 'resumes'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
