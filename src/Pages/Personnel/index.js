import AnnouncementsScreen from './AnnouncementsScreen';
import ApplicationManagementScreen from './ApplicationManagementScreen';
import ApplicantRecordsScreen from './ApplicantRecordsScreen';
import ApplicationDecisionsScreen from './ApplicationDecisionsScreen';
import DashboardScreen from './DashboardScreen';
import EligibilityCriteriaScreen from './EligibilityCriteriaScreen';
import MunicipalityWorkspaceScreen from './MunicipalityWorkspaceScreen';
import NotificationsScreen from './NotificationsScreen';
import ProgramListingsScreen from './ProgramListingsScreen';
import ReportsScreen from './ReportsScreen';
import SubmittedApplicationsScreen from './SubmittedApplicationsScreen';
import TeamManagementScreen from './TeamManagementScreen';
import { ADMIN_SCREENS } from 'Pages/Admin';

export const PERSONNEL_SCREENS = {
  dashboard: {
    heading: 'Government Personnel Dashboard',
    subheading: 'Log in first, then manage municipality programs, applications, applicant communication, and reports through the sidebar.',
    component: DashboardScreen,
  },
  'offices-municipalities': {
    heading: 'Municipality',
    subheading: 'Review only the municipality scope granted to your personnel account.',
    component: MunicipalityWorkspaceScreen,
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
  'team-management': {
    heading: 'Team Management',
    subheading: 'Create and monitor the captain, barangay, and secretary hierarchy tied to your municipality.',
    component: TeamManagementScreen,
  },
  'program-listings': {
    heading: 'Program Listings',
    subheading: 'Create, publish, and maintain the programs handled by the current office.',
    component: ProgramListingsScreen,
  },
  'categories-sectors': {
    heading: ADMIN_SCREENS['categories-sectors'].heading,
    subheading: ADMIN_SCREENS['categories-sectors'].subheading,
    component: ADMIN_SCREENS['categories-sectors'].component,
  },
  'application-management': {
    heading: 'Application Management',
    subheading: 'Review submissions, inspect applicant records, and issue application decisions from one office workspace.',
    component: ApplicationManagementScreen,
  },
  'eligibility-criteria': {
    heading: 'Eligibility Criteria',
    subheading: 'Review the requirement and eligibility setup for every office program.',
    component: EligibilityCriteriaScreen,
  },
  'submitted-applications': {
    heading: 'Submitted Applications',
    subheading: 'Inspect all submissions routed to the current office.',
    component: SubmittedApplicationsScreen,
  },
  'application-decisions': {
    heading: 'Application Decisions',
    subheading: 'Approve, reject, or mark applications incomplete from a dedicated decision module.',
    component: ApplicationDecisionsScreen,
  },
  'applicant-records': {
    heading: 'Applicant Records',
    subheading: 'Review applicants linked to the office programs and applications.',
    component: ApplicantRecordsScreen,
  },
  reports: {
    heading: 'Reports',
    subheading: 'Monitor office performance and application uptake.',
    component: ReportsScreen,
  },
  notifications: {
    heading: 'Notifications',
    subheading: 'Send applicant notifications and review incoming office alerts.',
    component: NotificationsScreen,
  },
  announcements: {
    heading: 'Announcements',
    subheading: 'Publish office announcements for applicants under your scope.',
    component: AnnouncementsScreen,
  },
};
