import { useMemo } from 'react';
import {
  formatProgramDate,
  getApplicantApplications,
  getApplicationOfficeRemark,
  getApplicationOfficeRemarkLabel,
  getProgramById,
  getProgramIllustrationSource,
  getProgramPhotoSource,
} from 'Services/Applicant/applicant-utils';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  ink: '#1a2637',
  muted: '#5a7090',
  subtle: '#8da3ba',
  border: '#dce4f0',
  borderLight: '#edf1f8',
  surface: '#ffffff',
  bg: '#f4f7fc',
  bgDeep: '#ecf1f9',
  primary: '#1a3f76',
  primaryLight: '#e8eef9',
};

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'arrow-left':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case 'eye':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'office':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M3 21V9l9-6 9 6v12" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case 'check':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'pending':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case 'file':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'message':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'hash':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      );
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7" /></svg>;
  }
}

/* ─── Status helpers ────────────────────────────────────────────────────── */
function normalizeStatus(v) { return String(v || '').trim().toLowerCase(); }

function getStatusMeta(status) {
  const s = normalizeStatus(status);
  if (s === 'approved')    return { label: 'Approved',        bg: '#d4f5e5', color: '#15724a', border: '#b2e8cf', dot: '#1a8a5a' };
  if (s === 'for review')  return { label: 'Under Review',    bg: '#fff7e0', color: '#8a6200', border: '#f5dfa0', dot: '#c48b00' };
  if (s === 'incomplete')  return { label: 'Action Required', bg: '#fde9e8', color: '#9b3533', border: '#f5c7c5', dot: '#c44240' };
  if (s === 'rejected')    return { label: 'Rejected',        bg: '#fde9e8', color: '#9b3533', border: '#f5c7c5', dot: '#c44240' };
  if (s === 'draft')       return { label: 'Draft',           bg: '#eef1fa', color: '#3d5a9c', border: '#cdd6f0', dot: '#4c6fc4' };
  return                          { label: status || 'Submitted', bg: '#e6eeff', color: '#2046a3', border: '#c5d4f8', dot: '#3b5fc4' };
}

/* ─── Date formatter ────────────────────────────────────────────────────── */
function prettyDate(value) {
  if (!value) return 'Date unavailable';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return formatProgramDate(value);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch {
    return formatProgramDate(value);
  }
}

/* ─── Route helper ──────────────────────────────────────────────────────── */
function getRouteApplicationId() {
  if (typeof window === 'undefined') return null;
  const parts = (window.location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  if (parts[0] !== 'applicant' || parts[1] !== 'view-application-submission') return null;
  return parts[2] ? decodeURIComponent(parts[2]) : null;
}

/* ─── Requirements helper ───────────────────────────────────────────────── */
function getRequirementRows(application, program) {
  const fileMap = new Map(
    (application?.requirementFiles || []).map((f) => [String(f.requirementName || '').toLowerCase(), f])
  );
  const reqs = Array.isArray(program?.requirements) ? program.requirements : [];
  if (!reqs.length && fileMap.size) {
    return [...fileMap.values()].map((f) => ({ name: f.requirementName, submitted: true, file: f }));
  }
  return reqs.map((name) => {
    const file = fileMap.get(String(name || '').toLowerCase()) || null;
    return { name, submitted: Boolean(file), file };
  });
}

/* ─── Timeline dot colours ──────────────────────────────────────────────── */
function getTimelineDotColor(status) {
  return getStatusMeta(status).dot;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
export default function ViewApplicationSubmissionScreen({ session, data, actions, navigate }) {
  const applicationId = getRouteApplicationId();

  const applications = useMemo(() => getApplicantApplications(data, session), [data, session]);

  const selectedApplication = useMemo(() => {
    if (!applicationId) return applications[0] || null;
    return applications.find((a) => a.id === applicationId) || null;
  }, [applicationId, applications]);

  const selectedProgram = useMemo(
    () => (selectedApplication ? getProgramById(data.programs, selectedApplication.programId) : null),
    [data.programs, selectedApplication]
  );

  const statusMeta      = getStatusMeta(selectedApplication?.status);
  const officeRemark    = getApplicationOfficeRemark(selectedApplication || {});
  const officeRemarkLabel = getApplicationOfficeRemarkLabel(selectedApplication || {});
  const requirementRows = getRequirementRows(selectedApplication, selectedProgram);
  const isDraft         = normalizeStatus(selectedApplication?.status) === 'draft';
  const previewImage    = getProgramPhotoSource(selectedProgram) || getProgramIllustrationSource(selectedProgram);

  /* ── History (newest first) ── */
  const historyEntries = useMemo(() => {
    if (!Array.isArray(selectedApplication?.history)) return [];
    return [...selectedApplication.history].reverse();
  }, [selectedApplication]);

  return (
    <>
      <style>{`
        /* ── Reset / root ─────────────────────────────────────────── */
        .vs {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 6px 0 28px;
          color: ${T.ink};
          font-family: var(--pf-font-body, system-ui, sans-serif);
        }

        /* ── Top action bar ──────────────────────────────────────── */
        .vs-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .vs-btn, .vs-btn-ghost, .vs-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 16px;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .vs-btn {
          border: 1px solid ${T.border};
          background: ${T.surface};
          color: ${T.ink};
        }
        .vs-btn:hover { background: ${T.bg}; border-color: #c0cedf; }
        .vs-btn-primary {
          border: 1px solid ${T.primary};
          background: ${T.primary};
          color: #ffffff;
        }
        .vs-btn-primary:hover { background: #14336a; border-color: #14336a; }

        /* ── Hero card ───────────────────────────────────────────── */
        .vs-hero-card {
          border-radius: 16px;
          border: 1px solid ${T.border};
          background: ${T.surface};
          overflow: hidden;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          box-shadow: 0 2px 12px rgba(26,38,55,0.06);
        }
        .vs-hero-img {
          background: ${T.bgDeep};
          overflow: hidden;
          position: relative;
        }
        .vs-hero-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          min-height: 240px;
        }
        .vs-hero-img-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          background: linear-gradient(135deg, #dce9f5 0%, #c8daf0 100%);
        }
        .vs-hero-body {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          justify-content: center;
        }
        .vs-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .vs-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .vs-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 500;
          font-family: monospace;
          background: ${T.bg};
          color: ${T.muted};
          border: 1px solid ${T.border};
          max-width: 340px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vs-program-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.15;
          color: ${T.ink};
          letter-spacing: -0.02em;
        }
        .vs-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 18px;
          font-size: 13.5px;
          color: ${T.muted};
        }
        .vs-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .vs-notice {
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13.5px;
          line-height: 1.6;
        }

        /* ── Two-column body ─────────────────────────────────────── */
        .vs-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .vs-full { grid-column: 1 / -1; }

        /* ── Cards ───────────────────────────────────────────────── */
        .vs-card {
          border-radius: 14px;
          border: 1px solid ${T.border};
          background: ${T.surface};
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(26,38,55,0.04);
        }
        .vs-card-header {
          padding: 16px 20px 14px;
          border-bottom: 1px solid ${T.borderLight};
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vs-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: ${T.primaryLight};
          color: ${T.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .vs-card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: ${T.ink};
        }
        .vs-card-body {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Requirement rows ────────────────────────────────────── */
        .vs-req-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid ${T.borderLight};
          background: ${T.bg};
          transition: border-color 0.15s;
        }
        .vs-req-item:hover { border-color: ${T.border}; }
        .vs-req-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .vs-req-dot.done  { background: #d4f5e5; color: #15724a; }
        .vs-req-dot.pending { background: #f0f3f9; color: ${T.subtle}; }
        .vs-req-text { flex: 1; min-width: 0; }
        .vs-req-name {
          font-size: 14px;
          font-weight: 600;
          color: ${T.ink};
          display: block;
          line-height: 1.3;
        }
        .vs-req-file {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          color: ${T.muted};
          margin-top: 3px;
        }

        /* ── Timeline ────────────────────────────────────────────── */
        .vs-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
        }
        .vs-tl-entry {
          display: flex;
          gap: 14px;
          position: relative;
        }
        .vs-tl-entry:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 14px;
          top: 28px;
          bottom: -2px;
          width: 2px;
          background: ${T.borderLight};
        }
        .vs-tl-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          padding-top: 3px;
        }
        .vs-tl-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid;
          background: ${T.surface};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
          position: relative;
        }
        .vs-tl-right {
          flex: 1;
          padding-bottom: 18px;
        }
        .vs-tl-status {
          font-size: 14px;
          font-weight: 700;
          color: ${T.ink};
          line-height: 1.3;
        }
        .vs-tl-time {
          font-size: 12px;
          color: ${T.subtle};
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .vs-tl-detail {
          font-size: 13px;
          color: ${T.muted};
          margin-top: 5px;
          line-height: 1.55;
          padding: 8px 12px;
          background: ${T.bg};
          border-radius: 8px;
          border: 1px solid ${T.borderLight};
        }

        /* ── Office remark ───────────────────────────────────────── */
        .vs-remark-box {
          border-radius: 10px;
          border: 1px solid ${T.border};
          background: ${T.bg};
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.65;
          color: ${T.muted};
          font-style: italic;
        }
        .vs-remark-box.has-remark {
          background: ${T.primaryLight};
          border-color: #cdd9f5;
          color: ${T.ink};
          font-style: normal;
        }

        /* ── Empty states ────────────────────────────────────────── */
        .vs-empty {
          padding: 28px 20px;
          text-align: center;
          border-radius: 10px;
          border: 1.5px dashed ${T.border};
          background: ${T.bg};
          color: ${T.subtle};
          font-size: 13.5px;
          line-height: 1.55;
        }
        .vs-not-found {
          border-radius: 16px;
          border: 1px solid ${T.border};
          background: ${T.surface};
          padding: 48px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .vs-not-found strong {
          font-size: 18px;
          color: ${T.ink};
        }

        /* ── Responsive ──────────────────────────────────────────── */
        @media (max-width: 960px) {
          .vs-hero-card { grid-template-columns: 1fr; }
          .vs-hero-img img, .vs-hero-img-placeholder { min-height: 200px; max-height: 220px; }
          .vs-grid { grid-template-columns: 1fr; }
          .vs-full { grid-column: auto; }
          .vs-program-title { font-size: 22px; }
        }
        @media (max-width: 600px) {
          .vs-hero-body { padding: 18px; }
        }
      `}</style>

      <div className="vs">

        {/* ── Action bar ─────────────────────────────────────────────── */}
        <div className="vs-bar">
          <button type="button" className="vs-btn" onClick={() => navigate('/applicant/manage-applications')}>
            <Icon name="arrow-left" size={14} />
            Back to Manage Applications
          </button>
          {selectedProgram?.id && (
            <button type="button" className="vs-btn" onClick={() => actions.openProgramDetails(selectedProgram.id)}>
              <Icon name="eye" size={14} />
              View Program
            </button>
          )}
          {isDraft && selectedProgram?.id && (
            <button type="button" className="vs-btn-primary" onClick={() => actions.startApplication(selectedProgram.id)}>
              Continue Draft →
            </button>
          )}
        </div>

        {selectedApplication && selectedProgram ? (
          <>
            {/* ── Hero card ─────────────────────────────────────────── */}
            <div className="vs-hero-card">
              <div className="vs-hero-img">
                {previewImage
                  ? <img src={previewImage} alt={selectedProgram.title || 'Program'} loading="lazy" />
                  : (
                    <div className="vs-hero-img-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a0b8d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )
                }
              </div>

              <div className="vs-hero-body">
                <div className="vs-badge-row">
                  <span
                    className="vs-badge"
                    style={{
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      border: `1px solid ${statusMeta.border}`,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: statusMeta.dot, flexShrink: 0,
                    }} />
                    {statusMeta.label}
                  </span>
                  <span className="vs-id-badge">
                    <Icon name="hash" size={11} />
                    {selectedApplication.id}
                  </span>
                </div>

                <h2 className="vs-program-title">{selectedProgram.title}</h2>

                <div className="vs-meta-row">
                  <span className="vs-meta-item">
                    <Icon name="calendar" size={14} />
                    Submitted: <strong style={{ fontWeight: 600 }}>{prettyDate(selectedApplication.submittedAt)}</strong>
                  </span>
                  <span className="vs-meta-item">
                    <Icon name="office" size={14} />
                    {selectedApplication.office || selectedProgram.office || 'Office not assigned'}
                  </span>
                </div>

                <div
                  className="vs-notice"
                  style={{
                    background: statusMeta.bg,
                    border: `1px solid ${statusMeta.border}`,
                    color: statusMeta.color,
                  }}
                >
                  {isDraft
                    ? 'Draft saved — continue uploading requirements and submit when ready.'
                    : selectedApplication.reviewerNote
                      || selectedApplication.followUpNote
                      || 'Your submission is recorded and being tracked in this workspace.'}
                </div>
              </div>
            </div>

            {/* ── Two-column body ──────────────────────────────────── */}
            <div className="vs-grid">

              {/* Requirements */}
              <div className="vs-card">
                <div className="vs-card-header">
                  <div className="vs-card-icon">
                    <Icon name="check" size={15} />
                  </div>
                  <h3 className="vs-card-title">Requirements</h3>
                  {requirementRows.length > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.muted,
                    }}>
                      {requirementRows.filter((r) => r.submitted).length} / {requirementRows.length} submitted
                    </span>
                  )}
                </div>
                <div className="vs-card-body">
                  {requirementRows.length ? (
                    requirementRows.map((item) => (
                      <div key={item.name} className="vs-req-item">
                        <div className={`vs-req-dot ${item.submitted ? 'done' : 'pending'}`}>
                          <Icon name={item.submitted ? 'check' : 'pending'} size={13} />
                        </div>
                        <div className="vs-req-text">
                          <span className="vs-req-name">{item.name}</span>
                          <span className="vs-req-file">
                            {item.file?.fileName
                              ? <><Icon name="file" size={11} />{item.file.fileName}</>
                              : <span style={{ color: T.subtle, fontStyle: 'italic' }}>No file uploaded yet</span>
                            }
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="vs-empty">No requirements found for this program.</div>
                  )}
                </div>
              </div>

              {/* Submission timeline */}
              <div className="vs-card">
                <div className="vs-card-header">
                  <div className="vs-card-icon">
                    <Icon name="pending" size={15} />
                  </div>
                  <h3 className="vs-card-title">Submission Timeline</h3>
                </div>
                <div className="vs-card-body">
                  {historyEntries.length ? (
                    <div className="vs-timeline">
                      {historyEntries.map((entry, i) => {
                        const dotColor = getTimelineDotColor(entry.status);
                        return (
                          <div key={`${entry.time || i}-${entry.status || 'status'}`} className="vs-tl-entry">
                            <div className="vs-tl-left">
                              <div
                                className="vs-tl-dot"
                                style={{ borderColor: dotColor, color: dotColor }}
                              >
                                <span style={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: dotColor, display: 'block',
                                }} />
                              </div>
                            </div>
                            <div className="vs-tl-right">
                              <div className="vs-tl-status">{entry.status || 'Status update'}</div>
                              <div className="vs-tl-time">
                                <Icon name="calendar" size={11} />
                                {prettyDate(entry.time)}
                              </div>
                              {entry.detail && (
                                <div className="vs-tl-detail">{entry.detail}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="vs-empty">No timeline entries available yet.</div>
                  )}
                </div>
              </div>

              {/* Office remark — full width */}
              <div className="vs-card vs-full">
                <div className="vs-card-header">
                  <div className="vs-card-icon">
                    <Icon name="message" size={15} />
                  </div>
                  <h3 className="vs-card-title">{officeRemarkLabel || 'Office Remark'}</h3>
                </div>
                <div className="vs-card-body">
                  <div className={`vs-remark-box${officeRemark ? ' has-remark' : ''}`}>
                    {officeRemark || 'No office remark has been posted yet.'}
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="vs-not-found">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <strong>Submission not found</strong>
            <span style={{ color: T.muted, fontSize: 14, maxWidth: 360 }}>
              We could not find this application record. Go back to Manage Applications and open a valid submission.
            </span>
            <button type="button" className="vs-btn" style={{ marginTop: 4 }} onClick={() => navigate('/applicant/manage-applications')}>
              <Icon name="arrow-left" size={14} />
              Go to Manage Applications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
