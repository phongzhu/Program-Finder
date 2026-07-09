import { mergeStyles } from 'Utils/ui';

const STATUS_TONE_STYLES = {
  success: {
    background: 'rgba(64, 86, 73, 0.16)',
    color: '#2d4035',
  },
  warning: {
    background: 'rgba(195, 161, 93, 0.18)',
    color: '#8d6e37',
  },
  danger: {
    background: 'rgba(143, 68, 54, 0.14)',
    color: '#8f4436',
  },
  neutral: {
    background: 'rgba(23, 59, 99, 0.1)',
    color: '#173b63',
  },
};

const STATUS_PILL_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '10px',
  padding: '0.38rem 0.7rem',
  fontSize: '0.7rem',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

export function StatusPill({ className, status, style }) {
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

  return (
    <span
      className={className}
      style={mergeStyles(STATUS_PILL_STYLE, STATUS_TONE_STYLES[tone], style)}
    >
      {status}
    </span>
  );
}
