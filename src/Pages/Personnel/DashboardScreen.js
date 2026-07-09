import { useEffect, useMemo, useState } from 'react';
import { EmptyState, StatusPill } from 'Components/UI';
import { getOfficeApplications, getOfficeNotifications, getOfficePrograms } from 'Services/Personnel/personnel-utils';

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
    .sort((a, b) => a - b);

  return candidates.length ? new Date(candidates[0]) : new Date();
}

function buildCalendar(anchorDate, programs, applications) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7;

  const deadlineDays = programs.reduce((days, program) => {
    const time = toTime(program.deadline || program.applicationEndDate);
    if (!time) return days;
    const date = new Date(time);
    if (date.getFullYear() === year && date.getMonth() === month) {
      days[date.getDate()] = (days[date.getDate()] || 0) + 1;
    }
    return days;
  }, {});

  const submissionDays = applications.reduce((days, application) => {
    const time = toTime(application.submittedAt);
    if (!time) return days;
    const date = new Date(time);
    if (date.getFullYear() === year && date.getMonth() === month) {
      days[date.getDate()] = (days[date.getDate()] || 0) + 1;
    }
    return days;
  }, {});

  return {
    monthLabel: new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(firstDay),
    cells: Array.from({ length: totalCells }, (_, index) => {
      const day = index - startWeekday + 1;
      const inMonth = day > 0 && day <= totalDays;
      return {
        key: `${year}-${month}-${index}`,
        day: inMonth ? day : '',
        deadlines: inMonth ? deadlineDays[day] || 0 : 0,
        submissions: inMonth ? submissionDays[day] || 0 : 0,
      };
    }),
  };
}

function StatCard({ label, value, detail }) {
  return (
    <article className="pd-stat">
      <span className="pd-stat-label">{label}</span>
      <strong className="pd-stat-value">{value}</strong>
      <small className="pd-stat-detail">{detail}</small>
    </article>
  );
}

function Panel({ eyebrow, title, subtitle, action, children }) {
  return (
    <section className="pd-panel">
      <div className="pd-panel-top">
        <div>
          <span className="pd-eyebrow">{eyebrow}</span>
          <h2 className="pd-panel-title">{title}</h2>
          {subtitle ? <p className="pd-panel-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="pd-panel-action">{action}</div> : null}
      </div>
      <div className="pd-panel-body">{children}</div>
    </section>
  );
}

export default function DashboardScreen({ session, data }) {
  const programs = useMemo(
    () =>
      getOfficePrograms(data, session).map((program) => ({
        ...program,
        displayStatus: program.archived ? 'Archived' : program.status || 'Open',
      })),
    [data, session]
  );
  const applications = useMemo(() => getOfficeApplications(data, session), [data, session]);
  const rawNotifications = useMemo(() => getOfficeNotifications(data, session), [data, session]);

  const [activeQueue, setActiveQueue] = useState(null);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);

  useEffect(() => {
    setDismissedNotificationIds((current) =>
      current.filter((id) => rawNotifications.some((notification) => notification.id === id))
    );
  }, [rawNotifications]);

  const notifications = [...rawNotifications]
    .filter((notification) => !dismissedNotificationIds.includes(notification.id))
    .sort((a, b) => toTime(b.time) - toTime(a.time));

  const openPrograms = programs.filter((program) => program.displayStatus === 'Open').length;
  const forReviewCount = applications.filter((application) => application.status === 'For Review').length;
  const reviewQueue = applications.filter((application) =>
    ['Submitted', 'For Review', 'Incomplete'].includes(application.status)
  ).length;
  const approvedCount = applications.filter((application) => application.status === 'Approved').length;
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const recentApplications = [...applications]
    .sort((a, b) => toTime(b.submittedAt) - toTime(a.submittedAt))
    .slice(0, 6);
  const filteredApplications = activeQueue
    ? recentApplications.filter((application) => application.status === activeQueue)
    : recentApplications;

  const upcomingDeadlines = [...programs]
    .filter((program) => program.deadline || program.applicationEndDate)
    .sort((a, b) => toTime(a.deadline || a.applicationEndDate) - toTime(b.deadline || b.applicationEndDate))
    .slice(0, 5);

  const spotlightPrograms = [...programs]
    .sort((a, b) => {
      const aApplications = applications.filter((application) => application.programId === a.id).length;
      const bApplications = applications.filter((application) => application.programId === b.id).length;
      return bApplications - aApplications || a.title.localeCompare(b.title);
    })
    .slice(0, 4);

  const queueItems = [
    { label: 'Submitted', value: applications.filter((application) => application.status === 'Submitted').length },
    { label: 'For Review', value: forReviewCount },
    { label: 'Incomplete', value: applications.filter((application) => application.status === 'Incomplete').length },
    { label: 'Approved', value: approvedCount },
    { label: 'Rejected', value: applications.filter((application) => application.status === 'Rejected').length },
  ];

  const anchorDate = getAnchorDate(programs, applications);
  const calendar = buildCalendar(anchorDate, programs, applications);

  return (
    <>
      <style>{`
        .pd-shell {
          display: grid;
          gap: 14px;
          padding: 20px clamp(12px, 1.5vw, 24px) 40px 0;
          box-sizing: border-box;
          font-family: var(--pf-font-body, system-ui, sans-serif);
          color: #1a3356;
        }
        .pd-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .pd-stat {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: grid;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
        }
        .pd-stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .07em;
          color: #7a8fa6;
        }
        .pd-stat-value {
          font-size: 1.75rem;
          line-height: 1;
          font-weight: 700;
          color: #0f2f63;
        }
        .pd-stat-detail {
          font-size: 0.76rem;
          color: #7a8fa6;
        }
        .pd-toolbar {
          background: #ffffff;
          border: 1px solid #d7dde8;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(15,47,99,.04);
          flex-wrap: wrap;
        }
        .pd-toolbar-copy {
          display: grid;
          gap: 3px;
        }
        .pd-toolbar-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f2f63;
        }
        .pd-toolbar-subtitle {
          margin: 0;
          font-size: .84rem;
          color: #4a5e7a;
        }
        .pd-toolbar-meta {
          border: 1px solid #d7dde8;
          background: #f8fafd;
          color: #1a3356;
          padding: 8px 12px;
          font-size: .84rem;
          font-weight: 700;
        }
        .pd-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, .75fr);
          gap: 14px;
          align-items: start;
        }
        .pd-stack {
          display: grid;
          gap: 14px;
        }
        .pd-panel {
          background: #ffffff;
          border: 1px solid #d7dde8;
          box-shadow: 0 1px 4px rgba(15,47,99,.05);
          overflow: hidden;
        }
        .pd-panel-top {
          padding: 16px 20px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pd-eyebrow {
          display: block;
          font-size: .67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
          margin-bottom: 3px;
        }
        .pd-panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f2f63;
          line-height: 1.2;
        }
        .pd-panel-subtitle {
          margin: 4px 0 0;
          font-size: .84rem;
          color: #4a5e7a;
        }
        .pd-panel-body {
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .pd-clear-btn {
          border: 1px solid #c8d8f5;
          background: #ffffff;
          color: #2a4e8c;
          min-height: 32px;
          padding: 0 12px;
          font: inherit;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .pd-table {
          border: 1px solid #d7dde8;
          overflow: hidden;
        }
        .pd-table-head,
        .pd-table-row {
          display: grid;
          gap: 12px;
          align-items: center;
        }
        .pd-submission-table .pd-table-head,
        .pd-submission-table .pd-table-row {
          grid-template-columns: minmax(160px, 1.1fr) minmax(190px, 1fr) minmax(120px, .7fr) minmax(120px, .7fr) minmax(110px, .55fr);
        }
        .pd-program-table .pd-table-head,
        .pd-program-table .pd-table-row {
          grid-template-columns: minmax(180px, 1.2fr) minmax(140px, .8fr) minmax(120px, .7fr) minmax(120px, .6fr);
        }
        .pd-table-head {
          padding: 10px 16px;
          background: #f8fafd;
          border-bottom: 1px solid #e8ecf2;
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #7a8fa6;
        }
        .pd-table-row {
          padding: 12px 16px;
          border-bottom: 1px solid #e8ecf2;
          background: #ffffff;
        }
        .pd-table-row:last-child {
          border-bottom: 0;
        }
        .pd-cell {
          min-width: 0;
          display: grid;
          gap: 3px;
        }
        .pd-cell strong {
          font-size: .88rem;
          font-weight: 700;
          color: #1a3356;
          line-height: 1.3;
        }
        .pd-cell small {
          margin: 0;
          font-size: .76rem;
          color: #6d8198;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pd-queue-list {
          display: grid;
          gap: 8px;
        }
        .pd-queue-row {
          width: 100%;
          border: 1px solid #d7dde8;
          background: #ffffff;
          padding: 10px 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }
        .pd-queue-row.is-active {
          border-color: #2a4e8c;
          background: #eef4ff;
        }
        .pd-queue-label {
          font-size: .86rem;
          font-weight: 700;
          color: #1a3356;
        }
        .pd-queue-count {
          font-size: .9rem;
          font-weight: 800;
          color: #0f2f63;
        }
        .pd-calendar {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          border: 1px solid #d7dde8;
          border-bottom: 0;
          border-right: 0;
        }
        .pd-calendar-weekday,
        .pd-calendar-day {
          min-height: 34px;
          border-right: 1px solid #d7dde8;
          border-bottom: 1px solid #d7dde8;
          display: grid;
          place-items: center;
          font-size: .78rem;
          color: #4a5e7a;
          position: relative;
        }
        .pd-calendar-weekday {
          background: #f8fafd;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .07em;
          color: #7a8fa6;
        }
        .pd-calendar-day.has-event {
          background: #eef4ff;
          color: #0f2f63;
          font-weight: 700;
        }
        .pd-calendar-mark {
          position: absolute;
          right: 5px;
          bottom: 4px;
          width: 6px;
          height: 6px;
          background: #2a4e8c;
        }
        .pd-list {
          display: grid;
          gap: 8px;
        }
        .pd-list-row {
          border: 1px solid #d7dde8;
          background: #ffffff;
          padding: 10px 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }
        .pd-list-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }
        .pd-list-copy strong {
          color: #1a3356;
          font-size: .88rem;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pd-list-copy small {
          color: #6d8198;
          font-size: .76rem;
          line-height: 1.4;
        }
        .pd-list-side {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .pd-dismiss-btn {
          border: 1px solid #d7dde8;
          background: #ffffff;
          color: #4a5e7a;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
        }
        @media (max-width: 1180px) {
          .pd-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pd-grid {
            grid-template-columns: 1fr;
          }
          .pd-table-head {
            display: none;
          }
          .pd-submission-table .pd-table-row,
          .pd-program-table .pd-table-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .pd-stats,
          .pd-submission-table .pd-table-row,
          .pd-program-table .pd-table-row {
            grid-template-columns: 1fr;
          }
          .pd-list-row {
            grid-template-columns: 1fr;
          }
          .pd-list-side {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="pd-shell">
        <section className="pd-stats">
          <StatCard label="Programs" value={programs.length} detail={`${openPrograms} open`} />
          <StatCard label="Applications" value={applications.length} detail={`${forReviewCount} for review`} />
          <StatCard label="Approved" value={approvedCount} detail="Completed applications" />
          <StatCard label="Unread alerts" value={unreadCount} detail="Office notifications" />
        </section>

        <section className="pd-toolbar">
          <div className="pd-toolbar-copy">
            <h1 className="pd-toolbar-title">Personnel dashboard</h1>
            <p className="pd-toolbar-subtitle">{session.office || 'Office workspace'} · {session.municipality || 'Municipality scope'}</p>
          </div>
          <div className="pd-toolbar-meta">
            Focus date: {formatDate(anchorDate, { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </section>

        <div className="pd-grid">
          <div className="pd-stack">
            <Panel
              eyebrow="Recent records"
              title="Latest submissions"
              subtitle="Newest applicant activity routed to your office."
              action={activeQueue ? <button className="pd-clear-btn" onClick={() => setActiveQueue(null)} type="button">Clear filter</button> : null}
            >
              {filteredApplications.length ? (
                <div className="pd-table pd-submission-table">
                  <div className="pd-table-head">
                    <span>Applicant</span>
                    <span>Submitted</span>
                    <span>Documents</span>
                    <span>Status</span>
                    <span>Record</span>
                  </div>
                  <div>
                    {filteredApplications.map((application) => (
                      <article className="pd-table-row" key={application.id}>
                        <div className="pd-cell">
                          <strong>{application.applicantName}</strong>
                          <small>Applicant record</small>
                        </div>
                        <div className="pd-cell">
                          <strong>{formatDate(application.submittedAt)}</strong>
                          <small>Submission date</small>
                        </div>
                        <div className="pd-cell">
                          <strong>{application.documents?.length || 0}</strong>
                          <small>Uploaded files</small>
                        </div>
                        <div>
                          <StatusPill status={application.status} />
                        </div>
                        <div className="pd-cell">
                          <strong>{application.id}</strong>
                          <small>Application ID</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title={activeQueue ? `No ${activeQueue.toLowerCase()} submissions` : 'No submissions yet'}
                  text={activeQueue ? 'Clear the filter to show the latest submissions.' : 'New applicant records will appear here.'}
                />
              )}
            </Panel>

            <Panel eyebrow="Programs" title="Top listings" subtitle="Most active programs by application volume.">
              {spotlightPrograms.length ? (
                <div className="pd-table pd-program-table">
                  <div className="pd-table-head">
                    <span>Program</span>
                    <span>Category</span>
                    <span>Applicants</span>
                    <span>Status</span>
                  </div>
                  <div>
                    {spotlightPrograms.map((program) => {
                      const volume = applications.filter((application) => application.programId === program.id).length;
                      return (
                        <article className="pd-table-row" key={program.id}>
                          <div className="pd-cell">
                            <strong>{program.title}</strong>
                            <small>{program.programType || 'Government assistance program'}</small>
                          </div>
                          <div className="pd-cell">
                            <strong>{program.category || 'Uncategorized'}</strong>
                            <small>{program.sector || 'No sector set'}</small>
                          </div>
                          <div className="pd-cell">
                            <strong>{volume}</strong>
                            <small>Applications</small>
                          </div>
                          <div>
                            <StatusPill status={program.displayStatus} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState title="No programs yet" text="Program listings will appear here." />
              )}
            </Panel>
          </div>

          <div className="pd-stack">
            <Panel eyebrow="Pipeline" title="Application queue" subtitle={`${reviewQueue} applications need review or follow-up.`}>
              <div className="pd-queue-list">
                {queueItems.map((item) => (
                  <button
                    className={`pd-queue-row ${activeQueue === item.label ? 'is-active' : ''}`}
                    key={item.label}
                    onClick={() => setActiveQueue(activeQueue === item.label ? null : item.label)}
                    type="button"
                  >
                    <span className="pd-queue-label">{item.label}</span>
                    <span className="pd-queue-count">{item.value}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Calendar" title={calendar.monthLabel} subtitle="Deadlines and submissions for the focus month.">
              <div className="pd-calendar">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div className="pd-calendar-weekday" key={day}>{day}</div>
                ))}
                {calendar.cells.map((cell) => (
                  <div className={`pd-calendar-day ${cell.deadlines || cell.submissions ? 'has-event' : ''}`} key={cell.key}>
                    {cell.day}
                    {cell.deadlines || cell.submissions ? <span className="pd-calendar-mark" /> : null}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Deadlines" title="Upcoming deadlines" subtitle="Programs with the nearest closing dates.">
              {upcomingDeadlines.length ? (
                <div className="pd-list">
                  {upcomingDeadlines.map((program) => (
                    <article className="pd-list-row" key={program.id}>
                      <div className="pd-list-copy">
                        <strong>{program.title}</strong>
                        <small>{program.programType || 'Program'} · {program.category || 'Uncategorized'}</small>
                      </div>
                      <div className="pd-list-side">
                        <span>{formatDate(program.deadline || program.applicationEndDate)}</span>
                        <StatusPill status={program.displayStatus} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No upcoming deadlines" text="Program deadlines will appear here." />
              )}
            </Panel>

            <Panel eyebrow="Alerts" title="Office notifications" subtitle={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}.`}>
              {notifications.length ? (
                <div className="pd-list">
                  {notifications.slice(0, 5).map((notification) => (
                    <article className="pd-list-row" key={notification.id}>
                      <div className="pd-list-copy">
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                      </div>
                      <div className="pd-list-side">
                        <StatusPill status={notification.unread ? 'Unread' : 'Read'} />
                        <button
                          aria-label="Dismiss notification"
                          className="pd-dismiss-btn"
                          onClick={() => setDismissedNotificationIds((current) => [...current, notification.id])}
                          type="button"
                        >
                          x
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No notifications" text="Office alerts will appear here." />
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
