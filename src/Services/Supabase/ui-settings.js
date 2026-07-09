import { isSupabaseConfigured, supabase } from './client';

const UI_SETTINGS_TABLE = 'ui_settings';
export const UI_LOGO_BUCKET = 'programfinder-logos';

export const DEFAULT_UI_BRANDING = {
  id: null,
  primaryColor: '#0f2f56',
  secondaryColor: '#d4af37',
  tertiaryColor: '#f3f4f6',
  primaryTextColor: '#111827',
  secondaryTextColor: '#374151',
  tertiaryTextColor: '#6b7280',
  systemName: 'ProgramFinder',
  systemDescription: '',
  systemTagline: '',
  fontFamily: 'Arial, Helvetica, sans-serif',
  logoIcon: '',
  logoUrl: '',
  updatedBy: null,
  updatedAt: '',
};

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function formatSupabaseError(error, fallback) {
  if (!error) {
    return fallback;
  }

  return error.message || fallback;
}

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }
}

function sanitizeHexColor(value, fallback) {
  const normalized = normalizeText(value);
  return /^#([0-9a-fA-F]{6})$/.test(normalized) ? normalized : fallback;
}

function mapUiSettingsRow(row = null) {
  if (!row) {
    return { ...DEFAULT_UI_BRANDING };
  }

  return {
    id: row.id || null,
    primaryColor: row.primary_color || DEFAULT_UI_BRANDING.primaryColor,
    secondaryColor: row.secondary_color || DEFAULT_UI_BRANDING.secondaryColor,
    tertiaryColor: row.tertiary_color || DEFAULT_UI_BRANDING.tertiaryColor,
    primaryTextColor: row.primary_text_color || DEFAULT_UI_BRANDING.primaryTextColor,
    secondaryTextColor: row.secondary_text_color || DEFAULT_UI_BRANDING.secondaryTextColor,
    tertiaryTextColor: row.tertiary_text_color || DEFAULT_UI_BRANDING.tertiaryTextColor,
    systemName: row.system_name || DEFAULT_UI_BRANDING.systemName,
    systemDescription: row.system_description || '',
    systemTagline: row.system_tagline || '',
    fontFamily: row.font_family || DEFAULT_UI_BRANDING.fontFamily,
    logoIcon: row.logo_icon || '',
    logoUrl: row.logo_url || '',
    updatedBy: row.updated_by || null,
    updatedAt: row.updated_at || '',
  };
}

function mapUiSettingsPayload(payload = {}) {
  return {
    id: payload.id || undefined,
    primary_color: sanitizeHexColor(payload.primaryColor, DEFAULT_UI_BRANDING.primaryColor),
    secondary_color: sanitizeHexColor(payload.secondaryColor, DEFAULT_UI_BRANDING.secondaryColor),
    tertiary_color: sanitizeHexColor(payload.tertiaryColor, DEFAULT_UI_BRANDING.tertiaryColor),
    primary_text_color: sanitizeHexColor(payload.primaryTextColor, DEFAULT_UI_BRANDING.primaryTextColor),
    secondary_text_color: sanitizeHexColor(payload.secondaryTextColor, DEFAULT_UI_BRANDING.secondaryTextColor),
    tertiary_text_color: sanitizeHexColor(payload.tertiaryTextColor, DEFAULT_UI_BRANDING.tertiaryTextColor),
    system_name: normalizeText(payload.systemName) || DEFAULT_UI_BRANDING.systemName,
    system_description: normalizeOptionalText(payload.systemDescription),
    system_tagline: normalizeOptionalText(payload.systemTagline),
    font_family: normalizeText(payload.fontFamily) || DEFAULT_UI_BRANDING.fontFamily,
    logo_icon: normalizeOptionalText(payload.logoIcon),
    logo_url: normalizeOptionalText(payload.logoUrl),
    updated_by: payload.updatedBy || null,
  };
}

export async function getLatestUiSettings() {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from(UI_SETTINGS_TABLE)
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load UI settings.'));
  }

  return mapUiSettingsRow(data?.[0] || null);
}

export async function saveUiSettings(payload) {
  assertSupabaseReady();

  const rowPayload = mapUiSettingsPayload(payload);
  const { data, error } = await supabase
    .from(UI_SETTINGS_TABLE)
    .upsert(rowPayload)
    .select('*')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to save UI settings.'));
  }

  return mapUiSettingsRow(data);
}

function getFileExtension(fileName = '') {
  const parts = String(fileName).split('.').filter(Boolean);
  if (parts.length < 2) {
    return 'png';
  }

  return parts[parts.length - 1].toLowerCase();
}

export async function uploadUiLogo(file, userId = null) {
  assertSupabaseReady();

  if (!file) {
    throw new Error('Select a logo file before uploading.');
  }

  const extension = getFileExtension(file.name);
  const safeOwner = normalizeText(userId) || 'system';
  const objectPath = `branding/${safeOwner}/logo-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(UI_LOGO_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/png',
    });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to upload logo to storage bucket.'));
  }

  const { data } = supabase.storage.from(UI_LOGO_BUCKET).getPublicUrl(objectPath);

  return {
    bucket: UI_LOGO_BUCKET,
    path: objectPath,
    publicUrl: data?.publicUrl || '',
  };
}
