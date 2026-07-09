import { mergeStyles } from 'Utils/ui';

const BACKDROP_STYLE = {
  position: 'fixed',
  inset: 0,
  zIndex: 140,
  display: 'grid',
  placeItems: 'center',
  padding: '1.25rem',
  background: 'rgba(12, 28, 46, 0.34)',
  backdropFilter: 'blur(6px)',
};

const DIALOG_STYLE = {
  width: 'min(100%, 30rem)',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.99)',
  border: '1px solid rgba(18, 35, 58, 0.1)',
  boxShadow: '0 20px 48px rgba(13, 28, 45, 0.18)',
};

const DIALOG_DANGER_STYLE = {
  borderColor: 'rgba(143, 53, 43, 0.16)',
};

const BODY_STYLE = {
  display: 'grid',
  gap: '1rem',
  padding: '1.35rem',
};

const COPY_STYLE = {
  display: 'grid',
  gap: '0.5rem',
};

const EYEBROW_STYLE = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#173b63',
};

const EYEBROW_DANGER_STYLE = {
  color: '#9b3b31',
};

const TITLE_STYLE = {
  fontFamily: "var(--font-body, 'Public Sans', system-ui, sans-serif)",
  fontSize: 'clamp(1.45rem, 2vw, 1.75rem)',
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
  color: '#12233a',
};

const MESSAGE_STYLE = {
  margin: 0,
  color: '#5a697a',
  lineHeight: 1.65,
};

const ACTIONS_STYLE = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const BUTTON_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.65rem',
  padding: '0.9rem 1.35rem',
  borderRadius: '10px',
  fontFamily: "var(--font-body, 'Public Sans', system-ui, sans-serif)",
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease',
};

const CANCEL_BUTTON_STYLE = {
  background: 'rgba(255, 255, 255, 0.96)',
  color: '#173b63',
  borderColor: 'rgba(18, 35, 58, 0.12)',
};

const CONFIRM_BUTTON_STYLE = {
  background: '#173b63',
  color: '#ffffff',
  boxShadow: 'none',
};

const CONFIRM_DANGER_BUTTON_STYLE = {
  background: '#8f352b',
  boxShadow: 'none',
};

export function ConfirmationDialog({ confirmation, onClose, onConfirm }) {
  if (!confirmation) {
    return null;
  }

  const isDanger = confirmation.tone === 'danger';

  return (
    <div onClick={onClose} role="presentation" style={BACKDROP_STYLE}>
      <div
        aria-label={confirmation.title}
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={mergeStyles(DIALOG_STYLE, isDanger ? DIALOG_DANGER_STYLE : null)}
      >
        <div style={BODY_STYLE}>
          <div style={COPY_STYLE}>
            <span style={mergeStyles(EYEBROW_STYLE, isDanger ? EYEBROW_DANGER_STYLE : null)}>
              Confirmation
            </span>
            <strong style={TITLE_STYLE}>{confirmation.title}</strong>
            <p style={MESSAGE_STYLE}>{confirmation.message}</p>
          </div>

          <div style={ACTIONS_STYLE}>
            <button onClick={onClose} style={mergeStyles(BUTTON_STYLE, CANCEL_BUTTON_STYLE)} type="button">
              {confirmation.cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={mergeStyles(BUTTON_STYLE, CONFIRM_BUTTON_STYLE, isDanger ? CONFIRM_DANGER_BUTTON_STYLE : null)}
              type="button"
            >
              {confirmation.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
