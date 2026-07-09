import { useEffect, useRef, useState } from 'react';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from 'Data/appConstants';
import { AppButton, AppCard, DashboardVectors, ProgramFinderLogo } from 'Components/UI';
import { getStaffRoleKey } from 'Utils/staffHierarchy';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'pf-dashboard-sidebar-collapsed';
const SIDEBAR_GROUP_DEFINITIONS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    iconKey: 'dashboard',
    items: ['dashboard'],
  },
  {
    key: 'municipality-management',
    label: 'Municipality Management',
    iconKey: 'offices-municipalities',
    items: ['offices-municipalities', 'program-listings', 'categories-sectors', 'application-management'],
  },
  {
    key: 'team-management',
    label: 'Team Management',
    iconKey: 'team-management',
    items: ['team-management', 'user-accounts', 'roles-permissions'],
  },
  {
    key: 'programs',
    label: 'Programs',
    iconKey: 'search-programs',
    items: ['search-programs', 'manage-applications', 'bookmarks'],
  },
  {
    key: 'reports',
    label: 'Reports',
    iconKey: 'reports',
    items: ['reports', 'reports-analytics', 'audit-trail'],
  },
  {
    key: 'system-settings',
    label: 'System Settings',
    iconKey: 'system-settings',
    items: ['system-settings', 'system-branding', 'backup-restore'],
  },
];

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
    case 'team-management':
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
    case 'system-branding':
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
    case 'collapse-sidebar':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M14.75 7.25 10 12l4.75 4.75M10 7.25 5.25 12 10 16.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'expand-sidebar':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m9.25 7.25 4.75 4.75-4.75 4.75M14 7.25 18.75 12 14 16.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'logout':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M10 6H7.75A1.75 1.75 0 0 0 6 7.75v8.5A1.75 1.75 0 0 0 7.75 18H10M14 8.25 17.75 12 14 15.75M17.75 12H9.25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function SidebarChevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m5.5 7.5 4.5 4.75 4.5-4.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function buildSidebarGroups(navItems) {
  const itemByKey = new Map(navItems.map((item) => [item.key, item]));
  const itemIndexByKey = new Map(navItems.map((item, index) => [item.key, index]));
  const usedKeys = new Set();
  const groupedEntries = [];

  SIDEBAR_GROUP_DEFINITIONS.forEach((definition) => {
    const items = definition.items.map((key) => itemByKey.get(key)).filter(Boolean);

    if (!items.length) {
      return;
    }

    items.forEach((item) => usedKeys.add(item.key));

    groupedEntries.push({
      key: definition.key,
      label: definition.label,
      iconKey: definition.iconKey || items[0].key,
      items,
      firstIndex: Math.min(...items.map((item) => itemIndexByKey.get(item.key) ?? Number.MAX_SAFE_INTEGER)),
    });
  });

  const standaloneEntries = navItems
    .filter((item) => !usedKeys.has(item.key))
    .map((item) => ({
      key: item.key,
      label: item.label,
      iconKey: item.key,
      items: [item],
      firstIndex: itemIndexByKey.get(item.key) ?? Number.MAX_SAFE_INTEGER,
    }));

  return [...groupedEntries, ...standaloneEntries]
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .map(({ firstIndex, ...entry }) => entry);
}

function getExpandedSidebarGroups(groups, currentSection) {
  return groups.reduce((expanded, group) => {
    if (group.items.length > 1) {
      expanded[group.key] = group.items.some((item) => item.key === currentSection);
    }

    return expanded;
  }, {});
}

function getPersonnelWorkspaceTheme(session) {
  const staffRole = getStaffRoleKey(session);
  const parentStaffRole = getStaffRoleKey({
    role: 'personnel',
    staffRole: session?.parentStaffRole,
    title: session?.parentStaffRole,
  });

  if (
    staffRole === 'barangay_captain' ||
    staffRole === 'barangay_secretary' ||
    parentStaffRole === 'barangay_captain' ||
    parentStaffRole === 'barangay_secretary'
  ) {
    return 'barangay-chain';
  }

  return 'captain-chain';
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
  notifications = [],
  onOpenNotifications = null,
  onMarkNotificationRead = null,
  onMarkAllNotificationsRead = null,
  hideHeader = false,
  lockNavigationChrome = false,
  hideSidebar = false,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  });
  const [isDesktopSidebar, setIsDesktopSidebar] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth > 1180;
  });
  const [hasOpenModal, setHasOpenModal] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const settingsPanelRef = useRef(null);
  const visibleNavItems = navItems.filter((item) => !item.hiddenInNav);
  const sidebarGroups = buildSidebarGroups(visibleNavItems);
  const [expandedGroups, setExpandedGroups] = useState(() => getExpandedSidebarGroups(sidebarGroups, section));
  const activeItem = navItems.find((item) => item.key === section);
  const isApplicant = role === 'applicant';
  const isStaff = !isApplicant;
  const personnelWorkspaceTheme = role === 'personnel' ? getPersonnelWorkspaceTheme(session) : null;
  const showStaffHeader = isStaff && section !== 'dashboard' && !hideHeader;
  const workspaceLabel = isApplicant ? 'Applicant Workspace' : `${session?.title || ROLE_LABELS[role]} Workspace`;
  const hideSidebarChrome = hideSidebar && isApplicant;
  const desktopSidebarCollapsed = isDesktopSidebar && sidebarCollapsed;
  const showFlatApplicantNav = (isApplicant || desktopSidebarCollapsed) && !hideSidebarChrome;
  const showMobileSidebarToggle = !hideSidebarChrome && !lockNavigationChrome && !isDesktopSidebar && !sidebarOpen;
  const showMobileSidebarClose = !hideSidebarChrome && !lockNavigationChrome && !isDesktopSidebar && sidebarOpen;
  const showDesktopSidebarToggle = !hideSidebarChrome && !lockNavigationChrome && isDesktopSidebar && !hasOpenModal;
  const expandedSidebarButtonStyle = {
    width: '100%',
    justifyContent: 'flex-start',
    textAlign: 'left',
  };
  const collapsedSidebarButtonStyle = {
    width: '100%',
    justifyContent: 'center',
    textAlign: 'center',
  };
  const sidebarNavButtonStyle = desktopSidebarCollapsed
    ? collapsedSidebarButtonStyle
    : expandedSidebarButtonStyle;
  const sidebarActionButtonStyle = desktopSidebarCollapsed
    ? { justifyContent: 'center', textAlign: 'center' }
    : { justifyContent: 'flex-start', textAlign: 'left' };

  useEffect(() => {
    setSidebarOpen(false);
  }, [role, section]);

  useEffect(() => {
    if (lockNavigationChrome) {
      setSidebarOpen(false);
      setIsNotificationMenuOpen(false);
    }
  }, [lockNavigationChrome]);

  useEffect(() => {
    const nextSidebarGroups = buildSidebarGroups(navItems.filter((item) => !item.hiddenInNav));

    setExpandedGroups((current) => {
      const next = getExpandedSidebarGroups(nextSidebarGroups, section);

      nextSidebarGroups.forEach((group) => {
        if (group.items.length < 2) {
          return;
        }

        if (Object.prototype.hasOwnProperty.call(current, group.key)) {
          next[group.key] = current[group.key];
        }

        if (group.items.some((item) => item.key === section)) {
          next[group.key] = true;
        }
      });

      return next;
    });
  }, [navItems, section]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopSidebar(window.innerWidth > 1180);
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const syncModalState = () => {
      setHasOpenModal(Boolean(document.querySelector('[aria-modal="true"]')));
    };
    const observer = new MutationObserver(syncModalState);

    syncModalState();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNotificationMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!notificationMenuRef.current) {
        return;
      }
      if (!notificationMenuRef.current.contains(event.target)) {
        setIsNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isNotificationMenuOpen]);

  useEffect(() => {
    if (!isSettingsPanelOpen) return undefined;
    const handlePointerDown = (event) => {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
        setIsSettingsPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isSettingsPanelOpen]);

  const handleNavigate = (target) => {
    navigate(target);
    setSidebarOpen(false);
  };
  const toggleSidebarGroup = (groupKey) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };
  const renderNavItem = (item, { className = '', tabIndex = undefined } = {}) => (
    <AppButton
      key={item.key}
      aria-label={desktopSidebarCollapsed ? item.label : undefined}
      className={`nav-item ${section === item.key ? 'is-active' : ''} ${className}`.trim()}
      labelClassName="nav-item-label"
      leading={<DashboardGlyph name={item.key} />}
      leadingClassName="nav-item-icon"
      onClick={() => handleNavigate(`/${role}/${item.key}`)}
      style={sidebarNavButtonStyle}
      tabIndex={tabIndex}
      title={desktopSidebarCollapsed ? item.label : undefined}
      variant="plain"
    >
      {item.label}
    </AppButton>
  );

  const showNotificationsButton = ['applicant', 'personnel'].includes(role) && typeof onOpenNotifications === 'function';
  const unreadNotificationCount = Math.min(notificationCount, 9);
  const latestNotifications = Array.isArray(notifications) ? notifications.slice(0, 6) : [];
  const canMarkSingleNotification = typeof onMarkNotificationRead === 'function';
  const canMarkAllNotifications = typeof onMarkAllNotificationsRead === 'function';

  const handleNotificationOpen = () => {
    setIsNotificationMenuOpen((current) => !current);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) {
      return;
    }

    if ((notification.unread || notification.isRead === false) && canMarkSingleNotification) {
      await onMarkNotificationRead(notification.id);
    }

    if (notification.actionRoute) {
      handleNavigate(notification.actionRoute);
    } else {
      onOpenNotifications();
    }

    setIsNotificationMenuOpen(false);
  };

  const handleOpenNotificationsScreen = async () => {
    if (canMarkAllNotifications) {
      await onMarkAllNotificationsRead();
    }
    onOpenNotifications();
    setIsNotificationMenuOpen(false);
  };

  const renderTopbarNotifications = () => {
    if (!showNotificationsButton) {
      return null;
    }

    return (
      <div className="topbar-notification-wrap" ref={notificationMenuRef}>
        <AppButton
          className="topbar-icon-button"
          aria-label="Notifications"
          leading={(
            <>
              <DashboardGlyph name="bell" />
              {unreadNotificationCount ? <span className="topbar-notification-badge">{unreadNotificationCount}</span> : null}
            </>
          )}
          onClick={handleNotificationOpen}
          variant="plain"
        />
        {isNotificationMenuOpen ? (
          <div className="topbar-notification-menu">
            <div className="topbar-notification-menu-head">
              <strong>Notifications</strong>
              {canMarkAllNotifications ? (
                <button type="button" onClick={onMarkAllNotificationsRead}>
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="topbar-notification-menu-list">
              {latestNotifications.length ? latestNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`topbar-notification-item ${(notification.unread || notification.isRead === false) ? 'is-unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="topbar-notification-item-title">{notification.title}</span>
                  <span className="topbar-notification-item-message">{notification.message}</span>
                  <span className="topbar-notification-item-time">{notification.time || 'Recent'}</span>
                </button>
              )) : (
                <div className="topbar-notification-empty">No notifications yet.</div>
              )}
            </div>
            <div className="topbar-notification-menu-foot">
              <button type="button" onClick={handleOpenNotificationsScreen}>
                View all notifications
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderSettingsPanel = () => {
    if (!isApplicant) return null;
    const initials = getInitials(session.name);
    return (
      <>
        {/* Backdrop */}
        <div
          aria-hidden="true"
          className={`settings-panel-backdrop ${isSettingsPanelOpen ? 'is-visible' : ''}`}
          onClick={() => setIsSettingsPanelOpen(false)}
        />

        {/* Drawer */}
        <aside
          ref={settingsPanelRef}
          aria-label="Settings"
          className={`settings-panel ${isSettingsPanelOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
        >
          <style>{`
            /* ── Settings panel backdrop ─────────────────────────── */
            .settings-panel-backdrop {
              position: fixed; inset: 0;
              background: rgba(20,32,50,0.35);
              z-index: 299;
              opacity: 0; pointer-events: none;
              transition: opacity 0.25s;
            }
            .settings-panel-backdrop.is-visible {
              opacity: 1; pointer-events: auto;
            }

            /* ── Settings drawer ─────────────────────────────────── */
            .settings-panel {
              position: fixed;
              top: 0; right: 0; bottom: 0;
              width: 340px;
              max-width: 92vw;
              background: #ffffff;
              border-left: 1px solid #dce4f0;
              box-shadow: -6px 0 32px rgba(20,32,50,0.12);
              z-index: 300;
              display: flex;
              flex-direction: column;
              transform: translateX(100%);
              transition: transform 0.28s cubic-bezier(0.32,0,0.08,1);
              overflow: hidden;
            }
            .settings-panel.is-open { transform: translateX(0); }

            /* header */
            .sp-head {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 18px 20px 16px;
              border-bottom: 1px solid #edf1f8;
              flex-shrink: 0;
            }
            .sp-head-title {
              font-size: 16px;
              font-weight: 700;
              color: #1a2637;
              margin: 0;
            }
            .sp-close {
              width: 32px; height: 32px;
              border-radius: 8px;
              border: 1px solid #dce4f0;
              background: #f4f7fc;
              color: #5a7090;
              display: flex; align-items: center; justify-content: center;
              cursor: pointer;
              transition: background 0.14s, color 0.14s;
              flex-shrink: 0;
            }
            .sp-close:hover { background: #e8eef9; color: #1a2637; }

            /* scrollable body */
            .sp-body {
              flex: 1;
              overflow-y: auto;
              padding: 16px 20px 24px;
              display: flex;
              flex-direction: column;
              gap: 6px;
            }

            /* account card */
            .sp-account {
              display: flex;
              align-items: center;
              gap: 14px;
              background: #f4f7fc;
              border: 1px solid #dce4f0;
              border-radius: 13px;
              padding: 14px 16px;
              margin-bottom: 10px;
            }
            .sp-avatar {
              width: 44px; height: 44px;
              border-radius: 50%;
              background: #1a3f76;
              color: #ffffff;
              font-size: 16px;
              font-weight: 700;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .sp-account-info { flex: 1; min-width: 0; }
            .sp-account-name {
              font-size: 14.5px;
              font-weight: 700;
              color: #1a2637;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sp-account-email {
              font-size: 12.5px;
              color: #5a7090;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-top: 2px;
            }

            /* section label */
            .sp-section-label {
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.09em;
              text-transform: uppercase;
              color: #8da3ba;
              padding: 10px 0 4px;
            }

            /* rows */
            .sp-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              padding: 11px 14px;
              border-radius: 10px;
              background: #f9fbff;
              border: 1px solid #edf1f8;
              transition: border-color 0.14s, background 0.14s;
            }
            .sp-row:hover { border-color: #dce4f0; background: #f4f7fc; }
            .sp-row-left {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: 1;
              min-width: 0;
            }
            .sp-row-icon {
              width: 30px; height: 30px;
              border-radius: 8px;
              background: #e8eef9;
              color: #1a3f76;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .sp-row-text { flex: 1; min-width: 0; }
            .sp-row-label {
              font-size: 13.5px;
              font-weight: 600;
              color: #1a2637;
              display: block;
              line-height: 1.3;
            }
            .sp-row-desc {
              font-size: 12px;
              color: #8da3ba;
              display: block;
              margin-top: 1px;
              line-height: 1.35;
            }
            button.sp-row {
              width: 100%;
              cursor: pointer;
              text-align: left;
            }

            /* toggle switch */
            .sp-toggle {
              position: relative;
              width: 40px; height: 22px;
              flex-shrink: 0;
            }
            .sp-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
            .sp-toggle-track {
              position: absolute; inset: 0;
              border-radius: 999px;
              background: #d8deea;
              transition: background 0.2s;
              cursor: pointer;
            }
            .sp-toggle input:checked + .sp-toggle-track { background: #1a3f76; }
            .sp-toggle-track::after {
              content: '';
              position: absolute;
              top: 3px; left: 3px;
              width: 16px; height: 16px;
              border-radius: 50%;
              background: #fff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              transition: transform 0.2s;
            }
            .sp-toggle input:checked + .sp-toggle-track::after {
              transform: translateX(18px);
            }

            /* chevron */
            .sp-chevron { color: #8da3ba; flex-shrink: 0; }

            /* divider */
            .sp-divider {
              height: 1px;
              background: #edf1f8;
              border: none;
              margin: 8px 0;
            }

            /* sign out button */
            .sp-signout {
              display: flex;
              align-items: center;
              gap: 10px;
              width: 100%;
              padding: 11px 14px;
              border-radius: 10px;
              border: 1px solid #f5c7c5;
              background: #fde9e8;
              color: #9b3533;
              font-size: 13.5px;
              font-weight: 600;
              cursor: pointer;
              margin-top: 4px;
              transition: background 0.14s, border-color 0.14s;
              text-align: left;
            }
            .sp-signout:hover { background: #fcd5d4; border-color: #f0b1af; }
          `}</style>

          {/* ── Panel header ─────────────────────────────────── */}
          <div className="sp-head">
            <h2 className="sp-head-title">Settings</h2>
            <button
              type="button"
              className="sp-close"
              aria-label="Close settings"
              onClick={() => setIsSettingsPanelOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable body ───────────────────────────────── */}
          <div className="sp-body">

            {/* Account card */}
            <div className="sp-account">
              <div className="sp-avatar">{initials}</div>
              <div className="sp-account-info">
                <div className="sp-account-name">{session.name}</div>
                <div className="sp-account-email">{session.email}</div>
              </div>
            </div>

            {/* ── Account section ─────────────────────────── */}
            <div className="sp-section-label">Account</div>

            <button
              type="button"
              className="sp-row"
              onClick={() => { handleNavigate('/applicant/profile-management'); setIsSettingsPanelOpen(false); }}
            >
              <div className="sp-row-left">
                <div className="sp-row-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <div className="sp-row-text">
                  <span className="sp-row-label">Manage Profile</span>
                  <span className="sp-row-desc">Edit personal info and documents</span>
                </div>
              </div>
              <svg className="sp-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <button
              type="button"
              className="sp-row"
              onClick={() => { handleNavigate('/applicant/manage-applications'); setIsSettingsPanelOpen(false); }}
            >
              <div className="sp-row-left">
                <div className="sp-row-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6M9 16h4" />
                  </svg>
                </div>
                <div className="sp-row-text">
                  <span className="sp-row-label">My Applications</span>
                  <span className="sp-row-desc">View and track submissions</span>
                </div>
              </div>
              <svg className="sp-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <hr className="sp-divider" />

            {/* ── Notifications section ────────────────────── */}
            <div className="sp-section-label">Notifications</div>

            <button
              type="button"
              className="sp-row"
              onClick={() => { handleNavigate('/applicant/notifications'); setIsSettingsPanelOpen(false); }}
            >
              <div className="sp-row-left">
                <div className="sp-row-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="sp-row-text">
                  <span className="sp-row-label">View Notifications</span>
                  {notificationCount > 0 && (
                    <span className="sp-row-desc" style={{ color: '#2046a3', fontWeight: 600 }}>
                      {notificationCount} unread message{notificationCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {notificationCount === 0 && (
                    <span className="sp-row-desc">All caught up</span>
                  )}
                </div>
              </div>
              {notificationCount > 0 && (
                <span style={{
                  minWidth: 20, height: 20, padding: '0 6px',
                  borderRadius: 999, background: '#1a3f76', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {notificationCount}
                </span>
              )}
            </button>

            {typeof onMarkAllNotificationsRead === 'function' && notificationCount > 0 && (
              <button
                type="button"
                className="sp-row"
                onClick={async () => { await onMarkAllNotificationsRead(); }}
              >
                <div className="sp-row-left">
                  <div className="sp-row-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="sp-row-text">
                    <span className="sp-row-label">Mark all as read</span>
                    <span className="sp-row-desc">Clear {notificationCount} unread notification{notificationCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </button>
            )}

            <hr className="sp-divider" />

            {/* ── Workspace section ────────────────────────── */}
            <div className="sp-section-label">Workspace</div>

            <div className="sp-row">
              <div className="sp-row-left">
                <div className="sp-row-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="18" rx="1" />
                    <rect x="14" y="3" width="7" height="18" rx="1" />
                  </svg>
                </div>
                <div className="sp-row-text">
                  <span className="sp-row-label">Compact Sidebar</span>
                  <span className="sp-row-desc">Collapse nav to icons only</span>
                </div>
              </div>
              <label className="sp-toggle" aria-label="Toggle compact sidebar">
                <input
                  type="checkbox"
                  checked={sidebarCollapsed}
                  onChange={() => setSidebarCollapsed((c) => !c)}
                />
                <div className="sp-toggle-track" />
              </label>
            </div>

            <hr className="sp-divider" />

            {/* ── Sign out ─────────────────────────────────── */}
            <button
              type="button"
              className="sp-signout"
              onClick={() => { setIsSettingsPanelOpen(false); onLogout(); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>

          </div>
        </aside>
      </>
    );
  };

  return (
    <div
      className={`dashboard-shell dashboard-shell-${role} ${isStaff ? 'dashboard-shell-staff' : ''} ${
        personnelWorkspaceTheme ? `dashboard-theme-${personnelWorkspaceTheme}` : ''
      } ${sidebarOpen ? 'has-open-sidebar' : ''} ${desktopSidebarCollapsed ? 'has-collapsed-sidebar' : ''} ${hideSidebarChrome ? 'has-hidden-sidebar' : ''}`}
    >
      {!hideSidebarChrome ? (
        <>
          <button
            aria-hidden={!sidebarOpen}
            className={`sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
            onClick={() => setSidebarOpen(false)}
            tabIndex={sidebarOpen ? 0 : -1}
            type="button"
          />

          <aside className={`sidebar sidebar-${role} ${personnelWorkspaceTheme ? `sidebar-theme-${personnelWorkspaceTheme}` : ''} ${sidebarOpen ? 'is-open' : ''}`}>
            <div className="sidebar-top">
              <button className="brand-lockup align-left" onClick={() => handleNavigate('/')} type="button">
                <span className="brand-mark">
                  <ProgramFinderLogo decorative />
                </span>
                <span className="sidebar-brand-copy">
                  <strong>ProgramFinder</strong>
                  <small>{workspaceLabel}</small>
                </span>
              </button>
            </div>

            {showMobileSidebarClose ? (
              <AppButton
                aria-label="Close sidebar"
                className="sidebar-close-button"
                leading={<DashboardGlyph name="close" />}
                onClick={() => setSidebarOpen(false)}
                variant="plain"
              />
            ) : null}

            <nav className="sidebar-nav">
              {showFlatApplicantNav
                ? visibleNavItems.map((item) => renderNavItem(item))
                : sidebarGroups.map((group) => {
                    if (group.items.length === 1) {
                      return renderNavItem(group.items[0]);
                    }

                    const isOpen = Boolean(expandedGroups[group.key]);
                    const hasActiveItem = group.items.some((item) => item.key === section);

                    return (
                      <div className={`sidebar-group ${isOpen ? 'is-open' : ''} ${hasActiveItem ? 'has-active-item' : ''}`.trim()} key={group.key}>
                        <AppButton
                          aria-controls={`sidebar-group-${group.key}`}
                          aria-expanded={isOpen}
                          className={`nav-item sidebar-group-toggle ${isOpen ? 'is-open' : ''} ${hasActiveItem ? 'has-active-item' : ''}`.trim()}
                          labelClassName="nav-item-label"
                          leading={<DashboardGlyph name={group.iconKey} />}
                          leadingClassName="nav-item-icon"
                          onClick={() => toggleSidebarGroup(group.key)}
                          style={sidebarNavButtonStyle}
                          trailing={<SidebarChevron />}
                          trailingClassName="sidebar-group-chevron"
                          variant="plain"
                        >
                          {group.label}
                        </AppButton>

                        <div
                          aria-hidden={!isOpen}
                          className={`sidebar-group-items ${isOpen ? 'is-open' : ''}`}
                          id={`sidebar-group-${group.key}`}
                        >
                          {group.items.map((item) => renderNavItem(item, { className: 'nav-subitem', tabIndex: isOpen ? 0 : -1 }))}
                        </div>
                      </div>
                    );
                  })}
            </nav>

            <div className="sidebar-footer">
              <AppButton
                aria-label={desktopSidebarCollapsed ? 'Sign out' : undefined}
                className="sidebar-action-button"
                fullWidth
                labelClassName="sidebar-action-label"
                leading={<DashboardGlyph name="logout" />}
                leadingClassName="sidebar-action-icon"
                onClick={onLogout}
                style={sidebarActionButtonStyle}
                title={desktopSidebarCollapsed ? 'Sign out' : undefined}
                variant="secondary"
              >
                Sign Out
              </AppButton>
            </div>
          </aside>

          {showDesktopSidebarToggle ? (
            <AppButton
              aria-label={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="sidebar-toggle-button sidebar-edge-toggle"
              leading={<DashboardGlyph name={desktopSidebarCollapsed ? 'expand-sidebar' : 'collapse-sidebar'} />}
              onClick={() => setSidebarCollapsed((current) => !current)}
              title={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              variant="plain"
            />
          ) : null}
        </>
      ) : null}

      <main className={`dashboard-main dashboard-main-${role} ${isStaff ? 'dashboard-main-staff' : ''}`}>
        <DashboardVectors role={role} />

        {isApplicant && !lockNavigationChrome ? (
          <div className="dashboard-topbar">
            <div className="dashboard-topbar-leading">
              {showMobileSidebarToggle ? (
                <AppButton
                  className="dashboard-mobile-toggle topbar-mobile-toggle"
                  leading={<DashboardGlyph name="menu" />}
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  variant="plain"
                />
              ) : null}
            </div>
            <div className="dashboard-topbar-actions">
              {renderTopbarNotifications()}
              <AppButton
                aria-label="Settings"
                className={`topbar-icon-button ${isSettingsPanelOpen ? 'is-active' : ''}`}
                leading={<DashboardGlyph name="settings" />}
                onClick={() => setIsSettingsPanelOpen((o) => !o)}
                variant="plain"
              />
              <AppButton
                className="topbar-avatar-button"
                aria-label="Open profile management"
                leading={<span className="topbar-avatar">{getInitials(session.name)}</span>}
                onClick={() => handleNavigate('/applicant/profile-management')}
                variant="plain"
              />
            </div>
          </div>
        ) : isStaff ? (
          <div className="dashboard-topbar dashboard-topbar-staff">
            <div className="dashboard-topbar-leading">
              {showMobileSidebarToggle ? (
                <AppButton
                  className="dashboard-mobile-toggle topbar-mobile-toggle"
                  leading={<DashboardGlyph name="menu" />}
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  variant="plain"
                />
              ) : null}
            </div>
            <div className="dashboard-topbar-actions">
              {renderTopbarNotifications()}
              <AppButton
                className="topbar-avatar-button"
                aria-label="Go to dashboard home"
                leading={<span className="topbar-avatar">{getInitials(session.name)}</span>}
                onClick={() => handleNavigate(`/${role}/dashboard`)}
                variant="plain"
              />
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
            <AppCard className="header-summary" tone="soft">
              <span className="soft-badge">Active module</span>
              <strong>{activeItem?.label}</strong>
              <small>{ROLE_DESCRIPTIONS[role]}</small>
            </AppCard>
          </header>
        ) : null}

        <section className="dashboard-content">{children}</section>
      </main>

      {renderSettingsPanel()}
    </div>
  );
}
