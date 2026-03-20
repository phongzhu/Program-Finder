import { useRef, useState } from 'react';
import { EmptyState, StatusPill } from '../../../shared/components/ui';
import { getOfficeApplications, getOfficePrograms } from './helpers';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'applications', label: 'Applications' },
  { key: 'programs', label: 'Programs' },
  { key: 'performance', label: 'Performance' },
  { key: 'review', label: 'Review Queue' },
];

const REPORT_STYLES = `
  .personnel-reports-shell,.personnel-reports-toolbar,.personnel-reports-toolbar-top,.personnel-reports-toolbar-controls,.personnel-reports-metrics,.personnel-reports-stats,.personnel-reports-grid,.personnel-reports-split,.personnel-reports-list{display:grid;gap:1rem}
  .personnel-reports-shell{font-family:var(--pf-font-body,'DM Sans','Segoe UI',sans-serif);color:var(--pf-ink,#122019)}
  .personnel-reports-toolbar,.personnel-reports-panel,.personnel-reports-metric,.personnel-reports-stat,.personnel-reports-item,.personnel-reports-empty{border:1px solid rgba(24,111,67,.08);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%);box-shadow:0 12px 28px rgba(18,32,25,.05)}
  .personnel-reports-toolbar{padding:1.1rem;background:radial-gradient(circle at top right,rgba(143,225,185,.2),transparent 30%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%)}
  .personnel-reports-toolbar-top{grid-template-columns:minmax(0,1fr) auto;align-items:start}
  .personnel-reports-kicker,.personnel-reports-label,.personnel-reports-metric small,.personnel-reports-stat small{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .personnel-reports-kicker{color:var(--pf-accent-dark,#1e7d4d)}
  .personnel-reports-toolbar-copy strong,.personnel-reports-metric strong,.personnel-reports-stat strong{font-family:var(--pf-font-display,'Syne','Trebuchet MS',sans-serif);color:var(--pf-ink,#122019)}
  .personnel-reports-toolbar-copy strong{display:block;margin-top:.2rem;font-size:1.55rem;line-height:1.02}
  .personnel-reports-toolbar-copy p,.personnel-reports-item p,.personnel-reports-metric span,.personnel-reports-stat span,.personnel-reports-bar-copy p,.personnel-reports-search-input::placeholder{color:var(--pf-ink-muted,#4a6356)}
  .personnel-reports-toolbar-copy p,.personnel-reports-item p,.personnel-reports-bar-copy p{margin:0;line-height:1.55}
  .personnel-reports-toolbar-controls{grid-template-columns:minmax(280px,1.15fr) minmax(0,1fr);align-items:end}
  .personnel-reports-search,.personnel-reports-filter-block{display:grid;gap:.5rem}
  .personnel-reports-search-field{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:.8rem;padding:.95rem 1rem;border-radius:22px;border:1px solid rgba(24,111,67,.08);background:rgba(255,255,255,.86)}
  .personnel-reports-search-icon{width:1.1rem;height:1.1rem;color:var(--pf-accent-dark,#1e7d4d);opacity:.9}
  .personnel-reports-search-input{width:100%;border:none;outline:none;background:transparent;color:var(--pf-ink,#122019);font:inherit;font-size:1rem}
  .personnel-reports-filter-shell{display:flex;align-items:center;justify-content:space-between;gap:.9rem;padding:.4rem;border-radius:999px;border:1px solid rgba(24,111,67,.1);background:rgba(255,255,255,.75)}
  .personnel-reports-filter-strip,.personnel-reports-item-head{display:flex;gap:.55rem;flex-wrap:wrap}
  .personnel-reports-filter-strip{flex:1}
  .personnel-reports-filter{border:none;cursor:pointer;font:inherit;font-weight:800;padding:.75rem 1rem;border-radius:999px;background:transparent;color:var(--accent-deep,#1a5137);transition:transform .18s ease,background .18s ease,box-shadow .18s ease}
  .personnel-reports-filter.is-active{background:linear-gradient(135deg,var(--pf-accent,#2e8b57) 0%,var(--pf-accent-dark,#1e7d4d) 100%);color:#fff;box-shadow:0 12px 24px rgba(30,125,77,.18)}
  .personnel-reports-filter:hover,.personnel-reports-clear:hover,.personnel-reports-export:hover{transform:translateY(-1px)}
  .personnel-reports-actions{display:flex;justify-content:flex-end;align-items:center;gap:.7rem}
  .personnel-reports-clear,.personnel-reports-export{border:none;cursor:pointer;font:inherit;font-weight:800;border-radius:999px}
  .personnel-reports-clear{padding:.82rem 1rem;background:rgba(30,125,77,.08);border:1px solid rgba(24,111,67,.12);color:var(--accent-deep,#1a5137)}
  .personnel-reports-export{padding:.86rem 1.2rem;background:linear-gradient(135deg,var(--pf-accent,#2e8b57) 0%,var(--pf-accent-dark,#1e7d4d) 100%);color:#fff;box-shadow:0 14px 26px rgba(30,125,77,.2)}
  .personnel-reports-export:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
  .personnel-reports-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}
  .personnel-reports-metric{padding:1rem 1.05rem;background:radial-gradient(circle at top right,rgba(143,225,185,.18),transparent 36%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(232,239,231,.94) 100%)}
  .personnel-reports-metric strong{display:block;margin:.18rem 0 .25rem;font-size:1.7rem;line-height:1}
  .personnel-reports-panel{padding:1.05rem 1.15rem}
  .personnel-reports-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem}
  .personnel-reports-panel-head h3{margin:.18rem 0 0;font-size:1.04rem}
  .personnel-reports-panel-head p{margin:.28rem 0 0;color:var(--pf-ink-muted,#4a6356);line-height:1.55}
  .personnel-reports-grid{gap:.4rem}
  .personnel-reports-bar-row{display:grid;grid-template-columns:minmax(130px,.55fr) minmax(0,1fr) auto;align-items:center;gap:.9rem;padding:.4rem 0}
  .personnel-reports-bar-copy strong{display:block;font-size:.9rem}
  .personnel-reports-track{height:10px;border-radius:999px;background:rgba(18,32,25,.08);overflow:hidden}
  .personnel-reports-fill{display:block;height:100%;border-radius:999px}
  .tone-green{background:linear-gradient(90deg,rgba(30,125,77,.5) 0%,rgba(30,125,77,.95) 100%)}
  .tone-amber{background:linear-gradient(90deg,rgba(229,163,60,.5) 0%,rgba(229,163,60,.95) 100%)}
  .tone-rose{background:linear-gradient(90deg,rgba(195,86,75,.45) 0%,rgba(195,86,75,.92) 100%)}
  .personnel-reports-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:.85rem}
  .personnel-reports-stat{padding:.9rem 1rem}
  .personnel-reports-stat strong{display:block;margin:.18rem 0 .25rem;font-size:1.45rem;line-height:1}
  .personnel-reports-split{grid-template-columns:repeat(2,minmax(0,1fr))}
  .personnel-reports-list{gap:.75rem}
  .personnel-reports-item{padding:.92rem 1rem}
  .personnel-reports-item-head{justify-content:space-between;align-items:flex-start}
  .personnel-reports-item-meta{display:grid;gap:.2rem}
  .personnel-reports-item-meta strong{font-size:.92rem}
  .personnel-reports-item-value{display:grid;justify-items:end;gap:.45rem}
  .personnel-reports-empty{padding:1.1rem;background:rgba(255,255,255,.82)}
  .status-pill{display:inline-flex;align-items:center;justify-content:center;padding:.38rem .72rem;border-radius:999px;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:rgba(18,32,25,.08);color:var(--pf-ink-soft,#2d4e3e)}
  .status-pill.tone-success{background:rgba(46,139,87,.14);color:#256144}
  .status-pill.tone-warning{background:rgba(229,163,60,.16);color:#9c6916}
  .status-pill.tone-danger{background:rgba(195,86,75,.14);color:#9f3f35}
  @media (max-width:1180px){.personnel-reports-toolbar-controls,.personnel-reports-metrics,.personnel-reports-stats,.personnel-reports-split{grid-template-columns:repeat(2,minmax(0,1fr))}.personnel-reports-filter-shell{display:grid}}
  @media (max-width:820px){.personnel-reports-toolbar-top,.personnel-reports-toolbar-controls,.personnel-reports-metrics,.personnel-reports-stats,.personnel-reports-split,.personnel-reports-bar-row{grid-template-columns:1fr}.personnel-reports-actions{justify-content:stretch}.personnel-reports-actions>*{width:100%}.personnel-reports-item-head,.personnel-reports-item-value{justify-items:start}}
  @media print{body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.personnel-reports-shell{padding:20px}}
`;

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="personnel-reports-search-icon" viewBox="0 0 24 24">
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

function toTime(value) {
  if (!value) return 0;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();
  const fallback = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
}

function matchesSearch(term, ...parts) {
  if (!term) return true;
  return parts.flat().filter(Boolean).join(' ').toLowerCase().includes(term);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFilterLabel(filterKey) {
  return FILTERS.find((item) => item.key === filterKey)?.label || 'All';
}

function Metric({ label, value, detail }) {
  return (
    <article className="personnel-reports-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function Stat({ label, value, detail }) {
  return (
    <article className="personnel-reports-stat">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function BarRow({ label, value, maxValue, tone = 'green', hint }) {
  const width = Math.max(10, Math.round((value / Math.max(maxValue, 1)) * 100));

  return (
    <div className="personnel-reports-bar-row">
      <div className="personnel-reports-bar-copy">
        <strong>{label}</strong>
        {hint ? <p>{hint}</p> : null}
      </div>
      <div className="personnel-reports-track">
        <span className={`personnel-reports-fill tone-${tone}`} style={{ width: `${width}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function ActivityItem({ title, meta, value, status }) {
  return (
    <article className="personnel-reports-item">
      <div className="personnel-reports-item-head">
        <div className="personnel-reports-item-meta">
          <strong>{title}</strong>
          <p>{meta}</p>
        </div>
        <div className="personnel-reports-item-value">
          {status ? <StatusPill status={status} /> : null}
          {value ? <strong>{value}</strong> : null}
        </div>
      </div>
    </article>
  );
}

export default function ReportsScreen({ session, data }) {
  const rootRef = useRef(null);
  const [activeView, setActiveView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTerm = searchQuery.trim().toLowerCase();

  const officeName = session?.office || 'Assigned office';
  const municipalityName = session?.municipality || 'Assigned municipality';
  const needsActionStatuses = ['Submitted', 'For Review', 'Incomplete'];

  const programs = getOfficePrograms(data, session).map((program) => ({
    ...program,
    displayStatus: program.archived ? 'Archived' : program.status || 'Open',
  }));
  const applications = getOfficeApplications(data, session);

  const applicationStatusItems = ['Submitted', 'For Review', 'Incomplete', 'Approved', 'Rejected'].map((status) => ({
    label: status,
    value: applications.filter((application) => application.status === status).length,
    tone: status === 'Approved' ? 'green' : status === 'Rejected' ? 'rose' : status === 'Incomplete' ? 'amber' : 'green',
    hint: status === 'For Review' ? 'In queue' : status === 'Incomplete' ? 'Needs follow-up' : '',
  }));

  const programStatusItems = ['Open', 'Upcoming', 'Closed', 'Archived'].map((status) => ({
    label: status,
    value: programs.filter((program) => program.displayStatus === status).length,
    tone: status === 'Open' ? 'green' : status === 'Upcoming' ? 'amber' : 'rose',
    hint: status === 'Open' ? 'Live' : status === 'Upcoming' ? 'Next' : status === 'Archived' ? 'Stored' : 'Inactive',
  }));

  const documentStatusItems = ['Pending Review', 'Verified', 'Rejected'].map((status) => ({
    label: status,
    value: applications.reduce(
      (sum, application) => sum + (application.requirementFiles || []).filter((item) => (item.status || 'Pending Review') === status).length,
      0
    ),
    tone: status === 'Verified' ? 'green' : status === 'Rejected' ? 'rose' : 'amber',
    hint: status === 'Pending Review' ? 'Waiting' : status === 'Verified' ? 'Cleared' : 'Fix needed',
  }));

  const programTypeItems = Object.entries(
    programs.reduce((summary, program) => {
      const key = program.programType || 'Unspecified';
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  const performanceItems = programs
    .map((program) => {
      const entries = applications.filter((application) => application.programId === program.id);
      return {
        id: program.id,
        title: program.title,
        category: program.category || 'Uncategorized',
        status: program.displayStatus,
        applications: entries.length,
        pending: entries.filter((application) => needsActionStatuses.includes(application.status)).length,
        deadline: program.deadline || program.applicationEndDate,
      };
    })
    .sort((left, right) => right.applications - left.applications || right.pending - left.pending || left.title.localeCompare(right.title));

  const recentDecisions = applications
    .filter((application) => ['Approved', 'Rejected', 'Incomplete'].includes(application.status))
    .sort((left, right) => toTime(right.reviewedAt || right.submittedAt) - toTime(left.reviewedAt || left.submittedAt));

  const recentSubmissions = [...applications].sort((left, right) => toTime(right.submittedAt) - toTime(left.submittedAt));

  const filteredApplicationItems = searchTerm
    ? applicationStatusItems.filter((item) => matchesSearch(searchTerm, item.label, item.hint, 'applications'))
    : applicationStatusItems;
  const filteredProgramItems = searchTerm
    ? programStatusItems.filter((item) => matchesSearch(searchTerm, item.label, item.hint, 'programs'))
    : programStatusItems;
  const filteredPerformanceItems = searchTerm
    ? performanceItems.filter((item) => matchesSearch(searchTerm, item.title, item.category, item.status, `${item.applications} apps`, `${item.pending} pending`))
    : performanceItems;
  const filteredProgramTypes = searchTerm ? programTypeItems.filter((item) => matchesSearch(searchTerm, item.label, 'program type')) : programTypeItems;
  const filteredDocumentItems = searchTerm
    ? documentStatusItems.filter((item) => matchesSearch(searchTerm, item.label, item.hint, 'documents review'))
    : documentStatusItems;
  const filteredDecisions = searchTerm
    ? recentDecisions.filter((item) => matchesSearch(searchTerm, item.applicantName, item.status, item.reviewerNote, item.rejectionReason, item.notes))
    : recentDecisions;
  const filteredSubmissions = searchTerm
    ? recentSubmissions.filter((item) => matchesSearch(searchTerm, item.applicantName, item.status, item.priority, item.notes))
    : recentSubmissions;

  const maxApplication = Math.max(...filteredApplicationItems.map((item) => item.value), 1);
  const maxProgram = Math.max(...filteredProgramItems.map((item) => item.value), 1);
  const maxProgramType = Math.max(...filteredProgramTypes.map((item) => item.value), 1);
  const maxDocument = Math.max(...filteredDocumentItems.map((item) => item.value), 1);

  const visibleSections = {
    applications:
      (activeView === 'all' || activeView === 'applications') &&
      (!searchTerm || filteredApplicationItems.length || matchesSearch(searchTerm, officeName, municipalityName, 'applications')),
    programs:
      (activeView === 'all' || activeView === 'programs') &&
      (!searchTerm || filteredProgramItems.length || matchesSearch(searchTerm, officeName, municipalityName, programs.map((program) => program.title))),
    performance:
      (activeView === 'all' || activeView === 'performance') &&
      (!searchTerm || filteredPerformanceItems.length || filteredProgramTypes.length),
    review:
      (activeView === 'all' || activeView === 'review') &&
      (!searchTerm || filteredDocumentItems.length || filteredDecisions.length || filteredSubmissions.length),
  };

  const visibleSectionIds = Object.entries(visibleSections)
    .filter(([, isVisible]) => isVisible)
    .map(([key]) => key);

  const exportCurrentView = () => {
    const rootNode = rootRef.current;
    if (!rootNode || !visibleSectionIds.length) return;

    const headerMarkup = rootNode.querySelector('[data-report-export="header"]')?.outerHTML || '';
    const sectionsMarkup = visibleSectionIds
      .map((sectionId) => rootNode.querySelector(`[data-report-section="${sectionId}"]`)?.outerHTML || '')
      .join('');
    const printWindow = window.open('', '_blank', 'width=1280,height=920');

    if (!printWindow) {
      window.alert('Allow pop-ups to export the selected analytics to PDF.');
      return;
    }

    const nowLabel = new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    printWindow.document.write(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(
        officeName
      )} PDF Export</title><style>${REPORT_STYLES}</style></head><body><div class="personnel-reports-shell">${headerMarkup}<div class="personnel-reports-empty"><strong>${escapeHtml(
        `${officeName} report export`
      )}</strong><p>${escapeHtml(nowLabel)} | ${escapeHtml(getFilterLabel(activeView))} | ${escapeHtml(
        searchQuery.trim() || 'No search filter'
      )}</p></div>${sectionsMarkup}</div></body></html>`
    );
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 240);
  };

  return (
    <>
      <style>{REPORT_STYLES}</style>

      <div className="dashboard-grid personnel-reports-shell" ref={rootRef}>
        <div className="personnel-reports-toolbar" data-report-export="header">
          <div className="personnel-reports-toolbar-top">
            <div className="personnel-reports-toolbar-copy">
              <span className="personnel-reports-kicker">Office Reporting</span>
              <strong>Reports</strong>
              <p>{officeName} | {municipalityName}</p>
            </div>
            <div className="personnel-reports-actions">
              {searchQuery.trim() ? (
                <button className="personnel-reports-clear" onClick={() => setSearchQuery('')} type="button">
                  Clear
                </button>
              ) : null}
              <button className="personnel-reports-export" disabled={!visibleSectionIds.length} onClick={exportCurrentView} type="button">
                Export PDF
              </button>
            </div>
          </div>

          <div className="personnel-reports-toolbar-controls">
            <label className="personnel-reports-search">
              <span className="personnel-reports-label">Search</span>
              <span className="personnel-reports-search-field">
                <SearchIcon />
                <input
                  className="personnel-reports-search-input"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search programs, applicants, or status"
                  type="text"
                  value={searchQuery}
                />
              </span>
            </label>

            <div className="personnel-reports-filter-block">
              <span className="personnel-reports-label">Analytics View</span>
              <div className="personnel-reports-filter-shell">
                <div className="personnel-reports-filter-strip">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      className={`personnel-reports-filter ${activeView === filter.key ? 'is-active' : ''}`}
                      onClick={() => setActiveView(filter.key)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="personnel-reports-metrics">
          <Metric label="Programs" value={programs.length} detail="Office listings" />
          <Metric label="Applications" value={applications.length} detail={`${applications.filter((item) => needsActionStatuses.includes(item.status)).length} need action`} />
          <Metric label="Open" value={programs.filter((program) => program.displayStatus === 'Open').length} detail={`${programs.filter((program) => ['Open', 'Upcoming'].includes(program.displayStatus)).length} active`} />
          <Metric label="Approved" value={applications.filter((item) => item.status === 'Approved').length} detail={`${applications.length ? Math.round((applications.filter((item) => item.status === 'Approved').length / applications.length) * 100) : 0}% rate`} />
        </div>

        {visibleSections.applications ? (
          <div className="personnel-reports-panel" data-report-section="applications">
            <div className="personnel-reports-panel-head">
              <div>
                <span className="personnel-reports-kicker">Applications</span>
                <h3>Submission Pipeline</h3>
                <p>Office status breakdown.</p>
              </div>
            </div>
            {filteredApplicationItems.length ? (
              <div className="personnel-reports-grid">
                {filteredApplicationItems.map((item) => (
                  <BarRow key={item.label} hint={item.hint} label={item.label} maxValue={maxApplication} tone={item.tone} value={item.value} />
                ))}
              </div>
            ) : (
              <EmptyState title="No application analytics matched" text="Try a broader search." />
            )}
            <div className="personnel-reports-stats">
              <Stat label="Approval Rate" value={`${applications.length ? Math.round((applications.filter((item) => item.status === 'Approved').length / applications.length) * 100) : 0}%`} detail="Approved records" />
              <Stat label="Completeness" value={`${applications.length ? Math.round(applications.reduce((sum, item) => sum + (item.completeness || 0), 0) / applications.length) : 0}%`} detail="Average readiness" />
              <Stat label="Needs Action" value={applications.filter((item) => needsActionStatuses.includes(item.status)).length} detail="Queue count" />
            </div>
          </div>
        ) : null}

        {visibleSections.programs ? (
          <div className="personnel-reports-panel" data-report-section="programs">
            <div className="personnel-reports-panel-head">
              <div>
                <span className="personnel-reports-kicker">Programs</span>
                <h3>Listing Coverage</h3>
                <p>Live, upcoming, and archived records.</p>
              </div>
            </div>
            {filteredProgramItems.length ? (
              <div className="personnel-reports-grid">
                {filteredProgramItems.map((item) => (
                  <BarRow key={item.label} hint={item.hint} label={item.label} maxValue={maxProgram} tone={item.tone} value={item.value} />
                ))}
              </div>
            ) : (
              <EmptyState title="No program analytics matched" text="Try a broader search." />
            )}
            <div className="personnel-reports-stats">
              <Stat label="Active Listings" value={programs.filter((program) => ['Open', 'Upcoming'].includes(program.displayStatus)).length} detail="Open and upcoming" />
              <Stat label="With Images" value={programs.filter((program) => program.imageReference).length} detail="Banner ready" />
              <Stat label="Total Slots" value={programs.reduce((sum, program) => sum + Number(program.maxBeneficiaries || program.slots || 0), 0)} detail="Tracked capacity" />
            </div>
          </div>
        ) : null}

        {visibleSections.performance ? (
          <div className="personnel-reports-panel" data-report-section="performance">
            <div className="personnel-reports-panel-head">
              <div>
                <span className="personnel-reports-kicker">Performance</span>
                <h3>Top Listings and Program Mix</h3>
                <p>Fast view of demand by listing and type.</p>
              </div>
            </div>
            <div className="personnel-reports-split">
              <div>
                {filteredPerformanceItems.length ? (
                  <div className="personnel-reports-list">
                    {filteredPerformanceItems.slice(0, 5).map((item) => (
                      <ActivityItem
                        key={item.id}
                        meta={`${item.category} | ${item.pending} pending | ${formatDate(item.deadline)}`}
                        status={item.status}
                        title={item.title}
                        value={`${item.applications} apps`}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No performance data matched" text="Try a broader search." />
                )}
              </div>

              <div>
                {filteredProgramTypes.length ? (
                  <div className="personnel-reports-grid">
                    {filteredProgramTypes.map((item) => (
                      <BarRow key={item.label} label={item.label} maxValue={maxProgramType} value={item.value} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No program types matched" text="Try a broader search." />
                )}
              </div>
            </div>
          </div>
        ) : null}

        {visibleSections.review ? (
          <div className="personnel-reports-panel" data-report-section="review">
            <div className="personnel-reports-panel-head">
              <div>
                <span className="personnel-reports-kicker">Review</span>
                <h3>Files and Recent Activity</h3>
                <p>Document checks, decisions, and new submissions.</p>
              </div>
            </div>
            <div className="personnel-reports-split">
              <div>
                {filteredDocumentItems.length ? (
                  <div className="personnel-reports-grid">
                    {filteredDocumentItems.map((item) => (
                      <BarRow key={item.label} hint={item.hint} label={item.label} maxValue={maxDocument} tone={item.tone} value={item.value} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No document analytics matched" text="Try a broader search." />
                )}
                <div className="personnel-reports-stats">
                  <Stat label="Verified Files" value={documentStatusItems.find((item) => item.label === 'Verified')?.value || 0} detail="Cleared" />
                  <Stat label="Rejected Files" value={documentStatusItems.find((item) => item.label === 'Rejected')?.value || 0} detail="Need fixes" />
                  <Stat label="Rejected Apps" value={applications.filter((item) => item.status === 'Rejected').length} detail={`${applications.filter((item) => item.status === 'Incomplete').length} incomplete`} />
                </div>
              </div>

              <div className="personnel-reports-list">
                {filteredDecisions.slice(0, 3).map((item) => (
                  <ActivityItem
                    key={item.id}
                    meta={`${item.status} | ${formatDate(item.reviewedAt || item.submittedAt)}`}
                    status={item.status}
                    title={item.applicantName}
                    value={item.id}
                  />
                ))}
                {filteredSubmissions.slice(0, 3).map((item) => (
                  <ActivityItem
                    key={`${item.id}-submission`}
                    meta={`${item.priority || 'Normal'} | ${item.documents?.length || 0} files | ${formatDate(item.submittedAt)}`}
                    status={item.status}
                    title={item.applicantName}
                    value={item.id}
                  />
                ))}
                {!filteredDecisions.length && !filteredSubmissions.length ? (
                  <EmptyState title="No activity matched" text="Try a broader search." />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {!visibleSectionIds.length ? (
          <div className="personnel-reports-empty">
            <EmptyState title="No analytics match the current filters" text="Try a broader search or switch back to All." />
          </div>
        ) : null}
      </div>
    </>
  );
}
