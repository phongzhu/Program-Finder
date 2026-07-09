import { PublicStageBackdrop } from './PublicStageBackdrop';

export function PublicStageSection({
  as: Tag = 'section',
  variant,
  className = '',
  contentClassName,
  id,
  children,
}) {
  const sectionClassName = ['pf-stage-section', className].filter(Boolean).join(' ');

  return (
    <Tag className={sectionClassName} id={id}>
      <PublicStageBackdrop variant={variant} />
      <div className={contentClassName}>{children}</div>
    </Tag>
  );
}

export default PublicStageSection;
