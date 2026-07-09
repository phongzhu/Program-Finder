import { mergeStyles } from 'Utils/ui';
import { WORKSPACE_CARD_STYLE, WORKSPACE_THEME } from './workspaceTheme';

const METRIC_CARD_STYLE = {
  ...WORKSPACE_CARD_STYLE,
  padding: '1.2rem',
};

const METRIC_VALUE_STYLE = {
  fontFamily: "var(--font-body, 'Public Sans', system-ui, sans-serif)",
  fontSize: '2rem',
  color: WORKSPACE_THEME.ink,
  lineHeight: 1,
};

const METRIC_LABEL_STYLE = {
  color: WORKSPACE_THEME.inkMuted,
  fontSize: '0.78rem',
  fontWeight: 600,
};

const METRIC_DETAIL_STYLE = {
  margin: '-0.35rem 0 0',
  color: WORKSPACE_THEME.inkMuted,
  lineHeight: 1.55,
};

export function MetricCard({ className, detail, label, style, value }) {
  return (
    <article className={className} style={mergeStyles(METRIC_CARD_STYLE, style)}>
      <strong style={METRIC_VALUE_STYLE}>{value}</strong>
      <span style={METRIC_LABEL_STYLE}>{label}</span>
      {detail ? <small style={METRIC_DETAIL_STYLE}>{detail}</small> : null}
    </article>
  );
}
