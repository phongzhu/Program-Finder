import { useEffect, useState } from 'react';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../data/prototypeSeed';

function getInitials(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function DashboardGlyph({ name }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4.75 12.25 12 6.5l7.25 5.75v7H4.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 19.25v-4.5h5v4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'profile-management':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.75 18.25a5.75 5.75 0 0 1 10.5 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.5 8.75h4.75M18.88 6.38v4.74" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'search-programs':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m15 15 4.25 4.25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'manage-applications':
    case 'application-management':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7.25 5.5h9.5a1.25 1.25 0 0 1 1.25 1.25v10.5a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 17.25V6.75A1.25 1.25 0 0 1 7.25 5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 9.25h6M9 12h6M9 14.75h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'user-accounts':
    case 'applicant-records':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="9" cy="9" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16.25" cy="8.25" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.75 18a4.75 4.75 0 0 1 8.5 0M14 17.5a3.5 3.5 0 0 1 5.25-2.97" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'roles-permissions':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 4.75 18 7v4.5c0 3.08-1.75 5.9-4.5 7.25L12 19.5l-1.5-.75C7.75 17.4 6 14.58 6 11.5V7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10.6 11.5 12 12.9l2.6-2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'offices-municipalities':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4.75 18.5h14.5M6.25 18.5V7.25L12 4.75l5.75 2.5V18.5M9 9.25h.01M9 12.25h.01M15 9.25h.01M15 12.25h.01M11.25 18.5v-3.75h1.5v3.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'categories-sectors':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5.25 6.5h5.5v5.5h-5.5ZM13.25 6.5h5.5v5.5h-5.5ZM5.25 14.5h5.5V20h-5.5ZM13.25 14.5h5.5V20h-5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'notifications':
    case 'bell':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7.75 10.25a4.25 4.25 0 1 1 8.5 0v2.4c0 .92.34 1.8.95 2.48l.8.87H6l.8-.87a3.73 3.73 0 0 0 .95-2.48Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10.25 18.25a1.75 1.75 0 0 0 3.5 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'announcements':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5.5 13.5V9.25a1.5 1.5 0 0 1 1.5-1.5h1.75L16.5 5.5v12l-7.75-2.25H7a1.5 1.5 0 0 1-1.5-1.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m8.75 15.25 1.25 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'bookmarks':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7.25 5h9.5v14l-4.75-2.9L7.25 19Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'program-listings':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="5.25" y="5.25" width="13.5" height="13.5" rx="2.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 9.25h7M8.5 12h7M8.5 14.75h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'eligibility-criteria':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7 6.25h10A1.75 1.75 0 0 1 18.75 8v8A1.75 1.75 0 0 1 17 17.75H7A1.75 1.75 0 0 1 5.25 16V8A1.75 1.75 0 0 1 7 6.25Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m8.75 11.75 1.5 1.5 4-4.25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'submitted-applications':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M6.25 7.25h11.5M6.25 12h11.5M6.25 16.75h7.5M5.75 4.75h12.5A1.5 1.5 0 0 1 19.75 6.25v11.5a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5V6.25a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'application-decisions':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7 5.75h10A1.25 1.25 0 0 1 18.25 7v10A1.25 1.25 0 0 1 17 18.25H7A1.25 1.25 0 0 1 5.75 17V7A1.25 1.25 0 0 1 7 5.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m8.75 12.25 1.75 1.75 4.75-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'reports':
    case 'reports-analytics':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5.5 18.5h13M8 16v-4.5M12 16V8M16 16v-6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'backup-restore':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M6.25 8.5h11.5M6.25 12h11.5M6.25 15.5h11.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.75 6.75h14.5A1.5 1.5 0 0 1 20.75 8.25v7.5a1.5 1.5 0 0 1-1.5 1.5H4.75a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5ZM12 3.75v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'audit-trail':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4.25l2.75 1.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'settings':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m9.67 4.8.5 1.9a5.9 5.9 0 0 1 3.66 0l.5-1.9 2.29.95-.5 1.91a6.2 6.2 0 0 1 1.83 1.83l1.9-.5.95 2.29-1.9.5a5.9 5.9 0 0 1 0 3.66l1.9.5-.95 2.29-1.9-.5a6.2 6.2 0 0 1-1.83 1.83l.5 1.9-2.29.95-.5-1.9a5.9 5.9 0 0 1-3.66 0l-.5 1.9-2.29-.95.5-1.9a6.2 6.2 0 0 1-1.83-1.83l-1.91.5-.95-2.29 1.9-.5a5.9 5.9 0 0 1 0-3.66l-1.9-.5.95-2.29 1.91.5A6.2 6.2 0 0 1 7.38 7.66l-.5-1.91Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'menu':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 7.5h14M5 12h14M5 16.5h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'close':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}

export function DashboardLayout({
  role,
  session,
  section,
  navItems,
  heading,
  subheading,
  navigate,
  onLogout,
  notificationCount = 0,
  onOpenNotifications = null,
  hideHeader = false,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !item.hiddenInNav);
  const activeItem = navItems.find((item) => item.key === section);
  const isApplicant = role === 'applicant';
  const isStaff = !isApplicant;
  const showStaffHeader = isStaff && section !== 'dashboard' && !hideHeader;
  const workspaceLabel = isApplicant ? 'Applicant Workspace' : `${ROLE_LABELS[role]} Workspace`;

  useEffect(() => {
    setSidebarOpen(false);
  }, [role, section]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1180) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!sidebarOpen || window.innerWidth > 1180) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleNavigate = (target) => {
    navigate(target);
    setSidebarOpen(false);
  };

  const showNotificationsButton = ['applicant', 'personnel'].includes(role) && typeof onOpenNotifications === 'function';
  const unreadNotificationCount = Math.min(notificationCount, 9);

  return (
    <div className={`dashboard-shell dashboard-shell-${role} ${isStaff ? 'dashboard-shell-staff' : ''} ${sidebarOpen ? 'has-open-sidebar' : ''}`}>
      <button
        aria-hidden={!sidebarOpen}
        className={`sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        tabIndex={sidebarOpen ? 0 : -1}
        type="button"
      />

      <aside className={`sidebar sidebar-${role} ${sidebarOpen ? 'is-open' : ''}`}>
        <button
          className="sidebar-close-button"
          onClick={() => setSidebarOpen(false)}
          type="button"
          aria-label="Close sidebar"
        >
          <DashboardGlyph name="close" />
        </button>

        <button className="brand-lockup align-left" onClick={() => handleNavigate('/')}>
          <span className="brand-mark">PF</span>
          <span>
            <strong>ProgramFinder</strong>
            <small>{workspaceLabel}</small>
          </span>
        </button>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${section === item.key ? 'is-active' : ''}`}
              onClick={() => handleNavigate(`/${role}/${item.key}`)}
            >
              <span className="nav-item-icon">
                <DashboardGlyph name={item.key} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="secondary-button full-width" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={`dashboard-main dashboard-main-${role} ${isStaff ? 'dashboard-main-staff' : ''}`}>
        {isApplicant ? (
          <div className="dashboard-topbar">
            <div className="dashboard-topbar-leading">
              <button
                className="dashboard-mobile-toggle topbar-mobile-toggle"
                onClick={() => setSidebarOpen(true)}
                type="button"
                aria-label="Open sidebar"
              >
                <DashboardGlyph name="menu" />
              </button>
            </div>
            <div className="dashboard-topbar-actions">
              {showNotificationsButton ? (
                <button
                  className="topbar-icon-button"
                  type="button"
                  aria-label="Notifications"
                  onClick={onOpenNotifications}
                >
                  <DashboardGlyph name="bell" />
                  {unreadNotificationCount ? <span className="topbar-notification-badge">{unreadNotificationCount}</span> : null}
                </button>
              ) : null}
              <button className="topbar-icon-button" type="button" aria-label="Settings">
                <DashboardGlyph name="settings" />
              </button>
              <button
                className="topbar-avatar-button"
                type="button"
                aria-label="Open profile management"
                onClick={() => handleNavigate('/applicant/profile-management')}
              >
                <span className="topbar-avatar">{getInitials(session.name)}</span>
              </button>
            </div>
          </div>
        ) : isStaff ? (
          <div className="dashboard-topbar dashboard-topbar-staff">
            <div className="dashboard-topbar-leading">
              <button
                className="dashboard-mobile-toggle topbar-mobile-toggle"
                onClick={() => setSidebarOpen(true)}
                type="button"
                aria-label="Open sidebar"
              >
                <DashboardGlyph name="menu" />
              </button>
            </div>
            <div className="dashboard-topbar-actions">
              {showNotificationsButton ? (
                <button
                  className="topbar-icon-button"
                  type="button"
                  aria-label="Notifications"
                  onClick={onOpenNotifications}
                >
                  <DashboardGlyph name="bell" />
                  {unreadNotificationCount ? <span className="topbar-notification-badge">{unreadNotificationCount}</span> : null}
                </button>
              ) : null}
              <button
                className="topbar-avatar-button"
                type="button"
                aria-label="Go to dashboard home"
                onClick={() => handleNavigate(`/${role}/dashboard`)}
              >
                <span className="topbar-avatar">{getInitials(session.name)}</span>
              </button>
            </div>
          </div>
        ) : null}

        {showStaffHeader ? (
          <header className="dashboard-header">
            <div className="dashboard-header-primary">
              <div>
                <p className="eyebrow">{workspaceLabel}</p>
                <h1>{heading}</h1>
                <p className="dashboard-text">{subheading}</p>
              </div>
            </div>
            <div className="header-summary">
              <span className="soft-badge">Active module</span>
              <strong>{activeItem?.label}</strong>
              <small>{ROLE_DESCRIPTIONS[role]}</small>
            </div>
          </header>
        ) : null}

        <section className="dashboard-content">{children}</section>
      </main>
    </div>
  );
}
