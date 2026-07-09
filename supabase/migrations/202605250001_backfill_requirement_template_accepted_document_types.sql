-- Backfill default accepted document mappings for existing requirement templates.
-- Safe to run multiple times.

with supported_document_types as (
  select unnest(enum_range(null::public.document_type_enum))::text as document_type
),
template_defaults as (
  select * from (values
    ('Valid Government ID', 'passport'),
    ('Valid Government ID', 'driver_license'),
    ('Valid Government ID', 'pwd_id'),
    ('Valid Government ID', 'senior_citizen_id'),
    ('Valid Government ID', 'solo_parent_id'),

    ('Proof of Residency', 'residency_certificate'),
    ('Proof of Residency', 'barangay_certificate'),
    ('Proof of Residency', 'barangay_clearance'),

    ('Barangay Certificate', 'barangay_certificate'),
    ('Barangay Clearance', 'barangay_clearance'),
    ('Certificate of Indigency', 'certificate_of_indigency'),
    ('Birth Certificate', 'birth_certificate'),
    ('School ID', 'school_id'),
    ('Registration Form', 'registration_form'),
    ('PWD ID', 'pwd_id'),
    ('Senior Citizen ID', 'senior_citizen_id'),
    ('Solo Parent ID', 'solo_parent_id'),
    ('Proof of Income', 'proof_of_income'),
    ('Medical Certificate', 'medical_certificate'),
    ('Employment Certificate', 'employment_certificate'),
    ('Farmer Certification', 'farmer_certification'),
    ('Fisherfolk Certification', 'fisherfolk_certification'),
    ('OFW Proof', 'ofw_proof'),
    ('Other Supporting Document', 'other')
  ) as rows(template_name, document_type)
)
insert into public.requirement_template_accepted_document_types (
  requirement_template_id,
  document_type
)
select
  templates.id,
  defaults.document_type::public.document_type_enum
from template_defaults defaults
join supported_document_types supported
  on supported.document_type = defaults.document_type
join public.requirement_templates templates
  on lower(trim(templates.requirement_name)) = lower(trim(defaults.template_name))
where not exists (
  select 1
  from public.requirement_template_accepted_document_types existing
  where existing.requirement_template_id = templates.id
    and existing.document_type::text = defaults.document_type
);

-- Optional verification query after running this script:
-- select requirement_name
-- from public.requirement_templates
-- where lower(trim(requirement_name)) like '%indigenous%';
-- If no rows are returned, "Indigenous Peoples Certification" exists in the Document Vault options
-- but is not yet represented as a requirement template.
