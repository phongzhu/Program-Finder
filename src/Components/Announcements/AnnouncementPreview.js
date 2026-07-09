export function AnnouncementPreview({
  title,
  message,
  emptyTitle = 'Scholarship application advisory updated',
  emptyMessage = 'Preview how your bulletin will read before it goes live on the public board. Start with the action, mention the deadline, and keep the message direct.',
  footerLabels = ['ProgramFinder | Province of Bulacan', 'Administrative bulletin'],
  kicker = 'Province of Bulacan notice',
  note = 'Keep the opening sentence action-first so applicants can scan the notice quickly.',
}) {
  const hasContent = Boolean(title.trim() && message.trim());
  const publishedOn = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <aside className="admin-announcements-preview-panel">
      <div className="admin-announcements-preview-head">
        <span className="soft-badge">Live Preview</span>
        <span className="admin-announcements-preview-date">{publishedOn}</span>
      </div>

      <article className="admin-announcements-preview-card">
        <div className="admin-announcements-preview-top">
          <span className="admin-announcements-preview-kicker">{kicker}</span>
          <span className={`admin-announcements-preview-state ${hasContent ? 'is-ready' : ''}`}>
            {hasContent ? 'Ready to publish' : 'Draft preview'}
          </span>
        </div>

        <h3>{title.trim() || emptyTitle}</h3>
        <p>{message.trim() || emptyMessage}</p>

        <div className="admin-announcements-preview-footer">
          {footerLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </article>

      <p className="admin-announcements-preview-note">{note}</p>
    </aside>
  );
}
