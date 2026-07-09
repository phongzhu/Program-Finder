import { isSupabaseConfigured, supabase } from './client';
import { APPLICANT_PROFILE_DOCUMENTS_BUCKET } from './applicant-profile';
import {
  getDocumentTypeCompatibilityKeys,
  getDocumentTypeLabel,
  isDocumentTypeAccepted,
  uniqueDocumentTypes,
} from 'Constants/documentTypes';

export const APPLICATION_DOCUMENTS_BUCKET = 'application-documents';
const OWNER_TYPE_STORAGE_BUCKET_MAP = {
  application: APPLICATION_DOCUMENTS_BUCKET,
  applicant_profile: APPLICANT_PROFILE_DOCUMENTS_BUCKET,
};

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Application submissions require the database connection.');
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

function normalizeDocumentType(value) {
  return normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim()
  );
}

function getAcceptedDocumentTypesForRequirement(requirement = {}, templateAcceptedTypesByName = {}) {
  const templateRecord = Array.isArray(requirement?.requirement_templates)
    ? requirement.requirement_templates[0]
    : requirement?.requirement_templates;
  const linkedTemplateRows = templateRecord?.requirement_template_accepted_document_types;
  const linkedTemplateTypes = uniqueDocumentTypes(
    (linkedTemplateRows || []).map((row) => row?.document_type || row?.documentType || '')
  );
  if (linkedTemplateTypes.length) {
    return linkedTemplateTypes;
  }

  const requirementNameKey = normalizeText(requirement?.requirement_name || requirement?.name || requirement?.requirementName).toLowerCase();
  const nameFallback = uniqueDocumentTypes(templateAcceptedTypesByName[requirementNameKey] || []);
  if (nameFallback.length) {
    return nameFallback;
  }

  return uniqueDocumentTypes(requirement?.acceptedDocumentTypes || requirement?.accepted_document_types || []);
}

function getDocumentTypeValidationMessage(requirementName, acceptedDocumentTypes = []) {
  const readableList = acceptedDocumentTypes.map((type) => getDocumentTypeLabel(type)).filter(Boolean);
  return `This document type is not accepted for ${requirementName}. Please choose ${readableList.join(', ')}.`;
}

function getVerificationPriority(status = '') {
  const normalized = normalizeText(status).toLowerCase();
  if (normalized === 'verified') return 0;
  if (normalized === 'pending') return 1;
  return 9;
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
  'other',
]);

const DOCUMENT_TYPE_ALIASES = {
  government_id: 'valid_id',
  proof_of_residency: 'residency_certificate',
  medical_record: 'medical_certificate',
};

function normalizeDocumentTypeForEnum(value, fallback = 'program_attachment') {
  const raw = normalizeText(value).toLowerCase();
  const aliasResolved = DOCUMENT_TYPE_ALIASES[raw] || raw;
  const normalized = aliasResolved.replace(/[\s-]+/g, '_');
  if (SUPPORTED_DOCUMENT_FILE_TYPES.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function getFileExtension(fileName = '') {
  const parts = String(fileName).split('.').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
}

function safePathPart(value, fallback = 'file') {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function toDateValue(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }

  return normalized.includes('T') ? normalized.split('T')[0] : normalized;
}

function formatDisplayName(profile = {}) {
  return [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ');
}

export function toDbApplicationStatus(status) {
  const normalized = normalizeText(status).toLowerCase().replace(/[\s-]+/g, '_');

  if (['draft'].includes(normalized)) return 'draft';
  if (['submitted', 'pending'].includes(normalized)) return 'pending';
  if (['for_review', 'under_review'].includes(normalized)) return 'under_review';
  if (['incomplete', 'needs_correction'].includes(normalized)) return 'needs_correction';
  if (normalized === 'approved') return 'approved';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'claimed') return 'claimed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  if (normalized === 'waitlisted') return 'waitlisted';
  if (normalized === 'completed') return 'completed';

  return 'pending';
}

export function toUiApplicationStatus(status) {
  const normalized = normalizeText(status).toLowerCase();

  if (normalized === 'draft') return 'Draft';
  if (normalized === 'pending') return 'Submitted';
  if (normalized === 'under_review') return 'For Review';
  if (normalized === 'needs_correction') return 'Incomplete';
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'claimed') return 'Claimed';
  if (normalized === 'cancelled') return 'Cancelled';
  if (normalized === 'waitlisted') return 'Waitlisted';
  if (normalized === 'completed') return 'Completed';

  return status || 'Submitted';
}

function resolveStorageBucketByOwnerType(ownerType = '') {
  const normalized = normalizeText(ownerType).toLowerCase();
  return OWNER_TYPE_STORAGE_BUCKET_MAP[normalized] || APPLICATION_DOCUMENTS_BUCKET;
}

async function getSignedFileUrl(path, fallbackUrl = '', bucket = APPLICATION_DOCUMENTS_BUCKET) {
  const normalizedPath = normalizeText(path);
  if (!normalizedPath) {
    return fallbackUrl;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, 60 * 60);

  if (error) {
    return fallbackUrl;
  }

  return data?.signedUrl || fallbackUrl;
}

async function getSignedFileUrlForDocumentFile(documentFile = {}) {
  return getSignedFileUrl(
    documentFile?.file_path,
    documentFile?.file_url || '',
    resolveStorageBucketByOwnerType(documentFile?.owner_type)
  );
}

function getAddress(profile = {}) {
  const address = Array.isArray(profile.user_addresses) ? profile.user_addresses[0] : profile.user_addresses;
  const municipality = address?.ref_municipalities?.municipality_name || '';
  const barangay = address?.ref_barangays?.barangay_name || '';
  const addressParts = [
    address?.house_number,
    address?.street_name,
    address?.subdivision_area,
    barangay,
    municipality,
    address?.zip_code,
  ].map(normalizeText).filter(Boolean);

  return {
    municipality,
    barangay,
    address: addressParts.join(', '),
  };
}

function getApplicantSnapshot(profile = {}) {
  const applicantProfile = Array.isArray(profile.applicant_profiles)
    ? profile.applicant_profiles[0]
    : profile.applicant_profiles;
  const householdInfoSource = applicantProfile?.applicant_household_info || profile.applicant_household_info;
  const studentInfoSource = applicantProfile?.applicant_student_info || profile.applicant_student_info;
  const specialSource = applicantProfile?.applicant_special_categories || profile.applicant_special_categories;
  const householdInfo = Array.isArray(householdInfoSource)
    ? householdInfoSource[0]
    : householdInfoSource;
  const studentInfo = Array.isArray(studentInfoSource)
    ? studentInfoSource[0]
    : studentInfoSource;
  const special = Array.isArray(specialSource)
    ? specialSource[0]
    : specialSource;
  const address = getAddress(profile);

  return {
    fullName: formatDisplayName(profile),
    email: profile.email || '',
    phone: profile.mobile_number || '',
    ...address,
    birthDate: applicantProfile?.birthdate || '',
    sex: applicantProfile?.sex || '',
    civilStatus: applicantProfile?.civil_status || '',
    school: studentInfo?.school_name || '',
    course: studentInfo?.course_program || '',
    householdIncome: householdInfo?.total_household_monthly_income ?? '',
    specialCategory: special?.is_pwd
      ? 'Person with Disability'
      : special?.is_senior_citizen
        ? 'Senior Citizen'
        : special?.is_solo_parent
          ? 'Solo Parent'
          : special?.is_farmer
            ? 'Farmer'
            : special?.is_fisherfolk
              ? 'Fisherfolk'
              : special?.is_ofw_family
                ? 'OFW Family'
                : special?.is_unemployed
                  ? 'Unemployed Resident'
                  : '',
  };
}

async function mapApplicationDocument(row, applicant = null) {
  const documentFile = row.document_files || {};
  const requirement = row.program_requirements || {};
  const fileUrl = await getSignedFileUrlForDocumentFile(documentFile);
  const ownerEmail = applicant?.email || '';

  return {
    id: row.id,
    documentFileId: row.document_file_id || '',
    applicationId: row.application_id || '',
    requirementId: row.program_requirement_id || '',
    ownerEmail,
    name: requirement.requirement_name || documentFile.original_file_name || 'Application Requirement',
    category: 'Application Requirement',
    status: toUiDocumentStatus(row.submission_status),
    uploadedAt: toDateValue(row.created_at || documentFile.uploaded_at),
    fileName: documentFile.original_file_name || '',
    fileType: documentFile.file_mime_type || documentFile.file_extension || 'File',
    fileUrl,
    filePath: documentFile.file_path || '',
    aiCheckStatus: toUiAiCheckStatus(row.ai_check_status),
    aiCheckResult: row.ai_check_result || null,
  };
}

function toUiDocumentStatus(status) {
  const normalized = normalizeText(status).toLowerCase();
  if (normalized === 'verified') return 'Verified';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'expired') return 'Expired';
  return 'Pending Review';
}

function toUiAiCheckStatus(status) {
  const normalized = normalizeText(status).toLowerCase();
  if (normalized === 'likely_valid') return 'likely_valid';
  if (normalized === 'warning') return 'warning';
  if (normalized === 'unreadable') return 'unreadable';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'checking') return 'checking';
  return 'not_checked';
}

function normalizeAiCheckResult(result = {}) {
  const warnings = Array.isArray(result?.warnings)
    ? result.warnings.map((item) => normalizeText(item)).filter(Boolean)
    : [];
  const confidence = normalizeText(result?.confidence).toLowerCase();

  return {
    appearsCorrectType: Boolean(result?.appearsCorrectType),
    confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'low',
    detectedDocumentType: normalizeText(result?.detectedDocumentType),
    warnings,
    suggestedAction: normalizeText(result?.suggestedAction),
  };
}

function deriveAiCheckStatus(result = {}) {
  const normalized = normalizeAiCheckResult(result);
  const warningText = normalized.warnings.join(' ').toLowerCase();
  const unreadableHint = ['blurry', 'unreadable', 'cropped', 'too dark', 'dark', 'unclear'].some((keyword) =>
    warningText.includes(keyword)
  );

  if (unreadableHint) {
    return 'unreadable';
  }

  if (!normalized.appearsCorrectType) {
    return 'warning';
  }

  if (normalized.confidence === 'high' || normalized.confidence === 'medium') {
    return 'likely_valid';
  }

  return 'warning';
}

async function requestDocumentAIPrecheck(payload) {
  const response = await fetch('/api/ai/document-precheck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `AI pre-check failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch (_error) {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  const body = await response.json();
  return normalizeAiCheckResult(body?.result || {});
}

async function mapApplication(row) {
  const applicant = row.applicant || {};
  const program = row.programs || {};
  const documents = await Promise.all((row.application_documents || []).map((item) => mapApplicationDocument(item, applicant)));
  const history = [...(row.application_status_history || [])]
    .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
    .map((item) => ({
      time: item.created_at || '',
      status: toUiApplicationStatus(item.new_status),
      detail: item.change_reason || `Application marked as ${toUiApplicationStatus(item.new_status).toLowerCase()}.`,
    }));

  return {
    id: row.id,
    applicantUserId: row.applicant_user_id,
    applicantEmail: applicant.email || '',
    applicantName: formatDisplayName(applicant) || applicant.email || 'Applicant',
    programId: row.program_id,
    officeId: row.office_id,
    office: program.offices?.office_name || '',
    status: toUiApplicationStatus(row.application_status),
    submittedAt: toDateValue(row.submitted_at || row.created_at),
    reviewedAt: toDateValue(row.reviewed_at),
    reviewerNote: row.remarks || '',
    rejectionReason: row.application_status === 'rejected' ? row.remarks || '' : '',
    followUpNote: row.application_status === 'needs_correction' ? row.remarks || '' : '',
    completeness: documents.length ? 100 : 0,
    priority: 'Medium',
    notes: row.remarks || '',
    applicantSnapshot: getApplicantSnapshot(applicant),
    documents: documents.map((item) => item.name),
    requirementFiles: documents.map((item) => ({
      applicationDocumentId: item.id || '',
      requirementId: item.requirementId || '',
      requirementName: item.name,
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      uploadedAt: item.uploadedAt,
      status: item.status,
      aiCheckStatus: item.aiCheckStatus || 'not_checked',
      aiCheckResult: item.aiCheckResult || null,
    })),
    history,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

const APPLICATION_SELECT = `
  id,
  applicant_user_id,
  program_id,
  office_id,
  application_status,
  submitted_at,
  reviewed_by,
  reviewed_at,
  remarks,
  created_at,
  updated_at,
  applicant:profiles!applications_applicant_user_id_fkey (
    id,
    email,
    first_name,
    middle_name,
    last_name,
    suffix,
    mobile_number,
    user_addresses (
      house_number,
      street_name,
      subdivision_area,
      zip_code,
      ref_municipalities:municipality_id (
        municipality_name
      ),
      ref_barangays:barangay_id (
        barangay_name
      )
    ),
    applicant_profiles (
      birthdate,
      sex,
      civil_status,
      applicant_household_info (
        total_household_monthly_income
      ),
      applicant_student_info (
        school_name,
        course_program
      ),
      applicant_special_categories (
        is_senior_citizen,
        is_pwd,
        is_solo_parent,
        is_farmer,
        is_fisherfolk,
        is_ofw_family,
        is_unemployed
      ),
      applicant_family_members (
        relationship_type,
        relationship_label,
        monthly_income
      )
    )
  ),
  programs:program_id (
    title,
    office_id,
    offices:office_id (
      office_name
    )
  ),
  application_documents (
    id,
    application_id,
    program_requirement_id,
    document_file_id,
    submission_status,
    ai_check_status,
    ai_check_result,
    created_at,
    document_files:document_file_id (
      original_file_name,
      file_url,
      file_path,
      file_mime_type,
      file_extension,
      uploaded_at
    ),
    program_requirements:program_requirement_id (
      requirement_name
    )
  ),
  application_status_history (
    new_status,
    change_reason,
    created_at
  )
`;

export async function listApplicationRecords(session = null) {
  assertSupabaseReady();

  let query = supabase
    .from('applications')
    .select(APPLICATION_SELECT)
    .order('created_at', { ascending: false });

  if (session?.role === 'applicant' && session?.id) {
    query = query.eq('applicant_user_id', session.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load application records.'));
  }

  return Promise.all((data || []).map(mapApplication));
}

export async function getApplicationRecordById(applicationId) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('applications')
    .select(APPLICATION_SELECT)
    .eq('id', applicationId)
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load the application record.'));
  }

  return mapApplication(data);
}

export async function linkExistingDocumentsToApplication({
  applicationId,
  applicantUserId,
  programId,
  applicantName = '',
}) {
  assertSupabaseReady();

  const normalizedApplicationId = normalizeText(applicationId);
  const normalizedApplicantUserId = normalizeText(applicantUserId);
  const normalizedProgramId = normalizeText(programId);

  if (!normalizedApplicationId || !normalizedApplicantUserId || !normalizedProgramId) {
    throw new Error('applicationId, applicantUserId, and programId are required to link existing documents.');
  }

  const { data: profileDocuments, error: profileDocumentsError } = await supabase
    .from('applicant_profile_documents')
    .select(`
      id,
      applicant_user_id,
      document_file_id,
      verification_status,
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
        uploaded_by,
        uploaded_at,
        created_at,
        file_extension
      )
    `)
    .eq('applicant_user_id', normalizedApplicantUserId)
    .order('created_at', { ascending: false });

  if (profileDocumentsError) {
    throw new Error(formatSupabaseError(profileDocumentsError, 'Unable to load applicant profile documents.'));
  }

  const { data: programRequirements, error: programRequirementsError } = await supabase
    .from('program_requirements')
    .select(`
      id,
      requirement_name,
      description,
      requirement_template_id,
      requirement_templates:requirement_template_id (
        requirement_template_accepted_document_types (
          document_type
        )
      )
    `)
    .eq('program_id', normalizedProgramId);

  if (programRequirementsError) {
    throw new Error(formatSupabaseError(programRequirementsError, 'Unable to load program requirements.'));
  }

  const requirementsMissingTemplateTypes = (programRequirements || []).filter((requirement) => {
    const templateRecord = Array.isArray(requirement?.requirement_templates)
      ? requirement.requirement_templates[0]
      : requirement?.requirement_templates;
    const linkedTypes = uniqueDocumentTypes(
      (templateRecord?.requirement_template_accepted_document_types || []).map((row) => row?.document_type || '')
    );
    return !linkedTypes.length;
  });
  const requirementNameFallbackKeys = Array.from(
    new Set(
      requirementsMissingTemplateTypes
        .map((requirement) => normalizeText(requirement?.requirement_name).toLowerCase())
        .filter(Boolean)
    )
  );
  let templateAcceptedTypesByName = {};
  if (requirementNameFallbackKeys.length) {
    const { data: templateRows, error: templateRowsError } = await supabase
      .from('requirement_templates')
      .select(`
        requirement_name,
        requirement_template_accepted_document_types (
          document_type
        )
      `);

    if (templateRowsError) {
      throw new Error(formatSupabaseError(templateRowsError, 'Unable to load template fallback document types.'));
    }

    templateAcceptedTypesByName = (templateRows || []).reduce((summary, row) => {
      const key = normalizeText(row?.requirement_name).toLowerCase();
      if (!key) {
        return summary;
      }
      const linkedTypes = uniqueDocumentTypes(
        (row?.requirement_template_accepted_document_types || []).map((entry) => entry?.document_type || '')
      );
      summary[key] = linkedTypes;
      return summary;
    }, {});
  }

  const { data: existingLinks, error: existingLinksError } = await supabase
    .from('application_documents')
    .select('program_requirement_id')
    .eq('application_id', normalizedApplicationId)
    .eq('applicant_user_id', normalizedApplicantUserId);

  if (existingLinksError) {
    throw new Error(formatSupabaseError(existingLinksError, 'Unable to check existing linked requirement documents.'));
  }

  const linkedRequirementIds = new Set((existingLinks || []).map((row) => row.program_requirement_id).filter(Boolean));
  const documentsByType = new Map();
  (profileDocuments || []).forEach((profileDocument) => {
    const verificationStatus = normalizeText(profileDocument?.verification_status).toLowerCase();
    if (verificationStatus === 'rejected') {
      return;
    }
    const file = Array.isArray(profileDocument?.document_files)
      ? profileDocument.document_files[0]
      : profileDocument?.document_files;
    const key = normalizeDocumentType(file?.document_type);
    if (!key) {
      return;
    }
    if (!documentsByType.has(key)) {
      documentsByType.set(key, []);
    }
    documentsByType.get(key).push({
      ...file,
      profileDocumentId: profileDocument?.id || '',
      verificationStatus,
      createdAt: profileDocument?.created_at || file?.created_at || file?.uploaded_at || '',
    });
  });
  documentsByType.forEach((documents) => {
    documents.sort((left, right) => {
      const priorityDelta = getVerificationPriority(left.verificationStatus) - getVerificationPriority(right.verificationStatus);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    });
  });

  const linkSummary = {
    linked: [],
    skipped: [],
  };

  for (const requirement of programRequirements || []) {
    const requirementId = requirement?.id;
    if (!requirementId) {
      continue;
    }

    if (linkedRequirementIds.has(requirementId)) {
      console.log(`[SKIP] Requirement ${requirementId}: already linked to this application.`);
      linkSummary.skipped.push({
        requirementId,
        reason: 'already_linked',
      });
      continue;
    }

    const acceptedDocumentTypes = getAcceptedDocumentTypesForRequirement(requirement, templateAcceptedTypesByName);
    if (!acceptedDocumentTypes.length) {
      linkSummary.skipped.push({
        requirementId,
        requirementName: requirement?.requirement_name || '',
        reason: 'no_configured_document_type',
      });
      continue;
    }

    let matchedDocument = null;
    let matchedDocumentType = '';
    for (const acceptedType of acceptedDocumentTypes) {
      const compatibilityKeys = getDocumentTypeCompatibilityKeys(acceptedType);
      for (const key of compatibilityKeys) {
        const documentCandidates = documentsByType.get(normalizeDocumentType(key)) || [];
        if (documentCandidates.length) {
          matchedDocument = documentCandidates[0];
          matchedDocumentType = normalizeDocumentType(acceptedType);
          break;
        }
      }
      if (matchedDocument?.id) {
        break;
      }
    }

    if (!matchedDocument?.id) {
      linkSummary.skipped.push({
        requirementId,
        requirementName: requirement?.requirement_name || '',
        acceptedDocumentTypes,
        reason: 'no_matching_profile_document',
      });
      continue;
    }

    const insertResult = await supabase
      .from('application_documents')
      .insert({
        application_id: normalizedApplicationId,
        applicant_user_id: normalizedApplicantUserId,
        program_requirement_id: requirementId,
        document_file_id: matchedDocument.id,
        submitted_by: normalizedApplicantUserId,
        submission_status: 'pending',
        ai_check_status: 'checking',
        ai_check_result: null,
      })
      .select('id')
      .single();
    const insertError = insertResult.error;

    if (insertError) {
      if (String(insertError.code || '') === '23505') {
        console.log(`[SKIP] Requirement ${requirementId}: duplicate link prevented by unique constraint.`);
        linkSummary.skipped.push({
          requirementId,
          documentFileId: matchedDocument.id,
          reason: 'duplicate_link',
        });
        continue;
      }
      throw new Error(
        formatSupabaseError(
          insertError,
          `Unable to link requirement ${requirementId} to document ${matchedDocument.id}.`
        )
      );
    }

    const applicationDocumentId = insertResult.data?.id || '';
    const sourceFileUrl = await getSignedFileUrlForDocumentFile(matchedDocument);
    let aiCheckStatus = 'failed';
    let aiCheckResult = {
      appearsCorrectType: false,
      confidence: 'low',
      detectedDocumentType: '',
      warnings: ['AI pre-check unavailable during vault link.'],
      suggestedAction: 'Staff will still review this document.',
    };

    if (sourceFileUrl) {
      try {
        const precheck = await requestDocumentAIPrecheck({
          fileUrl: sourceFileUrl,
          fileName: matchedDocument.original_file_name || matchedDocument.stored_file_name || '',
          fileMimeType: matchedDocument.file_mime_type || matchedDocument.file_extension || '',
          applicantName: normalizeText(applicantName),
          expectedDocumentType: matchedDocumentType || acceptedDocumentTypes[0] || '',
          requirementName: normalizeText(requirement?.requirement_name),
          requirementDescription: normalizeText(requirement?.description || ''),
        });

        aiCheckStatus = deriveAiCheckStatus(precheck);
        aiCheckResult = precheck;
      } catch (aiError) {
        console.error('Document AI pre-check failed during vault link:', aiError);
      }
    }

    if (applicationDocumentId) {
      await supabase
        .from('application_documents')
        .update({
          ai_check_status: aiCheckStatus,
          ai_check_result: aiCheckResult,
        })
        .eq('id', applicationDocumentId);
    }

    linkedRequirementIds.add(requirementId);
    linkSummary.linked.push({
      requirementId,
      requirementName: requirement?.requirement_name || '',
      documentFileId: matchedDocument.id,
      profileDocumentId: matchedDocument.profileDocumentId || '',
      documentType: matchedDocumentType,
      aiCheckStatus,
    });
  }

  return linkSummary;
}

export async function createDraftApplication({ applicantUserId, applicantName = '', program }) {
  assertSupabaseReady();

  const userId = normalizeText(applicantUserId);
  const programId = normalizeText(program?.id);
  const officeId = normalizeText(program?.officeId);

  if (!userId || !programId || !officeId) {
    throw new Error('Unable to start the application because applicant, program, or office id is missing.');
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('applications')
    .select('id, application_status')
    .eq('applicant_user_id', userId)
    .eq('program_id', programId)
    .neq('application_status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to check existing applications.'));
  }

  const existing = existingRows?.[0] || null;
  if (existing?.id) {
    if (existing.application_status === 'draft') {
      await linkExistingDocumentsToApplication({
        applicationId: existing.id,
        applicantUserId: userId,
        programId,
        applicantName,
      });
      return getApplicationRecordById(existing.id);
    }

    throw new Error('You already have an application for this program.');
  }

  const { data: inserted, error } = await supabase
    .from('applications')
    .insert({
      applicant_user_id: userId,
      program_id: programId,
      office_id: officeId,
      application_status: 'draft',
      submitted_at: null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create the application draft.'));
  }

  await supabase.from('application_status_history').insert({
    application_id: inserted.id,
    old_status: null,
    new_status: 'draft',
    changed_by: userId,
    change_reason: 'Applicant started an application draft.',
  });

  await linkExistingDocumentsToApplication({
    applicationId: inserted.id,
    applicantUserId: userId,
    programId,
    applicantName,
  });

  return getApplicationRecordById(inserted.id);
}

export async function uploadApplicationRequirementFile({ applicationId, applicantUserId, applicantName = '', requirement, file }) {
  assertSupabaseReady();

  if (!file?.name) {
    throw new Error('Select a file before uploading this requirement.');
  }

  const requirementId = normalizeText(requirement?.id);
  const requirementName = normalizeText(requirement?.name || requirement?.requirementName);
  const requirementDescription = normalizeText(requirement?.description || requirement?.notes);
  const acceptedDocumentTypes = getAcceptedDocumentTypesForRequirement(requirement);
  const selectedDocumentType = normalizeDocumentTypeForEnum(requirement?.selectedDocumentType || requirement?.documentType, '');
  if (acceptedDocumentTypes.length && selectedDocumentType && !isDocumentTypeAccepted(selectedDocumentType, acceptedDocumentTypes)) {
    throw new Error(getDocumentTypeValidationMessage(requirementName || 'this requirement', acceptedDocumentTypes));
  }
  const chosenDocumentType = selectedDocumentType || acceptedDocumentTypes[0] || '';
  const expectedDocumentType = normalizeDocumentTypeForEnum(chosenDocumentType, 'program_attachment');

  if (!acceptedDocumentTypes.length && !chosenDocumentType) {
    throw new Error(
      `No accepted document types are configured for ${requirementName || 'this requirement'}. Please contact the program office.`
    );
  }
  const extension = getFileExtension(file.name);
  const requirementPathPart = safePathPart(requirementId || requirementName, 'requirement');
  const fileNamePart = safePathPart(String(file.name).replace(/\.[^.]+$/, ''), 'file');
  const objectPath = [
    normalizeText(applicantUserId),
    normalizeText(applicationId),
    requirementPathPart,
    `${Date.now()}-${fileNamePart}.${extension}`,
  ].join('/');

  const { error: uploadError } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    throw new Error(formatSupabaseError(uploadError, 'Unable to upload the requirement file.'));
  }

  const signedUrl = await getSignedFileUrl(objectPath);
  const { data: documentFile, error: documentFileError } = await supabase
    .from('document_files')
    .insert({
      owner_type: 'application',
      document_type: expectedDocumentType,
      original_file_name: file.name,
      stored_file_name: objectPath.split('/').pop(),
      file_url: signedUrl,
      file_path: objectPath,
      file_mime_type: file.type || null,
      file_extension: extension,
      file_size_bytes: file.size || null,
      uploaded_by: applicantUserId,
    })
    .select('id')
    .single();

  if (documentFileError) {
    throw new Error(formatSupabaseError(documentFileError, 'Unable to save the uploaded document record.'));
  }

  const { data: existingDocument, error: existingDocumentError } = requirementId
    ? await supabase
        .from('application_documents')
        .select('id')
        .eq('application_id', applicationId)
        .eq('program_requirement_id', requirementId)
        .maybeSingle()
    : { data: null, error: null };

  if (existingDocumentError) {
    throw new Error(formatSupabaseError(existingDocumentError, 'Unable to check existing requirement uploads.'));
  }

  const linkPayload = {
    application_id: applicationId,
    applicant_user_id: applicantUserId,
    program_requirement_id: requirementId || null,
    document_file_id: documentFile.id,
    submitted_by: applicantUserId,
    submission_status: 'pending',
  };

  const linkResult = existingDocument?.id
    ? await supabase
        .from('application_documents')
        .update({
          document_file_id: documentFile.id,
          submitted_by: applicantUserId,
          submission_status: 'pending',
          ai_check_status: 'checking',
          ai_check_result: null,
        })
        .eq('id', existingDocument.id)
        .select('id')
        .single()
    : await supabase
        .from('application_documents')
        .insert({
          ...linkPayload,
          ai_check_status: 'checking',
          ai_check_result: null,
        })
        .select('id')
        .single();

  if (linkResult.error) {
    throw new Error(formatSupabaseError(linkResult.error, 'Unable to link the uploaded file to the application.'));
  }

  const applicationDocumentId = linkResult.data.id;
  let aiCheckStatus = 'not_checked';
  let aiCheckResult = null;

  try {
    const precheck = await requestDocumentAIPrecheck({
      fileUrl: signedUrl,
      fileName: file.name,
      fileMimeType: file.type || '',
      applicantName: normalizeText(applicantName),
      expectedDocumentType: chosenDocumentType || expectedDocumentType,
      requirementName,
      requirementDescription,
    });

    aiCheckStatus = deriveAiCheckStatus(precheck);
    aiCheckResult = precheck;

    const { error: aiUpdateError } = await supabase
      .from('application_documents')
      .update({
        ai_check_status: aiCheckStatus,
        ai_check_result: aiCheckResult,
      })
      .eq('id', applicationDocumentId);

    if (aiUpdateError) {
      throw aiUpdateError;
    }
  } catch (aiError) {
    console.error('Document AI pre-check failed:', aiError);
    aiCheckStatus = 'failed';
    aiCheckResult = {
      appearsCorrectType: false,
      confidence: 'low',
      detectedDocumentType: '',
      warnings: ['AI pre-check unavailable during upload.'],
      suggestedAction: 'Staff will still review this document.',
    };

    await supabase
      .from('application_documents')
      .update({
        ai_check_status: 'failed',
        ai_check_result: aiCheckResult,
      })
      .eq('id', applicationDocumentId);
  }

  return {
    id: applicationDocumentId,
    documentFileId: documentFile.id,
    applicationId,
    requirementId,
    ownerEmail: '',
    name: requirementName,
    category: 'Application Requirement',
    status: 'Pending Review',
    uploadedAt: toDateValue(new Date().toISOString()),
    fileName: file.name,
    fileType: file.type || 'File',
    documentType: expectedDocumentType,
    fileUrl: signedUrl,
    filePath: objectPath,
    aiCheckStatus,
    aiCheckResult,
  };
}

export async function removeApplicationRequirementFile({
  applicationId,
  applicantUserId,
  applicationDocumentId = '',
  requirementId = '',
}) {
  assertSupabaseReady();

  const normalizedApplicationId = normalizeText(applicationId);
  const normalizedApplicantUserId = normalizeText(applicantUserId);
  const normalizedApplicationDocumentId = normalizeText(applicationDocumentId);
  const normalizedRequirementId = normalizeText(requirementId);
  const hasValidApplicationDocumentId = isUuid(normalizedApplicationDocumentId);
  const hasValidRequirementId = isUuid(normalizedRequirementId);

  if (!normalizedApplicationId || !normalizedApplicantUserId) {
    throw new Error('Application and applicant ids are required.');
  }

  if (!hasValidApplicationDocumentId && !hasValidRequirementId) {
    throw new Error('A requirement file reference is required.');
  }

  let query = supabase
    .from('application_documents')
    .select(`
      id,
      application_id,
      program_requirement_id,
      document_file_id,
      applications:application_id (
        id,
        applicant_user_id,
        application_status
      ),
      document_files:document_file_id (
        id,
        owner_type,
        file_path
      )
    `)
    .eq('application_id', normalizedApplicationId);

  if (hasValidApplicationDocumentId) {
    query = query.eq('id', normalizedApplicationDocumentId);
  } else {
    query = query.eq('program_requirement_id', normalizedRequirementId);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to load this requirement attachment.'));
  }
  if (!existing?.id) {
    return { removed: false };
  }

  const ownerId = normalizeText(
    Array.isArray(existing.applications)
      ? existing.applications[0]?.applicant_user_id
      : existing.applications?.applicant_user_id
  );
  if (!ownerId || ownerId !== normalizedApplicantUserId) {
    throw new Error('You can only remove files from your own draft.');
  }

  const applicationStatus = normalizeText(
    Array.isArray(existing.applications)
      ? existing.applications[0]?.application_status
      : existing.applications?.application_status
  ).toLowerCase();
  if (applicationStatus && applicationStatus !== 'draft') {
    throw new Error('Only draft applications can remove requirement files.');
  }

  const { error: deleteLinkError } = await supabase
    .from('application_documents')
    .delete()
    .eq('id', existing.id)
    .eq('application_id', normalizedApplicationId);
  if (deleteLinkError) {
    throw new Error(formatSupabaseError(deleteLinkError, 'Unable to remove the requirement attachment.'));
  }

  return {
    removed: true,
    id: existing.id,
    requirementId: existing.program_requirement_id || '',
  };
}

export async function submitApplicationRecord({ applicationId, applicantUserId, notes }) {
  assertSupabaseReady();

  const { data: existing, error: existingError } = await supabase
    .from('applications')
    .select('application_status')
    .eq('id', applicationId)
    .single();

  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to load the application draft.'));
  }

  const { error } = await supabase
    .from('applications')
    .update({
      application_status: 'pending',
      submitted_at: new Date().toISOString(),
      remarks: normalizeNullableText(notes),
    })
    .eq('id', applicationId);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to submit the application.'));
  }

  await supabase.from('application_status_history').insert({
    application_id: applicationId,
    old_status: existing.application_status || null,
    new_status: 'pending',
    changed_by: applicantUserId,
    change_reason: 'Applicant submitted complete requirements.',
  });

  return getApplicationRecordById(applicationId);
}

export async function reviewApplicationRecord({ applicationId, reviewerId, nextStatus, note }) {
  assertSupabaseReady();

  const dbStatus = toDbApplicationStatus(nextStatus);
  const { data: existing, error: existingError } = await supabase
    .from('applications')
    .select('application_status')
    .eq('id', applicationId)
    .single();

  if (existingError) {
    throw new Error(formatSupabaseError(existingError, 'Unable to load the application record.'));
  }

  const { error } = await supabase
    .from('applications')
    .update({
      application_status: dbStatus,
      reviewed_by: reviewerId || null,
      reviewed_at: new Date().toISOString(),
      remarks: normalizeNullableText(note),
    })
    .eq('id', applicationId);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update the application decision.'));
  }

  await supabase.from('application_status_history').insert({
    application_id: applicationId,
    old_status: existing.application_status || null,
    new_status: dbStatus,
    changed_by: reviewerId || null,
    change_reason: normalizeNullableText(note) || `Application marked as ${toUiApplicationStatus(dbStatus).toLowerCase()}.`,
  });

  return getApplicationRecordById(applicationId);
}
