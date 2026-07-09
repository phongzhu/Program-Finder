-- Optional backfill: copy accepted document mappings into existing program requirements.
-- Safe to run multiple times.

-- 1) Copy from matching requirement template mappings (by requirement name).
insert into public.program_requirement_accepted_document_types (
  program_requirement_id,
  document_type
)
select
  program_requirements.id,
  template_mapping.document_type
from public.program_requirements
join public.requirement_templates
  on lower(trim(requirement_templates.requirement_name)) = lower(trim(program_requirements.requirement_name))
join public.requirement_template_accepted_document_types template_mapping
  on template_mapping.requirement_template_id = requirement_templates.id
where not exists (
  select 1
  from public.program_requirement_accepted_document_types existing
  where existing.program_requirement_id = program_requirements.id
    and existing.document_type = template_mapping.document_type
);

-- 2) Review requirements that still have no accepted mapping.
-- select
--   program_requirements.id,
--   program_requirements.program_id,
--   program_requirements.requirement_name,
-- from public.program_requirements
-- left join public.program_requirement_accepted_document_types mappings
--   on mappings.program_requirement_id = program_requirements.id
-- where mappings.id is null
-- order by program_requirements.program_id, program_requirements.sort_order;
