import { useEffect, useRef, useState } from 'react';
import { ROLE_LABELS } from 'Data/appConstants';
import { AuthField, AuthSelectField } from 'Components/Auth/AuthField';
import { ArrowIcon, LockIcon, MailIcon, MapPinIcon, PhoneIcon, UserIcon } from 'Components/Auth/AuthIcons';
import { AuthPortalShell } from 'Components/Auth/AuthPortalShell';
import { AuthPrompt } from 'Components/Auth/AuthSupportActions';

const LOGIN_COPY = {
  personnel: {
    portalLabel: 'Government Personnel Portal',
    portalTitle: 'Official Personnel Access',
    welcomeText:
      'Secure access for authorized personnel managing official programs and applicant services.',
    portalHighlights: [
      'Role-based access for provincial, municipal, and barangay staff.',
      'Official workspace for program, notice, and application review tasks.',
      'Structured access to records, reports, and service coordination tools.',
    ],
    portalMeta: [
      { label: 'Authority', value: 'Province of Bulacan' },
      { label: 'Access Scope', value: 'Authorized staff only' },
      { label: 'Channel', value: 'Official government portal' },
    ],
  },
  applicant: {
    portalLabel: 'Applicant Portal',
    portalTitle: 'Official Applicant Access',
    welcomeText:
      'Secure access for residents applying to official services and assistance programs.',
    portalHighlights: [
      'Continue applications, upload requirements, and review notices.',
      'Track processing status through a single resident portal.',
      'Access official services published for the Province of Bulacan.',
    ],
    portalMeta: [
      { label: 'Authority', value: 'Province of Bulacan' },
      { label: 'Access Scope', value: 'Resident applicant services' },
      { label: 'Channel', value: 'Official public portal' },
    ],
  },
};

const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

function getApplicantPanelCopy(mode, hasResetRequest) {
  if (mode === 'signup') {
    return {
      eyebrow: 'Applicant Portal Registration',
      title: 'Create Applicant Account',
      text:
        'Register a resident applicant account. An email OTP is required before the account is activated.',
      submitLabel: 'Create Account',
    };
  }

  if (mode === 'verify-signup') {
    return {
      eyebrow: 'Applicant Email Verification',
      title: 'Activate Applicant Account',
      text:
        'Enter the 6-digit OTP sent to your email address to activate your account.',
      submitLabel: 'Verify OTP',
    };
  }

  if (mode === 'forgot' && hasResetRequest) {
    return {
      eyebrow: 'Applicant Password Recovery',
      title: 'Set New Password',
      text:
        'Enter the reset code generated for this applicant account, then choose a new password.',
      submitLabel: 'Update Password',
    };
  }

  if (mode === 'forgot') {
    return {
      eyebrow: 'Applicant Password Recovery',
      title: 'Forgot Password',
      text:
        'Enter the applicant email address to start password recovery.',
      submitLabel: 'Generate Reset Code',
    };
  }

  return {
    eyebrow: 'Applicant Portal',
    title: 'Sign In',
    text:
      'Access your applicant dashboard, saved programs, uploaded requirements, and application status updates.',
    submitLabel: 'Sign In',
  };
}

export function RoleLoginPage({
  role,
  navigate,
  onLogin,
  onRegisterApplicant,
  onResendApplicantSignupCode,
  onRequestApplicantPasswordReset,
  onResetApplicantPassword,
  onVerifyApplicantSignup,
  authMode = 'signin',
  locations = { municipalities: [], barangays: [] },
}) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    municipality: '',
    barangay: '',
    houseNumber: '',
    streetName: '',
    subdivisionArea: '',
    zipCode: '',
    phone: '',
    alternateContactNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotForm, setForgotForm] = useState({
    email: '',
    resetCode: '',
    password: '',
    confirmPassword: '',
  });
  const [otpForm, setOtpForm] = useState({ otp: '' });
  const [pendingSignup, setPendingSignup] = useState(null);
  const [mode, setMode] = useState(authMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [resetRequest, setResetRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelBodyRef = useRef(null);
  const otpInputRefs = useRef([]);

  const copy = LOGIN_COPY[role];
  const isApplicantPortal = role === 'applicant';
  const hasOtpStatus = /otp/i.test(statusMessage);
  const activeMode = isApplicantPortal && (pendingSignup || hasOtpStatus) ? 'verify-signup' : mode;
  const applicantPanelCopy = getApplicantPanelCopy(activeMode, Boolean(resetRequest));
  const panelEyebrow = isApplicantPortal ? applicantPanelCopy.eyebrow : `${ROLE_LABELS[role]} Portal`;
  const panelTitle = isApplicantPortal ? applicantPanelCopy.title : 'Sign In';
  const panelText = isApplicantPortal
    ? applicantPanelCopy.text
    : 'Access your assigned account and continue to the official portal workspace.';
  const submitLabel = isApplicantPortal ? applicantPanelCopy.submitLabel : 'Sign In';
  const panelMode = !isApplicantPortal || activeMode === 'signin' ? 'signin' : activeMode;
  const applicantMunicipalityOptions = [...new Set((locations.municipalities || []).map(({ name }) => name).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const applicantBarangayOptions = (locations.barangays || [])
    .filter((barangay) => barangay.municipality === signupForm.municipality)
    .map((barangay) => barangay.name)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  const pendingSignupEmail = pendingSignup?.email || signupForm.email || form.email;

  useEffect(() => {
    setMode(authMode || 'signin');
    setError('');

    if (authMode !== 'forgot') {
      setResetRequest(null);
      setForgotForm((current) => ({
        ...current,
        resetCode: '',
        password: '',
        confirmPassword: '',
      }));
    }

    if (authMode !== 'verify-signup') {
      setOtpForm({ otp: '' });
      setPendingSignup(null);
    }
  }, [authMode]);

  useEffect(() => {
    if (!panelBodyRef.current) {
      return;
    }

    panelBodyRef.current.scrollTop = 0;
  }, [activeMode, resetRequest]);

  const updateOtpDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const digits = otpForm.otp.padEnd(6, ' ').slice(0, 6).split('');
    digits[index] = digit;
    const nextOtp = digits.join('').replace(/\s/g, '');
    setOtpForm({ otp: nextOtp });

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpForm.otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const openApplicantMode = (nextMode) => {
    const nextRoute =
      nextMode === 'signup'
        ? '/login/applicant/signup'
        : nextMode === 'verify-signup'
          ? '/login/applicant/verify-signup'
        : nextMode === 'forgot'
          ? '/login/applicant/forgot-password'
          : '/login/applicant';

    navigate(nextRoute);
    setMode(nextMode);
    setError('');
    setStatusMessage('');

    if (nextMode === 'signin') {
      setResetRequest(null);
      setPendingSignup(null);
      setOtpForm({ otp: '' });
      setForgotForm((current) => ({
        ...current,
        resetCode: '',
        password: '',
        confirmPassword: '',
      }));
      return;
    }

    if (nextMode === 'signup') {
      setPendingSignup(null);
      setOtpForm({ otp: '' });
      setSignupForm((current) => ({
        ...current,
        email: current.email || form.email,
      }));
      return;
    }

    if (nextMode === 'forgot') {
      setResetRequest(null);
      setForgotForm({
        email: forgotForm.email || form.email,
        resetCode: '',
        password: '',
        confirmPassword: '',
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!isApplicantPortal || activeMode === 'signin') {
      const result = await onLogin(role, form);

      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setError('');
      setStatusMessage('');
      setIsSubmitting(false);
      return;
    }

    if (activeMode === 'signup') {
      const result = await onRegisterApplicant(signupForm);

      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setError('');
      setPendingSignup({ ...signupForm, email: result.email || signupForm.email });
      setOtpForm({ otp: '' });
      setMode('verify-signup');
      navigate('/login/applicant/verify-signup');
      setStatusMessage(`Enter the OTP sent to ${result.email || signupForm.email}.`);
      setIsSubmitting(false);
      return;
    }

    if (activeMode === 'verify-signup') {
      const verificationPayload = {
        ...(pendingSignup || signupForm),
        email: pendingSignupEmail,
        otp: otpForm.otp,
      };
      const result = await onVerifyApplicantSignup(verificationPayload);

      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setError('');
      setStatusMessage('');
      setIsSubmitting(false);
      return;
    }

    if (!resetRequest) {
      const result = await onRequestApplicantPasswordReset({ email: forgotForm.email });

      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setError('');
      setResetRequest({ email: result.email, resetCode: result.resetCode });
      setForgotForm({
        email: result.email,
        resetCode: '',
        password: '',
        confirmPassword: '',
      });
      setStatusMessage('Check your email for the official password reset link, then enter your new password here.');
      setIsSubmitting(false);
      return;
    }

    const result = await onResetApplicantPassword({
      email: resetRequest.email,
      resetCode: forgotForm.resetCode,
      password: forgotForm.password,
      confirmPassword: forgotForm.confirmPassword,
    });

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setError('');
    setResetRequest(null);
    setForm((current) => ({
      ...current,
      email: forgotForm.email,
      password: '',
    }));
    setForgotForm({
      email: forgotForm.email,
      resetCode: '',
      password: '',
      confirmPassword: '',
    });
    setMode('signin');
    navigate('/login/applicant');
    setStatusMessage('Password updated. Sign in with the applicant email address and the new password.');
    setIsSubmitting(false);
  };

  const applicantPrompt =
    !isApplicantPortal
      ? null
      : activeMode === 'signin'
        ? {
            context: 'New to the portal',
            label: 'Create applicant account',
            onClick: () => openApplicantMode('signup'),
          }
        : activeMode === 'verify-signup'
          ? {
              context: 'Wrong email or no code',
              label: 'Start signup again',
              onClick: () => openApplicantMode('signup'),
            }
        : {
            context: activeMode === 'signup' ? 'Already registered' : 'Back to applicant access',
            label: 'Return to sign in',
            onClick: () => openApplicantMode('signin'),
          };

  const footer = !isApplicantPortal ? (
    <p className="pf-auth-footer-note">
      Need account assistance?{' '}
      <button className="pf-auth-footer-link" onClick={() => navigate('/')} type="button">
        Return to the public portal
      </button>
    </p>
  ) : null;

  return (
    <AuthPortalShell
      footer={footer}
      onBackHome={() => navigate('/')}
      panelMode={panelMode}
      panelBodyRef={panelBodyRef}
      panelEyebrow={panelEyebrow}
      panelText={panelText}
      panelTitle={panelTitle}
      promo={copy}
    >
      <form
        className={`pf-auth-form ${isApplicantPortal ? `is-${activeMode}-mode` : 'is-signin-mode'}`}
        onSubmit={handleSubmit}
      >
        {isApplicantPortal && activeMode === 'signup' ? (
          <>
            <AuthField
              autoComplete="given-name"
              icon={<UserIcon />}
              label="First Name"
              onChange={(event) => setSignupForm({ ...signupForm, firstName: event.target.value })}
              placeholder="Juan"
              value={signupForm.firstName}
            />
            <AuthField
              autoComplete="additional-name"
              icon={<UserIcon />}
              label="Middle Name"
              onChange={(event) => setSignupForm({ ...signupForm, middleName: event.target.value })}
              placeholder="Optional"
              value={signupForm.middleName}
            />
            <AuthField
              autoComplete="family-name"
              icon={<UserIcon />}
              label="Last Name"
              onChange={(event) => setSignupForm({ ...signupForm, lastName: event.target.value })}
              placeholder="Dela Cruz"
              value={signupForm.lastName}
            />
            <AuthSelectField
              autoComplete="honorific-suffix"
              icon={<UserIcon />}
              label="Suffix"
              onChange={(event) => setSignupForm({ ...signupForm, suffix: event.target.value })}
              options={SUFFIX_OPTIONS}
              placeholder="No suffix"
              value={signupForm.suffix}
            />
            <AuthField
              autoComplete="email"
              icon={<MailIcon />}
              label="Email Address"
              onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
              placeholder="name@example.com"
              type="email"
              value={signupForm.email}
            />
            <AuthSelectField
              autoComplete="address-level2"
              icon={<MapPinIcon />}
              label="Municipality"
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  municipality: event.target.value,
                  barangay: '',
                }))
              }
              options={applicantMunicipalityOptions}
              placeholder="Select your municipality"
              value={signupForm.municipality}
            />
            <AuthSelectField
              autoComplete="address-level3"
              disabled={!signupForm.municipality}
              icon={<MapPinIcon />}
              label="Barangay"
              onChange={(event) => setSignupForm({ ...signupForm, barangay: event.target.value })}
              options={applicantBarangayOptions}
              placeholder={signupForm.municipality ? 'Select your barangay' : 'Select municipality first'}
              value={signupForm.barangay}
            />
            <AuthField
              autoComplete="address-line1"
              icon={<MapPinIcon />}
              label="House Number"
              onChange={(event) => setSignupForm({ ...signupForm, houseNumber: event.target.value })}
              placeholder="House or unit number"
              value={signupForm.houseNumber}
            />
            <AuthField
              autoComplete="address-line2"
              icon={<MapPinIcon />}
              label="Street Name"
              onChange={(event) => setSignupForm({ ...signupForm, streetName: event.target.value })}
              placeholder="Street name"
              value={signupForm.streetName}
            />
            <AuthField
              autoComplete="address-line3"
              icon={<MapPinIcon />}
              label="Subdivision / Area"
              onChange={(event) => setSignupForm({ ...signupForm, subdivisionArea: event.target.value })}
              placeholder="Subdivision, purok, or area"
              value={signupForm.subdivisionArea}
            />
            <AuthField
              autoComplete="postal-code"
              icon={<MapPinIcon />}
              label="Zip Code"
              onChange={(event) => setSignupForm({ ...signupForm, zipCode: event.target.value })}
              placeholder="3000"
              value={signupForm.zipCode}
            />
            <AuthField
              autoComplete="tel"
              icon={<PhoneIcon />}
              label="Mobile Number"
              onChange={(event) => setSignupForm({ ...signupForm, phone: event.target.value })}
              placeholder="09XXXXXXXXXX"
              type="tel"
              value={signupForm.phone}
            />
            <AuthField
              autoComplete="tel"
              icon={<PhoneIcon />}
              label="Alternate Contact"
              onChange={(event) => setSignupForm({ ...signupForm, alternateContactNumber: event.target.value })}
              placeholder="Optional"
              type="tel"
              value={signupForm.alternateContactNumber}
            />
            <AuthField
              autoComplete="new-password"
              icon={<LockIcon />}
              label="Password"
              onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
              placeholder="Create a password"
              showToggle
              toggleOpen={showSignupPassword}
              onToggle={() => setShowSignupPassword((current) => !current)}
              value={signupForm.password}
            />
            <AuthField
              autoComplete="new-password"
              icon={<LockIcon />}
              label="Confirm Password"
              onChange={(event) => setSignupForm({ ...signupForm, confirmPassword: event.target.value })}
              placeholder="Re-enter your password"
              showToggle
              toggleOpen={showSignupConfirmPassword}
              onToggle={() => setShowSignupConfirmPassword((current) => !current)}
              value={signupForm.confirmPassword}
            />
          </>
        ) : null}

        {isApplicantPortal && activeMode === 'forgot' ? (
          <>
            <AuthField
              autoComplete="email"
              disabled={Boolean(resetRequest)}
              icon={<MailIcon />}
              label="Applicant Email Address"
              onChange={(event) => setForgotForm({ ...forgotForm, email: event.target.value })}
              placeholder="Enter your email address"
              type="email"
              value={forgotForm.email}
            />

            {resetRequest ? (
              <>
                <AuthField
                  autoComplete="one-time-code"
                  icon={<LockIcon />}
                  label="Reset Code"
                  onChange={(event) => setForgotForm({ ...forgotForm, resetCode: event.target.value })}
                  placeholder="Enter the 6-digit code"
                  value={forgotForm.resetCode}
                />
                <AuthField
                  autoComplete="new-password"
                  icon={<LockIcon />}
                  label="New Password"
                  onChange={(event) => setForgotForm({ ...forgotForm, password: event.target.value })}
                  placeholder="Create a new password"
                  showToggle
                  toggleOpen={showResetPassword}
                  onToggle={() => setShowResetPassword((current) => !current)}
                  value={forgotForm.password}
                />
                <AuthField
                  autoComplete="new-password"
                  icon={<LockIcon />}
                  label="Confirm New Password"
                  onChange={(event) => setForgotForm({ ...forgotForm, confirmPassword: event.target.value })}
                  placeholder="Re-enter the new password"
                  showToggle
                  toggleOpen={showResetConfirmPassword}
                  onToggle={() => setShowResetConfirmPassword((current) => !current)}
                  value={forgotForm.confirmPassword}
                />
              </>
            ) : null}
          </>
        ) : null}

        {isApplicantPortal && activeMode === 'verify-signup' ? (
          <>
            <div className="pf-auth-otp-panel">
              <span>OTP sent to</span>
              <strong>{pendingSignupEmail || 'your email address'}</strong>
            </div>
            <div className="pf-auth-otp-screen">
              <span className="pf-auth-field-label">6-Digit Verification OTP</span>
              <div className="pf-auth-otp-grid" aria-label="Enter the 6-digit OTP">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    className="pf-auth-otp-digit"
                    inputMode="numeric"
                    key={`otp-${index}`}
                    maxLength={1}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    ref={(element) => {
                      otpInputRefs.current[index] = element;
                    }}
                    type="text"
                    value={otpForm.otp[index] || ''}
                  />
                ))}
              </div>
            </div>
            <button
              className="pf-auth-secondary-action"
              onClick={async () => {
                const email = pendingSignupEmail;
                const result = await onResendApplicantSignupCode(email);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setError('');
                setStatusMessage(`A new OTP was sent to ${result.email}.`);
              }}
              type="button"
            >
              Resend OTP
            </button>
          </>
        ) : null}

        {(!isApplicantPortal || activeMode === 'signin') ? (
          <>
            <AuthField
              autoComplete="email"
              icon={<MailIcon />}
              label="Email Address"
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Enter your email address"
              type="email"
              value={form.email}
            />

            <AuthField
              autoComplete="current-password"
              icon={<LockIcon />}
              label="Password"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter your password"
              showToggle
              toggleOpen={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              value={form.password}
            />

            <div
              className="pf-auth-inline-link-row"
              style={{
                alignItems: 'center',
                justifyContent: isApplicantPortal ? 'space-between' : 'flex-end',
                gap: isApplicantPortal ? '0.9rem' : '0',
                marginTop: '-0.05rem',
              }}
            >
              {isApplicantPortal ? (
                <button className="pf-auth-inline-link" onClick={() => navigate('/')} type="button">
                  Back to landing page
                </button>
              ) : null}
              <button
                className="pf-auth-inline-link pf-auth-forgot-link"
                onClick={isApplicantPortal ? () => openApplicantMode('forgot') : () => navigate('/')}
                type="button"
              >
                Forgot password?
              </button>
            </div>
          </>
        ) : null}

        {statusMessage ? <div className="pf-auth-status">{statusMessage}</div> : null}
        {error ? <div className="pf-auth-error">{error}</div> : null}

        <button className="pf-auth-submit" disabled={isSubmitting} type="submit">
          <ArrowIcon />
          <span>{isSubmitting ? 'Please wait...' : submitLabel}</span>
        </button>
      </form>

      {isApplicantPortal && applicantPrompt ? (
        <AuthPrompt
          context={applicantPrompt.context}
          label={applicantPrompt.label}
          onClick={applicantPrompt.onClick}
        />
      ) : null}
    </AuthPortalShell>
  );
}
