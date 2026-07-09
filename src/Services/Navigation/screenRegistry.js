import { ADMIN_SCREENS } from 'Pages/Admin';
import { APPLICANT_SCREENS } from 'Pages/Applicant';
import { PERSONNEL_SCREENS } from 'Pages/Personnel';
import { hasCaptainWorkspaceAccess } from 'Utils/staffHierarchy';

const CAPTAIN_REPORTS_SCREEN = {
  heading: 'Reports',
  subheading: 'View captain-wide coverage, access, program, and application analytics from one consolidated reporting workspace.',
  component: ADMIN_SCREENS['reports-analytics'].component,
};

export const CAPTAIN_SCREENS = {
  dashboard: {
    heading: 'Captain Dashboard',
    subheading: 'Use the captain workspace to manage platform governance, municipalities, staff, programs, and applicant flow from one command center.',
    component: ADMIN_SCREENS.dashboard.component,
  },
  'user-accounts': PERSONNEL_SCREENS['team-management'],
  'roles-permissions': {
    heading: 'Roles & Permissions',
    subheading: 'Review captain, barangay, staff, and applicant access across the platform.',
    component: ADMIN_SCREENS['roles-permissions'].component,
  },
  'offices-municipalities': {
    heading: 'Offices & Municipalities',
    subheading: 'Manage municipalities, offices, and captain assignments across the captain workspace.',
    component: ADMIN_SCREENS['offices-municipalities'].component,
  },
  'view-municipality': {
    heading: ADMIN_SCREENS['view-municipality'].heading,
    subheading: ADMIN_SCREENS['view-municipality'].subheading,
    component: ADMIN_SCREENS['view-municipality'].component,
  },
  'view-offices': {
    heading: ADMIN_SCREENS['view-offices'].heading,
    subheading: ADMIN_SCREENS['view-offices'].subheading,
    component: ADMIN_SCREENS['view-offices'].component,
  },
  'categories-sectors': {
    heading: ADMIN_SCREENS['categories-sectors'].heading,
    subheading: ADMIN_SCREENS['categories-sectors'].subheading,
    component: ADMIN_SCREENS['categories-sectors'].component,
  },
  'system-settings': {
    heading: 'System Settings',
    subheading: 'Control platform settings, safeguards, and audit visibility from the captain workspace.',
    component: ADMIN_SCREENS['system-settings'].component,
  },
  'system-branding': {
    heading: 'System Branding',
    subheading: 'Update the global logo, color palette, and naming used across every workspace screen.',
    component: ADMIN_SCREENS['system-branding'].component,
  },
  'backup-restore': {
    heading: ADMIN_SCREENS['backup-restore'].heading,
    subheading: ADMIN_SCREENS['backup-restore'].subheading,
    component: ADMIN_SCREENS['backup-restore'].component,
  },
  'audit-trail': {
    heading: ADMIN_SCREENS['audit-trail'].heading,
    subheading: 'Inspect activity logged across captain governance, staff modules, and applicant operations.',
    component: ADMIN_SCREENS['audit-trail'].component,
  },
  'reports-analytics': CAPTAIN_REPORTS_SCREEN,
  'team-management': PERSONNEL_SCREENS['team-management'],
  'program-listings': PERSONNEL_SCREENS['program-listings'],
  'application-management': PERSONNEL_SCREENS['application-management'],
  'eligibility-criteria': PERSONNEL_SCREENS['eligibility-criteria'],
  'submitted-applications': PERSONNEL_SCREENS['submitted-applications'],
  'application-decisions': PERSONNEL_SCREENS['application-decisions'],
  'applicant-records': PERSONNEL_SCREENS['applicant-records'],
  reports: CAPTAIN_REPORTS_SCREEN,
  notifications: PERSONNEL_SCREENS.notifications,
  announcements: PERSONNEL_SCREENS.announcements,
};

const SCREEN_REGISTRY = {
  personnel: PERSONNEL_SCREENS,
  applicant: APPLICANT_SCREENS,
};

export function getScreensForRole(role, session = null) {
  if (role === 'personnel' && hasCaptainWorkspaceAccess(session)) {
    return CAPTAIN_SCREENS;
  }

  return SCREEN_REGISTRY[role] || {};
}
