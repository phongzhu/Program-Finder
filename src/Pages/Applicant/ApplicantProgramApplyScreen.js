import { useState } from 'react';
import {
  ApplicantProgramApplyLayout,
  FileTriggerButton,
  FormField,
} from 'Components/UI';
import {
  formatDocumentTypeList,
  getDocumentTypeLabel,
  isDocumentTypeAccepted,
  uniqueDocumentTypes,
} from 'Constants/documentTypes';
import {
  formatProgramDate,
  getApplicantDocuments,
  getProgramById,
} from 'Services/Applicant/applicant-utils';

/* ============================================================
   ICON COMPONENT
============================================================ */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'arrow-left':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.75" y="5.25" width="16.5" height="15" rx="2" />
          <path d="M7.5 3.75v3M16.5 3.75v3M3.75 9.5h16.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.25l2.75 1.75" />
        </svg>
      );
    case 'office':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M4 9l8-5 8 5" />
        </svg>
      );
    case 'document':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3.75h6l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 20.25V5.25A1.5 1.5 0 0 1 8.5 3.75Z" />
          <path d="M14 3.75v4h4M10 12h4M10 15.5h4" />
        </svg>
      );
    case 'check':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'upload':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V5M8 9l4-4 4 4M5 19h14" />
        </svg>
      );
    case 'user':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case 'chevron-up':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 15 6-6 6 6" />
        </svg>
      );
    case 'edit':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="m16.5 3.5 4 4L7 21l-4 1 1-4Z" />
        </svg>
      );
    case 'warning':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 2.7 20h18.6L12 3Z" />
          <path d="M12 9v5M12 17h.01" />
        </svg>
      );
    default:
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

/* ============================================================
   UTILITY FUNCTIONS
============================================================ */
function displayReadonlyValue(value, fallback = 'Not provided') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function toSentenceCase(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  return text
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatPeso(value) {
  const amount = Number(String(value || '').replace(/[^\d.]+/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return 'Not provided';
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
}

function formatApplicantAddress(profile = {}, session = {}) {
  const fallback = String(profile.address || '').trim();
  if (fallback) return fallback;
  const parts = [
    profile.houseNumber,
    profile.streetName,
    profile.subdivisionArea,
    profile.barangay,
    profile.municipality || session.municipality,
    profile.zipCode,
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : 'Not provided';
}

function getDaysUntilDate(dateValue) {
  const raw = String(dateValue || '').trim();
  if (!raw) return null;
  const endDate = new Date(`${raw}T23:59:59`);
  if (Number.isNaN(endDate.getTime())) return null;
  return Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getAiPrecheckDisplay(document) {
  const status = String(document?.aiCheckStatus || 'not_checked').toLowerCase();
  if (status === 'likely_valid')  return { tone: 'ok',     message: 'AI pre-check: File appears to match.' };
  if (status === 'warning')       return { tone: 'warn',   message: 'AI pre-check: This may not match the required document.' };
  if (status === 'unreadable')    return { tone: 'danger', message: 'AI pre-check: File is unclear. Please upload a clearer copy.' };
  if (status === 'failed')        return { tone: 'muted',  message: 'AI pre-check unavailable. Staff will still review it.' };
  if (status === 'checking')      return { tone: 'muted',  message: 'AI pre-check: Checking file quality...' };
  return null;
}

function normalizeDocumentTypeKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

const DOCUMENT_TYPE_ALIASES = {
  government_id: 'valid_id',
  proof_of_residency: 'residency_certificate',
  medical_record: 'medical_certificate',
  school_card: 'school_id',
  income_proof: 'proof_of_income',
};

function toDocumentTypeKey(value) {
  const normalized = normalizeDocumentTypeKey(value);
  return DOCUMENT_TYPE_ALIASES[normalized] || normalized;
}

function getRequirementAcceptedDocumentTypes(requirement = {}) {
  const linkedTypes = uniqueDocumentTypes(
    requirement?.acceptedDocumentTypes || requirement?.accepted_document_types || []
  );
  return linkedTypes.map(toDocumentTypeKey);
}

function getCompatibleVaultDocuments(acceptedTypes = [], vaultDocuments = []) {
  if (!(acceptedTypes || []).length) {
    return [];
  }

  const matches = (vaultDocuments || []).filter((document) => {
    const verificationStatus = String(document?.verificationStatus || '').toLowerCase();
    if (verificationStatus === 'rejected') return false;

    const documentType = toDocumentTypeKey(document?.documentType || '');
    return isDocumentTypeAccepted(documentType, acceptedTypes);
  });

  return matches.sort((left, right) => {
    const leftStatus = String(left?.verificationStatus || '').toLowerCase();
    const rightStatus = String(right?.verificationStatus || '').toLowerCase();
    if (leftStatus !== rightStatus) {
      if (leftStatus === 'verified') return -1;
      if (rightStatus === 'verified') return 1;
    }
    return String(right.uploadedAt || '').localeCompare(String(left.uploadedAt || ''));
  });
}

function formatVaultStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'verified') return 'Verified';
  if (normalized === 'pending') return 'Pending verification';
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Available';
}

function DocumentTypeBadges({ acceptedTypes = [] }) {
  if (!acceptedTypes.length) {
    return (
      <span style={{ fontSize: 12, color: '#8f2f28', fontWeight: 600 }}>
        Not configured
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {acceptedTypes.map((type) => (
        <span
          key={type}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 24,
            padding: '3px 9px',
            borderRadius: 999,
            background: '#edf3ff',
            border: '1px solid #c8d8f5',
            color: '#1f3f73',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {getDocumentTypeLabel(type)}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */
export default function ApplicantProgramApplyScreen({ session, data, actions, navigate }) {
  const selectedProgram = getProgramById(data.programs, data.composer.programId);
  const requirementItems = selectedProgram?.requirementRecords?.length
    ? selectedProgram.requirementRecords.map((r) => ({ ...r, isRequired: r?.isRequired ?? true }))
    : (selectedProgram?.requirements || []).map((name) => ({ name, isRequired: true }));

  const attachedDocs        = data.composer.attachedDocs;
  const applicantDocuments  = getApplicantDocuments(data, session);
  const applicantProfile    = data.applicantProfile || {};
  const vaultDocuments = Array.isArray(data.applicantProfileDocuments)
    ? data.applicantProfileDocuments.filter(
        (document) => !session?.id || String(document?.applicantUserId || '') === String(session.id)
      )
    : [];
  const [uploadError, setUploadError]         = useState('');
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [vaultSyncTarget, setVaultSyncTarget] = useState('');
  const [removingTarget, setRemovingTarget] = useState('');
  const [selectedUploadTypes, setSelectedUploadTypes] = useState({});
  const requirementTemplates = Array.isArray(data?.requirementTemplates) ? data.requirementTemplates : [];
  const requirementTemplateById = requirementTemplates.reduce((summary, template) => {
    const templateId = String(template?.id || '').trim();
    if (templateId) {
      summary[templateId] = template;
    }
    return summary;
  }, {});
  const requirementTemplateTypesByName = requirementTemplates.reduce((summary, template) => {
    const templateName = String(template?.name || template?.requirementName || '').trim().toLowerCase();
    if (templateName && !summary[templateName]) {
      summary[templateName] = getRequirementAcceptedDocumentTypes(template);
    }
    return summary;
  }, {});

  const getRequirementName = (req) => req?.name || req?.requirementName || req;
  const getRequirementAcceptedTypes = (requirement) => {
    const directTypes = getRequirementAcceptedDocumentTypes(requirement);
    if (directTypes.length) {
      return directTypes;
    }

    const linkedTemplateId = String(
      requirement?.requirementTemplateId || requirement?.requirement_template_id || ''
    ).trim();
    if (linkedTemplateId && requirementTemplateById[linkedTemplateId]) {
      const templateTypes = getRequirementAcceptedDocumentTypes(requirementTemplateById[linkedTemplateId]);
      if (templateTypes.length) {
        return templateTypes;
      }
    }

    const requirementNameKey = String(getRequirementName(requirement) || '').trim().toLowerCase();
    return requirementTemplateTypesByName[requirementNameKey] || [];
  };
  const requiredRequirementItems = requirementItems.filter((item) => item?.isRequired !== false);
  const getRequirementDocument = (req) =>
    applicantDocuments.find(
      (doc) =>
        (!data.composer.applicationId || !doc.applicationId || doc.applicationId === data.composer.applicationId) &&
        doc.name.toLowerCase() === getRequirementName(req).toLowerCase()
    );

  const handleRequirementUpload = async (req, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reqName = getRequirementName(req);
    const acceptedTypes = getRequirementAcceptedTypes(req);
    if (!acceptedTypes.length) {
      setUploadError(`No accepted document types are configured for "${reqName}". Please contact the program office.`);
      return;
    }
    const selectedType = toDocumentTypeKey(selectedUploadTypes[reqName] || acceptedTypes[0]);
    if (!isDocumentTypeAccepted(selectedType, acceptedTypes)) {
      const acceptedLabels = acceptedTypes.map((type) => getDocumentTypeLabel(type));
      setUploadError(
        `This document type is not accepted for ${reqName}. Please choose ${acceptedLabels.join(', ')}.`
      );
      return;
    }

    setUploadError('');
    const result = await actions.uploadRequirementFile(reqName, {
      file,
      documentType: selectedType,
      acceptedDocumentTypes: acceptedTypes,
    });
    if (!result?.ok) {
      setUploadError(result?.error || 'File upload failed. Please try again.');
      return;
    }
    if (!attachedDocs.includes(reqName)) {
      actions.attachRequirement(reqName);
    }
  };

  const handleRequirementVaultReuse = async (req) => {
    const reqName = getRequirementName(req);
    setUploadError('');
    setVaultSyncTarget(reqName);
    const result = await actions.reuseVaultDocumentsForApplication(reqName);
    setVaultSyncTarget('');

    if (!result?.ok) {
      setUploadError(result?.error || 'Unable to reuse a document from your vault.');
      return;
    }

    if (!result.requirementLinked) {
      setUploadError(`No compatible document found in your vault for "${reqName}".`);
    }
  };

  const handleRequirementRemove = async (req, savedDoc) => {
    const reqName = getRequirementName(req);
    actions.requestConfirmation({
      title: 'Remove attached file?',
      message: `This will remove the current file for "${reqName}" from your application draft.`,
      confirmLabel: 'Remove File',
      tone: 'danger',
      onConfirm: async () => {
        setRemovingTarget(reqName);
        setUploadError('');
        const result = await actions.removeRequirementFile(reqName, {
          applicationId: data.composer.applicationId,
          applicationDocumentId: savedDoc?.id || '',
          requirementId: req?.id || req?.requirementId || '',
        });
        setRemovingTarget('');

        if (!result?.ok) {
          setUploadError(result?.error || 'Unable to remove this requirement file.');
        }
      },
    });
  };

  /* --- Derived state --- */
  const requirementProgress = !selectedProgram
    ? { completed: 0, total: 0 }
    : {
        completed: requiredRequirementItems.filter((req) => {
          const doc = getRequirementDocument(req);
          const isUnreadable = String(doc?.aiCheckStatus || '').toLowerCase() === 'unreadable';
          return attachedDocs.includes(getRequirementName(req)) && Boolean(doc?.fileUrl || doc?.fileName) && !isUnreadable;
        }).length,
        total: requiredRequirementItems.length,
      };

  const totalRequirements   = requirementProgress.total || 0;
  const missingRequired     = Math.max(totalRequirements - requirementProgress.completed, 0);
  const readinessPercent    = totalRequirements > 0
    ? Math.round((requirementProgress.completed / totalRequirements) * 100)
    : 0;

  const profileDetailsConfirmed = Boolean(
    (applicantProfile.fullName || session.name) &&
    (applicantProfile.email    || session.email) &&
    (applicantProfile.phone    || session.mobileNumber) &&
    applicantProfile.municipality &&
    applicantProfile.barangay
  );
  const eligibilityCriteriaMet = Boolean(
    applicantProfile.birthDate &&
    applicantProfile.civilStatus &&
    (applicantProfile.householdIncome || applicantProfile.monthlyPersonalIncome)
  );
  const canSubmit =
    totalRequirements > 0 &&
    missingRequired === 0 &&
    profileDetailsConfirmed &&
    eligibilityCriteriaMet;

  const currentDraft   = data.applications.find((a) => a.id === data.composer.applicationId);
  const deadlineDays   = getDaysUntilDate(
    selectedProgram?.deadline || selectedProgram?.applicationEndDate || selectedProgram?.application_end_date
  );
  const deadlineMeta =
    typeof deadlineDays === 'number'
      ? deadlineDays < 0
        ? 'Intake closed'
        : deadlineDays === 0
          ? 'Closes today'
          : `Closes in ${deadlineDays} day${deadlineDays === 1 ? '' : 's'}`
      : 'Deadline not listed';
  const draftSavedLabel = currentDraft?.updatedAt
    ? `Draft saved · ${formatProgramDate(currentDraft.updatedAt)}`
    : 'Draft saved automatically';

  /* ============================================================
     EMPTY STATE
  ============================================================ */
  if (!selectedProgram) {
    return (
      <ApplicantProgramApplyLayout>
        <div className="apa-empty-state">
          <span className="apa-empty-eyebrow">Program Application</span>
          <h1 className="apa-empty-title">No program selected</h1>
          <p className="apa-empty-body">
            Go to Search Programs and choose a program, then click Apply to begin your application.
          </p>
          <button
            type="button"
            className="apa-primary-btn"
            onClick={() => navigate('/applicant/search-programs')}
          >
            <Icon name="arrow-left" size={14} />
            Back to Search Programs
          </button>
        </div>
      </ApplicantProgramApplyLayout>
    );
  }

  /* ============================================================
     MAIN RENDER
  ============================================================ */
  return (
    <ApplicantProgramApplyLayout>

      {/* ========================================================
          HEADER CARD
      ======================================================== */}
      <div className="apa-header-card">
        <div className="apa-breadcrumb">
          <button
            type="button"
            className="apa-back-btn"
            onClick={() => actions.openProgramDetails(selectedProgram.id)}
          >
            <Icon name="arrow-left" size={14} />
            Back to program
          </button>
          <span className="apa-draft-label">{draftSavedLabel}</span>
        </div>

        <h1 className="apa-header-title">{selectedProgram.title}</h1>

        <div className="apa-header-meta">
          {selectedProgram.office ? (
            <span className="apa-header-meta-item">
              <Icon name="office" size={14} />
              {selectedProgram.office}
            </span>
          ) : null}

          {formatProgramDate(selectedProgram.deadline) ? (
            <>
              <span className="apa-header-sep">·</span>
              <span className="apa-header-meta-item">
                <Icon name="calendar" size={14} />
                {formatProgramDate(selectedProgram.deadline)}
              </span>
            </>
          ) : null}

          <span className="apa-header-sep">·</span>
          <span className="apa-deadline-badge">
            <Icon name="clock" size={12} />
            {deadlineMeta}
          </span>

          <span className="apa-official-badge">Official Program</span>
        </div>
      </div>

      {/* ========================================================
          MAIN TWO-COLUMN LAYOUT
      ======================================================== */}
      <div className="apa-main">

        {/* ---- PRIMARY COLUMN ---- */}
        <div className="apa-main-primary">

          {/* ---- APPLICANT INFO PANEL ---- */}
          <div className="apa-panel">
            <div className="apa-panel-top">
              <div className="apa-applicant-identity">
                <div className="apa-avatar">
                  <Icon name="user" size={18} />
                </div>
                <div>
                  <p className="apa-applicant-name">
                    {displayReadonlyValue(applicantProfile.fullName || session.name)}
                  </p>
                  <p className="apa-applicant-contact">
                    {displayReadonlyValue(applicantProfile.email || session.email)}
                    {(applicantProfile.municipality || session.municipality)
                      ? ` · ${displayReadonlyValue(applicantProfile.municipality || session.municipality)}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="apa-panel-actions">
                <button
                  type="button"
                  className="apa-ghost-btn"
                  onClick={() => navigate('/applicant/profile-management')}
                >
                  <Icon name="edit" size={13} />
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="apa-ghost-btn"
                  onClick={() => setProfileExpanded((v) => !v)}
                  aria-expanded={profileExpanded}
                >
                  {profileExpanded ? 'Hide Details' : 'View Details'}
                  <Icon name={profileExpanded ? 'chevron-up' : 'chevron-down'} size={13} />
                </button>
              </div>
            </div>

            {profileExpanded ? (
              <div className="apa-profile-table">
                <div className="apa-profile-row">
                  <span className="apa-profile-label">Email Address</span>
                  <span className="apa-profile-value">{displayReadonlyValue(applicantProfile.email || session.email)}</span>
                </div>
                <div className="apa-profile-row">
                  <span className="apa-profile-label">Phone Number</span>
                  <span className="apa-profile-value">{displayReadonlyValue(applicantProfile.phone || session.mobileNumber)}</span>
                </div>
                <div className="apa-profile-row">
                  <span className="apa-profile-label">Civil Status</span>
                  <span className="apa-profile-value">{displayReadonlyValue(toSentenceCase(applicantProfile.civilStatus))}</span>
                </div>
                <div className="apa-profile-row">
                  <span className="apa-profile-label">Monthly Income</span>
                  <span className="apa-profile-value">{formatPeso(applicantProfile.monthlyPersonalIncome || applicantProfile.householdIncome)}</span>
                </div>
                <div className="apa-profile-row">
                  <span className="apa-profile-label">Home Address</span>
                  <span className="apa-profile-value">{formatApplicantAddress(applicantProfile, session)}</span>
                </div>
                <div className="apa-profile-row">
                  <span className="apa-profile-label">Municipality</span>
                  <span className="apa-profile-value">{displayReadonlyValue(applicantProfile.municipality || session.municipality)}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* ---- REQUIRED DOCUMENTS PANEL ---- */}
          <div className="apa-panel">
            <div className="apa-panel-top">
              <div className="apa-panel-top-copy">
                <span className="apa-eyebrow">Required Documents</span>
                <h2 className="apa-panel-title">Upload supporting files for each requirement</h2>
              </div>
              <span className="apa-docs-count-badge">
                {requirementItems.length} item{requirementItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="apa-panel-body">
              <div className="apa-vault-tip">
                <div className="apa-vault-tip-copy">
                  <Icon name="document" size={14} />
                  <span>
                    Tip: Upload common documents to your vault so you can reuse them across applications.
                  </span>
                </div>
                <button
                  type="button"
                  className="apa-vault-setup-btn"
                  onClick={() => navigate('/applicant/profile-management')}
                >
                  Set up vault
                </button>
              </div>

              {/* Supporting notes */}
              <div style={{ display: 'grid', gap: 6 }}>
                <span className="apa-notes-label">
                  Supporting Notes{' '}
                  <span className="apa-notes-opt">(optional)</span>
                </span>
                <FormField
                  controlStyle={{
                    minHeight: 88,
                    borderRadius: 10,
                    background: '#f8fafd',
                    fontSize: 14,
                    lineHeight: 1.6,
                    border: '1px solid #d0daea',
                  }}
                  onChange={(value) => actions.updateComposerNotes(value)}
                  placeholder="Add context or instructions for the reviewing office..."
                  style={{ display: 'grid', gap: 0 }}
                  type="textarea"
                  value={data.composer.notes}
                />
              </div>

              {/* Upload error */}
              {uploadError ? (
                <div className="apa-upload-error">{uploadError}</div>
              ) : null}

              {/* Requirement cards */}
              <div className="apa-req-list">
                {requirementItems.map((req, index) => {
                  const reqName      = getRequirementName(req);
                  const attached     = attachedDocs.includes(reqName);
                  const savedDoc     = getRequirementDocument(req);
                  const acceptedTypes = getRequirementAcceptedTypes(req);
                  const hasConfiguredTypes = acceptedTypes.length > 0;
                  const selectedUploadType = toDocumentTypeKey(selectedUploadTypes[reqName] || acceptedTypes[0] || '');
                  const vaultMatches = getCompatibleVaultDocuments(acceptedTypes, vaultDocuments);
                  const hasVaultMatch = vaultMatches.length > 0;
                  const hasUpload    = Boolean(savedDoc?.fileUrl || savedDoc?.fileName);
                  const isUnreadable = String(savedDoc?.aiCheckStatus || '').toLowerCase() === 'unreadable';
                  const isReady      = attached && hasUpload && !isUnreadable;
                  const aiPrecheck   = getAiPrecheckDisplay(savedDoc);

                  let statusLabel = 'Pending';
                  let statusClass = 'is-pending';
                  if (isReady)              { statusLabel = 'Ready';    statusClass = 'is-ready'; }
                  else if (attached || hasUpload) { statusLabel = 'Uploaded'; statusClass = 'is-uploaded'; }

                  return (
                    <article
                      key={req.id || reqName}
                      className={`apa-req-card${isReady ? ' is-ready' : ''}`}
                    >
                      {/* Card header row */}
                      <div className="apa-req-card-top">
                        <span className="apa-req-num">{index + 1}</span>
                        <div className="apa-req-card-info">
                          <span className="apa-req-name">{reqName}{req?.isRequired === false ? ' (Optional)' : ''}</span>
                          <span className="apa-req-hint">
                            Accepted documents: {formatDocumentTypeList(acceptedTypes, 'Not configured')} · {req?.allowMultipleFiles ? 'Multiple files allowed' : 'One document only'}
                          </span>
                        </div>
                        <span className={`apa-status-chip ${statusClass}`}>{statusLabel}</span>
                      </div>

                      {/* Card body */}
                      <div className="apa-req-card-body">
                        <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: '#5a7090' }}>
                            Required document type for this attachment
                          </span>
                          <DocumentTypeBadges acceptedTypes={acceptedTypes} />
                        </div>

                        <div className={`apa-upload-meta-row${savedDoc ? ' is-single' : ''}`}>
                          <div style={{ display: 'grid', gap: 6 }}>
                            <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#5a7090' }}>
                              Document type for this upload
                              <select
                                value={selectedUploadType}
                                onChange={(event) =>
                                  setSelectedUploadTypes((current) => ({
                                    ...current,
                                    [reqName]: toDocumentTypeKey(event.target.value),
                                  }))
                                }
                                disabled={!hasConfiguredTypes}
                                style={{
                                  height: 34,
                                  borderRadius: 8,
                                  border: '1px solid #c0d0ea',
                                  background: '#ffffff',
                                  color: '#1a3356',
                                  padding: '0 10px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {hasConfiguredTypes ? (
                                  acceptedTypes.map((type) => (
                                    <option key={type} value={type}>{getDocumentTypeLabel(type)}</option>
                                  ))
                                ) : (
                                  <option value="">No configured document type</option>
                                )}
                              </select>
                            </label>
                          </div>

                          {!savedDoc ? (
                            <div className="apa-vault-match-row">
                              <div className="apa-vault-match-copy">
                                {hasVaultMatch ? (
                                  <>
                                    <strong>Vault match available.</strong>{' '}
                                    {vaultMatches
                                      .slice(0, 3)
                                      .map((item) =>
                                        `${item.originalFileName || getDocumentTypeLabel(item.documentType)} (${formatVaultStatus(item.verificationStatus)})`
                                      )
                                      .join(' | ')}
                                  </>
                                ) : (
                                  <>
                                    <strong>No vault match yet.</strong> Add an accepted document type in your Document Vault first.
                                  </>
                                )}
                              </div>

                              {hasVaultMatch && hasConfiguredTypes ? (
                                <button
                                  type="button"
                                  className="apa-vault-use-btn"
                                  onClick={() => handleRequirementVaultReuse(req)}
                                  disabled={vaultSyncTarget === reqName}
                                >
                                  {vaultSyncTarget === reqName ? 'Linking...' : 'Use from vault'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="apa-vault-use-btn is-secondary"
                                  onClick={() => navigate('/applicant/profile-management')}
                                >
                                  Open vault
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {!hasConfiguredTypes ? (
                          <div className="apa-upload-error" style={{ marginBottom: 10 }}>
                            No accepted document type is configured for this requirement. Automatic vault matching is disabled until the office updates the requirement setup.
                          </div>
                        ) : null}

                        {savedDoc ? (
                          /* File already uploaded — show preview */
                          <div className="apa-file-preview">
                            <div className="apa-file-icon">
                              <Icon name="document" size={16} />
                            </div>
                            <div className="apa-file-info">
                              <span className="apa-file-name">{savedDoc.fileName || savedDoc.name}</span>
                              <span className="apa-file-meta">
                                {[
                                  savedDoc.fileType || savedDoc.category,
                                  savedDoc.uploadedAt ? `Uploaded ${savedDoc.uploadedAt}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                              {aiPrecheck ? (
                                <span className={`apa-ai-badge ${aiPrecheck.tone}`}>
                                  {(aiPrecheck.tone === 'warn' || aiPrecheck.tone === 'danger')
                                    ? <Icon name="warning" size={10} />
                                    : null}
                                  {aiPrecheck.message}
                                </span>
                              ) : null}
                            </div>
                            <div className="apa-file-actions">
                              {savedDoc.fileUrl ? (
                                <a
                                  href={savedDoc.fileUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                  className="apa-file-view-link"
                                >
                                  View
                                </a>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleRequirementRemove(req, savedDoc)}
                                disabled={removingTarget === reqName}
                                style={{
                                  minHeight: 30,
                                  borderRadius: 7,
                                  padding: '4px 10px',
                                  border: '1px solid #f0c2bf',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: '#fff4f3',
                                  color: '#a0352d',
                                  cursor: removingTarget === reqName ? 'not-allowed' : 'pointer',
                                  opacity: removingTarget === reqName ? 0.7 : 1,
                                }}
                              >
                                {removingTarget === reqName ? 'Removing...' : 'Remove'}
                              </button>
                              <FileTriggerButton
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                disabled={!hasConfiguredTypes}
                                leading={<Icon name="upload" size={12} />}
                                onChange={(event) => handleRequirementUpload(req, event)}
                                style={{
                                  minHeight: 30,
                                  borderRadius: 7,
                                  padding: '4px 10px',
                                  border: '1px solid #c0d0ea',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: '#ffffff',
                                  color: '#2a4e8c',
                                  cursor: 'pointer',
                                }}
                              >
                                Replace
                              </FileTriggerButton>
                            </div>
                          </div>
                        ) : (
                          /* No file yet — show upload zone */
                          <>
                            {hasConfiguredTypes ? (
                              <FileTriggerButton
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                fullWidth
                                leading={<Icon name="upload" size={16} />}
                                onChange={(event) => handleRequirementUpload(req, event)}
                                style={{
                                  width: '100%',
                                  minHeight: 68,
                                  borderRadius: 10,
                                  border: '1.5px dashed #c0cfe3',
                                  background: '#f8fafd',
                                  fontSize: 14,
                                  color: '#5a7090',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  transition: 'border-color 0.15s, background 0.15s',
                                }}
                              >
                                Click or drag to upload file
                              </FileTriggerButton>
                            ) : null}

                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ---- SUMMARY SIDEBAR ---- */}
        <div className="apa-summary-panel">
          <div className="apa-summary-rail">
            <div className="apa-summary-card">
              <div className="apa-summary-top">
                <span className="apa-eyebrow">Application Summary</span>
              </div>

              <div className="apa-summary-body">
                {/* Deadline */}
                <div className="apa-deadline-alert">
                  <Icon name="clock" size={15} />
                  <span className="apa-deadline-alert-text">{deadlineMeta}</span>
                  {formatProgramDate(selectedProgram.deadline) ? (
                    <span className="apa-deadline-alert-date">
                      {formatProgramDate(selectedProgram.deadline)}
                    </span>
                  ) : null}
                </div>

                {/* Progress bar */}
                <div style={{ display: 'grid', gap: 7 }}>
                  <div className="apa-progress-head">
                    <span className="apa-progress-label">Document Progress</span>
                    <span className="apa-progress-fraction">
                      {requirementProgress.completed} / {totalRequirements}
                    </span>
                  </div>
                  <div className="apa-progress-track">
                    <div className="apa-progress-fill" style={{ width: `${readinessPercent}%` }} />
                  </div>
                </div>

                {/* Checklist */}
                <div className="apa-checklist">
                  <div className={`apa-check-row ${missingRequired === 0 ? 'is-ok' : 'is-pending'}`}>
                    <span className="apa-check-dot">
                      <Icon name={missingRequired === 0 ? 'check' : 'warning'} size={11} />
                    </span>
                    {missingRequired > 0
                      ? `${missingRequired} document${missingRequired > 1 ? 's' : ''} still needed`
                      : 'All documents uploaded'}
                  </div>
                  <div className={`apa-check-row ${profileDetailsConfirmed ? 'is-ok' : 'is-pending'}`}>
                    <span className="apa-check-dot">
                      <Icon name={profileDetailsConfirmed ? 'check' : 'warning'} size={11} />
                    </span>
                    {profileDetailsConfirmed ? 'Profile confirmed' : 'Profile incomplete'}
                  </div>
                  <div className={`apa-check-row ${eligibilityCriteriaMet ? 'is-ok' : 'is-pending'}`}>
                    <span className="apa-check-dot">
                      <Icon name={eligibilityCriteriaMet ? 'check' : 'warning'} size={11} />
                    </span>
                    {eligibilityCriteriaMet ? 'Eligibility criteria met' : 'Eligibility data missing'}
                  </div>
                </div>

                <hr className="apa-hr" />

                {/* Submit button */}
                <button
                  type="button"
                  className="apa-submit-btn"
                  disabled={!canSubmit}
                  onClick={() =>
                    actions.requestConfirmation({
                      title: 'Submit application?',
                      message:
                        'Review your uploaded files and notes before sending this application to the office.',
                      confirmLabel: 'Submit Application',
                      onConfirm: actions.submitApplication,
                    })
                  }
                >
                  Submit Application
                  <Icon name="arrow-right" size={15} />
                </button>

                <p className="apa-terms">
                  By submitting, you agree to the Terms and Data Privacy Policy.
                </p>
                <span className="apa-autosave">{draftSavedLabel}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ApplicantProgramApplyLayout>
  );
}
