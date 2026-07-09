import { mergeStyles } from 'Utils/ui';

const SUMMARY_CARD_STYLE = {
  display: 'grid',
  gap: '0.2rem',
  padding: '1rem 1.05rem',
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(18, 35, 58, 0.08)',
  boxShadow: 'none',
};

const SUMMARY_DETAIL_STYLE = {
  color: '#5a697a',
};

const SUMMARY_VALUE_STYLE = {
  fontFamily: "var(--font-body, 'Public Sans', system-ui, sans-serif)",
  fontSize: '1.375rem',
  lineHeight: 1.1,
  color: '#12233a',
};

const SUMMARY_LABEL_STYLE = {
  fontWeight: 700,
  color: '#173b63',
};

export function SummaryCard({ className, detail, label, style, value }) {
  return (
    <article className={className} style={mergeStyles(SUMMARY_CARD_STYLE, style)}>
      <small style={SUMMARY_DETAIL_STYLE}>{detail}</small>
      <strong style={SUMMARY_VALUE_STYLE}>{value}</strong>
      <span style={SUMMARY_LABEL_STYLE}>{label}</span>
    </article>
  );
}
