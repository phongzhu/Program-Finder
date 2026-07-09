import { useState } from 'react';
import { AppButton, FormField, SectionHeading, SelectField } from 'Components/UI';
import { canReviewApplicants, getAccountRoleLabel } from 'Utils/staffHierarchy';
import { getOfficeApplications, getOfficeNotifications } from 'Services/Personnel/personnel-utils';

export default function NotificationsScreen({ session, data, actions }) {
  const hasApplicantAccess = canReviewApplicants(session);
  const applications = getOfficeApplications(data, session);
  const notifications = getOfficeNotifications(data, session);
  const recipientOptions = [...new Map(
    applications
      .filter((application) => application.applicantUserId)
      .map((application) => [
        application.applicantUserId,
        {
          label: `${application.applicantName} (${application.applicantEmail})`,
          value: application.applicantUserId,
        },
      ])
  ).values()];
  const [scope, setScope] = useState('all');
  const [title, setTitle] = useState('Program update');
  const [message, setMessage] = useState('Please check your applicant dashboard for the latest office update.');

  if (!hasApplicantAccess) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Applicant communication" title="Notifications" text="Applicant messaging is available only to roles that can review applicant records." />
        <p className="body-text">{`${getAccountRoleLabel(session)} access cannot send applicant notifications.`}</p>
      </div>
    );
  }

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
            ...recipientOptions,
          ]}
        />
        <FormField label="Title" value={title} onChange={setTitle} />
        <FormField label="Message" type="textarea" value={message} onChange={setMessage} />
        <div className="card-actions">
          <AppButton onClick={() => actions.sendMessageToApplicants(scope, title, message)} variant="primary">
            Send notification
          </AppButton>
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
