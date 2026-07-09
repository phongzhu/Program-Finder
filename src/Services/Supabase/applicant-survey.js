import { isSupabaseConfigured, supabase } from './client';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeStringArray(values) {
  return (Array.isArray(values) ? values : [])
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

export async function getApplicantSurveyResponse(applicantId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('applicant_survey_responses')
    .select('applicant_id, assistance_needs, applicant_types, is_current_resident, household_income_bracket, education_status, wants_program_notifications, program_filter_preference, created_at, updated_at')
    .eq('applicant_id', applicantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load your survey responses.');
  }

  return data || null;
}

export async function saveApplicantSurveyResponse(applicantId, payload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const rowPayload = {
    applicant_id: applicantId,
    assistance_needs: normalizeStringArray(payload.assistanceNeeds),
    applicant_types: normalizeStringArray(payload.applicantTypes),
    is_current_resident: payload.isCurrentResident ?? null,
    household_income_bracket: normalizeText(payload.householdIncomeBracket) || null,
    education_status: normalizeText(payload.educationStatus) || null,
    wants_program_notifications: payload.wantsProgramNotifications ?? true,
    program_filter_preference:
      normalizeText(payload.programFilterPreference) || 'qualified_only',
  };

  const { data, error } = await supabase
    .from('applicant_survey_responses')
    .upsert(rowPayload, { onConflict: 'applicant_id' })
    .select('applicant_id, assistance_needs, applicant_types, is_current_resident, household_income_bracket, education_status, wants_program_notifications, program_filter_preference, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to save your survey responses.');
  }

  return data || null;
}

export async function ensureApplicantSurveyResponse(applicantId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const normalizedApplicantId = normalizeText(applicantId);
  if (!normalizedApplicantId) {
    throw new Error('Applicant id is required.');
  }

  const existing = await getApplicantSurveyResponse(normalizedApplicantId);
  if (existing) {
    return existing;
  }

  return saveApplicantSurveyResponse(normalizedApplicantId, {
    assistanceNeeds: [],
    applicantTypes: [],
    isCurrentResident: null,
    householdIncomeBracket: null,
    educationStatus: null,
    wantsProgramNotifications: true,
    programFilterPreference: 'qualified_only',
  });
}

function getApplicantTypeFromSpecialCategory(value) {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('student')) return 'student';
  if (normalized.includes('senior')) return 'senior_citizen';
  if (normalized.includes('disability') || normalized.includes('pwd')) return 'pwd';
  if (normalized.includes('solo')) return 'solo_parent';
  if (normalized.includes('farmer')) return 'farmer';
  if (normalized.includes('fisher')) return 'fisherfolk';
  if (normalized.includes('ofw')) return 'ofw_family';
  if (normalized.includes('unemployed')) return 'unemployed';
  if (normalized.includes('none')) return 'general_resident';

  return '';
}

function isSurveyIncomeBracket(value) {
  return ['below_10k', '10k_20k', '20k_50k', 'above_50k', 'prefer_not_to_say'].includes(String(value || ''));
}

export async function saveApplicantProfileSurveyFields(applicantId, payload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const existing = await getApplicantSurveyResponse(applicantId);
  const nextTypes = new Set(Array.isArray(existing?.applicant_types) ? existing.applicant_types : []);
  const specialType = getApplicantTypeFromSpecialCategory(payload.specialCategory);
  const surveyIncomeBracket = String(payload?.searchSurvey?.householdIncomeBracket || '').trim();

  if (specialType) {
    nextTypes.add(specialType);
  }

  const { error } = await supabase
    .from('applicant_survey_responses')
    .upsert(
      {
        applicant_id: applicantId,
        assistance_needs: Array.isArray(existing?.assistance_needs) ? existing.assistance_needs : [],
        applicant_types: [...nextTypes],
        is_current_resident: existing?.is_current_resident ?? null,
        household_income_bracket: isSurveyIncomeBracket(surveyIncomeBracket)
          ? surveyIncomeBracket
          : isSurveyIncomeBracket(payload.householdIncome)
            ? payload.householdIncome
          : existing?.household_income_bracket || null,
        education_status: payload.educationStatus || existing?.education_status || null,
        wants_program_notifications: existing?.wants_program_notifications ?? true,
        program_filter_preference: existing?.program_filter_preference || 'qualified_only',
      },
      { onConflict: 'applicant_id' }
    );

  if (error) {
    throw new Error(error.message || 'Unable to save survey-backed profile fields.');
  }
}
