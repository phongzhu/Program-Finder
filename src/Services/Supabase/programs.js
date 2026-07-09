import { isSupabaseConfigured, supabase } from './client';
import { uniqueDocumentTypes } from 'Constants/documentTypes';

const PROGRAM_IMAGES_BUCKET = 'program-images';
const PROGRAM_INTERNAL_DOCUMENTS_BUCKET = 'program-internal-documents';

/**
 * @typedef {Object} RequirementTemplateAcceptedDocumentType
 * @property {string} id
 * @property {string} requirement_template_id
 * @property {string} document_type
 * @property {string} created_at
 */

/**
 * @typedef {Object} ProgramRequirementAcceptedDocumentType
 * @property {string} id
 * @property {string} program_requirement_id
 * @property {string} document_type
 * @property {string} created_at
 */

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }
}

function formatSupabaseError(error, fallback) {
  return error?.message || fallback;
}

function isMissingColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('could not find') && message.includes('column'))
  );
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function parseListInput(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readPositiveNumber(value, fallback = 0) {
  const parsed = Number(String(value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getAcceptedDocumentTypesFromRows(rows = []) {
  return uniqueDocumentTypes((rows || []).map((row) => row?.document_type || row?.documentType));
}

function getAcceptedDocumentTypesFromPayload(payload = {}, options = {}) {
  const { allowExpectedFallback = true } = options;
  const explicit = payload.acceptedDocumentTypes || payload.accepted_document_types;
  const explicitList = uniqueDocumentTypes(explicit || []);
  if (explicitList.length) {
    return explicitList;
  }

  if (!allowExpectedFallback) {
    return [];
  }

  return uniqueDocumentTypes(payload.expected_document_type || payload.expectedDocumentType || []);
}

function getExpectedDocumentTypeForCompatibility(payload = {}, acceptedDocumentTypes = []) {
  const explicitExpectedDocumentType = normalizeNullableText(payload.expected_document_type || payload.expectedDocumentType);
  if (explicitExpectedDocumentType) {
    return explicitExpectedDocumentType;
  }

  const normalizedAcceptedTypes = uniqueDocumentTypes(acceptedDocumentTypes);
  return normalizeNullableText(normalizedAcceptedTypes[0] || '');
}

async function syncAcceptedDocumentTypes(tableName, foreignKey, ownerId, nextTypes, fallbackMessage) {
  const normalizedOwnerId = normalizeText(ownerId);
  if (!normalizedOwnerId) {
    return;
  }

  const desiredTypes = getAcceptedDocumentTypesFromPayload(
    { acceptedDocumentTypes: nextTypes },
    { allowExpectedFallback: false }
  );
  const { data: existingRows, error: loadError } = await supabase
    .from(tableName)
    .select('id, document_type')
    .eq(foreignKey, normalizedOwnerId);

  if (loadError) {
    throw new Error(formatSupabaseError(loadError, fallbackMessage));
  }

  const existingTypes = new Set(getAcceptedDocumentTypesFromRows(existingRows));
  const desiredSet = new Set(desiredTypes);
  const deleteIds = (existingRows || [])
    .filter((row) => !desiredSet.has(normalizeText(row.document_type)))
    .map((row) => row.id)
    .filter(Boolean);
  const insertTypes = desiredTypes.filter((type) => !existingTypes.has(type));

  if (deleteIds.length) {
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .in('id', deleteIds);

    if (deleteError) {
      throw new Error(formatSupabaseError(deleteError, fallbackMessage));
    }
  }

  if (insertTypes.length) {
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(insertTypes.map((documentType) => ({
        [foreignKey]: normalizedOwnerId,
        document_type: documentType,
      })));

    if (insertError) {
      throw new Error(formatSupabaseError(insertError, fallbackMessage));
    }
  }
}

function syncRequirementTemplateAcceptedDocumentTypes(templateId, acceptedDocumentTypes) {
  return syncAcceptedDocumentTypes(
    'requirement_template_accepted_document_types',
    'requirement_template_id',
    templateId,
    acceptedDocumentTypes,
    'Template saved, but accepted document types could not be saved.'
  );
}

function getFileExtension(fileName = '') {
  const parts = String(fileName).split('.').filter(Boolean);
  if (parts.length < 2) {
    return 'png';
  }

  return parts[parts.length - 1].toLowerCase();
}

function hasUploadableImage(payload) {
  return payload?.imageFile && typeof payload.imageFile === 'object' && typeof payload.imageFile.name === 'string';
}

function hasUploadableInternalDocuments(payload) {
  return Array.isArray(payload?.internalDocumentFiles) && payload.internalDocumentFiles.some((file) => file?.name);
}

function resolveProgramCoverImageUrl(row) {
  const storedUrl = normalizeText(row?.cover_image_url);
  if (storedUrl) {
    return storedUrl;
  }

  const storedPath = normalizeText(row?.cover_image_path);
  if (!storedPath) {
    return '';
  }

  const { data } = supabase.storage.from(PROGRAM_IMAGES_BUCKET).getPublicUrl(storedPath);
  return data?.publicUrl || '';
}

async function resolveCurrentProfileOfficeId(session) {
  const sessionOfficeId = normalizeText(session?.officeId || session?.office_id);
  if (sessionOfficeId) {
    return sessionOfficeId;
  }

  const userId = normalizeText(session?.id);
  const { data: authData, error: authError } = userId
    ? { data: { user: { id: userId } }, error: null }
    : await supabase.auth.getUser();

  if (authError || !authData?.user?.id) {
    return '';
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('office_id')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(formatSupabaseError(profileError, 'Unable to load your personnel profile.'));
  }

  return profile?.office_id || '';
}

async function uploadProgramStorageFile(bucket, programId, file, userId = null, prefix = 'file') {
  const extension = getFileExtension(file.name);
  const safeUser = normalizeText(userId) || 'staff';
  const objectPath = `${programId}/${safeUser}/${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${extension}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to upload the file.'));
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    path: objectPath,
    publicUrl: data?.publicUrl || '',
  };
}

function uploadProgramCoverImage(programId, file, userId = null) {
  return uploadProgramStorageFile(PROGRAM_IMAGES_BUCKET, programId, file, userId, 'cover');
}

function uploadProgramInternalDocument(programId, file, userId = null) {
  return uploadProgramStorageFile(PROGRAM_INTERNAL_DOCUMENTS_BUCKET, programId, file, userId, 'internal');
}

function buildProgramRequirementRowsFromPayload(programId, payload = {}) {
  const requirementTemplates = Array.isArray(payload.requirementTemplates) ? payload.requirementTemplates : [];
  const requirementTemplateOverrides = payload?.requirementTemplateOverrides && typeof payload.requirementTemplateOverrides === 'object'
    ? payload.requirementTemplateOverrides
    : {};
  const templateNames = new Set(requirementTemplates.map((template) => normalizeText(template.name)).filter(Boolean));
  const requirements = [
    ...requirementTemplates.map((template) => normalizeText(template.name)).filter(Boolean),
    ...parseListInput(payload.requirements).filter((requirement) => !templateNames.has(requirement)),
  ];

  const templateByName = requirementTemplates.reduce((summary, template) => {
    const key = normalizeText(template.name);
    if (key) {
      summary[key] = template;
    }
    return summary;
  }, {});

  const requirementConfigQueueByName = requirements.reduce((summary, requirementName, index) => {
    const template = templateByName[requirementName];
    const override = template?.id ? requirementTemplateOverrides[template.id] || {} : {};
    const config = {
      requirementTemplateId: template?.id || null,
      name: requirementName,
      description: normalizeNullableText(override.description ?? template?.description),
      isRequired: override.isRequired ?? template?.isRequired ?? true,
      allowMultipleFiles: override.allowMultipleFiles ?? template?.allowMultipleFiles ?? false,
      sortOrder: override.sortOrder ?? template?.sortOrder ?? index,
    };

    if (!summary[requirementName]) {
      summary[requirementName] = [];
    }

    summary[requirementName].push(config);
    return summary;
  }, {});

  return requirements.map((requirement) => {
    const queuedConfigs = requirementConfigQueueByName[requirement] || [];
    const config = queuedConfigs.shift() || {};
    return {
      program_id: programId,
      requirement_template_id: config.requirementTemplateId || null,
      requirement_name: requirement,
      description: config.description || null,
      is_required: config.isRequired ?? true,
      allow_multiple_files: config.allowMultipleFiles ?? false,
      sort_order: config.sortOrder ?? 0,
    };
  });
}

function mapEligibility(row) {
  if (!row) {
    return {
      minAge: '',
      maxAge: '',
      requiredSex: '',
      requiredCivilStatus: '',
      requiredCitizenship: '',
      requiredMunicipalityId: '',
      requiredBarangayId: '',
      minPersonalIncome: '',
      maxPersonalIncome: '',
      minHouseholdIncome: '',
      maxHouseholdIncome: '',
      requiredEducationalAttainment: '',
      requiresStudent: false,
      requiredSchoolType: '',
      requiredEducationalLevel: '',
      requiredEmploymentStatus: '',
      requiredOccupation: '',
      requiresSeniorCitizen: false,
      requiresPwd: false,
      requiresSoloParent: false,
      requiresFarmer: false,
      requiresFisherfolk: false,
      requiresOutOfSchoolYouth: false,
      requiresIndigenousPeoples: false,
      requiresOfwFamily: false,
      requiresUnemployed: false,
      requiresFatherIncomeCheck: false,
      maxFatherIncome: '',
      requiresMotherIncomeCheck: false,
      maxMotherIncome: '',
      requiresGuardianIncomeCheck: false,
      maxGuardianIncome: '',
      customRuleNotes: '',
    };
  }

  return {
    minAge: row.min_age ?? '',
    maxAge: row.max_age ?? '',
    requiredSex: row.required_sex || '',
    requiredCivilStatus: row.required_civil_status || '',
    requiredCitizenship: row.required_citizenship || '',
    requiredMunicipalityId: row.required_municipality_id || '',
    requiredBarangayId: row.required_barangay_id || '',
    minPersonalIncome: row.min_personal_income ?? '',
    maxPersonalIncome: row.max_personal_income ?? '',
    minHouseholdIncome: row.min_household_income ?? '',
    maxHouseholdIncome: row.max_household_income ?? '',
    requiredEducationalAttainment: row.required_educational_attainment || '',
    requiresStudent: Boolean(row.requires_student),
    requiredSchoolType: row.required_school_type || '',
    requiredEducationalLevel: row.required_educational_level || '',
    requiredEmploymentStatus: row.required_employment_status || '',
    requiredOccupation: row.required_occupation || '',
    requiresSeniorCitizen: Boolean(row.requires_senior_citizen),
    requiresPwd: Boolean(row.requires_pwd),
    requiresSoloParent: Boolean(row.requires_solo_parent),
    requiresFarmer: Boolean(row.requires_farmer),
    requiresFisherfolk: Boolean(row.requires_fisherfolk),
    requiresOutOfSchoolYouth: Boolean(row.requires_out_of_school_youth),
    requiresIndigenousPeoples: Boolean(row.requires_indigenous_peoples),
    requiresOfwFamily: Boolean(row.requires_ofw_family),
    requiresUnemployed: Boolean(row.requires_unemployed),
    requiresFatherIncomeCheck: Boolean(row.requires_father_income_check),
    maxFatherIncome: row.max_father_income ?? '',
    requiresMotherIncomeCheck: Boolean(row.requires_mother_income_check),
    maxMotherIncome: row.max_mother_income ?? '',
    requiresGuardianIncomeCheck: Boolean(row.requires_guardian_income_check),
    maxGuardianIncome: row.max_guardian_income ?? '',
    customRuleNotes: row.custom_rule_notes || '',
  };
}

function hasEligibilityPayload(payload) {
  return [
    payload.minAge,
    payload.maxAge,
    payload.minPersonalIncome,
    payload.maxPersonalIncome,
    payload.minHouseholdIncome,
    payload.maxHouseholdIncome,
    payload.eligibilityNotes,
    payload.eligibility,
  ].some((value) => normalizeText(value)) ||
    [
      payload.requiresSeniorCitizen,
      payload.requiresPwd,
      payload.requiresSoloParent,
      payload.requiresFarmer,
      payload.requiresFisherfolk,
      payload.requiresOutOfSchoolYouth,
      payload.requiresIndigenousPeoples,
      payload.requiresOfwFamily,
      payload.requiresUnemployed,
    ].some(Boolean);
}

function toDbStatus(status) {
  const normalized = normalizeText(status).toLowerCase();

  if (normalized === 'draft') return 'draft';
  if (normalized === 'open') return 'open';
  if (normalized === 'upcoming') return 'draft';
  if (normalized === 'closed') return 'closed';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';

  return 'draft';
}

function toUiStatus(status) {
  const normalized = normalizeText(status).toLowerCase();

  if (normalized === 'draft') return 'Draft';
  if (normalized === 'open') return 'Open';
  if (normalized === 'closed') return 'Closed';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled') return 'Cancelled';

  return 'Draft';
}

const PROGRAM_TYPE_LABELS = {
  provincial_assistance: 'Provincial Assistance Program',
  municipal_assistance: 'Municipal Assistance Program',
  barangay_assistance: 'Barangay Assistance Program',
  livelihood: 'Livelihood Program',
  education: 'Education Support Program',
  health: 'Health Assistance Program',
  disaster_relief: 'Disaster Relief Program',
  social_welfare: 'Social Welfare Program',
  community_development: 'Infrastructure / Community Program',
  special_project: 'Special Project Program',
};

const PROGRAM_TYPE_VALUES = Object.entries(PROGRAM_TYPE_LABELS).reduce((summary, [value, label]) => {
  summary[normalizeText(label).toLowerCase()] = value;
  summary[value] = value;
  return summary;
}, {});

function toDbProgramType(value) {
  const normalized = normalizeText(value);
  const enumValue = PROGRAM_TYPE_VALUES[normalized.toLowerCase()] || '';
  return PROGRAM_TYPE_LABELS[enumValue] || normalized || null;
}

function toUiProgramType(value) {
  const normalized = normalizeText(value);
  return PROGRAM_TYPE_LABELS[normalized] || normalized;
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.category_name || '',
    categoryName: row.category_name || '',
    description: row.description || '',
    isActive: Boolean(row.is_active),
    status: row.is_active ? 'Active' : 'Inactive',
    createdAt: row.created_at || '',
    programCount: Number(row.programCount || 0),
  };
}

function mapSector(row) {
  return {
    id: row.id,
    name: row.sector_name || '',
    sectorName: row.sector_name || '',
    description: row.description || '',
    isActive: Boolean(row.is_active),
    status: row.is_active ? 'Active' : 'Inactive',
    createdAt: row.created_at || '',
  };
}

function mapRequirementTemplate(row) {
  const acceptedDocumentTypes = getAcceptedDocumentTypesFromRows(row.requirement_template_accepted_document_types);

  return {
    id: row.id,
    name: row.requirement_name || '',
    requirementName: row.requirement_name || '',
    description: row.description || '',
    expectedDocumentType: row.expected_document_type || '',
    acceptedDocumentTypes,
    accepted_document_types: acceptedDocumentTypes,
    isRequired: row.is_required,
    allowMultipleFiles: row.allow_multiple_files,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    status: row.is_active ? 'Active' : 'Inactive',
    createdAt: row.created_at || '',
  };
}

function buildTemplateAcceptedTypesByName(requirementTemplates = []) {
  return (requirementTemplates || []).reduce((summary, template) => {
    const templateName = normalizeText(template?.name || template?.requirementName);
    if (!templateName) {
      return summary;
    }

    summary[templateName] = uniqueDocumentTypes(
      template.acceptedDocumentTypes ||
      template.accepted_document_types ||
      []
    );
    return summary;
  }, {});
}

function buildTemplateAcceptedTypesById(requirementTemplates = []) {
  return (requirementTemplates || []).reduce((summary, template) => {
    const templateId = normalizeText(template?.id);
    if (!templateId) {
      return summary;
    }

    summary[templateId] = uniqueDocumentTypes(
      template.acceptedDocumentTypes ||
      template.accepted_document_types ||
      []
    );
    return summary;
  }, {});
}

function mapProgram(row, templateAcceptedTypesById = {}, templateAcceptedTypesByName = {}) {
  const sectorTags = row.program_sector_tags || [];
  const requirements = [...(row.program_requirements || [])].sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0));
  const eligibility = row.program_eligibility_rules || null;
  const sectors = sectorTags.map((tag) => tag.sectors?.sector_name).filter(Boolean);
  const documents = row.program_documents || [];

  return {
    id: row.id,
    title: row.title || '',
    category: row.program_categories?.category_name || '',
    categoryId: row.category_id || '',
    sector: sectors[0] || '',
    sectorIds: sectorTags.map((tag) => tag.sector_id).filter(Boolean),
    sectors,
    programType: toUiProgramType(row.program_type),
    office: row.offices?.office_name || '',
    officeId: row.office_id || '',
    municipality: row.ref_municipalities?.municipality_name || row.offices?.ref_municipalities?.municipality_name || '',
    municipalityId: row.municipality_id || row.offices?.municipality_id || '',
    barangay: row.ref_barangays?.barangay_name || row.offices?.ref_barangays?.barangay_name || '',
    barangayId: row.barangay_id || row.offices?.barangay_id || '',
    status: toUiStatus(row.status),
    visibility: row.status === 'draft' ? 'Private' : 'Public',
    applicationStartDate: row.application_start_date || '',
    applicationEndDate: row.application_end_date || '',
    deadline: row.application_end_date || '',
    slots: row.slot_count || 0,
    maxBeneficiaries: row.slot_count || 0,
    summary: row.description || '',
    description: row.description || '',
    objective: row.objective || '',
    benefits: row.benefits || '',
    coverageNotes: row.coverage_notes || '',
    submissionInstructions: row.submission_instructions || '',
    additionalNotes: row.additional_notes || '',
    coverImageUrl: resolveProgramCoverImageUrl(row),
    coverImagePath: row.cover_image_path || '',
    requirements: requirements.map((requirement) => requirement.requirement_name).filter(Boolean),
    requirementRecords: requirements.map((requirement) => ({
      ...(() => {
        const templateId = normalizeText(requirement?.requirement_template_id);
        const inheritedTemplateAcceptedTypesById = templateAcceptedTypesById[templateId] || [];
        const requirementName = normalizeText(requirement?.requirement_name);
        const inheritedTemplateAcceptedTypesByName = templateAcceptedTypesByName[requirementName] || [];
        const acceptedDocumentTypes = inheritedTemplateAcceptedTypesById.length
          ? inheritedTemplateAcceptedTypesById
          : inheritedTemplateAcceptedTypesByName;
        return {
          acceptedDocumentTypes,
          accepted_document_types: acceptedDocumentTypes,
        };
      })(),
      id: requirement.id,
      requirementTemplateId: requirement.requirement_template_id || null,
      name: requirement.requirement_name,
      description: requirement.description || '',
      isRequired: requirement.is_required ?? true,
      allowMultipleFiles: requirement.allow_multiple_files ?? false,
      sortOrder: requirement.sort_order || 0,
      sources: (requirement.program_requirement_sources || []).map((source) => ({
        id: source.id,
        sourceOfficeId: source.source_office_id || '',
        sourceName: source.source_name || '',
        sourceType: source.source_type || 'office',
        instructions: source.instructions || '',
        estimatedProcessingTime: source.estimated_processing_time || '',
        feeAmount: source.fee_amount || '',
      })),
    })),
    eligibility: eligibility?.custom_rule_notes ? parseListInput(eligibility.custom_rule_notes) : [],
    eligibilityRules: mapEligibility(eligibility),
    attachments: documents.map((document) => document.document_files?.original_file_name).filter(Boolean),
    documentRecords: documents.map((document) => ({
      id: document.id,
      documentFileId: document.document_file_id,
      documentType: document.document_type || '',
      remarks: document.remarks || '',
      fileName: document.document_files?.original_file_name || '',
      fileUrl: document.document_files?.file_url || '',
      filePath: document.document_files?.file_path || '',
      fileMimeType: document.document_files?.file_mime_type || '',
      fileSizeBytes: document.document_files?.file_size_bytes || 0,
    })),
    imageReference: resolveProgramCoverImageUrl(row),
    imageName: row.cover_image_path ? row.cover_image_path.split('/').pop() : '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || '',
    createdByUserId: row.created_by || null,
    archived: false,
  };
}

async function listProgramRecordsInternal() {
  assertSupabaseReady();

  const [
    categoriesResult,
    sectorsResult,
    requirementTemplatesResult,
    programsResult,
  ] = await Promise.all([
    supabase
      .from('program_categories')
      .select('id, category_name, description, is_active, created_at')
      .order('category_name', { ascending: true }),
    supabase
      .from('sectors')
      .select('id, sector_name, description, is_active, created_at')
      .order('sector_name', { ascending: true }),
    supabase
      .from('requirement_templates')
      .select(`
        *,
        requirement_template_accepted_document_types (
          id,
          document_type,
          created_at
        )
      `)
      .order('sort_order', { ascending: true })
      .order('requirement_name', { ascending: true }),
    supabase
      .from('programs')
      .select(`
        id,
        office_id,
        created_by,
        category_id,
        title,
        description,
        objective,
        benefits,
        program_type,
        status,
        application_start_date,
        application_end_date,
        slot_count,
        municipality_id,
        barangay_id,
        coverage_notes,
        submission_instructions,
        additional_notes,
        cover_image_url,
        cover_image_path,
        created_at,
        updated_at,
        program_categories:category_id (
          category_name
        ),
        offices:office_id (
          office_name,
          municipality_id,
          barangay_id,
          ref_municipalities:municipality_id (
            municipality_name
          ),
          ref_barangays:barangay_id (
            barangay_name
          )
        ),
        ref_municipalities:municipality_id (
          municipality_name
        ),
        ref_barangays:barangay_id (
          barangay_name
        ),
        program_sector_tags (
          sector_id,
          sectors:sector_id (
            sector_name
          )
        ),
        program_requirements (
          id,
          requirement_template_id,
          requirement_name,
          description,
          is_required,
          allow_multiple_files,
          sort_order,
          program_requirement_sources (
            id,
            source_office_id,
            source_name,
            source_type,
            instructions,
            estimated_processing_time,
            fee_amount
          )
        ),
        program_eligibility_rules (
          required_municipality_id,
          required_barangay_id,
          required_sex,
          required_civil_status,
          required_citizenship,
          min_age,
          max_age,
          min_personal_income,
          max_personal_income,
          min_household_income,
          max_household_income,
          required_educational_attainment,
          requires_student,
          required_school_type,
          required_educational_level,
          required_employment_status,
          required_occupation,
          requires_senior_citizen,
          requires_pwd,
          requires_solo_parent,
          requires_farmer,
          requires_fisherfolk,
          requires_out_of_school_youth,
          requires_indigenous_peoples,
          requires_ofw_family,
          requires_unemployed,
          requires_father_income_check,
          max_father_income,
          requires_mother_income_check,
          max_mother_income,
          requires_guardian_income_check,
          max_guardian_income,
          custom_rule_notes
        ),
        program_documents (
          id,
          document_file_id,
          document_type,
          remarks,
          document_files:document_file_id (
            original_file_name,
            file_url,
            file_path,
            file_mime_type,
            file_size_bytes
          )
        )
      `)
      .order('updated_at', { ascending: false }),
  ]);

  let resolvedProgramsResult = programsResult;

  if (programsResult.error && isMissingColumnError(programsResult.error)) {
    resolvedProgramsResult = await supabase
      .from('programs')
      .select(`
        id,
        office_id,
        created_by,
        category_id,
        title,
        description,
        program_type,
        status,
        application_start_date,
        application_end_date,
        slot_count,
        municipality_id,
        barangay_id,
        created_at,
        updated_at,
        program_categories:category_id (
          category_name
        ),
        offices:office_id (
          office_name,
          municipality_id,
          barangay_id,
          ref_municipalities:municipality_id (
            municipality_name
          ),
          ref_barangays:barangay_id (
            barangay_name
          )
        ),
        ref_municipalities:municipality_id (
          municipality_name
        ),
        ref_barangays:barangay_id (
          barangay_name
        ),
        program_sector_tags (
          sector_id,
          sectors:sector_id (
            sector_name
          )
        )
      `)
      .order('updated_at', { ascending: false });
  }

  if (categoriesResult.error) {
    throw new Error(formatSupabaseError(categoriesResult.error, 'Unable to load program categories.'));
  }

  if (sectorsResult.error) {
    throw new Error(formatSupabaseError(sectorsResult.error, 'Unable to load sectors.'));
  }

  if (requirementTemplatesResult.error) {
    throw new Error(formatSupabaseError(requirementTemplatesResult.error, 'Unable to load requirement templates.'));
  }

  if (resolvedProgramsResult.error) {
    throw new Error(formatSupabaseError(resolvedProgramsResult.error, 'Unable to load programs.'));
  }
  const requirementTemplates = (requirementTemplatesResult.data || []).map(mapRequirementTemplate);
  const templateAcceptedTypesById = buildTemplateAcceptedTypesById(requirementTemplates);
  const templateAcceptedTypesByName = buildTemplateAcceptedTypesByName(requirementTemplates);
  const programs = (resolvedProgramsResult.data || []).map((program) =>
    mapProgram(program, templateAcceptedTypesById, templateAcceptedTypesByName)
  );
  const programCountByCategoryId = programs.reduce((summary, program) => {
    if (program.categoryId) {
      summary[program.categoryId] = (summary[program.categoryId] || 0) + 1;
    }

    return summary;
  }, {});

  return {
    categories: (categoriesResult.data || []).map((category) =>
      mapCategory({ ...category, programCount: programCountByCategoryId[category.id] || 0 })
    ),
    sectors: (sectorsResult.data || []).map(mapSector),
    requirementTemplates,
    programs,
  };
}

export async function listProgramRecords() {
  return listProgramRecordsInternal();
}

export async function createProgramCategory(payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('program_categories')
    .insert({
      category_name: normalizeText(payload.name || payload.categoryName),
      description: normalizeNullableText(payload.description),
      is_active: payload.isActive ?? true,
    })
    .select('id, category_name, description, is_active, created_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create the category.'));
  }

  return mapCategory(data);
}

export async function updateProgramCategory(id, payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('program_categories')
    .update({
      category_name: normalizeText(payload.name || payload.categoryName),
      description: normalizeNullableText(payload.description),
      is_active: payload.isActive ?? true,
    })
    .eq('id', id)
    .select('id, category_name, description, is_active, created_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update the category.'));
  }

  return mapCategory(data);
}

export async function createProgramSector(payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('sectors')
    .insert({
      sector_name: normalizeText(payload.name || payload.sectorName),
      description: normalizeNullableText(payload.description),
      is_active: payload.isActive ?? true,
    })
    .select('id, sector_name, description, is_active, created_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create the sector.'));
  }

  return mapSector(data);
}

export async function updateProgramSector(id, payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('sectors')
    .update({
      sector_name: normalizeText(payload.name || payload.sectorName),
      description: normalizeNullableText(payload.description),
      is_active: payload.isActive ?? true,
    })
    .eq('id', id)
    .select('id, sector_name, description, is_active, created_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update the sector.'));
  }

  return mapSector(data);
}

export async function createRequirementTemplate(payload) {
  assertSupabaseReady();
  const acceptedDocumentTypes = getAcceptedDocumentTypesFromPayload(payload);
  const expectedDocumentType = getExpectedDocumentTypeForCompatibility(payload, acceptedDocumentTypes);

  const { data, error } = await supabase
    .from('requirement_templates')
    .insert({
      requirement_name: normalizeText(payload.requirement_name || payload.name || payload.requirementName),
      description: normalizeNullableText(payload.description),
      expected_document_type: expectedDocumentType,
      is_required: payload.is_required ?? payload.isRequired ?? true,
      allow_multiple_files: payload.allow_multiple_files ?? payload.allowMultipleFiles ?? false,
      sort_order: readPositiveNumber(payload.sort_order ?? payload.sortOrder, 0),
      is_active: payload.is_active ?? payload.isActive ?? true,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create the requirement template.'));
  }

  await syncRequirementTemplateAcceptedDocumentTypes(data.id, acceptedDocumentTypes);

  return mapRequirementTemplate({
    ...data,
    requirement_template_accepted_document_types: acceptedDocumentTypes.map((documentType) => ({
      document_type: documentType,
    })),
  });
}

export async function updateRequirementTemplate(id, payload) {
  assertSupabaseReady();
  const acceptedDocumentTypes = getAcceptedDocumentTypesFromPayload(payload);
  const expectedDocumentType = getExpectedDocumentTypeForCompatibility(payload, acceptedDocumentTypes);

  const { data, error } = await supabase
    .from('requirement_templates')
    .update({
      requirement_name: normalizeText(payload.requirement_name || payload.name || payload.requirementName),
      description: normalizeNullableText(payload.description),
      expected_document_type: expectedDocumentType,
      is_required: payload.is_required ?? payload.isRequired ?? true,
      allow_multiple_files: payload.allow_multiple_files ?? payload.allowMultipleFiles ?? false,
      sort_order: readPositiveNumber(payload.sort_order ?? payload.sortOrder, 0),
      is_active: payload.is_active ?? payload.isActive ?? true,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update the requirement template.'));
  }

  await syncRequirementTemplateAcceptedDocumentTypes(id, acceptedDocumentTypes);

  return mapRequirementTemplate({
    ...data,
    requirement_template_accepted_document_types: acceptedDocumentTypes.map((documentType) => ({
      document_type: documentType,
    })),
  });
}

export async function createProgramRequirement(programId, payload) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('program_requirements')
    .insert({
      program_id: programId,
      requirement_template_id: normalizeNullableText(payload.requirement_template_id || payload.requirementTemplateId),
      requirement_name: normalizeText(payload.name || payload.requirementName),
      description: normalizeNullableText(payload.description),
      is_required: payload.is_required ?? payload.isRequired ?? true,
      allow_multiple_files: payload.allowMultipleFiles ?? false,
      sort_order: readPositiveNumber(payload.sortOrder, 0),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create the program requirement.'));
  }

  if (normalizeText(payload.sourceName) || normalizeText(payload.instructions) || normalizeText(payload.feeAmount)) {
    const { error: sourceError } = await supabase.from('program_requirement_sources').insert({
      requirement_id: data.id,
      source_name: normalizeNullableText(payload.sourceName),
      source_type: normalizeText(payload.sourceType) || 'office',
      instructions: normalizeNullableText(payload.instructions),
      estimated_processing_time: normalizeNullableText(payload.estimatedProcessingTime),
      fee_amount: normalizeText(payload.feeAmount) ? readPositiveNumber(payload.feeAmount, 0) : null,
    });

    if (sourceError) {
      throw new Error(formatSupabaseError(sourceError, 'Requirement was saved, but its source details could not be saved.'));
    }
  }

  return data;
}

export async function updateProgramRequirement(id, payload) {
  assertSupabaseReady();

  const { error } = await supabase
    .from('program_requirements')
    .update({
      requirement_template_id: normalizeNullableText(payload.requirement_template_id || payload.requirementTemplateId),
      requirement_name: normalizeText(payload.name || payload.requirementName),
      description: normalizeNullableText(payload.description),
      is_required: payload.is_required ?? payload.isRequired ?? true,
      allow_multiple_files: payload.allowMultipleFiles ?? false,
      sort_order: readPositiveNumber(payload.sortOrder, 0),
    })
    .eq('id', id);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to update the program requirement.'));
  }

  const sourcePayload = {
    source_name: normalizeNullableText(payload.sourceName),
    source_type: normalizeText(payload.sourceType) || 'office',
    instructions: normalizeNullableText(payload.instructions),
    estimated_processing_time: normalizeNullableText(payload.estimatedProcessingTime),
    fee_amount: normalizeText(payload.feeAmount) ? readPositiveNumber(payload.feeAmount, 0) : null,
  };

  if (payload.sourceId) {
    const { error: sourceError } = await supabase
      .from('program_requirement_sources')
      .update(sourcePayload)
      .eq('id', payload.sourceId);

    if (sourceError) {
      throw new Error(formatSupabaseError(sourceError, 'Requirement was saved, but its source details could not be updated.'));
    }
  } else if (sourcePayload.source_name || sourcePayload.instructions || sourcePayload.fee_amount !== null) {
    const { error: sourceError } = await supabase.from('program_requirement_sources').insert({
      requirement_id: id,
      ...sourcePayload,
    });

    if (sourceError) {
      throw new Error(formatSupabaseError(sourceError, 'Requirement was saved, but its source details could not be created.'));
    }
  }

  return { id };
}

export async function createProgramListing(payload, session) {
  assertSupabaseReady();

  const officeId = await resolveCurrentProfileOfficeId(session);
  if (!officeId) {
    throw new Error('Your account needs an assigned office before creating program listings.');
  }

  const requestedSectorNames = Array.isArray(payload.sectors)
    ? payload.sectors.map(normalizeText).filter(Boolean)
    : parseListInput(payload.sector || '');
  const [{ data: office, error: officeError }, { data: category }, sectorsResult] = await Promise.all([
    supabase
      .from('offices')
      .select('id, municipality_id, barangay_id')
      .eq('id', officeId)
      .maybeSingle(),
    normalizeText(payload.category)
      ? supabase
          .from('program_categories')
          .select('id')
          .eq('category_name', normalizeText(payload.category))
          .maybeSingle()
      : Promise.resolve({ data: null }),
    requestedSectorNames.length
      ? supabase
          .from('sectors')
          .select('id, sector_name')
          .in('sector_name', requestedSectorNames)
      : Promise.resolve({ data: null }),
  ]);

  if (officeError) {
    throw new Error(formatSupabaseError(officeError, 'Unable to load your assigned office.'));
  }

  if (!office) {
    throw new Error('Your assigned office was not found.');
  }

  const slotCount = readPositiveNumber(payload.slots, 0);
  if (sectorsResult?.error) {
    throw new Error(formatSupabaseError(sectorsResult.error, 'Unable to load selected sectors.'));
  }

  const createPayload = {
    office_id: officeId,
    created_by: session?.id || null,
    category_id: category?.id || null,
    title: normalizeText(payload.title),
    description: normalizeNullableText(payload.summary),
    objective: normalizeNullableText(payload.objective),
    benefits: normalizeNullableText(payload.benefits),
    program_type: toDbProgramType(payload.programType),
    status: toDbStatus(payload.status),
    application_start_date: normalizeNullableText(payload.applicationStartDate),
    application_end_date: normalizeNullableText(payload.applicationEndDate),
    slot_count: slotCount,
    municipality_id: office.municipality_id || null,
    barangay_id: office.barangay_id || null,
    coverage_notes: normalizeNullableText(payload.coverageNotes),
    submission_instructions: normalizeNullableText(payload.submissionInstructions),
    additional_notes: normalizeNullableText(payload.additionalNotes),
  };

  const { data: insertedProgram, error: programError } = await supabase
    .from('programs')
    .insert(createPayload)
    .select('id')
    .single();

  if (programError) {
    throw new Error(formatSupabaseError(programError, 'Unable to create the program listing.'));
  }

  const programId = insertedProgram.id;
  if (hasUploadableImage(payload)) {
    try {
      const uploadedImage = await uploadProgramCoverImage(programId, payload.imageFile, session?.id || null);
      const { error: imageUpdateError } = await supabase
        .from('programs')
        .update({
          cover_image_url: uploadedImage.publicUrl || null,
          cover_image_path: uploadedImage.path || null,
        })
        .eq('id', programId);

      if (imageUpdateError) {
        throw new Error(formatSupabaseError(imageUpdateError, 'Unable to save the program image reference.'));
      }
    } catch (imageError) {
      await supabase.from('programs').delete().eq('id', programId);
      throw imageError;
    }
  }

  const requirementTemplates = Array.isArray(payload.requirementTemplates) ? payload.requirementTemplates : [];
  const requirementRows = buildProgramRequirementRowsFromPayload(programId, payload);
  const eligibilityNotes = normalizeNullableText(payload.eligibilityNotes) || parseListInput(payload.eligibility).join('\n');
  const childWrites = [];

  if (sectorsResult?.data?.length) {
    childWrites.push(
      supabase.from('program_sector_tags').insert(
        sectorsResult.data.map((sector) => ({
          program_id: programId,
          sector_id: sector.id,
        }))
      )
    );
  }

  if (hasEligibilityPayload(payload)) {
    childWrites.push(
      supabase.from('program_eligibility_rules').insert({
        program_id: programId,
        required_municipality_id: office.municipality_id || null,
        required_barangay_id: office.barangay_id || null,
        min_age: normalizeText(payload.minAge) ? readPositiveNumber(payload.minAge, 0) : null,
        max_age: normalizeText(payload.maxAge) ? readPositiveNumber(payload.maxAge, 0) : null,
        min_personal_income: normalizeText(payload.minPersonalIncome) ? readPositiveNumber(payload.minPersonalIncome, 0) : null,
        max_personal_income: normalizeText(payload.maxPersonalIncome) ? readPositiveNumber(payload.maxPersonalIncome, 0) : null,
        min_household_income: normalizeText(payload.minHouseholdIncome) ? readPositiveNumber(payload.minHouseholdIncome, 0) : null,
        max_household_income: normalizeText(payload.maxHouseholdIncome) ? readPositiveNumber(payload.maxHouseholdIncome, 0) : null,
        requires_senior_citizen: payload.requiresSeniorCitizen || null,
        requires_pwd: payload.requiresPwd || null,
        requires_solo_parent: payload.requiresSoloParent || null,
        requires_farmer: payload.requiresFarmer || null,
        requires_fisherfolk: payload.requiresFisherfolk || null,
        requires_out_of_school_youth: payload.requiresOutOfSchoolYouth || null,
        requires_indigenous_peoples: payload.requiresIndigenousPeoples || null,
        requires_ofw_family: payload.requiresOfwFamily || null,
        requires_unemployed: payload.requiresUnemployed || null,
        custom_rule_notes: eligibilityNotes,
      })
    );
  }

  const childResults = await Promise.all(childWrites);
  const childError = childResults.find((result) => result.error)?.error;
  if (childError) {
    await supabase.from('programs').delete().eq('id', programId);
    throw new Error(formatSupabaseError(childError, 'Unable to save the program setup records.'));
  }

  if (requirementRows.length) {
    const { data: savedRequirements, error: requirementsError } = await supabase
      .from('program_requirements')
      .insert(
        requirementRows.map((row) => ({
          program_id: row.program_id,
          requirement_template_id: row.requirement_template_id,
          requirement_name: row.requirement_name,
          description: row.description,
          is_required: row.is_required,
          allow_multiple_files: row.allow_multiple_files,
          sort_order: row.sort_order,
        }))
      )
      .select('id, requirement_name');

    if (requirementsError) {
      await supabase.from('programs').delete().eq('id', programId);
      throw new Error(formatSupabaseError(requirementsError, 'Unable to save program requirements.'));
    }

    const sourceRows = (savedRequirements || []).flatMap((requirement) => {
      const template = requirementTemplates.find((item) => normalizeText(item.name) === normalizeText(requirement.requirement_name));
      return (template?.sources || []).map((source) => ({
        requirement_id: requirement.id,
        source_office_id: source.sourceOfficeId || null,
        source_name: normalizeNullableText(source.sourceName),
        source_type: normalizeText(source.sourceType) || 'office',
        instructions: normalizeNullableText(source.instructions),
        estimated_processing_time: normalizeNullableText(source.estimatedProcessingTime),
        fee_amount: normalizeText(source.feeAmount) ? readPositiveNumber(source.feeAmount, 0) : null,
      }));
    });

    if (sourceRows.length) {
      const { error: sourcesError } = await supabase.from('program_requirement_sources').insert(sourceRows);

      if (sourcesError) {
        await supabase.from('programs').delete().eq('id', programId);
        throw new Error(formatSupabaseError(sourcesError, 'Unable to save requirement source details.'));
      }
    }
  }

  if (hasUploadableInternalDocuments(payload)) {
    try {
      const documentRows = [];

      for (const file of payload.internalDocumentFiles.filter((item) => item?.name)) {
        const uploadedDocument = await uploadProgramInternalDocument(programId, file, session?.id || null);
        const { data: documentFile, error: documentFileError } = await supabase
          .from('document_files')
          .insert({
            owner_type: 'program',
            document_type: 'program_attachment',
            original_file_name: file.name,
            stored_file_name: uploadedDocument.path.split('/').pop(),
            file_url: uploadedDocument.publicUrl,
            file_path: uploadedDocument.path,
            file_mime_type: file.type || null,
            file_extension: getFileExtension(file.name),
            file_size_bytes: file.size || null,
            uploaded_by: session?.id || null,
          })
          .select('id')
          .single();

        if (documentFileError) {
          throw new Error(formatSupabaseError(documentFileError, 'Unable to save an internal document record.'));
        }

        documentRows.push({
          program_id: programId,
          document_file_id: documentFile.id,
          uploaded_by: session?.id || null,
          document_type: 'attachment',
          remarks: normalizeNullableText(payload.internalDocumentRemarks),
        });
      }

      if (documentRows.length) {
        const { error: programDocumentsError } = await supabase.from('program_documents').insert(documentRows);

        if (programDocumentsError) {
          throw new Error(formatSupabaseError(programDocumentsError, 'Unable to link internal documents to this program.'));
        }
      }
    } catch (documentError) {
      await supabase.from('programs').delete().eq('id', programId);
      throw documentError;
    }
  }

  const records = await listProgramRecords();
  return records.programs.find((program) => program.id === programId) || null;
}

export async function updateProgramListing(programId, payload, session) {
  assertSupabaseReady();

  const normalizedProgramId = normalizeText(programId);
  if (!normalizedProgramId) {
    throw new Error('Program ID is required.');
  }

  const requestedSectorNames = Array.isArray(payload.sectors)
    ? payload.sectors.map(normalizeText).filter(Boolean)
    : parseListInput(payload.sector || '');

  const [
    { data: office, error: officeError },
    { data: category, error: categoryError },
    sectorsResult,
  ] = await Promise.all([
    supabase
      .from('programs')
      .select('id, office_id, offices:office_id ( municipality_id, barangay_id )')
      .eq('id', normalizedProgramId)
      .maybeSingle(),
    normalizeText(payload.category)
      ? supabase
          .from('program_categories')
          .select('id')
          .eq('category_name', normalizeText(payload.category))
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestedSectorNames.length
      ? supabase
          .from('sectors')
          .select('id, sector_name')
          .in('sector_name', requestedSectorNames)
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (officeError) {
    throw new Error(formatSupabaseError(officeError, 'Unable to load the selected program.'));
  }
  if (!office?.id) {
    throw new Error('Program record not found.');
  }
  if (categoryError) {
    throw new Error(formatSupabaseError(categoryError, 'Unable to load the selected category.'));
  }
  if (sectorsResult?.error) {
    throw new Error(formatSupabaseError(sectorsResult.error, 'Unable to load selected sectors.'));
  }

  const slotCount = readPositiveNumber(payload.slots, 0);
  const updatePayload = {
    category_id: category?.id || null,
    title: normalizeText(payload.title),
    description: normalizeNullableText(payload.summary),
    objective: normalizeNullableText(payload.objective),
    benefits: normalizeNullableText(payload.benefits),
    program_type: toDbProgramType(payload.programType),
    status: toDbStatus(payload.status),
    application_start_date: normalizeNullableText(payload.applicationStartDate),
    application_end_date: normalizeNullableText(payload.applicationEndDate),
    slot_count: slotCount,
    municipality_id: office.offices?.municipality_id || null,
    barangay_id: office.offices?.barangay_id || null,
    coverage_notes: normalizeNullableText(payload.coverageNotes),
    submission_instructions: normalizeNullableText(payload.submissionInstructions),
    additional_notes: normalizeNullableText(payload.additionalNotes),
    updated_at: new Date().toISOString(),
  };

  const { error: programError } = await supabase
    .from('programs')
    .update(updatePayload)
    .eq('id', normalizedProgramId);

  if (programError) {
    throw new Error(formatSupabaseError(programError, 'Unable to update the program listing.'));
  }

  if (hasUploadableImage(payload)) {
    const uploadedImage = await uploadProgramCoverImage(normalizedProgramId, payload.imageFile, session?.id || null);
    const { error: imageUpdateError } = await supabase
      .from('programs')
      .update({
        cover_image_url: uploadedImage.publicUrl || null,
        cover_image_path: uploadedImage.path || null,
      })
      .eq('id', normalizedProgramId);

    if (imageUpdateError) {
      throw new Error(formatSupabaseError(imageUpdateError, 'Unable to save the updated program image reference.'));
    }
  }

  const { error: clearSectorTagsError } = await supabase
    .from('program_sector_tags')
    .delete()
    .eq('program_id', normalizedProgramId);
  if (clearSectorTagsError) {
    throw new Error(formatSupabaseError(clearSectorTagsError, 'Unable to update selected sectors.'));
  }

  if (sectorsResult?.data?.length) {
    const { error: insertSectorTagsError } = await supabase
      .from('program_sector_tags')
      .insert(
        sectorsResult.data.map((sector) => ({
          program_id: normalizedProgramId,
          sector_id: sector.id,
        }))
      );
    if (insertSectorTagsError) {
      throw new Error(formatSupabaseError(insertSectorTagsError, 'Unable to save selected sectors.'));
    }
  }

  const eligibilityNotes = normalizeNullableText(payload.eligibilityNotes) || parseListInput(payload.eligibility).join('\n');
  const eligibilityPayload = hasEligibilityPayload(payload)
    ? {
        required_municipality_id: office.offices?.municipality_id || null,
        required_barangay_id: office.offices?.barangay_id || null,
        min_age: normalizeText(payload.minAge) ? readPositiveNumber(payload.minAge, 0) : null,
        max_age: normalizeText(payload.maxAge) ? readPositiveNumber(payload.maxAge, 0) : null,
        min_personal_income: normalizeText(payload.minPersonalIncome) ? readPositiveNumber(payload.minPersonalIncome, 0) : null,
        max_personal_income: normalizeText(payload.maxPersonalIncome) ? readPositiveNumber(payload.maxPersonalIncome, 0) : null,
        min_household_income: normalizeText(payload.minHouseholdIncome) ? readPositiveNumber(payload.minHouseholdIncome, 0) : null,
        max_household_income: normalizeText(payload.maxHouseholdIncome) ? readPositiveNumber(payload.maxHouseholdIncome, 0) : null,
        requires_senior_citizen: payload.requiresSeniorCitizen || null,
        requires_pwd: payload.requiresPwd || null,
        requires_solo_parent: payload.requiresSoloParent || null,
        requires_farmer: payload.requiresFarmer || null,
        requires_fisherfolk: payload.requiresFisherfolk || null,
        requires_out_of_school_youth: payload.requiresOutOfSchoolYouth || null,
        requires_indigenous_peoples: payload.requiresIndigenousPeoples || null,
        requires_ofw_family: payload.requiresOfwFamily || null,
        requires_unemployed: payload.requiresUnemployed || null,
        custom_rule_notes: eligibilityNotes,
      }
    : null;

  if (eligibilityPayload) {
    const { error: eligibilityError } = await supabase
      .from('program_eligibility_rules')
      .upsert(
        { program_id: normalizedProgramId, ...eligibilityPayload },
        { onConflict: 'program_id' }
      );
    if (eligibilityError) {
      throw new Error(formatSupabaseError(eligibilityError, 'Unable to save eligibility rules.'));
    }
  } else {
    const { error: deleteEligibilityError } = await supabase
      .from('program_eligibility_rules')
      .delete()
      .eq('program_id', normalizedProgramId);
    if (deleteEligibilityError) {
      throw new Error(formatSupabaseError(deleteEligibilityError, 'Unable to remove eligibility rules.'));
    }
  }

  const desiredRequirementRows = buildProgramRequirementRowsFromPayload(normalizedProgramId, payload);
  const { data: existingRequirements, error: existingRequirementsError } = await supabase
    .from('program_requirements')
    .select('id, requirement_template_id, requirement_name')
    .eq('program_id', normalizedProgramId)
    .order('sort_order', { ascending: true });
  if (existingRequirementsError) {
    throw new Error(formatSupabaseError(existingRequirementsError, 'Unable to load program requirements before saving.'));
  }

  const normalizedExisting = (existingRequirements || []).map((row) => ({
    ...row,
    requirement_template_id: normalizeText(row.requirement_template_id),
    requirement_name_normalized: normalizeText(row.requirement_name).toLowerCase(),
  }));
  const usedExistingIds = new Set();
  const updates = [];
  const inserts = [];

  desiredRequirementRows.forEach((row) => {
    const templateId = normalizeText(row.requirement_template_id);
    const requirementNameNormalized = normalizeText(row.requirement_name).toLowerCase();
    let match = null;

    if (templateId) {
      match = normalizedExisting.find((existing) => (
        !usedExistingIds.has(existing.id) &&
        existing.requirement_template_id === templateId
      ));
    }

    if (!match) {
      match = normalizedExisting.find((existing) => (
        !usedExistingIds.has(existing.id) &&
        !existing.requirement_template_id &&
        existing.requirement_name_normalized === requirementNameNormalized
      ));
    }

    if (match) {
      usedExistingIds.add(match.id);
      updates.push({
        id: match.id,
        requirement_template_id: row.requirement_template_id,
        requirement_name: row.requirement_name,
        description: row.description,
        is_required: row.is_required,
        allow_multiple_files: row.allow_multiple_files,
        sort_order: row.sort_order,
      });
      return;
    }

    inserts.push({
      program_id: normalizedProgramId,
      requirement_template_id: row.requirement_template_id,
      requirement_name: row.requirement_name,
      description: row.description,
      is_required: row.is_required,
      allow_multiple_files: row.allow_multiple_files,
      sort_order: row.sort_order,
    });
  });

  const deletes = normalizedExisting.filter((existing) => !usedExistingIds.has(existing.id)).map((existing) => existing.id);

  if (updates.length) {
    const updateResults = await Promise.all(
      updates.map((row) =>
        supabase
          .from('program_requirements')
          .update({
            requirement_template_id: row.requirement_template_id || null,
            requirement_name: row.requirement_name,
            description: row.description || null,
            is_required: row.is_required,
            allow_multiple_files: row.allow_multiple_files,
            sort_order: row.sort_order,
          })
          .eq('id', row.id)
      )
    );
    const updateError = updateResults.find((result) => result.error)?.error;
    if (updateError) {
      throw new Error(formatSupabaseError(updateError, 'Unable to update program requirements.'));
    }
  }

  if (inserts.length) {
    const { error: insertError } = await supabase
      .from('program_requirements')
      .insert(inserts);
    if (insertError) {
      throw new Error(formatSupabaseError(insertError, 'Unable to add selected program requirements.'));
    }
  }

  if (deletes.length) {
    const { error: deleteError } = await supabase
      .from('program_requirements')
      .delete()
      .in('id', deletes);
    if (deleteError) {
      throw new Error(formatSupabaseError(deleteError, 'Unable to remove unselected program requirements.'));
    }
  }

  if (hasUploadableInternalDocuments(payload)) {
    const documentRows = [];

    for (const file of payload.internalDocumentFiles.filter((item) => item?.name)) {
      const uploadedDocument = await uploadProgramInternalDocument(normalizedProgramId, file, session?.id || null);
      const { data: documentFile, error: documentFileError } = await supabase
        .from('document_files')
        .insert({
          owner_type: 'program',
          document_type: 'program_attachment',
          original_file_name: file.name,
          stored_file_name: uploadedDocument.path.split('/').pop(),
          file_url: uploadedDocument.publicUrl,
          file_path: uploadedDocument.path,
          file_mime_type: file.type || null,
          file_extension: getFileExtension(file.name),
          file_size_bytes: file.size || null,
          uploaded_by: session?.id || null,
        })
        .select('id')
        .single();

      if (documentFileError) {
        throw new Error(formatSupabaseError(documentFileError, 'Unable to save an internal document record.'));
      }

      documentRows.push({
        program_id: normalizedProgramId,
        document_file_id: documentFile.id,
        uploaded_by: session?.id || null,
        document_type: 'attachment',
        remarks: normalizeNullableText(payload.internalDocumentRemarks),
      });
    }

    if (documentRows.length) {
      const { error: programDocumentsError } = await supabase.from('program_documents').insert(documentRows);
      if (programDocumentsError) {
        throw new Error(formatSupabaseError(programDocumentsError, 'Unable to link internal documents to this program.'));
      }
    }
  }

  const records = await listProgramRecords();
  return records.programs.find((program) => program.id === normalizedProgramId) || null;
}
