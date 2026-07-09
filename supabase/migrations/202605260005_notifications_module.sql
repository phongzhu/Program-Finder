-- In-app notifications module for applicant/personnel workflows.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null,
  actor_user_id uuid null,
  notification_type text not null,
  title text not null,
  message text not null,
  related_table text null,
  related_record_id uuid null,
  action_route text null,
  is_read boolean not null default false,
  read_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),

  constraint notifications_recipient_user_id_fkey
    foreign key (recipient_user_id)
    references public.profiles(id)
    on delete cascade,

  constraint notifications_actor_user_id_fkey
    foreign key (actor_user_id)
    references public.profiles(id)
    on delete set null
);

create index if not exists idx_notifications_recipient_created
  on public.notifications(recipient_user_id, created_at desc);

create index if not exists idx_notifications_recipient_unread
  on public.notifications(recipient_user_id, is_read)
  where is_read = false;

alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) then
    create policy notifications_select_own
    on public.notifications
    for select
    to authenticated
    using (recipient_user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_update_own_read_state'
  ) then
    create policy notifications_update_own_read_state
    on public.notifications
    for update
    to authenticated
    using (recipient_user_id = auth.uid())
    with check (recipient_user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_insert_authenticated_actor'
  ) then
    create policy notifications_insert_authenticated_actor
    on public.notifications
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and (actor_user_id is null or actor_user_id = auth.uid())
    );
  end if;
end $$;

create or replace function public.pf_document_type_label(doc_type text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text := lower(coalesce(doc_type, ''));
begin
  return case normalized
    when 'valid_id' then 'Valid Government ID'
    when 'driver_license' then 'Driver''s License'
    when 'passport' then 'Passport'
    when 'pwd_id' then 'PWD ID'
    when 'senior_citizen_id' then 'Senior Citizen ID'
    when 'solo_parent_id' then 'Solo Parent ID'
    when 'barangay_certificate' then 'Barangay Certificate'
    when 'barangay_clearance' then 'Barangay Clearance'
    when 'certificate_of_indigency' then 'Certificate of Indigency'
    when 'proof_of_income' then 'Proof of Income'
    when 'school_id' then 'School ID'
    when 'registration_form' then 'Registration Form'
    when 'birth_certificate' then 'Birth Certificate'
    when 'medical_certificate' then 'Medical Certificate'
    when 'residency_certificate' then 'Residency Certificate'
    when 'employment_certificate' then 'Employment Certificate'
    when 'ofw_proof' then 'OFW Proof'
    when 'fisherfolk_certification' then 'Fisherfolk Certification'
    when 'farmer_certification' then 'Farmer Certification'
    when 'indigenous_peoples_certification' then 'Indigenous Peoples Certification'
    when 'other' then 'Other Supporting Document'
    else initcap(replace(coalesce(doc_type, ''), '_', ' '))
  end;
end;
$$;

create or replace function public.pf_notifications_guard_update()
returns trigger
language plpgsql
as $$
begin
  if new.recipient_user_id is distinct from old.recipient_user_id
    or new.actor_user_id is distinct from old.actor_user_id
    or new.notification_type is distinct from old.notification_type
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.related_table is distinct from old.related_table
    or new.related_record_id is distinct from old.related_record_id
    or new.action_route is distinct from old.action_route
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only notification read state can be updated.';
  end if;

  if old.is_read = false and new.is_read = true and new.read_at is null then
    new.read_at := now();
  end if;

  if new.is_read = false then
    new.read_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notifications_guard_update on public.notifications;
create trigger trg_notifications_guard_update
before update on public.notifications
for each row
execute function public.pf_notifications_guard_update();

create or replace function public.pf_notify_document_vault_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text := lower(coalesce(new.verification_status::text, ''));
  prev_status text := lower(coalesce(old.verification_status::text, ''));
  doc_type_raw text := '';
  doc_type_label text := 'Document';
  applicant_office_id uuid := null;
begin
  select df.document_type::text
  into doc_type_raw
  from public.document_files df
  where df.id = new.document_file_id;

  doc_type_label := public.pf_document_type_label(doc_type_raw);

  if tg_op = 'INSERT' and next_status = 'pending' then
    if not exists (
      select 1
      from public.notifications n
      where n.recipient_user_id = new.applicant_user_id
        and n.notification_type = 'document_uploaded'
        and n.related_table = 'applicant_profile_documents'
        and n.related_record_id = new.id
    ) then
      insert into public.notifications (
        recipient_user_id,
        actor_user_id,
        notification_type,
        title,
        message,
        related_table,
        related_record_id,
        action_route
      )
      values (
        new.applicant_user_id,
        new.applicant_user_id,
        'document_uploaded',
        'Document Uploaded Successfully',
        format('Your %s has been uploaded to your Document Vault and is now pending verification.', doc_type_label),
        'applicant_profile_documents',
        new.id,
        '/applicant/profile-management'
      );
    end if;

    select p.office_id
    into applicant_office_id
    from public.profiles p
    where p.id = new.applicant_user_id;

    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      notification_type,
      title,
      message,
      related_table,
      related_record_id,
      action_route
    )
    select
      staff.id as recipient_user_id,
      new.applicant_user_id as actor_user_id,
      'new_document_for_verification' as notification_type,
      'New Document for Verification' as title,
      format('An applicant uploaded a %s document that requires verification.', doc_type_label) as message,
      'applicant_profile_documents' as related_table,
      new.id as related_record_id,
      '/personnel/applicant-records' as action_route
    from public.profiles staff
    where staff.role::text <> 'applicant'
      and coalesce(staff.status::text, 'active') = 'active'
      and (
        applicant_office_id is null
        or staff.office_id = applicant_office_id
      )
      and not exists (
        select 1
        from public.notifications existing
        where existing.recipient_user_id = staff.id
          and existing.notification_type = 'new_document_for_verification'
          and existing.related_table = 'applicant_profile_documents'
          and existing.related_record_id = new.id
      );
  end if;

  if tg_op = 'UPDATE'
    and prev_status is distinct from next_status
    and next_status in ('verified', 'rejected')
  then
    if not exists (
      select 1
      from public.notifications n
      where n.recipient_user_id = new.applicant_user_id
        and n.notification_type = case
          when next_status = 'verified' then 'document_verified'
          else 'document_rejected'
        end
        and n.related_table = 'applicant_profile_documents'
        and n.related_record_id = new.id
    ) then
      insert into public.notifications (
        recipient_user_id,
        actor_user_id,
        notification_type,
        title,
        message,
        related_table,
        related_record_id,
        action_route
      )
      values (
        new.applicant_user_id,
        coalesce(new.verified_by, auth.uid()),
        case
          when next_status = 'verified' then 'document_verified'
          else 'document_rejected'
        end,
        case
          when next_status = 'verified' then 'Document Verified'
          else 'Document Rejected'
        end,
        case
          when next_status = 'verified' then format('Your %s has been verified and can now be used for eligible program applications.', doc_type_label)
          else format('Your %s could not be verified. Please review the reason and upload a corrected document.', doc_type_label)
        end,
        'applicant_profile_documents',
        new.id,
        '/applicant/profile-management'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_document_vault_events on public.applicant_profile_documents;
create trigger trg_notify_document_vault_events
after insert or update of verification_status on public.applicant_profile_documents
for each row
execute function public.pf_notify_document_vault_events();

create or replace function public.pf_notify_application_status_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text := lower(coalesce(new.application_status::text, ''));
  prev_status text := lower(coalesce(old.application_status::text, ''));
  program_title text := 'Program';
begin
  if prev_status is not distinct from next_status then
    return new;
  end if;

  select coalesce(p.title, 'Program')
  into program_title
  from public.programs p
  where p.id = new.program_id;

  if next_status = 'pending' then
    if not exists (
      select 1
      from public.notifications n
      where n.recipient_user_id = new.applicant_user_id
        and n.notification_type = 'application_submitted'
        and n.related_table = 'applications'
        and n.related_record_id = new.id
    ) then
      insert into public.notifications (
        recipient_user_id,
        actor_user_id,
        notification_type,
        title,
        message,
        related_table,
        related_record_id,
        action_route
      )
      values (
        new.applicant_user_id,
        new.applicant_user_id,
        'application_submitted',
        'Application Submitted',
        format('Your application for %s has been submitted successfully.', program_title),
        'applications',
        new.id,
        '/applicant/manage-applications'
      );
    end if;

    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      notification_type,
      title,
      message,
      related_table,
      related_record_id,
      action_route
    )
    select
      staff.id as recipient_user_id,
      new.applicant_user_id as actor_user_id,
      'new_application_for_review' as notification_type,
      'New Application Submitted' as title,
      format('A new application has been submitted for %s.', program_title) as message,
      'applications' as related_table,
      new.id as related_record_id,
      '/personnel/application-management' as action_route
    from public.profiles staff
    where staff.role::text <> 'applicant'
      and coalesce(staff.status::text, 'active') = 'active'
      and (
        new.office_id is null
        or staff.office_id = new.office_id
      )
      and not exists (
        select 1
        from public.notifications existing
        where existing.recipient_user_id = staff.id
          and existing.notification_type = 'new_application_for_review'
          and existing.related_table = 'applications'
          and existing.related_record_id = new.id
      );
  elsif next_status = 'approved' then
    if not exists (
      select 1
      from public.notifications n
      where n.recipient_user_id = new.applicant_user_id
        and n.notification_type = 'application_approved'
        and n.related_table = 'applications'
        and n.related_record_id = new.id
    ) then
      insert into public.notifications (
        recipient_user_id,
        actor_user_id,
        notification_type,
        title,
        message,
        related_table,
        related_record_id,
        action_route
      )
      values (
        new.applicant_user_id,
        coalesce(new.reviewed_by, auth.uid()),
        'application_approved',
        'Application Approved',
        format('Your application for %s has been approved. Please wait for further instructions from the office.', program_title),
        'applications',
        new.id,
        '/applicant/manage-applications'
      );
    end if;
  elsif next_status = 'rejected' then
    if not exists (
      select 1
      from public.notifications n
      where n.recipient_user_id = new.applicant_user_id
        and n.notification_type = 'application_rejected'
        and n.related_table = 'applications'
        and n.related_record_id = new.id
    ) then
      insert into public.notifications (
        recipient_user_id,
        actor_user_id,
        notification_type,
        title,
        message,
        related_table,
        related_record_id,
        action_route
      )
      values (
        new.applicant_user_id,
        coalesce(new.reviewed_by, auth.uid()),
        'application_rejected',
        'Application Not Approved',
        format('Your application for %s was not approved. Please review the office remarks for more information.', program_title),
        'applications',
        new.id,
        '/applicant/manage-applications'
      );
    end if;
  elsif next_status = 'needs_correction' then
    if not exists (
      select 1
      from public.notifications n
      where n.recipient_user_id = new.applicant_user_id
        and n.notification_type = 'application_requires_action'
        and n.related_table = 'applications'
        and n.related_record_id = new.id
    ) then
      insert into public.notifications (
        recipient_user_id,
        actor_user_id,
        notification_type,
        title,
        message,
        related_table,
        related_record_id,
        action_route
      )
      values (
        new.applicant_user_id,
        coalesce(new.reviewed_by, auth.uid()),
        'application_requires_action',
        'Application Requires Action',
        format('Corrected documents or additional information are required for your application to %s.', program_title),
        'applications',
        new.id,
        '/applicant/manage-applications'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_application_status_events on public.applications;
create trigger trg_notify_application_status_events
after update of application_status on public.applications
for each row
execute function public.pf_notify_application_status_events();
