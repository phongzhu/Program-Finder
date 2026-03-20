import { useState } from 'react';

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

export default function PersonnelLoginPage({ navigate, onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onLogin(form);

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
              <span className="login-role-pill">Private Staff Portal</span>
              <h1>Restricted access for internal teams</h1>
              <p>
                This direct link is reserved for Admin and Government Personnel accounts. Applicant
                credentials are blocked on this page.
              </p>
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
              <p className="login-panel-eyebrow">Admin and Government Personnel</p>
              <h2>Private Sign In</h2>
              <p className="login-panel-text">
                Enter an approved staff account and the app will send you to the correct dashboard.
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
                    placeholder="admin@gmail.com or personnel@gmail.com"
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

                <button
                  className="login-text-link"
                  onClick={() => navigate('/login/applicant')}
                  type="button"
                >
                  Applicant portal
                </button>
              </div>

              {error ? <div className="form-error login-form-error">{error}</div> : null}

              <button className="login-submit-button" type="submit">
                <ArrowIcon />
                <span>Sign In</span>
              </button>
            </form>

            <div className="login-footer">
              <p>Allowed demo accounts: admin@gmail.com and personnel@gmail.com</p>

              <div className="login-footer-links">
                <button className="login-footer-link" onClick={() => navigate('/login/admin')} type="button">
                  Admin login
                </button>
                <button className="login-footer-link" onClick={() => navigate('/login/personnel')} type="button">
                  Personnel login
                </button>
                <button className="login-footer-link" onClick={() => navigate('/')} type="button">
                  Home
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
