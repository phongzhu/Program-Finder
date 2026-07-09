import { AppButton } from 'Components/UI';

const PORTAL_ACTION_BASE_STYLE = {
  minHeight: '3rem',
  padding: '0.72rem 1.22rem',
  borderRadius: '0.55rem',
  fontFamily: 'var(--pf-font-body, var(--font-body))',
  fontSize: '0.92rem',
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
};

const PORTAL_LOGIN_BUTTON_STYLE = {
  ...PORTAL_ACTION_BASE_STYLE,
  border: '1px solid color-mix(in srgb, var(--pf-setting-primary, var(--pf-accent)) 14%, transparent)',
  background: 'var(--pf-setting-tertiary, var(--pf-card))',
  color: 'var(--pf-setting-on-tertiary, var(--pf-on-tertiary))',
  boxShadow: '0 10px 22px rgba(13, 28, 45, 0.06)',
};

const PORTAL_SIGNUP_BUTTON_STYLE = {
  ...PORTAL_ACTION_BASE_STYLE,
  border: '1px solid var(--pf-setting-primary, var(--pf-accent))',
  background: 'var(--pf-setting-primary, var(--pf-accent))',
  color: 'var(--pf-setting-tertiary-text, var(--pf-on-primary))',
  boxShadow: '0 12px 24px rgba(16, 39, 65, 0.12)',
};

export function PublicPortalActions({
  className,
  fullWidth = false,
  onOpenApplicantPortal,
  onOpenApplicantSignup,
}) {
  const handleApplicantSignup = onOpenApplicantSignup || onOpenApplicantPortal;

  return (
    <div className={className}>
      <AppButton
        fullWidth={fullWidth}
        onClick={onOpenApplicantPortal}
        variant="plain"
        style={PORTAL_LOGIN_BUTTON_STYLE}
      >
        Log In
      </AppButton>
      <AppButton
        fullWidth={fullWidth}
        onClick={handleApplicantSignup}
        variant="plain"
        style={PORTAL_SIGNUP_BUTTON_STYLE}
        labelClassName="pf-portal-signup-label"
      >
        Sign Up &rarr;
      </AppButton>
    </div>
  );
}

export default PublicPortalActions;
