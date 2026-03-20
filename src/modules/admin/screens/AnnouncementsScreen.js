import { useState } from 'react';
import { FormField, SectionHeading } from '../../../shared/components/ui';

export default function AnnouncementsScreen({ actions }) {
  const [form, setForm] = useState({ title: '', message: '' });

  return (
    <div className="section-card">
      <SectionHeading eyebrow="Platform updates" title="Announcements" text="Publish public announcements from the admin side of the platform." />
      <FormField label="Announcement title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
      <FormField label="Announcement message" type="textarea" value={form.message} onChange={(value) => setForm({ ...form, message: value })} />
      <div className="card-actions">
        <button
          className="primary-button"
          onClick={() => {
            actions.publishAnnouncement(form, 'Public');
            setForm({ title: '', message: '' });
          }}
        >
          Publish announcement
        </button>
      </div>
    </div>
  );
}
