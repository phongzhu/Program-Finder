import { joinClassNames, mergeStyles } from 'Utils/ui';
import { WORKSPACE_THEME } from './workspaceTheme';

const ACTION_BUTTON_BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.65rem',
  minWidth: 0,
  padding: '0.74rem 0.9rem',
  borderRadius: '10px',
  border: `1px solid ${WORKSPACE_THEME.borderSoft}`,
  background: WORKSPACE_THEME.white,
  color: WORKSPACE_THEME.ink,
  cursor: 'pointer',
  fontSize: '0.94rem',
  fontFamily: "var(--font-body, 'Public Sans', system-ui, sans-serif)",
  fontWeight: 700,
  letterSpacing: '0.01em',
  lineHeight: 1.2,
  textDecoration: 'none',
  transition: 'box-shadow 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease',
};

const ACTION_BUTTON_TONE_STYLES = {
  primary: {
    background: WORKSPACE_THEME.accent,
    color: WORKSPACE_THEME.white,
    borderColor: WORKSPACE_THEME.accent,
    boxShadow: 'none',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.96)',
    color: WORKSPACE_THEME.accent,
    borderColor: WORKSPACE_THEME.border,
  },
  danger: {
    background: 'rgba(143, 68, 54, 0.12)',
    color: '#8f4436',
    borderColor: 'rgba(143, 68, 54, 0.14)',
  },
  ghost: {
    background: WORKSPACE_THEME.white,
    color: WORKSPACE_THEME.ink,
  },
};

const ACTION_BUTTON_COMPACT_STYLE = {
  padding: '0.55rem 0.72rem',
  borderRadius: '10px',
  fontSize: '0.875rem',
};

const ACTION_BUTTON_DISABLED_STYLE = {
  opacity: 0.62,
  cursor: 'not-allowed',
  boxShadow: 'none',
};

export function ActionButton({
  children,
  className,
  compact = false,
  style,
  tone = 'ghost',
  ...props
}) {
  const isDisabled = Boolean(props.disabled);

  return (
    <button
      className={joinClassNames(className)}
      style={mergeStyles(
        ACTION_BUTTON_BASE_STYLE,
        ACTION_BUTTON_TONE_STYLES[tone] || ACTION_BUTTON_TONE_STYLES.ghost,
        compact ? ACTION_BUTTON_COMPACT_STYLE : null,
        isDisabled ? ACTION_BUTTON_DISABLED_STYLE : null,
        style
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
