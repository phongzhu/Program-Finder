import { getApplicantApplications, getApplicantDocuments, getApplicantNotifications } from './helpers';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'profile':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'applications':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <path d="M9 9h6M9 12h6M9 15h4" />
        </svg>
      );
    case 'deadlines':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M5 9h14" />
        </svg>
      );
    case 'alerts':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.5 10a4.5 4.5 0 0 1 9 0v2.5c0 1 .35 1.9 1 2.6l.5.4H6l.5-.4A3.9 3.9 0 0 0 7.5 12.5Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'chart':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19h14" />
          <path d="M8 16V11M12 16V8M16 16v-4" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'star':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 4.75 2.1 4.27 4.72.69-3.4 3.32.8 4.69L12 15.5l-4.22 2.22.8-4.69-3.4-3.32 4.72-.69Z" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'check':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    default:
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function parseDateValue(value) {
  return new Date(`${value}T12:00:00`);
}
function formatCalendarLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(parseDateValue(value));
}
function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date);
}
function formatMonthShortLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(parseDateValue(value));
}

function buildDeadlineCalendar(programs) {
  const upcomingPrograms = [...programs]
    .filter((p) => ['Open', 'Upcoming'].includes(p.status))
    .sort((a, b) => parseDateValue(a.deadline) - parseDateValue(b.deadline));
  const anchorDate = upcomingPrograms[0] ? parseDateValue(upcomingPrograms[0].deadline) : new Date();
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = monthStart.getDay();
  const deadlineMap = upcomingPrograms.reduce((map, p) => {
    const d = parseDateValue(p.deadline);
    if (d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth()) {
      const ex = map.get(d.getDate()) || [];
      ex.push(p);
      map.set(d.getDate(), ex);
    }
    return map;
  }, new Map());
  const cells = [];
  for (let i = 0; i < leadingEmptyDays; i++) cells.push({ key: `e-${i}`, empty: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: `d-${d}`, day: d, items: deadlineMap.get(d) || [] });
  while (cells.length % 7 !== 0) cells.push({ key: `t-${cells.length}`, empty: true });
  return { monthLabel: formatMonthLabel(monthStart), cells, upcomingPrograms };
}

/* ─── Status color map ───────────────────────────────────────────────────── */
const STATUS_COLORS = {
  Submitted: { bg: 'var(--status-neutral-bg)', text: 'var(--status-neutral-text)', bar: '#91a79b' },
  'For Review': { bg: 'var(--status-accent-bg)', text: 'var(--status-accent-text)', bar: '#1e7d4d' },
  Incomplete: { bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)', bar: '#c48820' },
  Approved: { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', bar: '#2ea25f' },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function Chip({ children, accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: '.03em',
      background: accent ? 'var(--accent)' : 'var(--surface-2)',
      color: accent ? '#fff' : 'var(--text-2)',
    }}>{children}</span>
  );
}

function StatCard({ icon, label, value, detail, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent)' : 'var(--surface-1)',
      borderRadius: 16, padding: '22px 24px',
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: accent ? '0 8px 32px rgba(30,125,77,.22)' : '0 1px 3px rgba(18,32,25,.06)',
      border: accent ? 'none' : '1px solid var(--border)',
      color: accent ? '#fff' : 'inherit',
      position: 'relative', overflow: 'hidden',
    }}>
      {accent && (
        <span style={{
          position: 'absolute', right: -20, top: -20, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(255,255,255,.08)',
        }} />
      )}
      <span style={{
        width: 38, height: 38, borderRadius: 10,
        background: accent ? 'rgba(255,255,255,.18)' : 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ? '#fff' : 'var(--accent)',
      }}>
        <Icon name={icon} size={18} />
      </span>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, letterSpacing: '-.02em', fontFamily: 'var(--font-display)' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, opacity: accent ? .9 : 1, color: accent ? '#fff' : 'var(--text-1)' }}>{label}</div>
      </div>
      <div style={{ fontSize: 12, opacity: .7, color: accent ? '#fff' : 'var(--text-2)', lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

function SectionLabel({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{
        width: 36, height: 36, borderRadius: 9, background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)', flexShrink: 0,
      }}>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface-1)', borderRadius: 20,
      border: '1px solid var(--border)',
      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

function CardBody({ children, style }) {
  return <div style={{ padding: '20px 24px', ...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '0 24px' }} />;
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function DashboardScreen({ session, data, navigate, actions }) {
  const applications = getApplicantApplications(data, session);
  const notifications = getApplicantNotifications(data, session);
  const documents = getApplicantDocuments(data, session);
  const recommendedPrograms = [...data.programs].sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);
  const calendar = buildDeadlineCalendar(data.programs);
  const nextDeadlineProgram = calendar.upcomingPrograms[0] || null;
  const verifiedDocuments = documents.filter((d) => d.status === 'Verified').length;
  const activeReviews = applications.filter((a) => ['Submitted', 'For Review', 'Incomplete'].includes(a.status)).length;
  const latestAnnouncements = [...data.announcements].sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date)).slice(0, 2);
  const unreadNotifications = notifications.filter((n) => n.unread).length;

  const statCards = [
    { icon: 'profile', label: 'Profile completion', value: `${data.applicantProfile.completeness}%`, detail: `${verifiedDocuments} verified documents`, accent: true },
    { icon: 'applications', label: 'Active applications', value: applications.length, detail: `${activeReviews} under review` },
    { icon: 'deadlines', label: 'Upcoming deadlines', value: calendar.upcomingPrograms.length, detail: nextDeadlineProgram ? `Next: ${formatCalendarLabel(nextDeadlineProgram.deadline)}` : 'None scheduled' },
    { icon: 'alerts', label: 'Unread alerts', value: unreadNotifications, detail: `${latestAnnouncements.length} new announcements` },
  ];

  const statusItems = [
    { label: 'Submitted', value: applications.filter((a) => a.status === 'Submitted').length },
    { label: 'For Review', value: applications.filter((a) => a.status === 'For Review').length },
    { label: 'Incomplete', value: applications.filter((a) => a.status === 'Incomplete').length },
    { label: 'Approved', value: applications.filter((a) => a.status === 'Approved').length },
  ];
  const maxStatusValue = Math.max(...statusItems.map((i) => i.value), 1);

  const progressItems = [
    { icon: 'profile', label: 'Profile readiness', value: data.applicantProfile.completeness, display: `${data.applicantProfile.completeness}%` },
    { icon: 'applications', label: 'Applications in review', value: applications.length ? Math.round((activeReviews / applications.length) * 100) : 0, display: `${activeReviews}` },
    { icon: 'check', label: 'Verified documents', value: documents.length ? Math.round((verifiedDocuments / documents.length) * 100) : 0, display: `${verifiedDocuments}/${documents.length}` },
  ];

  const deadlineBuckets = Array.from(
    calendar.upcomingPrograms.reduce((map, p) => {
      const label = formatMonthShortLabel(p.deadline);
      map.set(label, (map.get(label) || 0) + 1);
      return map;
    }, new Map()),
    ([label, value]) => ({ label, value })
  );
  const maxBucket = Math.max(...deadlineBuckets.map((i) => i.value), 1);

  const firstName = session.name.split(' ')[0];

  return (
    <>
      <style>{`
        .db-root {
          --font-display: var(--pf-font-display, 'Syne', 'Sora', sans-serif);
          --accent: var(--pf-accent, #1e7d4d);
          --accent-strong: var(--pf-accent-dark, #125d38);
          --accent-soft: rgba(30, 125, 77, .12);
          --surface-0: #f2f8f2;
          --surface-1: rgba(255, 255, 255, .94);
          --surface-2: #e7f1e9;
          --border: rgba(18, 32, 25, .1);
          --text-1: var(--pf-ink, #122019);
          --text-2: var(--pf-ink-soft, #33453a);
          --text-3: var(--pf-ink-muted, #748377);
          --success: var(--pf-green, #2ea25f);
          --success-bg: rgba(46, 162, 95, .14);
          --warning: #c48820;
          --warning-bg: rgba(245, 166, 35, .14);
          --status-neutral-bg: rgba(18, 32, 25, .06);
          --status-neutral-text: #53685e;
          --status-accent-bg: var(--accent-soft);
          --status-accent-text: var(--accent);
          --status-warning-bg: var(--warning-bg);
          --status-warning-text: #8b5a12;
          --status-success-bg: var(--success-bg);
          --status-success-text: var(--accent-strong);
          font-family: var(--pf-font-body, 'DM Sans', system-ui, sans-serif);
          background:
            radial-gradient(circle at top right, rgba(123, 212, 155, .18), transparent 28%),
            radial-gradient(circle at bottom left, rgba(30, 125, 77, .08), transparent 32%),
            linear-gradient(180deg, #f7fbf7 0%, #edf5ef 100%);
          min-height: 100vh;
          color: var(--text-1);
          padding: 28px 32px 60px;
          box-sizing: border-box;
        }
        @media (max-width: 900px) { .db-root { padding: 16px 16px 48px; } }
        .db-header { margin-bottom: 28px; }
        .db-header-inner { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .db-greeting { font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-2); margin-bottom: 4px; }
        .db-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; letter-spacing: -.02em; color: var(--text-1); }
        .db-header-actions { display: flex; gap: 10px; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%); color: #fff;
          border: none; border-radius: 10px; padding: 10px 18px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 14px rgba(30,125,77,.28);
          transition: opacity .15s, transform .12s;
        }
        .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(30, 125, 77, .06); color: var(--accent-strong);
          border: 1px solid rgba(30, 125, 77, .14); border-radius: 10px; padding: 10px 18px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background .15s;
        }
        .btn-secondary:hover { background: var(--surface-2); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 5px;
          background: none; border: none; color: var(--accent);
          font-size: 12px; font-weight: 600; cursor: pointer; padding: 0;
          letter-spacing: .02em;
        }
        .btn-ghost:hover { opacity: .75; }
        .db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        @media (max-width: 1100px) { .db-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .db-stats { grid-template-columns: 1fr; } }
        .db-main { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
        @media (max-width: 1100px) { .db-main { grid-template-columns: 1fr; } }
        .db-left { display: flex; flex-direction: column; gap: 20px; }
        .db-right { display: flex; flex-direction: column; gap: 20px; }
        .card-head {
          padding: 18px 24px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .spotlight-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0 18px; }
        .spotlight-meta-item small { display: block; font-size: 11px; color: var(--text-2); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 3px; }
        .spotlight-meta-item strong { font-size: 14px; color: var(--text-1); }
        .progress-row { display: flex; flex-direction: column; gap: 8px; padding: 14px 0; border-bottom: 1px solid var(--border); }
        .progress-row:last-child { border-bottom: none; padding-bottom: 0; }
        .progress-row-top { display: flex; align-items: center; gap: 10px; }
        .progress-row-icon { width: 30px; height: 30px; border-radius: 8px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }
        .progress-row-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-1); }
        .progress-row-val { font-size: 13px; font-weight: 700; color: var(--text-1); }
        .progress-track { height: 5px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent) 0%, var(--success) 100%); border-radius: 99px; transition: width .4s ease; }
        .flow-bar-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
        .flow-bar-label { width: 80px; font-size: 12px; color: var(--text-2); font-weight: 500; white-space: nowrap; }
        .flow-bar-track { flex: 1; height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
        .flow-bar-fill { height: 100%; border-radius: 99px; transition: width .5s ease; }
        .flow-bar-val { width: 24px; text-align: right; font-size: 12px; font-weight: 700; color: var(--text-1); }
        .notif-item { padding: 14px 0; border-bottom: 1px solid var(--border); }
        .notif-item:last-child { border-bottom: none; padding-bottom: 0; }
        .notif-item-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
        .notif-item-title { font-size: 13px; font-weight: 600; color: var(--text-1); }
        .notif-item-msg { font-size: 12px; color: var(--text-2); line-height: 1.5; }
        .notif-item-time { font-size: 11px; color: var(--text-3); margin-top: 5px; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-weekday { font-size: 10px; font-weight: 700; color: var(--text-3); text-align: center; padding: 4px 0 8px; letter-spacing: .06em; text-transform: uppercase; }
        .cal-cell { aspect-ratio: 1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: var(--text-2); }
        .cal-cell.has-deadline { background: linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%); color: #fff; font-weight: 700; box-shadow: 0 3px 10px rgba(30,125,77,.24); }
        .cal-cell.has-deadline span { font-size: 9px; opacity: .85; }
        .reco-card { padding: 18px; border: 1px solid var(--border); border-radius: 14px; display: flex; flex-direction: column; gap: 10px; background: var(--surface-1); }
        .reco-card h3 { font-size: 14px; font-weight: 600; color: var(--text-1); margin: 0; }
        .reco-card p { font-size: 12px; color: var(--text-2); line-height: 1.55; margin: 0; }
        .reco-card-actions { display: flex; gap: 8px; }
        .deadline-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); gap: 12px; }
        .deadline-row:last-child { border-bottom: none; }
        .deadline-row-left strong { display: block; font-size: 13px; font-weight: 600; color: var(--text-1); }
        .deadline-row-left small { font-size: 11px; color: var(--text-2); }
        .deadline-date { font-size: 12px; font-weight: 700; color: var(--accent); white-space: nowrap; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
        .unread-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
      `}</style>

      <div className="db-root">
        {/* ── Header ── */}
        <div className="db-header">
          <div className="db-header-inner">
            <div>
              <div className="db-greeting">Welcome back, {firstName}</div>
              <div className="db-title">Applicant Dashboard</div>
            </div>
            <div className="db-header-actions">
              <button className="btn-secondary" onClick={() => navigate('/applicant/manage-applications')}>
                <Icon name="applications" size={15} /> My Applications
              </button>
              <button className="btn-primary" onClick={() => navigate('/applicant/search-programs')}>
                <Icon name="star" size={15} /> Search Programs
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="db-stats">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="db-main">
          {/* Left column */}
          <div className="db-left">
            {/* Next deadline spotlight */}
            <Card>
              <CardBody>
                <SectionLabel icon="deadlines" title="Next Deadline Spotlight" sub="The closest open program before the intake window closes." />
                {nextDeadlineProgram ? (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <Chip>{nextDeadlineProgram.category}</Chip>
                      <Chip accent>{nextDeadlineProgram.status}</Chip>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>{nextDeadlineProgram.title}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{nextDeadlineProgram.summary}</p>
                    <div className="spotlight-meta">
                      <div className="spotlight-meta-item"><small>Deadline</small><strong>{formatCalendarLabel(nextDeadlineProgram.deadline)}</strong></div>
                      <div className="spotlight-meta-item"><small>Office</small><strong>{nextDeadlineProgram.office}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" onClick={() => actions.startApplication(nextDeadlineProgram.id)}>Apply Now</button>
                      <button className="btn-secondary" onClick={() => actions.openProgramDetails(nextDeadlineProgram.id)}>View Details</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-2)' }}>No open or upcoming deadlines at this time.</p>
                )}
              </CardBody>
            </Card>

            {/* Analytics row */}
            <div className="two-col">
              {/* Progress */}
              <Card>
                <div className="card-head">
                  <SectionLabel icon="chart" title="Progress" />
                </div>
                <Divider />
                <CardBody>
                  {progressItems.map((item) => (
                    <div className="progress-row" key={item.label}>
                      <div className="progress-row-top">
                        <span className="progress-row-icon"><Icon name={item.icon} size={15} /></span>
                        <span className="progress-row-label">{item.label}</span>
                        <span className="progress-row-val">{item.display}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.max(item.value, 4)}%` }} />
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {/* Application flow */}
              <Card>
                <div className="card-head">
                  <SectionLabel icon="applications" title="Application Flow" />
                </div>
                <Divider />
                <CardBody>
                  {statusItems.map((item) => {
                    const c = STATUS_COLORS[item.label] || STATUS_COLORS['Submitted'];
                    return (
                      <div className="flow-bar-row" key={item.label}>
                        <span className="flow-bar-label">{item.label}</span>
                        <div className="flow-bar-track">
                          <div className="flow-bar-fill" style={{ width: `${(item.value / maxStatusValue) * 100}%`, background: c.bar }} />
                        </div>
                        <span className="flow-bar-val">{item.value}</span>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </div>

            {/* Recommended programs */}
            <Card>
              <div className="card-head">
                <SectionLabel icon="star" title="Recommended for You" sub="Top-fit programs for this intake cycle." />
                <button className="btn-ghost" onClick={() => navigate('/applicant/search-programs')}>Browse all <Icon name="arrow-right" size={13} /></button>
              </div>
              <Divider />
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recommendedPrograms.map((program) => (
                  <div className="reco-card" key={program.id}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip>{program.category}</Chip>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{program.fitScore}% match</span>
                    </div>
                    <h3>{program.title}</h3>
                    <p>{program.summary}</p>
                    <div className="reco-card-actions">
                      <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => actions.startApplication(program.id)}>Apply</button>
                      <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => actions.openProgramDetails(program.id)}>Details</button>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Right column */}
          <div className="db-right">
            {/* Calendar */}
            <Card>
              <div className="card-head">
                <SectionLabel icon="deadlines" title={calendar.monthLabel} />
                <Chip>{calendar.upcomingPrograms.length}</Chip>
              </div>
              <Divider />
              <CardBody>
                <div className="cal-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div className="cal-weekday" key={d}>{d}</div>
                  ))}
                  {calendar.cells.map((cell) => (
                    <div className={`cal-cell${cell.items?.length ? ' has-deadline' : ''}`} key={cell.key}>
                      {!cell.empty && (
                        <>
                          {cell.day}
                          {cell.items.length > 0 && <span>{cell.items.length} due</span>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>

              {/* Deadline load */}
              {deadlineBuckets.length > 0 && (
                <>
                  <Divider />
                  <CardBody>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, letterSpacing: '.04em', textTransform: 'uppercase' }}>Deadline Load</div>
                    {deadlineBuckets.map((item) => (
                      <div className="flow-bar-row" key={item.label}>
                        <span className="flow-bar-label">{item.label}</span>
                        <div className="flow-bar-track">
                          <div className="flow-bar-fill" style={{ width: `${(item.value / maxBucket) * 100}%`, background: 'var(--accent)' }} />
                        </div>
                        <span className="flow-bar-val">{item.value}</span>
                      </div>
                    ))}
                  </CardBody>
                </>
              )}

              {/* Upcoming deadlines list */}
              {calendar.upcomingPrograms.length > 0 && (
                <>
                  <Divider />
                  <CardBody>
                    {calendar.upcomingPrograms.slice(0, 4).map((p) => (
                      <div className="deadline-row" key={p.id}>
                        <div className="deadline-row-left">
                          <strong>{p.title}</strong>
                          <small>{p.office}</small>
                        </div>
                        <span className="deadline-date">{formatCalendarLabel(p.deadline)}</span>
                      </div>
                    ))}
                  </CardBody>
                </>
              )}
            </Card>

            {/* Updates & notifications */}
            <Card>
              <div className="card-head">
                <SectionLabel icon="clock" title="Recent Updates" />
                <button className="btn-ghost" onClick={() => navigate('/applicant/notifications')}>All <Icon name="arrow-right" size={13} /></button>
              </div>
              <Divider />
              <CardBody>
                {notifications.slice(0, 2).map((n) => (
                  <div className="notif-item" key={n.id}>
                    <div className="notif-item-head">
                      <span className="notif-item-title">{n.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {n.unread && <span className="unread-dot" />}
                        {n.unread && <Chip>Unread</Chip>}
                      </div>
                    </div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{n.time}</div>
                  </div>
                ))}
                {latestAnnouncements.map((a) => (
                  <div className="notif-item" key={a.id}>
                    <div className="notif-item-head">
                      <span className="notif-item-title">{a.title}</span>
                      <Chip>Announcement</Chip>
                    </div>
                    <div className="notif-item-msg">{a.message}</div>
                    <div className="notif-item-time">{formatCalendarLabel(a.date)}</div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
