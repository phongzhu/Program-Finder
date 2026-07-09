import { isSupabaseConfigured, supabase } from './client';

export const APPLICANT_PROFILE_DOCUMENTS_BUCKET = 'applicant-profile-documents';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
}

function formatSupabaseError(error, fallback) {
  return error?.message || fallback;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizePathPart(value, fallback = 'file') {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

const SUPPORTED_DOCUMENT_FILE_TYPES = new Set([
  'pwd_id',
  'senior_citizen_id',
  'solo_parent_id',
  'valid_id',
  'barangay_certificate',
  'barangay_clearance',
  'certificate_of_indigency',
  'proof_of_income',
  'school_id',
  'registration_form',
  'birth_certificate',
  'medical_certificate',
  'residency_certificate',
  'employment_certificate',
  'ofw_proof',
  'fisherfolk_certification',
  'farmer_certification',
  'indigenous_peoples_certification',
  'household_certificate',
  'grade_report',
  'transcript_of_records',
  'enrollment_certificate',
  'budget_proposal',
  'disbursement_report',
  'liquidation_report',
  'official_receipt',
  'program_attachment',
  'announcement_attachment',
  'driver_license',
  'passport',
]);

const DOCUMENT_TYPE_ALIASES = {
  'barangay-certificate': 'barangay_certificate',
  'barangay-certificate ': 'barangay_certificate',
  'barangay certificate': 'barangay_certificate',
  'barangay-clearance': 'barangay_clearance',
  'barangay clearance': 'barangay_clearance',
  'certificate-of-indigency': 'certificate_of_indigency',
  'certificate of indigency': 'certificate_of_indigency',
  'proof-of-income': 'proof_of_income',
  'proof of income': 'proof_of_income',
  'school-id': 'school_id',
  'registration-form': 'registration_form',
  'birth-certificate': 'birth_certificate',
  'medical-certificate': 'medical_certificate',
  'residency-certificate': 'residency_certificate',
  'employment-certificate': 'employment_certificate',
  'ofw-proof': 'ofw_proof',
  'fisherfolk-certification': 'fisherfolk_certification',
  'farmer-certification': 'farmer_certification',
  'indigenous-peoples-certification': 'indigenous_peoples_certification',
  'household-certificate': 'household_certificate',
  'grade-report': 'grade_report',
  'transcript-of-records': 'transcript_of_records',
  'enrollment-certificate': 'enrollment_certificate',
  'budget-proposal': 'budget_proposal',
  'disbursement-report': 'disbursement_report',
  'liquidation-report': 'liquidation_report',
  'official-receipt': 'official_receipt',
  'program-attachment': 'program_attachment',
  'announcement-attachment': 'announcement_attachment',
  'driver-license': 'driver_license',
  government_id: 'valid_id',
  proof_of_residency: 'residency_certificate',
  medical_record: 'medical_certificate',
  other: 'program_attachment',
};

function normalizeDocumentTypeForEnum(value, fallback = 'passport') {
  const raw = normalizeText(value).toLowerCase();
  const aliasResolved = DOCUMENT_TYPE_ALIASES[raw] || raw;
  const normalized = aliasResolved.replace(/[\s-]+/g, '_');
  if (SUPPORTED_DOCUMENT_FILE_TYPES.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function getFileExtension(fileName = '') {
  const tokens = String(fileName).split('.').filter(Boolean);
  if (tokens.length < 2) {
    return 'bin';
  }

  return tokens[tokens.length - 1].toLowerCase();
}

function toDateValue(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return parsed.toISOString().split('T')[0];
}

function toStringList(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

async function getSignedFileUrl(filePath, fallbackUrl = '') {
  const normalizedPath = normalizeText(filePath);
  if (!normalizedPath) {
    return fallbackUrl;
  }

  const { data, error } = await supabase.storage
    .from(APPLICANT_PROFILE_DOCUMENTS_BUCKET)
    .createSignedUrl(normalizedPath, 60 * 60);

  if (error) {
    return fallbackUrl;
  }

  return data?.signedUrl || fallbackUrl;
}

function mapSectorRow(row) {
  return {
    id: row.id,
    name: row.sector_name || '',
    description: row.description || '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at || '',
  };
}

async function ensureApplicantProfileExists(applicantUserId) {
  const userId = normalizeText(applicantUserId);
  if (!userId) {
    throw new Error('Applicant id is required.');
  }

  const { error } = await supabase
    .from('applicant_profiles')
    .upsert(
      {
        user_id: userId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to initialize applicant profile before saving sector tags.'));
  }
}

export async function listActiveSectors() {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('sectors')
    .select('id, sector_name, description, is_active, created_at')
    .eq('is_active', true)
    .order('sector_name', { ascending: true });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load active sectors.'));
  }

  return (data || []).map(mapSectorRow);
}

export async function listApplicantSectorTags(applicantUserId) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('applicant_sector_tags')
    .select('id, sector_id, sectors:sector_id (id, sector_name, description, is_active, created_at), created_at')
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load applicant sector tags.'));
  }

  return (data || [])
    .map((row) => {
      const sector = Array.isArray(row.sectors) ? row.sectors[0] : row.sectors;
      if (!sector?.id) {
        return null;
      }

      return {
        id: row.id,
        sectorId: sector.id,
        sectorName: sector.sector_name || '',
        createdAt: row.created_at || '',
      };
    })
    .filter(Boolean);
}

export async function replaceApplicantSectorTags(applicantUserId, sectorIds = []) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  if (!userId) {
    throw new Error('Applicant id is required.');
  }

  await ensureApplicantProfileExists(userId);

  const nextIds = [...new Set(toStringList(sectorIds))];
  const { data: existingTags, error: existingError } = await supabase
    .from('applicant_sector_tags')
    .select('sector_id')
    .eq('applicant_user_id', userId);

  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to load existing applicant sector tags.'));
  }

  const currentIds = new Set((existingTags || []).map((row) => String(row?.sector_id || '').trim()).filter(Boolean));
  const nextIdSet = new Set(nextIds);
  const idsToRemove = [...currentIds].filter((sectorId) => !nextIdSet.has(sectorId));

  if (idsToRemove.length) {
    const { error: deleteError } = await supabase
      .from('applicant_sector_tags')
      .delete()
      .eq('applicant_user_id', userId)
      .in('sector_id', idsToRemove);

    if (deleteError) {
      throw new Error(formatSupabaseError(deleteError, 'Unable to refresh applicant sector tags.'));
    }
  }

  if (nextIds.length) {
    const payload = nextIds.map((sectorId) => ({
      applicant_user_id: userId,
      sector_id: sectorId,
    }));

    const { error: upsertError } = await supabase
      .from('applicant_sector_tags')
      .upsert(payload, {
        onConflict: 'applicant_user_id,sector_id',
      });

    if (upsertError) {
      throw new Error(formatSupabaseError(upsertError, 'Unable to save applicant sector tags.'));
    }
  }

  return listApplicantSectorTags(userId);
}

function mapFamilyMember(row) {
  return {
    id: row.id,
    relationshipType: row.relationship_type || '',
    relationshipLabel: row.relationship_label || '',
    firstName: row.first_name || '',
    middleName: row.middle_name || '',
    lastName: row.last_name || '',
    suffix: row.suffix || '',
    occupation: row.occupation || '',
    employerName: row.employer_name || '',
    monthlyIncome: row.monthly_income ?? '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

export async function listApplicantFamilyMembers(applicantUserId) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('applicant_family_members')
    .select('id, relationship_type, first_name, middle_name, last_name, suffix, relationship_label, occupation, employer_name, monthly_income, created_at, updated_at')
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load family members.'));
  }

  return (data || []).map(mapFamilyMember);
}

export async function createApplicantFamilyMember(applicantUserId, payload = {}) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  if (!userId) {
    throw new Error('Applicant id is required.');
  }

  const relationshipType = normalizeText(payload.relationshipType || payload.relationship_type).toLowerCase().replace(/[\s-]+/g, '_');
  if (!relationshipType) {
    throw new Error('Relationship type is required.');
  }

  const { data, error } = await supabase
    .from('applicant_family_members')
    .insert({
      applicant_user_id: userId,
      relationship_type: relationshipType,
      first_name: normalizeNullableText(payload.firstName),
      middle_name: normalizeNullableText(payload.middleName),
      last_name: normalizeNullableText(payload.lastName),
      suffix: normalizeNullableText(payload.suffix),
      relationship_label: normalizeNullableText(payload.relationshipLabel),
      occupation: normalizeNullableText(payload.occupation),
      employer_name: normalizeNullableText(payload.employerName),
      monthly_income: normalizeNumber(payload.monthlyIncome),
    })
    .select('id, relationship_type, first_name, middle_name, last_name, suffix, relationship_label, occupation, employer_name, monthly_income, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to add family member.'));
  }

  return mapFamilyMember(data);
}

export async function updateApplicantFamilyMember(applicantUserId, memberId, payload = {}) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  const id = normalizeText(memberId);

  if (!userId || !id) {
    throw new Error('Family member id is required.');
  }

  const relationshipType = normalizeText(payload.relationshipType || payload.relationship_type).toLowerCase().replace(/[\s-]+/g, '_');

  const { data, error } = await supabase
    .from('applicant_family_members')
    .update({
      relationship_type: relationshipType || null,
      first_name: normalizeNullableText(payload.firstName),
      middle_name: normalizeNullableText(payload.middleName),
      last_name: normalizeNullableText(payload.lastName),
      suffix: normalizeNullableText(payload.suffix),
      relationship_label: normalizeNullableText(payload.relationshipLabel),
      occupation: normalizeNullableText(payload.occupation),
      employer_name: normalizeNullableText(payload.employerName),
      monthly_income: normalizeNumber(payload.monthlyIncome),
    })
    .eq('id', id)
    .eq('applicant_user_id', userId)
    .select('id, relationship_type, first_name, middle_name, last_name, suffix, relationship_label, occupation, employer_name, monthly_income, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update family member.'));
  }

  return mapFamilyMember(data);
}

export async function deleteApplicantFamilyMember(applicantUserId, memberId) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  const id = normalizeText(memberId);

  if (!userId || !id) {
    throw new Error('Family member id is required.');
  }

  const { error } = await supabase
    .from('applicant_family_members')
    .delete()
    .eq('id', id)
    .eq('applicant_user_id', userId);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to delete family member.'));
  }
}

function mapApplicantProfileDocument(row) {
  const file = Array.isArray(row.document_files) ? row.document_files[0] : row.document_files;

  return {
    id: row.id,
    applicantUserId: row.applicant_user_id,
    documentFileId: row.document_file_id,
    documentType: file?.document_type || 'other',
    documentNumber: row.document_number || '',
    issuedDate: toDateValue(row.issued_date),
    expiryDate: toDateValue(row.expiry_date),
    verificationStatus: row.verification_status || 'pending',
    verifiedBy: row.verified_by || null,
    verifiedAt: row.verified_at || '',
    rejectionReason: row.rejection_reason || '',
    notes: row.notes || '',
    originalFileName: file?.original_file_name || '',
    storedFileName: file?.stored_file_name || '',
    fileMimeType: file?.file_mime_type || '',
    fileExtension: file?.file_extension || '',
    fileSizeBytes: file?.file_size_bytes || null,
    filePath: file?.file_path || '',
    fileUrl: file?.file_url || '',
    uploadedAt: toDateValue(file?.uploaded_at),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

export async function listApplicantProfileDocuments(applicantUserId) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('applicant_profile_documents')
    .select(`
      id,
      applicant_user_id,
      document_file_id,
      document_number,
      issued_date,
      expiry_date,
      verification_status,
      verified_by,
      verified_at,
      rejection_reason,
      notes,
      created_at,
      updated_at,
      document_files:document_file_id (
        id,
        owner_type,
        document_type,
        original_file_name,
        stored_file_name,
        file_url,
        file_path,
        file_mime_type,
        file_extension,
        file_size_bytes,
        uploaded_at
      )
    `)
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load applicant profile documents.'));
  }

  const normalized = (data || []).map(mapApplicantProfileDocument);

  return Promise.all(
    normalized.map(async (record) => ({
      ...record,
      fileUrl: await getSignedFileUrl(record.filePath, record.fileUrl),
    }))
  );
}

export async function uploadApplicantProfileDocument({
  applicantUserId,
  uploadedBy,
  file,
  documentType = 'other',
  documentNumber,
  issuedDate,
  expiryDate,
  notes,
}) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  const uploaderId = normalizeText(uploadedBy) || userId;

  if (!userId || !uploaderId || !file?.name) {
    throw new Error('Applicant id and file are required to upload a profile document.');
  }

  const normalizedDocumentType = normalizeDocumentTypeForEnum(documentType, 'passport');
  const extension = getFileExtension(file.name);
  const timestamp = Date.now();
  const safeFileName = sanitizePathPart(file.name.replace(/\.[^.]+$/, ''), 'document');
  const objectPath = `${sanitizePathPart(userId, 'applicant')}/${sanitizePathPart(normalizedDocumentType, 'document-type')}/${timestamp}-${safeFileName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(APPLICANT_PROFILE_DOCUMENTS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    throw new Error(formatSupabaseError(uploadError, 'Unable to upload document file.'));
  }

  const signedUrl = await getSignedFileUrl(objectPath, '');
  const { data: fileRecord, error: fileError } = await supabase
    .from('document_files')
    .insert({
      owner_type: 'applicant_profile',
      document_type: normalizedDocumentType,
      original_file_name: file.name,
      stored_file_name: objectPath.split('/').pop(),
      file_url: signedUrl,
      file_path: objectPath,
      file_mime_type: normalizeNullableText(file.type),
      file_extension: extension,
      file_size_bytes: Number.isFinite(file.size) ? file.size : null,
      uploaded_by: uploaderId,
      uploaded_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (fileError) {
    throw new Error(formatSupabaseError(fileError, 'Unable to save uploaded file metadata.'));
  }

  const { data: profileDocument, error: profileDocumentError } = await supabase
    .from('applicant_profile_documents')
    .insert({
      applicant_user_id: userId,
      document_file_id: fileRecord.id,
      document_number: normalizeNullableText(documentNumber),
      issued_date: normalizeNullableText(issuedDate),
      expiry_date: normalizeNullableText(expiryDate),
      verification_status: 'pending',
      notes: normalizeNullableText(notes),
    })
    .select(`
      id,
      applicant_user_id,
      document_file_id,
      document_number,
      issued_date,
      expiry_date,
      verification_status,
      verified_by,
      verified_at,
      rejection_reason,
      notes,
      created_at,
      updated_at,
      document_files:document_file_id (
        id,
        owner_type,
        document_type,
        original_file_name,
        stored_file_name,
        file_url,
        file_path,
        file_mime_type,
        file_extension,
        file_size_bytes,
        uploaded_at
      )
    `)
    .single();

  if (profileDocumentError) {
    throw new Error(formatSupabaseError(profileDocumentError, 'Unable to link uploaded file to applicant profile document vault.'));
  }

  const mapped = mapApplicantProfileDocument(profileDocument);
  return {
    ...mapped,
    fileUrl: await getSignedFileUrl(mapped.filePath, mapped.fileUrl),
  };
}

export async function updateApplicantProfileDocumentMetadata(applicantUserId, documentId, payload = {}) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  const targetId = normalizeText(documentId);

  if (!userId || !targetId) {
    throw new Error('Document id is required.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('applicant_profile_documents')
    .select('id, verification_status')
    .eq('id', targetId)
    .eq('applicant_user_id', userId)
    .single();

  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to load this profile document.'));
  }

  if (String(existing?.verification_status || '').toLowerCase() === 'verified') {
    throw new Error('Verified documents can no longer be edited by applicants.');
  }

  const { data, error } = await supabase
    .from('applicant_profile_documents')
    .update({
      document_number: normalizeNullableText(payload.documentNumber),
      issued_date: normalizeNullableText(payload.issuedDate),
      expiry_date: normalizeNullableText(payload.expiryDate),
      notes: normalizeNullableText(payload.notes),
    })
    .eq('id', targetId)
    .eq('applicant_user_id', userId)
    .select(`
      id,
      applicant_user_id,
      document_file_id,
      document_number,
      issued_date,
      expiry_date,
      verification_status,
      verified_by,
      verified_at,
      rejection_reason,
      notes,
      created_at,
      updated_at,
      document_files:document_file_id (
        id,
        owner_type,
        document_type,
        original_file_name,
        stored_file_name,
        file_url,
        file_path,
        file_mime_type,
        file_extension,
        file_size_bytes,
        uploaded_at
      )
    `)
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update profile document metadata.'));
  }

  const mapped = mapApplicantProfileDocument(data);
  return {
    ...mapped,
    fileUrl: await getSignedFileUrl(mapped.filePath, mapped.fileUrl),
  };
}

export async function deleteApplicantProfileDocument(applicantUserId, documentId) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  const targetId = normalizeText(documentId);

  if (!userId || !targetId) {
    throw new Error('Document id is required.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('applicant_profile_documents')
    .select('id, verification_status, document_file_id, document_files:document_file_id (file_path)')
    .eq('id', targetId)
    .eq('applicant_user_id', userId)
    .single();

  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to load this profile document.'));
  }

  const verificationStatus = String(existing?.verification_status || '').toLowerCase();
  if (!['pending', 'rejected'].includes(verificationStatus)) {
    throw new Error('Only pending or rejected documents can be deleted.');
  }

  const filePath = normalizeText(Array.isArray(existing?.document_files) ? existing.document_files[0]?.file_path : existing?.document_files?.file_path);
  const documentFileId = normalizeText(existing?.document_file_id);

  const { error: deleteVaultError } = await supabase
    .from('applicant_profile_documents')
    .delete()
    .eq('id', targetId)
    .eq('applicant_user_id', userId);

  if (deleteVaultError) {
    throw new Error(formatSupabaseError(deleteVaultError, 'Unable to delete this profile document.'));
  }

  if (documentFileId) {
    const { error: deleteFileRowError } = await supabase
      .from('document_files')
      .delete()
      .eq('id', documentFileId)
      .eq('uploaded_by', userId);

    if (deleteFileRowError) {
      throw new Error(formatSupabaseError(deleteFileRowError, 'Profile document deleted but file metadata cleanup failed.'));
    }
  }

  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from(APPLICANT_PROFILE_DOCUMENTS_BUCKET)
      .remove([filePath]);

    if (storageError) {
      throw new Error(formatSupabaseError(storageError, 'Profile document deleted but storage cleanup failed.'));
    }
  }
}
