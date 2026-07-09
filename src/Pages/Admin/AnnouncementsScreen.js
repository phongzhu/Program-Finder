import { useState } from 'react';
import {
  AnnouncementFormPanel,
  AnnouncementPreview,
  AnnouncementVectorArt,
} from 'Components/Announcements';
import { SectionHeading } from 'Components/UI';

const META_CARDS = [
  {
    title: 'Cleaner public notices',
    text: 'Write the update once, then scan how it will feel on the public board.',
  },
  {
    title: 'More visual workspace',
    text: 'Subtle vectors and motion give the module a stronger editorial feel.',
  },
];

export default function AnnouncementsScreen({ actions }) {
  const [form, setForm] = useState({ title: '', message: '' });

  return (
    <div className="section-card admin-announcements-screen">
      <div className="admin-announcements-hero">
        <div className="admin-announcements-copy">
          <SectionHeading
            eyebrow="Platform updates"
            title="Announcements"
            text="Publish public announcements from the admin side of the platform with a clearer, more polished composer."
          />

          <div className="admin-announcements-meta">
            {META_CARDS.map((card) => (
              <article className="admin-announcements-meta-card" key={card.title}>
                <strong>{card.title}</strong>
                <span>{card.text}</span>
              </article>
            ))}
          </div>
        </div>

        <AnnouncementVectorArt />
      </div>

      <div className="admin-announcements-grid">
        <AnnouncementFormPanel
          actionClassName="admin-announcements-actions"
          actionNote="Publishes to the public-facing board used by residents and applicants."
          className="admin-announcements-form-panel"
          copyClassName="admin-announcements-panel-copy"
          helperText="Lead with the deadline, action, or program detail applicants need to see first."
          form={form}
          messagePlaceholder="Share the updated time, who is affected, and what applicants should do next."
          noteClassName="admin-announcements-action-note"
          onFormChange={setForm}
          onSubmit={() => {
            actions.publishAnnouncement(form, 'Public');
            setForm({ title: '', message: '' });
          }}
          titlePlaceholder="Scholarship orientation schedule moved to Friday"
        />

        <AnnouncementPreview title={form.title} message={form.message} />
      </div>
    </div>
  );
}
