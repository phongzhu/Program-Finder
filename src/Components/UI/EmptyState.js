import { mergeStyles } from 'Utils/ui';

const EMPTY_STATE_STYLE = {
  display: 'grid',
  gap: '0.6rem',
  padding: '1.4rem',
  borderRadius: '16px',
  border: '1px dashed rgba(18, 32, 25, 0.18)',
  background: 'rgba(255, 255, 255, 0.56)',
};

const EMPTY_TEXT_STYLE = {
  margin: 0,
  color: '#5a6574',
  lineHeight: 1.6,
};

export function EmptyState({ className, style, text, title }) {
  return (
    <div className={className} style={mergeStyles(EMPTY_STATE_STYLE, style)}>
      <strong>{title}</strong>
      <p style={EMPTY_TEXT_STYLE}>{text}</p>
    </div>
  );
}
