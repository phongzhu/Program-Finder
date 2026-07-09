import { SummaryCard } from 'Components/UI';

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

function buildChartCoordinates(points, maxValue, width, height, padding) {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const step = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth;

  return points.map((point, index) => ({
    ...point,
    x: padding + step * index,
    y: padding + usableHeight - (point.value / maxValue) * usableHeight,
  }));
}

function buildChartPath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildAreaPath(points, height, padding) {
  const linePath = buildChartPath(points);
  const lastX = points[points.length - 1]?.x ?? padding;
  return `${linePath} L ${lastX} ${height - padding} L ${padding} ${height - padding} Z`;
}

function buildChartGuides(maxValue, segments = 4) {
  const effectiveSegments = Math.min(segments, Math.max(1, Math.round(maxValue)));

  return Array.from({ length: effectiveSegments + 1 }, (_, index) => {
    const ratio = index / effectiveSegments;
    return {
      key: `guide-${index}`,
      ratio,
      value: Math.round((1 - ratio) * maxValue),
    };
  });
}

function describeActivityTrend(points) {
  const latestPoint = points[points.length - 1];
  const previousPoint = points[points.length - 2];

  if (!latestPoint || !previousPoint) {
    return 'Activity trend unavailable';
  }

  if (latestPoint.value === previousPoint.value) {
    return `Flat vs ${previousPoint.label}`;
  }

  if (latestPoint.value > previousPoint.value) {
    return `Up ${latestPoint.value - previousPoint.value} vs ${previousPoint.label}`;
  }

  return `Down ${previousPoint.value - latestPoint.value} vs ${previousPoint.label}`;
}

function normalizeRoleKey(value) {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('captain') || normalized.includes('admin')) {
    return 'captain';
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
        background: 'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,250,244,.96) 100%)',
        borderRadius: 24,
        border: '1px solid rgba(45,122,75,.1)',
        boxShadow: '0 14px 32px rgba(18,32,25,.05)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardBody({ children, style }) {
  return <div style={{ padding: '22px 24px', ...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(45,122,75,.1)', margin: '0 24px' }} />;
}

function CardHead({ icon, title, sub, right }) {
  return (
    <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(45,122,75,.12) 0%, rgba(244,197,66,.14) 100%)',
            color: 'var(--bulacan-green-deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(45,122,75,.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.72)',
          }}
        >
          <Icon name={icon} size={16} />
        </span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--pf-ink)', lineHeight: 1.3, letterSpacing: '-.01em' }}>{title}</div>
          {sub ? (
            <div style={{ fontSize: 16, color: 'var(--pf-ink-muted)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
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
        padding: '4px 10px',
        borderRadius: 99,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        background: green ? 'rgba(45,122,75,.12)' : 'rgba(244,197,66,.12)',
        color: green ? 'var(--bulacan-green-deep)' : 'var(--pf-ink-muted)',
        border: green ? '1px solid rgba(45,122,75,.14)' : '1px solid rgba(244,197,66,.18)',
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
  const chartHeight = 196;
  const chartPadding = 22;
  const chartPoints = buildChartCoordinates(activitySeries.points, activitySeries.maxValue, chartWidth, chartHeight, chartPadding);
  const chartGuides = buildChartGuides(activitySeries.maxValue, 4);
  const linePath = buildChartPath(chartPoints);
  const areaPath = buildAreaPath(chartPoints, chartHeight, chartPadding);

  const openPrograms = data.programs.filter((program) => program.status === 'Open').length;
  const pendingCases = data.applications.filter((application) =>
    ['Submitted', 'For Review', 'Incomplete'].includes(application.status)
  ).length;
  const activeUsers = data.users.filter((user) => user.status === 'Active').length;
  const completedBackups = data.backupHistory.filter((backup) => backup.status === 'Completed').length;
  const totalActivity = activitySeries.points.reduce((sum, point) => sum + point.value, 0);
  const averageActivity = Math.round((totalActivity / Math.max(activitySeries.points.length, 1)) * 10) / 10;
  const peakActivityPoint = activitySeries.points.reduce(
    (highest, point) => (point.value > highest.value ? point : highest),
    activitySeries.points[0]
  );
  const activityTrend = describeActivityTrend(activitySeries.points);

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
    { label: 'Submitted', value: data.applications.filter((application) => application.status === 'Submitted').length, color: '#7a867b' },
    { label: 'For Review', value: data.applications.filter((application) => application.status === 'For Review').length, color: '#c99612' },
    { label: 'Incomplete', value: data.applications.filter((application) => application.status === 'Incomplete').length, color: '#d27a28' },
    { label: 'Approved', value: data.applications.filter((application) => application.status === 'Approved').length, color: '#2d7a4b' },
    { label: 'Rejected', value: data.applications.filter((application) => application.status === 'Rejected').length, color: '#c63b3d' },
  ];
  const maxAppStatus = Math.max(...appStatusItems.map((item) => item.value), 1);

  const roleItems = [
    { label: 'Applicants', value: data.users.filter((user) => user.role === 'applicant').length },
    { label: 'Personnel', value: data.users.filter((user) => user.role === 'personnel' && user.staffRole !== 'system_admin').length },
    { label: 'System Admins', value: data.users.filter((user) => user.role === 'personnel' && user.staffRole === 'system_admin').length },
  ];
  const maxRole = Math.max(...roleItems.map((item) => item.value), 1);
  return (
    <>
      <style>{`
        .adm-root {
          font-family: var(--font-body, 'Public Sans', system-ui, sans-serif);
          --adm-surface: rgba(255,255,255,.98);
          --adm-surface-soft: rgba(248,250,244,.96);
          --adm-surface-muted: rgba(242,247,239,.94);
          --adm-border: rgba(45,122,75,.12);
          --adm-border-strong: rgba(45,122,75,.18);
          --adm-green-soft: rgba(45,122,75,.12);
          --adm-gold-soft: rgba(244,197,66,.16);
          --adm-red-soft: rgba(198,59,61,.14);
          display: grid;
          gap: 18px;
          color: var(--pf-ink, #122019);
          padding-bottom: 48px;
        }
        .adm-overview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 1100px) { .adm-overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 580px) { .adm-overview-grid { grid-template-columns: 1fr; } }
        .adm-overview-card {
          min-height: 10rem;
          padding: 1.3rem 1.35rem;
          border-radius: 22px;
          background:
            radial-gradient(circle at top right, var(--adm-gold-soft) 0%, transparent 26%),
            radial-gradient(circle at 14% 18%, var(--adm-green-soft) 0%, transparent 18%),
            linear-gradient(180deg, var(--adm-surface) 0%, var(--adm-surface-soft) 100%);
          border: 1px solid var(--adm-border);
          box-shadow: 0 14px 28px rgba(18,32,25,.05);
          position: relative;
          overflow: hidden;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .adm-overview-card:hover { transform: translateY(-2px); box-shadow: 0 18px 34px rgba(18,32,25,.08); }
        .adm-overview-card small {
          display: block;
          font-size: .95rem;
          color: var(--pf-ink-muted, #3b4148);
          font-weight: 700;
          letter-spacing: .02em;
          text-transform: none;
          margin-bottom: .45rem;
        }
        .adm-overview-card strong {
          display: block;
          font-family: var(--font-display, 'Public Sans', system-ui, sans-serif);
          font-size: 2.15rem;
          font-weight: 800;
          color: var(--pf-ink, #122019);
          line-height: 1;
          letter-spacing: -.02em;
          margin-bottom: .65rem;
        }
        .adm-overview-card span {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: var(--pf-ink, #122019);
        }
        .adm-overview-card::after {
          content: '';
          position: absolute;
          right: -14px;
          bottom: -14px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--adm-gold-soft) 0%, rgba(244,197,66,0) 72%);
        }
        .adm-main {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: start;
          margin-bottom: 18px;
        }
        .adm-left,
        .adm-right {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .adm-right {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
          align-items: start;
        }
        @media (max-width: 1100px) {
          .adm-right { grid-template-columns: 1fr; }
        }
        .adm-chart-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .adm-activity-shell {
          display: grid;
          gap: 14px;
        }
        .adm-activity-overview {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }
        .adm-activity-copy {
          max-width: none;
          flex: 1 1 22rem;
        }
        .adm-activity-copy p {
          margin: 0;
          font-size: 1.375rem;
          line-height: 1.55;
          color: var(--pf-ink-muted, #3b4148);
        }
        .adm-activity-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
          flex: 1 1 24rem;
        }
        .adm-activity-stat {
          min-width: 108px;
          padding: 10px 12px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,.84) 0%, rgba(248,250,244,.9) 100%);
          border: 1px solid var(--adm-border);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
        }
        .adm-activity-stat small {
          display: block;
          font-size: 1.375rem;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--pf-ink-muted, #4a6356);
        }
        .adm-activity-stat strong {
          display: block;
          margin-top: 6px;
          color: var(--pf-ink, #122019);
          font-family: var(--font-display, 'Public Sans', system-ui, sans-serif);
          font-size: 1.375rem;
          font-weight: 800;
          line-height: 1;
        }
        .adm-chart-stage {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          align-items: stretch;
        }
        .adm-chart-grid-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 0 34px;
        }
        .adm-chart-grid-label {
          text-align: right;
          font-size: 1.375rem;
          font-weight: 700;
          color: rgba(74,99,86,.72);
        }
        .adm-chart-frame {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 16px 16px 12px;
          background:
            radial-gradient(circle at top right, var(--adm-gold-soft) 0%, transparent 28%),
            radial-gradient(circle at 16% 12%, var(--adm-green-soft) 0%, transparent 22%),
            linear-gradient(180deg, rgba(239,246,238,.96) 0%, rgba(251,253,249,.98) 100%);
          border: 1px solid var(--adm-border);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
        }
        .adm-chart-caption {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
          font-size: 1.375rem;
          color: var(--pf-ink-muted, #4a6356);
        }
        .adm-chart-grid-line {
          stroke: rgba(18,32,25,.08);
          stroke-dasharray: 4 8;
        }
        .adm-chart-grid-line.is-base {
          stroke: rgba(45,122,75,.2);
          stroke-dasharray: none;
        }
        .adm-activity-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-top: 2px;
        }
        .adm-activity-label {
          text-align: center;
          font-size: 1.375rem;
          color: var(--pf-ink-muted, #4a6356);
          padding: 8px 6px 0;
          border-radius: 12px;
        }
        .adm-activity-label strong {
          display: block;
          font-size: 1.375rem;
          color: var(--pf-ink, #122019);
          font-weight: 700;
          margin-bottom: 2px;
        }
        .adm-activity-label.is-highlighted {
          background: linear-gradient(180deg, var(--adm-gold-soft) 0%, rgba(255,255,255,.92) 100%);
          color: var(--bulacan-green-deep);
        }
        .adm-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .adm-bar-label {
          width: 84px;
          font-size: 1.375rem;
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
          font-size: 1.375rem;
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
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--pf-ink, #122019);
        }
        .adm-log-role {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 1.375rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          background: rgba(18,32,25,.07);
          color: var(--pf-ink-muted, #4a6356);
        }
        .adm-log-role.is-captain {
          background: linear-gradient(135deg, var(--adm-red-soft) 0%, var(--adm-gold-soft) 100%);
          color: var(--bulacan-red-deep);
        }
        .adm-log-action {
          font-size: 1.375rem;
          color: var(--pf-ink-muted, #4a6356);
          line-height: 1.5;
        }
        .adm-log-meta {
          display: flex;
          gap: 10px;
          margin-top: 5px;
        }
        .adm-log-meta span {
          font-size: 1.375rem;
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
          font-size: 1.375rem;
          color: var(--pf-ink-muted, #4a6356);
          font-weight: 600;
        }
        .adm-role-top strong {
          font-size: 1.375rem;
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
          background: linear-gradient(90deg, var(--bulacan-green) 0%, var(--bulacan-yellow) 100%);
        }
        .adm-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        .adm-cal-weekday {
          font-size: 1.375rem;
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
          font-size: 1.375rem;
          font-weight: 500;
          color: var(--pf-ink-muted, #4a6356);
          background: rgba(255,255,255,.7);
          border: 1px solid transparent;
        }
        .adm-cal-cell.has-deadline {
          background: linear-gradient(180deg, var(--adm-green-soft) 0%, rgba(255,255,255,.92) 100%);
          border-color: var(--adm-border-strong);
          color: var(--bulacan-green-deep);
          font-weight: 700;
        }
        .adm-cal-cell.has-deadline span {
          font-size: 1.375rem;
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
          font-size: 1.375rem;
          font-weight: 600;
          color: var(--pf-ink, #122019);
        }
        .adm-deadline-office {
          font-size: 1.375rem;
          color: var(--pf-ink-muted, #4a6356);
          margin-top: 1px;
        }
        .adm-deadline-date {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--bulacan-green-deep);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .adm-section-label {
          font-size: 1.375rem;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--pf-ink-muted, #4a6356);
          margin-bottom: 10px;
        }
        .adm-stat-kicker,
        .adm-stat-label,
        .adm-activity-copy p,
        .adm-activity-stat small,
        .adm-activity-stat strong,
        .adm-chart-grid-label,
        .adm-chart-caption,
        .adm-activity-label,
        .adm-activity-label strong,
        .adm-bar-label,
        .adm-bar-val,
        .adm-role-top span,
        .adm-role-top strong,
        .adm-cal-weekday,
        .adm-cal-cell,
        .adm-cal-cell.has-deadline span,
        .adm-deadline-name,
        .adm-deadline-office,
        .adm-deadline-date,
        .adm-section-label {
          font-size: 1rem;
        }
        .adm-activity-stat strong {
          font-size: 1.1rem;
        }
        .adm-chart-stage {
          grid-template-columns: 28px minmax(0, 1fr);
        }
        .adm-activity-labels {
          gap: 8px;
        }
        .adm-activity-label {
          padding: 8px 4px 0;
        }
        .adm-cal-grid {
          gap: 6px;
        }
        .adm-cal-cell {
          min-height: 3.1rem;
          aspect-ratio: auto;
        }
        .adm-deadline-row > :first-child {
          min-width: 0;
        }
        .adm-deadline-name,
        .adm-deadline-office {
          line-height: 1.35;
          word-break: break-word;
        }
        @media (max-width: 900px) {
          .adm-activity-stats {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="adm-root">
        <Card>
          <CardHead
            icon="pipeline"
            title="Coverage overview"
            sub="High-level platform status at a glance"
            right={<Chip green>Live snapshot</Chip>}
          />
          <Divider />
          <CardBody>
            <div className="adm-overview-grid">
              {statCards.map((card) => (
                <SummaryCard
                  key={card.label}
                  className="adm-overview-card"
                  detail={card.kicker}
                  label={card.label}
                  value={card.value}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="adm-main">
          <div className="adm-left">
            <Card>
              <CardHead
                icon="activity"
                title="Platform Activity"
                sub="Events across all modules - 7 days"
                right={<Chip green>7-Day View</Chip>}
              />
              <Divider />
              <CardBody>
                <div className="adm-activity-shell">
                  <div className="adm-activity-overview">
                    <div className="adm-activity-copy">
                      <div className="adm-section-label">Activity summary</div>
                      <p>Audit logs, applications, notifications, announcements, and backup events tracked across the latest seven days.</p>
                    </div>
                    <div className="adm-activity-stats">
                      <div className="adm-activity-stat">
                        <small>Total events</small>
                        <strong>{totalActivity}</strong>
                      </div>
                      <div className="adm-activity-stat">
                        <small>Daily average</small>
                        <strong>{averageActivity}</strong>
                      </div>
                      <div className="adm-activity-stat">
                        <small>Peak day</small>
                        <strong>{peakActivityPoint.value}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="adm-chart-stage">
                    <div className="adm-chart-grid-labels" aria-hidden="true">
                      {chartGuides.map((guide) => (
                        <span className="adm-chart-grid-label" key={guide.key}>
                          {guide.value}
                        </span>
                      ))}
                    </div>

                    <div className="adm-chart-frame">
                      <svg className="adm-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} aria-label="Platform activity chart">
                        <defs>
                          <linearGradient id="adminActivityFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#2d7a4b" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#f4c542" stopOpacity="0.06" />
                          </linearGradient>
                          <linearGradient id="adminActivityStroke" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#1f5a36" />
                            <stop offset="100%" stopColor="#c99612" />
                          </linearGradient>
                        </defs>

                        {chartGuides.map((guide, index) => {
                          const y = chartPadding + (chartHeight - chartPadding * 2) * guide.ratio;

                          return (
                            <line
                              key={guide.key}
                              className={`adm-chart-grid-line${index === chartGuides.length - 1 ? ' is-base' : ''}`}
                              x1={chartPadding}
                              x2={chartWidth - chartPadding}
                              y1={y}
                              y2={y}
                            />
                          );
                        })}

                        <path d={areaPath} fill="url(#adminActivityFill)" />
                        <path d={linePath} fill="none" stroke="rgba(45,122,75,.12)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={linePath} fill="none" stroke="url(#adminActivityStroke)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                        {chartPoints.map((point) => (
                          <g key={point.key}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="6"
                              fill="#eef8f1"
                              stroke="#ffffff"
                              strokeWidth="4"
                            />
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="4.4"
                              fill={point.key === peakActivityPoint.key ? '#f4c542' : '#2d7a4b'}
                              stroke="#dff4e5"
                              strokeWidth="1.5"
                            />
                          </g>
                        ))}
                      </svg>

                      <div className="adm-chart-caption">
                        <span>Peak activity on {peakActivityPoint.label}</span>
                        <span>{activityTrend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="adm-activity-labels">
                    {activitySeries.points.map((point) => (
                      <div
                        className={`adm-activity-label${point.key === peakActivityPoint.key ? ' is-highlighted' : ''}`}
                        key={point.key}
                      >
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
                    <span className={`adm-log-role${log.role === 'captain' ? ' is-captain' : ''}`}>{log.role}</span>
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


