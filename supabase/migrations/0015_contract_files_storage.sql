-- 0015_contract_files_storage.sql
-- Shartnoma fayllari uchun maxfiy bucket. Fayl yo'li doim
-- "<org_id>/<uuid>.<kengaytma>" — birinchi papka tashkilot id'si,
-- ruxsat shu bo'yicha tekshiriladi. Bucket ochiq emas: fayl faqat
-- qisqa muddatli imzolangan havola orqali ochiladi.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-files', 'contract-files', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.owns_storage_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  folder text := (storage.foldername(object_name))[1];
begin
  if folder is null
     or folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return is_org_owner(folder::uuid);
end;
$fn$;

drop policy if exists contract_files_select on storage.objects;
drop policy if exists contract_files_insert on storage.objects;
drop policy if exists contract_files_update on storage.objects;
drop policy if exists contract_files_delete on storage.objects;

create policy contract_files_select on storage.objects for select to authenticated
  using (bucket_id = 'contract-files' and public.owns_storage_path(name));

create policy contract_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'contract-files' and public.owns_storage_path(name));

create policy contract_files_update on storage.objects for update to authenticated
  using (bucket_id = 'contract-files' and public.owns_storage_path(name))
  with check (bucket_id = 'contract-files' and public.owns_storage_path(name));

create policy contract_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'contract-files' and public.owns_storage_path(name));
