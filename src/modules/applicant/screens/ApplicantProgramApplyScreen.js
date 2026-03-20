import { useEffect, useState } from 'react';
import {
  formatProgramDate,
  formatProgramWindow,
  getApplicantDocuments,
  getProgramById,
  getProgramIllustrationSource,
  getProgramPhotoSource,
  getProgramSurfaceLabel,
  getProgramVisualTheme,
} from './helpers';

function Icon({ name, size = 16 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'arrow-left':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.25" />
          <path d="M7.5 3.75v3M16.5 3.75v3M3.75 9.5h16.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.25l2.75 1.75" />
        </svg>
      );
    case 'office':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M4 9l8-5 8 5M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
        </svg>
      );
    case 'location':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s6-5.75 6-11.2A6 6 0 0 0 6 8.8C6 14.25 12 20 12 20Z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      );
    case 'document':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3.75h6l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 20.25V5.25A1.5 1.5 0 0 1 8.5 3.75Z" />
          <path d="M14 3.75v4h4M10 12h4M10 15.5h4" />
        </svg>
      );
    case 'check':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'upload':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V5M8 9l4-4 4 4M5 19h14" />
        </svg>
      );
    default:
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(250,252,248,.98) 0%, rgba(239,244,238,.95) 100%)',
        borderRadius: 24,
        border: '1px solid rgba(18,32,25,.08)',
        boxShadow: '0 18px 48px rgba(18,32,25,.07)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HeroArtwork({ program }) {
  const photoSource = getProgramPhotoSource(program);
  const illustrationSource = getProgramIllustrationSource(program);
  const [useIllustration, setUseIllustration] = useState(!photoSource);
  const theme = getProgramVisualTheme(program);

  useEffect(() => {
    setUseIllustration(!photoSource);
  }, [photoSource, program?.id]);

  const visualSource = useIllustration ? illustrationSource : photoSource;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 280,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 24,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
    >
      <img
        src={visualSource}
        alt={program.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setUseIllustration(true)}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: useIllustration
            ? 'linear-gradient(180deg, rgba(8,16,11,.08) 0%, rgba(8,16,11,.22) 100%)'
            : 'linear-gradient(180deg, rgba(8,16,11,.06) 0%, rgba(8,16,11,.55) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.16)',
              color: theme.text,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(10px)',
            }}
          >
            {getProgramSurfaceLabel(program)}
          </span>
          <span
            style={{
              display: 'inline-flex',
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(8,16,11,.26)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
            }}
          >
            {program.status}
          </span>
        </div>

        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
            {program.office}
          </strong>
          <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 1.6 }}>
            Upload each required file, review the checklist, then submit when the draft is complete.
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
        padding: '16px 18px',
        borderRadius: 20,
        background: 'rgba(255,255,255,.75)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'rgba(30,125,77,.1)',
            color: '#1e7d4d',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name={icon} size={15} />
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: '#4a6356',
          }}
        >
          {label}
        </span>
      </div>
      <strong style={{ fontSize: 14, lineHeight: 1.5, color: '#122019' }}>{value}</strong>
    </div>
  );
}

function RequirementStatus({ isReady, attached, hasUpload }) {
  let background = 'rgba(18,32,25,.08)';
  let color = '#4a6356';
  let label = 'Pending';

  if (isReady) {
    background = 'rgba(30,125,77,.13)';
    color = '#1e7d4d';
    label = 'Ready';
  } else if (attached) {
    background = 'rgba(229,163,60,.15)';
    color = '#a16207';
    label = 'Selected';
  } else if (hasUpload) {
    background = 'rgba(29,123,127,.13)';
    color = '#1d7b7f';
    label = 'Uploaded';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: 999,
        background,
        color,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function calculateApplicantAge(birthDateValue, referenceDate = new Date()) {
  if (!birthDateValue) {
    return null;
  }

  const birthDate = new Date(`${birthDateValue}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function displayReadonlyValue(value, fallback = 'Not provided') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function ApplicantProfileField({ label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 6,
        padding: '14px 16px',
        borderRadius: 18,
        background: 'rgba(255,255,255,.78)',
        border: '1px solid rgba(18,32,25,.08)',
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: '#4a6356',
        }}
      >
        {label}
      </span>
      <strong style={{ fontSize: 14, lineHeight: 1.5, color: '#122019' }}>{value}</strong>
    </div>
  );
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  minHeight: 46,
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: '#1e7d4d',
  color: '#fff',
  fontWeight: 700,
  boxShadow: '0 12px 24px rgba(30,125,77,.18)',
};

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  minHeight: 46,
  padding: '10px 18px',
  borderRadius: 999,
  border: '1px solid rgba(18,32,25,.1)',
  background: 'rgba(255,255,255,.9)',
  color: '#122019',
  fontWeight: 700,
};

export default function ApplicantProgramApplyScreen({ session, data, actions, navigate }) {
  const selectedProgram = getProgramById(data.programs, data.composer.programId);
  const attachedDocs = data.composer.attachedDocs;
  const applicantDocuments = getApplicantDocuments(data, session);
  const applicantProfile = data.applicantProfile || {};
  const [uploadError, setUploadError] = useState('');

  const getRequirementDocument = (requirement) =>
    applicantDocuments.find((document) => document.name.toLowerCase() === requirement.toLowerCase());

  const handleRequirementUpload = async (requirement, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    if (!fileUrl) {
      setUploadError('File upload failed. Please try again.');
      return;
    }

    setUploadError('');
    actions.uploadRequirementFile(requirement, {
      fileName: file.name,
      fileType: file.type || 'File',
      fileUrl,
    });
  };

  const requirementProgress = !selectedProgram
    ? { completed: 0, total: 0 }
    : {
        completed: selectedProgram.requirements.filter((requirement) => {
          const document = getRequirementDocument(requirement);
          return attachedDocs.includes(requirement) && Boolean(document?.fileUrl || document?.fileName);
        }).length,
        total: selectedProgram.requirements.length,
      };
  const applicantAge = calculateApplicantAge(applicantProfile.birthDate);

  if (!selectedProgram) {
    return (
      <div style={{ display: 'grid', gap: 18, padding: '8px 0' }}>
        <Panel>
          <div style={{ padding: '26px 24px', display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                Program application
              </span>
              <h2 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 30, lineHeight: 1.02, color: '#122019' }}>
                No selected program
              </h2>
              <p style={{ margin: 0, maxWidth: 520, color: '#4a6356', lineHeight: 1.65 }}>
                Open Search Programs and choose Apply on a program first.
              </p>
            </div>
            <div>
              <button style={primaryButtonStyle} onClick={() => navigate('/applicant/search-programs')}>
                Back to Search Programs
              </button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .apa-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          display: grid;
          gap: 20px;
          padding: 8px 0 12px;
          color: #122019;
        }
        .apa-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.06fr) minmax(320px, .94fr);
          gap: 18px;
          padding: 22px;
        }
        .apa-hero-copy,
        .apa-hero-metrics,
        .apa-main,
        .apa-main-primary,
        .apa-action-stack {
          display: grid;
          gap: 16px;
        }
        .apa-hero-copy {
          align-content: start;
        }
        .apa-hero-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .apa-main {
          grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr);
          align-items: start;
        }
        .apa-profile-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .apa-summary-panel {
          position: sticky;
          top: 18px;
        }
        .apa-requirement-list,
        .apa-summary-stack {
          display: grid;
          gap: 14px;
        }
        .apa-upload-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .apa-upload-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(18,32,25,.1);
          background: rgba(255,255,255,.96);
          color: #122019;
          font-weight: 700;
          cursor: pointer;
        }
        .apa-textarea {
          width: 100%;
          min-height: 150px;
          resize: vertical;
          padding: 14px 15px;
          border-radius: 18px;
          border: 1px solid rgba(18,32,25,.12);
          background: rgba(255,255,255,.96);
          color: #122019;
          outline: none;
          font: inherit;
          line-height: 1.65;
        }
        .apa-textarea:focus {
          border-color: rgba(30,125,77,.28);
          box-shadow: 0 0 0 4px rgba(30,125,77,.08);
        }
        @media (max-width: 1120px) {
          .apa-hero,
          .apa-main {
            grid-template-columns: 1fr;
          }
          .apa-summary-panel {
            position: static;
          }
        }
        @media (max-width: 760px) {
          .apa-hero-metrics,
          .apa-profile-grid {
            grid-template-columns: 1fr;
          }
          .apa-hero {
            padding: 18px;
          }
        }
      `}</style>

      <div className="apa-root">
        <Panel>
          <div className="apa-hero">
            <div className="apa-hero-copy">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: 999, background: 'rgba(30,125,77,.08)', color: '#1e7d4d', fontSize: 11.5, fontWeight: 700 }}>
                  Program application
                </span>
                <span style={{ display: 'inline-flex', padding: '5px 11px', borderRadius: 999, background: 'rgba(18,32,25,.06)', color: '#4a6356', fontSize: 11.5, fontWeight: 700 }}>
                  {requirementProgress.completed} of {requirementProgress.total} ready
                </span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "var(--pf-font-display, 'Syne', sans-serif)",
                    fontSize: 'clamp(1.95rem, 4vw, 3rem)',
                    lineHeight: .98,
                    letterSpacing: '-.04em',
                    color: '#122019',
                  }}
                >
                  Apply for {selectedProgram.title}
                </h1>
                <p style={{ margin: 0, color: '#4a6356', fontSize: 14, lineHeight: 1.72, maxWidth: 700 }}>
                  Upload the required documents, add your supporting notes, and review the readiness checklist before submitting.
                </p>
              </div>

              <div className="apa-hero-metrics">
                <MetricTile icon="office" label="Office" value={selectedProgram.office} />
                <MetricTile icon="location" label="Municipality" value={selectedProgram.municipality} />
                <MetricTile icon="calendar" label="Application period" value={formatProgramWindow(selectedProgram)} />
                <MetricTile icon="clock" label="Deadline" value={formatProgramDate(selectedProgram.deadline)} />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button style={{ ...secondaryButtonStyle, width: 'auto' }} onClick={() => navigate('/applicant/program-view')}>
                  <Icon name="arrow-left" size={14} />
                  Back to Program Details
                </button>
              </div>
            </div>

            <HeroArtwork program={selectedProgram} />
          </div>
        </Panel>

        <div className="apa-main">
          <div className="apa-main-primary">
            <Panel>
              <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                    Applicant details
                  </span>
                  <h2 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 26, lineHeight: 1.05, color: '#122019' }}>
                    Read-only profile snapshot
                  </h2>
                  <p style={{ margin: 0, color: '#4a6356', lineHeight: 1.65 }}>
                    These details come from your profile and are shown here for review. Update Profile Management if anything needs correction.
                  </p>
                </div>

                <div className="apa-profile-grid">
                  <ApplicantProfileField label="Full name" value={displayReadonlyValue(applicantProfile.fullName || session.name)} />
                  <ApplicantProfileField label="Age" value={applicantAge !== null ? `${applicantAge} years old` : 'Not provided'} />
                  <ApplicantProfileField label="Birth date" value={displayReadonlyValue(applicantProfile.birthDate ? formatProgramDate(applicantProfile.birthDate) : '')} />
                  <ApplicantProfileField label="Civil status" value={displayReadonlyValue(applicantProfile.civilStatus)} />
                  <ApplicantProfileField label="Email" value={displayReadonlyValue(applicantProfile.email || session.email)} />
                  <ApplicantProfileField label="Phone number" value={displayReadonlyValue(applicantProfile.phone)} />
                  <ApplicantProfileField label="Municipality" value={displayReadonlyValue(applicantProfile.municipality || session.municipality)} />
                  <ApplicantProfileField label="Barangay" value={displayReadonlyValue(applicantProfile.barangay)} />
                  <ApplicantProfileField label="Address" value={displayReadonlyValue(applicantProfile.address)} />
                  <ApplicantProfileField label="School" value={displayReadonlyValue(applicantProfile.school)} />
                  <ApplicantProfileField label="Course" value={displayReadonlyValue(applicantProfile.course)} />
                  <ApplicantProfileField label="Household income" value={displayReadonlyValue(applicantProfile.householdIncome)} />
                  <ApplicantProfileField label="Special category" value={displayReadonlyValue(applicantProfile.specialCategory)} />
                  <ApplicantProfileField label="Profile completion" value={`${Number(applicantProfile.completeness) || 0}%`} />
                </div>
              </div>
            </Panel>

            <Panel>
              <div style={{ padding: '20px 22px 22px', display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                    Required documents
                  </span>
                  <h2 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 26, lineHeight: 1.05, color: '#122019' }}>
                    Upload each requirement
                  </h2>
                </div>

                <div className="apa-requirement-list">
                  {selectedProgram.requirements.map((requirement, index) => {
                    const attached = attachedDocs.includes(requirement);
                    const savedDocument = getRequirementDocument(requirement);
                    const hasUpload = Boolean(savedDocument?.fileUrl || savedDocument?.fileName);
                    const isReady = attached && hasUpload;
                    const inputId = `apa-requirement-${index}`;

                    return (
                      <article
                        key={requirement}
                        style={{
                          display: 'grid',
                          gap: 14,
                          padding: '18px',
                          borderRadius: 22,
                          background: 'rgba(255,255,255,.82)',
                          border: '1px solid rgba(18,32,25,.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'grid', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 12,
                                  background: 'rgba(30,125,77,.1)',
                                  color: '#1e7d4d',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontWeight: 800,
                                }}
                              >
                                {index + 1}
                              </span>
                              <strong style={{ fontSize: 18, lineHeight: 1.25 }}>{requirement}</strong>
                              <RequirementStatus isReady={isReady} attached={attached} hasUpload={hasUpload} />
                            </div>
                            <p style={{ margin: 0, color: '#4a6356', lineHeight: 1.65 }}>
                              Include this requirement in the submission and upload the latest supporting file.
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() =>
                                attached
                                  ? actions.removeAttachedRequirement(requirement)
                                  : actions.attachRequirement(requirement)
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                minHeight: 40,
                                padding: '10px 14px',
                                borderRadius: 999,
                                border: '1px solid rgba(18,32,25,.1)',
                                background: attached ? 'rgba(30,125,77,.12)' : 'rgba(255,255,255,.96)',
                                color: attached ? '#1e7d4d' : '#122019',
                                fontWeight: 700,
                              }}
                            >
                              <Icon name="check" size={13} />
                              {attached ? 'Included' : 'Include'}
                            </button>

                            <label className="apa-upload-button" htmlFor={inputId}>
                              <Icon name="upload" size={14} />
                              {hasUpload ? 'Replace File' : 'Upload File'}
                            </label>
                            <input
                              id={inputId}
                              className="apa-upload-input"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(event) => handleRequirementUpload(requirement, event)}
                              type="file"
                            />
                          </div>
                        </div>

                        {savedDocument ? (
                          <div
                            style={{
                              display: 'grid',
                              gap: 10,
                              padding: '14px 16px',
                              borderRadius: 18,
                              background: 'rgba(30,125,77,.06)',
                              border: '1px solid rgba(30,125,77,.1)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ display: 'grid', gap: 3 }}>
                                <strong>{savedDocument.fileName || savedDocument.name}</strong>
                                <span style={{ color: '#4a6356', fontSize: 13, lineHeight: 1.6 }}>
                                  {savedDocument.fileType || savedDocument.category} | Uploaded {savedDocument.uploadedAt}
                                </span>
                              </div>
                              {savedDocument.fileUrl ? (
                                <a
                                  href={savedDocument.fileUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: 38,
                                    padding: '8px 14px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,.94)',
                                    color: '#122019',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    border: '1px solid rgba(18,32,25,.08)',
                                  }}
                                >
                                  View File
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '14px 16px',
                              borderRadius: 18,
                              background: 'rgba(248,250,247,.9)',
                              border: '1px dashed rgba(18,32,25,.12)',
                              color: '#4a6356',
                              lineHeight: 1.6,
                            }}
                          >
                            No file uploaded yet. Choose a file to attach this requirement to the draft.
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </Panel>
          </div>

          <div className="apa-summary-panel">
            <Panel>
              <div style={{ padding: '20px 22px 22px' }} className="apa-summary-stack">
                <div style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1e7d4d' }}>
                    Submission summary
                  </span>
                  <h2 style={{ margin: 0, fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 24, lineHeight: 1.06, color: '#122019' }}>
                    Ready to submit
                  </h2>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    padding: '18px',
                    borderRadius: 22,
                    background: 'rgba(255,255,255,.82)',
                    border: '1px solid rgba(18,32,25,.08)',
                  }}
                >
                  <strong style={{ fontFamily: "var(--pf-font-display, 'Syne', sans-serif)", fontSize: 42, lineHeight: .9 }}>
                    {requirementProgress.completed}/{requirementProgress.total}
                  </strong>
                  <span style={{ color: '#4a6356', lineHeight: 1.6 }}>
                    Requirements with both an uploaded file and an included status.
                  </span>
                </div>

                <MetricTile icon="document" label="Program" value={selectedProgram.title} />
                <MetricTile icon="clock" label="Deadline" value={formatProgramDate(selectedProgram.deadline)} />

                <div style={{ display: 'grid', gap: 8 }}>
                  <label
                    htmlFor="apa-supporting-notes"
                    style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#4a6356' }}
                  >
                    Supporting notes
                  </label>
                  <textarea
                    id="apa-supporting-notes"
                    className="apa-textarea"
                    value={data.composer.notes}
                    onChange={(event) => actions.updateComposerNotes(event.target.value)}
                    placeholder="Add anything the office should know before you submit."
                  />
                </div>

                {uploadError ? (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'rgba(195,86,75,.08)',
                      border: '1px solid rgba(195,86,75,.14)',
                      color: '#9b3b31',
                      lineHeight: 1.55,
                    }}
                  >
                    {uploadError}
                  </div>
                ) : null}

                <div className="apa-action-stack">
                  <button style={primaryButtonStyle} onClick={actions.submitApplication}>
                    Submit Application
                    <Icon name="arrow-right" size={14} />
                  </button>
                  <button style={secondaryButtonStyle} onClick={() => navigate('/applicant/program-view')}>
                    <Icon name="arrow-left" size={14} />
                    Back to Program Details
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
