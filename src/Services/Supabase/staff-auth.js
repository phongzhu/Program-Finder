import { isSupabaseConfigured, supabase } from './client';

const DB_ROLE_TO_STAFF_ROLE = {
  system_admin: 'system_admin',
  system_secretary: 'system_secretary',
  municipal_mayor: 'municipal_mayor',
  municipal_secretary: 'municipal_secretary',
  barangay_captain: 'barangay_captain',
  barangay_secretary: 'barangay_secretary',
  provincial_captain: 'system_admin',
  provincial_secretary: 'system_secretary',
};

const STAFF_PROFILE_ROLES = [
  'system_admin',
  'system_secretary',
  'municipal_mayor',
  'municipal_secretary',
  'barangay_captain',
  'barangay_secretary',
];

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function getEmailRateLimitMessage() {
  return 'Supabase email rate limit reached. Wait before sending another staff magic link, or configure a custom SMTP provider in Supabase Auth.';
}

async function formatFunctionError(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (error.message?.includes('Failed to send a request to the Edge Function')) {
    return 'Unable to reach the create-staff-account Edge Function. Deploy it with `supabase functions deploy create-staff-account`, then try again.';
  }

  if (error.context) {
    try {
      const payload = await error.context.json();
      const message = payload?.error || payload?.message || error.message || fallback;
      return /email rate limit|rate limit exceeded|too many requests/i.test(message)
        ? getEmailRateLimitMessage()
        : message;
    } catch (parseError) {
      const message = error.message || fallback;
      return /email rate limit|rate limit exceeded|too many requests/i.test(message)
        ? getEmailRateLimitMessage()
        : message;
    }
  }

  return /email rate limit|rate limit exceeded|too many requests/i.test(error.message || '')
    ? getEmailRateLimitMessage()
    : error.message || fallback;
}

function formatSupabaseError(error, fallback) {
  if (!error) {
    return fallback;
  }

  return error.message || fallback;
}

export async function createStaffAccount(payload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.functions.invoke('create-staff-account', {
    body: {
      email: normalizeText(payload.email).toLowerCase(),
      firstName: normalizeText(payload.firstName),
      middleName: normalizeNullableText(payload.middleName),
      lastName: normalizeText(payload.lastName),
      suffix: normalizeNullableText(payload.suffix),
      mobileNumber: normalizeNullableText(payload.mobileNumber),
      alternateContactNumber: normalizeNullableText(payload.alternateContactNumber),
      staffRole: normalizeText(payload.staffRole),
      municipality: normalizeText(payload.municipality),
      barangay: normalizeNullableText(payload.barangay),
      accessStartDate: normalizeNullableText(payload.accessStartDate),
      accessEndDate: normalizeNullableText(payload.accessEndDate),
      createdBy: normalizeNullableText(payload.createdBy),
      siteUrl: typeof window !== 'undefined' ? window.location.origin : null,
    },
  });

  if (error) {
    throw new Error(await formatFunctionError(error, 'Unable to create the staff account.'));
  }

  return data;
}

function getStaffRoleFromDbRole(role) {
  const normalized = normalizeText(role).toLowerCase();

  if (DB_ROLE_TO_STAFF_ROLE[normalized]) {
    return DB_ROLE_TO_STAFF_ROLE[normalized];
  }

  return 'personnel';
}

function formatProfileName(profile) {
  return [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(' ');
}

function mapProfileToStaffAccount(profile, metadata = {}) {
  const office = profile.offices || null;
  const staffRole = getStaffRoleFromDbRole(profile.role);

  return {
    id: profile.id,
    name: formatProfileName(profile),
    firstName: profile.first_name || '',
    middleName: profile.middle_name || '',
    lastName: profile.last_name || '',
    suffix: profile.suffix || '',
    email: profile.email,
    role: 'personnel',
    dbRole: profile.role,
    staffRole,
    title: staffRole,
    rootManagerId: profile.created_by || null,
    parentStaffId: profile.created_by || null,
    office: office?.office_name || '',
    officeId: profile.office_id || '',
    municipality: office?.ref_municipalities?.municipality_name || normalizeText(metadata.municipality),
    barangay: office?.ref_barangays?.barangay_name || normalizeText(metadata.barangay),
    mobileNumber: profile.mobile_number || '',
    alternateContactNumber: profile.alternate_contact_number || '',
    status: profile.status === 'active' ? 'Active' : 'Inactive',
    lastActive: profile.last_login_at || '',
    createdAt: profile.created_at || '',
    updatedAt: profile.updated_at || '',
    accessStartDate: profile.access_start_date || '',
    accessEndDate: profile.access_end_date || '',
    dateAssigned: profile.access_start_date || profile.created_at || '',
    createdByUserId: profile.created_by || null,
    mustChangePassword: Boolean(profile.mustChangePassword),
  };
}

const STAFF_PROFILE_SELECT = `
  id,
  office_id,
  created_by,
  role,
  email,
  first_name,
  middle_name,
  last_name,
  suffix,
  mobile_number,
  alternate_contact_number,
  status,
  last_login_at,
  created_at,
  updated_at,
  access_start_date,
  access_end_date,
  offices:office_id (
    id,
    office_name,
    office_level,
    municipality_id,
    barangay_id,
    ref_municipalities:municipality_id (
      municipality_name
    ),
    ref_barangays:barangay_id (
      barangay_name
    )
  )
`;

export async function signInStaffAccount(form) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const email = normalizeText(form.email).toLowerCase();
  const password = String(form.password || '');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new Error(formatSupabaseError(authError, 'Invalid personnel email or password.'));
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Supabase did not return a signed-in personnel user.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(STAFF_PROFILE_SELECT)
    .eq('id', userId)
    .in('role', STAFF_PROFILE_ROLES)
    .maybeSingle();

  if (profileError) {
    throw new Error(formatSupabaseError(profileError, 'Unable to load the personnel profile.'));
  }

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('This Supabase user does not have an authorized personnel profile.');
  }

  if (profile.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error(`This account is currently ${profile.status}.`);
  }

  await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId);

  return mapProfileToStaffAccount(
    {
      ...profile,
      mustChangePassword: Boolean(authData.user?.user_metadata?.must_change_password),
    },
    authData.user?.user_metadata || {}
  );
}

export async function getSignedInStaffAccount() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(STAFF_PROFILE_SELECT)
    .eq('id', user.id)
    .in('role', STAFF_PROFILE_ROLES)
    .maybeSingle();

  if (profileError || !profile || profile.status !== 'active') {
    return null;
  }

  await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

  return mapProfileToStaffAccount(
    {
      ...profile,
      mustChangePassword: Boolean(user.user_metadata?.must_change_password),
    },
    user.user_metadata || {}
  );
}

export async function completeStaffPasswordChange(password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const { error } = await supabase.auth.updateUser({
    password: String(password || ''),
    data: {
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    },
  });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update the staff password.'));
  }

  return { ok: true };
}

export async function listStaffProfiles() {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(STAFF_PROFILE_SELECT)
    .in('role', STAFF_PROFILE_ROLES)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load staff profiles.'));
  }

  return (data || []).map(mapProfileToStaffAccount);
}
