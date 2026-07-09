-- Ensure personnel recipients also receive application decision notifications.
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
  decision_actor_id uuid := coalesce(new.reviewed_by, auth.uid());
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
        decision_actor_id,
        'application_approved',
        'Application Approved',
        format('Your application for %s has been approved. Please wait for further instructions from the office.', program_title),
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
      decision_actor_id as actor_user_id,
      'application_approved' as notification_type,
      'Application Approved' as title,
      format('An application for %s was approved.', program_title) as message,
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
          and existing.notification_type = 'application_approved'
          and existing.related_table = 'applications'
          and existing.related_record_id = new.id
      );
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
        decision_actor_id,
        'application_rejected',
        'Application Not Approved',
        format('Your application for %s was not approved. Please review the office remarks for more information.', program_title),
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
      decision_actor_id as actor_user_id,
      'application_rejected' as notification_type,
      'Application Rejected' as title,
      format('An application for %s was rejected.', program_title) as message,
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
          and existing.notification_type = 'application_rejected'
          and existing.related_table = 'applications'
          and existing.related_record_id = new.id
      );
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
        decision_actor_id,
        'application_requires_action',
        'Application Requires Action',
        format('Corrected documents or additional information are required for your application to %s.', program_title),
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
      decision_actor_id as actor_user_id,
      'application_requires_action' as notification_type,
      'Application Needs Correction' as title,
      format('An application for %s was returned for correction.', program_title) as message,
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
          and existing.notification_type = 'application_requires_action'
          and existing.related_table = 'applications'
          and existing.related_record_id = new.id
      );
  end if;

  return new;
end;
$$;

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
  coalesce(app.reviewed_by, app.applicant_user_id) as actor_user_id,
  case lower(coalesce(app.application_status::text, ''))
    when 'approved' then 'application_approved'
    when 'rejected' then 'application_rejected'
    when 'needs_correction' then 'application_requires_action'
  end as notification_type,
  case lower(coalesce(app.application_status::text, ''))
    when 'approved' then 'Application Approved'
    when 'rejected' then 'Application Rejected'
    when 'needs_correction' then 'Application Needs Correction'
  end as title,
  case lower(coalesce(app.application_status::text, ''))
    when 'approved' then format('An application for %s was approved.', coalesce(p.title, 'Program'))
    when 'rejected' then format('An application for %s was rejected.', coalesce(p.title, 'Program'))
    when 'needs_correction' then format('An application for %s was returned for correction.', coalesce(p.title, 'Program'))
  end as message,
  'applications' as related_table,
  app.id as related_record_id,
  '/personnel/application-management' as action_route
from public.applications app
left join public.programs p
  on p.id = app.program_id
join public.profiles staff
  on staff.role::text <> 'applicant'
 and coalesce(staff.status::text, 'active') = 'active'
 and (
   app.office_id is null
   or staff.office_id = app.office_id
 )
where lower(coalesce(app.application_status::text, '')) in ('approved', 'rejected', 'needs_correction')
  and not exists (
    select 1
    from public.notifications existing
    where existing.recipient_user_id = staff.id
      and existing.notification_type = case lower(coalesce(app.application_status::text, ''))
        when 'approved' then 'application_approved'
        when 'rejected' then 'application_rejected'
        when 'needs_correction' then 'application_requires_action'
      end
      and existing.related_table = 'applications'
      and existing.related_record_id = app.id
  );
