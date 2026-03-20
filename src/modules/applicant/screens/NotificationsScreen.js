import { SectionHeading } from '../../../shared/components/ui';
import { getApplicantNotifications } from './helpers';

export default function NotificationsScreen({ session, data, actions }) {
  const notifications = getApplicantNotifications(data, session);

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Alerts" title="Notifications" text="Read application updates, missing requirement reminders, and approval notices from the system." />
      <div className="card-actions">
        <button className="secondary-button" onClick={actions.markNotificationsRead}>
          Mark all as read
        </button>
      </div>
      <div className="stack-list">
        {notifications.map((notification) => (
          <article className={`notification-card tone-${notification.tone}`} key={notification.id}>
            <div className="program-list-top">
              <strong>{notification.title}</strong>
              {notification.unread ? <span className="soft-badge">Unread</span> : null}
            </div>
            <p>{notification.message}</p>
            <small>{notification.time}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
