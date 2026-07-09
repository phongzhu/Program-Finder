-- Ensure accepted-document mapping uniqueness and ON DELETE CASCADE foreign keys.
-- Run cleanup migration first if duplicate rows already exist.

do $$
declare
  fk record;
begin
  if to_regclass('public.requirement_template_accepted_document_types') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.requirement_template_accepted_document_types'::regclass
        and contype = 'u'
        and conname = 'requirement_template_accepted_document_types_unique'
    ) then
      alter table public.requirement_template_accepted_document_types
      add constraint requirement_template_accepted_document_types_unique
      unique (requirement_template_id, document_type);
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.requirement_template_accepted_document_types'::regclass
        and contype = 'f'
        and confrelid = 'public.requirement_templates'::regclass
        and confdeltype = 'c'
    ) then
      for fk in
        select conname
        from pg_constraint
        where conrelid = 'public.requirement_template_accepted_document_types'::regclass
          and contype = 'f'
          and confrelid = 'public.requirement_templates'::regclass
      loop
        execute format(
          'alter table public.requirement_template_accepted_document_types drop constraint %I',
          fk.conname
        );
      end loop;

      alter table public.requirement_template_accepted_document_types
      add constraint requirement_template_accepted_document_types_requirement_template_id_fkey
      foreign key (requirement_template_id)
      references public.requirement_templates(id)
      on delete cascade;
    end if;
  end if;

  if to_regclass('public.program_requirement_accepted_document_types') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.program_requirement_accepted_document_types'::regclass
        and contype = 'u'
        and conname = 'program_requirement_accepted_document_types_unique'
    ) then
      alter table public.program_requirement_accepted_document_types
      add constraint program_requirement_accepted_document_types_unique
      unique (program_requirement_id, document_type);
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.program_requirement_accepted_document_types'::regclass
        and contype = 'f'
        and confrelid = 'public.program_requirements'::regclass
        and confdeltype = 'c'
    ) then
      for fk in
        select conname
        from pg_constraint
        where conrelid = 'public.program_requirement_accepted_document_types'::regclass
          and contype = 'f'
          and confrelid = 'public.program_requirements'::regclass
      loop
        execute format(
          'alter table public.program_requirement_accepted_document_types drop constraint %I',
          fk.conname
        );
      end loop;

      alter table public.program_requirement_accepted_document_types
      add constraint program_requirement_accepted_document_types_program_requirement_id_fkey
      foreign key (program_requirement_id)
      references public.program_requirements(id)
      on delete cascade;
    end if;
  end if;
end $$;
