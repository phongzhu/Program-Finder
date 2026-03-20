import AnnouncementsScreen from './AnnouncementsScreen';
import AuditTrailScreen from './AuditTrailScreen';
import BackupRestoreScreen from './BackupRestoreScreen';
import CategoriesSectorsScreen from './CategoriesSectorsScreen';
import DashboardScreen from './DashboardScreen';
import OfficesScreen from './OfficesScreen';
import ReportsAnalyticsScreen from './ReportsAnalyticsScreen';
import RolesPermissionsScreen from './RolesPermissionsScreen';
import SystemSettingsScreen from './SystemSettingsScreen';
import UserAccountsScreen from './UserAccountsScreen';

export const ADMIN_SCREENS = {
  dashboard: {
    heading: 'Admin Dashboard',
    subheading: 'Log in first, then use the admin sidebar to manage the full platform architecture and governance modules.',
    component: DashboardScreen,
  },
  'user-accounts': {
    heading: 'Account Management',
    subheading: 'Manage platform users and review their role access from one workspace.',
    component: UserAccountsScreen,
  },
  'roles-permissions': {
    heading: 'Roles & Permissions',
    subheading: 'Review the access hierarchy and module visibility for every role.',
    component: RolesPermissionsScreen,
  },
  'offices-municipalities': {
    heading: 'Offices & Municipalities',
    subheading: 'Register and review the participating offices and municipalities on the platform.',
    component: OfficesScreen,
  },
  'categories-sectors': {
    heading: 'Categories & Sectors',
    subheading: 'Manage the taxonomy used for programs and beneficiaries.',
    component: CategoriesSectorsScreen,
  },
  'system-settings': {
    heading: 'System Settings',
    subheading: 'Control prototype-wide settings and platform behavior.',
    component: SystemSettingsScreen,
  },
  'backup-restore': {
    heading: 'Backup & Restore',
    subheading: 'Track snapshots and simulate a manual backup operation.',
    component: BackupRestoreScreen,
  },
  'audit-trail': {
    heading: 'Audit Trail',
    subheading: 'Inspect system activity recorded across the prototype.',
    component: AuditTrailScreen,
  },
  'reports-analytics': {
    heading: 'Reports & Analytics',
    subheading: 'View system-wide role distribution and application status analytics.',
    component: ReportsAnalyticsScreen,
  },
  announcements: {
    heading: 'Announcements',
    subheading: 'Publish public platform announcements.',
    component: AnnouncementsScreen,
  },
};
