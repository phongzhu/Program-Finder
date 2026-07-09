import { mergeStyles } from 'Utils/ui';

const MODAL_BACKDROP_STYLE = {
  position: 'fixed',
  inset: 0,
  zIndex: 240,
  display: 'grid',
  placeItems: 'center',
  padding: '1.25rem',
  background: 'transparent',
  backdropFilter: 'none',
};

const MODAL_STYLE = {
  width: 'min(100%, 46rem)',
  maxHeight: 'min(92vh, 60rem)',
  overflow: 'auto',
  borderRadius: '28px',
  background: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: '1px solid var(--pf-border, rgba(18, 32, 25, 0.08))',
  boxShadow: '0 28px 90px rgba(10, 20, 15, 0.22)',
};

const MODAL_WIDE_STYLE = {
  width: 'min(100%, 64rem)',
};

const MODAL_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '1.2rem 1.35rem',
  borderBottom: '1px solid var(--pf-border, rgba(18, 32, 25, 0.08))',
};

const MODAL_COPY_STYLE = {
  display: 'grid',
  gap: '0.35rem',
};

const MODAL_TITLE_STYLE = {
  fontSize: '1.08rem',
  lineHeight: 1.2,
  color: 'var(--pf-ink, #161616)',
};

const MODAL_TEXT_STYLE = {
  margin: 0,
  color: 'var(--pf-ink-muted, #5f6b77)',
  lineHeight: 1.6,
};

const MODAL_CLOSE_STYLE = {
  padding: '0.65rem 0.9rem',
  borderRadius: '12px',
  border: '1px solid var(--pf-border, rgba(18, 32, 25, 0.08))',
  background: 'rgba(255, 255, 255, 0.72)',
  fontWeight: 700,
  cursor: 'pointer',
};

const MODAL_BODY_STYLE = {
  display: 'grid',
  gap: '1rem',
  padding: '1.25rem 1.35rem',
};

const MODAL_FOOTER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
  padding: '1.2rem 1.35rem',
  borderTop: '1px solid var(--pf-border, rgba(18, 32, 25, 0.08))',
};

export function ModalShell({ children, footer, hideClose = false, onClose, text, title, wide = false }) {
  return (
    <div onClick={hideClose ? undefined : onClose} role="presentation" style={MODAL_BACKDROP_STYLE}>
      <div
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={mergeStyles(MODAL_STYLE, wide ? MODAL_WIDE_STYLE : null)}
      >
        <div style={MODAL_HEADER_STYLE}>
          <div style={MODAL_COPY_STYLE}>
            <strong style={MODAL_TITLE_STYLE}>{title}</strong>
            {text ? <p style={MODAL_TEXT_STYLE}>{text}</p> : null}
          </div>
          {hideClose ? null : (
            <button onClick={onClose} style={MODAL_CLOSE_STYLE} type="button">
              Close
            </button>
          )}
        </div>
        <div style={MODAL_BODY_STYLE}>{children}</div>
        {footer ? <div style={MODAL_FOOTER_STYLE}>{footer}</div> : null}
      </div>
    </div>
  );
}
