-- Allow applicants to read accepted document-type mappings for templates
-- that are used by non-draft program requirements.

do $$
begin
  if to_regclass('public.requirement_template_accepted_document_types') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'requirement_template_accepted_document_types'
        and policyname = 'requirement_template_accepted_types_applicant_read'
    ) then
      create policy requirement_template_accepted_types_applicant_read
      on public.requirement_template_accepted_document_types
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.role::text = 'applicant'
        )
        and exists (
          select 1
          from public.program_requirements requirement
          join public.programs program
            on program.id = requirement.program_id
          where requirement.requirement_template_id = requirement_template_accepted_document_types.requirement_template_id
            and program.status::text <> 'draft'
        )
      );
    end if;
  end if;
end $$;
