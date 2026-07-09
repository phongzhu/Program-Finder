import { mergeStyles } from 'Utils/ui';

const STAT_STRIP_STYLE = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(11rem, 100%), 1fr))',
};

const STAT_CHIP_STYLE = {
  display: 'grid',
  gap: '0.2rem',
  padding: '0.9rem 1rem',
  borderRadius: '20px',
  background: 'rgba(255, 255, 255, 0.94)',
  border: '1px solid rgba(18, 32, 25, 0.08)',
  boxShadow: '0 1px 3px rgba(13, 15, 20, 0.06), 0 1px 2px rgba(13, 15, 20, 0.04)',
};

const STAT_SMALL_STYLE = {
  color: '#5f6b77',
};

const STAT_VALUE_STYLE = {
  fontSize: '1.375rem',
};

export function StatStrip({ className, items, style }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className={className} style={mergeStyles(STAT_STRIP_STYLE, style)}>
      {items.map((item) => (
        <article key={item.label} style={STAT_CHIP_STYLE}>
          <small style={STAT_SMALL_STYLE}>{item.label}</small>
          <strong style={STAT_VALUE_STYLE}>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
