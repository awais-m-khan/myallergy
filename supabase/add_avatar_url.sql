-- Run this in Supabase SQL editor
alter table profiles add column if not exists avatar_url text;

-- Storage policies for avatars bucket
create policy "Users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can update avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
