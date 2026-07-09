import { formatPublicDate, getProgramStatusClass } from 'Services/Public/public-utils';
import {
  getProgramIllustrationSource,
  getProgramPhotoSource,
} from 'Services/Applicant/applicant-utils';
import { OnlineIcon } from './OnlineIcon';

export function PublicOverviewItem({ item }) {
  return (
    <article className="pf-overview-item">
      <span className="pf-overview-icon">
        <OnlineIcon className="pf-icon-image" color="1e7d4d" icon={item.icon} />
      </span>
      <span className="pf-overview-text">{item.text}</span>
    </article>
  );
}

export function PublicNoteCard({ badge, title, text }) {
  return (
    <article className="pf-note-card">
      <span className="pf-note-badge">{badge}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

export function PublicStatCard({ item }) {
  return (
    <div className="pf-stat-card" role="listitem">
      <span className="pf-stat-num">{item.value}</span>
      <span className="pf-stat-label">{item.label}</span>
    </div>
  );
}

export function PublicProgramCard({ program, onOpenApplicantPortal }) {
  const programImageSource = getProgramPhotoSource(program) || getProgramIllustrationSource(program);

  return (
    <article className="pf-program-card">
      <div className="pf-program-media">
        <img alt={program.title} src={programImageSource} />
      </div>

      <div className="pf-program-body">
        <div className="pf-program-top">
          <span className="pf-program-cat">{program.category}</span>
          <span className={getProgramStatusClass(program.status)}>{program.status}</span>
        </div>

        <h3 className="pf-program-title">{program.title}</h3>
        <p className="pf-program-desc">{program.summary}</p>

        <div className="pf-program-meta">
          <div className="pf-program-meta-item">
            <small>Target beneficiaries</small>
            <strong>{program.sector}</strong>
          </div>
          <div className="pf-program-meta-item">
            <small>Deadline</small>
            <strong>{formatPublicDate(program.deadline)}</strong>
          </div>
        </div>

        <button className="pf-program-button" onClick={onOpenApplicantPortal} type="button">
          Review program guidance &rarr;
        </button>
      </div>
    </article>
  );
}

export function PublicStepCard({ step }) {
  return (
    <article className="pf-step-card">
      <span className="pf-step-num" aria-hidden="true">
        {step.number}
      </span>
      <h3 className="pf-step-title">{step.title}</h3>
      <p className="pf-step-text">{step.text}</p>
    </article>
  );
}

export function PublicFeatureCard({ feature }) {
  return (
    <article className="pf-feature-card">
      <span className="pf-feature-icon">
        <OnlineIcon className="pf-icon-image" color="ffd8d8" icon={feature.icon} />
      </span>
      <h3 className="pf-feature-title">{feature.title}</h3>
      <p className="pf-feature-text">{feature.text}</p>
    </article>
  );
}

export function PublicCategoryCard({ category }) {
  return (
    <article className="pf-cat-card">
      <strong>{category.title}</strong>
      <p>{category.text}</p>
    </article>
  );
}

export function PublicAnnouncementCard({
  title,
  message,
  meta,
  badgeText,
  badgeClassName,
  href,
  imageUrl,
  sourceLabel,
}) {
  const Tag = href ? 'a' : 'article';

  return (
    <Tag
      className={`pf-ann-card ${href ? 'is-link' : ''}`}
      href={href || undefined}
      rel={href ? 'noreferrer' : undefined}
      target={href ? '_blank' : undefined}
    >
      {imageUrl ? (
        <div className="pf-ann-card-media">
          <img alt={title} src={imageUrl} />
        </div>
      ) : null}
      <div className="pf-ann-top">
        <span className="pf-ann-title">{title}</span>
        <span className={badgeClassName}>{badgeText}</span>
      </div>
      <p className="pf-ann-message">{message}</p>
      <span className="pf-ann-meta">{meta}</span>
      {sourceLabel ? <span className="pf-ann-source">{sourceLabel}</span> : null}
    </Tag>
  );
}

export function PublicFaqItem({ item, index, isOpen, onToggle }) {
  return (
    <article className={`pf-faq-item ${isOpen ? 'open' : ''}`} role="listitem">
      <button
        aria-controls={`faq-answer-${index}`}
        aria-expanded={isOpen}
        className="pf-faq-question"
        id={`faq-question-${index}`}
        onClick={() => onToggle(index)}
        type="button"
      >
        <span>{item.question}</span>
        <span className="pf-faq-chevron" aria-hidden="true">
          {isOpen ? <>&#9650;</> : <>&#9660;</>}
        </span>
      </button>
      <div
        aria-labelledby={`faq-question-${index}`}
        className="pf-faq-answer"
        id={`faq-answer-${index}`}
        role="region"
      >
        {item.answer}
      </div>
    </article>
  );
}

export function PublicContactCard({
  badge,
  title,
  text,
  meta,
  children,
  action,
}) {
  return (
    <article className="pf-contact-card">
      <span className="pf-contact-badge">{badge}</span>
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
      {meta ? <small>{meta}</small> : null}
      {children}
      {action}
    </article>
  );
}
