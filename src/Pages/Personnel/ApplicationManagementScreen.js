import { useEffect, useState } from 'react';
import { DetailItem, EmptyState, FormField, SectionHeading, StatusPill } from 'Components/UI';
import { canReviewApplicants, getAccountRoleLabel } from 'Utils/staffHierarchy';
import { getManagedApplications, getManagedPrograms, getProgramById } from 'Services/Personnel/personnel-utils';

const TABS = [
  { key: 'submitted', label: 'Submissions' },
  { key: 'records',   label: 'Applicant Records' },
  { key: 'decisions', label: 'Decisions' },
];

const STATUS_OPTIONS = [
  { label: 'All statuses',  value: 'all' },
  { label: 'Submitted',     value: 'Submitted' },
  { label: 'For Review',    value: 'For Review' },
  { label: 'Incomplete',    value: 'Incomplete' },
  { label: 'Approved',      value: 'Approved' },
  { label: 'Rejected',      value: 'Rejected' },
];

/* ─── Tiny inline icons ─────────────────────────────────────────────────── */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'doc':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>;
    case 'inbox':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h4l2 3h4l2-3h4"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>;
    case 'clock':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7.5"/><path d="M12 7v5l3 2"/></svg>;
    case 'check':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>;
    case 'search':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.35-4.35"/></svg>;
    case 'alert':
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>;
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="7"/></svg>;
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(value) {
  if (!value) return 'Not set';
  const direct = new Date(value);
  const parsed = Number.isNaN(direct.getTime()) ? new Date(`${value}T12:00:00`) : direct;
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function formatWindow(program) {
  if (!program) return 'Schedule pending';
  if (program.applicationStartDate && program.applicationEndDate)
    return `${formatDate(program.applicationStartDate)} – ${formatDate(program.applicationEndDate)}`;
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

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function StatCard({ label, value, detail, icon, mod }) {
  return (
    <div className="am-stat">
      <div className={`am-stat-icon${mod ? ` am-stat-icon--${mod}` : ''}`}>
        <Icon name={icon} size={15} />
      </div>
      <div>
        <span className="am-stat-label">{label}</span>
        <strong className={`am-stat-val${mod ? ` am-stat-val--${mod}` : ''}`}>{value}</strong>
        <span className="am-stat-detail">{detail}</span>
      </div>
    </div>
  );
}

function Tag({ children, accent }) {
  return <span className={`am-tag${accent ? ' am-tag--accent' : ''}`}>{children}</span>;
}

/* ─── Route helper ───────────────────────────────────────────────────────── */
function getRouteState() {
  const path = (window.location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  if (path[0] !== 'personnel' || path[1] !== 'application-management') return { view: 'index', id: null };
  const view = path[2];
  const id = path[3] ? decodeURIComponent(path[3]) : null;
  if (view === 'program' && id) return { view: 'program', id };
  if (view === 'submission' && id) return { view: 'submission', id };
  return { view: 'index', id: null };
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */
export default function ApplicationManagementScreen({ session, data, actions, navigate }) {
  const hasApplicantAccess = canReviewApplicants(session);
  const officePrograms = [...getManagedPrograms(data, session)].sort((a, b) => a.title.localeCompare(b.title));
  const applications = [...getManagedApplications(data, session)]
    .map((application) => ({ ...application, program: getProgramById(data.programs, application.programId) }))
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

  const typeOptions = [
    { label: 'All program types', value: 'all' },
    ...[...new Set(officePrograms.map((p) => p.programType).filter(Boolean))].map((type) => ({ label: type, value: type })),
  ];

  const [activeTab, setActiveTab] = useState('submitted');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [decisionNote, setDecisionNote] = useState('');
  const routeState = getRouteState();

  const query = search.trim().toLowerCase();
  const filteredApplications = applications.filter((app) => {
    if (typeFilter !== 'all' && app.program?.programType !== typeFilter) return false;
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (!query) return true;
    return [app.id, app.applicantName, app.applicantEmail, app.status, app.program?.title, app.program?.programType]
      .some((v) => String(v || '').toLowerCase().includes(query));
  });

  const filteredPrograms = officePrograms.filter((program) => {
    const related = applications.filter((app) => app.programId === program.id);
    if (typeFilter !== 'all' && program.programType !== typeFilter) return false;
    if (statusFilter !== 'all' && !related.some((app) => app.status === statusFilter)) return false;
    if (!query) return true;
    const programMatch = [program.title, program.category, program.programType, program.status].some((v) =>
      String(v || '').toLowerCase().includes(query)
    );
    const applicationMatch = related.some((app) =>
      [app.applicantName, app.applicantEmail, app.id, app.status].some((v) =>
        String(v || '').toLowerCase().includes(query)
      )
    );
    return programMatch || applicationMatch;
  });

  const selectedProgram = routeState.view === 'program'
    ? officePrograms.find((p) => p.id === routeState.id) || null : null;
  const programApplications = selectedProgram
    ? applications.filter((app) => app.programId === selectedProgram.id) : [];
  const reviewingApplication = routeState.view === 'submission'
    ? applications.find((app) => app.id === routeState.id) || null : null;

  useEffect(() => {
    setDecisionNote(reviewingApplication?.rejectionReason || reviewingApplication?.reviewerNote || '');
  }, [reviewingApplication?.id, reviewingApplication?.rejectionReason, reviewingApplication?.reviewerNote]);

  const applicantRecords = Object.values(
    filteredApplications.reduce((summary, app) => {
      const curr = summary[app.applicantEmail];
      if (!curr) {
        summary[app.applicantEmail] = {
          applicantEmail: app.applicantEmail,
          applicantName: app.applicantName,
          applicationCount: 1,
          latestStatus: app.status,
          latestProgramTitle: app.program?.title || 'Unknown program',
          latestSubmittedAt: app.submittedAt,
        };
        return summary;
      }
      curr.applicationCount += 1;
      if (String(app.submittedAt) >= String(curr.latestSubmittedAt)) {
        curr.latestStatus = app.status;
        curr.latestProgramTitle = app.program?.title || curr.latestProgramTitle;
        curr.latestSubmittedAt = app.submittedAt;
      }
      return summary;
    }, {})
  ).sort((a, b) => String(b.latestSubmittedAt).localeCompare(String(a.latestSubmittedAt)));

  const decisions = filteredApplications
    .filter((app) => ['Approved', 'Rejected'].includes(app.status))
    .sort((a, b) => String(b.reviewedAt || b.submittedAt).localeCompare(String(a.reviewedAt || a.submittedAt)));

  const pendingDecisions = applications.filter((app) => !['Approved', 'Rejected'].includes(app.status)).length;
  const finalDecisions   = applications.filter((app) =>  ['Approved', 'Rejected'].includes(app.status)).length;
  const isDecisionFinal  = reviewingApplication ? ['Approved', 'Rejected'].includes(reviewingApplication.status) : false;

  const openProgramPage     = (id) => navigate(`/personnel/application-management/program/${id}`);
  const openSubmissionPage  = (id) => navigate(`/personnel/application-management/submission/${id}`);
  const openManagementIndex = ()   => navigate('/personnel/application-management');

  if (!hasApplicantAccess) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Applicant queue" title="Application management" text="Only captain, barangay, secretary, and legacy personnel roles can review applicant records." />
        <EmptyState
          title="Applicant review is locked"
          text={`${getAccountRoleLabel(session)} access is focused on non-applicant tasks, so this queue stays read-only for your account.`}
        />
      </div>
    );
  }

  return (
    <>
      <style>{AM_STYLES}</style>
      <div className="am-shell">

        {/* ── Stats ── */}
        <section className="am-stats">
          <StatCard icon="doc"   label="Programs"    value={officePrograms.length} detail="With office submissions" />
          <StatCard icon="inbox" label="Submissions"  value={applications.length}   detail="All incoming records"    mod="blue" />
          <StatCard icon="clock" label="Pending"      value={pendingDecisions}       detail="Still in queue"          mod="amber" />
          <StatCard icon="check" label="Decisions"    value={finalDecisions}         detail="Approved or rejected"    mod="green" />
        </section>

        {/* ── Toolbar ── */}
        <div className="am-toolbar">
          <div className="am-search-shell">
            <span className="am-search-icon"><Icon name="search" size={15} /></span>
            <input
              className="am-search-input"
              placeholder="Search program, applicant, email, ID, or status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
            />
          </div>
          <div className="am-filter-row">
            <div className="am-select-group">
              <label className="am-select-label" htmlFor="am-status-filter">Status</label>
              <select id="am-status-filter" className="am-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="am-select-group">
              <label className="am-select-label" htmlFor="am-type-filter">Program Type</label>
              <select id="am-type-filter" className="am-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Main panel ── */}
        <div className="am-panel">

          {/* ══ INDEX VIEW ══ */}
          {routeState.view === 'index' ? (
            <>
              <div className="am-panel-top">
                <div>
                  <span className="am-eyebrow">Program Queue</span>
                  <h2 className="am-panel-title">Application Management</h2>
                </div>
                <nav className="am-tabs" role="tablist">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      role="tab"
                      aria-selected={activeTab === tab.key}
                      className={`am-tab-btn${activeTab === tab.key ? ' is-active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="am-panel-body">

                {/* Submissions tab */}
                {activeTab === 'submitted' ? (
                  filteredPrograms.length ? (
                    <div className="am-table am-table--programs">
                      <div className="am-table-head">
                        <span>Program</span>
                        <span>Window</span>
                        <span>Queue</span>
                        <span>Type</span>
                        <span>Action</span>
                      </div>
                      <div className="am-table-body">
                        {filteredPrograms.map((program) => {
                          const related = filteredApplications.filter((app) => app.programId === program.id);
                          const pendingCnt = related.filter((app) => !['Approved', 'Rejected'].includes(app.status)).length;
                          return (
                            <article className="am-table-row" key={program.id}>
                              <div className="am-cell-program">
                                <strong className="am-program-title">{program.title}</strong>
                                <p className="am-clamp am-program-desc">
                                  {program.summary || `${program.category} support tailored to ${program.sector}.`}
                                </p>
                                <div className="am-tags">
                                  <Tag>{program.category}</Tag>
                                  <Tag accent>{program.sector}</Tag>
                                  <StatusPill status={program.status} />
                                </div>
                              </div>
                              <div className="am-cell">
                                <strong>{formatWindow(program)}</strong>
                                <small>Deadline {formatDate(program.deadline)}</small>
                              </div>
                              <div className="am-cell">
                                <strong>{related.length} total</strong>
                                <small>{pendingCnt} still in queue</small>
                              </div>
                              <div className="am-cell">
                                <strong>{program.programType || 'Unspecified'}</strong>
                                <small>{program.municipality}</small>
                              </div>
                              <div className="am-action-cell">
                                <button className="am-view-btn" onClick={() => openProgramPage(program.id)} type="button">View</button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="No programs matched" text="Try a different filter." />
                  )
                ) : null}

                {/* Applicant Records tab */}
                {activeTab === 'records' ? (
                  applicantRecords.length ? (
                    <div className="am-table am-table--records">
                      <div className="am-table-head">
                        <span>Applicant</span>
                        <span>Email</span>
                        <span>Count</span>
                        <span>Latest Program</span>
                        <span>Status</span>
                      </div>
                      <div className="am-table-body">
                        {applicantRecords.map((record) => (
                          <article className="am-table-row" key={record.applicantEmail}>
                            <div className="am-cell">
                              <strong>{record.applicantName}</strong>
                              <small>{formatDate(record.latestSubmittedAt)}</small>
                            </div>
                            <div className="am-cell">
                              <strong>{record.applicantEmail}</strong>
                              <small>Office scope</small>
                            </div>
                            <div className="am-cell">
                              <strong>{record.applicationCount}</strong>
                              <small>Total records</small>
                            </div>
                            <div className="am-cell">
                              <strong>{record.latestProgramTitle}</strong>
                              <small>Most recent listing</small>
                            </div>
                            <div className="am-cell"><StatusPill status={record.latestStatus} /></div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="No applicant records matched" text="Try a different filter." />
                  )
                ) : null}

                {/* Decisions tab */}
                {activeTab === 'decisions' ? (
                  decisions.length ? (
                    <div className="am-table am-table--decisions">
                      <div className="am-table-head">
                        <span>Applicant</span>
                        <span>Program</span>
                        <span>Status</span>
                        <span>Note</span>
                        <span>Reviewed</span>
                      </div>
                      <div className="am-table-body">
                        {decisions.map((app) => (
                          <article className="am-table-row" key={app.id}>
                            <div className="am-cell">
                              <strong>{app.applicantName}</strong>
                              <small>{app.applicantEmail}</small>
                            </div>
                            <div className="am-cell">
                              <strong>{app.program?.title || 'Unknown program'}</strong>
                              <small>{app.program?.programType || 'Unspecified'}</small>
                            </div>
                            <div className="am-cell"><StatusPill status={app.status} /></div>
                            <div className="am-cell">
                              <strong className="am-clamp">{shortText(decisionReason(app))}</strong>
                              <small>{app.id}</small>
                            </div>
                            <div className="am-cell">
                              <strong>{formatDate(app.reviewedAt || app.submittedAt)}</strong>
                              <small>{app.status}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="No decisions matched" text="Final records appear here after review." />
                  )
                ) : null}

              </div>
            </>
          ) : null}

          {/* ══ PROGRAM VIEW ══ */}
          {routeState.view === 'program' ? (
            selectedProgram ? (
              <>
                <div className="am-panel-top am-panel-top--spaced">
                  <div>
                    <span className="am-eyebrow">Program Queue</span>
                    <h2 className="am-panel-title">{selectedProgram.title}</h2>
                    <p className="am-panel-subtitle">Applicant submissions for the selected listing.</p>
                  </div>
                  <button className="am-back-btn" onClick={openManagementIndex} type="button">← Back to Application Management</button>
                </div>

                <div className="am-panel-body">
                  <div className="am-meta-grid">
                    <DetailItem label="Program Type" value={selectedProgram.programType || 'Unspecified'} />
                    <DetailItem label="Status"       value={selectedProgram.status || 'Open'} />
                    <DetailItem label="Application Window" value={formatWindow(selectedProgram)} />
                    <DetailItem label="Municipality" value={selectedProgram.municipality || 'Province-wide'} />
                    <DetailItem label="Submissions"  value={programApplications.length} />
                    <DetailItem label="Category"     value={selectedProgram.category || 'Unspecified'} />
                  </div>

                  {programApplications.length ? (
                    <div className="am-table am-table--submissions am-table--mt">
                      <div className="am-table-head">
                        <span>Applicant</span>
                        <span>Submitted</span>
                        <span>Files</span>
                        <span>Priority</span>
                        <span>Status</span>
                        <span>Action</span>
                      </div>
                      <div className="am-table-body">
                        {programApplications.map((app) => (
                          <article className="am-table-row" key={app.id}>
                            <div className="am-cell">
                              <strong>{app.applicantName}</strong>
                              <small>{app.applicantEmail}</small>
                            </div>
                            <div className="am-cell">
                              <strong>{formatDate(app.submittedAt)}</strong>
                              <small>{app.id}</small>
                            </div>
                            <div className="am-cell">
                              <strong>{app.documents.length} files</strong>
                              <small>{app.completeness}% ready</small>
                            </div>
                            <div className="am-cell">
                              <strong>{app.priority}</strong>
                              <small>{app.program?.programType || 'Unspecified'}</small>
                            </div>
                            <div className="am-cell"><StatusPill status={app.status} /></div>
                            <div className="am-action-cell">
                              <button className="am-view-btn" onClick={() => openSubmissionPage(app.id)} type="button">View</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="No submissions for this program" text="No records are available for this listing yet." />
                  )}
                </div>
              </>
            ) : (
              <div className="am-panel-body">
                <EmptyState title="Program not found" text="The selected program could not be loaded." />
              </div>
            )
          ) : null}

          {/* ══ SUBMISSION REVIEW VIEW ══ */}
          {routeState.view === 'submission' ? (
            reviewingApplication ? (
              <>
                <div className="am-panel-top am-panel-top--spaced">
                  <div>
                    <span className="am-eyebrow">Application Review</span>
                    <h2 className="am-panel-title">{reviewingApplication.program?.title || 'Application'}</h2>
                    <p className="am-panel-subtitle">{reviewingApplication.applicantName}</p>
                  </div>
                  <div className="am-review-actions">
                    <span className="am-status-badge">{reviewingApplication.status}</span>
                    <button className="am-back-btn" onClick={() => openProgramPage(reviewingApplication.programId)} type="button">← Program Submissions</button>
                    <button className="am-ghost-btn" onClick={openManagementIndex} type="button">← Application Management</button>
                  </div>
                </div>

                <div className="am-panel-body">
                  <div className="am-review-shell">

                    {/* Left sidebar */}
                    <aside className="am-review-left">
                      <div className="am-review-card">
                        <div className="am-profile-head">
                          <div className="am-avatar">{getInitials(reviewingApplication.applicantName)}</div>
                          <strong className="am-profile-name">{reviewingApplication.applicantName}</strong>
                          <span className="am-profile-id">ID: {reviewingApplication.id}</span>
                        </div>
                        <div className="am-meta-pair">
                          <div className="am-meta-box">
                            <span className="am-meta-label">Birth Date</span>
                            <strong>{reviewingApplication.applicantSnapshot?.birthDate ? formatDate(reviewingApplication.applicantSnapshot.birthDate) : 'Not provided'}</strong>
                          </div>
                          <div className="am-meta-box">
                            <span className="am-meta-label">Civil Status</span>
                            <strong>{reviewingApplication.applicantSnapshot?.civilStatus || 'Not provided'}</strong>
                          </div>
                        </div>
                        <div className="am-meta-box">
                          <span className="am-meta-label">Address</span>
                          <strong>{reviewingApplication.applicantSnapshot?.address || 'Not provided'}</strong>
                        </div>
                        <div className="am-meta-box">
                          <span className="am-meta-label">Contact</span>
                          <strong>{reviewingApplication.applicantSnapshot?.email || reviewingApplication.applicantEmail}</strong>
                          <span className="am-meta-sub">{reviewingApplication.applicantSnapshot?.phone || 'Not provided'}</span>
                        </div>
                        <div className="am-meta-box">
                          <span className="am-meta-label">Household Monthly Income</span>
                          <strong>{reviewingApplication.applicantSnapshot?.householdIncome || 'Not provided'}</strong>
                        </div>
                      </div>

                      <div className="am-review-card">
                        <strong className="am-card-section-title">Meta Information</strong>
                        <div className="am-meta-pair">
                          <div className="am-meta-box">
                            <span className="am-meta-label">Priority</span>
                            <strong>{reviewingApplication.priority}</strong>
                          </div>
                          <div className="am-meta-box">
                            <span className="am-meta-label">Completeness</span>
                            <strong>{reviewingApplication.completeness}%</strong>
                          </div>
                          <div className="am-meta-box">
                            <span className="am-meta-label">Submitted</span>
                            <strong>{formatDate(reviewingApplication.submittedAt)}</strong>
                          </div>
                          <div className="am-meta-box">
                            <span className="am-meta-label">Program Type</span>
                            <strong>{reviewingApplication.program?.programType || 'Unspecified'}</strong>
                          </div>
                        </div>
                      </div>
                    </aside>

                    {/* Right main */}
                    <div className="am-review-right">

                      {/* Requirements */}
                      <div className="am-review-card">
                        <div className="am-review-card-head">
                          <strong className="am-card-section-title">Requirement Checklist</strong>
                          <span className={`am-checklist-badge${getRequirementRows(reviewingApplication).every((i) => i.submitted) ? ' am-checklist-badge--ok' : ''}`}>
                            {getRequirementRows(reviewingApplication).every((i) => i.submitted) ? 'All Verified' : 'Needs Review'}
                          </span>
                        </div>
                        <div className="am-req-list">
                          {getRequirementRows(reviewingApplication).map((item) => (
                            <article className="am-req-row" key={`${reviewingApplication.id}-${item.requirement}`}>
                              <span className={`am-req-icon${item.submitted ? ' am-req-icon--ok' : ' am-req-icon--missing'}`}>
                                {item.submitted ? '✓' : '!'}
                              </span>
                              <div className="am-req-copy">
                                <strong>{item.requirement}</strong>
                                <span>{item.file ? `${item.file.fileName} — ${item.file.status}` : 'Missing file'}</span>
                              </div>
                              <div>
                                {item.file?.fileUrl ? (
                                  <a className="am-file-link" href={item.file.fileUrl} rel="noreferrer" target="_blank">View File</a>
                                ) : (
                                  <span className="am-no-file">No file</span>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>

                      {/* Decision */}
                      <div className="am-review-card">
                        <strong className="am-card-section-title">Decision Note</strong>
                        <div className="am-decision-note">
                          <p>{decisionNote || reviewingApplication.notes || 'No decision note recorded.'}</p>
                          <span className="am-decision-note-meta">
                            {isDecisionFinal
                              ? `Reviewed and locked (${reviewingApplication.status}).`
                              : 'Pending reviewer decision.'}
                          </span>
                        </div>
                        {isDecisionFinal ? (
                          <div className="am-locked-notice">
                            <Icon name="check" size={14} />
                            Decision controls are hidden — this application is already {reviewingApplication.status.toLowerCase()}.
                          </div>
                        ) : (
                          <>
                            <FormField
                              label="Decision note"
                              type="textarea"
                              value={decisionNote}
                              onChange={setDecisionNote}
                              placeholder="Add a note before saving the decision"
                            />
                            <div className="am-decision-actions">
                              <button
                                className="am-approve-btn"
                                onClick={() => actions.reviewApplication(reviewingApplication.id, 'Approved', decisionNote)}
                                type="button"
                              >
                                Approve Application
                              </button>
                              <button
                                className="am-reject-btn"
                                onClick={() => actions.reviewApplication(reviewingApplication.id, 'Rejected', decisionNote)}
                                type="button"
                              >
                                Reject Application
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* History */}
                      <div className="am-review-card">
                        <strong className="am-card-section-title">Application History</strong>
                        <div className="am-history">
                          {reviewingApplication.history.map((entry) => (
                            <article className="am-history-item" key={`${reviewingApplication.id}-${entry.time}-${entry.status}`}>
                              <span className="am-history-dot" />
                              <div>
                                <strong className="am-history-status">{entry.status}</strong>
                                <p className="am-history-detail">{entry.detail}</p>
                                <span className="am-history-time">{entry.time}</span>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="am-panel-body">
                <EmptyState title="Submission not found" text="The selected submission could not be loaded." />
              </div>
            )
          ) : null}

        </div>
      </div>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const AM_STYLES = `
  /* Shell */
  .am-shell {
    display: grid;
    gap: 14px;
    padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
    box-sizing: border-box;
    font-family: var(--pf-font-body, system-ui, sans-serif);
    color: #1a3356;
  }

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  .am-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 1100px) { .am-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px)  { .am-stats { grid-template-columns: 1fr; } }

  .am-stat {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(15,47,99,.04);
  }
  .am-stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    display: grid;
    place-items: center;
    color: #2a4e8c;
    flex-shrink: 0;
  }
  .am-stat-icon--blue   { background: #eef4ff; border-color: #c8d8f5; color: #2a4e8c; }
  .am-stat-icon--amber  { background: #fff8e6; border-color: #efd488; color: #9a6700; }
  .am-stat-icon--green  { background: #f0faf5; border-color: #9ed0b5; color: #1a7f4e; }

  .am-stat-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #7a8fa6;
    margin-bottom: 2px;
  }
  .am-stat-val {
    display: block;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    color: #0f2f63;
    letter-spacing: -0.03em;
    margin-bottom: 3px;
  }
  .am-stat-val--amber { color: #9a6700; }
  .am-stat-val--green { color: #1a7f4e; }
  .am-stat-val--blue  { color: #2a4e8c; }
  .am-stat-detail { font-size: 0.76rem; color: #7a8fa6; display: block; }

  /* ── Toolbar ───────────────────────────────────────────────────────────── */
  .am-toolbar {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    padding: 14px 16px;
    display: grid;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(15,47,99,.04);
  }
  .am-search-shell {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafd;
    border: 1px solid #d7dde8;
    border-radius: 9px;
    padding: 0 14px;
    height: 42px;
  }
  .am-search-icon { color: #7a8fa6; flex-shrink: 0; }
  .am-search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: 0.92rem;
    color: #1a3356;
  }
  .am-search-input::placeholder { color: #a0b0c4; }
  .am-filter-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .am-select-group { display: grid; gap: 4px; flex: 1; min-width: 160px; }
  .am-select-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #7a8fa6;
  }
  .am-select {
    padding: 8px 12px;
    border: 1px solid #d7dde8;
    border-radius: 8px;
    background: #f8fafd;
    font: inherit;
    font-size: 0.88rem;
    color: #1a3356;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s;
    appearance: auto;
  }
  .am-select:hover { border-color: #a8c4f0; }
  .am-select:focus { outline: none; border-color: #2a4e8c; }

  /* ── Main panel ────────────────────────────────────────────────────────── */
  .am-panel {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(15,47,99,.05);
    overflow: hidden;
  }
  .am-panel-top {
    padding: 16px 20px;
    background: #f8fafd;
    border-bottom: 1px solid #e8ecf2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .am-panel-top--spaced { align-items: flex-start; }
  .am-panel-body { padding: 20px; }
  .am-eyebrow {
    display: block;
    font-size: 0.67rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7a8fa6;
    margin-bottom: 3px;
  }
  .am-panel-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #0f2f63;
    line-height: 1.2;
  }
  .am-panel-subtitle { margin: 4px 0 0; font-size: 0.84rem; color: #4a5e7a; }

  /* ── Tabs ──────────────────────────────────────────────────────────────── */
  .am-tabs {
    display: flex;
    gap: 0;
    align-items: center;
    border: 1px solid #d7dde8;
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .am-tab-btn {
    background: #f8fafd;
    border: none;
    border-right: 1px solid #d7dde8;
    padding: 8px 16px;
    font: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    color: #4a5e7a;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .am-tab-btn:last-child { border-right: none; }
  .am-tab-btn:hover { background: #eef4ff; color: #0f2f63; }
  .am-tab-btn.is-active {
    background: #0f2f63;
    color: #ffffff;
    font-weight: 700;
  }

  /* ── Table ─────────────────────────────────────────────────────────────── */
  .am-table { border: 1px solid #d7dde8; border-radius: 10px; overflow: hidden; }
  .am-table--mt { margin-top: 16px; }
  .am-table-head {
    display: grid;
    gap: 12px;
    padding: 10px 16px;
    background: #f8fafd;
    border-bottom: 1px solid #e8ecf2;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7a8fa6;
    align-items: center;
  }
  .am-table-body { display: grid; }
  .am-table-row {
    display: grid;
    gap: 12px;
    padding: 14px 16px;
    align-items: center;
    border-bottom: 1px solid #e8ecf2;
    background: #ffffff;
    transition: background 0.12s;
  }
  .am-table-row:last-child { border-bottom: none; }
  .am-table-row:hover { background: #f8fafd; }

  /* Column layouts */
  .am-table--programs .am-table-head,
  .am-table--programs .am-table-row {
    grid-template-columns: minmax(0, 1.85fr) minmax(200px, .9fr) minmax(120px, .55fr) minmax(180px, .75fr) 80px;
  }
  .am-table--submissions .am-table-head,
  .am-table--submissions .am-table-row {
    grid-template-columns: minmax(0, 1.25fr) minmax(110px, .65fr) minmax(100px, .65fr) minmax(90px, .55fr) 110px 80px;
  }
  .am-table--records .am-table-head,
  .am-table--records .am-table-row,
  .am-table--decisions .am-table-head,
  .am-table--decisions .am-table-row {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(110px, .65fr) minmax(0, 1.15fr) minmax(120px, .65fr);
  }

  @media (max-width: 1100px) {
    .am-table--programs .am-table-head,
    .am-table--programs .am-table-row,
    .am-table--submissions .am-table-head,
    .am-table--submissions .am-table-row,
    .am-table--records .am-table-head,
    .am-table--records .am-table-row,
    .am-table--decisions .am-table-head,
    .am-table--decisions .am-table-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .am-table-head { display: none; }
    .am-action-cell { justify-content: flex-start; }
  }
  @media (max-width: 640px) {
    .am-table--programs .am-table-row,
    .am-table--submissions .am-table-row,
    .am-table--records .am-table-row,
    .am-table--decisions .am-table-row {
      grid-template-columns: 1fr;
    }
  }

  /* Cell styles */
  .am-cell { min-width: 0; }
  .am-cell strong {
    display: block;
    font-size: 0.88rem;
    font-weight: 700;
    color: #1a3356;
    margin-bottom: 2px;
    line-height: 1.3;
  }
  .am-cell small,
  .am-cell p { display: block; font-size: 0.76rem; color: #7a8fa6; margin: 0; line-height: 1.4; }

  .am-cell-program { min-width: 0; display: grid; gap: 5px; }
  .am-program-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: #0f2f63;
    line-height: 1.25;
    display: block;
    margin-bottom: 2px;
  }
  .am-program-desc {
    font-size: 0.78rem;
    color: #4a5e7a;
    margin: 0;
    line-height: 1.45;
  }
  .am-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .am-tags { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; margin-top: 4px; }
  .am-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    color: #2a4e8c;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .am-tag--accent { background: #f0faf5; border-color: #9ed0b5; color: #1a7f4e; }

  .am-action-cell { display: flex; justify-content: flex-end; align-items: center; }
  .am-view-btn {
    background: #ffffff;
    border: 1px solid #c8d8f5;
    border-radius: 7px;
    padding: 6px 14px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: #2a4e8c;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;
  }
  .am-view-btn:hover { background: #eef4ff; border-color: #a8c4f0; }

  /* Meta grid (program detail) */
  .am-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 4px;
  }
  @media (max-width: 900px) { .am-meta-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .am-meta-grid { grid-template-columns: 1fr; } }

  /* ── Review shell ──────────────────────────────────────────────────────── */
  .am-review-shell {
    display: grid;
    grid-template-columns: minmax(260px, .68fr) minmax(0, 1.32fr);
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 900px) { .am-review-shell { grid-template-columns: 1fr; } }
  .am-review-left, .am-review-right { display: grid; gap: 14px; }

  .am-review-card {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 12px;
    padding: 16px;
    display: grid;
    gap: 12px;
    box-shadow: 0 1px 3px rgba(15,47,99,.04);
  }
  .am-review-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .am-card-section-title {
    display: block;
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f2f63;
  }

  /* Profile */
  .am-profile-head { display: grid; justify-items: center; text-align: center; gap: 6px; }
  .am-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #dde9ff;
    color: #2a4e8c;
    border: 2px solid #b8d0f5;
    display: grid;
    place-items: center;
    font-size: 1.25rem;
    font-weight: 800;
  }
  .am-profile-name { font-size: 1.05rem; font-weight: 700; color: #0f2f63; margin: 0; }
  .am-profile-id   { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #7a8fa6; }

  /* Meta boxes */
  .am-meta-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .am-meta-box {
    background: #f8fafd;
    border: 1px solid #e8ecf2;
    border-radius: 8px;
    padding: 8px 10px;
    display: grid;
    gap: 3px;
  }
  .am-meta-label {
    font-size: 0.67rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #7a8fa6;
    display: block;
  }
  .am-meta-box strong { font-size: 0.88rem; color: #1a3356; display: block; }
  .am-meta-sub { font-size: 0.78rem; color: #7a8fa6; display: block; }

  /* Checklist badge */
  .am-checklist-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: #fff8e6;
    border: 1px solid #efd488;
    color: #9a6700;
    font-size: 0.72rem;
    font-weight: 700;
  }
  .am-checklist-badge--ok { background: #f0faf5; border-color: #9ed0b5; color: #1a7f4e; }

  /* Requirements */
  .am-req-list { display: grid; gap: 8px; }
  .am-req-row {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid #e8ecf2;
    border-radius: 9px;
    background: #f8fafd;
  }
  .am-req-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    font-size: 0.76rem;
    font-weight: 900;
    flex-shrink: 0;
  }
  .am-req-icon--ok     { background: #f0faf5; border: 1px solid #9ed0b5; color: #1a7f4e; }
  .am-req-icon--missing{ background: #fff3f2; border: 1px solid #f5c4a8; color: #9b4f1a; }
  .am-req-copy strong { display: block; font-size: 0.86rem; font-weight: 700; color: #1a3356; margin-bottom: 2px; }
  .am-req-copy span   { font-size: 0.76rem; color: #7a8fa6; }
  .am-file-link {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 6px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    color: #2a4e8c;
    font-size: 0.76rem;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .am-file-link:hover { background: #dde9ff; }
  .am-no-file {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 6px;
    background: #f4f7fb;
    border: 1px solid #d7dde8;
    color: #7a8fa6;
    font-size: 0.76rem;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Decision */
  .am-decision-note {
    background: #f8fafd;
    border-left: 3px solid #2a4e8c;
    border-radius: 0 8px 8px 0;
    padding: 12px 14px;
    border-top: 1px solid #e8ecf2;
    border-right: 1px solid #e8ecf2;
    border-bottom: 1px solid #e8ecf2;
  }
  .am-decision-note p  { margin: 0 0 6px; font-size: 0.88rem; color: #1a3356; line-height: 1.55; }
  .am-decision-note-meta { font-size: 0.76rem; color: #7a8fa6; }
  .am-locked-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f0faf5;
    border: 1px solid #9ed0b5;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.86rem;
    font-weight: 600;
    color: #1a7f4e;
  }
  .am-decision-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .am-approve-btn {
    background: #0f2f63;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }
  .am-approve-btn:hover { background: #1a4a8a; }
  .am-reject-btn {
    background: #ffffff;
    color: #9b4f1a;
    border: 1px solid #f5c4a8;
    border-radius: 8px;
    padding: 10px 18px;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .am-reject-btn:hover { background: #fff3f2; border-color: #e0a080; }

  /* History */
  .am-history { display: grid; gap: 12px; }
  .am-history-item {
    display: grid;
    grid-template-columns: 10px 1fr;
    gap: 10px;
    align-items: start;
  }
  .am-history-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #0f2f63;
    margin-top: 4px;
    flex-shrink: 0;
  }
  .am-history-status { display: block; font-size: 0.86rem; font-weight: 700; color: #1a3356; margin-bottom: 3px; }
  .am-history-detail { margin: 0 0 3px; font-size: 0.78rem; color: #4a5e7a; line-height: 1.5; }
  .am-history-time   { font-size: 0.72rem; color: #7a8fa6; display: block; }

  /* Review page top bar */
  .am-review-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .am-status-badge {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 999px;
    background: #eef4ff;
    border: 1px solid #c8d8f5;
    color: #2a4e8c;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .am-back-btn {
    background: #ffffff;
    border: 1px solid #d7dde8;
    border-radius: 8px;
    padding: 7px 14px;
    font: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    color: #2a4e8c;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;
  }
  .am-back-btn:hover { background: #eef4ff; border-color: #a8c4f0; }
  .am-ghost-btn {
    background: none;
    border: none;
    color: #7a8fa6;
    font: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    transition: color 0.15s;
  }
  .am-ghost-btn:hover { color: #0f2f63; }
`;
