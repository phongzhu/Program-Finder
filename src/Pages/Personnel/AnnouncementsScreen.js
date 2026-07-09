import { useState } from 'react';
import { AnnouncementFormPanel } from 'Components/Announcements';
import { SectionHeading } from 'Components/UI';
import { canPublishAnnouncements, getAccountRoleLabel } from 'Utils/staffHierarchy';

export default function AnnouncementsScreen({ session, actions }) {
  const hasAnnouncementAccess = canPublishAnnouncements(session);
  const [form, setForm] = useState({ title: '', message: '' });

  if (!hasAnnouncementAccess) {
    return (
      <div className="section-card">
        <SectionHeading eyebrow="Office broadcast" title="Announcements" text="Only captain, barangay, secretary, and legacy personnel roles can publish office announcements." />
        <p className="body-text">{`${getAccountRoleLabel(session)} access cannot publish announcements.`}</p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Office broadcast" title="Announcements" text="Publish office-specific announcements for applicants under this office or municipality." />
      <AnnouncementFormPanel
        actionNote="Publishes to the office-facing applicant notice board."
        form={form}
        helperText="Share only the details relevant to applicants under your municipality or office."
        onFormChange={setForm}
        onSubmit={() => {
          actions.publishAnnouncement(form, 'Office Applicants');
          setForm({ title: '', message: '' });
        }}
      />
    </div>
  );
}
