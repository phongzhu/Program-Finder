import { useEffect, useMemo, useState } from 'react';
import { AppButton, FormField } from 'Components/UI';
import { DOCUMENT_TYPE_LABELS, getDocumentTypeOptions } from 'Constants/documentTypes';

const CIVIL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'divorced', label: 'Divorced' },
];
const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const EDUCATION_OPTIONS = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'high_school', label: 'High school' },
  { value: 'senior_high_school', label: 'Senior High School' },
  { value: 'college', label: 'College' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'graduate_studies', label: 'Graduate Studies' },
  { value: 'not_studying', label: 'Not studying' },
];
const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'contractual', label: 'Contractual' },
];
const HOUSING_STATUS_OPTIONS = [
  { value: 'owned', label: 'Owned' },
  { value: 'rented', label: 'Rented' },
  { value: 'shared', label: 'Shared' },
  { value: 'informal_settler', label: 'Informal settler' },
  { value: 'others', label: 'Others' },
];
const SPECIAL_CATEGORY_OPTIONS = [
  'None',
  'Student',
  'Senior Citizen',
  'Person with Disability',
  'Solo Parent',
  'Farmer',
  'Fisherfolk',
  'OFW Family',
  'Indigenous Peoples',
  'Unemployed Resident',
];
const ASSISTANCE_LABELS = {
  education: 'Education support',
  financial: 'Financial assistance',
  medical: 'Medical / health assistance',
  livelihood: 'Livelihood / job opportunities',
  disaster_relief: 'Disaster relief',
  social_welfare: 'Social welfare (senior, PWD, etc.)',
  general: 'General programs / any available',
  all: 'General programs / any available',
};
const DISCOVERY_MODE_LABELS = {
  browse: 'Browse all public listings first',
  'open-now': 'Apply to programs that are open now',
  'my-area': 'Focus on my municipality and nearby listings',
};
const INCOME_BRACKET_LABELS = {
  below_10k: 'Below Php10,000',
  '10k_20k': 'Php10,000 - Php20,000',
  '20k_50k': 'Php20,000 - Php50,000',
  above_50k: 'Above Php50,000',
  prefer_not_to_say: 'Prefer not to say',
};
const APPLICANT_TYPE_LABELS = {
  student: 'Student',
  parent_guardian: 'Parent / Guardian',
  senior_citizen: 'Senior citizen',
  pwd: 'Person with disability (PWD)',
  solo_parent: 'Solo parent',
  unemployed: 'Unemployed',
  employed_low_income: 'Employed but low-income',
  ofw_family: 'OFW / OFW family',
  farmer: 'Farmer',
  fisherfolk: 'Fisherfolk',
  general_resident: 'General resident',
};
const SURVEY_ASSISTANCE_OPTIONS = [
  { value: 'education', label: 'Education support' },
  { value: 'financial', label: 'Financial assistance' },
  { value: 'medical', label: 'Medical / health assistance' },
  { value: 'livelihood', label: 'Livelihood / job opportunities' },
  { value: 'disaster_relief', label: 'Disaster relief' },
  { value: 'social_welfare', label: 'Social welfare (senior, PWD, etc.)' },
  { value: 'general', label: 'General programs / any available' },
];
const SURVEY_APPLICANT_TYPE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'parent_guardian', label: 'Parent / Guardian' },
  { value: 'senior_citizen', label: 'Senior citizen' },
  { value: 'pwd', label: 'Person with disability (PWD)' },
  { value: 'solo_parent', label: 'Solo parent' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'employed_low_income', label: 'Employed but low-income' },
  { value: 'ofw_family', label: 'OFW / OFW family' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'fisherfolk', label: 'Fisherfolk' },
  { value: 'general_resident', label: 'General resident' },
];
const SURVEY_PROGRAM_FILTER_OPTIONS = [
  { value: 'qualified_only', label: 'Show likely qualified programs' },
  { value: 'all_programs', label: 'Show all programs' },
];
const FAMILY_RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'relative', label: 'Relative' },
  { value: 'other', label: 'Other' },
];
const FAMILY_RELATIONSHIP_LABELS = FAMILY_RELATIONSHIP_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});
const PROFILE_DOCUMENT_TYPE_OPTIONS = getDocumentTypeOptions();
const PROFILE_DOCUMENT_TYPE_LABELS = {
  ...DOCUMENT_TYPE_LABELS,
  government_id: 'Government ID',
  proof_of_residency: 'Proof of Residency',
  medical_record: 'Medical Record',
};
const PROFILE_DOCUMENT_RULES = {
  pwd_id: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-]{5,23}$/,
    hint: 'Format: 6-24 chars, letters/numbers, optional hyphen.',
    expiryYears: 5,
  },
  senior_citizen_id: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-]{5,23}$/,
    hint: 'Format: 6-24 chars, letters/numbers, optional hyphen.',
    expiryYears: 5,
  },
  solo_parent_id: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-]{5,23}$/,
    hint: 'Format: 6-24 chars, letters/numbers, optional hyphen.',
    expiryYears: 5,
  },
  valid_id: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-]{5,23}$/,
    hint: 'Format: 6-24 chars, letters/numbers, optional hyphen (e.g., DL-1234-567890).',
    expiryYears: 5,
  },
  driver_license: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-]{5,23}$/,
    hint: "Format: 6-24 chars, letters/numbers, optional hyphen (e.g., N01-23-456789).",
    expiryYears: 5,
  },
  passport: {
    pattern: /^[A-Z0-9]{8,9}$/i,
    hint: 'Format: 8-9 letters/numbers (e.g., P1234567 or AB1234567).',
    expiryYears: 10,
  },
  government_id: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-]{5,23}$/,
    hint: 'Format: 6-24 chars, letters/numbers, optional hyphen (e.g., DL-1234-567890).',
    expiryYears: 5,
  },
  residency_certificate: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryMonths: 6,
  },
  proof_of_residency: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryMonths: 6,
  },
  proof_of_income: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryMonths: 3,
  },
  barangay_certificate: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryMonths: 6,
  },
  barangay_clearance: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryMonths: 6,
  },
  certificate_of_indigency: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryMonths: 6,
  },
  school_id: {
    pattern: /^[A-Za-z0-9]{2,8}-[A-Za-z0-9]{2,14}$/,
    hint: 'Format: SCHOOL-2026A123 (prefix and suffix separated by one hyphen).',
    expiryYears: 1,
  },
  registration_form: {
    pattern: /^(REG|RF)-?\d{4}-?\d{3,10}$/i,
    hint: 'Format: REG-2026-000123 or RF2026000123.',
    expiryYears: 1,
  },
  birth_certificate: {
    pattern: /^(BC|LCR|PSA)-?\d{4}-?\d{4,12}$/i,
    hint: 'Format: PSA-2020-123456 or BC2020123456.',
    expiryYears: 30,
  },
  medical_certificate: {
    pattern: /^(MED|MRN)-?\d{4}-?\d{3,12}$/i,
    hint: 'Format: MED-2026-012345 or MRN2026012345.',
    expiryMonths: 6,
  },
  medical_record: {
    pattern: /^(MED|MRN)-?\d{4}-?\d{3,12}$/i,
    hint: 'Format: MED-2026-012345 or MRN2026012345.',
    expiryMonths: 6,
  },
  employment_certificate: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  ofw_proof: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 2,
  },
  fisherfolk_certification: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 2,
  },
  farmer_certification: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 2,
  },
  indigenous_peoples_certification: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 3,
  },
  household_certificate: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  grade_report: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  transcript_of_records: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 3,
  },
  enrollment_certificate: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  budget_proposal: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  disbursement_report: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  liquidation_report: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  official_receipt: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  program_attachment: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  announcement_attachment: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{4,29}$/,
    hint: 'Format: 5-30 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
  other: {
    pattern: /^[A-Za-z0-9][A-Za-z0-9-/]{3,30}$/,
    hint: 'Format: 4-31 chars, letters/numbers, optional hyphen/slash.',
    expiryYears: 1,
  },
};

const PROFILE_SECTIONS = [
  { id: 'identity', label: 'Identity' },
  { id: 'address', label: 'Address' },
  { id: 'education', label: 'Education' },
  { id: 'household', label: 'Household' },
  { id: 'needs', label: 'Needs' },
  { id: 'family', label: 'Family' },
  { id: 'document-vault', label: 'Document Vault' },
];
const PROFILE_FORM_SECTION_IDS = new Set(['identity', 'address', 'education', 'household']);
const DOCUMENT_VAULT_GROUP_MAP = {
  identification: new Set([
    'driver_license',
    'passport',
    'pwd_id',
    'senior_citizen_id',
    'solo_parent_id',
    'school_id',
    'birth_certificate',
  ]),
  residency: new Set([
    'barangay_certificate',
    'barangay_clearance',
    'certificate_of_indigency',
    'residency_certificate',
    'household_certificate',
  ]),
  income: new Set([
    'proof_of_income',
    'employment_certificate',
    'ofw_proof',
    'fisherfolk_certification',
    'farmer_certification',
    'indigenous_peoples_certification',
  ]),
};

function getName(value) {
  return String(value?.name || value?.municipalityName || value?.barangayName || value?.municipality_name || value?.barangay_name || '').trim();
}

function hydrateProfileForm(profile = {}, session = {}) {
  if (profile.firstName || profile.lastName || !profile.fullName) {
    return profile;
  }

  const parts = String(profile.fullName || session.name || '').trim().split(/\s+/).filter(Boolean);
  return {
    ...profile,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function formatSurveyResponseDate(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 'Not answered';
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function mapSurveyValue(value, dictionary = {}) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 'Not answered';
  }

  return dictionary[normalized] || dictionary[normalized.toLowerCase()] || normalized;
}

function mapSurveyList(values, dictionary = {}) {
  const list = Array.isArray(values) ? values : [];
  if (!list.length) {
    return 'Not answered';
  }

  return list
    .map((item) => mapSurveyValue(item, dictionary))
    .filter(Boolean)
    .join(', ');
}

function createSurveyForm(profile = {}) {
  const survey = profile?.searchSurvey || {};
  return {
    assistanceNeeds: Array.isArray(survey.assistanceNeeds)
      ? survey.assistanceNeeds
      : survey.interestCategory
        ? [survey.interestCategory]
        : [],
    applicantTypes: Array.isArray(survey.applicantTypes) ? survey.applicantTypes : [],
    isCurrentResident:
      typeof survey.isCurrentResident === 'boolean'
        ? survey.isCurrentResident
        : null,
    householdIncomeBracket: String(survey.householdIncomeBracket || '').trim(),
    educationStatus: String(survey.educationStatus || profile?.educationStatus || '').trim(),
    wantsProgramNotifications:
      typeof survey.wantsProgramNotifications === 'boolean'
        ? survey.wantsProgramNotifications
        : true,
    programFilterPreference:
      String(survey.programFilterPreference || '').trim() || 'qualified_only',
  };
}

function createFamilyMemberForm() {
  return {
    relationshipType: '',
    relationshipLabel: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    occupation: '',
    employerName: '',
    monthlyIncome: '',
  };
}

function createProfileDocumentForm() {
  return {
    file: null,
    documentType: 'passport',
    documentNumber: '',
    issuedDate: '',
    expiryDate: '',
    notes: '',
  };
}

function getProfileDocumentTypeLabel(documentType) {
  const normalized = String(documentType || '').trim();
  if (!normalized) {
    return 'Other';
  }

  return (
    PROFILE_DOCUMENT_TYPE_LABELS[normalized] ||
    normalized.replace(/_/g, ' ')
  );
}

function getProfileDocumentRule(documentType) {
  const normalized = String(documentType || '').trim();
  if (!normalized) {
    return PROFILE_DOCUMENT_RULES.other;
  }

  return PROFILE_DOCUMENT_RULES[normalized] || PROFILE_DOCUMENT_RULES.other;
}

function addYearsToDateValue(isoDate, years) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  date.setFullYear(date.getFullYear() + Number(years || 0));
  return date.toISOString().split('T')[0];
}

function addMonthsToDateValue(isoDate, months) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  date.setMonth(date.getMonth() + Number(months || 0));
  return date.toISOString().split('T')[0];
}

function getAutoExpiryDate(documentType, issuedDate) {
  const normalizedIssued = String(issuedDate || '').trim();
  if (!normalizedIssued) {
    return '';
  }

  const rule = getProfileDocumentRule(documentType);
  if (rule.expiryYears) {
    return addYearsToDateValue(normalizedIssued, rule.expiryYears);
  }
  if (rule.expiryMonths) {
    return addMonthsToDateValue(normalizedIssued, rule.expiryMonths);
  }
  return '';
}

function validateDocumentNumberForType(documentType, documentNumber) {
  const number = String(documentNumber || '').trim();
  const rule = getProfileDocumentRule(documentType);

  if (!number) {
    return {
      ok: false,
      message: `Document number is required. ${rule.hint}`,
    };
  }

  if (!rule.pattern.test(number)) {
    return {
      ok: false,
      message: `Invalid document number for ${getProfileDocumentTypeLabel(documentType)}. ${rule.hint}`,
    };
  }

  return { ok: true, message: '' };
}

function formatDocumentDateLabel(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '—';
  }
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

function getDocumentVaultGroup(documentType) {
  const normalized = String(documentType || '').trim();
  if (DOCUMENT_VAULT_GROUP_MAP.identification.has(normalized)) {
    return 'identification';
  }
  if (DOCUMENT_VAULT_GROUP_MAP.residency.has(normalized)) {
    return 'residency';
  }
  if (DOCUMENT_VAULT_GROUP_MAP.income.has(normalized)) {
    return 'income';
  }
  return 'other';
}

function getDocumentHealth(document = {}) {
  const verificationStatus = String(document.verificationStatus || 'pending').trim().toLowerCase();
  const expiryDate = String(document.expiryDate || '').trim();
  const parsedExpiry = expiryDate ? new Date(`${expiryDate}T23:59:59`) : null;
  const hasValidExpiry = parsedExpiry && !Number.isNaN(parsedExpiry.getTime());
  const now = new Date();
  const daysRemaining = hasValidExpiry
    ? Math.ceil((parsedExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (typeof daysRemaining === 'number' && daysRemaining <= 30) {
    if (daysRemaining < 0) {
      return {
        label: 'Expired',
        tone: 'expired',
      };
    }
    return {
      label: 'Expiring Soon',
      tone: 'expiring',
    };
  }

  if (verificationStatus === 'verified') {
    return {
      label: 'Verified',
      tone: 'verified',
    };
  }

  if (verificationStatus === 'rejected') {
    return {
      label: 'Needs Update',
      tone: 'rejected',
    };
  }

  return {
    label: 'Active',
    tone: 'active',
  };
}

async function requestProfileDocumentAIPrecheck(payload = {}) {
  const response = await fetch('/api/ai/document-precheck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `AI validation failed with status ${response.status}.`;
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
  return body?.result || body || {};
}

function SelectField({ label, value, options, onChange, placeholder = 'Select an option', disabled = false, className = '' }) {
  return (
    <label className={`pf-profile-field ${className}`.trim()}>
      <span>{label}</span>
      <select disabled={disabled} value={value || ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;

          return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
          );
        })}
      </select>
    </label>
  );
}

export default function ProfileManagementScreen({ data, actions, session }) {
  const [form, setForm] = useState(() => hydrateProfileForm(data.applicantProfile || {}, session));
  const [saving, setSaving] = useState(false);
  const [surveyForm, setSurveyForm] = useState(() => createSurveyForm(data.applicantProfile || {}));
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [familyForm, setFamilyForm] = useState(() => createFamilyMemberForm());
  const [savingFamily, setSavingFamily] = useState(false);
  const [editingFamilyMemberId, setEditingFamilyMemberId] = useState('');
  const [documentForm, setDocumentForm] = useState(() => createProfileDocumentForm());
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentValidationError, setDocumentValidationError] = useState('');
  const [documentExpiryTouched, setDocumentExpiryTouched] = useState(false);

  useEffect(() => {
    setForm(hydrateProfileForm(data.applicantProfile || {}, session));
  }, [data.applicantProfile, session]);

  useEffect(() => {
    setSurveyForm(createSurveyForm(data.applicantProfile || {}));
  }, [data.applicantProfile]);

  const municipalityOptions = useMemo(
    () =>
      [...new Set(
        (data.municipalities || [])
          .filter((municipality) => municipality?.isActive !== false)
          .map(getName)
          .filter(Boolean)
      )].sort(),
    [data.municipalities]
  );
  const selectedMunicipality = String(form.municipality || session?.municipality || '').trim();
  const barangayOptions = useMemo(
    () =>
      [...new Set(
        (data.barangays || [])
          .filter((barangay) => barangay?.isActive !== false)
          .filter((barangay) => !selectedMunicipality || barangay.municipality === selectedMunicipality)
          .map(getName)
          .filter(Boolean)
      )].sort(),
    [data.barangays, selectedMunicipality]
  );
  const isStudentEmployment = String(form.employmentStatus || '').trim().toLowerCase() === 'student';
  const surveySummary = useMemo(() => {
    const profile = data.applicantProfile || {};
    const searchSurvey = profile.searchSurvey || {};

    return {
      assistanceNeed: mapSurveyValue(searchSurvey.interestCategory, ASSISTANCE_LABELS),
      searchPreference: mapSurveyValue(searchSurvey.discoveryMode, DISCOVERY_MODE_LABELS),
      incomeBracket: mapSurveyValue(searchSurvey.householdIncomeBracket, INCOME_BRACKET_LABELS),
      applicantTypes: mapSurveyList(searchSurvey.applicantTypes, APPLICANT_TYPE_LABELS),
      completedAt: formatSurveyResponseDate(searchSurvey.completedAt),
    };
  }, [data.applicantProfile]);
  const completeness = Number(data?.applicantProfile?.completeness || 0);
  const clampedCompleteness = Number.isFinite(completeness)
    ? Math.max(0, Math.min(100, completeness))
    : 0;
  const familyMembers = Array.isArray(data?.applicantProfile?.familyMembers)
    ? data.applicantProfile.familyMembers
    : [];
  const profileDocuments = useMemo(
    () => (Array.isArray(data?.applicantProfileDocuments) ? data.applicantProfileDocuments : []),
    [data?.applicantProfileDocuments]
  );
  const selectedDocumentRule = useMemo(
    () => getProfileDocumentRule(documentForm.documentType),
    [documentForm.documentType]
  );
  const [activeSectionId, setActiveSectionId] = useState(PROFILE_SECTIONS[0]?.id || 'identity');
  const [focusMode, setFocusMode] = useState(true);
  const [viewingVaultDocument, setViewingVaultDocument] = useState(null);
  const [vaultAiValidation, setVaultAiValidation] = useState({
    status: 'idle',
    message: '',
    warnings: [],
  });

  const documentVaultStats = useMemo(() => {
    const total = profileDocuments.length;
    let verified = 0;
    let pending = 0;
    let expiringSoon = 0;

    profileDocuments.forEach((document) => {
      const health = getDocumentHealth(document);
      if (String(document.verificationStatus || '').toLowerCase() === 'verified') {
        verified += 1;
      }
      if (['pending', 'rejected'].includes(String(document.verificationStatus || '').toLowerCase())) {
        pending += 1;
      }
      if (health.tone === 'expiring') {
        expiringSoon += 1;
      }
    });

    return { total, verified, pending, expiringSoon };
  }, [profileDocuments]);

  const groupedProfileDocuments = useMemo(() => {
    const groups = {
      identification: [],
      residency: [],
      income: [],
      other: [],
    };

    profileDocuments.forEach((document) => {
      const groupKey = getDocumentVaultGroup(document.documentType);
      groups[groupKey].push(document);
    });

    return groups;
  }, [profileDocuments]);

  const runVaultDocumentAICheck = async (documentRecord = null) => {
    if (!documentRecord?.fileUrl) {
      setVaultAiValidation({
        status: 'failed',
        message: 'AI validation unavailable because this file URL is missing.',
        warnings: [],
      });
      return;
    }

    setVaultAiValidation({
      status: 'checking',
      message: 'Checking file against the selected document type...',
      warnings: [],
    });

    try {
      const result = await requestProfileDocumentAIPrecheck({
        fileUrl: documentRecord.fileUrl,
        fileName: documentRecord.originalFileName || '',
        fileMimeType: documentRecord.fileMimeType || '',
        applicantName: [form.firstName, form.middleName, form.lastName]
          .map((value) => String(value || '').trim())
          .filter(Boolean)
          .join(' '),
        expectedDocumentType: documentRecord.documentType || '',
        requirementName: getProfileDocumentTypeLabel(documentRecord.documentType),
        requirementDescription: 'Applicant profile document validation.',
      });

      const warnings = Array.isArray(result?.warnings)
        ? result.warnings.map((warning) => String(warning || '').trim()).filter(Boolean)
        : [];
      const confidence = String(result?.confidence || '').toLowerCase();
      const appearsCorrectType = Boolean(result?.appearsCorrectType);
      const status = appearsCorrectType ? 'ok' : 'warn';
      const confidenceLabel = confidence ? ` (${confidence} confidence)` : '';

      setVaultAiValidation({
        status,
        message: appearsCorrectType
          ? `Likely matches the selected type${confidenceLabel}.`
          : `May not match the selected type${confidenceLabel}. Staff review is still final.`,
        warnings,
      });
    } catch (error) {
      setVaultAiValidation({
        status: 'failed',
        message: error?.message || 'AI validation is currently unavailable.',
        warnings: [],
      });
    }
  };

  const openVaultDocumentViewer = async (documentRecord) => {
    setViewingVaultDocument(documentRecord);
    await runVaultDocumentAICheck(documentRecord);
  };

  const resolveScrollContainer = (sectionElement = null) => {
    if (sectionElement?.closest) {
      const closestContainer = sectionElement.closest('.dashboard-content');
      if (closestContainer) {
        return closestContainer;
      }
    }

    return document.querySelector('.dashboard-main .dashboard-content') || document.querySelector('.dashboard-content');
  };

  const jumpToSection = (sectionId) => {
    const targetId = String(sectionId || '').trim();
    if (!targetId) {
      return;
    }

    if (focusMode) {
      setActiveSectionId(targetId);
      return;
    }

    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    const scrollContainer = resolveScrollContainer(element);
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const targetTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 12;

      scrollContainer.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    } else {
      const topOffset = 92;
      const absoluteTop = element.getBoundingClientRect().top + window.scrollY - topOffset;
      window.scrollTo({
        top: Math.max(0, absoluteTop),
        behavior: 'smooth',
      });
    }

    setActiveSectionId(targetId);
  };

  useEffect(() => {
    if (focusMode) {
      return undefined;
    }

    const sectionElements = PROFILE_SECTIONS
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    if (!sectionElements.length || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const scrollContainer = resolveScrollContainer(sectionElements[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSectionId(visible.target.id);
        }
      },
      {
        root: scrollContainer || null,
        rootMargin: scrollContainer ? '-12px 0px -60% 0px' : '-110px 0px -55% 0px',
        threshold: [0.1, 0.25, 0.4, 0.65],
      }
    );

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [focusMode]);

  const updateField = (field, value) => {
    const numericFields = [
      'monthlyPersonalIncome',
      'householdIncome',
      'householdMemberCount',
      'dependentCount',
    ];
    const nextValue = numericFields.includes(field)
      ? String(value || '').replace(/[^\d.]/g, '')
      : value;

    setForm((current) => ({
      ...current,
      [field]: nextValue,
      ...(field === 'municipality' ? { barangay: '' } : null),
      ...(field === 'employmentStatus' && String(nextValue || '').trim().toLowerCase() === 'student'
        ? {
            occupation: '',
            employerName: '',
          }
        : null),
    }));
  };

  const toggleSurveyMultiValue = (field, value) => {
    setSurveyForm((current) => {
      const existing = Array.isArray(current[field]) ? current[field] : [];
      return {
        ...current,
        [field]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
  };

  const startEditFamilyMember = (member) => {
    if (!member) {
      return;
    }

    setEditingFamilyMemberId(member.id || '');
    setFamilyForm({
      relationshipType: String(member.relationshipType || '').trim(),
      relationshipLabel: String(member.relationshipLabel || '').trim(),
      firstName: String(member.firstName || '').trim(),
      middleName: String(member.middleName || '').trim(),
      lastName: String(member.lastName || '').trim(),
      suffix: String(member.suffix || '').trim(),
      occupation: String(member.occupation || '').trim(),
      employerName: String(member.employerName || '').trim(),
      monthlyIncome: String(member.monthlyIncome ?? '').trim(),
    });
  };

  const resetFamilyForm = () => {
    setEditingFamilyMemberId('');
    setFamilyForm(createFamilyMemberForm());
  };

  const updateDocumentType = (documentType) => {
    setDocumentValidationError('');
    setDocumentExpiryTouched(false);
    setDocumentForm((current) => {
      const nextIssuedDate = String(current.issuedDate || '').trim();
      const suggestedExpiry = getAutoExpiryDate(documentType, nextIssuedDate);
      const shouldAutoSetExpiry = true;

      return {
        ...current,
        documentType,
        expiryDate: shouldAutoSetExpiry ? suggestedExpiry : current.expiryDate,
      };
    });
  };

  const updateIssuedDate = (issuedDate) => {
    setDocumentValidationError('');
    setDocumentForm((current) => {
      const suggestedExpiry = getAutoExpiryDate(current.documentType, issuedDate);
      const shouldAutoSetExpiry = !documentExpiryTouched || !String(current.expiryDate || '').trim();
      return {
        ...current,
        issuedDate,
        expiryDate: shouldAutoSetExpiry ? suggestedExpiry : current.expiryDate,
      };
    });
  };

  const updateExpiryDate = (expiryDate) => {
    setDocumentValidationError('');
    setDocumentExpiryTouched(true);
    setDocumentForm((current) => ({
      ...current,
      expiryDate,
    }));
  };

  return (
    <>
      <style>{`
        .pfpm-root {
          display: grid;
          gap: 1rem;
          padding: 4px 0 28px;
        }
        .pfpm-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 20px;
          align-items: start;
        }
        .pfpm-main {
          display: grid;
          gap: 16px;
        }
        .pfpm-main.is-focused > .pfpm-card {
          display: none;
        }
        .pfpm-main.is-focused[data-active-section='identity'] > #identity,
        .pfpm-main.is-focused[data-active-section='address'] > #address,
        .pfpm-main.is-focused[data-active-section='education'] > #education,
        .pfpm-main.is-focused[data-active-section='household'] > #household,
        .pfpm-main.is-focused[data-active-section='needs'] > #needs,
        .pfpm-main.is-focused[data-active-section='family'] > #family,
        .pfpm-main.is-focused[data-active-section='document-vault'] > #document-vault {
          display: grid;
        }
        /* ── Focus bar ─────────────────────────── */
        .pfpm-focus-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid rgba(18,35,58,.10);
          background: #fff;
          padding: 11px 16px;
          box-shadow: 0 1px 3px rgba(18,35,58,.05);
        }
        .pfpm-focus-title {
          display: grid;
          gap: 1px;
        }
        .pfpm-focus-title strong {
          font-size: .93rem;
          color: var(--pf-setting-primary, #0f2f56);
          font-weight: 700;
          letter-spacing: -.01em;
        }
        .pfpm-focus-title span {
          font-size: .73rem;
          color: #586678;
        }
        .pfpm-focus-toggle {
          border: 1.5px solid rgba(15,47,86,.22);
          background: rgba(15,47,86,.06);
          color: var(--pf-setting-primary, #0f2f56);
          min-height: 31px;
          padding: 0 14px;
          font-size: .75rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background .13s ease;
          font-family: inherit;
        }
        .pfpm-focus-toggle:hover {
          background: rgba(15,47,86,.12);
        }
        /* ── Sidebar ──────────────────────────── */
        .pfpm-sidebar {
          display: grid;
          gap: 12px;
          position: sticky;
          top: 84px;
          align-content: start;
        }
        /* ── Card base ────────────────────────── */
        .pfpm-card {
          background: #fff;
          border: 1px solid rgba(18,35,58,.10);
          box-shadow: 0 1px 2px rgba(18,35,58,.04), 0 4px 14px rgba(18,35,58,.04);
          padding: 22px;
          display: grid;
          gap: 18px;
        }
        /* ── Sidebar nav ──────────────────────── */
        .pfpm-nav-title {
          margin: 0;
          color: #586678;
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .10em;
          text-transform: uppercase;
        }
        .pfpm-nav-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pfpm-nav-toggle {
          width: 100%;
          border: 1.5px solid rgba(15,47,86,.20);
          background: rgba(15,47,86,.06);
          color: var(--pf-setting-primary, #0f2f56);
          min-height: 33px;
          font-size: .75rem;
          font-weight: 700;
          cursor: pointer;
          transition: background .13s ease;
          font-family: inherit;
        }
        .pfpm-nav-toggle:hover {
          background: rgba(15,47,86,.12);
        }
        .pfpm-sections {
          display: grid;
          gap: 2px;
        }
        .pfpm-section-link {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 35px;
          padding: 7px 11px;
          text-decoration: none;
          color: #586678;
          border: 1px solid transparent;
          background: transparent;
          font-size: .84rem;
          font-weight: 600;
          transition: background .12s ease, color .12s ease, border-color .12s ease;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }
        .pfpm-section-link:hover {
          color: var(--pf-setting-primary, #0f2f56);
          background: rgba(15,47,86,.05);
        }
        .pfpm-section-link.is-active {
          color: var(--pf-setting-primary, #0f2f56);
          border-color: rgba(15,47,86,.18);
          background: rgba(15,47,86,.08);
          font-weight: 700;
        }
        /* ── Card header ──────────────────────── */
        .pfpm-card-head {
          display: grid;
          gap: 14px;
        }
        .pfpm-card-title {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--pf-setting-primary, #0f2f56);
          letter-spacing: -.01em;
        }
        .pfpm-card-title::before {
          content: '';
          display: inline-block;
          width: 3px;
          height: 18px;
          flex-shrink: 0;
          background: var(--pf-setting-primary, #0f2f56);
        }
        .pfpm-card-divider {
          height: 1px;
          background: rgba(18,35,58,.09);
        }
        /* ── Form grid ────────────────────────── */
        .pf-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 13px;
        }
        .pfpm-card .pf-profile-grid > label,
        .pf-profile-field {
          display: grid;
          gap: 5px;
        }
        .pfpm-card .pf-profile-grid > label > span:first-child,
        .pf-profile-field span {
          color: #576070 !important;
          font-size: .69rem !important;
          font-weight: 700 !important;
          letter-spacing: .06em !important;
          text-transform: uppercase !important;
        }
        .pfpm-card .pf-profile-grid > label > :is(input, textarea),
        .pf-profile-field select {
          min-height: 2.35rem;
          border: 1.5px solid rgba(18,35,58,.14) !important;
          background: #fafafa !important;
          color: var(--pf-ink, #12233a) !important;
          padding: .48rem .68rem !important;
          font-size: .875rem !important;
          line-height: 1.4;
          border-radius: 0 !important;
          box-shadow: none !important;
          transition: border-color .13s ease, box-shadow .13s ease;
        }
        .pfpm-card .pf-profile-grid > label > textarea {
          min-height: 5rem;
          resize: vertical;
        }
        .pfpm-card .pf-profile-grid > label > :is(input, textarea):focus,
        .pf-profile-field select:focus {
          border-color: var(--pf-setting-primary, #0f2f56) !important;
          box-shadow: 0 0 0 3px rgba(15,47,86,.09) !important;
          background: #fff !important;
          outline: none;
        }
        .pfpm-card .pf-profile-grid > label > :is(input, textarea):disabled {
          opacity: .6;
          cursor: not-allowed;
        }
        .pf-profile-field select {
          width: 100%;
          font: inherit;
          cursor: pointer;
        }
        .pf-profile-span-2 {
          grid-column: 1 / -1;
        }
        /* ── Inline note ──────────────────────── */
        .pfpm-inline-note {
          margin: 0;
          font-size: .75rem;
          line-height: 1.5;
          color: #586678;
          border: 1px solid rgba(15,47,86,.10);
          background: rgba(15,47,86,.04);
          padding: .5rem .68rem;
        }
        /* ── Profile readiness ring ───────────── */
        .pfpm-readiness {
          display: grid;
          justify-items: center;
          text-align: center;
          gap: 10px;
          padding: 6px 4px 4px;
        }
        .pfpm-readiness-ring {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(
            var(--pf-setting-primary, #0f2f56) calc(var(--progress, 0) * 1%),
            rgba(18,35,58,.12) 0
          );
          display: grid;
          place-items: center;
        }
        .pfpm-readiness-inner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fff;
          display: grid;
          place-items: center;
        }
        .pfpm-readiness-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--pf-setting-primary, #0f2f56);
          line-height: 1;
        }
        .pfpm-readiness-label {
          font-size: .76rem;
          font-weight: 700;
          color: var(--pf-setting-secondary, #8d6e37);
          letter-spacing: .02em;
        }
        .pfpm-readiness-text {
          margin: 0;
          font-size: .73rem;
          color: #586678;
          line-height: 1.55;
        }
        /* ── Intake card (sidebar) ────────────── */
        .pfpm-intake-card {
          background: #fff;
          border: 1px solid rgba(18,35,58,.10);
          color: var(--pf-setting-primary-text, #111827);
          padding: 18px;
          display: grid;
          gap: 12px;
          box-shadow: 0 1px 2px rgba(18,35,58,.04);
        }
        .pfpm-intake-title {
          margin: 0;
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .10em;
          text-transform: uppercase;
          color: #586678;
        }
        .pfpm-intake-need {
          border: 1px solid rgba(15,47,86,.14);
          background: rgba(15,47,86,.05);
          padding: 12px 14px;
          display: grid;
          gap: 5px;
        }
        .pfpm-intake-need-label {
          font-size: .66rem;
          color: #586678;
          text-transform: uppercase;
          letter-spacing: .07em;
          font-weight: 700;
        }
        .pfpm-intake-need-value {
          font-size: .92rem;
          line-height: 1.3;
          color: var(--pf-setting-primary, #0f2f56);
          font-weight: 700;
          margin: 0;
        }
        .pfpm-intake-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .pfpm-intake-item {
          display: grid;
          gap: 4px;
          min-width: 0;
          border: 1px solid rgba(18,35,58,.09);
          background: rgba(18,35,58,.02);
          padding: 9px 10px;
        }
        .pfpm-intake-item span {
          font-size: .63rem;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: #586678;
          font-weight: 700;
        }
        .pfpm-intake-item strong {
          font-size: .80rem;
          line-height: 1.4;
          color: var(--pf-setting-primary, #0f2f56);
          overflow-wrap: anywhere;
          font-weight: 700;
        }
        .pfpm-intake-item.pfpm-intake-full {
          grid-column: 1 / -1;
        }
        /* ── Chips / multi-select tags ────────── */
        .pfpm-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
        .pfpm-chip {
          border: 1.5px solid rgba(18,35,58,.14);
          background: #fff;
          padding: 5px 12px;
          font-size: .79rem;
          font-weight: 600;
          color: #586678;
          cursor: pointer;
          transition: border-color .12s ease, background .12s ease, color .12s ease;
          font-family: inherit;
        }
        .pfpm-chip:hover {
          border-color: rgba(15,47,86,.30);
          color: var(--pf-setting-primary, #0f2f56);
          background: rgba(15,47,86,.04);
        }
        .pfpm-chip.is-active {
          background: rgba(15,47,86,.09);
          border-color: rgba(15,47,86,.34);
          color: var(--pf-setting-primary, #0f2f56);
          font-weight: 700;
        }
        /* ── Inline actions ───────────────────── */
        .pfpm-inline-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        /* ── Family member table ──────────────── */
        .pfpm-table {
          border: 1px solid rgba(18,35,58,.09);
          overflow: hidden;
        }
        .pfpm-table-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid rgba(18,35,58,.07);
          align-items: center;
          background: #fff;
          transition: background .12s ease;
        }
        .pfpm-table-row:hover {
          background: rgba(15,47,86,.03);
        }
        .pfpm-table-row:first-child {
          border-top: 0;
        }
        .pfpm-table-title {
          margin: 0 0 3px;
          font-size: .875rem;
          font-weight: 700;
          color: var(--pf-setting-primary, #0f2f56);
        }
        .pfpm-table-meta {
          margin: 0;
          font-size: .77rem;
          color: #586678;
          line-height: 1.5;
        }
        .pfpm-table-buttons {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        /* ── Document vault ───────────────────── */
        .pfpm-doc-link {
          font-weight: 700;
          color: var(--pf-setting-primary, #0f2f56);
          text-decoration: none;
          font-size: .79rem;
        }
        .pfpm-doc-link:hover {
          text-decoration: underline;
        }
        .pfpm-field-help {
          margin: 3px 0 0;
          font-size: .72rem;
          color: #586678;
          line-height: 1.45;
        }
        .pfpm-field-error {
          margin: 3px 0 0;
          font-size: .73rem;
          color: #8f4436;
          line-height: 1.45;
          font-weight: 700;
        }
        .pfpm-vault-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pfpm-vault-subtitle {
          margin: 5px 0 0;
          color: #586678;
          font-size: .78rem;
          line-height: 1.5;
        }
        .pfpm-vault-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .pfpm-vault-metric {
          border: 1px solid rgba(18,35,58,.09);
          border-top: 3px solid rgba(18,35,58,.18);
          background: #fff;
          padding: 12px 14px;
          display: grid;
          gap: 5px;
        }
        .pfpm-vault-metric.is-verified { border-top-color: #1f6e3d; }
        .pfpm-vault-metric.is-expiring { border-top-color: #8d6e37; }
        .pfpm-vault-metric label {
          font-size: .63rem;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #617286;
          font-weight: 700;
        }
        .pfpm-vault-metric strong {
          font-size: 1.5rem;
          line-height: 1;
          color: var(--pf-setting-primary, #0f2f56);
          font-weight: 800;
        }
        .pfpm-vault-metric.is-verified strong { color: #1f6e3d; }
        .pfpm-vault-metric.is-expiring strong { color: #8d6e37; }
        .pfpm-vault-group {
          display: grid;
          gap: 10px;
        }
        .pfpm-vault-group-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .pfpm-vault-group-head h4 {
          margin: 0;
          font-size: .875rem;
          font-weight: 700;
          color: var(--pf-setting-primary, #0f2f56);
        }
        .pfpm-vault-group-head span {
          font-size: .73rem;
          color: #617386;
          font-weight: 600;
        }
        .pfpm-vault-table {
          border: 1px solid rgba(18,35,58,.09);
          overflow: hidden;
          background: #fff;
        }
        .pfpm-vault-table-head,
        .pfpm-vault-table-row {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) 150px 150px 150px 170px;
          gap: 8px;
          align-items: center;
          padding: 10px 13px;
        }
        .pfpm-vault-table-head {
          background: rgba(15,47,86,.04);
          border-bottom: 1px solid rgba(18,35,58,.09);
          color: #586678;
          font-size: .67rem;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
        }
        .pfpm-vault-table-row {
          border-top: 1px solid rgba(18,35,58,.07);
          font-size: .82rem;
          color: var(--pf-setting-primary, #0f2f56);
          transition: background .12s ease;
        }
        .pfpm-vault-table-row:hover {
          background: rgba(15,47,86,.03);
        }
        .pfpm-vault-table-head span:last-child {
          text-align: right;
        }
        .pfpm-vault-doc strong {
          display: block;
          font-size: .84rem;
          color: var(--pf-setting-primary, #0f2f56);
          line-height: 1.35;
          font-weight: 700;
        }
        .pfpm-vault-doc small {
          color: #647589;
          font-size: .73rem;
        }
        /* ── Status badges ────────────────────── */
        .pfpm-vault-status {
          justify-self: start;
          padding: 3px 8px;
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .02em;
        }
        .pfpm-vault-status.is-active    { background: #e5f0ea; color: #1f6e3d; }
        .pfpm-vault-status.is-verified  { background: #e5f0ea; color: #1f6e3d; }
        .pfpm-vault-status.is-pending   { background: rgba(15,47,86,.07); color: #586678; }
        .pfpm-vault-status.is-rejected  { background: rgba(143,68,54,.10); color: #8f4436; }
        .pfpm-vault-status.is-expiring  { background: rgba(195,161,93,.16); color: #8d6e37; }
        .pfpm-vault-status.is-expired   { background: rgba(143,68,54,.10); color: #8f4436; }
        .pfpm-vault-table-row .pfpm-table-buttons {
          justify-content: flex-end;
        }
        /* ── Upload panel / empty ─────────────── */
        .pfpm-vault-empty {
          padding: 24px 16px;
          text-align: center;
          border: 1px dashed rgba(18,35,58,.14);
          background: rgba(18,35,58,.02);
          color: #617388;
          font-size: .81rem;
        }
        .pfpm-doc-view-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, .42);
          display: grid;
          place-items: center;
          padding: 20px;
          z-index: 60;
        }
        .pfpm-doc-view-modal {
          width: min(760px, 100%);
          max-height: min(90vh, 820px);
          overflow: auto;
          background: #ffffff;
          border: 1px solid rgba(18,35,58,.16);
          border-radius: 12px;
          padding: 16px;
          display: grid;
          gap: 12px;
        }
        .pfpm-doc-view-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .pfpm-doc-view-title {
          margin: 0;
          font-size: .98rem;
          color: var(--pf-setting-primary, #0f2f56);
        }
        .pfpm-doc-view-subtitle {
          margin: 4px 0 0;
          font-size: .78rem;
          color: #586678;
        }
        .pfpm-doc-view-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 12px;
        }
        .pfpm-doc-view-item label {
          display: block;
          font-size: .66rem;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: #6c7d92;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .pfpm-doc-view-item span {
          font-size: .82rem;
          color: var(--pf-setting-primary, #0f2f56);
          word-break: break-word;
        }
        .pfpm-doc-view-preview {
          border: 1px solid rgba(18,35,58,.12);
          background: rgba(18,35,58,.03);
          border-radius: 10px;
          min-height: 180px;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .pfpm-doc-view-preview img {
          display: block;
          max-width: 100%;
          max-height: 320px;
          object-fit: contain;
        }
        .pfpm-ai-flag {
          border: 1px solid rgba(18,35,58,.13);
          border-radius: 9px;
          padding: 10px 12px;
          background: rgba(18,35,58,.03);
          font-size: .78rem;
          color: #41546b;
        }
        .pfpm-ai-flag.is-ok {
          border-color: rgba(31,110,61,.35);
          background: rgba(31,110,61,.09);
          color: #1f6e3d;
        }
        .pfpm-ai-flag.is-warn {
          border-color: rgba(141,110,55,.35);
          background: rgba(141,110,55,.11);
          color: #7d6030;
        }
        .pfpm-ai-flag.is-failed {
          border-color: rgba(143,68,54,.30);
          background: rgba(143,68,54,.10);
          color: #8f4436;
        }
        .pfpm-doc-view-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pfpm-upload-panel {
          border: 1px solid rgba(18,35,58,.10);
          padding: 14px;
          background: rgba(18,35,58,.02);
        }
        .pfpm-upload-summary {
          cursor: pointer;
          font-size: .83rem;
          font-weight: 700;
          color: var(--pf-setting-primary, #0f2f56);
          list-style: none;
          user-select: none;
        }
        .pfpm-upload-summary::-webkit-details-marker {
          display: none;
        }
        .pfpm-upload-summary::after {
          content: '▾';
          float: right;
          color: #5d7087;
        }
        .pfpm-upload-panel[open] .pfpm-upload-summary::after {
          content: '▴';
        }
        /* ── Save row ─────────────────────────── */
        .pfpm-save-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 4px 0 2px;
          border-top: 1px solid rgba(18,35,58,.08);
          margin-top: 4px;
        }
        .pfpm-save-note {
          flex: 1;
          font-size: .72rem;
          color: #586678;
        }
        .pfpm-save-row button {
          min-width: 150px;
          font-family: var(--pf-font-body, var(--font-body));
          font-size: .875rem;
          font-weight: 700;
          letter-spacing: .01em;
          line-height: 1.2;
        }
        .pfpm-save-profile-btn,
        .pfpm-save-profile-btn span {
          color: var(--pf-setting-tertiary-text, #6b7280) !important;
        }
        /* ── Checkbox style ───────────────────── */
        .pfpm-checkbox-row {
          display: flex;
          align-items: center;
          gap: 9px;
          grid-column: 1 / -1;
        }
        .pfpm-checkbox-row input[type='checkbox'] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          flex-shrink: 0;
          accent-color: var(--pf-setting-primary, #0f2f56);
        }
        .pfpm-checkbox-row span {
          font-size: .84rem;
          color: var(--pf-setting-primary, #0f2f56) !important;
          font-weight: 600 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }
        /* ── Section label (chip header) ──────── */
        .pfpm-field-group-label {
          font-size: .69rem;
          font-weight: 700;
          color: #576070;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 2px;
          display: block;
        }
        /* ── Responsive ───────────────────────── */
        @media (max-width: 980px) {
          .pfpm-layout {
            grid-template-columns: 1fr;
          }
          .pfpm-sidebar {
            position: static;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            order: -1;
          }
        }
        @media (max-width: 760px) {
          .pfpm-sidebar {
            grid-template-columns: 1fr;
          }
          .pf-profile-grid {
            grid-template-columns: 1fr;
          }
          .pf-profile-span-2 {
            grid-column: auto;
          }
          .pfpm-table-row {
            grid-template-columns: 1fr;
          }
          .pfpm-vault-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pfpm-vault-table-head {
            display: none;
          }
          .pfpm-vault-table-row {
            grid-template-columns: 1fr;
            gap: 6px;
            padding: 10px;
          }
          .pfpm-intake-grid {
            grid-template-columns: 1fr;
          }
          .pfpm-doc-view-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="pfpm-root">
        <div className="pfpm-layout">
          <div
            className={`pfpm-main ${focusMode ? 'is-focused' : ''}`.trim()}
            data-active-section={activeSectionId}
          >
            <div className="pfpm-focus-bar">
              <div className="pfpm-focus-title">
                <strong>{PROFILE_SECTIONS.find((section) => section.id === activeSectionId)?.label || 'Profile'}</strong>
                <span>{focusMode ? 'Focused section view to reduce clutter.' : 'Showing all profile sections.'}</span>
              </div>
              <button type="button" className="pfpm-focus-toggle" onClick={() => setFocusMode((value) => !value)}>
                {focusMode ? 'Show all sections' : 'Focus current section'}
              </button>
            </div>
            <article className="pfpm-card" id="identity">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Personal Identity</h3>
                <div className="pfpm-card-divider" />
              </div>
            <div className="pf-profile-grid">
              <FormField className="pfpm-field" label="First Name" required value={form.firstName || ''} onChange={(value) => updateField('firstName', value)} />
              <FormField className="pfpm-field" label="Middle Name" value={form.middleName || ''} onChange={(value) => updateField('middleName', value)} />
              <FormField className="pfpm-field" label="Last Name" required value={form.lastName || ''} onChange={(value) => updateField('lastName', value)} />
              <FormField className="pfpm-field" label="Suffix" value={form.suffix || ''} onChange={(value) => updateField('suffix', value)} />
              <FormField className="pfpm-field" label="Email" required type="email" value={form.email || ''} onChange={(value) => updateField('email', value)} />
              <FormField className="pfpm-field" label="Phone Number" required value={form.phone || ''} onChange={(value) => updateField('phone', value)} />
              <FormField className="pfpm-field" label="Alternate Contact Number" value={form.alternateContactNumber || ''} onChange={(value) => updateField('alternateContactNumber', value)} />
              <FormField className="pfpm-field" label="Birth Date" required type="date" value={form.birthDate || ''} onChange={(value) => updateField('birthDate', value)} />
              <SelectField className="pfpm-field" label="Sex" value={form.sex || ''} options={SEX_OPTIONS} onChange={(value) => updateField('sex', value)} />
              <SelectField className="pfpm-field" label="Civil Status" value={form.civilStatus || ''} options={CIVIL_STATUS_OPTIONS} onChange={(value) => updateField('civilStatus', value)} />
              <FormField className="pfpm-field pf-profile-span-2" label="Citizenship" value={form.citizenship || 'Filipino'} onChange={(value) => updateField('citizenship', value)} />
            </div>
            </article>

            <article className="pfpm-card" id="address">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Address Information</h3>
                <div className="pfpm-card-divider" />
              </div>
            <div className="pf-profile-grid">
              <SelectField className="pfpm-field" label="Municipality" value={form.municipality || selectedMunicipality} options={municipalityOptions} onChange={(value) => updateField('municipality', value)} />
              <SelectField className="pfpm-field" label="Barangay" value={form.barangay || ''} options={barangayOptions} onChange={(value) => updateField('barangay', value)} />
              <FormField className="pfpm-field" label="House / Lot / Block" value={form.houseNumber || ''} onChange={(value) => updateField('houseNumber', value)} />
              <FormField className="pfpm-field" label="Street" value={form.streetName || ''} onChange={(value) => updateField('streetName', value)} />
              <FormField className="pfpm-field" label="Subdivision / Village" value={form.subdivisionArea || ''} onChange={(value) => updateField('subdivisionArea', value)} />
              <FormField className="pfpm-field" label="ZIP Code" value={form.zipCode || ''} onChange={(value) => updateField('zipCode', value)} />
              <FormField className="pfpm-field pf-profile-span-2" label="Complete Address" type="textarea" value={form.address || ''} onChange={(value) => updateField('address', value)} />
            </div>
            </article>

            <article className="pfpm-card" id="education">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Education and Eligibility</h3>
                <div className="pfpm-card-divider" />
              </div>
            <div className="pf-profile-grid">
              <SelectField className="pfpm-field" label="Educational Attainment" value={form.educationStatus || ''} options={EDUCATION_OPTIONS} onChange={(value) => updateField('educationStatus', value)} />
              <SelectField className="pfpm-field" label="Employment Status" value={form.employmentStatus || ''} options={EMPLOYMENT_STATUS_OPTIONS} onChange={(value) => updateField('employmentStatus', value)} />
              <FormField
                className="pfpm-field"
                disabled={isStudentEmployment}
                label="Occupation"
                placeholder={isStudentEmployment ? 'Not required for student applicants' : ''}
                value={form.occupation || ''}
                onChange={(value) => updateField('occupation', value)}
              />
              <FormField
                className="pfpm-field"
                disabled={isStudentEmployment}
                label="Employer name"
                placeholder={isStudentEmployment ? 'Not required for student applicants' : ''}
                value={form.employerName || ''}
                onChange={(value) => updateField('employerName', value)}
              />
              <FormField className="pfpm-field" label="Monthly Personal Income" type="number" value={form.monthlyPersonalIncome || ''} onChange={(value) => updateField('monthlyPersonalIncome', value)} />
              <SelectField className="pfpm-field" label="Special Category" value={form.specialCategory || ''} options={SPECIAL_CATEGORY_OPTIONS} onChange={(value) => updateField('specialCategory', value)} />
              {isStudentEmployment ? (
                <p className="pfpm-inline-note pf-profile-span-2">
                  Student employment status selected: occupation and employer name are not required.
                </p>
              ) : null}
            </div>
            </article>

            <article className="pfpm-card" id="household">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Household Details</h3>
                <div className="pfpm-card-divider" />
              </div>
            <div className="pf-profile-grid">
              <FormField className="pfpm-field" label="Monthly Household Income" type="number" value={form.householdIncome || ''} onChange={(value) => updateField('householdIncome', value)} />
              <FormField className="pfpm-field" label="Household Member Count" type="number" value={form.householdMemberCount || ''} onChange={(value) => updateField('householdMemberCount', value)} />
              <FormField className="pfpm-field" label="Dependent Count" type="number" value={form.dependentCount || ''} onChange={(value) => updateField('dependentCount', value)} />
              <SelectField className="pfpm-field" label="Housing Status" value={form.housingStatus || ''} options={HOUSING_STATUS_OPTIONS} onChange={(value) => updateField('housingStatus', value)} />
              <p className="pfpm-inline-note pf-profile-span-2">
                Dependent count = how many people currently rely on your income or support.
              </p>
            </div>
            </article>

            <article className="pfpm-card" id="needs">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Applicant Survey Preferences</h3>
                <div className="pfpm-card-divider" />
              </div>
              <div className="pf-profile-grid">
                <SelectField
                  className="pfpm-field"
                  label="Household Income Bracket"
                  value={surveyForm.householdIncomeBracket}
                  options={Object.entries(INCOME_BRACKET_LABELS).map(([value, label]) => ({ value, label }))}
                  onChange={(value) => setSurveyForm((current) => ({ ...current, householdIncomeBracket: value }))}
                />
                <SelectField
                  className="pfpm-field"
                  label="Education Status"
                  value={surveyForm.educationStatus}
                  options={EDUCATION_OPTIONS}
                  onChange={(value) => setSurveyForm((current) => ({ ...current, educationStatus: value }))}
                />
                <SelectField
                  className="pfpm-field"
                  label="Current Resident"
                  value={
                    surveyForm.isCurrentResident === null
                      ? ''
                      : surveyForm.isCurrentResident
                        ? 'yes'
                        : 'no'
                  }
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                  onChange={(value) => {
                    setSurveyForm((current) => ({
                      ...current,
                      isCurrentResident:
                        value === 'yes' ? true : value === 'no' ? false : null,
                    }));
                  }}
                />
                <SelectField
                  className="pfpm-field"
                  label="Program Filter Preference"
                  value={surveyForm.programFilterPreference}
                  options={SURVEY_PROGRAM_FILTER_OPTIONS}
                  onChange={(value) => setSurveyForm((current) => ({ ...current, programFilterPreference: value }))}
                />
                <div className="pf-profile-span-2">
                  <span className="pfpm-field-group-label">Assistance Needs</span>
                  <div className="pfpm-chip-grid">
                    {SURVEY_ASSISTANCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`pfpm-chip ${surveyForm.assistanceNeeds.includes(option.value) ? 'is-active' : ''}`}
                        onClick={() => toggleSurveyMultiValue('assistanceNeeds', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pf-profile-span-2">
                  <span className="pfpm-field-group-label">Applicant Types</span>
                  <div className="pfpm-chip-grid">
                    {SURVEY_APPLICANT_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`pfpm-chip ${surveyForm.applicantTypes.includes(option.value) ? 'is-active' : ''}`}
                        onClick={() => toggleSurveyMultiValue('applicantTypes', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="pfpm-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(surveyForm.wantsProgramNotifications)}
                    onChange={(event) =>
                      setSurveyForm((current) => ({
                        ...current,
                        wantsProgramNotifications: event.target.checked,
                      }))}
                  />
                  <span>Receive program notifications</span>
                </label>
              </div>
              <div className="pfpm-inline-actions">
                <AppButton
                  disabled={savingSurvey}
                  onClick={async () => {
                    setSavingSurvey(true);
                    try {
                      await actions.saveApplicantSurvey?.(surveyForm);
                    } finally {
                      setSavingSurvey(false);
                    }
                  }}
                  variant="secondary"
                >
                  {savingSurvey ? 'Saving survey...' : 'Save survey preferences'}
                </AppButton>
              </div>
            </article>

            <article className="pfpm-card" id="family">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Family Members</h3>
                <div className="pfpm-card-divider" />
              </div>
              <div className="pf-profile-grid">
                <SelectField
                  className="pfpm-field"
                  label="Relationship Type"
                  value={familyForm.relationshipType}
                  options={FAMILY_RELATIONSHIP_OPTIONS}
                  onChange={(value) => setFamilyForm((current) => ({ ...current, relationshipType: value }))}
                />
                <FormField className="pfpm-field" label="Relationship Label" value={familyForm.relationshipLabel} onChange={(value) => setFamilyForm((current) => ({ ...current, relationshipLabel: value }))} />
                <FormField className="pfpm-field" label="First Name" value={familyForm.firstName} onChange={(value) => setFamilyForm((current) => ({ ...current, firstName: value }))} />
                <FormField className="pfpm-field" label="Middle Name" value={familyForm.middleName} onChange={(value) => setFamilyForm((current) => ({ ...current, middleName: value }))} />
                <FormField className="pfpm-field" label="Last Name" value={familyForm.lastName} onChange={(value) => setFamilyForm((current) => ({ ...current, lastName: value }))} />
                <FormField className="pfpm-field" label="Suffix" value={familyForm.suffix} onChange={(value) => setFamilyForm((current) => ({ ...current, suffix: value }))} />
                <FormField className="pfpm-field" label="Occupation" value={familyForm.occupation} onChange={(value) => setFamilyForm((current) => ({ ...current, occupation: value }))} />
                <FormField className="pfpm-field" label="Employer Name" value={familyForm.employerName} onChange={(value) => setFamilyForm((current) => ({ ...current, employerName: value }))} />
                <FormField className="pfpm-field" label="Monthly Income" type="number" value={familyForm.monthlyIncome} onChange={(value) => setFamilyForm((current) => ({ ...current, monthlyIncome: value }))} />
              </div>
              <div className="pfpm-inline-actions">
                <AppButton
                  disabled={savingFamily}
                  onClick={async () => {
                    if (!familyForm.relationshipType) {
                      return;
                    }
                    setSavingFamily(true);
                    try {
                      if (editingFamilyMemberId) {
                        const result = await actions.updateApplicantFamilyMember?.(
                          editingFamilyMemberId,
                          familyForm
                        );
                        if (result?.ok) {
                          resetFamilyForm();
                        }
                      } else {
                        const result = await actions.addApplicantFamilyMember?.(familyForm);
                        if (result?.ok) {
                          resetFamilyForm();
                        }
                      }
                    } finally {
                      setSavingFamily(false);
                    }
                  }}
                  variant="secondary"
                >
                  {savingFamily
                    ? editingFamilyMemberId
                      ? 'Updating member...'
                      : 'Adding member...'
                    : editingFamilyMemberId
                      ? 'Update family member'
                      : 'Add family member'}
                </AppButton>
                {editingFamilyMemberId ? (
                  <AppButton onClick={resetFamilyForm} variant="ghost">Cancel edit</AppButton>
                ) : null}
              </div>
              <div className="pfpm-table">
                {!familyMembers.length ? (
                  <div className="pfpm-table-row">
                    <p className="pfpm-table-meta">No family member records yet.</p>
                  </div>
                ) : (
                  familyMembers.map((member) => (
                    <div className="pfpm-table-row" key={member.id}>
                      <div>
                        <p className="pfpm-table-title">
                          {member.relationshipLabel || FAMILY_RELATIONSHIP_LABELS[member.relationshipType] || member.relationshipType || 'Family Member'}
                        </p>
                        <p className="pfpm-table-meta">
                          {[member.firstName, member.middleName, member.lastName, member.suffix].filter(Boolean).join(' ') || 'No name provided'}
                        </p>
                        <p className="pfpm-table-meta">
                          {member.occupation || 'No occupation'} | {member.monthlyIncome ? `Php ${member.monthlyIncome}` : 'No monthly income'}
                        </p>
                      </div>
                      <div className="pfpm-table-buttons">
                        <AppButton onClick={() => startEditFamilyMember(member)} size="sm" variant="ghost">Edit</AppButton>
                        <AppButton
                          onClick={async () => {
                            await actions.deleteApplicantFamilyMember?.(member.id);
                            if (editingFamilyMemberId === member.id) {
                              resetFamilyForm();
                            }
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          Delete
                        </AppButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="pfpm-card" id="document-vault">
              <div className="pfpm-vault-head">
                <div>
                  <h3 className="pfpm-card-title" style={{ marginBottom: 6 }}>Document Vault</h3>
                  <p className="pfpm-vault-subtitle">
                    Securely manage and track your digital credentials for program applications.
                  </p>
                </div>
              </div>

              <div className="pfpm-vault-metrics">
                <article className="pfpm-vault-metric">
                  <label>Total Documents</label>
                  <strong>{documentVaultStats.total}</strong>
                </article>
                <article className="pfpm-vault-metric is-verified">
                  <label>Verified</label>
                  <strong>{documentVaultStats.verified}</strong>
                </article>
                <article className="pfpm-vault-metric">
                  <label>Pending</label>
                  <strong>{documentVaultStats.pending}</strong>
                </article>
                <article className="pfpm-vault-metric is-expiring">
                  <label>Expiring Soon</label>
                  <strong>{documentVaultStats.expiringSoon}</strong>
                </article>
              </div>

              <details className="pfpm-upload-panel">
                <summary className="pfpm-upload-summary">Add or update a profile document</summary>
                <div className="pf-profile-grid" style={{ marginTop: 10 }}>
                  <SelectField
                    className="pfpm-field"
                    label="Document Type"
                    value={documentForm.documentType}
                    options={PROFILE_DOCUMENT_TYPE_OPTIONS}
                    onChange={updateDocumentType}
                  />
                  <div className="pfpm-field">
                    <FormField
                      className="pfpm-field"
                      label="Document Number"
                      value={documentForm.documentNumber}
                      onChange={(value) => {
                        setDocumentValidationError('');
                        setDocumentForm((current) => ({ ...current, documentNumber: value.toUpperCase() }));
                      }}
                    />
                    <p className="pfpm-field-help">{selectedDocumentRule.hint}</p>
                    {documentValidationError ? <p className="pfpm-field-error">{documentValidationError}</p> : null}
                  </div>
                  <FormField className="pfpm-field" label="Issued Date" type="date" value={documentForm.issuedDate} onChange={updateIssuedDate} />
                  <div className="pfpm-field">
                    <FormField className="pfpm-field" label="Expiry Date" type="date" value={documentForm.expiryDate} onChange={updateExpiryDate} />
                    <p className="pfpm-field-help">
                      Expiry date is auto-suggested from issued date and can still be edited.
                    </p>
                  </div>
                  <FormField className="pfpm-field pf-profile-span-2" label="Notes" type="textarea" value={documentForm.notes} onChange={(value) => setDocumentForm((current) => ({ ...current, notes: value }))} />
                  <label className="pf-profile-span-2 pf-profile-field">
                    <span>Select file</span>
                    <input
                      type="file"
                      onChange={(event) =>
                        setDocumentForm((current) => ({
                          ...current,
                          file: event.target.files?.[0] || null,
                        }))}
                    />
                  </label>
                </div>
                <div className="pfpm-inline-actions" style={{ marginTop: 10 }}>
                  <AppButton
                    disabled={uploadingDocument || !documentForm.file}
                    onClick={async () => {
                      if (!documentForm.file) {
                        return;
                      }
                      const numberValidation = validateDocumentNumberForType(
                        documentForm.documentType,
                        documentForm.documentNumber
                      );
                      if (!numberValidation.ok) {
                        setDocumentValidationError(numberValidation.message);
                        return;
                      }
                      const issuedDate = String(documentForm.issuedDate || '').trim();
                      const expiryDate = String(documentForm.expiryDate || '').trim();
                      if (issuedDate && expiryDate && new Date(expiryDate) < new Date(issuedDate)) {
                        setDocumentValidationError('Expiry date cannot be earlier than issued date.');
                        return;
                      }
                      setUploadingDocument(true);
                      try {
                        const result = await actions.uploadApplicantProfileDocument?.({
                          ...documentForm,
                          expiryDate: expiryDate || getAutoExpiryDate(documentForm.documentType, issuedDate),
                        });
                        if (result?.ok) {
                          setDocumentValidationError('');
                          setDocumentExpiryTouched(false);
                          setDocumentForm(createProfileDocumentForm());
                        }
                      } finally {
                        setUploadingDocument(false);
                      }
                    }}
                    variant="secondary"
                  >
                    {uploadingDocument ? 'Uploading...' : 'Upload to vault'}
                  </AppButton>
                </div>
              </details>

              {[
                { key: 'identification', label: 'Identification' },
                { key: 'residency', label: 'Residency' },
                { key: 'income', label: 'Income' },
              ].map((group) => {
                const records = groupedProfileDocuments[group.key] || [];
                return (
                  <section className="pfpm-vault-group" key={group.key}>
                    <div className="pfpm-vault-group-head">
                      <h4>{group.label}</h4>
                      <span>{records.length} file{records.length === 1 ? '' : 's'}</span>
                    </div>
                    {!records.length ? (
                      <div className="pfpm-vault-empty">No documents uploaded yet.</div>
                    ) : (
                      <div className="pfpm-vault-table">
                        <div className="pfpm-vault-table-head">
                          <span>Document Name</span>
                          <span>Status</span>
                          <span>Issue Date</span>
                          <span>Expiry Date</span>
                          <span>Actions</span>
                        </div>
                        {records.map((document) => {
                          const health = getDocumentHealth(document);
                          return (
                            <div className="pfpm-vault-table-row" key={document.id}>
                              <div className="pfpm-vault-doc">
                                <strong>{document.originalFileName || getProfileDocumentTypeLabel(document.documentType)}</strong>
                                <small>{getProfileDocumentTypeLabel(document.documentType)}</small>
                              </div>
                              <span className={`pfpm-vault-status is-${health.tone}`}>{health.label}</span>
                              <span>{formatDocumentDateLabel(document.issuedDate)}</span>
                              <span>{formatDocumentDateLabel(document.expiryDate)}</span>
                              <div className="pfpm-table-buttons">
                                <AppButton
                                  onClick={() => {
                                    openVaultDocumentViewer(document);
                                  }}
                                  size="sm"
                                  variant="secondary"
                                >
                                  View
                                </AppButton>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </article>
            {viewingVaultDocument ? (
              <div
                className="pfpm-doc-view-overlay"
                onClick={() => {
                  setViewingVaultDocument(null);
                  setVaultAiValidation({ status: 'idle', message: '', warnings: [] });
                }}
                role="presentation"
              >
                <div className="pfpm-doc-view-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
                  <div className="pfpm-doc-view-head">
                    <div>
                      <h4 className="pfpm-doc-view-title">Attachment Details</h4>
                      <p className="pfpm-doc-view-subtitle">
                        Review your uploaded file details and AI validation flag.
                      </p>
                    </div>
                    <AppButton
                      onClick={() => {
                        setViewingVaultDocument(null);
                        setVaultAiValidation({ status: 'idle', message: '', warnings: [] });
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Close
                    </AppButton>
                  </div>

                  <div className="pfpm-doc-view-grid">
                    <div className="pfpm-doc-view-item">
                      <label>File Name</label>
                      <span>{viewingVaultDocument.originalFileName || 'Not provided'}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Document Type</label>
                      <span>{getProfileDocumentTypeLabel(viewingVaultDocument.documentType)}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Status</label>
                      <span>{getDocumentHealth(viewingVaultDocument).label}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Verification State</label>
                      <span>{String(viewingVaultDocument.verificationStatus || '').trim() || 'pending'}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Document Number</label>
                      <span>{viewingVaultDocument.documentNumber || 'Not provided'}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Uploaded</label>
                      <span>{formatDocumentDateLabel(viewingVaultDocument.uploadedAt)}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Issue Date</label>
                      <span>{formatDocumentDateLabel(viewingVaultDocument.issuedDate)}</span>
                    </div>
                    <div className="pfpm-doc-view-item">
                      <label>Expiry Date</label>
                      <span>{formatDocumentDateLabel(viewingVaultDocument.expiryDate)}</span>
                    </div>
                  </div>

                  <div className={`pfpm-ai-flag ${vaultAiValidation.status === 'ok' ? 'is-ok' : vaultAiValidation.status === 'warn' ? 'is-warn' : vaultAiValidation.status === 'failed' ? 'is-failed' : ''}`.trim()}>
                    <strong>AI validation:</strong>{' '}
                    {vaultAiValidation.status === 'checking'
                      ? 'Checking file...'
                      : vaultAiValidation.message || 'No AI flag available yet.'}
                    {vaultAiValidation.warnings?.length ? (
                      <div style={{ marginTop: 6 }}>
                        {vaultAiValidation.warnings.join(' | ')}
                      </div>
                    ) : null}
                  </div>

                  <div className="pfpm-doc-view-preview">
                    {String(viewingVaultDocument.fileMimeType || '').startsWith('image/') && viewingVaultDocument.fileUrl ? (
                      <img
                        alt={viewingVaultDocument.originalFileName || 'Uploaded document'}
                        src={viewingVaultDocument.fileUrl}
                      />
                    ) : (
                      <span style={{ fontSize: '.78rem', color: '#607187' }}>
                        Preview unavailable for this file type. Use the open button below.
                      </span>
                    )}
                  </div>

                  {viewingVaultDocument.notes ? (
                    <div className="pfpm-doc-view-item">
                      <label>Notes</label>
                      <span>{viewingVaultDocument.notes}</span>
                    </div>
                  ) : null}

                  <div className="pfpm-doc-view-actions">
                    {['pending', 'rejected'].includes(String(viewingVaultDocument.verificationStatus || '').toLowerCase()) ? (
                      <AppButton
                        onClick={async () => {
                          await actions.deleteApplicantProfileDocument?.(viewingVaultDocument.id);
                          setViewingVaultDocument(null);
                          setVaultAiValidation({ status: 'idle', message: '', warnings: [] });
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        Delete
                      </AppButton>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            {PROFILE_FORM_SECTION_IDS.has(activeSectionId) || !focusMode ? (
              <div className="pfpm-save-row">
                <span className="pfpm-save-note">Changes are saved per section and do not publish automatically.</span>
                <AppButton
                  className="pfpm-save-profile-btn"
                  labelClassName="pfpm-save-profile-btn-label"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await actions.saveApplicantProfile({
                        ...form,
                        occupation: isStudentEmployment ? '' : form.occupation,
                        employerName: isStudentEmployment ? '' : form.employerName,
                        fullName: [form.firstName, form.middleName, form.lastName, form.suffix]
                          .map((value) => String(value || '').trim())
                          .filter(Boolean)
                          .join(' '),
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  style={{ color: 'var(--pf-setting-tertiary-text, #6b7280)' }}
                  variant="primary"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </AppButton>
              </div>
            ) : null}
          </div>

          <aside className="pfpm-sidebar">
            <article className="pfpm-card">
              <p className="pfpm-nav-title">Sections</p>
              <nav className="pfpm-sections" aria-label="Profile sections">
                {PROFILE_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    className={`pfpm-section-link ${activeSectionId === section.id ? 'is-active' : ''}`}
                    onClick={() => jumpToSection(section.id)}
                    type="button"
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
              <button type="button" className="pfpm-nav-toggle" onClick={() => setFocusMode((value) => !value)}>
                {focusMode ? 'Focused View — On' : 'Focused View — Off'}
              </button>
            </article>
            <article className="pfpm-card">
              <div className="pfpm-card-head">
                <h3 className="pfpm-card-title">Profile Readiness</h3>
              </div>
              <div className="pfpm-readiness">
                <div className="pfpm-readiness-ring" style={{ '--progress': clampedCompleteness }}>
                  <div className="pfpm-readiness-inner">
                    <span className="pfpm-readiness-value">{clampedCompleteness}%</span>
                  </div>
                </div>
                <div className="pfpm-readiness-label">Profile Complete</div>
                <p className="pfpm-readiness-text">
                  Complete your profile to improve program eligibility matching.
                </p>
              </div>
            </article>

            <article className="pfpm-intake-card">
              <p className="pfpm-intake-title">Applicant Intake Record</p>
              <div className="pfpm-intake-need">
                <div className="pfpm-intake-need-label">Primary Assistance Need</div>
                <div className="pfpm-intake-need-value">{surveySummary.assistanceNeed}</div>
              </div>
              <div className="pfpm-intake-grid">
                <div className="pfpm-intake-item">
                  <span>Income Bracket</span>
                  <strong>{surveySummary.incomeBracket}</strong>
                </div>
                <div className="pfpm-intake-item">
                  <span>Last Updated</span>
                  <strong>{surveySummary.completedAt}</strong>
                </div>
                <div className="pfpm-intake-item pfpm-intake-full">
                  <span>Applicant Type</span>
                  <strong>{surveySummary.applicantTypes}</strong>
                </div>
                <div className="pfpm-intake-item pfpm-intake-full">
                  <span>Search Preference</span>
                  <strong>{surveySummary.searchPreference}</strong>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </>
  );
}
