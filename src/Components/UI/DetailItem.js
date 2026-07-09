import { mergeStyles } from 'Utils/ui';

const DETAIL_ITEM_STYLE = {
  display: 'grid',
  gap: '0.35rem',
  padding: '0.95rem 1rem',
  borderRadius: '16px',
  background: 'rgba(22, 89, 177, 0.06)',
  border: '1px solid transparent',
};

const DETAIL_LABEL_STYLE = {
  color: '#5a6574',
  fontSize: '0.78rem',
};

const DETAIL_VALUE_STYLE = {
  color: 'inherit',
  lineHeight: 1.35,
};

export function DetailItem({ className, label, style, value }) {
  return (
    <div className={className} style={mergeStyles(DETAIL_ITEM_STYLE, style)}>
      <small style={DETAIL_LABEL_STYLE}>{label}</small>
      <strong style={DETAIL_VALUE_STYLE}>{value}</strong>
    </div>
  );
}
