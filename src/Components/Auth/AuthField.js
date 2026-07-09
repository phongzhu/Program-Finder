import { ChevronDownIcon, EyeIcon } from './AuthIcons';

export function AuthField({
  autoComplete,
  disabled = false,
  icon,
  label,
  onChange,
  placeholder,
  readOnly = false,
  showToggle = false,
  toggleOpen = false,
  onToggle,
  type = 'text',
  value,
}) {
  return (
    <label className="pf-auth-field">
      <span className="pf-auth-field-label">{label}</span>
      <div className="pf-auth-control">
        <span className="pf-auth-control-icon">{icon}</span>
        <input
          autoComplete={autoComplete}
          className="pf-auth-control-input"
          disabled={disabled}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          type={showToggle ? (toggleOpen ? 'text' : 'password') : type}
          value={value}
        />
        {showToggle ? (
          <button className="pf-auth-control-toggle" onClick={onToggle} type="button">
            <EyeIcon open={toggleOpen} />
          </button>
        ) : null}
      </div>
    </label>
  );
}

export function AuthSelectField({
  autoComplete,
  disabled = false,
  icon,
  label,
  onChange,
  options = [],
  placeholder,
  value,
}) {
  return (
    <label className="pf-auth-field">
      <span className="pf-auth-field-label">{label}</span>
      <div className="pf-auth-control">
        <span className="pf-auth-control-icon">{icon}</span>
        <select
          autoComplete={autoComplete}
          className={`pf-auth-control-input pf-auth-control-select ${value ? '' : 'is-placeholder'}`}
          disabled={disabled}
          onChange={onChange}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const normalizedOption =
              typeof option === 'string' ? { label: option, value: option } : option;

            return (
              <option key={normalizedOption.value} value={normalizedOption.value}>
                {normalizedOption.label}
              </option>
            );
          })}
        </select>
        <span aria-hidden="true" className="pf-auth-control-suffix">
          <ChevronDownIcon />
        </span>
      </div>
    </label>
  );
}
