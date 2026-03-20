import { EmptyState, StatusPill } from '../../../shared/components/ui';
import { getOfficeApplications, getOfficeNotifications, getOfficePrograms } from './helpers';

function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'Not set';
  const direct = new Date(value);
  const parsed = Number.isNaN(direct.getTime()) ? new Date(String(value).replace(' ', 'T')) : direct;
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', options).format(parsed);
}

function toTime(value) {
  if (!value) return 0;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();
  const fallback = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
}

function getAnchorDate(programs, applications) {
  const candidates = [
    ...programs.flatMap((program) => [program.deadline, program.applicationEndDate, program.applicationStartDate]),
    ...applications.map((application) => application.submittedAt),
  ]
    .map((value) => toTime(value))
    .filter(Boolean)
    .sort((left, right) => left - right);

  return candidates.length ? new Date(candidates[0]) : new Date();
}

function buildCalendar(anchorDate, programs, applications) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const previousMonthLastDay = new Date(year, month, 0).getDate();

  const deadlineMap = programs.reduce((summary, program) => {
    const timestamp = toTime(program.deadline || program.applicationEndDate);
    if (!timestamp) return summary;
    const date = new Date(timestamp);
    if (date.getFullYear() !== year || date.getMonth() !== month) return summary;
    const key = date.getDate();
    summary[key] = [...(summary[key] || []), program.title];
    return summary;
  }, {});

  const submissionMap = applications.reduce((summary, application) => {
    const timestamp = toTime(application.submittedAt);
    if (!timestamp) return summary;
    const date = new Date(timestamp);
    if (date.getFullYear() !== year || date.getMonth() !== month) return summary;
    const key = date.getDate();
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  const cells = [];
  const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7;

  for (let index = 0; index < totalCells; index += 1) {
    const calendarDay = index - startWeekday + 1;
    const inMonth = calendarDay > 0 && calendarDay <= totalDays;
    const displayDay = inMonth
      ? calendarDay
      : calendarDay <= 0
        ? previousMonthLastDay + calendarDay
        : calendarDay - totalDays;

    cells.push({
      key: `${year}-${month}-${index}`,
      day: displayDay,
      inMonth,
      deadlines: inMonth ? deadlineMap[calendarDay] || [] : [],
      submissions: inMonth ? submissionMap[calendarDay] || 0 : 0,
    });
  }

  return {
    monthLabel: new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(firstDay),
    cells,
  };
}

function Metric({ label, value, detail }) {
  return (
    <article className="personnel-dashboard-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function QueueRow({ label, value, maxValue, tone = 'green' }) {
  const width = Math.max(10, Math.round((value / Math.max(maxValue, 1)) * 100));

  return (
    <div className="personnel-dashboard-bar-row">
      <strong>{label}</strong>
      <div className="personnel-dashboard-bar-track">
        <span className={`personnel-dashboard-bar-fill tone-${tone}`} style={{ width: `${width}%` }} />
      </div>
      <span>{value}</span>
    </div>
  );
}

function ActivityItem({ title, meta, status, value }) {
  return (
    <article className="personnel-dashboard-item">
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
      </div>
      <div className="personnel-dashboard-item-side">
        {status ? <StatusPill status={status} /> : null}
        {value ? <span>{value}</span> : null}
      </div>
    </article>
  );
}

export default function DashboardScreen({ session, data }) {
  const programs = getOfficePrograms(data, session).map((program) => ({
    ...program,
    displayStatus: program.archived ? 'Archived' : program.status || 'Open',
  }));
  const applications = getOfficeApplications(data, session);
  const notifications = [...getOfficeNotifications(data, session)].sort((left, right) => toTime(right.time) - toTime(left.time));

  const openPrograms = programs.filter((program) => program.displayStatus === 'Open').length;
  const reviewQueue = applications.filter((item) => ['Submitted', 'For Review', 'Incomplete'].includes(item.status)).length;
  const approvedCount = applications.filter((item) => item.status === 'Approved').length;
  const forReviewCount = applications.filter((item) => item.status === 'For Review').length;
  const recentApplications = [...applications].sort((left, right) => toTime(right.submittedAt) - toTime(left.submittedAt)).slice(0, 5);
  const upcomingDeadlines = [...programs]
    .filter((program) => program.deadline || program.applicationEndDate)
    .sort((left, right) => toTime(left.deadline || left.applicationEndDate) - toTime(right.deadline || right.applicationEndDate))
    .slice(0, 5);
  const spotlightPrograms = [...programs]
    .sort((left, right) => {
      const leftApps = applications.filter((application) => application.programId === left.id).length;
      const rightApps = applications.filter((application) => application.programId === right.id).length;
      return rightApps - leftApps || left.title.localeCompare(right.title);
    })
    .slice(0, 4);

  const queueItems = [
    { label: 'Submitted', value: applications.filter((item) => item.status === 'Submitted').length, tone: 'green' },
    { label: 'For Review', value: forReviewCount, tone: 'amber' },
    { label: 'Incomplete', value: applications.filter((item) => item.status === 'Incomplete').length, tone: 'amber' },
    { label: 'Approved', value: approvedCount, tone: 'green' },
    { label: 'Rejected', value: applications.filter((item) => item.status === 'Rejected').length, tone: 'rose' },
  ];
  const maxQueue = Math.max(...queueItems.map((item) => item.value), 1);

  const anchorDate = getAnchorDate(programs, applications);
  const calendar = buildCalendar(anchorDate, programs, applications);

  return (
    <>
      <style>{`
        .personnel-dashboard-shell,.personnel-dashboard-top,.personnel-dashboard-metrics,.personnel-dashboard-main,.personnel-dashboard-column,.personnel-dashboard-calendar-layout,.personnel-dashboard-calendar-grid,.personnel-dashboard-list,.personnel-dashboard-bar-stack{display:grid;gap:1rem}
        .personnel-dashboard-shell{color:var(--pf-ink,#122019)}
        .personnel-dashboard-top,.personnel-dashboard-panel,.personnel-dashboard-metric,.personnel-dashboard-calendar-cell,.personnel-dashboard-item,.personnel-dashboard-note{border:1px solid rgba(24,111,67,.08);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%);box-shadow:0 12px 28px rgba(18,32,25,.05)}
        .personnel-dashboard-top{padding:1.2rem;background:radial-gradient(circle at top right,rgba(143,225,185,.2),transparent 30%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(240,245,239,.95) 100%)}
        .personnel-dashboard-topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap}
        .personnel-dashboard-kicker,.personnel-dashboard-note small,.personnel-dashboard-metric small,.personnel-dashboard-calendar-labels span{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .personnel-dashboard-kicker{color:var(--pf-accent-dark,#1e7d4d)}
        .personnel-dashboard-topbar strong,.personnel-dashboard-metric strong,.personnel-dashboard-note strong{font-family:var(--pf-font-display,'Syne','Trebuchet MS',sans-serif)}
        .personnel-dashboard-topbar strong{display:block;margin-top:.2rem;font-size:1.75rem;line-height:1}
        .personnel-dashboard-topbar p,.personnel-dashboard-metric span,.personnel-dashboard-item p,.personnel-dashboard-note p{color:var(--pf-ink-muted,#4a6356);margin:0;line-height:1.55}
        .personnel-dashboard-note{padding:1rem 1.05rem;background:rgba(30,125,77,.06);min-width:15rem}
        .personnel-dashboard-note strong{display:block;margin:.2rem 0 .3rem;font-size:1.1rem}
        .personnel-dashboard-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}
        .personnel-dashboard-metric{padding:1rem 1.05rem;background:radial-gradient(circle at top right,rgba(143,225,185,.18),transparent 36%),linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(232,239,231,.94) 100%)}
        .personnel-dashboard-metric strong{display:block;margin:.18rem 0 .25rem;font-size:1.7rem;line-height:1}
        .personnel-dashboard-panel{padding:1rem 1.05rem}
        .personnel-dashboard-main{grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr)}
        .personnel-dashboard-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem}
        .personnel-dashboard-panel-head h3{margin:.18rem 0 0;font-size:1.05rem}
        .personnel-dashboard-panel-head p{margin:.28rem 0 0;color:var(--pf-ink-muted,#4a6356);line-height:1.55}
        .personnel-dashboard-calendar-layout{grid-template-columns:minmax(0,1.2fr) minmax(220px,.8fr);align-items:start}
        .personnel-dashboard-calendar-labels,.personnel-dashboard-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.5rem}
        .personnel-dashboard-calendar-labels span{color:var(--pf-ink-muted,#4a6356);text-align:center}
        .personnel-dashboard-calendar-cell{padding:.65rem;min-height:4.7rem;background:rgba(255,255,255,.84)}
        .personnel-dashboard-calendar-cell.is-muted{opacity:.45}
        .personnel-dashboard-calendar-cell.has-deadline{border-color:rgba(24,111,67,.18);box-shadow:0 10px 22px rgba(30,125,77,.08)}
        .personnel-dashboard-calendar-day{display:flex;justify-content:space-between;align-items:center;font-weight:800}
        .personnel-dashboard-calendar-badge{display:inline-flex;align-items:center;justify-content:center;min-width:1.45rem;height:1.45rem;padding:0 .35rem;border-radius:999px;background:rgba(30,125,77,.12);color:var(--pf-accent-dark,#1e7d4d);font-size:.7rem;font-weight:800}
        .personnel-dashboard-calendar-meta{display:grid;gap:.22rem;margin-top:.42rem;font-size:.75rem;color:var(--pf-ink-muted,#4a6356)}
        .personnel-dashboard-calendar-dot{display:inline-flex;width:.4rem;height:.4rem;border-radius:50%;background:var(--pf-accent,#2e8b57);margin-right:.3rem}
        .personnel-dashboard-list{gap:.8rem}
        .personnel-dashboard-item{padding:.92rem 1rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
        .personnel-dashboard-item strong{display:block;margin-bottom:.22rem}
        .personnel-dashboard-item-side{display:grid;justify-items:end;gap:.45rem}
        .personnel-dashboard-item-side span{font-weight:800;color:var(--pf-ink,#122019)}
        .personnel-dashboard-bar-stack{gap:.5rem}
        .personnel-dashboard-bar-row{display:grid;grid-template-columns:minmax(110px,.45fr) minmax(0,1fr) auto;align-items:center;gap:.9rem}
        .personnel-dashboard-bar-track{height:10px;border-radius:999px;background:rgba(18,32,25,.08);overflow:hidden}
        .personnel-dashboard-bar-fill{display:block;height:100%;border-radius:999px}
        .tone-green{background:linear-gradient(90deg,rgba(30,125,77,.5) 0%,rgba(30,125,77,.95) 100%)}
        .tone-amber{background:linear-gradient(90deg,rgba(229,163,60,.5) 0%,rgba(229,163,60,.95) 100%)}
        .tone-rose{background:linear-gradient(90deg,rgba(195,86,75,.45) 0%,rgba(195,86,75,.92) 100%)}
        .status-pill{display:inline-flex;align-items:center;justify-content:center;padding:.38rem .72rem;border-radius:999px;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:rgba(18,32,25,.08);color:var(--pf-ink-soft,#2d4e3e)}
        .status-pill.tone-success{background:rgba(46,139,87,.14);color:#256144}
        .status-pill.tone-warning{background:rgba(229,163,60,.16);color:#9c6916}
        .status-pill.tone-danger{background:rgba(195,86,75,.14);color:#9f3f35}
        @media (max-width:1180px){.personnel-dashboard-metrics,.personnel-dashboard-main,.personnel-dashboard-calendar-layout{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:820px){.personnel-dashboard-metrics,.personnel-dashboard-main,.personnel-dashboard-calendar-layout,.personnel-dashboard-calendar-labels,.personnel-dashboard-calendar-grid,.personnel-dashboard-bar-row{grid-template-columns:1fr}.personnel-dashboard-item{flex-direction:column}.personnel-dashboard-item-side{justify-items:start}}
      `}</style>

      <div className="personnel-dashboard-shell">
        <div className="personnel-dashboard-top">
          <div className="personnel-dashboard-topbar">
            <div>
              <span className="personnel-dashboard-kicker">Office Workspace</span>
              <strong>Dashboard</strong>
              <p>{session.office} | {session.municipality}</p>
            </div>
            <div className="personnel-dashboard-note">
              <small>Focus Date</small>
              <strong>{formatDate(anchorDate, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              <p>{reviewQueue} applications still need review or follow-up.</p>
            </div>
          </div>

          <div className="personnel-dashboard-metrics">
            <Metric label="Programs" value={programs.length} detail={`${openPrograms} open now`} />
            <Metric label="Applications" value={applications.length} detail={`${forReviewCount} for review`} />
            <Metric label="Approved" value={approvedCount} detail="Completed decisions" />
            <Metric label="Alerts" value={notifications.length} detail="Unread office notices" />
          </div>
        </div>

        <div className="personnel-dashboard-main">
          <div className="personnel-dashboard-column">
            <div className="personnel-dashboard-panel">
              <div className="personnel-dashboard-panel-head">
                <div>
                  <span className="personnel-dashboard-kicker">Calendar</span>
                  <h3>{calendar.monthLabel}</h3>
                  <p>Deadlines and submission days for this office.</p>
                </div>
              </div>

              <div className="personnel-dashboard-calendar-layout">
                <div>
                  <div className="personnel-dashboard-calendar-labels">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="personnel-dashboard-calendar-grid">
                    {calendar.cells.map((cell) => (
                      <article
                        className={`personnel-dashboard-calendar-cell ${cell.inMonth ? '' : 'is-muted'} ${cell.deadlines.length ? 'has-deadline' : ''}`}
                        key={cell.key}
                      >
                        <div className="personnel-dashboard-calendar-day">
                          <span>{cell.day}</span>
                          {cell.deadlines.length ? <span className="personnel-dashboard-calendar-badge">{cell.deadlines.length}</span> : null}
                        </div>
                        <div className="personnel-dashboard-calendar-meta">
                          {cell.deadlines.length ? <span><span className="personnel-dashboard-calendar-dot" />Deadline</span> : null}
                          {cell.submissions ? <span>{cell.submissions} submission{cell.submissions > 1 ? 's' : ''}</span> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="personnel-dashboard-list">
                  {upcomingDeadlines.length ? (
                    upcomingDeadlines.map((program) => (
                      <ActivityItem
                        key={program.id}
                        meta={program.programType || 'Unspecified'}
                        status={program.displayStatus}
                        title={program.title}
                        value={formatDate(program.deadline || program.applicationEndDate)}
                      />
                    ))
                  ) : (
                    <EmptyState title="No upcoming deadlines" text="Program deadlines will appear here." />
                  )}
                </div>
              </div>
            </div>

            <div className="personnel-dashboard-panel">
              <div className="personnel-dashboard-panel-head">
                <div>
                  <span className="personnel-dashboard-kicker">Recent</span>
                  <h3>Latest Submissions</h3>
                  <p>Newest applicant activity routed to your office.</p>
                </div>
              </div>

              {recentApplications.length ? (
                <div className="personnel-dashboard-list">
                  {recentApplications.map((application) => (
                    <ActivityItem
                      key={application.id}
                      meta={`${formatDate(application.submittedAt)} | ${application.documents.length} files`}
                      status={application.status}
                      title={application.applicantName}
                      value={application.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No submissions yet" text="New applicant records will appear here." />
              )}
            </div>
          </div>

          <div className="personnel-dashboard-column">
            <div className="personnel-dashboard-panel">
              <div className="personnel-dashboard-panel-head">
                <div>
                  <span className="personnel-dashboard-kicker">Queue</span>
                  <h3>Application Status</h3>
                  <p>Current office pipeline.</p>
                </div>
              </div>
              <div className="personnel-dashboard-bar-stack">
                {queueItems.map((item) => (
                  <QueueRow key={item.label} label={item.label} maxValue={maxQueue} tone={item.tone} value={item.value} />
                ))}
              </div>
            </div>

            <div className="personnel-dashboard-panel">
              <div className="personnel-dashboard-panel-head">
                <div>
                  <span className="personnel-dashboard-kicker">Programs</span>
                  <h3>Top Listings</h3>
                  <p>Most active programs in this office.</p>
                </div>
              </div>

              {spotlightPrograms.length ? (
                <div className="personnel-dashboard-list">
                  {spotlightPrograms.map((program) => {
                    const volume = applications.filter((application) => application.programId === program.id).length;
                    return (
                      <ActivityItem
                        key={program.id}
                        meta={`${program.category} | ${program.programType || 'Unspecified'}`}
                        status={program.displayStatus}
                        title={program.title}
                        value={`${volume} apps`}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No programs yet" text="Program listings will appear here." />
              )}
            </div>

            <div className="personnel-dashboard-panel">
              <div className="personnel-dashboard-panel-head">
                <div>
                  <span className="personnel-dashboard-kicker">Alerts</span>
                  <h3>Office Notifications</h3>
                  <p>Latest messages for your account.</p>
                </div>
              </div>

              {notifications.length ? (
                <div className="personnel-dashboard-list">
                  {notifications.slice(0, 4).map((notification) => (
                    <ActivityItem
                      key={notification.id}
                      meta={`${formatDate(notification.time)} | ${notification.message}`}
                      status={notification.unread ? 'Unread' : 'Read'}
                      title={notification.title}
                      value={notification.role}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No notifications" text="Office alerts will appear here." />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
