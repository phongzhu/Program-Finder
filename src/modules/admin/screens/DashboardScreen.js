function parseDateValue(value) {
  return new Date(`${value}T12:00:00`);
}

function parseDateTimeValue(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i);
  if (!match) {
    const dateKey = extractDateKey(value);
    return dateKey ? parseDateValue(dateKey) : new Date(NaN);
  }

  const [, datePart, hourPart, minutePart, periodPart] = match;

  if (!hourPart || !minutePart) {
    return parseDateValue(datePart);
  }

  let hours = Number(hourPart);
  const minutes = Number(minutePart);
  const period = periodPart.toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function formatCalendarLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(parseDateValue(value));
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date);
}

function formatWeekdayLabel(date) {
  return new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(date);
}

function formatDateKey(date) {
  return new Intl.DateTimeFormat('en-CA').format(date);
}

function extractDateKey(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function buildDeadlineCalendar(programs) {
  const trackedPrograms = [...programs]
    .filter((program) => ['Open', 'Upcoming'].includes(program.status))
    .sort((left, right) => parseDateValue(left.deadline) - parseDateValue(right.deadline));

  const anchorDate = trackedPrograms[0] ? parseDateValue(trackedPrograms[0].deadline) : new Date();
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = monthStart.getDay();
  const deadlineMap = trackedPrograms.reduce((map, program) => {
    const deadlineDate = parseDateValue(program.deadline);
    if (deadlineDate.getFullYear() === monthStart.getFullYear() && deadlineDate.getMonth() === monthStart.getMonth()) {
      const existing = map.get(deadlineDate.getDate()) || [];
      existing.push(program);
      map.set(deadlineDate.getDate(), existing);
    }
    return map;
  }, new Map());

  const cells = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ key: `empty-${index}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `day-${day}`,
      day,
      items: deadlineMap.get(day) || [],
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, empty: true });
  }

  return {
    monthLabel: formatMonthLabel(monthStart),
    cells,
    trackedPrograms,
  };
}

function buildActivitySeries(data) {
  const dateKeys = [
    ...data.applications.map((item) => extractDateKey(item.submittedAt)),
    ...data.notifications.map((item) => extractDateKey(item.time)),
    ...data.announcements.map((item) => extractDateKey(item.date)),
    ...data.auditLogs.map((item) => extractDateKey(item.time)),
    ...data.backupHistory.map((item) => extractDateKey(item.date)),
  ].filter(Boolean);

  const anchorTime = dateKeys.length
    ? Math.max(...dateKeys.map((value) => parseDateValue(value).getTime()))
    : Date.now();
  const anchorDate = new Date(anchorTime);
  const counts = dateKeys.reduce((map, value) => {
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map());
  const points = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - offset);
    const key = formatDateKey(day);
    points.push({
      key,
      label: formatWeekdayLabel(day),
      value: counts.get(key) || 0,
    });
  }

  return {
    points,
    maxValue: Math.max(...points.map((point) => point.value), 1),
  };
}

function buildChartPath(points, maxValue, width, height, padding) {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const step = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth;

  return points
    .map((point, index) => {
      const x = padding + step * index;
      const y = padding + usableHeight - (point.value / maxValue) * usableHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(points, maxValue, width, height, padding) {
  const linePath = buildChartPath(points, maxValue, width, height, padding);
  const usableWidth = width - padding * 2;
  const step = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth;
  const lastX = padding + step * (points.length - 1);
  return `${linePath} L ${lastX} ${height - padding} L ${padding} ${height - padding} Z`;
}

function normalizeRoleKey(value) {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('admin')) {
    return 'admin';
  }

  if (normalized.includes('personnel')) {
    return 'personnel';
  }

  if (normalized.includes('applicant')) {
    return 'applicant';
  }

  return 'system';
}

function formatRelativeTime(value) {
  const timestamp = parseDateTimeValue(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} min ago`;
  }

  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }

  if (diffMinutes < 10080) {
    const days = Math.floor(diffMinutes / 1440);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function getProgramTitle(programs, programId) {
  return programs.find((program) => program.id === programId)?.title || 'selected program';
}

function buildRecentSystemActions(data) {
  const auditActions = data.auditLogs.map((log) => ({
    id: `audit-${log.id}`,
    actor: log.actor,
    role: normalizeRoleKey(log.role),
    action: log.action,
    module: log.module,
    time: log.time,
    timestamp: parseDateTimeValue(log.time).getTime(),
  }));

  const applicationActions = data.applications.map((application) => ({
    id: `application-${application.id}`,
    actor: application.applicantName,
    role: 'applicant',
    action: `Submitted new application for ${getProgramTitle(data.programs, application.programId)}`,
    module: 'Applications',
    time: application.submittedAt,
    timestamp: parseDateTimeValue(application.submittedAt).getTime(),
  }));

  const backupActions = data.backupHistory.map((backup) => ({
    id: `backup-${backup.id}`,
    actor: 'System',
    role: 'system',
    action: `${backup.type} completed successfully`,
    module: 'Backups',
    time: backup.date,
    timestamp: parseDateTimeValue(backup.date).getTime(),
  }));

  return [...auditActions, ...applicationActions, ...backupActions]
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 6);
}

function Icon({ name, size = 17 }) {
  const style = { width: size, height: size, display: 'block', flexShrink: 0 };

  switch (name) {
    case 'users':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20a6 6 0 0 1 12 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M21 20a4.5 4.5 0 0 0-7-3.7" />
        </svg>
      );
    case 'programs':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M9 9h6M9 12h6M9 15h4" />
        </svg>
      );
    case 'pending':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case 'backup':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 3v5l3-3" />
        </svg>
      );
    case 'activity':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 19 9 5 6 12 2 12" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M5 9h14" />
        </svg>
      );
    case 'log':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12h6M9 15h4M6 4h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case 'pipeline':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19h14M8 16V11M12 16V8M16 16v-4" />
        </svg>
      );
    case 'roles':
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    default:
      return (
        <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="6.5" />
        </svg>
      );
  }
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: 'rgba(250,252,248,0.96)',
        borderRadius: 20,
        border: '1px solid rgba(18,32,25,.09)',
        boxShadow: '0 1px 4px rgba(18,32,25,.05)',
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

function CardHead({ icon, title, sub, right }) {
  return (
    <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            background: 'rgba(30,125,77,.1)',
            color: 'var(--pf-accent-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={16} />
        </span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--pf-ink)', lineHeight: 1.3 }}>{title}</div>
          {sub ? (
            <div style={{ fontSize: 11.5, color: 'var(--pf-ink-muted)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
          ) : null}
        </div>
      </div>
      {right}
    </div>
  );
}

function Chip({ children, green }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 9px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.03em',
        background: green ? 'rgba(30,125,77,.12)' : 'rgba(18,32,25,.07)',
        color: green ? 'var(--pf-accent-dark)' : 'var(--pf-ink-muted)',
      }}
    >
      {children}
    </span>
  );
}

export default function DashboardScreen({ data }) {
  const calendar = buildDeadlineCalendar(data.programs);
  const activitySeries = buildActivitySeries(data);
  const recentSystemActions = buildRecentSystemActions(data);
  const chartWidth = 520;
  const chartHeight = 160;
  const chartPadding = 20;
  const linePath = buildChartPath(activitySeries.points, activitySeries.maxValue, chartWidth, chartHeight, chartPadding);
  const areaPath = buildAreaPath(activitySeries.points, activitySeries.maxValue, chartWidth, chartHeight, chartPadding);

  const openPrograms = data.programs.filter((program) => program.status === 'Open').length;
  const pendingCases = data.applications.filter((application) =>
    ['Submitted', 'For Review', 'Incomplete'].includes(application.status)
  ).length;
  const activeUsers = data.users.filter((user) => user.status === 'Active').length;
  const completedBackups = data.backupHistory.filter((backup) => backup.status === 'Completed').length;

  const statCards = [
    { icon: 'users', label: 'Active Users', value: activeUsers, kicker: `+${Math.min(data.auditLogs.length, 3)} this week` },
    { icon: 'programs', label: 'Open Programs', value: openPrograms, kicker: `${calendar.trackedPrograms.length} tracked` },
    { icon: 'pending', label: 'Pending Cases', value: pendingCases, kicker: 'needs review' },
    {
      icon: 'backup',
      label: 'Backup Health',
      value: `${completedBackups}/${data.backupHistory.length}`,
      kicker: completedBackups === data.backupHistory.length ? 'healthy' : 'attention needed',
    },
  ];

  const appStatusItems = [
    { label: 'Submitted', value: data.applications.filter((application) => application.status === 'Submitted').length, color: '#94a3b8' },
    { label: 'For Review', value: data.applications.filter((application) => application.status === 'For Review').length, color: 'var(--pf-accent)' },
    { label: 'Incomplete', value: data.applications.filter((application) => application.status === 'Incomplete').length, color: '#e5a33c' },
    { label: 'Approved', value: data.applications.filter((application) => application.status === 'Approved').length, color: '#2d8c54' },
    { label: 'Rejected', value: data.applications.filter((application) => application.status === 'Rejected').length, color: '#c3564b' },
  ];
  const maxAppStatus = Math.max(...appStatusItems.map((item) => item.value), 1);

  const roleItems = [
    { label: 'Applicants', value: data.users.filter((user) => user.role === 'applicant').length },
    { label: 'Personnel', value: data.users.filter((user) => user.role === 'personnel').length },
    { label: 'Admins', value: data.users.filter((user) => user.role === 'admin').length },
  ];
  const maxRole = Math.max(...roleItems.map((item) => item.value), 1);

  return (
    <>
      <style>{`
        .adm-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          display: grid;
          gap: 18px;
          color: var(--pf-ink, #122019);
        }
        .adm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 1100px) { .adm-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) { .adm-stats { grid-template-columns: 1fr; } }
        .adm-stat {
          background: rgba(250,252,248,.97);
          border-radius: 18px;
          border: 1px solid rgba(18,32,25,.09);
          padding: 20px 20px 18px;
          box-shadow: 0 1px 3px rgba(18,32,25,.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }
        .adm-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: rgba(30,125,77,.1);
          color: var(--pf-accent-dark, #1e7d4d);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .adm-stat-kicker {
          font-size: 11.5px;
          color: var(--pf-ink-muted, #4a6356);
          font-weight: 700;
          letter-spacing: .02em;
          text-transform: none;
        }
        .adm-stat-value {
          font-family: var(--font-display, 'Sora', sans-serif);
          font-size: 30px;
          font-weight: 700;
          color: var(--pf-ink, #122019);
          line-height: 1;
          letter-spacing: -.01em;
        }
        .adm-stat-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--pf-ink, #122019);
        }
        .adm-stat::after {
          content: '';
          position: absolute;
          right: -14px;
          bottom: -14px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(30,125,77,.06);
        }
        .adm-main {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 18px;
          align-items: start;
          margin-bottom: 18px;
        }
        @media (max-width: 1100px) { .adm-main { grid-template-columns: 1fr; } }
        .adm-left,
        .adm-right {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .adm-chart-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .adm-activity-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-top: 12px;
        }
        .adm-activity-label {
          text-align: center;
          font-size: 11px;
          color: var(--pf-ink-muted, #4a6356);
        }
        .adm-activity-label strong {
          display: block;
          font-size: 13px;
          color: var(--pf-ink, #122019);
          font-weight: 700;
          margin-bottom: 2px;
        }
        .adm-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .adm-bar-label {
          width: 84px;
          font-size: 12px;
          color: var(--pf-ink-muted, #4a6356);
          font-weight: 500;
          flex-shrink: 0;
        }
        .adm-bar-track {
          flex: 1;
          height: 8px;
          background: rgba(18,32,25,.08);
          border-radius: 99px;
          overflow: hidden;
        }
        .adm-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width .45s ease;
        }
        .adm-bar-val {
          width: 28px;
          text-align: right;
          font-size: 12px;
          font-weight: 700;
          color: var(--pf-ink, #122019);
        }
        .adm-log-item {
          padding: 14px 0;
          border-bottom: 1px solid rgba(18,32,25,.07);
        }
        .adm-log-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .adm-log-top,
        .adm-log-headline {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .adm-log-top {
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .adm-log-actor {
          font-size: 13px;
          font-weight: 700;
          color: var(--pf-ink, #122019);
        }
        .adm-log-role {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          background: rgba(18,32,25,.07);
          color: var(--pf-ink-muted, #4a6356);
        }
        .adm-log-role.is-admin {
          background: rgba(30,125,77,.12);
          color: var(--pf-accent-dark, #1e7d4d);
        }
        .adm-log-action {
          font-size: 12.5px;
          color: var(--pf-ink-muted, #4a6356);
          line-height: 1.5;
        }
        .adm-log-meta {
          display: flex;
          gap: 10px;
          margin-top: 5px;
        }
        .adm-log-meta span {
          font-size: 11px;
          color: rgba(74,99,86,.65);
        }
        .adm-role-list {
          display: grid;
          gap: 12px;
        }
        .adm-role-row {
          display: grid;
          gap: 6px;
        }
        .adm-role-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .adm-role-top span {
          font-size: 12.5px;
          color: var(--pf-ink-muted, #4a6356);
          font-weight: 600;
        }
        .adm-role-top strong {
          font-size: 15px;
          color: var(--pf-ink, #122019);
        }
        .adm-role-track {
          height: 7px;
          background: rgba(18,32,25,.08);
          border-radius: 99px;
          overflow: hidden;
        }
        .adm-role-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--pf-accent, #2da05e) 0%, var(--pf-accent-dark, #1e7d4d) 100%);
        }
        .adm-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        .adm-cal-weekday {
          font-size: 10px;
          font-weight: 700;
          color: var(--pf-ink-muted, #4a6356);
          text-align: center;
          padding: 4px 0 6px;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .adm-cal-cell {
          aspect-ratio: 1;
          border-radius: 7px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--pf-ink-muted, #4a6356);
          background: rgba(255,255,255,.6);
          border: 1px solid transparent;
        }
        .adm-cal-cell.has-deadline {
          background: rgba(30,125,77,.13);
          border-color: rgba(30,125,77,.2);
          color: var(--pf-accent-dark, #1e7d4d);
          font-weight: 700;
        }
        .adm-cal-cell.has-deadline span {
          font-size: 9px;
          font-weight: 700;
          display: block;
          opacity: .8;
        }
        .adm-cal-cell.is-empty {
          background: transparent;
          border-color: transparent;
        }
        .adm-deadline-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid rgba(18,32,25,.07);
          gap: 10px;
        }
        .adm-deadline-row:last-child {
          border-bottom: none;
        }
        .adm-deadline-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--pf-ink, #122019);
        }
        .adm-deadline-office {
          font-size: 11px;
          color: var(--pf-ink-muted, #4a6356);
          margin-top: 1px;
        }
        .adm-deadline-date {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--pf-accent-dark, #1e7d4d);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .adm-section-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--pf-ink-muted, #4a6356);
          margin-bottom: 10px;
        }
      `}</style>

      <div className="adm-root">
        <div className="adm-stats">
          {statCards.map((card) => (
            <div className="adm-stat" key={card.label}>
              <div className="adm-stat-kicker">{card.kicker}</div>
              <div className="adm-stat-icon">
                <Icon name={card.icon} size={17} />
              </div>
              <div className="adm-stat-value">{card.value}</div>
              <div className="adm-stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="adm-main">
          <div className="adm-left">
            <Card>
              <CardHead
                icon="activity"
                title="Platform Activity"
                sub="Events across all modules - 7 days"
                right={<Chip green>Live</Chip>}
              />
              <Divider />
              <CardBody>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(213,240,221,.5) 0%, rgba(250,252,248,.3) 100%)',
                    borderRadius: 12,
                    padding: '14px 12px 10px',
                  }}
                >
                  <svg className="adm-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} aria-label="Platform activity chart">
                    <defs>
                      <linearGradient id="adminActivityFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(30,125,77,.28)" />
                        <stop offset="100%" stopColor="rgba(30,125,77,.02)" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#adminActivityFill)" />
                    <path d={linePath} fill="none" stroke="var(--pf-accent, #2da05e)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    {activitySeries.points.map((point, index) => {
                      const usableWidth = chartWidth - chartPadding * 2;
                      const usableHeight = chartHeight - chartPadding * 2;
                      const step = activitySeries.points.length > 1 ? usableWidth / (activitySeries.points.length - 1) : usableWidth;
                      const x = chartPadding + step * index;
                      const y = chartPadding + usableHeight - (point.value / activitySeries.maxValue) * usableHeight;

                      return (
                        <circle
                          key={point.key}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#fff"
                          stroke="var(--pf-accent-dark, #1e7d4d)"
                          strokeWidth="2.5"
                        />
                      );
                    })}
                  </svg>
                  <div className="adm-activity-labels">
                    {activitySeries.points.map((point) => (
                      <div className="adm-activity-label" key={point.key}>
                        <strong>{point.value}</strong>
                        {point.label}
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHead
                icon="pipeline"
                title="Application Pipeline"
                sub="Status breakdown across all submissions"
                right={<Chip>Bar Progress</Chip>}
              />
              <Divider />
              <CardBody>
                {appStatusItems.map((item) => (
                  <div className="adm-bar-row" key={item.label}>
                    <span className="adm-bar-label">{item.label}</span>
                    <div className="adm-bar-track">
                      <div className="adm-bar-fill" style={{ width: `${(item.value / maxAppStatus) * 100}%`, background: item.color }} />
                    </div>
                    <span className="adm-bar-val">{item.value}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="adm-right">
            <Card>
              <CardHead
                icon="calendar"
                title="Deadline Calendar"
                sub={calendar.monthLabel}
                right={<Chip green>{calendar.trackedPrograms.length} open</Chip>}
              />
              <Divider />
              <CardBody>
                <div className="adm-cal-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div className="adm-cal-weekday" key={day}>
                      {day}
                    </div>
                  ))}
                  {calendar.cells.map((cell) => (
                    <div
                      className={`adm-cal-cell${cell.items?.length ? ' has-deadline' : ''}${cell.empty ? ' is-empty' : ''}`}
                      key={cell.key}
                    >
                      {!cell.empty ? (
                        <>
                          {cell.day}
                          {cell.items.length > 0 ? <span>{cell.items.length}</span> : null}
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardBody>
              {calendar.trackedPrograms.length > 0 ? (
                <>
                  <Divider />
                  <CardBody>
                    <div className="adm-section-label">Upcoming deadlines</div>
                    {calendar.trackedPrograms.slice(0, 4).map((program) => (
                      <div className="adm-deadline-row" key={program.id}>
                        <div>
                          <div className="adm-deadline-name">{program.title}</div>
                          <div className="adm-deadline-office">{program.office}</div>
                        </div>
                        <div className="adm-deadline-date">{formatCalendarLabel(program.deadline)}</div>
                      </div>
                    ))}
                  </CardBody>
                </>
              ) : null}
            </Card>

            <Card>
              <CardHead
                icon="roles"
                title="User Roles"
                sub="Current account distribution"
              />
              <Divider />
              <CardBody>
                <div className="adm-role-list">
                  {roleItems.map((item) => (
                    <div className="adm-role-row" key={item.label}>
                      <div className="adm-role-top">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div className="adm-role-track">
                        <div className="adm-role-fill" style={{ width: `${(item.value / maxRole) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <Card>
          <CardHead
            icon="log"
            title="Audit Log"
            sub="Recent system actions"
            right={<Chip green>Real-time</Chip>}
          />
          <Divider />
          <CardBody>
            {recentSystemActions.map((log) => (
              <div className="adm-log-item" key={log.id}>
                <div className="adm-log-top">
                  <div className="adm-log-headline">
                    <span className="adm-log-actor">{log.actor}</span>
                    <span className={`adm-log-role${log.role === 'admin' ? ' is-admin' : ''}`}>{log.role}</span>
                  </div>
                </div>
                <div className="adm-log-action">{log.action}</div>
                <div className="adm-log-meta">
                  <span>{log.module}</span>
                  <span>&middot;</span>
                  <span>{formatRelativeTime(log.time)}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
