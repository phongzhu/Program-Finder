import { useEffect, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ANALYTICS_FILTERS = [
  { key: 'all',         label: 'All Analytics',    icon: 'ph:chart-bar'         },
  { key: 'users',       label: 'Users',            icon: 'ph:users-three'       },
  { key: 'applications',label: 'Applications',     icon: 'ph:file-text'         },
  { key: 'coverage',    label: 'Coverage',         icon: 'ph:map-trifold'       },
  { key: 'performance', label: 'Area Performance', icon: 'ph:trend-up'          },
  { key: 'operations',  label: 'Operations',       icon: 'ph:hard-drives'       },
  { key: 'taxonomy',    label: 'Taxonomy',         icon: 'ph:tree-structure'    },
];

const HERO_ICONS = {
  'Total Accounts': 'ph:users',
  'Applications':   'ph:file-text',
  'Open Programs':  'ph:folder-open',
  'Active Coverage':'ph:map-pin',
};

const BAR_GRADIENTS = {
  green: 'linear-gradient(90deg,#1659b1 0%,#f4c542 100%)',
  amber: 'linear-gradient(90deg,#c99612 0%,#f4c542 100%)',
  rose:  'linear-gradient(90deg,#932628 0%,#c63b3d 100%)',
};

// ─── Icon component (Iconify CDN, same as App.jsx) ────────────────────────────

function Icon({ name, size = 16, color = 'currentColor', className = '', style = {} }) {
  const hex = color.startsWith('#') ? color.slice(1) : null;
  const src = hex
    ? `https://api.iconify.design/${name}.svg?color=%23${hex}`
    : `https://api.iconify.design/${name}.svg`;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`rp2-icon ${className}`}
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      decoding="async"
      loading="lazy"
    />
  );
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimBar({ value, maxValue, tone = 'green' }) {
  const [width, setWidth] = useState(0);
  const pct = Math.max(4, Math.round((value / Math.max(maxValue, 1)) * 100));
  useEffect(() => {
    const id = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(id);
  }, [pct]);
  return (
    <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(17,36,69,.09)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${width}%`, borderRadius: 99,
        background: BAR_GRADIENTS[tone] || BAR_GRADIENTS.green,
        transition: 'width 1s cubic-bezier(.34,1.3,.64,1)',
      }} />
    </div>
  );
}

// ─── Bar row ─────────────────────────────────────────────────────────────────

function BarRow({ label, value, maxValue, hint, tone = 'green' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <div style={{ width: 120, flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--rp-ink)' }}>{label}</div>
        {hint && <div style={{ fontSize: 22, color: 'var(--rp-ink-3)', marginTop: 1, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <AnimBar value={value} maxValue={maxValue} tone={tone} />
      <div style={{ width: 32, textAlign: 'right', fontSize: 22, fontWeight: 800, color: 'var(--rp-ink)', flexShrink: 0 }}>
        {value}
      </div>
    </div>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({ label, value, sub, accent = false }) {
  return (
    <div style={{
      background: accent ? 'var(--rp-green-light)' : 'var(--rp-surface-2)',
      borderRadius: 10,
      border: `1.5px solid ${accent ? 'var(--rp-green)' : 'var(--rp-border)'}`,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--rp-green)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent ? 'var(--rp-green)' : 'var(--rp-ink)', lineHeight: 1, letterSpacing: '-.03em', marginBottom: 5 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 22, color: 'var(--rp-ink-3)', lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

// ─── Rank row ────────────────────────────────────────────────────────────────

function RankRow({ rank, label, meta, value, status, last = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--rp-border)',
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: 99, background: 'var(--rp-green-light)',
        color: 'var(--rp-green)', fontSize: 22, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--rp-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
        <div style={{ fontSize: 22, color: 'var(--rp-ink-3)', marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--rp-ink)' }}>{value}</span>
        {status && (
          <span style={{
            fontSize: 22, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            background: status === 'Active' ? '#dcfce7' : status === 'Inactive' ? '#f1f5f9' : '#fef9c3',
            color: status === 'Active' ? '#15803d' : status === 'Inactive' ? '#64748b' : '#92400e',
          }}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section card ────────────────────────────────────────────────────────────

function SectionCard({ eyebrow, title, sub, icon, children, id }) {
  return (
    <div
      className="rp2-card"
      data-analytics-section={id}
      style={{
        background: 'var(--rp-surface)',
        border: '1.5px solid var(--rp-border)',
        borderRadius: 14,
        boxShadow: 'var(--rp-shadow)',
        overflow: 'hidden',
        animation: 'rp2-fadein .35s ease both',
      }}
    >
      {/* Card header */}
      <div style={{
        padding: '20px 24px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 14,
        borderBottom: '1.5px solid var(--rp-border)',
        background: 'var(--rp-surface-2)',
      }}>
        {icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 9, background: 'var(--rp-green-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name={icon} size={19} color="1e7d4d" />
          </div>
        )}
        <div>
          {eyebrow && (
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--rp-green)', display: 'block', marginBottom: 3 }}>
              {eyebrow}
            </span>
          )}
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--rp-ink)', lineHeight: 1.25 }}>{title}</h3>
          {sub && <p style={{ fontSize: 22, color: 'var(--rp-ink-3)', margin: '4px 0 0', lineHeight: 1.55 }}>{sub}</p>}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--rp-border)' }} />
      {label && (
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--rp-ink-3)', flexShrink: 0 }}>
          {label}
        </span>
      )}
      {label && <div style={{ flex: 1, height: 1, background: 'var(--rp-border)' }} />}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesSearch(term, ...parts) {
  if (!term) return true;
  return parts.flat().filter(Boolean).join(' ').toLowerCase().includes(term);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getFilterLabel(key) {
  return ANALYTICS_FILTERS.find((f) => f.key === key)?.label || 'All Analytics';
}

// ─── Print styles (for PDF export) ───────────────────────────────────────────

const PRINT_STYLES = `
  @media print {
    body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .rp2-shell { background: #fff; padding: 20px; }
    .rp2-toolbar { display: none !important; }
  }
`;

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ReportsAnalyticsScreen({ data }) {
  const rootRef = useRef(null);
  const [activeView,   setActiveView]   = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const searchTerm = searchQuery.trim().toLowerCase();

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalUsers          = data.users.length;
  const totalApplications   = data.applications.length;
  const totalPrograms       = data.programs.length;
  const totalMunicipalities = (data.municipalities || []).length;
  const openPrograms        = data.programs.filter((p) => p.status === 'Open').length;
  const activeMunicipalities= (data.municipalities || []).filter((m) => m.status === 'Active').length;
  const activeOffices       = data.offices.filter((o) => o.status === 'Active').length;
  const approvedApplications= data.applications.filter((a) => a.status === 'Approved').length;
  const pendingApplications = data.applications.filter((a) => ['Submitted','For Review','Incomplete'].includes(a.status)).length;
  const averageCompleteness = totalApplications
    ? Math.round(data.applications.reduce((s, a) => s + (a.completeness || 0), 0) / totalApplications)
    : 0;
  const approvalRate        = totalApplications ? Math.round((approvedApplications / totalApplications) * 100) : 0;
  const restoreHistory      = data.restoreHistory || [];
  const completedBackups    = data.backupHistory.filter((b) => b.status === 'Completed').length;
  const unassignedPersonnel = data.users.filter((u) => u.role === 'personnel' && !u.municipality).length;
  const staffedPersonnel    = data.users.filter((u) => u.role === 'personnel').length - unassignedPersonnel;
  const recentlyActiveUsers = data.users.filter((u) => u.lastActive && u.lastActive !== 'Never').length;

  const roleItems = [
    { label: 'System Admins', value: data.users.filter((u) => u.role === 'personnel' && u.staffRole === 'system_admin').length, hint: 'workspace governance', tone: 'green' },
    { label: 'Personnel',  value: data.users.filter((u) => u.role === 'personnel' && u.staffRole !== 'system_admin').length,  hint: 'office accounts',     tone: 'green' },
    { label: 'Applicants', value: data.users.filter((u) => u.role === 'applicant').length,  hint: 'resident portal',     tone: 'green' },
  ];

  const accountStatusItems = [
    { label: 'Active',   value: data.users.filter((u) => u.status === 'Active').length,   tone: 'green' },
    { label: 'Pending',  value: data.users.filter((u) => u.status === 'Pending').length,  tone: 'amber' },
    { label: 'Inactive', value: data.users.filter((u) => u.status === 'Inactive').length, tone: 'rose'  },
  ];

  const applicationStatusItems = ['Submitted','For Review','Incomplete','Approved','Rejected'].map((s) => ({
    label: s,
    value: data.applications.filter((a) => a.status === s).length,
    hint: s === 'Approved' ? `${approvalRate}% approval rate` : s === 'Incomplete' ? 'needs follow-up' : s === 'For Review' ? 'evaluator queue' : undefined,
    tone: s === 'Approved' ? 'green' : s === 'Rejected' ? 'rose' : s === 'Incomplete' ? 'amber' : 'green',
  }));

  const programStatusItems = ['Open','Upcoming','Closed'].map((s) => ({
    label: s,
    value: data.programs.filter((p) => p.status === s).length,
    hint: s === 'Open' ? 'accepting submissions' : s === 'Upcoming' ? 'not yet opened' : 'closed',
    tone: s === 'Open' ? 'green' : s === 'Upcoming' ? 'amber' : 'rose',
  }));

  const officeAnalytics = data.offices.map((o) => ({
    id: o.id, name: o.name, municipality: o.municipality, status: o.status,
    applications: data.applications.filter((a) => a.office === o.name).length,
    personnel: data.users.filter((u) => u.role === 'personnel' && u.office === o.name).length,
  })).sort((a, b) => b.applications - a.applications || a.name.localeCompare(b.name));

  const municipalityAnalytics = (data.municipalities || []).map((m) => {
    const offices = data.offices.filter((o) => o.municipality === m.name);
    const officeNames = offices.map((o) => o.name);
    return {
      id: m.id, name: m.name, status: m.status,
      officesCount: offices.length,
      applications: data.applications.filter((a) => officeNames.includes(a.office)).length,
      personnel: data.users.filter((u) => u.role === 'personnel' && u.municipality === m.name).length,
    };
  }).sort((a, b) => b.applications - a.applications || b.officesCount - a.officesCount || a.name.localeCompare(b.name));

  const auditModuleItems = Object.entries(
    data.auditLogs.reduce((acc, log) => { acc[log.module] = (acc[log.module] || 0) + 1; return acc; }, {})
  ).map(([label, value]) => ({ label, value }))
   .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  // ── Filtered sets ─────────────────────────────────────────────────────────

  const fRole        = searchTerm ? roleItems.filter((i) => matchesSearch(searchTerm, i.label, i.hint, 'users account roles')) : roleItems;
  const fAccStatus   = searchTerm ? accountStatusItems.filter((i) => matchesSearch(searchTerm, i.label, 'account status')) : accountStatusItems;
  const fAppStatus   = searchTerm ? applicationStatusItems.filter((i) => matchesSearch(searchTerm, i.label, i.hint, 'applications submission')) : applicationStatusItems;
  const fProgStatus  = searchTerm ? programStatusItems.filter((i) => matchesSearch(searchTerm, i.label, i.hint, 'programs coverage')) : programStatusItems;
  const fOffices     = searchTerm ? officeAnalytics.filter((i) => matchesSearch(searchTerm, i.name, i.municipality, i.status, 'offices performance')) : officeAnalytics;
  const fMunis       = searchTerm ? municipalityAnalytics.filter((i) => matchesSearch(searchTerm, i.name, i.status, 'municipalities performance')) : municipalityAnalytics;
  const fAudit       = searchTerm ? auditModuleItems.filter((i) => matchesSearch(searchTerm, i.label, 'audit module operations')) : auditModuleItems;
  const fCats        = searchTerm ? data.categories.filter((c) => matchesSearch(searchTerm, c.name, 'categories taxonomy')) : data.categories;
  const fSectors     = searchTerm ? data.sectors.filter((s) => matchesSearch(searchTerm, s.name, 'sectors taxonomy')) : data.sectors;
  const fAnns        = searchTerm ? data.announcements.filter((a) => matchesSearch(searchTerm, a.title, a.summary, a.audience, 'announcements taxonomy')) : data.announcements;

  const roleR      = (searchTerm && fRole.length)       ? fRole       : roleItems;
  const accStatusR = (searchTerm && fAccStatus.length)  ? fAccStatus  : accountStatusItems;
  const appStatusR = (searchTerm && fAppStatus.length)  ? fAppStatus  : applicationStatusItems;
  const progR      = (searchTerm && fProgStatus.length) ? fProgStatus : programStatusItems;
  const officesR   = (searchTerm && fOffices.length)    ? fOffices    : officeAnalytics;
  const munisR     = (searchTerm && fMunis.length)      ? fMunis      : municipalityAnalytics;
  const auditR     = (searchTerm && fAudit.length)      ? fAudit      : auditModuleItems;
  const catsR      = (searchTerm && fCats.length)       ? fCats       : data.categories;
  const sectorsR   = (searchTerm && fSectors.length)    ? fSectors    : data.sectors;
  const annsR      = (searchTerm && fAnns.length)       ? fAnns       : data.announcements;

  const maxRole   = Math.max(...roleR.map((i) => i.value), 1);
  const maxAcc    = Math.max(...accStatusR.map((i) => i.value), 1);
  const maxApp    = Math.max(...appStatusR.map((i) => i.value), 1);
  const maxProg   = Math.max(...progR.map((i) => i.value), 1);
  const maxAudit  = Math.max(...auditR.map((i) => i.value), 1);

  // ── Section visibility ────────────────────────────────────────────────────

  const sectionMatches = {
    users:        matchesSearch(searchTerm, 'user analytics role account coverage personnel assignment', roleItems.map((i) => `${i.label} ${i.hint}`), accountStatusItems.map((i) => i.label)),
    applications: matchesSearch(searchTerm, 'application analytics submission pipeline approval completeness', applicationStatusItems.map((i) => `${i.label} ${i.hint}`)),
    coverage:     matchesSearch(searchTerm, 'program coverage municipalities offices deployment', programStatusItems.map((i) => `${i.label} ${i.hint}`), officeAnalytics.map((i) => i.name)),
    performance:  matchesSearch(searchTerm, 'area performance offices municipalities application demand', officeAnalytics.map((i) => i.name), municipalityAnalytics.map((i) => i.name)),
    operations:   matchesSearch(searchTerm, 'operational backup restore audit module activity', auditModuleItems.map((i) => i.label)),
    taxonomy:     matchesSearch(searchTerm, 'reference taxonomy categories sectors announcements', data.categories.map((i) => i.name), data.sectors.map((i) => i.name)),
  };

  const isVisible = (key) =>
    (activeView === 'all' || activeView === key) && sectionMatches[key];

  const visibleIds = ANALYTICS_FILTERS.filter((f) => f.key !== 'all').map((f) => f.key).filter(isVisible);

  // ── Export ────────────────────────────────────────────────────────────────

  const exportToPdf = () => {
    if (!rootRef.current || !visibleIds.length) return;
    const sectionsMarkup = visibleIds
      .map((id) => rootRef.current.querySelector(`[data-analytics-section="${id}"]`)?.outerHTML || '')
      .join('');
    const win = window.open('', '_blank', 'width=1280,height=920');
    if (!win) { window.alert('Allow pop-ups to export to PDF.'); return; }
    const now = new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(getFilterLabel(activeView))} — PDF Export</title>
    <style>*{box-sizing:border-box}body{margin:0;background:#fff;font-family:'Public Sans',system-ui,sans-serif;color:#112445;padding:28px}h3{margin:0}.rp2-card{border:1.5px solid #d6e2f6;border-radius:14px;margin-bottom:18px;overflow:hidden}.rp2-icon{display:inline-block}</style>
    </head><body>
    <div style="margin-bottom:20px"><strong style="font-size: 1.375rem">${escapeHtml(getFilterLabel(activeView))} — Analytics Export</strong><br/><small style="color:#6f7f99">Generated ${escapeHtml(now)}${searchQuery.trim() ? ` · Search: "${escapeHtml(searchQuery.trim())}"` : ''}</small></div>
    ${sectionsMarkup}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 280);
  };

  // ── Hero stats ────────────────────────────────────────────────────────────

  const heroStats = [
    { label: 'Total Accounts', value: totalUsers,        sub: 'across all roles' },
    { label: 'Applications',   value: totalApplications, sub: `${pendingApplications} need action` },
    { label: 'Open Programs',  value: openPrograms,      sub: `${totalPrograms} total programs` },
    { label: 'Active Coverage',value: `${activeMunicipalities}/${totalMunicipalities}`, sub: `${activeOffices} active offices` },
  ];

  return (
    <>
      <style>{`
        /* ── Design tokens ─────────────────────────────────────── */
        .rp2-shell {
          --rp-green:       #1659b1;
          --rp-green-mid:   #0d3e84;
          --rp-green-vivid: #f4c542;
          --rp-green-light: #eef4ff;
          --rp-green-pale:  #fff7da;
          --rp-amber:       #c99612;
          --rp-amber-bg:    #fff7da;
          --rp-red:         #c63b3d;
          --rp-red-bg:      #fff1f1;
          --rp-ink:         #112445;
          --rp-ink-2:       #2f4567;
          --rp-ink-3:       #6f7f99;
          --rp-surface:     #ffffff;
          --rp-surface-2:   #f8f9ff;
          --rp-border:      #d6e2f6;
          --rp-radius:      14px;
          --rp-shadow:      0 1px 3px rgba(17,36,69,.05),0 4px 16px rgba(17,36,69,.08);
          --rp-shadow-lg:   0 8px 32px rgba(17,36,69,.12);

          font-family: var(--pf-font-body, 'Public Sans', system-ui, sans-serif);
          color: var(--rp-ink);
          padding-bottom: 60px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @keyframes rp2-fadein {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Toolbar ──────────────────────────────────────────── */
        .rp2-toolbar {
          background: var(--rp-surface);
          border: 1.5px solid var(--rp-border);
          border-radius: var(--rp-radius);
          padding: 16px 20px;
          box-shadow: var(--rp-shadow);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rp2-toolbar-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .rp2-search-wrap {
          flex: 1;
          min-width: 240px;
          max-width: 500px;
          position: relative;
        }
        .rp2-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); pointer-events: none;
        }
        .rp2-search-input {
          width: 100%;
          min-height: 3.15rem;
          padding: 0.78rem 0.9rem 0.78rem 2.6rem;
          border: 1.5px solid var(--rp-border);
          border-radius: 12px;
          background: var(--rp-surface-2);
          font-size: 0.96rem; color: var(--rp-ink);
          font-weight: 500;
          outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .rp2-search-input:focus {
          border-color: var(--rp-green);
          box-shadow: 0 0 0 3px rgba(22,89,177,.10);
        }
        .rp2-search-input::placeholder { color: var(--rp-ink-3); }
        .rp2-toolbar-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .rp2-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          min-height: 3.05rem;
          padding: 0.76rem 1rem; border-radius: 12px;
          border: 1.5px solid var(--rp-border); background: none;
          font-size: 0.94rem; font-weight: 700; color: var(--rp-ink-2);
          cursor: pointer; white-space: nowrap; transition: all .15s;
        }
        .rp2-btn-ghost:hover { border-color: var(--rp-green); color: var(--rp-green); background: var(--rp-green-pale); }
        .rp2-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          min-height: 3.05rem;
          padding: 0.76rem 1.1rem; border-radius: 12px;
          border: none; background: var(--rp-green);
          font-size: 0.98rem; font-weight: 700; color: #fff;
          cursor: pointer; white-space: nowrap; transition: all .15s;
        }
        .rp2-btn-primary:hover { background: var(--rp-green-mid); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22,89,177,.25); }
        .rp2-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Filter pills ─────────────────────────────────────── */
        .rp2-filter-row {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .rp2-filter-pill {
          display: inline-flex; align-items: center; gap: 6px;
          min-height: 2.85rem;
          padding: 0.64rem 1rem; border-radius: 999px;
          border: 1.5px solid var(--rp-border);
          background: var(--rp-surface);
          font-size: 0.92rem; font-weight: 700; color: var(--rp-ink-3);
          cursor: pointer; white-space: nowrap; transition: all .15s;
        }
        .rp2-filter-pill:hover { border-color: var(--rp-green); color: var(--rp-green); }
        .rp2-filter-pill.is-active {
          background: var(--rp-green); border-color: var(--rp-green); color: #fff;
        }

        /* ── Hero stat cards ──────────────────────────────────── */
        .rp2-hero-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 14px;
        }
        .rp2-hero-card {
          background: var(--rp-surface);
          border: 1.5px solid var(--rp-border);
          border-radius: var(--rp-radius);
          padding: 20px 22px 18px;
          box-shadow: var(--rp-shadow);
          position: relative; overflow: hidden;
          transition: transform .18s, box-shadow .18s;
        }
        .rp2-hero-card:hover { transform: translateY(-2px); box-shadow: var(--rp-shadow-lg); }
        .rp2-hero-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--rp-green-light) 0%, transparent 55%);
          opacity: 0; transition: opacity .2s;
        }
        .rp2-hero-card:hover::before { opacity: 1; }
        .rp2-hero-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: var(--rp-green-light);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px; position: relative;
        }
        .rp2-hero-label {
          font-size: 1.375rem; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: var(--rp-green);
          margin-bottom: 4px; position: relative;
        }
        .rp2-hero-value {
          font-size: 30px; font-weight: 800; line-height: 1;
          letter-spacing: -.03em; color: var(--rp-ink);
          margin-bottom: 6px; position: relative;
        }
        .rp2-hero-sub {
          font-size: 1.375rem; color: var(--rp-ink-3); line-height: 1.5;
          position: relative;
        }

        /* ── Section grid ─────────────────────────────────────── */
        .rp2-sections { display: flex; flex-direction: column; gap: 18px; }
        .rp2-inner-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .rp2-inner-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .rp2-rank-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        /* ── Taxonomy tags ────────────────────────────────────── */
        .rp2-tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        .rp2-tag {
          display: inline-flex; align-items: center;
          padding: 4px 10px; border-radius: 99px;
          background: var(--rp-green-light);
          font-size: 1.375rem; font-weight: 600; color: var(--rp-green);
          border: 1px solid rgba(22,89,177,.15);
        }

        /* ── Empty ────────────────────────────────────────────── */
        .rp2-empty {
          padding: 24px; text-align: center;
          border: 1.5px dashed var(--rp-border);
          border-radius: var(--rp-radius);
          color: var(--rp-ink-3); font-size: 1.375rem;
        }

        /* ── Responsive ───────────────────────────────────────── */
        @media (max-width: 1100px) {
          .rp2-hero-grid { grid-template-columns: repeat(2,1fr); }
          .rp2-rank-cols { grid-template-columns: 1fr; }
          .rp2-inner-grid-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 700px) {
          .rp2-hero-grid { grid-template-columns: 1fr 1fr; }
          .rp2-inner-grid-2 { grid-template-columns: 1fr; }
          .rp2-inner-grid-3 { grid-template-columns: 1fr; }
          .rp2-toolbar-top { flex-direction: column; }
          .rp2-search-wrap { max-width: 100%; }
          .rp2-toolbar-actions { width: 100%; }
          .rp2-btn-primary, .rp2-btn-ghost { flex: 1; justify-content: center; }
        }
      `}</style>
      {PRINT_STYLES && <style>{PRINT_STYLES}</style>}

      <div className="rp2-shell" ref={rootRef}>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="rp2-toolbar" data-analytics-export="header">
          <div className="rp2-toolbar-top">
            {/* Search */}
            <div className="rp2-search-wrap">
              <span className="rp2-search-icon">
                <Icon name="ph:magnifying-glass" size={15} color="7a9e8a" />
              </span>
              <input
                className="rp2-search-input"
                type="search"
                placeholder="Search offices, municipalities, roles, modules, statuses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search analytics"
              />
            </div>

            {/* Actions */}
            <div className="rp2-toolbar-actions">
              {searchQuery.trim() && (
                <button className="rp2-btn-ghost" onClick={() => setSearchQuery('')} type="button">
                  <Icon name="ph:x-circle" size={14} color="3a5c46" />
                  Clear
                </button>
              )}
              <button
                className="rp2-btn-primary"
                onClick={exportToPdf}
                disabled={!visibleIds.length}
                type="button"
              >
                <Icon name="ph:file-pdf" size={15} color="ffffff" />
                Export to PDF
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="rp2-filter-row" role="group" aria-label="Analytics view filter">
            {ANALYTICS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`rp2-filter-pill ${activeView === f.key ? 'is-active' : ''}`}
                onClick={() => setActiveView(f.key)}
                aria-pressed={activeView === f.key}
                type="button"
              >
                <Icon name={f.icon} size={13} color={activeView === f.key ? 'ffffff' : '7a9e8a'} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Hero stat cards ────────────────────────────────────────────── */}
        <div className="rp2-hero-grid">
          {heroStats.map((s) => (
            <div className="rp2-hero-card" key={s.label}>
              <div className="rp2-hero-icon">
                <Icon name={HERO_ICONS[s.label] || 'ph:chart-bar'} size={18} color="1e7d4d" />
              </div>
              <div className="rp2-hero-label">{s.label}</div>
              <div className="rp2-hero-value">{s.value}</div>
              <div className="rp2-hero-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Sections ──────────────────────────────────────────────────── */}
        <div className="rp2-sections">

          {/* USERS */}
          {isVisible('users') && (
            <SectionCard
              id="users"
              eyebrow="User analytics"
              title="Role & Account Coverage"
              sub="Account distribution, access status, and personnel assignment gaps from the captain workspace."
              icon="ph:users-three"
            >
              <div className="rp2-inner-grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <Divider label="By role" />
                  {roleR.map((i) => <BarRow key={i.label} {...i} maxValue={maxRole} />)}
                </div>
                <div>
                  <Divider label="By account status" />
                  {accStatusR.map((i) => <BarRow key={i.label} {...i} maxValue={maxAcc} />)}
                </div>
              </div>
              <Divider label="Personnel deployment" />
              <div className="rp2-inner-grid-3">
                <StatTile label="Assigned personnel" value={staffedPersonnel} sub="Tied to municipality or office" />
                <StatTile label="Unassigned personnel" value={unassignedPersonnel} sub="Missing deployment scope" accent={unassignedPersonnel > 0} />
                <StatTile label="Recently active" value={recentlyActiveUsers} sub="Visible sign-in activity" />
              </div>
            </SectionCard>
          )}

          {/* APPLICATIONS */}
          {isVisible('applications') && (
            <SectionCard
              id="applications"
              eyebrow="Application analytics"
              title="Submission Pipeline"
              sub="Approval pace, pending workload, and completeness across all tracked applications."
              icon="ph:file-text"
            >
              <Divider label="By status" />
              {appStatusR.map((i) => <BarRow key={i.label} {...i} maxValue={maxApp} />)}
              <Divider label="Key metrics" />
              <div className="rp2-inner-grid-3">
                <StatTile label="Approval rate"     value={`${approvalRate}%`}        sub="Of all tracked applications" accent={approvalRate >= 50} />
                <StatTile label="Avg completeness"  value={`${averageCompleteness}%`}  sub="Document and field readiness" />
                <StatTile label="Pending review"    value={pendingApplications}         sub="Submitted, reviewing, or incomplete" accent={pendingApplications > 0} />
              </div>
            </SectionCard>
          )}

          {/* COVERAGE */}
          {isVisible('coverage') && (
            <SectionCard
              id="coverage"
              eyebrow="Program coverage"
              title="Programs, Municipalities & Offices"
              sub="Program status, municipal activation, and office deployment coverage in one panel."
              icon="ph:map-trifold"
            >
              <Divider label="Programs by status" />
              {progR.map((i) => <BarRow key={i.label} {...i} maxValue={maxProg} />)}
              <Divider label="Deployment overview" />
              <div className="rp2-inner-grid-3">
                <StatTile label="Municipalities"    value={totalMunicipalities}  sub={`${activeMunicipalities} currently active`} />
                <StatTile label="Offices"           value={data.offices.length}  sub={`${activeOffices} active right now`} />
                <StatTile label="Unstaffed offices" value={officeAnalytics.filter((o) => o.personnel === 0).length} sub="No personnel assigned" accent={officeAnalytics.filter((o) => o.personnel === 0).length > 0} />
              </div>
            </SectionCard>
          )}

          {/* PERFORMANCE */}
          {isVisible('performance') && (
            <SectionCard
              id="performance"
              eyebrow="Area performance"
              title="Top Offices & Municipalities"
              sub="Where application demand and captain coverage are currently concentrated."
              icon="ph:trend-up"
            >
              <div className="rp2-rank-cols">
                <div>
                  <Divider label="Top offices" />
                  {officesR.slice(0, 5).length ? (
                    officesR.slice(0, 5).map((o, i, arr) => (
                      <RankRow key={o.id} rank={i+1} label={o.name} meta={`${o.municipality} · ${o.personnel} staff`} value={`${o.applications} apps`} status={o.status} last={i === arr.length-1} />
                    ))
                  ) : (
                    <div className="rp2-empty">No office data available.</div>
                  )}
                </div>
                <div>
                  <Divider label="Top municipalities" />
                  {munisR.slice(0, 5).length ? (
                    munisR.slice(0, 5).map((m, i, arr) => (
                      <RankRow key={m.id} rank={i+1} label={m.name} meta={`${m.officesCount} offices · ${m.personnel} staff`} value={`${m.applications} apps`} status={m.status} last={i === arr.length-1} />
                    ))
                  ) : (
                    <div className="rp2-empty">No municipality data available.</div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {/* OPERATIONS */}
          {isVisible('operations') && (
            <SectionCard
              id="operations"
              eyebrow="Operational analytics"
              title="Backup, Restore & Audit"
              sub="Recovery operations, audit volume, and module-level activity across the platform."
              icon="ph:hard-drives"
            >
              <div className="rp2-inner-grid-3" style={{ marginBottom: 20 }}>
                <StatTile label="Completed backups" value={completedBackups}        sub={`${data.backupHistory.length} total records`} />
                <StatTile label="Restore operations" value={restoreHistory.length} sub={restoreHistory[0]?.fileName || 'No restore yet'} />
                <StatTile label="Audit entries"      value={data.auditLogs.length}  sub="Across all roles and modules" />
              </div>
              <Divider label="Audit entries by module" />
              {auditR.length ? (
                auditR.map((i) => <BarRow key={i.label} label={i.label} value={i.value} maxValue={maxAudit} hint="entries logged" />)
              ) : (
                <div className="rp2-empty">No audit data — entries appear once audit logs are captured.</div>
              )}
            </SectionCard>
          )}

          {/* TAXONOMY */}
          {isVisible('taxonomy') && (
            <SectionCard
              id="taxonomy"
              eyebrow="Reference counts"
              title="Platform Taxonomy"
              sub="Content categories, sectors, and announcements under current captain governance."
              icon="ph:tree-structure"
            >
              <div className="rp2-inner-grid-3">
                <div>
                  <StatTile label="Categories" value={catsR.length} sub={`${catsR.length} tracked`} />
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--rp-ink-3)', marginBottom: 8 }}>
                      Category list
                    </div>
                    <div className="rp2-tag-cloud">
                      {catsR.map((c) => <span className="rp2-tag" key={c.id || c.name}>{c.name}</span>)}
                      {!catsR.length && <span style={{ color: 'var(--rp-ink-3)', fontSize: 22 }}>No categories available.</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <StatTile label="Sectors" value={sectorsR.length} sub={`${sectorsR.length} tracked`} />
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--rp-ink-3)', marginBottom: 8 }}>
                      Sector list
                    </div>
                    <div className="rp2-tag-cloud">
                      {sectorsR.map((s) => <span className="rp2-tag" key={s.id || s.name}>{s.name}</span>)}
                      {!sectorsR.length && <span style={{ color: 'var(--rp-ink-3)', fontSize: 22 }}>No sectors available.</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <StatTile label="Announcements" value={annsR.length} sub="Published to public or offices" />
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--rp-ink-3)', marginBottom: 8 }}>
                      Recent titles
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {annsR.slice(0, 4).map((a) => (
                        <div key={a.id} style={{ fontSize: 22, color: 'var(--rp-ink-2)', padding: '6px 10px', background: 'var(--rp-surface-2)', borderRadius: 6, border: '1px solid var(--rp-border)', lineHeight: 1.4 }}>
                          {a.title}
                        </div>
                      ))}
                      {!annsR.length && <span style={{ color: 'var(--rp-ink-3)', fontSize: 22 }}>No announcements.</span>}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Empty state */}
          {!visibleIds.length && (
            <div className="rp2-empty" style={{ padding: 40 }}>
              <Icon name="ph:magnifying-glass-minus" size={32} color="7a9e8a" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <strong style={{ display: 'block', marginBottom: 6, color: 'var(--rp-ink)', fontSize: 22 }}>No analytics match the current filters</strong>
              <span style={{ fontSize: 22 }}>Try a broader search or switch back to <em>All Analytics</em> to restore the full view.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}



