export function PublicSectionHeading({ eyebrow, title, text, dark = false }) {
  return (
    <div className={`pf-sec-header pf-fade-up ${dark ? 'is-dark' : ''}`}>
      <span className="pf-sec-eyebrow">{eyebrow}</span>
      <h2 className="pf-sec-title">{title}</h2>
      <span aria-hidden="true" className="pf-sec-divider" />
      {text ? <p className="pf-sec-text">{text}</p> : null}
    </div>
  );
}
