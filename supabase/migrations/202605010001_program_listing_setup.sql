alter type public.office_level_enum add value if not exists 'municipal';
alter type public.office_level_enum add value if not exists 'municipality';
alter type public.office_level_enum add value if not exists 'provincial';

do $$
begin
  create type public.program_type_enum as enum (
    'provincial_assistance',
    'municipal_assistance',
    'barangay_assistance',
    'livelihood',
    'education',
    'health',
    'disaster_relief',
    'social_welfare',
    'community_development',
    'special_project'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.programs
add column if not exists cover_image_url text,
add column if not exists cover_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'program-images',
  'program-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'program-internal-documents',
  'program-internal-documents',
  true,
  52428800,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.program_documents
add column if not exists document_type text null;

create index if not exists idx_program_sector_tags_program on public.program_sector_tags using btree (program_id);

create table if not exists public.requirement_templates (
  id uuid not null default gen_random_uuid(),
  requirement_name text not null,
  description text null,
  expected_document_type public.document_type_enum null,
  is_required boolean not null default true,
  allow_multiple_files boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint requirement_templates_pkey primary key (id),
  constraint uq_requirement_templates unique (requirement_name)
);

create table if not exists public.program_requirement_sources (
  id uuid not null default gen_random_uuid(),
  requirement_id uuid not null,
  source_office_id uuid null,
  source_name text null,
  source_type text not null default 'office',
  instructions text null,
  estimated_processing_time text null,
  fee_amount numeric(12, 2) null,
  is_required_source boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint program_requirement_sources_pkey primary key (id),
  constraint program_requirement_sources_requirement_id_fkey
    foreign key (requirement_id) references public.program_requirements(id) on delete cascade,
  constraint program_requirement_sources_source_office_id_fkey
    foreign key (source_office_id) references public.offices(id) on delete set null
);

create index if not exists idx_program_requirement_sources_requirement
  on public.program_requirement_sources using btree (requirement_id);

create index if not exists idx_program_requirement_sources_source_office
  on public.program_requirement_sources using btree (source_office_id);
