import { useRef, useState } from 'react';
import { EmptyState, StatusPill } from '../../../shared/components/ui';

const ANALYTICS_FILTERS = [
  { key: 'all', label: 'All Analytics' },
  { key: 'users', label: 'Users' },
  { key: 'applications', label: 'Applications' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'performance', label: 'Area Performance' },
  { key: 'operations', label: 'Operations' },
  { key: 'taxonomy', label: 'Taxonomy' },
];

const REPORTS_STYLES = `
  .rp-root{font-family:var(--pf-font-body,'DM Sans','Segoe UI',sans-serif);background:#f2f5f0;min-height:100vh;padding:28px 32px 60px;box-sizing:border-box;color:var(--pf-ink,#122019);display:flex;flex-direction:column;gap:20px}
  .rp-header,.rp-toolbar-copy,.rp-toolbar-controls,.rp-filter-block,.rp-results-card,.rp-taxonomy-stack,.rp-export-only{display:grid}
  .rp-header{gap:.35rem}
  .rp-eyebrow,.rp-toolbar-kicker,.rp-field-label{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .rp-eyebrow,.rp-toolbar-kicker{color:var(--pf-accent-dark,#1e7d4d)}
  .rp-title,.rp-toolbar-copy strong,.rp-hero-stat-value,.rp-export-meta strong{font-family:var(--pf-font-display,'Syne','Trebuchet MS',sans-serif);color:var(--pf-ink,#122019)}
  .rp-title{font-size:2rem;font-weight:700;line-height:1.02;letter-spacing:-.03em}
  .rp-description{max-width:46rem;font-size:.95rem;line-height:1.65;color:var(--pf-ink-muted,#4a6356)}
  .rp-toolbar-shell{padding:1.15rem;border-radius:26px;border:1px solid rgba(24,111,67,.1);background:radial-gradient(circle at top right,rgba(143,225,185,.2),transparent 34%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%);box-shadow:0 14px 30px rgba(18,32,25,.06)}
  .rp-toolbar{display:grid;grid-template-columns:1fr;gap:1.2rem;align-items:start}
  .rp-toolbar-copy{gap:.45rem}
  .rp-toolbar-copy strong{font-size:1.4rem;line-height:1.08;letter-spacing:-.03em}
  .rp-toolbar-copy p,.rp-results-card span,.rp-export-meta span,.empty-state{color:var(--pf-ink-muted,#4a6356);line-height:1.6}
  .rp-search-field,.rp-results-card{padding:.95rem 1rem;border-radius:22px;border:1px solid rgba(24,111,67,.08);background:rgba(255,255,255,.86);box-shadow:0 8px 18px rgba(18,32,25,.04)}
  .rp-search-field,.rp-filter-block,.rp-toolbar-controls,.rp-results-card,.rp-taxonomy-stack,.rp-export-meta{gap:.45rem}
  .rp-field-label{color:var(--pf-ink-muted,#4a6356)}
  .rp-search-input{width:100%;border:none;outline:none;background:transparent;font:inherit;color:var(--pf-ink,#122019);font-size:1rem}
  .rp-search-input::placeholder{color:rgba(74,99,86,.72)}
  .rp-filter-strip,.rp-toolbar-actions,.rp-action-row{display:flex;flex-wrap:wrap}
  .rp-filter-strip{gap:.7rem}
  .rp-filter-button,.rp-clear-button,.rp-export-button{border:none;cursor:pointer;font:inherit;font-weight:800;border-radius:999px;transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}
  .rp-filter-button{border:1px solid rgba(24,111,67,.12);background:rgba(30,125,77,.06);color:var(--accent-deep,#1a5137);padding:.78rem 1rem}
  .rp-filter-button.is-active,.rp-export-button{color:#fff;background:linear-gradient(135deg,var(--pf-accent,#2e8b57) 0%,var(--pf-accent-dark,#1e7d4d) 100%)}
  .rp-filter-button.is-active{box-shadow:0 14px 28px rgba(30,125,77,.2)}
  .rp-toolbar-actions{gap:.85rem;align-items:center;justify-content:flex-end}
  .rp-results-card{min-width:16rem}
  .rp-results-card strong{font-size:1.1rem}
  .rp-action-row{gap:.7rem;align-items:center;justify-content:flex-end}
  .rp-clear-button{padding:.82rem 1.05rem;color:var(--accent-deep,#1a5137);background:rgba(30,125,77,.08);border:1px solid rgba(24,111,67,.12)}
  .rp-export-button{padding:.9rem 1.25rem;box-shadow:0 14px 26px rgba(30,125,77,.2)}
  .rp-export-button:disabled{cursor:not-allowed;opacity:.55;box-shadow:none}
  .rp-clear-button:hover,.rp-export-button:hover,.rp-filter-button:hover{transform:translateY(-1px)}
  .rp-hero-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  .rp-hero-stat{background:radial-gradient(circle at top right,rgba(143,225,185,.2),transparent 42%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(232,239,231,.93) 100%);border-radius:20px;border:1px solid rgba(18,32,25,.09);padding:20px 20px 18px;position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(18,32,25,.05)}
  .rp-hero-stat::after{content:'';position:absolute;right:-16px;bottom:-16px;width:72px;height:72px;border-radius:50%;background:rgba(30,125,77,.07)}
  .rp-hero-stat-label{font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--pf-accent-dark,#1e7d4d);margin-bottom:.35rem}
  .rp-hero-stat-value{font-size:2rem;font-weight:700;line-height:1;letter-spacing:-.04em}
  .rp-hero-stat-sub{font-size:.78rem;color:var(--pf-ink-muted,#4a6356);margin-top:.45rem;line-height:1.45}
  .rp-grid-2,.rp-grid-3,.rp-rank-split{display:grid}
  .rp-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .rp-grid-3{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .rp-rank-split{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
  .rp-rank-last{border-bottom:none!important;padding-bottom:0!important}
  .status-pill{display:inline-flex;align-items:center;justify-content:center;padding:.38rem .72rem;border-radius:999px;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:rgba(18,32,25,.08);color:var(--pf-ink-soft,#2d4e3e)}
  .status-pill.tone-success{background:rgba(46,139,87,.14);color:#256144}
  .status-pill.tone-warning{background:rgba(229,163,60,.16);color:#9c6916}
  .status-pill.tone-danger{background:rgba(195,86,75,.14);color:#9f3f35}
  .empty-state{padding:1.2rem;border-radius:20px;border:1px dashed rgba(24,111,67,.16);background:rgba(255,255,255,.74)}
  .empty-state strong{display:block;color:var(--pf-ink,#122019);margin-bottom:.35rem}
  .rp-empty-shell{padding:1.25rem;border-radius:24px;border:1px dashed rgba(24,111,67,.18);background:rgba(255,255,255,.74)}
  .rp-export-meta{margin:0 0 1.25rem;padding:1rem 1.1rem;border-radius:20px;border:1px solid rgba(24,111,67,.08);background:rgba(255,255,255,.9)}
  .rp-export-meta strong{font-size:1.25rem;letter-spacing:-.02em}
  @media (max-width:1180px){.rp-toolbar,.rp-grid-2,.rp-rank-split{grid-template-columns:1fr}.rp-hero-stats,.rp-grid-3{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:820px){.rp-root{padding:16px 16px 48px}.rp-hero-stats,.rp-grid-3{grid-template-columns:1fr}.rp-search-field,.rp-results-card{padding:.9rem .95rem}.rp-toolbar-actions,.rp-action-row{justify-content:stretch}.rp-action-row>*{width:100%}}
  @media print{body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.rp-root{min-height:auto;background:#fff;padding:20px}}
`;

const BAR_COLORS = {
  green: 'linear-gradient(90deg, rgba(30,125,77,.5) 0%, rgba(30,125,77,.95) 100%)',
  amber: 'linear-gradient(90deg, rgba(229,163,60,.5) 0%, rgba(229,163,60,.95) 100%)',
  rose: 'linear-gradient(90deg, rgba(195,86,75,.45) 0%, rgba(195,86,75,.92) 100%)',
};

function Card({ children, style }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(250,252,248,.98) 0%, rgba(239,244,238,.95) 100%)',
        borderRadius: 22,
        border: '1px solid rgba(18,32,25,.09)',
        boxShadow: '0 12px 28px rgba(18,32,25,.05)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardBody({ children, style }) {
  return <div style={{ padding: '18px 22px', ...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(18,32,25,.07)', margin: '0 22px' }} />;
}

function CardHead({ eyebrow, title, sub, right }) {
  return (
    <div
      style={{
        padding: '18px 22px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        {eyebrow ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--pf-accent-dark, #1e7d4d)',
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--pf-ink, #122019)', lineHeight: 1.32 }}>{title}</div>
        {sub ? (
          <div style={{ fontSize: 12.5, color: 'var(--pf-ink-muted, #4a6356)', marginTop: 4, lineHeight: 1.55, maxWidth: 430 }}>
            {sub}
          </div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '.07em',
        textTransform: 'uppercase',
        color: 'var(--pf-ink-muted, #4a6356)',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function BarRow({ label, value, maxValue, hint, tone = 'green' }) {
  const pct = Math.max(4, Math.round((value / Math.max(maxValue, 1)) * 100));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div style={{ width: 112, flexShrink: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--pf-ink, #122019)' }}>{label}</div>
        {hint ? <div style={{ fontSize: 11, color: 'var(--pf-ink-muted, #4a6356)', marginTop: 1 }}>{hint}</div> : null}
      </div>
      <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(18,32,25,.08)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 99,
            background: BAR_COLORS[tone] || BAR_COLORS.green,
            transition: 'width .4s ease',
          }}
        />
      </div>
      <div
        style={{
          width: 28,
          textAlign: 'right',
          fontSize: 12.5,
          fontWeight: 800,
          color: 'var(--pf-ink, #122019)',
          flexShrink: 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.76)',
        borderRadius: 16,
        border: '1px solid rgba(18,32,25,.08)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '.05em',
          textTransform: 'uppercase',
          color: 'var(--pf-ink-muted, #4a6356)',
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--pf-font-display, 'Syne', 'Trebuchet MS', sans-serif)",
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--pf-ink, #122019)',
          lineHeight: 1,
          letterSpacing: '-.03em',
        }}
      >
        {value}
      </div>
      {sub ? <div style={{ fontSize: 11.5, color: 'var(--pf-ink-muted, #4a6356)', marginTop: 6, lineHeight: 1.5 }}>{sub}</div> : null}
    </div>
  );
}

function RankRow({ label, meta, value, status }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '11px 0',
        borderBottom: '1px solid rgba(18,32,25,.07)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pf-ink, #122019)' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--pf-ink-muted, #4a6356)', marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--pf-ink, #122019)' }}>{value}</div>
        {status ? <StatusPill status={status} /> : null}
      </div>
    </div>
  );
}

function matchesSearch(searchTerm, ...parts) {
  if (!searchTerm) {
    return true;
  }

  return parts
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(searchTerm);
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
  return ANALYTICS_FILTERS.find((item) => item.key === filterKey)?.label || 'All Analytics';
}

export default function ReportsAnalyticsScreen({ data }) {
  const rootRef = useRef(null);
  const [activeAnalyticsView, setActiveAnalyticsView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTerm = searchQuery.trim().toLowerCase();

  const totalUsers = data.users.length;
  const totalApplications = data.applications.length;
  const totalPrograms = data.programs.length;
  const totalMunicipalities = (data.municipalities || []).length;
  const openPrograms = data.programs.filter((program) => program.status === 'Open').length;
  const activeMunicipalities = (data.municipalities || []).filter((municipality) => municipality.status === 'Active').length;
  const activeOffices = data.offices.filter((office) => office.status === 'Active').length;
  const approvedApplications = data.applications.filter((application) => application.status === 'Approved').length;
  const pendingApplications = data.applications.filter((application) => ['Submitted', 'For Review', 'Incomplete'].includes(application.status)).length;
  const averageCompleteness = totalApplications
    ? Math.round(data.applications.reduce((sum, application) => sum + (application.completeness || 0), 0) / totalApplications)
    : 0;
  const approvalRate = totalApplications ? Math.round((approvedApplications / totalApplications) * 100) : 0;
  const restoreHistory = data.restoreHistory || [];
  const completedBackups = data.backupHistory.filter((backup) => backup.status === 'Completed').length;
  const unassignedPersonnel = data.users.filter((user) => user.role === 'personnel' && !user.municipality).length;
  const staffedPersonnel = data.users.filter((user) => user.role === 'personnel').length - unassignedPersonnel;
  const recentlyActiveUsers = data.users.filter((user) => user.lastActive && user.lastActive !== 'Never').length;

  const roleItems = [
    { label: 'Admins', value: data.users.filter((user) => user.role === 'admin').length, hint: 'full governance access' },
    { label: 'Personnel', value: data.users.filter((user) => user.role === 'personnel').length, hint: 'municipality or office accounts' },
    { label: 'Applicants', value: data.users.filter((user) => user.role === 'applicant').length, hint: 'resident-facing accounts' },
  ];

  const accountStatusItems = [
    { label: 'Active', value: data.users.filter((user) => user.status === 'Active').length, tone: 'green' },
    { label: 'Pending', value: data.users.filter((user) => user.status === 'Pending').length, tone: 'amber' },
    { label: 'Inactive', value: data.users.filter((user) => user.status === 'Inactive').length, tone: 'rose' },
  ];

  const applicationStatusItems = ['Submitted', 'For Review', 'Incomplete', 'Approved', 'Rejected'].map((status) => ({
    label: status,
    value: data.applications.filter((application) => application.status === status).length,
    hint:
      status === 'Approved'
        ? `${approvalRate}% approval rate`
        : status === 'Incomplete'
          ? 'needs document follow-up'
          : status === 'For Review'
            ? 'in evaluator queue'
            : undefined,
    tone:
      status === 'Approved'
        ? 'green'
        : status === 'Rejected'
          ? 'rose'
          : status === 'Incomplete'
            ? 'amber'
            : 'green',
  }));

  const programStatusItems = ['Open', 'Upcoming', 'Closed'].map((status) => ({
    label: status,
    value: data.programs.filter((program) => program.status === status).length,
    hint:
      status === 'Open'
        ? 'accepting submissions'
        : status === 'Upcoming'
          ? 'not yet opened'
          : 'closed for submissions',
    tone: status === 'Open' ? 'green' : status === 'Upcoming' ? 'amber' : 'rose',
  }));

  const officeAnalytics = data.offices
    .map((office) => ({
      id: office.id,
      name: office.name,
      municipality: office.municipality,
      status: office.status,
      applications: data.applications.filter((application) => application.office === office.name).length,
      personnel: data.users.filter((user) => user.role === 'personnel' && user.office === office.name).length,
    }))
    .sort((left, right) => right.applications - left.applications || left.name.localeCompare(right.name));

  const municipalityAnalytics = (data.municipalities || [])
    .map((municipality) => {
      const offices = data.offices.filter((office) => office.municipality === municipality.name);
      const officeNames = offices.map((office) => office.name);

      return {
        id: municipality.id,
        name: municipality.name,
        status: municipality.status,
        officesCount: offices.length,
        applications: data.applications.filter((application) => officeNames.includes(application.office)).length,
        personnel: data.users.filter((user) => user.role === 'personnel' && user.municipality === municipality.name).length,
      };
    })
    .sort(
      (left, right) =>
        right.applications - left.applications ||
        right.officesCount - left.officesCount ||
        left.name.localeCompare(right.name)
    );

  const auditModuleItems = Object.entries(
    data.auditLogs.reduce((summary, log) => {
      summary[log.module] = (summary[log.module] || 0) + 1;
      return summary;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  const filteredRoleItems = searchTerm ? roleItems.filter((item) => matchesSearch(searchTerm, item.label, item.hint, 'users account roles')) : roleItems;
  const filteredAccountStatusItems = searchTerm ? accountStatusItems.filter((item) => matchesSearch(searchTerm, item.label, 'account status access')) : accountStatusItems;
  const filteredApplicationStatusItems = searchTerm
    ? applicationStatusItems.filter((item) => matchesSearch(searchTerm, item.label, item.hint, 'applications submission pipeline'))
    : applicationStatusItems;
  const filteredProgramStatusItems = searchTerm
    ? programStatusItems.filter((item) => matchesSearch(searchTerm, item.label, item.hint, 'programs offices municipalities coverage'))
    : programStatusItems;
  const filteredOfficeAnalytics = searchTerm
    ? officeAnalytics.filter((item) =>
        matchesSearch(searchTerm, item.name, item.municipality, item.status, `${item.personnel} personnel`, `${item.applications} applications`, 'offices area performance')
      )
    : officeAnalytics;
  const filteredMunicipalityAnalytics = searchTerm
    ? municipalityAnalytics.filter((item) =>
        matchesSearch(searchTerm, item.name, item.status, `${item.officesCount} offices`, `${item.personnel} personnel`, `${item.applications} applications`, 'municipalities area performance')
      )
    : municipalityAnalytics;
  const filteredAuditModuleItems = searchTerm
    ? auditModuleItems.filter((item) => matchesSearch(searchTerm, item.label, 'audit module backup restore operations'))
    : auditModuleItems;
  const filteredCategories = searchTerm ? data.categories.filter((category) => matchesSearch(searchTerm, category.name, 'categories taxonomy')) : data.categories;
  const filteredSectors = searchTerm ? data.sectors.filter((sector) => matchesSearch(searchTerm, sector.name, 'sectors taxonomy')) : data.sectors;
  const filteredAnnouncements = searchTerm
    ? data.announcements.filter((announcement) => matchesSearch(searchTerm, announcement.title, announcement.summary, announcement.audience, 'announcements taxonomy'))
    : data.announcements;

  const roleItemsToRender = searchTerm && filteredRoleItems.length ? filteredRoleItems : roleItems;
  const accountStatusItemsToRender = searchTerm && filteredAccountStatusItems.length ? filteredAccountStatusItems : accountStatusItems;
  const applicationStatusItemsToRender = searchTerm && filteredApplicationStatusItems.length ? filteredApplicationStatusItems : applicationStatusItems;
  const programStatusItemsToRender = searchTerm && filteredProgramStatusItems.length ? filteredProgramStatusItems : programStatusItems;
  const officeAnalyticsToRender = searchTerm && filteredOfficeAnalytics.length ? filteredOfficeAnalytics : officeAnalytics;
  const municipalityAnalyticsToRender = searchTerm && filteredMunicipalityAnalytics.length ? filteredMunicipalityAnalytics : municipalityAnalytics;
  const auditModuleItemsToRender = searchTerm && filteredAuditModuleItems.length ? filteredAuditModuleItems : auditModuleItems;
  const categoriesToRender = searchTerm && filteredCategories.length ? filteredCategories : data.categories;
  const sectorsToRender = searchTerm && filteredSectors.length ? filteredSectors : data.sectors;
  const announcementsToRender = searchTerm && filteredAnnouncements.length ? filteredAnnouncements : data.announcements;

  const maxRole = Math.max(...roleItemsToRender.map((item) => item.value), 1);
  const maxAccountStatus = Math.max(...accountStatusItemsToRender.map((item) => item.value), 1);
  const maxApplication = Math.max(...applicationStatusItemsToRender.map((item) => item.value), 1);
  const maxProgram = Math.max(...programStatusItemsToRender.map((item) => item.value), 1);
  const maxAudit = Math.max(...auditModuleItemsToRender.map((item) => item.value), 1);

  const heroStats = [
    { label: 'Total Accounts', value: totalUsers, sub: 'admins, personnel, and applicants' },
    { label: 'Applications', value: totalApplications, sub: `${pendingApplications} still need action` },
    { label: 'Open Programs', value: openPrograms, sub: `${totalPrograms} total tracked programs` },
    { label: 'Active Coverage', value: `${activeMunicipalities}/${totalMunicipalities}`, sub: `${activeOffices} active offices` },
  ];

  const sectionMatches = {
    users: matchesSearch(searchTerm, 'user analytics role account coverage account distribution access status personnel assignment gaps', roleItems.map((item) => `${item.label} ${item.hint}`), accountStatusItems.map((item) => item.label), 'assigned personnel unassigned recently active sign in'),
    applications: matchesSearch(searchTerm, 'application analytics submission pipeline approval pace pending workload completeness', applicationStatusItems.map((item) => `${item.label} ${item.hint}`), `${approvalRate}% approval rate`, `${averageCompleteness}% average completeness`, `${pendingApplications} pending review`),
    coverage: matchesSearch(searchTerm, 'program coverage municipalities offices deployment active coverage', programStatusItems.map((item) => `${item.label} ${item.hint}`), officeAnalytics.map((item) => item.name), municipalityAnalytics.map((item) => item.name)),
    performance: matchesSearch(searchTerm, 'area performance top offices municipalities application demand admin coverage', officeAnalytics.map((item) => `${item.name} ${item.municipality} ${item.status}`), municipalityAnalytics.map((item) => `${item.name} ${item.status}`)),
    operations: matchesSearch(searchTerm, 'operational analytics backup restore audit module activity', auditModuleItems.map((item) => item.label), restoreHistory.map((item) => item.fileName), data.backupHistory.map((item) => item.type)),
    taxonomy: matchesSearch(searchTerm, 'reference counts platform taxonomy categories sectors announcements', data.categories.map((item) => item.name), data.sectors.map((item) => item.name), data.announcements.map((item) => item.title)),
  };

  const isSectionVisible = (sectionKey) => (activeAnalyticsView === 'all' || activeAnalyticsView === sectionKey) && sectionMatches[sectionKey];
  const visibleSectionIds = ANALYTICS_FILTERS.filter((item) => item.key !== 'all').map((item) => item.key).filter((sectionKey) => isSectionVisible(sectionKey));

  const exportCurrentView = () => {
    const rootNode = rootRef.current;

    if (!rootNode || !visibleSectionIds.length) {
      return;
    }

    const headerMarkup = rootNode.querySelector('[data-analytics-export="header"]')?.outerHTML || '';
    const sectionsMarkup = visibleSectionIds
      .map((sectionKey) => rootNode.querySelector(`[data-analytics-section="${sectionKey}"]`)?.outerHTML || '')
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
    const exportScope = getFilterLabel(activeAnalyticsView);
    const exportSearch = searchQuery.trim() ? `Search filter: ${searchQuery.trim()}` : 'Search filter: none';

    printWindow.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(exportScope)} PDF Export</title><style>${REPORTS_STYLES}html,body{margin:0;background:#fff}.rp-root{min-height:auto;background:#fff;padding:24px;gap:18px}.rp-export-only{display:grid;gap:18px}</style></head><body><div class="rp-root">${headerMarkup}<div class="rp-export-meta"><strong>${escapeHtml(exportScope)} PDF export</strong><span>Generated ${escapeHtml(nowLabel)}</span><span>${escapeHtml(exportSearch)}</span></div><div class="rp-export-only">${sectionsMarkup}</div></div></body></html>`);
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 280);
  };

  return (
    <>
      <style>{REPORTS_STYLES}</style>

      <div className="rp-root" ref={rootRef}>
        <div className="rp-toolbar-shell">
          <div className="rp-toolbar">
            <div className="rp-toolbar-controls">
              <label className="rp-search-field">
                <span className="rp-field-label">Search analytics</span>
                <input
                  className="rp-search-input"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search offices, municipalities, roles, modules, statuses, or program coverage"
                  type="text"
                  value={searchQuery}
                />
              </label>

              <div className="rp-filter-block">
                <span className="rp-field-label">Analytics view</span>
                <div className="rp-filter-strip" role="tablist" aria-label="Analytics categories">
                  {ANALYTICS_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      aria-pressed={activeAnalyticsView === filter.key}
                      className={`rp-filter-button ${activeAnalyticsView === filter.key ? 'is-active' : ''}`}
                      onClick={() => setActiveAnalyticsView(filter.key)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rp-toolbar-actions">
                <div className="rp-action-row">
                  {searchQuery.trim() ? (
                    <button className="rp-clear-button" onClick={() => setSearchQuery('')} type="button">
                      Clear Search
                    </button>
                  ) : null}
                  <button className="rp-export-button" disabled={!visibleSectionIds.length} onClick={exportCurrentView} type="button">
                    Export Current View to PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rp-hero-stats">
          {heroStats.map((item) => (
            <div className="rp-hero-stat" key={item.label}>
              <div className="rp-hero-stat-label">{item.label}</div>
              <div className="rp-hero-stat-value">{item.value}</div>
              <div className="rp-hero-stat-sub">{item.sub}</div>
            </div>
          ))}
        </div>

        {isSectionVisible('users') ? (
          <div className="rp-section-frame" data-analytics-section="users">
            <Card>
              <CardHead
                eyebrow="User analytics"
                sub="Account distribution, access status, and personnel assignment gaps from the admin side."
                title="Role & Account Coverage"
              />
              <Divider />
              <CardBody>
                <SectionLabel>By role</SectionLabel>
                {roleItemsToRender.map((item) => (
                  <BarRow key={item.label} hint={item.hint} label={item.label} maxValue={maxRole} value={item.value} />
                ))}
              </CardBody>
              <Divider />
              <CardBody>
                <SectionLabel>By account status</SectionLabel>
                {accountStatusItemsToRender.map((item) => (
                  <BarRow key={item.label} label={item.label} maxValue={maxAccountStatus} tone={item.tone} value={item.value} />
                ))}
              </CardBody>
              <Divider />
              <CardBody>
                <div className="rp-grid-3">
                  <StatTile label="Assigned personnel" sub="Tied to a municipality or office" value={staffedPersonnel} />
                  <StatTile label="Unassigned personnel" sub="Missing deployment scope" value={unassignedPersonnel} />
                  <StatTile label="Recently active" sub="Visible sign-in activity" value={recentlyActiveUsers} />
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {isSectionVisible('applications') ? (
          <div className="rp-section-frame" data-analytics-section="applications">
            <Card>
              <CardHead
                eyebrow="Application analytics"
                sub="Approval pace, pending workload, and completeness across all tracked applications."
                title="Submission Pipeline"
              />
              <Divider />
              <CardBody>
                <SectionLabel>By status</SectionLabel>
                {applicationStatusItemsToRender.map((item) => (
                  <BarRow
                    key={item.label}
                    hint={item.hint}
                    label={item.label}
                    maxValue={maxApplication}
                    tone={item.tone}
                    value={item.value}
                  />
                ))}
              </CardBody>
              <Divider />
              <CardBody>
                <div className="rp-grid-3">
                  <StatTile label="Approval rate" sub="Of all tracked applications" value={`${approvalRate}%`} />
                  <StatTile label="Avg completeness" sub="Document and field readiness" value={`${averageCompleteness}%`} />
                  <StatTile label="Pending review" sub="Submitted, reviewing, or incomplete" value={pendingApplications} />
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {isSectionVisible('coverage') ? (
          <div className="rp-section-frame" data-analytics-section="coverage">
            <Card>
              <CardHead
                eyebrow="Program coverage"
                sub="Program status, municipal activation, and office deployment coverage in one panel."
                title="Programs, Municipalities & Offices"
              />
              <Divider />
              <CardBody>
                <SectionLabel>Programs by status</SectionLabel>
                {programStatusItemsToRender.map((item) => (
                  <BarRow key={item.label} hint={item.hint} label={item.label} maxValue={maxProgram} tone={item.tone} value={item.value} />
                ))}
              </CardBody>
              <Divider />
              <CardBody>
                <div className="rp-grid-3">
                  <StatTile label="Municipalities" sub={`${activeMunicipalities} currently active`} value={totalMunicipalities} />
                  <StatTile label="Offices" sub={`${activeOffices} active right now`} value={data.offices.length} />
                  <StatTile
                    label="Unstaffed offices"
                    sub="No personnel assigned"
                    value={officeAnalytics.filter((office) => office.personnel === 0).length}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {isSectionVisible('performance') ? (
          <div className="rp-section-frame" data-analytics-section="performance">
            <Card>
              <CardHead
                eyebrow="Area performance"
                sub="Where application demand and admin coverage are currently concentrated."
                title="Top Offices & Municipalities"
              />
              <Divider />
              <CardBody>
                <div className="rp-rank-split">
                  <div>
                    <SectionLabel>Top offices</SectionLabel>
                    {officeAnalyticsToRender.slice(0, 4).length ? (
                      officeAnalyticsToRender.slice(0, 4).map((office, index, rows) => (
                        <div key={office.id} className={index === rows.length - 1 ? 'rp-rank-last' : ''}>
                          <RankRow
                            label={office.name}
                            meta={`${office.municipality} | ${office.personnel} staff`}
                            status={office.status}
                            value={`${office.applications} apps`}
                          />
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No office data" text="Office analytics appear here once offices are being tracked." />
                    )}
                  </div>
                  <div>
                    <SectionLabel>Top municipalities</SectionLabel>
                    {municipalityAnalyticsToRender.slice(0, 4).length ? (
                      municipalityAnalyticsToRender.slice(0, 4).map((municipality, index, rows) => (
                        <div key={municipality.id} className={index === rows.length - 1 ? 'rp-rank-last' : ''}>
                          <RankRow
                            label={municipality.name}
                            meta={`${municipality.officesCount} offices | ${municipality.personnel} staff`}
                            status={municipality.status}
                            value={`${municipality.applications} apps`}
                          />
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No municipality data" text="Coverage data appears here once municipality records exist." />
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {isSectionVisible('operations') ? (
          <div className="rp-section-frame" data-analytics-section="operations">
            <Card>
              <CardHead
                eyebrow="Operational analytics"
                sub="Recovery operations, audit volume, and module-level activity across the platform."
                title="Backup, Restore & Audit"
              />
              <Divider />
              <CardBody>
                <div className="rp-grid-3" style={{ marginBottom: 18 }}>
                  <StatTile label="Completed backups" sub={`${data.backupHistory.length} total records`} value={completedBackups} />
                  <StatTile
                    label="Restore operations"
                    sub={restoreHistory[0]?.fileName || 'No restore package uploaded yet'}
                    value={restoreHistory.length}
                  />
                  <StatTile label="Audit entries" sub="Across all roles and modules" value={data.auditLogs.length} />
                </div>
                <SectionLabel>Audit entries by module</SectionLabel>
                {auditModuleItemsToRender.length ? (
                  auditModuleItemsToRender.map((item) => (
                    <BarRow key={item.label} hint="entries logged" label={item.label} maxValue={maxAudit} value={item.value} />
                  ))
                ) : (
                  <EmptyState title="No audit data" text="Module counts appear once audit logs are captured." />
                )}
              </CardBody>
            </Card>
          </div>
        ) : null}

        {isSectionVisible('taxonomy') ? (
          <div className="rp-section-frame" data-analytics-section="taxonomy">
            <Card>
              <CardHead
                eyebrow="Reference counts"
                sub="Content categories, sectors, and announcements under current admin governance."
                title="Platform Taxonomy"
              />
              <Divider />
              <CardBody>
                <div className="rp-taxonomy-stack">
                  <StatTile
                    label="Categories"
                    sub={categoriesToRender.map((category) => category.name).join(', ') || 'No categories available'}
                    value={categoriesToRender.length}
                  />
                  <StatTile
                    label="Sectors"
                    sub={sectorsToRender.map((sector) => sector.name).join(', ') || 'No sectors available'}
                    value={sectorsToRender.length}
                  />
                  <StatTile
                    label="Announcements"
                    sub="Public and office-facing announcements currently published"
                    value={announcementsToRender.length}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}

        {!visibleSectionIds.length ? (
          <div className="rp-empty-shell">
            <EmptyState
              title="No analytics match the current filters"
              text="Try a broader search or switch back to All Analytics to restore the full reporting view."
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
