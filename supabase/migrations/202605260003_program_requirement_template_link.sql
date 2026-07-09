-- Link program requirements to requirement templates.
-- Requirement templates remain the single source of truth for accepted document types.

alter table public.program_requirements
  add column if not exists requirement_template_id uuid;

create index if not exists idx_program_requirements_requirement_template_id
  on public.program_requirements(requirement_template_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'program_requirements_requirement_template_id_fkey'
      and conrelid = 'public.program_requirements'::regclass
  ) then
    alter table public.program_requirements
      add constraint program_requirements_requirement_template_id_fkey
      foreign key (requirement_template_id)
      references public.requirement_templates(id)
      on delete set null;
  end if;
end $$;

-- Backfill: match existing program requirements to templates by requirement name.
with template_name_map as (
  select
    lower(trim(requirement_name)) as normalized_name,
    min(id) as requirement_template_id,
    count(*) as template_count
  from public.requirement_templates
  group by lower(trim(requirement_name))
)
update public.program_requirements as requirement
set requirement_template_id = template_name_map.requirement_template_id
from template_name_map
where requirement.requirement_template_id is null
  and template_name_map.template_count = 1
  and lower(trim(requirement.requirement_name)) = template_name_map.normalized_name;
