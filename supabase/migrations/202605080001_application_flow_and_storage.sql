alter type public.application_status_enum add value if not exists 'draft';
alter type public.application_status_enum add value if not exists 'needs_correction';
alter type public.application_status_enum add value if not exists 'claimed';

alter table public.applications
alter column submitted_at drop not null,
alter column submitted_at drop default;

alter table public.program_requirements
alter column is_required set default true;

update public.program_requirements
set is_required = true
where is_required is distinct from true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'programfinder-logos',
  'programfinder-logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-profile-documents',
  'applicant-profile-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public_asset_buckets_read'
  ) then
    create policy public_asset_buckets_read
    on storage.objects for select
    to public
    using (bucket_id in ('program-images', 'programfinder-logos'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'staff_managed_asset_buckets_write'
  ) then
    create policy staff_managed_asset_buckets_write
    on storage.objects for all
    to authenticated
    using (
      bucket_id in ('program-images', 'program-internal-documents', 'programfinder-logos')
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text <> 'applicant'
      )
    )
    with check (
      bucket_id in ('program-images', 'program-internal-documents', 'programfinder-logos')
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text <> 'applicant'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'staff_internal_program_documents_read'
  ) then
    create policy staff_internal_program_documents_read
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'program-internal-documents'
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text <> 'applicant'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'application_documents_applicant_read_own'
  ) then
    create policy application_documents_applicant_read_own
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'application-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'application_documents_applicant_insert_own'
  ) then
    create policy application_documents_applicant_insert_own
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'application-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'application_documents_applicant_update_own'
  ) then
    create policy application_documents_applicant_update_own
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'application-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'application-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'application_documents_staff_read'
  ) then
    create policy application_documents_staff_read
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'application-documents'
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text <> 'applicant'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'applicant_profile_documents_applicant_crud_own'
  ) then
    create policy applicant_profile_documents_applicant_crud_own
    on storage.objects for all
    to authenticated
    using (
      bucket_id = 'applicant-profile-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'applicant-profile-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'applicant_profile_documents_staff_read'
  ) then
    create policy applicant_profile_documents_staff_read
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'applicant-profile-documents'
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text <> 'applicant'
      )
    );
  end if;
end $$;
