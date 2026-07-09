create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.user_role_new as enum (
  'provincial_captain',
  'provincial_secretary',
  'barangay_captain',
  'barangay_secretary',
  'applicant'
);

create type public.account_status as enum (
  'active',
  'inactive',
  'suspended'
);

create type public.office_level_enum as enum (
  'province',
  'barangay'
);

create type public.program_status_enum as enum (
  'draft',
  'open',
  'closed',
  'completed',
  'cancelled'
);

create type public.application_status_enum as enum (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'waitlisted',
  'completed',
  'cancelled'
);

create type public.sex_type as enum (
  'male',
  'female',
  'prefer_not_to_say'
);

create type public.civil_status_type as enum (
  'single',
  'married',
  'widowed',
  'separated',
  'divorced'
);

create type public.school_type_enum as enum (
  'public',
  'private'
);

create type public.employment_status_type as enum (
  'employed',
  'unemployed',
  'self_employed',
  'student',
  'retired',
  'contractual'
);

create type public.housing_status_enum as enum (
  'owned',
  'rented',
  'shared',
  'informal_settler',
  'others'
);

create type public.relationship_type_enum as enum (
  'father',
  'mother',
  'guardian',
  'spouse',
  'child',
  'sibling',
  'grandparent',
  'other'
);

create type public.document_owner_type_enum as enum (
  'applicant_profile',
  'application',
  'program',
  'office',
  'announcement'
);

create type public.document_verification_status_enum as enum (
  'pending',
  'verified',
  'rejected',
  'expired'
);

create type public.document_type_enum as enum (
  'pwd_id',
  'senior_citizen_id',
  'solo_parent_id',
  'valid_id',
  'barangay_certificate',
  'barangay_clearance',
  'certificate_of_indigency',
  'proof_of_income',
  'school_id',
  'registration_form',
  'birth_certificate',
  'medical_certificate',
  'residency_certificate',
  'employment_certificate',
  'ofw_proof',
  'fisherfolk_certification',
  'farmer_certification',
  'indigenous_peoples_certification',
  'household_certificate',
  'grade_report',
  'transcript_of_records',
  'enrollment_certificate',
  'disbursement_report',
  'liquidation_report',
  'official_receipt',
  'program_attachment',
  'announcement_attachment',
  'other'
);

create table public.ref_municipalities (
  id uuid not null default gen_random_uuid(),
  province_name text not null default 'Bulacan',
  municipality_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ref_municipalities_pkey primary key (id),
  constraint uq_ref_municipalities unique (province_name, municipality_name)
);

create table public.ref_barangays (
  id uuid not null default gen_random_uuid(),
  municipality_id uuid not null,
  barangay_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ref_barangays_pkey primary key (id),
  constraint uq_ref_barangays unique (municipality_id, barangay_name),
  constraint ref_barangays_municipality_id_fkey
    foreign key (municipality_id) references public.ref_municipalities(id) on delete cascade
);

create table public.offices (
  id uuid not null default gen_random_uuid(),
  office_name text not null,
  office_level public.office_level_enum not null,
  parent_office_id uuid null,
  municipality_id uuid null,
  barangay_id uuid null,
  house_number text null,
  street_name text null,
  subdivision_area text null,
  contact_number text null,
  email text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offices_pkey primary key (id),
  constraint offices_parent_office_id_fkey
    foreign key (parent_office_id) references public.offices(id) on delete restrict,
  constraint offices_municipality_id_fkey
    foreign key (municipality_id) references public.ref_municipalities(id) on delete set null,
  constraint offices_barangay_id_fkey
    foreign key (barangay_id) references public.ref_barangays(id) on delete set null
);

create unique index uq_offices_name_level_without_barangay
  on public.offices (office_name, office_level)
  where barangay_id is null;

create unique index uq_offices_name_level_with_barangay
  on public.offices (office_name, office_level, barangay_id)
  where barangay_id is not null;

create index idx_offices_parent_office_id on public.offices(parent_office_id);
create index idx_offices_municipality_id on public.offices(municipality_id);
create index idx_offices_barangay_id on public.offices(barangay_id);

create trigger trg_offices_updated_at
before update on public.offices
for each row
execute function public.set_updated_at();

create table public.profiles (
  id uuid not null,
  office_id uuid null,
  created_by uuid null,
  role public.user_role_new not null,
  email text not null,
  first_name text not null,
  middle_name text null,
  last_name text not null,
  suffix text null,
  mobile_number text null,
  alternate_contact_number text null,
  status public.account_status not null default 'active',
  access_start_date date null,
  access_end_date date null,
  last_login_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade,
  constraint profiles_office_id_fkey foreign key (office_id) references public.offices(id) on delete set null,
  constraint profiles_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_status on public.profiles(status);
create index idx_profiles_office_id on public.profiles(office_id);
create index idx_profiles_created_by on public.profiles(created_by);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table public.user_addresses (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  house_number text null,
  street_name text null,
  subdivision_area text null,
  municipality_id uuid null,
  barangay_id uuid null,
  zip_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_addresses_pkey primary key (id),
  constraint user_addresses_user_id_key unique (user_id),
  constraint user_addresses_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint user_addresses_municipality_id_fkey foreign key (municipality_id) references public.ref_municipalities(id) on delete set null,
  constraint user_addresses_barangay_id_fkey foreign key (barangay_id) references public.ref_barangays(id) on delete set null
);

create index idx_user_addresses_municipality on public.user_addresses(municipality_id);
create index idx_user_addresses_barangay on public.user_addresses(barangay_id);

create trigger trg_user_addresses_updated_at
before update on public.user_addresses
for each row
execute function public.set_updated_at();

create table public.account_creation_logs (
  id uuid not null default gen_random_uuid(),
  created_user_id uuid not null,
  created_by uuid not null,
  creator_role public.user_role_new not null,
  created_user_role public.user_role_new not null,
  office_id uuid null,
  created_at timestamptz not null default now(),
  constraint account_creation_logs_pkey primary key (id),
  constraint account_creation_logs_created_user_id_fkey foreign key (created_user_id) references public.profiles(id) on delete cascade,
  constraint account_creation_logs_created_by_fkey foreign key (created_by) references public.profiles(id) on delete restrict,
  constraint account_creation_logs_office_id_fkey foreign key (office_id) references public.offices(id) on delete set null
);

create index idx_account_creation_logs_created_by on public.account_creation_logs(created_by);
create index idx_account_creation_logs_office_id on public.account_creation_logs(office_id);

create table public.program_categories (
  id uuid not null default gen_random_uuid(),
  category_name text not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint program_categories_pkey primary key (id),
  constraint uq_program_categories unique (category_name)
);

create table public.sectors (
  id uuid not null default gen_random_uuid(),
  sector_name text not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint sectors_pkey primary key (id),
  constraint uq_sectors unique (sector_name)
);

create table public.programs (
  id uuid not null default gen_random_uuid(),
  office_id uuid not null,
  created_by uuid null,
  category_id uuid null,
  title text not null,
  description text null,
  objective text null,
  benefits text null,
  program_type text null,
  status public.program_status_enum not null default 'draft',
  application_start_date date null,
  application_end_date date null,
  slot_count integer not null default 0,
  municipality_id uuid null,
  barangay_id uuid null,
  coverage_notes text null,
  submission_instructions text null,
  additional_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_pkey primary key (id),
  constraint programs_office_id_fkey foreign key (office_id) references public.offices(id) on delete restrict,
  constraint programs_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null,
  constraint programs_category_id_fkey foreign key (category_id) references public.program_categories(id) on delete set null,
  constraint programs_municipality_id_fkey foreign key (municipality_id) references public.ref_municipalities(id) on delete set null,
  constraint programs_barangay_id_fkey foreign key (barangay_id) references public.ref_barangays(id) on delete set null,
  constraint chk_program_slots_nonnegative check (slot_count >= 0),
  constraint chk_program_dates check (
    application_start_date is null
    or application_end_date is null
    or application_start_date <= application_end_date
  )
);

create index idx_programs_office_id on public.programs(office_id);
create index idx_programs_created_by on public.programs(created_by);
create index idx_programs_status on public.programs(status);
create index idx_programs_category_id on public.programs(category_id);
create index idx_programs_barangay_id on public.programs(barangay_id);
create index idx_programs_municipality_id on public.programs(municipality_id);

create trigger trg_programs_updated_at
before update on public.programs
for each row
execute function public.set_updated_at();

create table public.program_sector_tags (
  id uuid not null default gen_random_uuid(),
  program_id uuid not null,
  sector_id uuid not null,
  created_at timestamptz not null default now(),
  constraint program_sector_tags_pkey primary key (id),
  constraint uq_program_sector_tags unique (program_id, sector_id),
  constraint program_sector_tags_program_id_fkey foreign key (program_id) references public.programs(id) on delete cascade,
  constraint program_sector_tags_sector_id_fkey foreign key (sector_id) references public.sectors(id) on delete cascade
);

create index idx_program_sector_tags_sector_id on public.program_sector_tags(sector_id);

create table public.program_requirements (
  id uuid not null default gen_random_uuid(),
  program_id uuid not null,
  requirement_name text not null,
  description text null,
  expected_document_type public.document_type_enum null,
  is_required boolean not null default true,
  allow_multiple_files boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint program_requirements_pkey primary key (id),
  constraint program_requirements_program_id_fkey
    foreign key (program_id) references public.programs(id) on delete cascade
);

create index idx_program_requirements_program on public.program_requirements(program_id);

create table public.program_eligibility_rules (
  program_id uuid not null,
  min_age integer null,
  max_age integer null,
  required_sex public.sex_type null,
  required_civil_status public.civil_status_type null,
  required_citizenship text null,
  required_municipality_id uuid null,
  required_barangay_id uuid null,
  min_personal_income numeric(12,2) null,
  max_personal_income numeric(12,2) null,
  min_household_income numeric(12,2) null,
  max_household_income numeric(12,2) null,
  required_educational_attainment text null,
  requires_student boolean null,
  required_school_type public.school_type_enum null,
  required_educational_level text null,
  required_employment_status public.employment_status_type null,
  required_occupation text null,
  requires_senior_citizen boolean null,
  requires_pwd boolean null,
  requires_solo_parent boolean null,
  requires_farmer boolean null,
  requires_fisherfolk boolean null,
  requires_out_of_school_youth boolean null,
  requires_indigenous_peoples boolean null,
  requires_ofw_family boolean null,
  requires_unemployed boolean null,
  requires_father_income_check boolean not null default false,
  max_father_income numeric(12,2) null,
  requires_mother_income_check boolean not null default false,
  max_mother_income numeric(12,2) null,
  requires_guardian_income_check boolean not null default false,
  max_guardian_income numeric(12,2) null,
  custom_rule_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_eligibility_rules_pkey primary key (program_id),
  constraint program_eligibility_rules_program_id_fkey foreign key (program_id) references public.programs(id) on delete cascade,
  constraint program_eligibility_rules_required_municipality_id_fkey foreign key (required_municipality_id) references public.ref_municipalities(id) on delete set null,
  constraint program_eligibility_rules_required_barangay_id_fkey foreign key (required_barangay_id) references public.ref_barangays(id) on delete set null,
  constraint chk_program_eligibility_age check (
    min_age is null or max_age is null or min_age <= max_age
  ),
  constraint chk_program_eligibility_income_1 check (
    min_personal_income is null or max_personal_income is null or min_personal_income <= max_personal_income
  ),
  constraint chk_program_eligibility_income_2 check (
    min_household_income is null or max_household_income is null or min_household_income <= max_household_income
  )
);

create trigger trg_program_eligibility_rules_updated_at
before update on public.program_eligibility_rules
for each row
execute function public.set_updated_at();

create table public.applicant_profiles (
  user_id uuid not null,
  birthdate date null,
  sex public.sex_type null,
  civil_status public.civil_status_type null,
  citizenship text null default 'Filipino',
  employment_status public.employment_status_type null,
  occupation text null,
  employer_name text null,
  monthly_personal_income numeric(12,2) null,
  educational_attainment text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_profiles_pkey primary key (user_id),
  constraint applicant_profiles_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);

create index idx_applicant_profiles_employment_status on public.applicant_profiles(employment_status);

create trigger trg_applicant_profiles_updated_at
before update on public.applicant_profiles
for each row
execute function public.set_updated_at();

create table public.applicant_household_info (
  applicant_user_id uuid not null,
  total_household_monthly_income numeric(12,2) null,
  household_member_count integer null,
  dependent_count integer null,
  housing_status public.housing_status_enum null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_household_info_pkey primary key (applicant_user_id),
  constraint applicant_household_info_applicant_user_id_fkey foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade
);

create trigger trg_applicant_household_info_updated_at
before update on public.applicant_household_info
for each row
execute function public.set_updated_at();

create table public.applicant_student_info (
  applicant_user_id uuid not null,
  is_student boolean not null default false,
  school_name text null,
  school_type public.school_type_enum null,
  educational_level text null,
  course_program text null,
  year_or_grade_level text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_student_info_pkey primary key (applicant_user_id),
  constraint applicant_student_info_applicant_user_id_fkey foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade
);

create trigger trg_applicant_student_info_updated_at
before update on public.applicant_student_info
for each row
execute function public.set_updated_at();

create table public.applicant_special_categories (
  applicant_user_id uuid not null,
  is_senior_citizen boolean not null default false,
  is_pwd boolean not null default false,
  disability_type text null,
  is_solo_parent boolean not null default false,
  is_out_of_school_youth boolean not null default false,
  is_farmer boolean not null default false,
  is_fisherfolk boolean not null default false,
  is_indigenous_peoples boolean not null default false,
  is_ofw_family boolean not null default false,
  is_unemployed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_special_categories_pkey primary key (applicant_user_id),
  constraint applicant_special_categories_applicant_user_id_fkey foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade
);

create trigger trg_applicant_special_categories_updated_at
before update on public.applicant_special_categories
for each row
execute function public.set_updated_at();

create table public.applicant_family_members (
  id uuid not null default gen_random_uuid(),
  applicant_user_id uuid not null,
  relationship_type public.relationship_type_enum not null,
  first_name text null,
  middle_name text null,
  last_name text null,
  suffix text null,
  relationship_label text null,
  occupation text null,
  employer_name text null,
  monthly_income numeric(12,2) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_family_members_pkey primary key (id),
  constraint applicant_family_members_applicant_user_id_fkey foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade
);

create index idx_applicant_family_members_applicant_user_id on public.applicant_family_members(applicant_user_id);

create trigger trg_applicant_family_members_updated_at
before update on public.applicant_family_members
for each row
execute function public.set_updated_at();

create table public.applicant_sector_tags (
  id uuid not null default gen_random_uuid(),
  applicant_user_id uuid not null,
  sector_id uuid not null,
  created_at timestamptz not null default now(),
  constraint applicant_sector_tags_pkey primary key (id),
  constraint uq_applicant_sector_tags unique (applicant_user_id, sector_id),
  constraint applicant_sector_tags_applicant_user_id_fkey foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade,
  constraint applicant_sector_tags_sector_id_fkey foreign key (sector_id) references public.sectors(id) on delete cascade
);

create index idx_applicant_sector_tags_sector_id on public.applicant_sector_tags(sector_id);

create table public.document_files (
  id uuid not null default gen_random_uuid(),
  owner_type public.document_owner_type_enum not null,
  document_type public.document_type_enum not null,
  original_file_name text not null,
  stored_file_name text null,
  file_url text not null,
  file_path text not null,
  file_mime_type text null,
  file_extension text null,
  file_size_bytes bigint null,
  uploaded_by uuid null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_files_pkey primary key (id),
  constraint document_files_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles(id) on delete set null
);

create index idx_document_files_owner_type on public.document_files(owner_type);
create index idx_document_files_document_type on public.document_files(document_type);
create index idx_document_files_uploaded_by on public.document_files(uploaded_by);

create trigger trg_document_files_updated_at
before update on public.document_files
for each row
execute function public.set_updated_at();

create table public.applicant_profile_documents (
  id uuid not null default gen_random_uuid(),
  applicant_user_id uuid not null,
  document_file_id uuid not null,
  document_number text null,
  issued_date date null,
  expiry_date date null,
  verification_status public.document_verification_status_enum not null default 'pending',
  verified_by uuid null,
  verified_at timestamptz null,
  rejection_reason text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applicant_profile_documents_pkey primary key (id),
  constraint uq_applicant_profile_documents unique (applicant_user_id, document_file_id),
  constraint applicant_profile_documents_applicant_user_id_fkey
    foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade,
  constraint applicant_profile_documents_document_file_id_fkey
    foreign key (document_file_id) references public.document_files(id) on delete cascade,
  constraint applicant_profile_documents_verified_by_fkey
    foreign key (verified_by) references public.profiles(id) on delete set null
);

create index idx_applicant_profile_documents_applicant on public.applicant_profile_documents(applicant_user_id);
create index idx_applicant_profile_documents_status on public.applicant_profile_documents(verification_status);

create trigger trg_applicant_profile_documents_updated_at
before update on public.applicant_profile_documents
for each row
execute function public.set_updated_at();

create table public.applications (
  id uuid not null default gen_random_uuid(),
  applicant_user_id uuid not null,
  program_id uuid not null,
  office_id uuid not null,
  application_status public.application_status_enum not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_by uuid null,
  reviewed_at timestamptz null,
  remarks text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_pkey primary key (id),
  constraint uq_applications_applicant_program unique (applicant_user_id, program_id),
  constraint applications_applicant_user_id_fkey foreign key (applicant_user_id) references public.profiles(id) on delete cascade,
  constraint applications_program_id_fkey foreign key (program_id) references public.programs(id) on delete cascade,
  constraint applications_office_id_fkey foreign key (office_id) references public.offices(id) on delete restrict,
  constraint applications_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id) on delete set null
);

create index idx_applications_program_id on public.applications(program_id);
create index idx_applications_applicant_user_id on public.applications(applicant_user_id);
create index idx_applications_status on public.applications(application_status);

create trigger trg_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

create table public.application_documents (
  id uuid not null default gen_random_uuid(),
  application_id uuid not null,
  applicant_user_id uuid not null,
  program_requirement_id uuid null,
  document_file_id uuid not null,
  document_number text null,
  submitted_by uuid null,
  submission_status public.document_verification_status_enum not null default 'pending',
  reviewed_by uuid null,
  reviewed_at timestamptz null,
  rejection_reason text null,
  remarks text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_documents_pkey primary key (id),
  constraint application_documents_application_id_fkey
    foreign key (application_id) references public.applications(id) on delete cascade,
  constraint application_documents_applicant_user_id_fkey
    foreign key (applicant_user_id) references public.applicant_profiles(user_id) on delete cascade,
  constraint application_documents_program_requirement_id_fkey
    foreign key (program_requirement_id) references public.program_requirements(id) on delete set null,
  constraint application_documents_document_file_id_fkey
    foreign key (document_file_id) references public.document_files(id) on delete cascade,
  constraint application_documents_submitted_by_fkey
    foreign key (submitted_by) references public.profiles(id) on delete set null,
  constraint application_documents_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles(id) on delete set null
);

create index idx_application_documents_application on public.application_documents(application_id);
create index idx_application_documents_requirement on public.application_documents(program_requirement_id);
create index idx_application_documents_status on public.application_documents(submission_status);

create trigger trg_application_documents_updated_at
before update on public.application_documents
for each row
execute function public.set_updated_at();

create table public.application_status_history (
  id uuid not null default gen_random_uuid(),
  application_id uuid not null,
  old_status public.application_status_enum null,
  new_status public.application_status_enum not null,
  changed_by uuid null,
  change_reason text null,
  created_at timestamptz not null default now(),
  constraint application_status_history_pkey primary key (id),
  constraint application_status_history_application_id_fkey foreign key (application_id) references public.applications(id) on delete cascade,
  constraint application_status_history_changed_by_fkey foreign key (changed_by) references public.profiles(id) on delete set null
);

create index idx_application_status_history_application_id on public.application_status_history(application_id);

create table public.bookmarks (
  id uuid not null default gen_random_uuid(),
  applicant_user_id uuid not null,
  program_id uuid not null,
  created_at timestamptz not null default now(),
  constraint bookmarks_pkey primary key (id),
  constraint uq_bookmarks unique (applicant_user_id, program_id),
  constraint bookmarks_applicant_user_id_fkey foreign key (applicant_user_id) references public.profiles(id) on delete cascade,
  constraint bookmarks_program_id_fkey foreign key (program_id) references public.programs(id) on delete cascade
);

create index idx_bookmarks_program_id on public.bookmarks(program_id);

create table public.program_documents (
  id uuid not null default gen_random_uuid(),
  program_id uuid not null,
  document_file_id uuid not null,
  uploaded_by uuid null,
  remarks text null,
  created_at timestamptz not null default now(),
  constraint program_documents_pkey primary key (id),
  constraint program_documents_program_id_fkey
    foreign key (program_id) references public.programs(id) on delete cascade,
  constraint program_documents_document_file_id_fkey
    foreign key (document_file_id) references public.document_files(id) on delete cascade,
  constraint program_documents_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles(id) on delete set null
);

create index idx_program_documents_program on public.program_documents(program_id);

create table public.office_documents (
  id uuid not null default gen_random_uuid(),
  office_id uuid not null,
  document_file_id uuid not null,
  uploaded_by uuid null,
  remarks text null,
  created_at timestamptz not null default now(),
  constraint office_documents_pkey primary key (id),
  constraint office_documents_office_id_fkey
    foreign key (office_id) references public.offices(id) on delete cascade,
  constraint office_documents_document_file_id_fkey
    foreign key (document_file_id) references public.document_files(id) on delete cascade,
  constraint office_documents_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles(id) on delete set null
);

create index idx_office_documents_office on public.office_documents(office_id);

create table public.announcements (
  id uuid not null default gen_random_uuid(),
  office_id uuid null,
  program_id uuid null,
  posted_by uuid null,
  title text not null,
  content text not null,
  announcement_type text null,
  target_role public.user_role_new null,
  is_published boolean not null default true,
  posted_at timestamptz not null default now(),
  expires_at timestamptz null,
  constraint announcements_pkey primary key (id),
  constraint announcements_office_id_fkey foreign key (office_id) references public.offices(id) on delete set null,
  constraint announcements_program_id_fkey foreign key (program_id) references public.programs(id) on delete cascade,
  constraint announcements_posted_by_fkey foreign key (posted_by) references public.profiles(id) on delete set null
);

create index idx_announcements_office_id on public.announcements(office_id);
create index idx_announcements_program_id on public.announcements(program_id);
create index idx_announcements_posted_at on public.announcements(posted_at);

create table public.announcement_documents (
  id uuid not null default gen_random_uuid(),
  announcement_id uuid not null,
  document_file_id uuid not null,
  uploaded_by uuid null,
  created_at timestamptz not null default now(),
  constraint announcement_documents_pkey primary key (id),
  constraint announcement_documents_announcement_id_fkey
    foreign key (announcement_id) references public.announcements(id) on delete cascade,
  constraint announcement_documents_document_file_id_fkey
    foreign key (document_file_id) references public.document_files(id) on delete cascade,
  constraint announcement_documents_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles(id) on delete set null
);

create index idx_announcement_documents_announcement_id on public.announcement_documents(announcement_id);

create table public.audit_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  office_id uuid null,
  user_role public.user_role_new null,
  action_performed text not null,
  target_table text null,
  target_record_id text null,
  remarks text null,
  ip_address inet null,
  created_at timestamptz not null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null,
  constraint audit_logs_office_id_fkey foreign key (office_id) references public.offices(id) on delete set null
);

create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_office_id on public.audit_logs(office_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at);
