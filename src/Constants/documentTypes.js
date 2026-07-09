export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'valid_id', label: 'Valid Government ID' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'pwd_id', label: 'PWD ID' },
  { value: 'senior_citizen_id', label: 'Senior Citizen ID' },
  { value: 'solo_parent_id', label: 'Solo Parent ID' },
  { value: 'barangay_certificate', label: 'Barangay Certificate' },
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'certificate_of_indigency', label: 'Certificate of Indigency' },
  { value: 'proof_of_income', label: 'Proof of Income' },
  { value: 'school_id', label: 'School ID' },
  { value: 'registration_form', label: 'Registration Form' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'residency_certificate', label: 'Residency Certificate' },
  { value: 'employment_certificate', label: 'Employment Certificate' },
  { value: 'ofw_proof', label: 'OFW Proof' },
  { value: 'fisherfolk_certification', label: 'Fisherfolk Certification' },
  { value: 'farmer_certification', label: 'Farmer Certification' },
  { value: 'indigenous_peoples_certification', label: 'Indigenous Peoples Certification' },
  { value: 'household_certificate', label: 'Household Certificate' },
  { value: 'grade_report', label: 'Grade Report' },
  { value: 'transcript_of_records', label: 'Transcript of Records' },
  { value: 'enrollment_certificate', label: 'Enrollment Certificate' },
];

const DOCUMENT_TYPE_ALIASES = {
  government_id: 'valid_id',
  proof_of_residency: 'residency_certificate',
  medical_record: 'medical_certificate',
  school_card: 'school_id',
  income_proof: 'proof_of_income',
};

const DOCUMENT_TYPE_COMPATIBILITY = {
  valid_id: ['driver_license', 'passport', 'pwd_id', 'senior_citizen_id', 'solo_parent_id'],
  driver_license: ['valid_id'],
  passport: ['valid_id'],
  pwd_id: ['valid_id'],
  senior_citizen_id: ['valid_id'],
  solo_parent_id: ['valid_id'],
};

export const DOCUMENT_TYPE_LABELS = DOCUMENT_TYPE_OPTIONS.reduce((summary, item) => {
  summary[item.value] = item.label;
  return summary;
}, {});

export function normalizeDocumentTypeKey(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return DOCUMENT_TYPE_ALIASES[normalized] || normalized;
}

export function uniqueDocumentTypes(values = []) {
  const source = Array.isArray(values) ? values : [values];
  return [...new Set(source.map(normalizeDocumentTypeKey).filter(Boolean))];
}

export function getDocumentTypeLabel(value) {
  const normalized = normalizeDocumentTypeKey(value);
  return DOCUMENT_TYPE_LABELS[normalized] || String(value || '').trim() || 'Not specified';
}

export function getDocumentTypeCompatibilityKeys(value) {
  const normalized = normalizeDocumentTypeKey(value);
  if (!normalized) {
    return [];
  }

  const directMatches = DOCUMENT_TYPE_COMPATIBILITY[normalized] || [];
  return uniqueDocumentTypes([normalized, ...directMatches]);
}

export function getAcceptedDocumentTypeMatchSet(values = []) {
  const acceptedSet = new Set();
  uniqueDocumentTypes(values).forEach((type) => {
    getDocumentTypeCompatibilityKeys(type).forEach((matchKey) => acceptedSet.add(matchKey));
  });
  return acceptedSet;
}

export function isDocumentTypeAccepted(documentType, acceptedDocumentTypes = []) {
  const acceptedMatchSet = getAcceptedDocumentTypeMatchSet(acceptedDocumentTypes);
  if (!acceptedMatchSet.size) {
    return false;
  }

  const documentMatchKeys = getDocumentTypeCompatibilityKeys(documentType);
  return documentMatchKeys.some((key) => acceptedMatchSet.has(key));
}

export function getDocumentTypeOptions({ includeEmpty = false } = {}) {
  return includeEmpty
    ? [{ value: '', label: 'Not specified' }, ...DOCUMENT_TYPE_OPTIONS]
    : DOCUMENT_TYPE_OPTIONS;
}

export function formatDocumentTypeList(values = [], fallback = 'Not specified') {
  const normalized = uniqueDocumentTypes(values);
  return normalized.length ? normalized.map(getDocumentTypeLabel).join(', ') : fallback;
}
