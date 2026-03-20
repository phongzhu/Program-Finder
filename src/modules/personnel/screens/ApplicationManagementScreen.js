import { useEffect, useState } from 'react';
import { DetailItem, EmptyState, FormField, SectionHeading, SelectField, StatusPill } from '../../../shared/components/ui';
import { getOfficeApplications, getOfficePrograms, getProgramById } from './helpers';

const TABS = [
  { key: 'submitted', label: 'Submissions' },
  { key: 'records', label: 'Applicant Records' },
  { key: 'decisions', label: 'Decisions' },
];

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'For Review', value: 'For Review' },
  { label: 'Incomplete', value: 'Incomplete' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="personnel-app-search-icon" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" fill="none" r="5.75" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 15 4.25 4.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return 'Not set';
  const direct = new Date(value);
  const parsed = Number.isNaN(direct.getTime()) ? new Date(`${value}T12:00:00`) : direct;
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function formatWindow(program) {
  if (!program) return 'Schedule pending';
  if (program.applicationStartDate && program.applicationEndDate) return `${formatDate(program.applicationStartDate)} - ${formatDate(program.applicationEndDate)}`;
  if (program.deadline) return `Until ${formatDate(program.deadline)}`;
  return 'Schedule pending';
}

function decisionReason(application) {
  return application.rejectionReason || application.reviewerNote || application.followUpNote || application.history?.[0]?.detail || 'No note';
}

function shortText(value, fallback = 'No note') {
  const normalized = String(value || fallback).trim();
  return normalized.length > 84 ? `${normalized.slice(0, 81).trimEnd()}...` : normalized;
}

function getRequirementRows(application) {
  const requirementFiles = new Map((application.requirementFiles || []).map((item) => [item.requirementName, item]));
  return (application.program?.requirements || []).map((requirement) => ({
    requirement,
    submitted: application.documents.includes(requirement),
    file: requirementFiles.get(requirement) || null,
  }));
}

function Metric({ label, value, detail }) {
  return (
    <article className="personnel-app-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function SearchField({ label, value, onChange, placeholder }) {
  return (
    <label className="personnel-app-search">
      <span>{label}</span>
      <div className="personnel-app-search-field">
        <SearchIcon />
        <input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" value={value} />
      </div>
    </label>
  );
}

function ModalShell({ title, text, onClose, children, footer }) {
  return (
    <div className="personnel-app-modal-backdrop" onClick={onClose} role="presentation">
      <div aria-modal="true" className="personnel-app-modal" onClick={(event) => event.stopPropagation()} role="dialog">
        <div className="personnel-app-modal-header">
          <div>
            <strong>{title}</strong>
            {text ? <p>{text}</p> : null}
          </div>
          <button className="personnel-app-modal-close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="personnel-app-modal-body">{children}</div>
        {footer ? <div className="personnel-app-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function ApplicationManagementScreen({ session, data, actions }) {
  const officePrograms = [...getOfficePrograms(data, session)].sort((a, b) => a.title.localeCompare(b.title));
  const applications = [...getOfficeApplications(data, session)]
    .map((application) => ({ ...application, program: getProgramById(data.programs, application.programId) }))
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

  const typeOptions = [
    { label: 'All program types', value: 'all' },
    ...[...new Set(officePrograms.map((program) => program.programType).filter(Boolean))].map((type) => ({ label: type, value: type })),
  ];

  const [activeTab, setActiveTab] = useState('submitted');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProgramId, setSelectedProgramId] = useState(officePrograms[0]?.id || null);
  const [reviewingApplicationId, setReviewingApplicationId] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');

  const query = search.trim().toLowerCase();
  const filteredApplications = applications.filter((application) => {
    if (typeFilter !== 'all' && application.program?.programType !== typeFilter) return false;
    if (statusFilter !== 'all' && application.status !== statusFilter) return false;
    if (!query) return true;
    return [application.id, application.applicantName, application.applicantEmail, application.status, application.program?.title, application.program?.programType]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  const filteredPrograms = officePrograms.filter((program) => {
    const related = applications.filter((application) => application.programId === program.id);
    if (typeFilter !== 'all' && program.programType !== typeFilter) return false;
    if (statusFilter !== 'all' && !related.some((application) => application.status === statusFilter)) return false;
    if (!query) return true;
    const programMatch = [program.title, program.category, program.programType, program.status].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );
    const applicationMatch = related.some((application) =>
      [application.applicantName, application.applicantEmail, application.id, application.status].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
    return programMatch || applicationMatch;
  });

  useEffect(() => {
    if (!filteredPrograms.length) {
      setSelectedProgramId(null);
      return;
    }
    if (!filteredPrograms.some((program) => program.id === selectedProgramId)) {
      setSelectedProgramId(filteredPrograms[0].id);
    }
  }, [filteredPrograms, selectedProgramId]);

  useEffect(() => {
    if (!reviewingApplicationId) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setReviewingApplicationId(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reviewingApplicationId]);

  const selectedProgram = filteredPrograms.find((program) => program.id === selectedProgramId) || filteredPrograms[0] || null;
  const programApplications = selectedProgram ? filteredApplications.filter((application) => application.programId === selectedProgram.id) : [];
  const reviewingApplication = filteredApplications.find((application) => application.id === reviewingApplicationId) || null;

  useEffect(() => {
    setDecisionNote(reviewingApplication?.rejectionReason || reviewingApplication?.reviewerNote || '');
  }, [reviewingApplication?.id, reviewingApplication?.rejectionReason, reviewingApplication?.reviewerNote]);

  const applicantRecords = Object.values(
    filteredApplications.reduce((summary, application) => {
      const current = summary[application.applicantEmail];
      if (!current) {
        summary[application.applicantEmail] = {
          applicantEmail: application.applicantEmail,
          applicantName: application.applicantName,
          applicationCount: 1,
          latestStatus: application.status,
          latestProgramTitle: application.program?.title || 'Unknown program',
          latestSubmittedAt: application.submittedAt,
        };
        return summary;
      }
      current.applicationCount += 1;
      if (String(application.submittedAt) >= String(current.latestSubmittedAt)) {
        current.latestStatus = application.status;
        current.latestProgramTitle = application.program?.title || current.latestProgramTitle;
        current.latestSubmittedAt = application.submittedAt;
      }
      return summary;
    }, {})
  ).sort((a, b) => String(b.latestSubmittedAt).localeCompare(String(a.latestSubmittedAt)));

  const decisions = filteredApplications
    .filter((application) => ['Approved', 'Rejected'].includes(application.status))
    .sort((a, b) => String(b.reviewedAt || b.submittedAt).localeCompare(String(a.reviewedAt || a.submittedAt)));

  const pendingDecisions = applications.filter((application) => !['Approved', 'Rejected'].includes(application.status)).length;
  const finalDecisions = applications.filter((application) => ['Approved', 'Rejected'].includes(application.status)).length;
  const closeReviewModal = () => setReviewingApplicationId(null);

  return (
    <>
      <style>{`
        .personnel-app-shell,.personnel-app-tabs-shell,.personnel-app-tabs,.personnel-app-metrics,.personnel-app-toolbar,.personnel-app-table,.personnel-app-history,.personnel-app-requirements,.personnel-app-search,.personnel-app-submitted-grid{display:grid;gap:1rem}
        .personnel-app-tabs-shell,.personnel-app-panel,.personnel-app-metric,.personnel-app-row,.personnel-app-note,.personnel-app-history-item,.personnel-app-requirement-row,.personnel-app-search-field{border:1px solid rgba(24,111,67,.08);border-radius:22px;background:rgba(255,255,255,.95);box-shadow:var(--pf-shadow-sm)}
        .personnel-app-tabs-shell,.personnel-app-panel,.personnel-app-note{background:linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%)}
        .personnel-app-tabs-shell{padding:1rem 1.05rem}
        .personnel-app-tabs{grid-template-columns:repeat(3,minmax(0,1fr));width:min(100%,38rem)}
        .personnel-app-tab{padding:.84rem 1rem;border:none;border-radius:999px;background:transparent;color:var(--accent-deep);font-weight:800}
        .personnel-app-tab.is-active{color:#fff;background:linear-gradient(135deg,var(--pf-accent) 0%,var(--pf-accent-dark) 100%);box-shadow:0 12px 24px rgba(30,125,77,.18)}
        .personnel-app-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}
        .personnel-app-metric{padding:1rem 1.05rem;display:grid;gap:.2rem;background:radial-gradient(circle at top right,rgba(143,225,185,.18),transparent 34%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%)}
        .personnel-app-metric small,.personnel-app-head,.personnel-app-row p,.personnel-app-row small,.personnel-app-note p,.personnel-app-history-item p,.personnel-app-history-item small,.personnel-app-modal-header p,.personnel-app-requirement-copy p,.personnel-app-requirement-file p,.personnel-app-search span,.personnel-app-search-field input::placeholder{color:var(--pf-ink-muted)}
        .personnel-app-metric strong{display:block;margin:.18rem 0 .25rem;font-size:1.48rem;font-family:var(--pf-font-display);line-height:1.05}
        .personnel-app-metric span{font-weight:700;color:var(--pf-ink-soft)}
        .personnel-app-toolbar{grid-template-columns:minmax(0,1.2fr) minmax(180px,.45fr) minmax(220px,.55fr);align-items:end}
        .personnel-app-search span{font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
        .personnel-app-search-field{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:.8rem;padding:.95rem 1rem;background:rgba(255,255,255,.88)}
        .personnel-app-search-icon{width:1.1rem;height:1.1rem;color:var(--pf-accent-dark)}
        .personnel-app-search-field input{border:none;outline:none;background:transparent;color:var(--pf-ink);font:inherit;font-size:1rem}
        .personnel-app-panel{padding:1rem 1.05rem}
        .personnel-app-submitted-grid{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
        .personnel-app-scroll{max-height:34rem;overflow:auto;padding-right:.35rem}
        .personnel-app-scroll::-webkit-scrollbar{width:10px}
        .personnel-app-scroll::-webkit-scrollbar-thumb{background:rgba(24,111,67,.18);border-radius:999px}
        .personnel-app-table{gap:.85rem}
        .personnel-app-head,.personnel-app-row{display:grid;gap:1rem;align-items:start}
        .personnel-app-table.programs .personnel-app-head,.personnel-app-table.programs .personnel-app-row{grid-template-columns:minmax(0,1.6fr) minmax(150px,.9fr) minmax(170px,1fr) minmax(90px,.55fr) 110px 92px}
        .personnel-app-table.submissions .personnel-app-head,.personnel-app-table.submissions .personnel-app-row{grid-template-columns:minmax(0,1.25fr) minmax(110px,.7fr) minmax(120px,.8fr) minmax(90px,.6fr) 110px 92px}
        .personnel-app-table.records .personnel-app-head,.personnel-app-table.records .personnel-app-row,.personnel-app-table.decisions .personnel-app-head,.personnel-app-table.decisions .personnel-app-row{grid-template-columns:minmax(0,1.2fr) minmax(0,1.1fr) minmax(110px,.7fr) minmax(0,1.15fr) minmax(120px,.7fr)}
        .personnel-app-head{padding:0 .35rem;font-size:.76rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .personnel-app-scroll .personnel-app-head{position:sticky;top:0;z-index:2;padding:.35rem;border-radius:16px;background:linear-gradient(180deg,rgba(240,245,239,.98) 0%,rgba(240,245,239,.9) 100%)}
        .personnel-app-row{padding:1rem 1.05rem;background:linear-gradient(180deg,rgba(248,251,247,.98) 0%,rgba(239,244,238,.94) 100%)}
        .personnel-app-row strong,.personnel-app-note strong,.personnel-app-history-item strong,.personnel-app-requirement-copy strong,.personnel-app-requirement-file strong{display:block;margin-bottom:.2rem}
        .personnel-app-row p,.personnel-app-row small,.personnel-app-note p,.personnel-app-history-item p,.personnel-app-history-item small,.personnel-app-requirement-copy p,.personnel-app-requirement-file p{margin:0;line-height:1.5}
        .personnel-app-note{padding:1rem 1.05rem;background:rgba(30,125,77,.06)}
        .personnel-app-action-cell{display:flex;justify-content:flex-end}
        .personnel-app-clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .personnel-app-modal-backdrop{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:1.25rem;background:rgba(10,20,15,.5);backdrop-filter:blur(10px)}
        .personnel-app-modal{width:min(100%,60rem);max-height:min(92vh,60rem);overflow:auto;border-radius:28px;background:linear-gradient(180deg,rgba(252,253,251,.99) 0%,rgba(240,245,239,.98) 100%);border:1px solid rgba(18,32,25,.08);box-shadow:0 28px 90px rgba(10,20,15,.22)}
        .personnel-app-modal-header,.personnel-app-modal-footer{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.2rem 1.35rem}
        .personnel-app-modal-header{border-bottom:1px solid rgba(18,32,25,.08)}
        .personnel-app-modal-footer{border-top:1px solid rgba(18,32,25,.08);flex-wrap:wrap}
        .personnel-app-modal-body{display:grid;gap:1rem;padding:1.25rem 1.35rem}
        .personnel-app-modal-close{padding:.7rem .95rem;border-radius:14px;font-weight:700;border:1px solid rgba(18,32,25,.08);background:#fff}
        .personnel-app-modal-actions{display:flex;gap:.85rem;flex-wrap:wrap}
        .personnel-app-requirement-row{padding:1rem 1.05rem;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:1rem;align-items:center;background:rgba(255,255,255,.82)}
        .personnel-app-requirement-check input{width:1rem;height:1rem;accent-color:var(--pf-accent)}
        .personnel-app-file-link{display:inline-flex;align-items:center;justify-content:center;padding:.68rem 1rem;border-radius:999px;background:rgba(24,111,67,.1);color:var(--accent-deep);font-weight:800;text-decoration:none}
        @media (max-width:1180px){.personnel-app-metrics,.personnel-app-toolbar,.personnel-app-submitted-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.personnel-app-table.programs .personnel-app-head,.personnel-app-table.programs .personnel-app-row,.personnel-app-table.submissions .personnel-app-head,.personnel-app-table.submissions .personnel-app-row,.personnel-app-table.records .personnel-app-head,.personnel-app-table.records .personnel-app-row,.personnel-app-table.decisions .personnel-app-head,.personnel-app-table.decisions .personnel-app-row{grid-template-columns:repeat(2,minmax(0,1fr))}.personnel-app-action-cell{justify-content:flex-start}}
        @media (max-width:820px){.personnel-app-tabs,.personnel-app-metrics,.personnel-app-toolbar,.personnel-app-submitted-grid,.personnel-app-table.programs .personnel-app-head,.personnel-app-table.programs .personnel-app-row,.personnel-app-table.submissions .personnel-app-head,.personnel-app-table.submissions .personnel-app-row,.personnel-app-table.records .personnel-app-head,.personnel-app-table.records .personnel-app-row,.personnel-app-table.decisions .personnel-app-head,.personnel-app-table.decisions .personnel-app-row,.personnel-app-requirement-row{grid-template-columns:1fr}.personnel-app-head{display:none}.personnel-app-modal-backdrop{padding:.75rem}.personnel-app-modal-header,.personnel-app-modal-footer{flex-direction:column;align-items:stretch}}
      `}</style>

      <div className="personnel-app-shell">
        <div className="personnel-app-tabs-shell">
          <SectionHeading eyebrow="Office applications" title="Application Management" text="Track submissions, records, and decisions." />
          <div className="personnel-app-tabs" role="tablist" aria-label="Application management tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`personnel-app-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="personnel-app-metrics">
            <Metric label="Programs" value={officePrograms.length} detail="With office submissions" />
            <Metric label="Submissions" value={applications.length} detail="All incoming records" />
            <Metric label="Pending" value={pendingDecisions} detail="Still in queue" />
            <Metric label="Decisions" value={finalDecisions} detail="Approved or rejected" />
          </div>
          <div className="personnel-app-toolbar">
            <SearchField label="Search" value={search} onChange={setSearch} placeholder="Search program, applicant, email, ID, or status" />
            <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            <SelectField label="Program Type" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          </div>
        </div>

        {activeTab === 'submitted' ? (
          <div className="personnel-app-submitted-grid">
            <div className="personnel-app-panel">
              <SectionHeading eyebrow="Program queue" title="Program Listings" text="Listings with office submissions." />
              {filteredPrograms.length ? (
                <div className="personnel-app-scroll">
                  <div className="personnel-app-table programs">
                    <div className="personnel-app-head">
                      <span>Program</span>
                      <span>Type</span>
                      <span>Window</span>
                      <span>Volume</span>
                      <span>Status</span>
                      <span>Action</span>
                    </div>
                    {filteredPrograms.map((program) => {
                      const related = filteredApplications.filter((application) => application.programId === program.id);
                      return (
                        <article className="personnel-app-row" key={program.id}>
                          <div>
                            <strong>{program.title}</strong>
                            <p>{program.category} | {program.sector}</p>
                          </div>
                          <div>
                            <strong>{program.programType || 'Unspecified'}</strong>
                            <small>{program.municipality}</small>
                          </div>
                          <div>
                            <strong>{formatWindow(program)}</strong>
                            <small>{formatDate(program.deadline)}</small>
                          </div>
                          <div>
                            <strong>{related.length}</strong>
                            <small>{related.filter((application) => !['Approved', 'Rejected'].includes(application.status)).length} active</small>
                          </div>
                          <div><StatusPill status={program.status} /></div>
                          <div className="personnel-app-action-cell">
                            <button className="secondary-button" onClick={() => setSelectedProgramId(program.id)} type="button">View</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState title="No programs matched" text="Try a different filter." />
              )}
            </div>

            <div className="personnel-app-panel">
              <SectionHeading eyebrow={selectedProgram?.title || 'Program'} title="Applicant Submissions" text="Review records for the selected listing." />
              {selectedProgram ? (
                programApplications.length ? (
                  <div className="personnel-app-scroll">
                    <div className="personnel-app-table submissions">
                      <div className="personnel-app-head">
                        <span>Applicant</span>
                        <span>Submitted</span>
                        <span>Files</span>
                        <span>Priority</span>
                        <span>Status</span>
                        <span>Action</span>
                      </div>
                      {programApplications.map((application) => (
                        <article className="personnel-app-row" key={application.id}>
                          <div>
                            <strong>{application.applicantName}</strong>
                            <p>{application.applicantEmail}</p>
                          </div>
                          <div>
                            <strong>{formatDate(application.submittedAt)}</strong>
                            <small>{application.id}</small>
                          </div>
                          <div>
                            <strong>{application.documents.length} files</strong>
                            <small>{application.completeness}% ready</small>
                          </div>
                          <div>
                            <strong>{application.priority}</strong>
                            <small>{application.program?.programType || 'Unspecified'}</small>
                          </div>
                          <div><StatusPill status={application.status} /></div>
                          <div className="personnel-app-action-cell">
                            <button className="secondary-button" onClick={() => setReviewingApplicationId(application.id)} type="button">View</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No submissions for this program" text="No records match the current filters." />
                )
              ) : (
                <EmptyState title="No program selected" text="Choose a listing first." />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'records' ? (
          <div className="personnel-app-panel">
            <SectionHeading eyebrow="Applicants" title="Applicant Records" text="Latest records under your office." />
            {applicantRecords.length ? (
              <div className="personnel-app-table records">
                <div className="personnel-app-head">
                  <span>Applicant</span>
                  <span>Email</span>
                  <span>Count</span>
                  <span>Latest Program</span>
                  <span>Status</span>
                </div>
                {applicantRecords.map((record) => (
                  <article className="personnel-app-row" key={record.applicantEmail}>
                    <div>
                      <strong>{record.applicantName}</strong>
                      <p>{formatDate(record.latestSubmittedAt)}</p>
                    </div>
                    <div>
                      <strong>{record.applicantEmail}</strong>
                      <small>Office scope</small>
                    </div>
                    <div>
                      <strong>{record.applicationCount}</strong>
                      <small>Total records</small>
                    </div>
                    <div>
                      <strong>{record.latestProgramTitle}</strong>
                      <small>Most recent listing</small>
                    </div>
                    <div><StatusPill status={record.latestStatus} /></div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No applicant records matched" text="Try a different filter." />
            )}
          </div>
        ) : null}

        {activeTab === 'decisions' ? (
          <div className="personnel-app-panel">
            <SectionHeading eyebrow="Decision log" title="Decision Records" text="Final outcomes with notes." />
            {decisions.length ? (
              <div className="personnel-app-table decisions">
                <div className="personnel-app-head">
                  <span>Applicant</span>
                  <span>Program</span>
                  <span>Status</span>
                  <span>Note</span>
                  <span>Reviewed</span>
                </div>
                {decisions.map((application) => (
                  <article className="personnel-app-row" key={application.id}>
                    <div>
                      <strong>{application.applicantName}</strong>
                      <p>{application.applicantEmail}</p>
                    </div>
                    <div>
                      <strong>{application.program?.title || 'Unknown program'}</strong>
                      <small>{application.program?.programType || 'Unspecified'}</small>
                    </div>
                    <div><StatusPill status={application.status} /></div>
                    <div>
                      <strong className="personnel-app-clamp">{shortText(decisionReason(application))}</strong>
                      <small>{application.id}</small>
                    </div>
                    <div>
                      <strong>{formatDate(application.reviewedAt || application.submittedAt)}</strong>
                      <small>{application.status}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No decisions matched" text="Final records appear here after review." />
            )}
          </div>
        ) : null}
      </div>

      {reviewingApplication ? (
        <ModalShell
          title={reviewingApplication.applicantName}
          text={`${reviewingApplication.program?.title || 'Application'} | ${reviewingApplication.id}`}
          onClose={closeReviewModal}
          footer={
            <div className="personnel-app-modal-actions">
              <button className="secondary-button" onClick={closeReviewModal} type="button">Cancel</button>
              <button className="primary-button" onClick={() => actions.reviewApplication(reviewingApplication.id, 'Approved', decisionNote)} type="button">Approve</button>
              <button className="ghost-button" onClick={() => actions.reviewApplication(reviewingApplication.id, 'Rejected', decisionNote)} type="button">Reject</button>
            </div>
          }
        >
          <div className="detail-grid">
            <DetailItem label="Submitted" value={formatDate(reviewingApplication.submittedAt)} />
            <DetailItem label="Priority" value={reviewingApplication.priority} />
            <DetailItem label="Completeness" value={`${reviewingApplication.completeness}%`} />
            <DetailItem label="Status" value={reviewingApplication.status} />
            <DetailItem label="Files" value={reviewingApplication.documents.length} />
            <DetailItem label="Program Type" value={reviewingApplication.program?.programType || 'Unspecified'} />
          </div>

          <div className="personnel-app-note">
            <strong>Applicant note</strong>
            <p>{reviewingApplication.notes || 'No note provided.'}</p>
          </div>

          <div className="personnel-app-note">
            <strong>Requirements</strong>
            <div className="personnel-app-requirements">
              {getRequirementRows(reviewingApplication).map((item) => (
                <article className="personnel-app-requirement-row" key={`${reviewingApplication.id}-${item.requirement}`}>
                  <label className="personnel-app-requirement-check">
                    <input checked={item.submitted} readOnly type="checkbox" />
                  </label>
                  <div className="personnel-app-requirement-copy">
                    <strong>{item.requirement}</strong>
                    <p>{item.submitted ? 'Submitted' : 'Missing'}</p>
                  </div>
                  <div className="personnel-app-requirement-file">
                    {item.file ? (
                      <>
                        <strong>{item.file.fileName}</strong>
                        <p>{item.file.status}</p>
                        {item.file.fileUrl ? (
                          <a className="personnel-app-file-link" href={item.file.fileUrl} rel="noreferrer" target="_blank">
                            View File
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <strong>No file</strong>
                        <p>Not attached</p>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {reviewingApplication.status === 'Rejected' ? (
            <div className="personnel-app-note">
              <strong>Rejection note</strong>
              <p>{reviewingApplication.rejectionReason || 'No rejection note recorded.'}</p>
            </div>
          ) : null}

          <FormField
            label="Decision note"
            type="textarea"
            value={decisionNote}
            onChange={setDecisionNote}
            placeholder="Add a note before saving the decision"
          />

          <div className="personnel-app-history">
            {reviewingApplication.history.map((entry) => (
              <article className="personnel-app-history-item" key={`${reviewingApplication.id}-${entry.time}-${entry.status}`}>
                <strong>{entry.status}</strong>
                <p>{entry.detail}</p>
                <small>{entry.time}</small>
              </article>
            ))}
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
