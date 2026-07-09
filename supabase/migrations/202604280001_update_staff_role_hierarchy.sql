do $$
begin
  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.user_role_new'::regtype
      and enumlabel = 'provincial_captain'
  ) and not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.user_role_new'::regtype
      and enumlabel = 'system_admin'
  ) then
    alter type public.user_role_new rename value 'provincial_captain' to 'system_admin';
  end if;

  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.user_role_new'::regtype
      and enumlabel = 'provincial_secretary'
  ) and not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.user_role_new'::regtype
      and enumlabel = 'system_secretary'
  ) then
    alter type public.user_role_new rename value 'provincial_secretary' to 'system_secretary';
  end if;
end $$;

alter type public.user_role_new add value if not exists 'municipal_mayor';
alter type public.user_role_new add value if not exists 'municipal_secretary';
