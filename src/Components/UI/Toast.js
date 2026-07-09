import { joinClassNames, mergeStyles } from 'Utils/ui';

const TOAST_BASE_STYLE = {
  position: 'fixed',
  right: '1.5rem',
  bottom: '1.5rem',
  maxWidth: 'min(420px, calc(100vw - 2rem))',
  padding: '1rem 1.2rem',
  borderRadius: '12px',
  border: '1px solid rgba(18, 35, 58, 0.14)',
  background: 'rgba(255, 255, 255, 0.98)',
  color: '#12233a',
  boxShadow: '0 18px 38px rgba(13, 28, 45, 0.16)',
  zIndex: 150,
};

const TOAST_TONE_STYLES = {
  success: {
    borderColor: 'rgba(64, 86, 73, 0.18)',
    background: 'rgba(247, 250, 247, 0.98)',
  },
  warning: {
    borderColor: 'rgba(195, 161, 93, 0.22)',
    background: 'rgba(251, 248, 240, 0.98)',
  },
  danger: {
    borderColor: 'rgba(143, 68, 54, 0.18)',
    background: 'rgba(255, 248, 247, 0.98)',
  },
  neutral: {
    borderColor: 'rgba(23, 59, 99, 0.18)',
    background: 'rgba(250, 249, 245, 0.98)',
  },
};

export function Toast({ className, message, style, tone }) {
  const normalizedTone = tone || 'neutral';

  return (
    <div
      aria-live="polite"
      className={joinClassNames(className)}
      role="status"
      style={mergeStyles(TOAST_BASE_STYLE, TOAST_TONE_STYLES[normalizedTone] || TOAST_TONE_STYLES.neutral, style)}
    >
      {message}
    </div>
  );
}
