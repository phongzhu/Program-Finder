-- RLS policies for accepted document type mapping tables.
-- This script assumes the two mapping tables already exist.

do $$
begin
  if to_regclass('public.requirement_template_accepted_document_types') is not null then
    execute 'alter table public.requirement_template_accepted_document_types enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'requirement_template_accepted_document_types'
        and policyname = 'requirement_template_accepted_types_staff_read'
    ) then
      create policy requirement_template_accepted_types_staff_read
      on public.requirement_template_accepted_document_types
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.role::text <> 'applicant'
        )
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'requirement_template_accepted_document_types'
        and policyname = 'requirement_template_accepted_types_staff_manage'
    ) then
      create policy requirement_template_accepted_types_staff_manage
      on public.requirement_template_accepted_document_types
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.role::text <> 'applicant'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.role::text <> 'applicant'
        )
      );
    end if;
  end if;

  if to_regclass('public.program_requirement_accepted_document_types') is not null then
    execute 'alter table public.program_requirement_accepted_document_types enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'program_requirement_accepted_document_types'
        and policyname = 'program_requirement_accepted_types_read'
    ) then
      create policy program_requirement_accepted_types_read
      on public.program_requirement_accepted_document_types
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.program_requirements requirement
          join public.programs program
            on program.id = requirement.program_id
          left join public.profiles profile
            on profile.id = auth.uid()
          where requirement.id = program_requirement_accepted_document_types.program_requirement_id
            and (
              profile.role::text <> 'applicant'
              or program.status::text <> 'draft'
            )
        )
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'program_requirement_accepted_document_types'
        and policyname = 'program_requirement_accepted_types_staff_manage'
    ) then
      create policy program_requirement_accepted_types_staff_manage
      on public.program_requirement_accepted_document_types
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.role::text <> 'applicant'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.role::text <> 'applicant'
        )
      );
    end if;
  end if;
end $$;
