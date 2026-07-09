CREATE TABLE IF NOT EXISTS public.ui_settings (
  id uuid not null default gen_random_uuid (),
  primary_color text not null default '#0f2f56'::text,
  secondary_color text not null default '#d4af37'::text,
  tertiary_color text null default '#f3f4f6'::text,
  primary_text_color text not null default '#111827'::text,
  secondary_text_color text not null default '#374151'::text,
  tertiary_text_color text null default '#6b7280'::text,
  system_name text not null default 'ProgramFinder'::text,
  system_description text null,
  system_tagline text null,
  font_family text not null default 'Arial, Helvetica, sans-serif'::text,
  logo_icon text null,
  logo_url text null,
  updated_by uuid null,
  updated_at timestamp with time zone not null default now(),
  constraint ui_settings_pkey primary key (id),
  constraint ui_settings_updated_by_fkey foreign key (updated_by) references profiles (id) on delete set null
) TABLESPACE pg_default;

-- Ensure set_updated_at() exists and keeps updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to keep updated_at current
DROP TRIGGER IF EXISTS trg_ui_settings_updated_at ON public.ui_settings;
CREATE TRIGGER trg_ui_settings_updated_at
BEFORE UPDATE ON public.ui_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ui_settings (
  primary_color,
  secondary_color,
  tertiary_color,
  primary_text_color,
  secondary_text_color,
  tertiary_text_color,
  system_name,
  font_family
)
SELECT
  '#0f2f56',
  '#d4af37',
  '#f3f4f6',
  '#111827',
  '#374151',
  '#6b7280',
  'ProgramFinder',
  'Arial, Helvetica, sans-serif'
WHERE NOT EXISTS (SELECT 1 FROM public.ui_settings);

