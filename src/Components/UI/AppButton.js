import { joinClassNames, mergeStyles } from 'Utils/ui';
import { WORKSPACE_THEME } from './workspaceTheme';

const BUTTON_BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.65rem',
  minWidth: 0,
  lineHeight: 1.2,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.01em',
  textDecoration: 'none',
  transition: 'background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, opacity 140ms ease',
};

const BUTTON_VARIANT_STYLES = {
  primary: {
    padding: '0.9rem 1.35rem',
    borderRadius: '10px',
    border: `1px solid ${WORKSPACE_THEME.accent}`,
    background: WORKSPACE_THEME.accent,
    color: WORKSPACE_THEME.onPrimary,
    boxShadow: 'none',
  },
  secondary: {
    padding: '0.9rem 1.35rem',
    borderRadius: '10px',
    border: `1px solid ${WORKSPACE_THEME.border}`,
    background: WORKSPACE_THEME.surface,
    color: WORKSPACE_THEME.onSurface,
    boxShadow: 'none',
  },
  ghost: {
    padding: '0.9rem 1.35rem',
    borderRadius: '10px',
    border: `1px solid ${WORKSPACE_THEME.border}`,
    background: WORKSPACE_THEME.surfaceMuted,
    color: WORKSPACE_THEME.onSurface,
  },
  inline: {
    padding: '0',
    border: 'none',
    background: 'transparent',
    color: WORKSPACE_THEME.accent,
    boxShadow: 'none',
  },
  plain: {
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
  },
};

const BUTTON_SIZE_STYLES = {
  sm: { padding: '0.7rem 1rem' },
  md: null,
  lg: { padding: '0.96rem 1.35rem' },
};

const BUTTON_FULL_WIDTH_STYLE = {
  width: '100%',
};

const BUTTON_ICON_ONLY_STYLE = {
  padding: '0',
};

const BUTTON_DISABLED_STYLE = {
  opacity: 0.62,
  cursor: 'not-allowed',
};

const BUTTON_LABEL_STYLE = {
  minWidth: 0,
};

const BUTTON_ICON_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export function AppButton({
  children,
  className,
  fullWidth = false,
  labelClassName,
  leading = null,
  leadingClassName,
  size = 'md',
  style,
  trailing = null,
  trailingClassName,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const isIconOnly = !children && Boolean(leading || trailing);
  const isPlainLike = variant === 'plain';
  const isDisabled = Boolean(props.disabled);
  const variantStyle = BUTTON_VARIANT_STYLES[variant] || BUTTON_VARIANT_STYLES.primary;
  const sizeStyle = !isPlainLike ? BUTTON_SIZE_STYLES[size] : null;

  return (
    <button
      className={joinClassNames(className)}
      style={mergeStyles(
        BUTTON_BASE_STYLE,
        variantStyle,
        sizeStyle,
        fullWidth ? BUTTON_FULL_WIDTH_STYLE : null,
        isIconOnly ? BUTTON_ICON_ONLY_STYLE : null,
        isDisabled ? BUTTON_DISABLED_STYLE : null,
        style
      )}
      type={type}
      {...props}
    >
      {leading ? (
        <span className={leadingClassName} style={BUTTON_ICON_STYLE}>
          {leading}
        </span>
      ) : null}
      {children ? (
        <span className={labelClassName} style={BUTTON_LABEL_STYLE}>
          {children}
        </span>
      ) : null}
      {trailing ? (
        <span className={trailingClassName} style={BUTTON_ICON_STYLE}>
          {trailing}
        </span>
      ) : null}
    </button>
  );
}
