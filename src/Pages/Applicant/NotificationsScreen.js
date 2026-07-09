import { getApplicantNotifications } from 'Services/Applicant/applicant-utils';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  ink: '#1a2637',
  muted: '#5a7090',
  subtle: '#8da3ba',
  border: '#dce4f0',
  borderLight: '#edf1f8',
  surface: '#ffffff',
  bg: '#f4f7fc',
  primary: '#1a3f76',
  primaryLight: '#e8eef9',
};

/* ─── Tone config ───────────────────────────────────────────────────────── */
function getToneMeta(tone) {
  const t = String(tone || '').toLowerCase();
  if (t === 'success' || t === 'approved')
    return { bg: '#d4f5e5', color: '#15724a', border: '#b2e8cf', iconBg: '#c2f0d8', label: 'Approved' };
  if (t === 'warning' || t === 'incomplete')
    return { bg: '#fff7e0', color: '#8a6200', border: '#f5dfa0', iconBg: '#ffeeb3', label: 'Action Required' };
  if (t === 'danger' || t === 'rejected' || t === 'error')
    return { bg: '#fde9e8', color: '#9b3533', border: '#f5c7c5', iconBg: '#fcd5d4', label: 'Rejected' };
  if (t === 'review' || t === 'for_review')
    return { bg: '#fff7e0', color: '#8a6200', border: '#f5dfa0', iconBg: '#ffeeb3', label: 'Under Review' };
  /* default info */
  return { bg: '#e6eeff', color: '#2046a3', border: '#c5d4f8', iconBg: '#d5e3ff', label: 'Info' };
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  switch (name) {
    case 'bell':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'alert-triangle':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'x-circle':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'info':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'check-all':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    default:
      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>;
  }
}

function getToneIcon(tone) {
  const t = String(tone || '').toLowerCase();
  if (t === 'success' || t === 'approved') return 'check-circle';
  if (t === 'warning' || t === 'incomplete' || t === 'review' || t === 'for_review') return 'alert-triangle';
  if (t === 'danger' || t === 'rejected' || t === 'error') return 'x-circle';
  return 'info';
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function NotificationsScreen({ session, data, actions }) {
  const notifications = getApplicantNotifications(data, session);
  const unreadCount = notifications.filter((n) => n.unread || n.isRead === false).length;

  return (
    <>
      <style>{`
        /* ── Root ─────────────────────────────────────────────────── */
        .nf {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 6px 0 32px;
          color: ${T.ink};
          font-family: var(--pf-font-body, system-ui, sans-serif);
        }

        /* ── Page header ──────────────────────────────────────────── */
        .nf-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .nf-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nf-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${T.subtle};
        }
        .nf-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nf-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: ${T.ink};
          letter-spacing: -0.02em;
        }
        .nf-unread-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          background: ${T.primary};
          color: #fff;
          font-size: 11.5px;
          font-weight: 700;
        }
        .nf-subtitle {
          margin: 0;
          font-size: 14px;
          color: ${T.muted};
          line-height: 1.5;
          max-width: 480px;
        }
        .nf-mark-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 16px;
          border-radius: 9px;
          border: 1px solid ${T.border};
          background: ${T.surface};
          color: ${T.ink};
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
          align-self: flex-start;
        }
        .nf-mark-btn:hover { background: ${T.bg}; border-color: #c0cedf; }
        .nf-mark-btn:disabled {
          opacity: 0.45;
          cursor: default;
        }

        /* ── List ─────────────────────────────────────────────────── */
        .nf-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        /* ── Notification card ────────────────────────────────────── */
        .nf-card {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 16px 18px;
          border-radius: 13px;
          border: 1px solid ${T.border};
          background: ${T.surface};
          box-shadow: 0 1px 4px rgba(26,38,55,0.04);
          transition: box-shadow 0.15s, border-color 0.15s;
          position: relative;
        }
        .nf-card:hover {
          box-shadow: 0 3px 12px rgba(26,38,55,0.08);
          border-color: #c8d5e8;
        }
        .nf-card.is-unread {
          border-left: 3px solid ${T.primary};
          background: #fafcff;
        }

        /* Unread indicator dot */
        .nf-card.is-unread::before {
          content: '';
          position: absolute;
          top: 18px;
          right: 18px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${T.primary};
        }

        .nf-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .nf-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nf-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .nf-card-title {
          font-size: 14.5px;
          font-weight: 700;
          color: ${T.ink};
          line-height: 1.3;
        }
        .nf-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid;
          flex-shrink: 0;
        }
        .nf-message {
          font-size: 13.5px;
          color: ${T.muted};
          line-height: 1.6;
          margin: 0;
        }
        .nf-time {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: ${T.subtle};
          margin-top: 2px;
        }

        /* ── Empty state ──────────────────────────────────────────── */
        .nf-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 32px;
          border-radius: 16px;
          border: 1.5px dashed ${T.border};
          background: ${T.bg};
          text-align: center;
          color: ${T.subtle};
        }
        .nf-empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${T.borderLight};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${T.subtle};
        }
        .nf-empty strong {
          font-size: 16px;
          color: ${T.muted};
          font-weight: 600;
        }
        .nf-empty p {
          margin: 0;
          font-size: 13.5px;
          max-width: 320px;
          line-height: 1.55;
        }

        @media (max-width: 600px) {
          .nf-header { flex-direction: column; }
          .nf-mark-btn { align-self: stretch; justify-content: center; }
          .nf-title { font-size: 20px; }
        }
      `}</style>

      <div className="nf">

        {/* ── Page header ──────────────────────────────────────────── */}
        <div className="nf-header">
          <div className="nf-header-left">
            <span className="nf-eyebrow">Alerts</span>
            <div className="nf-title-row">
              <h1 className="nf-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="nf-unread-badge">{unreadCount}</span>
              )}
            </div>
            <p className="nf-subtitle">
              Read application updates, missing requirement reminders, and approval notices from the system.
            </p>
          </div>

          <button
            type="button"
            className="nf-mark-btn"
            onClick={actions.markNotificationsRead}
            disabled={unreadCount === 0}
          >
            <Icon name="check-all" size={15} />
            Mark all as read
          </button>
        </div>

        {/* ── Notification list ─────────────────────────────────────── */}
        {notifications.length > 0 ? (
          <ul className="nf-list">
            {notifications.map((notification) => {
              const tone = getToneMeta(notification.tone);
              const iconName = getToneIcon(notification.tone);
              const isUnread = notification.unread || notification.isRead === false;

              return (
                <li key={notification.id}>
                  <article className={`nf-card${isUnread ? ' is-unread' : ''}`}>
                    <div
                      className="nf-icon-wrap"
                      style={{ background: tone.iconBg, color: tone.color }}
                    >
                      <Icon name={iconName} size={17} />
                    </div>

                    <div className="nf-body">
                      <div className="nf-top">
                        <span className="nf-card-title">{notification.title}</span>
                        {isUnread && (
                          <span
                            className="nf-badge"
                            style={{
                              background: T.primaryLight,
                              color: T.primary,
                              borderColor: '#c5d4f8',
                            }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      {notification.message && (
                        <p className="nf-message">{notification.message}</p>
                      )}
                      {notification.time && (
                        <span className="nf-time">
                          <Icon name="clock" size={11} />
                          {notification.time}
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="nf-empty">
            <div className="nf-empty-icon">
              <Icon name="bell" size={22} />
            </div>
            <strong>No notifications yet</strong>
            <p>You're all caught up! Application updates and reminders will appear here.</p>
          </div>
        )}

      </div>
    </>
  );
}
