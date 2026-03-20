import { useState } from 'react';
import { FormField, SectionHeading, SelectField } from '../../../shared/components/ui';
import { getOfficeApplications, getOfficeNotifications } from './helpers';

export default function NotificationsScreen({ session, data, actions }) {
  const applications = getOfficeApplications(data, session);
  const notifications = getOfficeNotifications(data, session);
  const [scope, setScope] = useState('all');
  const [title, setTitle] = useState('Program update');
  const [message, setMessage] = useState('Please check your applicant dashboard for the latest office update.');

  return (
    <div className="content-grid">
      <div className="section-card">
        <SectionHeading eyebrow="Applicant communication" title="Notifications" text="Send notifications to all office applicants or to a single applicant from this module." />
        <SelectField
          label="Recipients"
          value={scope}
          onChange={setScope}
          options={[
            { label: 'All applicants in this office', value: 'all' },
            ...applications.map((application) => ({
              label: `${application.applicantName} (${application.applicantEmail})`,
              value: application.applicantEmail,
            })),
          ]}
        />
        <FormField label="Title" value={title} onChange={setTitle} />
        <FormField label="Message" type="textarea" value={message} onChange={setMessage} />
        <div className="card-actions">
          <button className="primary-button" onClick={() => actions.sendMessageToApplicants(scope, title, message)}>
            Send notification
          </button>
        </div>
      </div>

      <div className="section-card">
        <SectionHeading eyebrow="Incoming alerts" title="Personnel notifications" />
        <div className="stack-list">
          {notifications.map((notification) => (
            <article className={`notification-card tone-${notification.tone}`} key={notification.id}>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small>{notification.time}</small>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
