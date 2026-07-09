import { joinClassNames, mergeStyles } from 'Utils/ui';

const FILE_TRIGGER_STYLE = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.55rem',
  minHeight: '2.5rem',
  padding: '0.625rem 0.9rem',
  borderRadius: '999px',
  border: '1px solid rgba(18, 32, 25, 0.1)',
  background: 'rgba(255, 255, 255, 0.96)',
  color: '#122019',
  fontWeight: 700,
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease',
};

const FILE_TRIGGER_FULL_WIDTH_STYLE = {
  width: '100%',
};

const FILE_TRIGGER_DISABLED_STYLE = {
  opacity: 0.62,
  cursor: 'not-allowed',
};

const FILE_TRIGGER_ICON_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const FILE_TRIGGER_TEXT_STYLE = {
  minWidth: 0,
};

const FILE_TRIGGER_INPUT_STYLE = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
  border: 0,
};

export function FileTriggerButton({
  accept,
  children,
  className,
  disabled = false,
  fullWidth = false,
  leading = null,
  leadingClassName,
  name,
  onChange,
  style,
}) {
  return (
    <label
      className={joinClassNames(className)}
      style={mergeStyles(
        FILE_TRIGGER_STYLE,
        fullWidth ? FILE_TRIGGER_FULL_WIDTH_STYLE : null,
        disabled ? FILE_TRIGGER_DISABLED_STYLE : null,
        style
      )}
    >
      {leading ? (
        <span className={leadingClassName} style={FILE_TRIGGER_ICON_STYLE}>
          {leading}
        </span>
      ) : null}
      <span style={FILE_TRIGGER_TEXT_STYLE}>{children}</span>
      <input
        accept={accept}
        disabled={disabled}
        name={name}
        onChange={onChange}
        style={FILE_TRIGGER_INPUT_STYLE}
        type="file"
      />
    </label>
  );
}
