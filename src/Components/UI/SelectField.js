import { joinClassNames, mergeStyles } from 'Utils/ui';

const FIELD_WRAPPER_STYLE = {
  display: 'grid',
  gap: '0.45rem',
};

const FIELD_LABEL_STYLE = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--pf-setting-secondary-text, var(--pf-on-tertiary))',
};

const FIELD_CONTROL_STYLE = {
  width: '100%',
  borderRadius: '14px',
  border: '1px solid color-mix(in srgb, var(--pf-setting-primary, var(--pf-accent)) 14%, transparent)',
  background: 'var(--pf-setting-tertiary, var(--pf-card))',
  padding: '0.9rem 1rem',
  color: 'var(--pf-setting-secondary-text, var(--pf-on-tertiary))',
  outline: 'none',
  font: 'inherit',
  transition: 'border-color 140ms ease, box-shadow 140ms ease, background 140ms ease',
};

const FIELD_DISABLED_STYLE = {
  opacity: 0.72,
  cursor: 'not-allowed',
  background: 'var(--pf-setting-tertiary, var(--pf-card))',
};

const REQUIRED_MARK_STYLE = {
  color: '#be3d34',
  marginLeft: '0.25rem',
};

export function SelectField({
  className,
  controlClassName,
  controlStyle,
  disabled = false,
  fieldStyle,
  label,
  labelClassName,
  labelStyle,
  onChange,
  options = [],
  required = false,
  style,
  value,
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );

  return (
    <label className={joinClassNames(className)} style={mergeStyles(FIELD_WRAPPER_STYLE, style)}>
      <span
        className={joinClassNames(labelClassName)}
        style={mergeStyles(FIELD_LABEL_STYLE, labelStyle)}
      >
        {label}
        {required ? <span aria-hidden="true" style={REQUIRED_MARK_STYLE}>*</span> : null}
      </span>
      <select
        className={joinClassNames(controlClassName)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={mergeStyles(
          FIELD_CONTROL_STYLE,
          disabled ? FIELD_DISABLED_STYLE : null,
          fieldStyle,
          controlStyle
        )}
        value={value}
      >
        {normalizedOptions.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
