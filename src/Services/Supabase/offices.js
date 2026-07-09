import { isSupabaseConfigured, supabase } from './client';

function normalizeText(value) {
  return String(value || '').trim();
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

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeActiveStatus(status) {
  return String(status || 'Active').toLowerCase() !== 'inactive';
}

function formatOfficeLevel(level) {
  const normalized = normalizeText(level).toLowerCase();

  if (normalized === 'provincial') return 'Provincial';
  if (normalized === 'municipal') return 'Municipal';
  if (normalized === 'barangay') return 'Barangay';

  return normalizeText(level) || 'Office';
}

function getAddress(office) {
  return [
    office.house_number,
    office.street_name,
    office.subdivision_area,
  ].map(normalizeText).filter(Boolean).join(', ');
}

function mapOfficeRow(office) {
  return {
    id: office.id,
    name: office.office_name || '',
    officeName: office.office_name || '',
    type: office.office_level || '',
    officeLevel: office.office_level || '',
    officeLevelLabel: formatOfficeLevel(office.office_level),
    parentOfficeId: office.parent_office_id || '',
    municipalityId: office.municipality_id || '',
    municipality: office.ref_municipalities?.municipality_name || '',
    municipalityName: office.ref_municipalities?.municipality_name || '',
    barangayId: office.barangay_id || '',
    barangay: office.ref_barangays?.barangay_name || '',
    barangayName: office.ref_barangays?.barangay_name || '',
    houseNumber: office.house_number || '',
    streetName: office.street_name || '',
    subdivisionArea: office.subdivision_area || '',
    address: getAddress(office),
    contactNumber: office.contact_number || '',
    emailAddress: office.email || '',
    email: office.email || '',
    status: office.is_active ? 'Active' : 'Inactive',
    isActive: Boolean(office.is_active),
    createdAt: office.created_at || '',
    updatedAt: office.updated_at || '',
  };
}

function mapMunicipalityRow(municipality, offices, barangays) {
  const municipalityOffices = offices.filter((office) => office.municipalityId === municipality.id);
  const municipalityBarangays = barangays.filter((barangay) => barangay.municipality_id === municipality.id);

  return {
    id: municipality.id,
    name: municipality.municipality_name || '',
    province: municipality.province_name || 'Bulacan',
    provinceName: municipality.province_name || 'Bulacan',
    municipalityName: municipality.municipality_name || '',
    status: municipality.is_active ? 'Active' : 'Inactive',
    isActive: Boolean(municipality.is_active),
    createdAt: municipality.created_at || '',
    offices: municipalityOffices,
    barangays: municipalityBarangays,
    officesCount: municipalityOffices.length,
    barangaysCount: municipalityBarangays.length,
  };
}

export async function listOfficeManagementRecords() {
  assertSupabaseReady();

  const [
    officesResult,
    municipalitiesResult,
    barangaysResult,
  ] = await Promise.all([
    supabase
      .from('offices')
      .select(`
        id,
        office_name,
        office_level,
        parent_office_id,
        municipality_id,
        barangay_id,
        house_number,
        street_name,
        subdivision_area,
        contact_number,
        email,
        is_active,
        created_at,
        updated_at,
        ref_municipalities:municipality_id (
          municipality_name
        ),
        ref_barangays:barangay_id (
          barangay_name
        )
      `)
      .order('office_level', { ascending: true })
      .order('office_name', { ascending: true }),
    supabase
      .from('ref_municipalities')
      .select('id, province_name, municipality_name, is_active, created_at')
      .eq('province_name', 'Bulacan')
      .order('municipality_name', { ascending: true }),
    supabase
      .from('ref_barangays')
      .select('id, municipality_id, barangay_name, is_active, created_at'),
  ]);

  if (officesResult.error) {
    throw new Error(formatSupabaseError(officesResult.error, 'Unable to load offices.'));
  }

  if (municipalitiesResult.error) {
    throw new Error(formatSupabaseError(municipalitiesResult.error, 'Unable to load municipalities.'));
  }

  if (barangaysResult.error) {
    throw new Error(formatSupabaseError(barangaysResult.error, 'Unable to load barangays.'));
  }

  const offices = (officesResult.data || []).map(mapOfficeRow);
  const barangays = (barangaysResult.data || []).map((barangay) => ({
    id: barangay.id,
    municipalityId: barangay.municipality_id,
    municipality_id: barangay.municipality_id,
    municipality: '',
    name: barangay.barangay_name || '',
    barangayName: barangay.barangay_name || '',
    barangay_name: barangay.barangay_name || '',
    status: barangay.is_active ? 'Active' : 'Inactive',
    isActive: Boolean(barangay.is_active),
    is_active: Boolean(barangay.is_active),
    createdAt: barangay.created_at || '',
    created_at: barangay.created_at || '',
  }));
  const municipalityNameById = Object.fromEntries(
    (municipalitiesResult.data || []).map((municipality) => [municipality.id, municipality.municipality_name || ''])
  );
  barangays.forEach((barangay) => {
    barangay.municipality = municipalityNameById[barangay.municipalityId] || '';
  });
  const municipalities = (municipalitiesResult.data || []).map((municipality) =>
    mapMunicipalityRow(municipality, offices, barangays)
  );

  return {
    offices,
    municipalities,
    barangays,
    summary: {
      totalOffices: offices.length,
      activeOffices: offices.filter((office) => office.isActive).length,
      totalMunicipalities: municipalities.length,
      activeMunicipalities: municipalities.filter((municipality) => municipality.isActive).length,
      totalBarangays: barangays.length,
    },
  };
}

export async function createMunicipalityRecord(payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('ref_municipalities')
    .insert({
      province_name: normalizeText(payload.provinceName) || 'Bulacan',
      municipality_name: normalizeText(payload.municipalityName),
      is_active: normalizeActiveStatus(payload.status),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create municipality.'));
  }

  return data;
}

export async function updateMunicipalityRecord(id, payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('ref_municipalities')
    .update({
      province_name: normalizeText(payload.provinceName) || 'Bulacan',
      municipality_name: normalizeText(payload.municipalityName),
      is_active: normalizeActiveStatus(payload.status),
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update municipality.'));
  }

  return data;
}

export async function createBarangayRecord(payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('ref_barangays')
    .insert({
      municipality_id: payload.municipalityId,
      barangay_name: normalizeText(payload.barangayName),
      is_active: normalizeActiveStatus(payload.status),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create barangay.'));
  }

  return data;
}

export async function updateBarangayRecord(id, payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('ref_barangays')
    .update({
      barangay_name: normalizeText(payload.barangayName),
      is_active: normalizeActiveStatus(payload.status),
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update barangay.'));
  }

  return data;
}

export async function createOfficeRecord(payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('offices')
    .insert({
      office_name: normalizeText(payload.officeName),
      office_level: normalizeText(payload.officeLevel).toLowerCase(),
      parent_office_id: normalizeNullableText(payload.parentOfficeId),
      municipality_id: normalizeNullableText(payload.municipalityId),
      barangay_id: normalizeNullableText(payload.barangayId),
      house_number: normalizeNullableText(payload.houseNumber),
      street_name: normalizeNullableText(payload.streetName),
      subdivision_area: normalizeNullableText(payload.subdivisionArea),
      contact_number: normalizeNullableText(payload.contactNumber),
      email: normalizeNullableText(payload.email),
      is_active: normalizeActiveStatus(payload.status),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create office.'));
  }

  return data;
}

export async function updateOfficeRecord(id, payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('offices')
    .update({
      office_name: normalizeText(payload.officeName),
      office_level: normalizeText(payload.officeLevel).toLowerCase(),
      parent_office_id: normalizeNullableText(payload.parentOfficeId),
      municipality_id: normalizeNullableText(payload.municipalityId),
      barangay_id: normalizeNullableText(payload.barangayId),
      house_number: normalizeNullableText(payload.houseNumber),
      street_name: normalizeNullableText(payload.streetName),
      subdivision_area: normalizeNullableText(payload.subdivisionArea),
      contact_number: normalizeNullableText(payload.contactNumber),
      email: normalizeNullableText(payload.email),
      is_active: normalizeActiveStatus(payload.status),
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update office.'));
  }

  return data;
}
