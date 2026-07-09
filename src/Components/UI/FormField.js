import { joinClassNames, mergeStyles } from 'Utils/ui';
import { WORKSPACE_CONTROL_STYLE, WORKSPACE_LABEL_STYLE, WORKSPACE_THEME } from './workspaceTheme';

const FIELD_WRAPPER_STYLE = {
  display: 'grid',
  gap: '0.45rem',
};

const FIELD_LABEL_STYLE = WORKSPACE_LABEL_STYLE;

const FIELD_CONTROL_STYLE = WORKSPACE_CONTROL_STYLE;

const FIELD_TEXTAREA_STYLE = {
  resize: 'vertical',
  minHeight: '7.5rem',
};

const FIELD_DISABLED_STYLE = {
  opacity: 0.72,
  cursor: 'not-allowed',
  background: WORKSPACE_THEME.surfaceDisabled,
};

const REQUIRED_MARK_STYLE = {
  color: '#be3d34',
  marginLeft: '0.25rem',
};

export function FormField({
  className,
  controlClassName,
  controlStyle,
  disabled = false,
  fieldStyle,
  label,
  labelClassName,
  labelStyle,
  onChange,
  placeholder,
  required = false,
  style,
  type = 'text',
  value,
}) {
  return (
    <label className={joinClassNames(className)} style={mergeStyles(FIELD_WRAPPER_STYLE, style)}>
      <span
        className={joinClassNames(labelClassName)}
        style={mergeStyles(FIELD_LABEL_STYLE, labelStyle)}
      >
        {label}
        {required ? <span aria-hidden="true" style={REQUIRED_MARK_STYLE}>*</span> : null}
      </span>
      {type === 'textarea' ? (
        <textarea
          className={joinClassNames(controlClassName)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          style={mergeStyles(
            FIELD_CONTROL_STYLE,
            FIELD_TEXTAREA_STYLE,
            disabled ? FIELD_DISABLED_STYLE : null,
            fieldStyle,
            controlStyle
          )}
          value={value}
        />
      ) : (
        <input
          className={joinClassNames(controlClassName)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={mergeStyles(
            FIELD_CONTROL_STYLE,
            disabled ? FIELD_DISABLED_STYLE : null,
            fieldStyle,
            controlStyle
          )}
          type={type}
          value={value}
        />
      )}
    </label>
  );
}
