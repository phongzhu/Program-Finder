import { useState } from 'react';
import { PROTOTYPE_ACCOUNTS, ROLE_LABELS } from '../../data/prototypeSeed';

const LOGIN_COPY = {
  admin: {
    portalLabel: 'Admin Portal',
    welcomeText:
      'Secure access for platform oversight, office governance, reports, settings, and system-wide administration.',
  },
  personnel: {
    portalLabel: 'Government Personnel Portal',
    welcomeText:
      'Manage office programs, review submissions, send announcements, and monitor application progress from one workspace.',
  },
  applicant: {
    portalLabel: 'Applicant Portal',
    welcomeText:
      'Check program availability, continue your application, upload requirements, and stay updated on every status change.',
  },
};

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M4 6.75h16A1.25 1.25 0 0 1 21.25 8v8A1.25 1.25 0 0 1 20 17.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m3.5 8 7.62 5.6a1.5 1.5 0 0 0 1.76 0L20.5 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M7.75 10.25V8.75a4.25 4.25 0 1 1 8.5 0v1.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <rect
        x="4.75"
        y="10.25"
        width="14.5"
        height="9"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M2.75 12S6.25 6.75 12 6.75 21.25 12 21.25 12 17.75 17.25 12 17.25 2.75 12 2.75 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M3 3.75 21 20.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M10.58 6.9A10.77 10.77 0 0 1 12 6.75c5.75 0 9.25 5.25 9.25 5.25a15.57 15.57 0 0 1-3.15 3.52"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M6.7 9.22A15.08 15.08 0 0 0 2.75 12S6.25 17.25 12 17.25a10.8 10.8 0 0 0 3.13-.44"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M10.41 10.42A2.33 2.33 0 0 0 9.75 12 2.25 2.25 0 0 0 12 14.25a2.34 2.34 0 0 0 1.58-.66"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M5 12h14M13.25 5.75 19.5 12l-6.25 6.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M21.5 12.27c0-.76-.07-1.49-.19-2.19H12v4.15h5.32a4.53 4.53 0 0 1-1.97 2.97v2.46h3.2c1.88-1.73 2.95-4.29 2.95-7.39Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.67 0 4.92-.88 6.55-2.39l-3.2-2.46c-.89.6-2.02.95-3.35.95-2.58 0-4.76-1.74-5.54-4.08H3.16v2.54A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.46 14.02A5.99 5.99 0 0 1 6.15 12c0-.7.12-1.38.31-2.02V7.44H3.16A9.99 9.99 0 0 0 2 12c0 1.61.38 3.14 1.16 4.56l3.3-2.54Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.45 0 2.74.5 3.76 1.47l2.82-2.82C16.91 2.98 14.67 2 12 2a9.99 9.99 0 0 0-8.84 5.44l3.3 2.54C7.24 7.64 9.42 5.9 12 5.9Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function RoleLoginPage({ role, navigate, onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const copy = LOGIN_COPY[role];
  const account = PROTOTYPE_ACCOUNTS[role];

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onLogin(role, form);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-stage">
        <section className="login-promo">
          <div className="login-promo-inner">
            <button className="login-brand-mark" onClick={() => navigate('/')} type="button">
              PF
            </button>

            <div className="login-promo-copy">
              <span className="login-role-pill">{copy.portalLabel}</span>
              <h1>Welcome to ProgramFinder Bulacan</h1>
              <p>{copy.welcomeText}</p>
            </div>

            <div className="login-promo-foot">
              <button className="inline-link login-home-link" onClick={() => navigate('/')} type="button">
                Back to home
              </button>
            </div>
          </div>
        </section>

        <section className="login-panel-shell">
          <div className="login-panel">
            <div className="login-panel-header">
              <p className="login-panel-eyebrow">{ROLE_LABELS[role]} Portal</p>
              <h2>Sign In</h2>
              <p className="login-panel-text">
                Access your account and continue with your assigned portal workspace.
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-field">
                <span>Email Address</span>
                <div className="login-input-wrap">
                  <span className="login-field-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder={account.email}
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-input-wrap">
                  <span className="login-field-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    className="login-icon-button"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </label>

              <div className="login-meta-row">
                <label className="login-checkbox">
                  <input
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Remember me</span>
                </label>

                <button className="login-text-link" onClick={() => navigate('/')} type="button">
                  Forgot password?
                </button>
              </div>

              {error ? <div className="form-error login-form-error">{error}</div> : null}

              <button className="login-submit-button" type="submit">
                <ArrowIcon />
                <span>Sign In</span>
              </button>

              <div className="login-divider">
                <span>Or continue with</span>
              </div>

              <button className="login-provider-button" onClick={() => navigate('/')} type="button">
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don&apos;t have an account?{' '}
                <button className="login-text-link" onClick={() => navigate('/')} type="button">
                  Create one now
                </button>
              </p>

              <div className="login-footer-links">
                <button className="login-footer-link" onClick={() => navigate('/')} type="button">
                  Terms
                </button>
                <button className="login-footer-link" onClick={() => navigate('/')} type="button">
                  Privacy
                </button>
                <button className="login-footer-link" onClick={() => navigate('/')} type="button">
                  Help
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
