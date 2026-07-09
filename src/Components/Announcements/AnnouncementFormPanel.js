import { AppButton, FormField } from '../UI';

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

export function AnnouncementFormPanel({
  actionClassName,
  actionNote,
  buttonLabel = 'Publish announcement',
  className,
  copyClassName,
  eyebrow = 'Compose update',
  helperText,
  form,
  messageLabel = 'Announcement message',
  messagePlaceholder,
  noteClassName,
  onFormChange,
  onSubmit,
  titleLabel = 'Announcement title',
  titlePlaceholder,
}) {
  const handleFieldChange = (field) => (value) => {
    onFormChange({ ...form, [field]: value });
  };

  return (
    <div className={joinClassNames('announcement-form-panel', className)}>
      <div className={joinClassNames('announcement-panel-copy', copyClassName)}>
        <p className="eyebrow">{eyebrow}</p>
        {helperText ? <p className="body-text">{helperText}</p> : null}
      </div>

      <FormField
        label={titleLabel}
        placeholder={titlePlaceholder}
        value={form.title}
        onChange={handleFieldChange('title')}
      />
      <FormField
        label={messageLabel}
        type="textarea"
        placeholder={messagePlaceholder}
        value={form.message}
        onChange={handleFieldChange('message')}
      />

      <div className={joinClassNames('card-actions', actionClassName)}>
        {actionNote ? (
          <p className={joinClassNames('announcement-action-note', noteClassName)}>
            {actionNote}
          </p>
        ) : null}
        <AppButton onClick={onSubmit} variant="primary">
          {buttonLabel}
        </AppButton>
      </div>
    </div>
  );
}
