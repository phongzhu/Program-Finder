import { useEffect, useState } from 'react';
import './Assets/Styles/App.css';
import './Assets/Styles/SidebarTheme.css';
import './Assets/Styles/LandingTheme.css';
import { DashboardLayout } from 'Components/Layouts/DashboardLayout';
import { getModulesForRole } from 'Services/Navigation/moduleRegistry';
import { getScreensForRole } from 'Services/Navigation/screenRegistry';
import { useProgramFinderApp } from 'Context/useProgramFinderApp';
import AuthCallback from 'Pages/Auth/AuthCallback';
import { RoleLoginPage } from 'Pages/Auth/screens';
import PublicLandingPage from 'Pages/Public/PublicLandingPage';
import { ActionButton, ConfirmationDialog, ModalShell, Toast } from 'Components/UI';
import { EyeIcon, LockIcon } from 'Components/Auth/AuthIcons';
import { useConfirmationDialog } from 'Hooks/useConfirmationDialog';

function StaffPasswordField({ label, value, onChange, visible, onToggle, autoComplete }) {
  return (
    <label className="staff-password-field">
      <span className="staff-password-label">{label}</span>
      <span className="staff-password-control">
        <span className="staff-password-icon"><LockIcon /></span>
        <input
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="staff-password-toggle"
          onClick={onToggle}
          type="button"
        >
          <EyeIcon open={visible} />
        </button>
      </span>
    </label>
  );
}

function App() {
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  return <AppShell />;
}

function AppShell() {
  const [staffPasswordForm, setStaffPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [staffPasswordError, setStaffPasswordError] = useState('');
  const [isStaffPasswordSubmitting, setIsStaffPasswordSubmitting] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [showStaffConfirmPassword, setShowStaffConfirmPassword] = useState(false);
  const {
    path,
    session,
    data,
    toast,
    navigate,
    login,
    registerApplicant,
    resendApplicantSignupCode,
    requestApplicantPasswordReset,
    resetApplicantPassword,
    verifyApplicantSignup,
    logout,
    reset,
    roleFromPath,
    sectionFromPath,
    loginRoleFromPath,
    authModeFromPath,
    actions,
  } = useProgramFinderApp();
  const {
    confirmation,
    requestConfirmation,
    closeConfirmation,
    approveConfirmation,
  } = useConfirmationDialog();

  const actionsWithConfirmation = {
    ...actions,
    requestConfirmation,
  };
  const showFirstLoginPasswordModal = Boolean(session?.mustChangePassword);
  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      met: staffPasswordForm.password.length >= 8,
    },
    {
      label: 'Contains a letter',
      met: /[A-Za-z]/.test(staffPasswordForm.password),
    },
    {
      label: 'Contains a number',
      met: /\d/.test(staffPasswordForm.password),
    },
    {
      label: 'Passwords match',
      met: Boolean(staffPasswordForm.password) && staffPasswordForm.password === staffPasswordForm.confirmPassword,
    },
  ];

  const handleStaffPasswordChange = async () => {
    setIsStaffPasswordSubmitting(true);
    const result = await actions.updateStaffPasswordAfterFirstLogin(staffPasswordForm);
    setIsStaffPasswordSubmitting(false);

    if (!result.ok) {
      setStaffPasswordError(result.error);
      return;
    }

    setStaffPasswordError('');
    setStaffPasswordForm({ password: '', confirmPassword: '' });
  };

  const unreadNotificationCount = session
    ? data.notifications.filter(
        (notification) =>
          (notification.recipientUserId === session.id ||
            notification.recipient === session.id ||
            notification.recipient === session.email) &&
          (notification.unread || notification.isRead === false)
      ).length
    : 0;
  const sessionNotifications = session
    ? data.notifications.filter(
        (notification) =>
          notification.recipientUserId === session.id ||
          notification.recipient === session.id ||
          notification.recipient === session.email
      )
    : [];

  const logoutWithConfirmation = () => {
    requestConfirmation({
      title: 'Sign out?',
      message: 'Make sure your current work is complete before leaving this workspace.',
      confirmLabel: 'Sign Out',
      tone: 'danger',
      onConfirm: logout,
    });
  };

  let screen = null;
  const navItems = roleFromPath ? getModulesForRole(roleFromPath, session) : [];
  const screenRegistry = roleFromPath ? getScreensForRole(roleFromPath, session) : {};
  const applicantSurveyCompleted = Boolean(data.applicantProfile?.searchSurvey?.completedAt);
  const lockApplicantOnboarding =
    Boolean(session) &&
    roleFromPath === 'applicant' &&
    !applicantSurveyCompleted;
  const activeApplicantSection = lockApplicantOnboarding ? 'onboarding-survey' : sectionFromPath;

  useEffect(() => {
    if (lockApplicantOnboarding && sectionFromPath !== 'onboarding-survey') {
      navigate('/applicant/onboarding-survey', { replace: true });
    }
  }, [lockApplicantOnboarding, navigate, sectionFromPath]);

  if (path === '/') {
    screen = <PublicLandingPage data={data} navigate={navigate} />;
  } else if (loginRoleFromPath) {
    screen = (
      <RoleLoginPage
        navigate={navigate}
        onLogin={login}
        onRegisterApplicant={registerApplicant}
        onResendApplicantSignupCode={resendApplicantSignupCode}
        onRequestApplicantPasswordReset={requestApplicantPasswordReset}
        onResetApplicantPassword={resetApplicantPassword}
        onVerifyApplicantSignup={verifyApplicantSignup}
        authMode={authModeFromPath}
        locations={{
          municipalities: data.municipalities,
          barangays: data.barangays,
        }}
        role={loginRoleFromPath}
      />
    );
  } else if (session && roleFromPath && Object.keys(screenRegistry).length) {
    const screenConfig = screenRegistry[activeApplicantSection];
    const ScreenComponent = screenConfig?.component;

    screen = (
      <DashboardLayout
        heading={screenConfig?.heading}
        hideHeader={roleFromPath === 'personnel'}
          hideSidebar={lockApplicantOnboarding}
        lockNavigationChrome={lockApplicantOnboarding}
        navItems={navItems}
        navigate={navigate}
        notificationCount={unreadNotificationCount}
        notifications={sessionNotifications}
        onLogout={logoutWithConfirmation}
        onOpenNotifications={
          ['applicant', 'personnel'].includes(roleFromPath)
            ? () => {
                navigate(`/${roleFromPath}/notifications`);
              }
            : null
        }
        onMarkNotificationRead={actions.markNotificationRead}
        onMarkAllNotificationsRead={actions.markNotificationsRead}
        onReset={reset}
        role={roleFromPath}
        section={activeApplicantSection}
        session={session}
        subheading={screenConfig?.subheading}
      >
        {ScreenComponent ? (
          <ScreenComponent
            actions={actionsWithConfirmation}
            data={data}
            navigate={navigate}
            session={session}
          />
        ) : null}
      </DashboardLayout>
    );
  }

  return (
    <div className={`app-shell ${path === '/' ? 'app-shell-public-home' : ''}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      {screen}
      <ConfirmationDialog
        confirmation={confirmation}
        onClose={closeConfirmation}
        onConfirm={approveConfirmation}
      />
      {showFirstLoginPasswordModal ? (
        <ModalShell
          hideClose
          title="Set new password"
          text="Replace the temporary password before opening your workspace."
          onClose={() => {}}
          footer={(
            <ActionButton disabled={isStaffPasswordSubmitting} tone="primary" onClick={handleStaffPasswordChange}>
              {isStaffPasswordSubmitting ? 'Saving...' : 'Save New Password'}
            </ActionButton>
          )}
        >
          <div className="staff-password-shell">
            <div className="staff-password-banner">
              <div className="staff-password-mark"><LockIcon /></div>
              <div>
                <strong>Secure your personnel account</strong>
                <p>Use a private password that includes letters and numbers.</p>
              </div>
            </div>

            <div className="staff-password-grid">
              <StaffPasswordField
                autoComplete="new-password"
                label="New password"
                onChange={(value) => setStaffPasswordForm({ ...staffPasswordForm, password: value })}
                onToggle={() => setShowStaffPassword((current) => !current)}
                value={staffPasswordForm.password}
                visible={showStaffPassword}
              />
              <StaffPasswordField
                autoComplete="new-password"
                label="Confirm password"
                onChange={(value) => setStaffPasswordForm({ ...staffPasswordForm, confirmPassword: value })}
                onToggle={() => setShowStaffConfirmPassword((current) => !current)}
                value={staffPasswordForm.confirmPassword}
                visible={showStaffConfirmPassword}
              />
            </div>

            <div className="staff-password-rules" aria-label="Password requirements">
              {passwordRequirements.map((requirement) => (
                <span className={requirement.met ? 'is-met' : ''} key={requirement.label}>
                  {requirement.label}
                </span>
              ))}
            </div>
          </div>
          {staffPasswordError ? <div className="pf-auth-error">{staffPasswordError}</div> : null}
        </ModalShell>
      ) : null}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}

export default App;
