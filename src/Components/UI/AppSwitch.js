import { joinClassNames, mergeStyles } from 'Utils/ui';

const SWITCH_BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.7rem',
  padding: '0',
  border: 'none',
  background: 'transparent',
  color: 'var(--pf-ink, #161616)',
  fontWeight: 700,
  cursor: 'pointer',
};

const SWITCH_DISABLED_STYLE = {
  opacity: 0.62,
  cursor: 'not-allowed',
};

const SWITCH_COPY_STYLE = {
  display: 'grid',
  gap: '0.1rem',
  textAlign: 'left',
};

const SWITCH_LABEL_STYLE = {
  color: 'inherit',
  fontSize: '0.88rem',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

const SWITCH_DESCRIPTION_STYLE = {
  color: 'inherit',
  opacity: 0.72,
  lineHeight: 1.45,
};

const SWITCH_TRACK_STYLE = {
  position: 'relative',
  width: '3rem',
  height: '1.7rem',
  borderRadius: '999px',
  background: 'var(--pf-border, rgba(18, 32, 25, 0.12))',
  transition: 'background 140ms ease',
  flexShrink: 0,
};

const SWITCH_TRACK_ON_STYLE = {
  background: 'var(--pf-accent, rgba(22, 89, 177, 0.52))',
};

const SWITCH_THUMB_STYLE = {
  position: 'absolute',
  top: '0.2rem',
  left: '0.22rem',
  width: '1.3rem',
  height: '1.3rem',
  borderRadius: '999px',
  background: 'var(--pf-card, #fff)',
  boxShadow: '0 4px 12px rgba(18, 32, 25, 0.16)',
  transition: 'transform 140ms ease',
};

const SWITCH_THUMB_ON_STYLE = {
  transform: 'translateX(1.28rem)',
};

export function AppSwitch({
  checked,
  className,
  description,
  disabled = false,
  label,
  onChange,
  style,
  type = 'button',
  ...props
}) {
  const handleToggle = () => {
    if (disabled) {
      return;
    }

    onChange?.(!checked);
  };

  return (
    <button
      aria-checked={checked}
      className={joinClassNames(className)}
      disabled={disabled}
      onClick={handleToggle}
      role="switch"
      style={mergeStyles(SWITCH_BASE_STYLE, disabled ? SWITCH_DISABLED_STYLE : null, style)}
      type={type}
      {...props}
    >
      <span
        aria-hidden="true"
        style={mergeStyles(SWITCH_TRACK_STYLE, checked ? SWITCH_TRACK_ON_STYLE : null)}
      >
        <span style={mergeStyles(SWITCH_THUMB_STYLE, checked ? SWITCH_THUMB_ON_STYLE : null)} />
      </span>
      {label || description ? (
        <span style={SWITCH_COPY_STYLE}>
          {label ? <span style={SWITCH_LABEL_STYLE}>{label}</span> : null}
          {description ? <small style={SWITCH_DESCRIPTION_STYLE}>{description}</small> : null}
        </span>
      ) : null}
    </button>
  );
}
