import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STAFF_ROLE_ALIASES: Record<string, string> = {
  captain: 'system_admin',
  secretary: 'system_secretary',
  barangay: 'barangay_captain',
  system_admin: 'system_admin',
  system_secretary: 'system_secretary',
  municipal_mayor: 'municipal_mayor',
  municipal_secretary: 'municipal_secretary',
  barangay_captain: 'barangay_captain',
  barangay_secretary: 'barangay_secretary',
};

const STAFF_CREATION_RULES: Record<string, string[]> = {
  system_admin: ['municipal_mayor'],
  system_secretary: ['municipal_mayor'],
  municipal_mayor: ['municipal_secretary', 'barangay_captain'],
  barangay_captain: ['barangay_secretary'],
  provincial_captain: ['municipal_mayor'],
  provincial_secretary: ['municipal_mayor'],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function isEmailRateLimitError(error: { message?: string } | null | undefined) {
  return /email rate limit|rate limit exceeded|too many requests/i.test(error?.message || '');
}

function generateTemporaryPassword(length = 14) {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%'];
  const all = groups.join('');
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  const required = groups.map((group, index) => group[values[index] % group.length]);
  const remaining = Array.from({ length: Math.max(length - required.length, 0) }, (_, index) => {
    const value = values[index + required.length] || values[index];
    return all[value % all.length];
  });

  return [...required, ...remaining].sort(() => Math.random() - 0.5).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase function environment is incomplete.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'A signed-in staff account is required.' }, 401);
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, office_id')
    .eq('id', callerData.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 400);
  }

  if (!callerProfile || !STAFF_CREATION_RULES[callerProfile.role]) {
    return jsonResponse({ error: 'This staff account cannot create subordinate staff accounts.' }, 403);
  }

  const payload = await req.json();
  const email = normalizeText(payload.email).toLowerCase();
  const firstName = normalizeText(payload.firstName);
  const middleName = normalizeNullableText(payload.middleName);
  const lastName = normalizeText(payload.lastName);
  const suffix = normalizeNullableText(payload.suffix);
  const mobileNumber = normalizeNullableText(payload.mobileNumber);
  const alternateContactNumber = normalizeNullableText(payload.alternateContactNumber);
  const staffRole = STAFF_ROLE_ALIASES[normalizeText(payload.staffRole).toLowerCase()] || '';
  const municipalityName = normalizeText(payload.municipality);
  const barangayName = normalizeText(payload.barangay);
  const accessStartDate = normalizeNullableText(payload.accessStartDate);
  const accessEndDate = normalizeNullableText(payload.accessEndDate);
  const dbRole = STAFF_CREATION_RULES[callerProfile.role]?.includes(staffRole) ? staffRole : '';
  if (!email || !firstName || !lastName || !dbRole) {
    return jsonResponse({ error: 'Email, first name, last name, and an allowed staff role are required.' }, 400);
  }

  if (
    ['municipal_mayor', 'municipal_secretary', 'barangay_captain', 'barangay_secretary'].includes(staffRole) &&
    (!municipalityName || municipalityName === 'Province of Bulacan')
  ) {
    return jsonResponse({ error: 'Select a municipality before creating this staff account.' }, 400);
  }

  const siteUrl = normalizeText(payload.siteUrl).replace(/\/$/, '') || 'http://localhost:3000';
  const personnelLoginUrl = `${siteUrl}/#/login/personnel`;
  const personnelCallbackUrl = `${siteUrl}/auth/callback?next=/login/personnel`;

  let targetOfficeId = callerProfile.office_id;

  if (municipalityName === 'Province of Bulacan') {
    const { data: provincialOffice } = await adminClient
      .from('offices')
      .select('id')
      .in('office_level', ['province', 'provincial'])
      .is('municipality_id', null)
      .is('barangay_id', null)
      .maybeSingle();

    targetOfficeId = provincialOffice?.id || targetOfficeId;
  } else if (municipalityName) {
    const { data: municipality } = await adminClient
      .from('ref_municipalities')
      .select('id')
      .eq('province_name', 'Bulacan')
      .eq('municipality_name', municipalityName)
      .maybeSingle();

    if (!municipality?.id) {
      return jsonResponse({ error: `Municipality "${municipalityName}" was not found.` }, 400);
    }

    if (municipality?.id) {
      if (staffRole === 'barangay_secretary' && callerProfile.office_id) {
        targetOfficeId = callerProfile.office_id;
      } else if (staffRole === 'barangay_captain' || staffRole === 'barangay_secretary') {
        if (!barangayName) {
          return jsonResponse({ error: 'Select a barangay before creating this staff account.' }, 400);
        }

        const { data: barangay } = await adminClient
          .from('ref_barangays')
          .select('id')
          .eq('municipality_id', municipality.id)
          .eq('barangay_name', barangayName)
          .maybeSingle();

        if (!barangay?.id) {
          return jsonResponse({ error: `Barangay "${barangayName}" was not found under ${municipalityName}.` }, 400);
        }

        const { data: barangayOffice } = await adminClient
          .from('offices')
          .select('id')
          .eq('office_level', 'barangay')
          .eq('municipality_id', municipality.id)
          .eq('barangay_id', barangay.id)
          .maybeSingle();

        if (barangayOffice?.id) {
          targetOfficeId = barangayOffice.id;
        } else {
          const { data: createdBarangayOffice, error: barangayOfficeCreateError } = await adminClient
            .from('offices')
            .insert({
              office_name: `Barangay ${barangayName} Office`,
              office_level: 'barangay',
              municipality_id: municipality.id,
              barangay_id: barangay.id,
              is_active: true,
            })
            .select('id')
            .single();

          if (barangayOfficeCreateError) {
            if (barangayOfficeCreateError.message?.includes('duplicate key')) {
              const { data: existingBarangayOffice } = await adminClient
                .from('offices')
                .select('id')
                .eq('office_level', 'barangay')
                .eq('municipality_id', municipality.id)
                .eq('barangay_id', barangay.id)
                .maybeSingle();

              if (existingBarangayOffice?.id) {
                targetOfficeId = existingBarangayOffice.id;
              } else {
                return jsonResponse({ error: barangayOfficeCreateError.message || 'Unable to find existing barangay office assignment.' }, 400);
              }
            } else {
              return jsonResponse({ error: barangayOfficeCreateError.message || 'Unable to create barangay office assignment.' }, 400);
            }
          } else {
            targetOfficeId = createdBarangayOffice?.id || targetOfficeId;
          }
        }
      } else if (staffRole === 'municipal_mayor' || staffRole === 'municipal_secretary') {
        const { data: municipalOffice } = await adminClient
          .from('offices')
          .select('id')
          .in('office_level', ['municipal', 'municipality'])
          .eq('municipality_id', municipality.id)
          .is('barangay_id', null)
          .maybeSingle();

        if (municipalOffice?.id) {
          targetOfficeId = municipalOffice.id;
        } else {
          const { data: createdMunicipalOffice, error: officeCreateError } = await adminClient
            .from('offices')
            .insert({
              office_name: `${municipalityName} Municipal Office`,
              office_level: 'municipal',
              municipality_id: municipality.id,
              barangay_id: null,
              is_active: true,
            })
            .select('id')
            .single();

          if (officeCreateError) {
            if (officeCreateError.message?.includes('duplicate key')) {
              const { data: existingMunicipalOffice } = await adminClient
                .from('offices')
                .select('id')
                .in('office_level', ['municipal', 'municipality'])
                .eq('municipality_id', municipality.id)
                .is('barangay_id', null)
                .maybeSingle();

              if (existingMunicipalOffice?.id) {
                targetOfficeId = existingMunicipalOffice.id;
              } else {
                return jsonResponse({ error: officeCreateError.message || 'Unable to find existing municipal office assignment.' }, 400);
              }
            } else {
              return jsonResponse({ error: officeCreateError.message || 'Unable to create municipal office assignment.' }, 400);
            }
          } else {
            targetOfficeId = createdMunicipalOffice?.id || targetOfficeId;
          }
        }
      }
    }
  }

  const temporaryPassword = generateTemporaryPassword();

  const userMetadata = {
    role: dbRole,
    staff_role: staffRole,
    municipality: municipalityName,
    barangay: barangayName || null,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    mobile_number: mobileNumber,
    personnel_login_url: personnelLoginUrl,
    temporary_password: temporaryPassword,
    must_change_password: true,
    access_start_date: accessStartDate,
    access_end_date: accessEndDate,
  };

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (authError || !authData.user) {
    return jsonResponse({ error: authError?.message || 'Unable to create auth user.' }, 400);
  }

  const { error: insertError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    office_id: targetOfficeId,
    created_by: callerProfile.id,
    role: dbRole,
    email,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    mobile_number: mobileNumber,
    alternate_contact_number: alternateContactNumber,
    status: 'active',
    access_start_date: accessStartDate,
    access_end_date: accessEndDate,
  });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return jsonResponse({ error: insertError.message }, 400);
  }

  const { error: magicLinkError } = await adminClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: personnelCallbackUrl,
      shouldCreateUser: false,
      data: userMetadata,
    },
  });

  if (magicLinkError) {
    await adminClient.from('profiles').delete().eq('id', authData.user.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);

    if (isEmailRateLimitError(magicLinkError)) {
      return jsonResponse(
        {
          error:
            'Supabase email rate limit reached. Wait before sending another staff magic link, or configure a custom SMTP provider in Supabase Auth.',
        },
        429
      );
    }

    return jsonResponse({ error: magicLinkError.message || 'Unable to send the magic link email.' }, 400);
  }

  return jsonResponse({
    ok: true,
    userId: authData.user.id,
    email,
    personnelLoginUrl,
    callbackUrl: personnelCallbackUrl,
    temporaryPassword,
    inviteStatus: 'Magic Link Sent',
  });
});
