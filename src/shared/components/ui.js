export function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {text ? <p className="body-text">{text}</p> : null}
    </div>
  );
}

export function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );

  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {normalizedOptions.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function StatusPill({ status }) {
  const normalized = String(status).toLowerCase();
  let tone = 'neutral';

  if (['approved', 'completed', 'open', 'verified', 'admin', 'success', 'active', 'updated'].includes(normalized)) {
    tone = 'success';
  } else if (['incomplete', 'warning', 'attention', 'pending review', 'submitted', 'for review', 'pending'].includes(normalized)) {
    tone = 'warning';
  } else if (['inactive', 'deactivated', 'disabled', 'archived'].includes(normalized)) {
    tone = 'danger';
  } else if (['rejected', 'danger', 'closed'].includes(normalized)) {
    tone = 'danger';
  }

  return <span className={`status-pill tone-${tone}`}>{status}</span>;
}

export function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function Toast({ message, tone }) {
  return <div className={`toast tone-${tone}`}>{message}</div>;
}
