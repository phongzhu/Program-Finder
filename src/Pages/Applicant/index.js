import ApplicantOnboardingSurveyScreen from './ApplicantOnboardingSurveyScreen';
import ApplicantProgramApplyScreen from './ApplicantProgramApplyScreen';
import ApplicantProgramViewScreen from './ApplicantProgramViewScreen';
import BookmarksScreen from './BookmarksScreen';
import DashboardScreen from './DashboardScreen';
import ManageApplicationsScreen from './ManageApplicationsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileManagementScreen from './ProfileManagementScreen';
import SearchProgramsScreen from './SearchProgramsScreen';
import ViewApplicationSubmissionScreen from './ViewApplicationSubmissionScreen';

export const APPLICANT_SCREENS = {
  dashboard: {
    heading: 'Applicant Dashboard',
    subheading: 'Log in first, then use your role-specific workspace to manage profile data, explore programs, and submit applications.',
    component: DashboardScreen,
  },
  'profile-management': {
    heading: 'Profile Management',
    subheading: 'Maintain applicant profile data before proceeding to eligibility and submission.',
    component: ProfileManagementScreen,
  },
  'search-programs': {
    heading: 'Search Programs',
    subheading: 'Browse programs, filter the listings in your area, and open any record for full details.',
    component: SearchProgramsScreen,
  },
  'program-view': {
    heading: 'View Program',
    subheading: 'Review the full program details before deciding whether to apply.',
    component: ApplicantProgramViewScreen,
  },
  'program-apply': {
    heading: 'Apply Program',
    subheading: 'Complete the requirement uploads and submit your application.',
    component: ApplicantProgramApplyScreen,
  },
  'manage-applications': {
    heading: 'Manage Applications',
    subheading: 'Track statuses, inspect submission progress, and review the full application timeline.',
    component: ManageApplicationsScreen,
  },
  'view-application-submission': {
    heading: 'View Application Submission',
    subheading: 'Review your submission details, requirement uploads, and office remarks.',
    component: ViewApplicationSubmissionScreen,
  },
  notifications: {
    heading: 'Notifications',
    subheading: 'Stay updated with alerts, reminders, and application decisions.',
    component: NotificationsScreen,
  },
  bookmarks: {
    heading: 'Bookmarks',
    subheading: 'Revisit saved programs and reopen them in the search workspace whenever you are ready.',
    component: BookmarksScreen,
  },
  'onboarding-survey': {
    heading: 'Quick Setup',
    subheading: 'Answer a few questions so we can show you programs you are most likely to qualify for.',
    component: ApplicantOnboardingSurveyScreen,
  },
};
