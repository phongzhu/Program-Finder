import { useMemo, useState } from 'react';
import {
  formatProgramDate,
  getApplicantApplications,
  getApplicationOfficeRemark,
  getProgramById,
  getProgramIllustrationSource,
  getProgramPhotoSource,
} from 'Services/Applicant/applicant-utils';

// Design tokens — aligned with app CSS variables
const MA_PRIMARY = 'var(--pf-setting-primary, #0f2f56)';
const MA_INK     = '#12233a';
const MA_MUTED   = '#586678';

function Icon({ name, size = 16 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'clock':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case 'check':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'alert':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 3v6M16 3v6M4 10h16" />
        </svg>
      );
    case 'office':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M4 9l8-5 8 5" />
        </svg>
      );
    case 'close':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 6 12 12M18 6 6 18" />
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

function getNormalizedStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function getPhase(status) {
  const normalized = getNormalizedStatus(status);
  if (['approved', 'rejected', 'completed', 'cancelled'].includes(normalized)) {
    return 'completed';
  }
  return 'active';
}

function getStatusLabel(status) {
  const normalized = getNormalizedStatus(status);
  if (normalized === 'for review') return 'Under Review';
  if (normalized === 'submitted') return 'Under Review';
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'incomplete') return 'Action Required';
  if (normalized === 'rejected') return 'Action Required';
  if (normalized === 'draft') return 'Draft';
  return status || 'Under Review';
}

function getStatusTone(status) {
  const normalized = getNormalizedStatus(status);
  if (['approved', 'completed'].includes(normalized)) {
    return {
      bg: '#ddf7ea',
      color: '#1d7f52',
      border: '#c0ebd6',
    };
  }

  if (['incomplete', 'rejected'].includes(normalized)) {
    return {
      bg: '#fde8e7',
      color: '#a13b39',
      border: '#f5c9c8',
    };
  }

  return {
    bg: '#dfe8fb',
    color: '#2c4f86',
    border: '#c8d8f7',
  };
}

function getActionRequiredCount(applications) {
  return applications.filter((application) => {
    const normalized = getNormalizedStatus(application.status);
    return ['incomplete', 'rejected'].includes(normalized);
  }).length;
}

function getUnderReviewCount(applications) {
  return applications.filter((application) => getPhase(application.status) === 'active').length;
}

function getApprovedCount(applications) {
  return applications.filter((application) => getNormalizedStatus(application.status) === 'approved').length;
}

function formatSubmissionDate(value) {
  if (!value) return 'Date not available';
  return formatProgramDate(value);
}

function getCardNote(application) {
  const officeRemark = getApplicationOfficeRemark(application);
  if (officeRemark) {
    return officeRemark;
  }

  const normalized = getNormalizedStatus(application.status);

  if (normalized === 'approved') {
    return 'Your application is approved. Please check your notifications for the next steps.';
  }

  if (normalized === 'incomplete' || normalized === 'rejected') {
    return 'Please review the office feedback and update your submission requirements.';
  }

  if (normalized === 'draft') {
    return 'Your application draft is saved. Continue when you are ready to submit.';
  }

  return 'Your application is currently being reviewed by the assigned office.';
}

function isDraftApplication(application) {
  return getNormalizedStatus(application?.status) === 'draft';
}

function getStatusToneClass(status) {
  const normalized = getNormalizedStatus(status);
  if (['approved', 'completed'].includes(normalized)) return 'tone-green';
  if (['incomplete', 'rejected'].includes(normalized)) return 'tone-red';
  return 'tone-blue';
}

function ApplicationCard({ application, program, onViewSubmission, onContinueDraft, onViewProgram }) {
  const imageSource = getProgramPhotoSource(program) || getProgramIllustrationSource(program);
  const statusLabel = getStatusLabel(application.status);
  const toneClass   = getStatusToneClass(application.status);
  const note = getCardNote(application);
  const isDraft = isDraftApplication(application);

  return (
    <article className={`ma-card ${isDraft ? 'is-draft' : ''}`}>
      <div className="ma-card-media">
        {imageSource ? (
          <img
            src={imageSource}
            alt={program?.title || 'Program'}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        <span className={`ma-card-status-badge ${toneClass}`}>{statusLabel}</span>
      </div>

      <div className="ma-card-body">
        <h3 className="ma-card-title">{program?.title || 'Program record not found'}</h3>
        <div className="ma-card-meta">
          <span className="ma-card-meta-row">
            <Icon name="office" size={13} />
            {program?.office || 'Office not listed'}
          </span>
          <span className="ma-card-meta-row">
            <Icon name="calendar" size={13} />
            Submitted: {formatSubmissionDate(application.submittedAt)}
          </span>
        </div>

        <div className={`ma-card-note ${toneClass}`}>{note}</div>

        <div className="ma-card-actions">
          <div className="ma-card-actions-main">
            {isDraft ? (
              <button type="button" className="ma-primary-btn" onClick={onContinueDraft}>
                Continue Draft
              </button>
            ) : (
              <button type="button" className="ma-primary-btn" onClick={onViewSubmission}>
                View Submission
              </button>
            )}

            {isDraft ? (
              <button type="button" className="ma-secondary-btn" onClick={onViewSubmission}>
                View Submission
              </button>
            ) : (
              <button type="button" className="ma-secondary-btn" onClick={onViewProgram}>
                View Program
              </button>
            )}
          </div>
          {isDraft ? (
            <button type="button" className="ma-ghost-link-btn" onClick={onViewProgram}>
              View Program
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ icon, label, value, variant }) {
  return (
    <article className={`ma-summary-card is-${variant}`}>
      <div className={`ma-summary-icon is-${variant}`}>
        <Icon name={icon} size={17} />
      </div>
      <div className="ma-summary-text">
        <span className="ma-summary-label">{label}</span>
        <strong className="ma-summary-value">{String(value).padStart(2, '0')}</strong>
      </div>
    </article>
  );
}

export default function ManageApplicationsScreen({ session, data, actions, navigate }) {
  const [phaseFilter, setPhaseFilter] = useState('all');

  const applications = useMemo(() => {
    return [...getApplicantApplications(data, session)].sort((left, right) =>
      String(right.submittedAt || '').localeCompare(String(left.submittedAt || ''))
    );
  }, [data, session]);

  const underReviewCount = useMemo(() => getUnderReviewCount(applications), [applications]);
  const approvedCount = useMemo(() => getApprovedCount(applications), [applications]);
  const actionRequiredCount = useMemo(() => getActionRequiredCount(applications), [applications]);

  const filteredApplications = useMemo(() => {
    if (phaseFilter === 'all') return applications;
    return applications.filter((application) => getPhase(application.status) === phaseFilter);
  }, [applications, phaseFilter]);

  return (
    <>
      <style>{`
        /* ── Root ─────────────────────────────── */
        .ma-root {
          display: grid;
          gap: 20px;
          padding: 4px 0 28px;
          color: ${MA_INK};
          font-family: var(--pf-font-body, var(--font-body, system-ui, sans-serif));
        }
        /* ── Page header ──────────────────────── */
        .ma-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }
        .ma-head-text { display: grid; gap: 4px; }
        .ma-head-title {
          margin: 0;
          font-size: 1.6rem;
          line-height: 1.12;
          color: var(--pf-setting-primary, #0f2f56);
          font-weight: 800;
          letter-spacing: -.02em;
        }
        .ma-head-sub {
          margin: 0;
          color: ${MA_MUTED};
          font-size: .875rem;
        }
        /* ── Filter tabs ──────────────────────── */
        .ma-tabs {
          display: inline-flex;
          border: 1.5px solid rgba(15,47,86,.18);
          background: rgba(15,47,86,.06);
          overflow: hidden;
          align-self: flex-start;
        }
        .ma-tab-btn {
          border: none;
          border-right: 1px solid rgba(15,47,86,.12);
          background: transparent;
          color: ${MA_MUTED};
          font-weight: 600;
          font-size: .79rem;
          padding: 7px 18px;
          cursor: pointer;
          font-family: inherit;
          transition: background .12s ease, color .12s ease;
        }
        .ma-tab-btn:last-child { border-right: none; }
        .ma-tab-btn:hover:not(.active) { background: rgba(15,47,86,.08); color: var(--pf-setting-primary, #0f2f56); }
        .ma-tab-btn.active {
          background: var(--pf-setting-primary, #0f2f56);
          color: #fff;
          font-weight: 700;
        }
        /* ── Summary cards ────────────────────── */
        .ma-summary-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .ma-summary-card {
          background: #fff;
          border: 1px solid rgba(18,35,58,.09);
          border-top: 3px solid rgba(18,35,58,.20);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(18,35,58,.04);
        }
        .ma-summary-card.is-review   { border-top-color: #2c4f86; }
        .ma-summary-card.is-approved { border-top-color: #1d7f52; }
        .ma-summary-card.is-action   { border-top-color: #a13b39; }
        .ma-summary-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid;
        }
        .ma-summary-icon.is-review   { background: #e8efff; color: #2c4f86; border-color: #d1defa; }
        .ma-summary-icon.is-approved { background: #ddf7ea; color: #1d7f52; border-color: #c0ebd6; }
        .ma-summary-icon.is-action   { background: #fde8e7; color: #a13b39; border-color: #f5c9c8; }
        .ma-summary-text { display: grid; gap: 3px; }
        .ma-summary-label {
          color: ${MA_MUTED};
          font-size: .67rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .ma-summary-value {
          color: var(--pf-setting-primary, #0f2f56);
          font-size: 2rem;
          line-height: 1;
          font-weight: 800;
        }
        /* ── Application cards grid ───────────── */
        .ma-cards-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 24rem), 1fr));
          align-items: start;
        }
        .ma-card {
          background: #fff;
          border: 1px solid rgba(18,35,58,.10);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(18,35,58,.05), 0 4px 14px rgba(18,35,58,.04);
        }
        .ma-card.is-draft {
          border-left: 3px solid var(--pf-setting-primary, #0f2f56);
        }
        /* ── Card media ───────────────────────── */
        .ma-card-media {
          position: relative;
          height: 108px;
          min-height: 108px;
          max-height: 108px;
          background: rgba(15,47,86,.09);
          overflow: hidden;
        }
        .ma-card-media img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        /* ── Status badge ─────────────────────── */
        .ma-card-status-badge {
          position: absolute;
          right: 8px;
          top: 8px;
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          font-size: .64rem;
          font-weight: 700;
          letter-spacing: .02em;
        }
        .ma-card-status-badge.tone-blue  { background: #dfe8fb; color: #2c4f86; border: 1px solid #c8d8f7; }
        .ma-card-status-badge.tone-green { background: #ddf7ea; color: #1d7f52; border: 1px solid #c0ebd6; }
        .ma-card-status-badge.tone-red   { background: #fde8e7; color: #a13b39; border: 1px solid #f5c9c8; }
        /* ── Card body ────────────────────────── */
        .ma-card-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }
        .ma-card-title {
          margin: 0;
          font-size: .88rem;
          line-height: 1.3;
          font-weight: 700;
          color: var(--pf-setting-primary, #0f2f56);
          min-height: calc(1.3em * 2);
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .ma-card-meta {
          color: ${MA_MUTED};
          font-size: .74rem;
          display: grid;
          gap: 4px;
        }
        .ma-card-meta-row { display: inline-flex; align-items: center; gap: 6px; }
        /* ── Card note / status message ───────── */
        .ma-card-note {
          padding: 8px 10px;
          font-size: .74rem;
          line-height: 1.4;
          border: 1px solid;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .ma-card-note.tone-blue  { background: #dfe8fb; color: #2c4f86; border-color: #c8d8f7; }
        .ma-card-note.tone-green { background: #ddf7ea; color: #1d7f52; border-color: #c0ebd6; }
        .ma-card-note.tone-red   { background: #fde8e7; color: #a13b39; border-color: #f5c9c8; }
        /* ── Card actions ─────────────────────── */
        .ma-card-actions {
          margin-top: auto;
          display: grid;
          gap: 6px;
        }
        .ma-card-actions-main {
          display: grid;
          gap: 6px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ma-primary-btn {
          min-height: 34px;
          border: none;
          background: var(--pf-setting-primary, #0f2f56);
          color: #fff;
          font-weight: 700;
          font-size: .78rem;
          cursor: pointer;
          font-family: inherit;
          transition: opacity .13s ease;
        }
        .ma-primary-btn:hover { opacity: .85; }
        .ma-secondary-btn {
          min-height: 34px;
          border: 1.5px solid rgba(15,47,86,.24);
          background: rgba(15,47,86,.06);
          color: var(--pf-setting-primary, #0f2f56);
          font-weight: 700;
          font-size: .78rem;
          cursor: pointer;
          font-family: inherit;
          transition: background .12s ease;
        }
        .ma-secondary-btn:hover { background: rgba(15,47,86,.12); }
        .ma-ghost-link-btn {
          min-height: 24px;
          border: none;
          background: transparent;
          color: ${MA_MUTED};
          font-size: .73rem;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          font-family: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .ma-ghost-link-btn:hover { color: var(--pf-setting-primary, #0f2f56); }
        /* ── Empty state ──────────────────────── */
        .ma-empty {
          border: 1px dashed rgba(18,35,58,.15);
          background: rgba(18,35,58,.02);
          color: ${MA_MUTED};
          text-align: center;
          padding: 44px 24px;
          line-height: 1.6;
        }
        .ma-empty-title {
          display: block;
          color: var(--pf-setting-primary, #0f2f56);
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 6px;
        }
        /* ── Responsive ───────────────────────── */
        @media (max-width: 980px) {
          .ma-summary-grid { grid-template-columns: 1fr; }
          .ma-cards-grid   { grid-template-columns: 1fr; }
          .ma-card-actions-main { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .ma-head { flex-direction: column; }
          .ma-tabs { align-self: stretch; }
          .ma-tab-btn { flex: 1; }
        }
      `}</style>

      <section className="ma-root">
        <header className="ma-head">
          <div className="ma-head-text">
            <h2 className="ma-head-title">Manage Applications</h2>
            <p className="ma-head-sub">Track, update, and manage your submitted program applications.</p>
          </div>

          <div className="ma-tabs" role="tablist" aria-label="Application phase filter">
            <button
              type="button"
              className={`ma-tab-btn ${phaseFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPhaseFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`ma-tab-btn ${phaseFilter === 'active' ? 'active' : ''}`}
              onClick={() => setPhaseFilter('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`ma-tab-btn ${phaseFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setPhaseFilter('completed')}
            >
              Completed
            </button>
          </div>
        </header>

        <section className="ma-summary-grid">
          <SummaryCard icon="clock" label="Under Review"    value={underReviewCount}    variant="review"   />
          <SummaryCard icon="check" label="Approved"        value={approvedCount}        variant="approved" />
          <SummaryCard icon="alert" label="Action Required" value={actionRequiredCount}  variant="action"   />
        </section>

        {filteredApplications.length ? (
          <section className="ma-cards-grid">
            {filteredApplications.map((application) => {
              const program = getProgramById(data.programs, application.programId) || {};
              return (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  program={program}
                  onViewSubmission={() => navigate(`/applicant/view-application-submission/${encodeURIComponent(application.id)}`)}
                  onContinueDraft={() => actions.startApplication(program.id)}
                  onViewProgram={() => actions.openProgramDetails(program.id)}
                />
              );
            })}
          </section>
        ) : (
          <section className="ma-empty">
            <strong className="ma-empty-title">No applications to show</strong>
            Start by applying to a program, then return here to track status and updates.
          </section>
        )}
      </section>
    </>
  );
}
