-- Optional cleanup script: remove duplicate accepted-document mappings before adding unique constraints.
-- Safe to run manually before 202605260001_accepted_document_type_constraints_and_cascade.sql.

with template_dupes as (
  select
    id,
    row_number() over (
      partition by requirement_template_id, document_type
      order by created_at asc nulls last, id asc
    ) as row_num
  from public.requirement_template_accepted_document_types
)
delete from public.requirement_template_accepted_document_types target
using template_dupes dupes
where target.id = dupes.id
  and dupes.row_num > 1;

with program_dupes as (
  select
    id,
    row_number() over (
      partition by program_requirement_id, document_type
      order by created_at asc nulls last, id asc
    ) as row_num
  from public.program_requirement_accepted_document_types
)
delete from public.program_requirement_accepted_document_types target
using program_dupes dupes
where target.id = dupes.id
  and dupes.row_num > 1;
