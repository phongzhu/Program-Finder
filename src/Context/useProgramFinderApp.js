import { useEffect, useState } from 'react';
import { ROLE_LABELS } from 'Data/appConstants';
import { isSectionAllowed } from 'Services/Navigation/moduleRegistry';
import { canApplicantApplyToProgram } from 'Services/Applicant/applicant-utils';
import {
  canComposeProgramContent,
  canPublishAnnouncements,
  canReviewApplicants,
  canSetProgramRelease,
  getAccountRoleLabel,
  getAssignableStaffRoles,
  getDefaultRootManagerId,
  getManagedStaffUsers,
  getStaffRoleKey,
  getStaffRoleLabel,
  hasCaptainWorkspaceAccess,
  isStaffAccount,
} from 'Utils/staffHierarchy';
import { hasSameTaxonomyNames, mergeTaxonomyItems } from 'Utils/programTaxonomy';
import { uniqueDocumentTypes } from 'Constants/documentTypes';
import {
  getAuthModeFromPath,
  getHashPath,
  getHomeRoute,
  getLoginRoleFromPath,
  getLoginRoute,
  getRoleFromPath,
  getSectionFromPath,
  normalizePath,
  STAFF_LOGIN_ROUTE,
} from 'Services/Routing/router';
import { isSupabaseConfigured, supabase } from 'Services/Supabase/client';
import {
  getSignedInApplicantAccount,
  registerApplicantAccount,
  resendApplicantSignupOtp,
  signInApplicantAccount,
  updateApplicantProfile,
  verifyApplicantSignupOtp,
} from 'Services/Supabase/applicant-auth';
import { completeStaffPasswordChange, createStaffAccount, getSignedInStaffAccount, signInStaffAccount } from 'Services/Supabase/staff-auth';
import { listOfficeManagementRecords } from 'Services/Supabase/offices';
import { createProgramListing, listProgramRecords, updateProgramListing } from 'Services/Supabase/programs';
import {
  ensureApplicantSurveyResponse,
  saveApplicantProfileSurveyFields,
  saveApplicantSurveyResponse,
} from 'Services/Supabase/applicant-survey';
import {
  addApplicantBookmark,
  listApplicantBookmarks,
  removeApplicantBookmark,
} from 'Services/Supabase/bookmarks';
import {
  createApplicantFamilyMember,
  deleteApplicantFamilyMember,
  listApplicantFamilyMembers,
  deleteApplicantProfileDocument,
  listActiveSectors,
  listApplicantSectorTags,
  listApplicantProfileDocuments,
  replaceApplicantSectorTags,
  updateApplicantFamilyMember,
  updateApplicantProfileDocumentMetadata,
  uploadApplicantProfileDocument,
} from 'Services/Supabase/applicant-profile';
import {
  createDraftApplication,
  getApplicationRecordById,
  linkExistingDocumentsToApplication,
  listApplicationRecords,
  removeApplicationRequirementFile,
  reviewApplicationRecord,
  submitApplicationRecord,
  uploadApplicationRequirementFile,
} from 'Services/Supabase/applications';
import {
  createNotification as createSupabaseNotification,
  listUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from 'Services/Supabase/notifications';
import {
  DEFAULT_UI_BRANDING,
  getLatestUiSettings,
  saveUiSettings,
  uploadUiLogo,
} from 'Services/Supabase/ui-settings';

const LEGACY_PROTOTYPE_STORAGE_KEYS = [
  'programfinder-prototype-session',
  'programfinder-prototype-state',
];
const APP_SESSION_SNAPSHOT_STORAGE_KEY = 'programfinder-app-session-snapshot';
const PROGRAM_CONTENT_FIELDS = [
  'title',
  'category',
  'sector',
  'programType',
  'office',
  'municipality',
  'applicationStartDate',
  'applicationEndDate',
  'deadline',
  'status',
  'visibility',
  'applicants',
  'slots',
  'maxBeneficiaries',
  'fitScore',
  'summary',
  'description',
  'objective',
  'benefits',
  'coverageNotes',
  'submissionInstructions',
  'additionalNotes',
  'imageReference',
  'imageName',
  'requirements',
  'eligibility',
  'attachments',
];
const PROGRAM_RELEASE_FIELDS = ['status'];
const REQUIRED_APPLICANT_PROFILE_BASE_FIELDS = [
  { key: 'fullName', label: 'Full name' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone number' },
  { key: 'municipality', label: 'Municipality' },
  { key: 'barangay', label: 'Barangay' },
  { key: 'address', label: 'Complete address' },
  { key: 'sex', label: 'Sex' },
  { key: 'birthDate', label: 'Birth date' },
  { key: 'civilStatus', label: 'Civil status' },
  { key: 'citizenship', label: 'Citizenship' },
  { key: 'employmentStatus', label: 'Employment status' },
  { key: 'educationStatus', label: 'Educational attainment' },
  { key: 'householdIncome', label: 'Exact household monthly income' },
  { key: 'householdMemberCount', label: 'Household member count' },
  { key: 'dependentCount', label: 'Dependent count' },
  { key: 'housingStatus', label: 'Housing status' },
  { key: 'specialCategory', label: 'Special category' },
];
const REQUIRED_APPLICANT_PROFILE_NON_STUDENT_FIELDS = [
  { key: 'occupation', label: 'Occupation' },
  { key: 'monthlyPersonalIncome', label: 'Monthly personal income' },
];

const BRANDING_EVENT_NAME = 'pf:branding-updated';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
}

function isHexColor(value) {
  return /^#([0-9a-fA-F]{6})$/.test(String(value || '').trim());
}

function normalizeHexColor(value, fallback) {
  const normalized = String(value || '').trim();
  return isHexColor(normalized) ? normalized : fallback;
}

function hexToRgb(hexColor) {
  const normalized = normalizeHexColor(hexColor, '#000000').slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function shiftHexColor(hexColor, amount = 0) {
  const rgb = hexToRgb(hexColor);
  return `#${toHex(rgb.r + amount)}${toHex(rgb.g + amount)}${toHex(rgb.b + amount)}`;
}

function withAlpha(hexColor, alpha = 1) {
  const rgb = hexToRgb(hexColor);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

function getUiBrandingTheme(branding) {
  const primary = normalizeHexColor(branding?.primaryColor, DEFAULT_UI_BRANDING.primaryColor);
  const secondary = normalizeHexColor(branding?.secondaryColor, DEFAULT_UI_BRANDING.secondaryColor);
  const tertiary = normalizeHexColor(branding?.tertiaryColor, DEFAULT_UI_BRANDING.tertiaryColor);
  const primaryText = normalizeHexColor(branding?.primaryTextColor, DEFAULT_UI_BRANDING.primaryTextColor);
  const secondaryText = normalizeHexColor(branding?.secondaryTextColor, DEFAULT_UI_BRANDING.secondaryTextColor);
  const tertiaryText = normalizeHexColor(branding?.tertiaryTextColor, DEFAULT_UI_BRANDING.tertiaryTextColor);

  return {
    primary,
    primaryDark: shiftHexColor(primary, -26),
    primaryGlow: withAlpha(primary, 0.18),
    secondary,
    tertiary,
    primaryText,
    secondaryText,
    tertiaryText,
  };
}

function getNormalizedUiBranding(branding = {}) {
  return {
    ...DEFAULT_UI_BRANDING,
    ...branding,
    primaryColor: normalizeHexColor(branding?.primaryColor, DEFAULT_UI_BRANDING.primaryColor),
    secondaryColor: normalizeHexColor(branding?.secondaryColor, DEFAULT_UI_BRANDING.secondaryColor),
    tertiaryColor: normalizeHexColor(branding?.tertiaryColor, DEFAULT_UI_BRANDING.tertiaryColor),
    primaryTextColor: normalizeHexColor(branding?.primaryTextColor, DEFAULT_UI_BRANDING.primaryTextColor),
    secondaryTextColor: normalizeHexColor(branding?.secondaryTextColor, DEFAULT_UI_BRANDING.secondaryTextColor),
    tertiaryTextColor: normalizeHexColor(branding?.tertiaryTextColor, DEFAULT_UI_BRANDING.tertiaryTextColor),
    systemName: String(branding?.systemName || DEFAULT_UI_BRANDING.systemName).trim() || DEFAULT_UI_BRANDING.systemName,
    systemDescription: String(branding?.systemDescription || ''),
    systemTagline: String(branding?.systemTagline || ''),
    fontFamily: String(branding?.fontFamily || DEFAULT_UI_BRANDING.fontFamily).trim() || DEFAULT_UI_BRANDING.fontFamily,
    logoIcon: String(branding?.logoIcon || ''),
    logoUrl: String(branding?.logoUrl || ''),
  };
}

function applyUiBrandingTheme(branding) {
  if (typeof window === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const normalized = getNormalizedUiBranding(branding);
  const theme = getUiBrandingTheme(normalized);

  root.style.setProperty('--accent', theme.primary);
  root.style.setProperty('--accent-deep', theme.primaryDark);
  root.style.setProperty('--accent-strong', theme.primaryDark);
  root.style.setProperty('--accent-soft', withAlpha(theme.primary, 0.08));
  root.style.setProperty('--accent-glow', theme.primaryGlow);
  root.style.setProperty('--pf-accent', theme.primary);
  root.style.setProperty('--pf-accent-dark', theme.primaryDark);
  root.style.setProperty('--pf-accent-glow', theme.primaryGlow);
  root.style.setProperty('--pf-accent-soft', withAlpha(theme.primary, 0.08));
  root.style.setProperty('--pf-amber', theme.secondary);
  root.style.setProperty('--warning', theme.secondary);
  root.style.setProperty('--warning-soft', withAlpha(theme.secondary, 0.16));
  root.style.setProperty('--pf-surface', theme.tertiary);
  root.style.setProperty('--pf-surface-alt', theme.tertiary);
  root.style.setProperty('--pf-card', theme.tertiary);
  root.style.setProperty('--panel', theme.tertiary);
  root.style.setProperty('--panel-strong', theme.tertiary);
  root.style.setProperty('--panel-soft', theme.tertiary);
  root.style.setProperty('--bg', theme.tertiary);
  root.style.setProperty('--pf-ink', theme.primaryText);
  root.style.setProperty('--pf-ink-soft', theme.secondaryText);
  root.style.setProperty('--pf-ink-muted', theme.tertiaryText);
  root.style.setProperty('--pf-on-primary', theme.tertiaryText);
  root.style.setProperty('--pf-on-accent', theme.tertiaryText);
  root.style.setProperty('--pf-on-tertiary', theme.secondaryText);
  root.style.setProperty('--pf-on-surface', theme.secondaryText);
  root.style.setProperty('--ink', theme.primaryText);
  root.style.setProperty('--muted', theme.secondaryText);
  root.style.setProperty('--text-1', theme.primaryText);
  root.style.setProperty('--text-2', theme.secondaryText);
  root.style.setProperty('--text-3', theme.tertiaryText);
  root.style.setProperty('--surface-1', theme.tertiary);
  root.style.setProperty('--surface-2', theme.tertiary);
  root.style.setProperty('--surface-3', theme.tertiary);
  root.style.setProperty('--border', withAlpha(theme.primary, 0.12));
  root.style.setProperty('--line', withAlpha(theme.primary, 0.12));
  root.style.setProperty('--line-strong', withAlpha(theme.primary, 0.2));
  root.style.setProperty('--pf-workspace-surface', theme.tertiary);
  root.style.setProperty('--pf-workspace-bg', theme.tertiary);
  root.style.setProperty('--pf-workspace-surface-alt', theme.tertiary);
  root.style.setProperty('--pf-workspace-surface-soft', theme.tertiary);
  root.style.setProperty('--pf-workspace-border', withAlpha(theme.primary, 0.12));
  root.style.setProperty('--pf-workspace-border-strong', withAlpha(theme.primary, 0.2));
  root.style.setProperty('--pf-workspace-border-soft', withAlpha(theme.primary, 0.08));
  root.style.setProperty('--pf-workspace-ink', theme.primaryText);
  root.style.setProperty('--pf-workspace-muted', theme.secondaryText);
  root.style.setProperty('--pf-workspace-sidebar', theme.primary);
  root.style.setProperty('--pf-workspace-sidebar-soft', theme.primary);
  root.style.setProperty('--pf-workspace-gold', theme.secondary);
  root.style.setProperty('--font-body', normalized.fontFamily);
  root.style.setProperty('--font-display', normalized.fontFamily);
  root.style.setProperty('--pf-font-body', normalized.fontFamily);
  root.style.setProperty('--pf-font-display', normalized.fontFamily);
  root.style.setProperty('--pf-logo-url', normalized.logoUrl || '');

  const nextTitle = normalized.systemName || DEFAULT_UI_BRANDING.systemName;

  root.style.setProperty('--pf-setting-primary', theme.primary);
  root.style.setProperty('--pf-setting-secondary', theme.secondary);
  root.style.setProperty('--pf-setting-tertiary', theme.tertiary);
  root.style.setProperty('--pf-setting-primary-text', theme.primaryText);
  root.style.setProperty('--pf-setting-secondary-text', theme.secondaryText);
  root.style.setProperty('--pf-setting-tertiary-text', theme.tertiaryText);
  root.style.setProperty('--pf-setting-on-primary', theme.tertiaryText);
  root.style.setProperty('--pf-setting-on-accent', theme.tertiaryText);
  root.style.setProperty('--pf-setting-on-tertiary', theme.secondaryText);
  root.style.setProperty('--pf-setting-on-surface', theme.secondaryText);

  if (typeof document !== 'undefined') {
    document.title = nextTitle;
  }

  window.dispatchEvent(
    new CustomEvent(BRANDING_EVENT_NAME, {
      detail: {
        logoUrl: normalized.logoUrl || '',
        systemName: nextTitle,
      },
    })
  );
}

function createEmptyAppState() {
  return {
    programs: [],
    applications: [],
    users: [],
    offices: [],
    municipalities: [],
    barangays: [],
    categories: [],
    sectors: [],
    requirementTemplates: [],
    announcements: [],
    notifications: [],
    auditLogs: [],
    backupHistory: [],
    restoreHistory: [],
    documents: [],
    applicantProfileDocuments: [],
    activeSectors: [],
    applicantProfiles: {},
    applicantProfile: null,
    applicantBookmarks: {},
    bookmarks: [],
    passwordResetRequests: {},
    settings: {
      publicPortal: true,
      applicantSignup: true,
      emailNotifications: true,
      maintenanceMode: false,
      auditRetentionDays: 365,
    },
    uiBranding: { ...DEFAULT_UI_BRANDING },
    composer: {
      applicationId: null,
      programId: null,
      notes: '',
      attachedDocs: [],
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clearLegacyPrototypeStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  LEGACY_PROTOTYPE_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

function getProgramById(programs, programId) {
  return programs.find((program) => program.id === programId);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getPersonnelLoginLink() {
  if (typeof window === 'undefined') {
    return STAFF_LOGIN_ROUTE;
  }

  return `${window.location.origin}${window.location.pathname}#${STAFF_LOGIN_ROUTE}`;
}

function isSurveyIncomeBracket(value) {
  return ['below_10k', '10k_20k', '20k_50k', 'above_50k', 'prefer_not_to_say'].includes(
    String(value || '').trim()
  );
}

function isStudentProfile(profile = {}) {
  const employmentStatus = String(profile?.employmentStatus || '').trim().toLowerCase();
  const specialCategory = String(profile?.specialCategory || '').trim().toLowerCase();
  const applicantTypes = Array.isArray(profile?.searchSurvey?.applicantTypes)
    ? profile.searchSurvey.applicantTypes.map((value) => String(value || '').trim().toLowerCase())
    : [];

  return (
    employmentStatus === 'student' ||
    specialCategory === 'student' ||
    applicantTypes.includes('student')
  );
}

function getRequiredApplicantProfileFields(profile = {}) {
  if (isStudentProfile(profile)) {
    return REQUIRED_APPLICANT_PROFILE_BASE_FIELDS;
  }

  return [
    ...REQUIRED_APPLICANT_PROFILE_BASE_FIELDS,
    ...REQUIRED_APPLICANT_PROFILE_NON_STUDENT_FIELDS,
  ];
}

function hasNonEmptyProfileValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }

  return String(value).trim().length > 0;
}

function getMissingRequiredApplicantProfileFields(profile = {}, session = null) {
  const profileValue = profile || {};
  const sessionValue = session || {};
  const requiredFields = getRequiredApplicantProfileFields(profileValue);

  return requiredFields.filter((field) => {
    const rawValue =
      profileValue?.[field.key] ??
      (field.key === 'email'
        ? sessionValue?.email
        : field.key === 'municipality'
          ? sessionValue?.municipality
          : field.key === 'fullName'
            ? sessionValue?.name
            : '');

    return !hasNonEmptyProfileValue(rawValue);
  });
}

function computeProfileCompletion(profile) {
  const requiredFields = getRequiredApplicantProfileFields(profile);
  const filled = requiredFields.filter((field) =>
    hasNonEmptyProfileValue(profile?.[field.key])
  ).length;
  return Math.max(40, Math.round((filled / requiredFields.length) * 100));
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeOfficeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ');
}

function normalizeRoleText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function isProgramManagedBySessionOffice(program = {}, session = {}) {
  const sessionUserId = String(session?.id || '').trim();
  const createdByUserId = String(program?.createdByUserId || program?.created_by || '').trim();
  if (sessionUserId && createdByUserId && sessionUserId === createdByUserId) {
    return true;
  }

  const programOfficeId = String(program?.officeId || program?.office_id || '').trim();
  const sessionOfficeId = String(session?.officeId || session?.office_id || '').trim();
  if (programOfficeId && sessionOfficeId) {
    return programOfficeId === sessionOfficeId;
  }

  const officeMatches = normalizeOfficeText(program?.office) === normalizeOfficeText(session?.office);
  if (officeMatches) {
    return true;
  }

  const staffRole = normalizeRoleText(session?.staffRole || session?.title);
  const sessionMunicipality = normalizeOfficeText(session?.municipality);
  const programMunicipality = normalizeOfficeText(program?.municipality);
  const sessionBarangay = normalizeOfficeText(session?.barangay);
  const programBarangay = normalizeOfficeText(program?.barangay);

  if (['municipal_mayor', 'municipal_secretary'].includes(staffRole)) {
    return Boolean(sessionMunicipality) && sessionMunicipality === programMunicipality;
  }

  if (['barangay_captain', 'barangay_secretary'].includes(staffRole)) {
    return Boolean(sessionMunicipality) && sessionMunicipality === programMunicipality &&
      (!sessionBarangay || sessionBarangay === programBarangay);
  }

  return false;
}

function sanitizeApplicantProfile(profile = {}, fallback = {}) {
  const firstName = String(profile?.firstName || fallback?.firstName || '').trim();
  const middleName = String(profile?.middleName || fallback?.middleName || '').trim();
  const lastName = String(profile?.lastName || fallback?.lastName || '').trim();
  const suffix = String(profile?.suffix || fallback?.suffix || '').trim();
  const fullName = String(
    profile?.fullName ||
      fallback?.fullName ||
      [firstName, middleName, lastName, suffix].filter(Boolean).join(' ')
  ).trim();
  const nextProfile = {
    fullName,
    firstName,
    middleName,
    lastName,
    suffix,
    email: String(profile?.email || fallback?.email || '').trim(),
    phone: String(profile?.phone || fallback?.phone || '').trim(),
    alternateContactNumber: String(profile?.alternateContactNumber || fallback?.alternateContactNumber || '').trim(),
    municipality: String(profile?.municipality || fallback?.municipality || '').trim(),
    municipalityId: String(profile?.municipalityId || fallback?.municipalityId || '').trim(),
    barangay: String(profile?.barangay || fallback?.barangay || '').trim(),
    barangayId: String(profile?.barangayId || fallback?.barangayId || '').trim(),
    houseNumber: String(profile?.houseNumber || fallback?.houseNumber || '').trim(),
    streetName: String(profile?.streetName || fallback?.streetName || '').trim(),
    subdivisionArea: String(profile?.subdivisionArea || fallback?.subdivisionArea || '').trim(),
    zipCode: String(profile?.zipCode || fallback?.zipCode || '').trim(),
    address: String(profile?.address || fallback?.address || '').trim(),
    sex: String(profile?.sex || fallback?.sex || '').trim(),
    birthDate: String(profile?.birthDate || fallback?.birthDate || '').trim(),
    civilStatus: String(profile?.civilStatus || fallback?.civilStatus || '').trim(),
    citizenship: String(profile?.citizenship || fallback?.citizenship || 'Filipino').trim(),
    employmentStatus: String(profile?.employmentStatus || fallback?.employmentStatus || '').trim(),
    occupation: String(profile?.occupation || fallback?.occupation || '').trim(),
    employerName: String(profile?.employerName || fallback?.employerName || '').trim(),
    monthlyPersonalIncome: String(profile?.monthlyPersonalIncome || fallback?.monthlyPersonalIncome || '').trim(),
    educationStatus: String(profile?.educationStatus || fallback?.educationStatus || '').trim(),
    school: String(profile?.school || fallback?.school || '').trim(),
    schoolType: String(profile?.schoolType || fallback?.schoolType || '').trim(),
    educationalLevel: String(profile?.educationalLevel || fallback?.educationalLevel || '').trim(),
    course: String(profile?.course || fallback?.course || '').trim(),
    courseProgram: String(profile?.courseProgram || fallback?.courseProgram || '').trim(),
    yearOrGradeLevel: String(profile?.yearOrGradeLevel || fallback?.yearOrGradeLevel || '').trim(),
    householdIncome: String(profile?.householdIncome || fallback?.householdIncome || '').trim(),
    householdMemberCount: String(profile?.householdMemberCount || fallback?.householdMemberCount || '').trim(),
    dependentCount: String(profile?.dependentCount || fallback?.dependentCount || '').trim(),
    housingStatus: String(profile?.housingStatus || fallback?.housingStatus || '').trim(),
    specialCategory: String(profile?.specialCategory || fallback?.specialCategory || '').trim(),
    disabilityType: String(profile?.disabilityType || fallback?.disabilityType || '').trim(),
    specialCategories: {
      isSeniorCitizen: Boolean(profile?.specialCategories?.isSeniorCitizen ?? fallback?.specialCategories?.isSeniorCitizen),
      isPwd: Boolean(profile?.specialCategories?.isPwd ?? fallback?.specialCategories?.isPwd),
      disabilityType: String(
        profile?.specialCategories?.disabilityType ||
          fallback?.specialCategories?.disabilityType ||
          profile?.disabilityType ||
          fallback?.disabilityType ||
          ''
      ).trim(),
      isSoloParent: Boolean(profile?.specialCategories?.isSoloParent ?? fallback?.specialCategories?.isSoloParent),
      isOutOfSchoolYouth: Boolean(profile?.specialCategories?.isOutOfSchoolYouth ?? fallback?.specialCategories?.isOutOfSchoolYouth),
      isFarmer: Boolean(profile?.specialCategories?.isFarmer ?? fallback?.specialCategories?.isFarmer),
      isFisherfolk: Boolean(profile?.specialCategories?.isFisherfolk ?? fallback?.specialCategories?.isFisherfolk),
      isIndigenousPeoples: Boolean(profile?.specialCategories?.isIndigenousPeoples ?? fallback?.specialCategories?.isIndigenousPeoples),
      isOfwFamily: Boolean(profile?.specialCategories?.isOfwFamily ?? fallback?.specialCategories?.isOfwFamily),
      isUnemployed: Boolean(profile?.specialCategories?.isUnemployed ?? fallback?.specialCategories?.isUnemployed),
    },
    studentInfo: {
      isStudent: Boolean(profile?.studentInfo?.isStudent ?? fallback?.studentInfo?.isStudent),
      schoolName: String(
        profile?.studentInfo?.schoolName ||
          fallback?.studentInfo?.schoolName ||
          profile?.school ||
          fallback?.school ||
          ''
      ).trim(),
      schoolType: String(
        profile?.studentInfo?.schoolType ||
          fallback?.studentInfo?.schoolType ||
          profile?.schoolType ||
          fallback?.schoolType ||
          ''
      ).trim(),
      educationalLevel: String(
        profile?.studentInfo?.educationalLevel ||
          fallback?.studentInfo?.educationalLevel ||
          profile?.educationalLevel ||
          fallback?.educationalLevel ||
          ''
      ).trim(),
      courseProgram: String(
        profile?.studentInfo?.courseProgram ||
          fallback?.studentInfo?.courseProgram ||
          profile?.courseProgram ||
          profile?.course ||
          fallback?.courseProgram ||
          fallback?.course ||
          ''
      ).trim(),
      yearOrGradeLevel: String(
        profile?.studentInfo?.yearOrGradeLevel ||
          fallback?.studentInfo?.yearOrGradeLevel ||
          profile?.yearOrGradeLevel ||
          fallback?.yearOrGradeLevel ||
          ''
      ).trim(),
    },
    familyMembers: Array.isArray(profile?.familyMembers)
      ? profile.familyMembers
      : Array.isArray(fallback?.familyMembers)
        ? fallback.familyMembers
        : [],
    sectorTags: Array.isArray(profile?.sectorTags)
      ? profile.sectorTags
      : Array.isArray(fallback?.sectorTags)
        ? fallback.sectorTags
        : [],
    searchSurvey: {
      interestCategory: String(
        profile?.searchSurvey?.interestCategory ||
          fallback?.searchSurvey?.interestCategory ||
          ''
      ).trim(),
      discoveryMode: String(
        profile?.searchSurvey?.discoveryMode ||
          fallback?.searchSurvey?.discoveryMode ||
          ''
      ).trim(),
      householdIncomeBracket: String(
        profile?.searchSurvey?.householdIncomeBracket ||
          fallback?.searchSurvey?.householdIncomeBracket ||
          (isSurveyIncomeBracket(profile?.householdIncome) ? profile.householdIncome : '') ||
          (isSurveyIncomeBracket(fallback?.householdIncome) ? fallback.householdIncome : '') ||
          ''
      ).trim(),
      educationStatus: String(
        profile?.searchSurvey?.educationStatus ||
          fallback?.searchSurvey?.educationStatus ||
          ''
      ).trim(),
      isCurrentResident:
        typeof profile?.searchSurvey?.isCurrentResident === 'boolean'
          ? profile.searchSurvey.isCurrentResident
          : typeof fallback?.searchSurvey?.isCurrentResident === 'boolean'
            ? fallback.searchSurvey.isCurrentResident
            : null,
      wantsProgramNotifications:
        typeof profile?.searchSurvey?.wantsProgramNotifications === 'boolean'
          ? profile.searchSurvey.wantsProgramNotifications
          : typeof fallback?.searchSurvey?.wantsProgramNotifications === 'boolean'
            ? fallback.searchSurvey.wantsProgramNotifications
            : true,
      programFilterPreference: String(
        profile?.searchSurvey?.programFilterPreference ||
          fallback?.searchSurvey?.programFilterPreference ||
          'qualified_only'
      ).trim(),
      assistanceNeeds: Array.isArray(profile?.searchSurvey?.assistanceNeeds)
        ? profile.searchSurvey.assistanceNeeds
        : Array.isArray(fallback?.searchSurvey?.assistanceNeeds)
          ? fallback.searchSurvey.assistanceNeeds
          : [],
      completedAt: String(
        profile?.searchSurvey?.completedAt ||
          fallback?.searchSurvey?.completedAt ||
          ''
      ).trim(),
      applicantTypes: Array.isArray(profile?.searchSurvey?.applicantTypes)
        ? profile.searchSurvey.applicantTypes
        : Array.isArray(fallback?.searchSurvey?.applicantTypes)
          ? fallback.searchSurvey.applicantTypes
          : [],
    },
  };

  nextProfile.completeness = computeProfileCompletion(nextProfile);

  return nextProfile;
}

function createApplicantProfileTemplate(payload = {}) {
  return sanitizeApplicantProfile(payload, {
    fullName: payload?.fullName || payload?.name || '',
    firstName: payload?.firstName || '',
    middleName: payload?.middleName || '',
    lastName: payload?.lastName || '',
    suffix: payload?.suffix || '',
    email: payload?.email || '',
    phone: payload?.phone || '',
    alternateContactNumber: payload?.alternateContactNumber || '',
    municipality: payload?.municipality || '',
    municipalityId: payload?.municipalityId || '',
    barangay: payload?.barangay || '',
    barangayId: payload?.barangayId || '',
    houseNumber: payload?.houseNumber || '',
    streetName: payload?.streetName || '',
    subdivisionArea: payload?.subdivisionArea || '',
    zipCode: payload?.zipCode || '',
    address: payload?.address || '',
    sex: '',
    birthDate: '',
    civilStatus: '',
    citizenship: 'Filipino',
    employmentStatus: '',
    occupation: '',
    employerName: '',
    monthlyPersonalIncome: '',
    educationStatus: '',
    school: '',
    schoolType: '',
    educationalLevel: '',
    course: '',
    courseProgram: '',
    yearOrGradeLevel: '',
    householdIncome: '',
    householdMemberCount: '',
    dependentCount: '',
    housingStatus: '',
    specialCategory: '',
    disabilityType: '',
    specialCategories: {
      isSeniorCitizen: false,
      isPwd: false,
      disabilityType: '',
      isSoloParent: false,
      isOutOfSchoolYouth: false,
      isFarmer: false,
      isFisherfolk: false,
      isIndigenousPeoples: false,
      isOfwFamily: false,
      isUnemployed: false,
    },
    studentInfo: {
      isStudent: false,
      schoolName: '',
      schoolType: '',
      educationalLevel: '',
      courseProgram: '',
      yearOrGradeLevel: '',
    },
    familyMembers: [],
    sectorTags: [],
    searchSurvey: {
      interestCategory: '',
      discoveryMode: '',
      householdIncomeBracket: '',
      educationStatus: '',
      isCurrentResident: null,
      wantsProgramNotifications: true,
      programFilterPreference: 'qualified_only',
      assistanceNeeds: [],
      completedAt: '',
      applicantTypes: [],
    },
  });
}

function getProfileSpecialCategoryFromSurveyTypes(types = []) {
  const values = Array.isArray(types) ? types : [];
  const map = {
    student: 'Student',
    senior_citizen: 'Senior Citizen',
    pwd: 'Person with Disability',
    solo_parent: 'Solo Parent',
    farmer: 'Farmer',
    fisherfolk: 'Fisherfolk',
    ofw_family: 'OFW Family',
    unemployed: 'Unemployed Resident',
    general_resident: 'None',
  };

  return values.map((value) => map[value]).find(Boolean) || '';
}

function projectApplicantScopedData(state, session) {
  if (session?.role !== 'applicant') {
    return state;
  }

  const emailKey = normalizeEmail(session.email);
  const nextProfile =
    state?.applicantProfiles?.[emailKey] ||
    createApplicantProfileTemplate({
      fullName: session.name,
      firstName: session.firstName,
      middleName: session.middleName,
      lastName: session.lastName,
      suffix: session.suffix,
      email: session.email,
      phone: session.mobileNumber,
      alternateContactNumber: session.alternateContactNumber,
      municipality: session.municipality,
      barangay: session.barangay,
      houseNumber: session.houseNumber,
      streetName: session.streetName,
      subdivisionArea: session.subdivisionArea,
      zipCode: session.zipCode,
      address: session.address,
      birthDate: session.birthDate,
      sex: session.sex,
      civilStatus: session.civilStatus,
      citizenship: session.citizenship,
      employmentStatus: session.employmentStatus,
      occupation: session.occupation,
      employerName: session.employerName,
      monthlyPersonalIncome: session.monthlyPersonalIncome,
      educationStatus: session.educationStatus,
      householdIncome: session.householdIncome,
      householdMemberCount: session.householdMemberCount,
      dependentCount: session.dependentCount,
      housingStatus: session.housingStatus,
    });

  return {
    ...state,
    applicantProfile: nextProfile,
    bookmarks: [...(state?.applicantBookmarks?.[emailKey] || [])],
  };
}

function getPasswordValidationError(password) {
  const nextPassword = String(password || '');

  if (nextPassword.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  if (!/[A-Za-z]/.test(nextPassword) || !/\d/.test(nextPassword)) {
    return 'Password must contain at least one letter and one number.';
  }

  return '';
}

function getEmploymentStatusFromSurveyTypes(types = []) {
  const values = Array.isArray(types) ? types : [];

  if (values.includes('student')) return 'student';
  if (values.includes('unemployed')) return 'unemployed';
  if (values.includes('employed_low_income')) return 'employed';
  if (values.includes('senior_citizen')) return 'retired';

  return '';
}

function getLowerText(value) {
  return String(value || '').trim().toLowerCase();
}

function getSurveyFromProfile(profile = {}) {
  const source = profile?.searchSurvey || {};
  return {
    assistanceNeeds: Array.isArray(source.assistanceNeeds)
      ? source.assistanceNeeds
      : source.interestCategory
        ? [source.interestCategory]
        : [],
    applicantTypes: Array.isArray(source.applicantTypes) ? source.applicantTypes : [],
    isCurrentResident:
      typeof source.isCurrentResident === 'boolean'
        ? source.isCurrentResident
        : null,
    householdIncomeBracket: String(source.householdIncomeBracket || '').trim() || null,
    educationStatus: String(source.educationStatus || profile?.educationStatus || '').trim() || null,
    wantsProgramNotifications:
      typeof source.wantsProgramNotifications === 'boolean'
        ? source.wantsProgramNotifications
        : true,
    programFilterPreference:
      String(source.programFilterPreference || '').trim() || 'qualified_only',
  };
}

function normalizeSurveyPayload(payload = {}, fallback = {}) {
  const next = {
    ...fallback,
    ...payload,
  };

  return {
    assistanceNeeds: Array.isArray(next.assistanceNeeds)
      ? next.assistanceNeeds.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    applicantTypes: Array.isArray(next.applicantTypes)
      ? next.applicantTypes.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    isCurrentResident:
      typeof next.isCurrentResident === 'boolean'
        ? next.isCurrentResident
        : null,
    householdIncomeBracket: String(next.householdIncomeBracket || '').trim() || null,
    educationStatus: String(next.educationStatus || '').trim() || null,
    wantsProgramNotifications:
      typeof next.wantsProgramNotifications === 'boolean'
        ? next.wantsProgramNotifications
        : true,
    programFilterPreference:
      String(next.programFilterPreference || '').trim() || 'qualified_only',
  };
}

function hasSurveyResponseContent(survey = {}) {
  const assistanceNeeds = Array.isArray(survey?.assistance_needs) ? survey.assistance_needs : [];
  const applicantTypes = Array.isArray(survey?.applicant_types) ? survey.applicant_types : [];
  return Boolean(
    assistanceNeeds.length ||
      applicantTypes.length ||
      String(survey?.household_income_bracket || '').trim() ||
      String(survey?.education_status || '').trim() ||
      typeof survey?.is_current_resident === 'boolean'
  );
}

function resolveSectorIdsForSurvey(activeSectors = [], surveyPayload = {}) {
  const keywordMap = {
    student: ['student', 'education', 'scholar', 'school'],
    senior_citizen: ['senior', 'elderly'],
    pwd: ['pwd', 'disability', 'disabled'],
    solo_parent: ['solo parent', 'single parent'],
    farmer: ['farmer', 'agri', 'agriculture'],
    fisherfolk: ['fisher', 'fishing'],
    ofw_family: ['ofw', 'overseas'],
    unemployed: ['unemployed', 'job seeker'],
    indigenous_peoples: ['indigenous', 'ip'],
    out_of_school_youth: ['out of school', 'osy', 'youth'],
    education: ['education', 'school', 'scholarship'],
    financial: ['financial', 'cash', 'allowance', 'aid', 'assistance'],
    medical: ['medical', 'health', 'medicine', 'hospital'],
    livelihood: ['livelihood', 'employment', 'job', 'business', 'income'],
    disaster_relief: ['disaster', 'relief', 'calamity', 'emergency'],
    social_welfare: ['social welfare', 'welfare', 'senior', 'pwd', 'solo parent'],
    general: [],
  };

  const applicantTypes = Array.isArray(surveyPayload.applicantTypes)
    ? surveyPayload.applicantTypes
    : [];
  const assistanceNeeds = Array.isArray(surveyPayload.assistanceNeeds)
    ? surveyPayload.assistanceNeeds
    : [];

  const lookupWords = new Set(
    [...applicantTypes, ...assistanceNeeds]
      .flatMap((key) => keywordMap[key] || [key])
      .map((item) => getLowerText(item))
      .filter(Boolean)
  );

  if (!lookupWords.size) {
    return [];
  }

  return (activeSectors || [])
    .filter((sector) => {
      const haystack = `${getLowerText(sector?.name)} ${getLowerText(sector?.description)}`;
      return [...lookupWords].some((needle) => needle && haystack.includes(needle));
    })
    .map((sector) => sector.id)
    .filter(Boolean);
}

function formatLastActiveLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function buildApplicantUsername(fullName, email) {
  const nameToken = String(fullName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
  const emailToken = normalizeEmail(email).split('@')[0];

  return nameToken || emailToken || `applicant.${Date.now()}`;
}

function getSessionRoleLabel(account) {
  if (!account) {
    return 'User';
  }

  return account.title || getAccountRoleLabel(account);
}

function getActorRoleLabel(account) {
  return getSessionRoleLabel(account);
}

function resolveParentStaffRole(account, users = []) {
  if (!account?.parentStaffId) {
    return null;
  }

  const parentAccount = (users || []).find((user) => user.id === account.parentStaffId);

  if (!parentAccount) {
    return null;
  }

  return parentAccount.staffRole || getStaffRoleKey(parentAccount) || null;
}

function createSessionPayload(account, users = []) {
  const staffRole = getStaffRoleKey(account);
  const appRole = isStaffAccount(account) ? 'personnel' : account.role;

  return {
    id: account.id,
    role: appRole,
    dbRole: account.dbRole || account.role,
    staffRole: account.staffRole || staffRole,
    email: account.email,
    name: account.name,
    firstName: account.firstName || '',
    middleName: account.middleName || '',
    lastName: account.lastName || '',
    suffix: account.suffix || '',
    mobileNumber: account.mobileNumber || account.phone || '',
    alternateContactNumber: account.alternateContactNumber || '',
    barangay: account.barangay || '',
    houseNumber: account.houseNumber || '',
    streetName: account.streetName || '',
    subdivisionArea: account.subdivisionArea || '',
    zipCode: account.zipCode || '',
    address: account.address || '',
    birthDate: account.birthDate || '',
    sex: account.sex || '',
    civilStatus: account.civilStatus || '',
    citizenship: account.citizenship || '',
    employmentStatus: account.employmentStatus || '',
    occupation: account.occupation || '',
    employerName: account.employerName || '',
    monthlyPersonalIncome: account.monthlyPersonalIncome || '',
    educationStatus: account.educationStatus || '',
    householdIncome: account.householdIncome || '',
    householdMemberCount: account.householdMemberCount || '',
    dependentCount: account.dependentCount || '',
    housingStatus: account.housingStatus || '',
    specialCategory: account.specialCategory || '',
    title: account.title || getAccountRoleLabel(account),
    office: account.office,
    officeId: account.officeId || account.office_id || '',
    office_id: account.officeId || account.office_id || '',
    municipality: account.municipality,
    municipalityId: account.municipalityId || account.municipality_id || '',
    municipality_id: account.municipalityId || account.municipality_id || '',
    barangayId: account.barangayId || account.barangay_id || '',
    barangay_id: account.barangayId || account.barangay_id || '',
    status: account.status,
    createdByUserId: account.createdByUserId || null,
    parentStaffId: account.parentStaffId || null,
    parentStaffRole: resolveParentStaffRole(account, users),
    rootManagerId: account.rootManagerId || getDefaultRootManagerId(account),
    mustChangePassword: Boolean(account.mustChangePassword),
  };
}

function readSessionSnapshot() {
  clearLegacyPrototypeStorage();
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(APP_SESSION_SNAPSHOT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.role) {
      return null;
    }

    return parsed;
  } catch (error) {
    window.localStorage.removeItem(APP_SESSION_SNAPSHOT_STORAGE_KEY);
    return null;
  }
}

function resolveLiveSessionSnapshot(session, data) {
  if (!session?.email) {
    return session;
  }

  if (isSupabaseConfigured) {
    return session;
  }

  const matchingUser = (data?.users || []).find(
    (user) => String(user.email || '').toLowerCase() === String(session.email || '').toLowerCase()
  );

  if (!matchingUser) {
    return session;
  }

  const nextRole = matchingUser.role || session.role;
  const nextSession = {
    ...session,
    id: matchingUser.id || session.id,
    role: nextRole,
    staffRole: matchingUser.staffRole || session.staffRole || getStaffRoleKey(matchingUser),
    name: matchingUser.name || session.name,
    title: matchingUser.title || session.title || getRoleTitle(nextRole, matchingUser.staffRole),
    office: matchingUser.office || session.office,
    municipality: matchingUser.municipality || session.municipality,
    status: matchingUser.status || session.status,
    createdByUserId: matchingUser.createdByUserId || session.createdByUserId || null,
    parentStaffId: matchingUser.parentStaffId || session.parentStaffId || null,
    parentStaffRole: resolveParentStaffRole(matchingUser, data?.users || []) || session.parentStaffRole || null,
    rootManagerId: matchingUser.rootManagerId || session.rootManagerId || getDefaultRootManagerId(matchingUser),
  };

  const hasChanged =
    nextSession.id !== session.id ||
    nextSession.role !== session.role ||
    nextSession.staffRole !== session.staffRole ||
    nextSession.name !== session.name ||
    nextSession.title !== session.title ||
    nextSession.office !== session.office ||
    nextSession.municipality !== session.municipality ||
    nextSession.status !== session.status ||
    nextSession.createdByUserId !== session.createdByUserId ||
    nextSession.parentStaffId !== session.parentStaffId ||
    nextSession.parentStaffRole !== session.parentStaffRole ||
    nextSession.rootManagerId !== session.rootManagerId;

  return hasChanged ? nextSession : session;
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSessionLockAbortError(error) {
  const message = String(error?.message || '').toLowerCase();
  const name = String(error?.name || '').toLowerCase();
  return (
    name === 'aborterror' ||
    message.includes("lock broken by another request with the 'steal' option") ||
    message.includes('lock request aborted') ||
    message.includes('aborterror')
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runWithSessionLockRetry(task, attempts = 2) {
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isSessionLockAbortError(error) || attempt >= attempts - 1) {
        throw error;
      }
      await wait(120 * (attempt + 1));
    }
  }

  throw lastError;
}

function getRoleTitle(role, staffRole = null) {
  if (role === 'personnel') {
    return getStaffRoleLabel(staffRole);
  }

  return 'Applicant';
}

function resolveManagedOffice(role, municipality, offices, preferredOffice) {
  if (role === 'applicant') {
    return 'Resident Applicant Portal';
  }

  if (preferredOffice) {
    return preferredOffice;
  }

  const officesInMunicipality = offices.filter(
    (office) => office.municipality === municipality && office.status !== 'Archived'
  );
  const socialWelfareMatch = officesInMunicipality.find((office) =>
    /social welfare|community services/i.test(`${office.name} ${office.type}`)
  );
  const activeMatch = officesInMunicipality.find((office) => office.status === 'Active');
  const exactMatch = officesInMunicipality[0];
  const provinceWide = offices.find((office) => office.municipality === 'Province-wide');

  return socialWelfareMatch?.name || activeMatch?.name || exactMatch?.name || provinceWide?.name || `${municipality} Municipal Office`;
}

function getOfficeName(office) {
  return office?.name || office?.officeName || office?.office_name || '';
}

function getOfficeLevel(office) {
  return String(office?.officeLevel || office?.office_level || office?.type || '').toLowerCase();
}

function getOfficeMunicipality(office, municipalities = []) {
  if (office?.municipality) {
    return office.municipality;
  }

  const municipalityId = office?.municipalityId || office?.municipality_id;
  return municipalities.find((municipality) => municipality.id === municipalityId)?.name || '';
}

function getOfficeBarangay(office, barangays = []) {
  if (office?.barangay) {
    return office.barangay;
  }

  const barangayId = office?.barangayId || office?.barangay_id;
  return barangays.find((barangay) => barangay.id === barangayId)?.name || '';
}

function resolveStaffOffice(role, municipality, offices, preferredOffice, options = {}) {
  if (preferredOffice) {
    return preferredOffice;
  }

  if (role === 'barangay_captain' || role === 'barangay_secretary') {
    const barangay = String(options.barangay || '').trim();
    const barangayOffice = offices.find((office) => {
      const level = getOfficeLevel(office);
      return (
        level.includes('barangay') &&
        getOfficeMunicipality(office, options.municipalities || []) === municipality &&
        (!barangay || getOfficeBarangay(office, options.barangays || []) === barangay)
      );
    });

    if (barangayOffice) {
      return getOfficeName(barangayOffice);
    }
  }

  const municipalOffice = offices.find((office) => {
    const level = getOfficeLevel(office);
    return (
      ['municipal', 'municipal office', 'city office'].some((value) => level.includes(value)) &&
      getOfficeMunicipality(office, options.municipalities || []) === municipality
    );
  });

  if (municipalOffice) {
    return getOfficeName(municipalOffice);
  }

  if (role === 'municipal_mayor' || role === 'municipal_secretary') {
    return `${municipality} Municipal Office`;
  }

  return resolveManagedOffice('personnel', municipality, offices, preferredOffice);
}

function getAccessStatus(startDate, endDate) {
  const today = getTodayDateValue();

  if (endDate && endDate < today) {
    return 'Inactive';
  }

  if (startDate && startDate > today) {
    return 'Pending';
  }

  return 'Active';
}

function parseListInput(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRequirementDocument(documents, ownerEmail, requirementName, applicationId = null) {
  return (documents || []).find(
    (document) =>
      document.ownerEmail === ownerEmail &&
      (!applicationId || !document.applicationId || document.applicationId === applicationId) &&
      String(document.name || '').toLowerCase() === String(requirementName || '').toLowerCase()
  );
}

function buildRequirementFileSnapshot(documents, ownerEmail, requirementName, applicationId = null) {
  const document = getRequirementDocument(documents, ownerEmail, requirementName, applicationId);

  if (!document || (!document.fileUrl && !document.fileName)) {
    return null;
  }

  return {
    requirementName,
    fileName: document.fileName || document.name,
    fileUrl: document.fileUrl || '',
    fileType: document.fileType || document.category || 'File',
    uploadedAt: document.uploadedAt || '',
    status: document.status || 'Pending Review',
  };
}

function getProgramRequirementItems(program = {}, requiredOnly = false) {
  const records = Array.isArray(program?.requirementRecords) && program.requirementRecords.length
    ? program.requirementRecords
    : (program?.requirements || []).map((name) => ({ name, isRequired: true }));
  const requiredRecords = records.map((requirement) => ({
    ...requirement,
    isRequired: true,
  }));

  return requiredOnly ? requiredRecords : requiredRecords;
}

function getRequirementName(requirement) {
  return typeof requirement === 'string' ? requirement : requirement?.name || requirement?.requirementName || '';
}

function readProfileNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function getApplicantAge(profile = {}) {
  if (!profile.birthDate) {
    return null;
  }

  const birthDate = new Date(`${profile.birthDate}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getApplicantSpecialFlags(profile = {}) {
  const special = profile.specialCategories || {};
  const text = String(profile.specialCategory || '').toLowerCase();
  const applicantTypes = Array.isArray(profile.searchSurvey?.applicantTypes)
    ? profile.searchSurvey.applicantTypes.map((item) => String(item || '').toLowerCase())
    : [];

  return {
    isSeniorCitizen: Boolean(special.isSeniorCitizen || text.includes('senior') || applicantTypes.includes('senior_citizen')),
    isPwd: Boolean(special.isPwd || text.includes('disability') || text.includes('pwd') || applicantTypes.includes('pwd')),
    isSoloParent: Boolean(special.isSoloParent || text.includes('solo') || applicantTypes.includes('solo_parent')),
    isFarmer: Boolean(special.isFarmer || text.includes('farmer') || applicantTypes.includes('farmer')),
    isFisherfolk: Boolean(special.isFisherfolk || text.includes('fisher') || applicantTypes.includes('fisherfolk')),
    isOutOfSchoolYouth: Boolean(special.isOutOfSchoolYouth || text.includes('out of school') || applicantTypes.includes('out_of_school_youth')),
    isIndigenousPeoples: Boolean(special.isIndigenousPeoples || text.includes('indigenous') || applicantTypes.includes('indigenous_peoples')),
    isOfwFamily: Boolean(special.isOfwFamily || text.includes('ofw') || applicantTypes.includes('ofw_family')),
    isUnemployed: Boolean(special.isUnemployed || text.includes('unemployed') || applicantTypes.includes('unemployed')),
    isStudent: isStudentProfile(profile),
  };
}

function findFamilyMember(profile = {}, relationshipType) {
  const normalized = String(relationshipType || '').toLowerCase();
  return (profile.familyMembers || []).find((member) =>
    String(member.relationshipType || member.relationship_type || '').toLowerCase() === normalized
  );
}

function getMissingProgramSpecificApplicantDetails(profile = {}, program = {}) {
  const rules = program.eligibilityRules || {};
  const missing = [];
  const special = getApplicantSpecialFlags(profile);

  if ((rules.minAge || rules.maxAge) && !profile.birthDate) missing.push('Birth date');
  if (rules.requiredSex && !profile.sex) missing.push('Sex');
  if (rules.requiredCivilStatus && !profile.civilStatus) missing.push('Civil status');
  if (rules.requiredCitizenship && !profile.citizenship) missing.push('Citizenship');
  if ((rules.requiredMunicipalityId || program.municipalityId) && !profile.municipalityId && !profile.municipality) missing.push('Municipality');
  if ((rules.requiredBarangayId || program.barangayId) && !profile.barangayId && !profile.barangay) missing.push('Barangay');
  if ((rules.minPersonalIncome || rules.maxPersonalIncome) && !hasNonEmptyProfileValue(profile.monthlyPersonalIncome) && !special.isStudent) missing.push('Monthly personal income');
  if ((rules.minHouseholdIncome || rules.maxHouseholdIncome) && !hasNonEmptyProfileValue(profile.householdIncome)) missing.push('Household monthly income');
  if (rules.requiredEducationalAttainment && !profile.educationStatus) missing.push('Educational attainment');
  if (rules.requiredEmploymentStatus && !profile.employmentStatus) missing.push('Employment status');
  if (rules.requiredOccupation && !profile.occupation && !special.isStudent) missing.push('Occupation');
  if (rules.requiresStudent && !profile.studentInfo?.isStudent && !special.isStudent) missing.push('Student information');
  if (rules.requiresPwd && !special.isPwd) missing.push('PWD information');
  if (rules.requiresFatherIncomeCheck && !hasNonEmptyProfileValue(findFamilyMember(profile, 'father')?.monthlyIncome)) missing.push('Father monthly income');
  if (rules.requiresMotherIncomeCheck && !hasNonEmptyProfileValue(findFamilyMember(profile, 'mother')?.monthlyIncome)) missing.push('Mother monthly income');
  if (rules.requiresGuardianIncomeCheck && !hasNonEmptyProfileValue(findFamilyMember(profile, 'guardian')?.monthlyIncome)) missing.push('Guardian monthly income');

  return [...new Set(missing)];
}

function checkProgramEligibility(profile = {}, program = {}, applicationCount = 0) {
  const rules = program.eligibilityRules || {};
  const failed = [];
  const special = getApplicantSpecialFlags(profile);
  const age = getApplicantAge(profile);
  const personalIncome = readProfileNumber(profile.monthlyPersonalIncome);
  const householdIncome = readProfileNumber(profile.householdIncome);

  if (rules.minAge && age !== null && age < Number(rules.minAge)) failed.push('Applicant is below the minimum age.');
  if (rules.maxAge && age !== null && age > Number(rules.maxAge)) failed.push('Applicant is above the maximum age.');
  if (rules.requiredSex && profile.sex && profile.sex !== rules.requiredSex) failed.push('Applicant sex does not match the program requirement.');
  if (rules.requiredCivilStatus && profile.civilStatus && profile.civilStatus !== rules.requiredCivilStatus) failed.push('Civil status does not match the program requirement.');
  if (rules.requiredCitizenship && profile.citizenship && String(profile.citizenship).toLowerCase() !== String(rules.requiredCitizenship).toLowerCase()) failed.push('Citizenship does not match the program requirement.');
  if (rules.requiredMunicipalityId && profile.municipalityId && profile.municipalityId !== rules.requiredMunicipalityId) failed.push('Applicant is outside the required municipality.');
  if (rules.requiredBarangayId && profile.barangayId && profile.barangayId !== rules.requiredBarangayId) failed.push('Applicant is outside the required barangay.');
  if (rules.minPersonalIncome && personalIncome !== null && personalIncome < Number(rules.minPersonalIncome)) failed.push('Personal income is below the minimum requirement.');
  if (rules.maxPersonalIncome && personalIncome !== null && personalIncome > Number(rules.maxPersonalIncome)) failed.push('Personal income exceeds the limit.');
  if (rules.minHouseholdIncome && householdIncome !== null && householdIncome < Number(rules.minHouseholdIncome)) failed.push('Household income is below the minimum requirement.');
  if (rules.maxHouseholdIncome && householdIncome !== null && householdIncome > Number(rules.maxHouseholdIncome)) failed.push('Household income exceeds the limit.');
  if (rules.requiresStudent && !special.isStudent) failed.push('Program requires a student applicant.');
  if (rules.requiresPwd && !special.isPwd) failed.push('Program requires a PWD applicant.');
  if (rules.requiresSoloParent && !special.isSoloParent) failed.push('Program requires a solo parent applicant.');
  if (rules.requiresFarmer && !special.isFarmer) failed.push('Program requires a farmer applicant.');
  if (rules.requiresFisherfolk && !special.isFisherfolk) failed.push('Program requires a fisherfolk applicant.');
  if (rules.requiresOutOfSchoolYouth && !special.isOutOfSchoolYouth) failed.push('Program requires an out-of-school youth applicant.');
  if (rules.requiresIndigenousPeoples && !special.isIndigenousPeoples) failed.push('Program requires an indigenous peoples applicant.');
  if (rules.requiresOfwFamily && !special.isOfwFamily) failed.push('Program requires an OFW family applicant.');
  if (rules.requiresUnemployed && !special.isUnemployed) failed.push('Program requires an unemployed applicant.');
  if (program.slots > 0 && applicationCount >= Number(program.slots)) failed.push('Program slots are already full.');

  return {
    qualified: failed.length === 0,
    reasons: failed,
  };
}

function readNumericInput(value, fallback, defaultValue) {
  if (value === '' || value === null || value === undefined) {
    return Number(fallback) || defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number(fallback) || defaultValue;
}

function normalizeProgramPayload(payload, session, fallback = {}) {
  const summary = String(payload.summary ?? fallback.summary ?? '').trim();
  const slots = readNumericInput(payload.slots, fallback.slots, 30);
  const maxBeneficiaries = readNumericInput(payload.maxBeneficiaries, fallback.maxBeneficiaries, slots);
  return {
    title: String(payload.title ?? fallback.title ?? '').trim(),
    category: payload.category || fallback.category || '',
    sector: payload.sector || fallback.sector || '',
    programType: String(payload.programType ?? fallback.programType ?? 'Government Assistance Program').trim(),
    office: fallback.office || session?.office || '',
    municipality: payload.municipality || fallback.municipality || session?.municipality || '',
    applicationStartDate: payload.applicationStartDate ?? fallback.applicationStartDate ?? '',
    applicationEndDate: payload.applicationEndDate ?? fallback.applicationEndDate ?? '',
    deadline: payload.deadline ?? fallback.deadline ?? '',
    status: payload.status || fallback.status || 'Open',
    visibility: fallback.visibility || 'Public',
    applicants: Number(fallback.applicants) || 0,
    slots,
    maxBeneficiaries,
    fitScore: Number(fallback.fitScore) || 80,
    summary,
    description: summary || fallback.description || '',
    objective: String(payload.objective ?? fallback.objective ?? summary).trim(),
    benefits: String(payload.benefits ?? fallback.benefits ?? payload.additionalNotes ?? '').trim(),
    coverageNotes: String(payload.coverageNotes ?? fallback.coverageNotes ?? session?.municipality ?? '').trim(),
    submissionInstructions: String(payload.submissionInstructions ?? fallback.submissionInstructions ?? '').trim(),
    additionalNotes: String(payload.additionalNotes ?? fallback.additionalNotes ?? '').trim(),
    imageReference: payload.imageReference ?? fallback.imageReference ?? '',
    imageName: String(payload.imageName ?? fallback.imageName ?? '').trim(),
    requirements: parseListInput(payload.requirements ?? fallback.requirements),
    eligibility: parseListInput(payload.eligibilityNotes ?? payload.eligibility ?? fallback.eligibility),
    eligibilityRules: {
      ...(fallback.eligibilityRules || {}),
      minAge: payload.minAge ?? fallback.eligibilityRules?.minAge ?? '',
      maxAge: payload.maxAge ?? fallback.eligibilityRules?.maxAge ?? '',
      minPersonalIncome: payload.minPersonalIncome ?? fallback.eligibilityRules?.minPersonalIncome ?? '',
      maxPersonalIncome: payload.maxPersonalIncome ?? fallback.eligibilityRules?.maxPersonalIncome ?? '',
      minHouseholdIncome: payload.minHouseholdIncome ?? fallback.eligibilityRules?.minHouseholdIncome ?? '',
      maxHouseholdIncome: payload.maxHouseholdIncome ?? fallback.eligibilityRules?.maxHouseholdIncome ?? '',
      requiresSeniorCitizen: Boolean(payload.requiresSeniorCitizen ?? fallback.eligibilityRules?.requiresSeniorCitizen),
      requiresPwd: Boolean(payload.requiresPwd ?? fallback.eligibilityRules?.requiresPwd),
      requiresSoloParent: Boolean(payload.requiresSoloParent ?? fallback.eligibilityRules?.requiresSoloParent),
      requiresFarmer: Boolean(payload.requiresFarmer ?? fallback.eligibilityRules?.requiresFarmer),
      requiresFisherfolk: Boolean(payload.requiresFisherfolk ?? fallback.eligibilityRules?.requiresFisherfolk),
      requiresOutOfSchoolYouth: Boolean(payload.requiresOutOfSchoolYouth ?? fallback.eligibilityRules?.requiresOutOfSchoolYouth),
      requiresIndigenousPeoples: Boolean(payload.requiresIndigenousPeoples ?? fallback.eligibilityRules?.requiresIndigenousPeoples),
      requiresOfwFamily: Boolean(payload.requiresOfwFamily ?? fallback.eligibilityRules?.requiresOfwFamily),
      requiresUnemployed: Boolean(payload.requiresUnemployed ?? fallback.eligibilityRules?.requiresUnemployed),
      customRuleNotes: String(payload.eligibilityNotes ?? fallback.eligibilityRules?.customRuleNotes ?? '').trim(),
    },
    attachments: payload.internalDocumentNames
      ? parseListInput(payload.internalDocumentNames)
      : parseListInput(payload.attachments ?? fallback.attachments),
    createdByStaffRole: fallback.createdByStaffRole || session?.title || getSessionRoleLabel(session),
    archived: Boolean(fallback.archived),
  };
}

function pickFields(source, fields) {
  return fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
    return result;
  }, {});
}

function canManageProgramSections(account) {
  return canComposeProgramContent(account) || canSetProgramRelease(account);
}

function getProgramUpdatePatch(account, normalizedProgram) {
  return {
    ...(canComposeProgramContent(account) ? pickFields(normalizedProgram, PROGRAM_CONTENT_FIELDS) : {}),
    ...(canSetProgramRelease(account) ? pickFields(normalizedProgram, PROGRAM_RELEASE_FIELDS) : {}),
  };
}

function getStaffInviteScope(session, desiredStaffRole, payload, offices, references = {}) {
  const inheritedMunicipality = session?.municipality || '';
  const inheritedOffice = session?.office || '';
  const isCaptainWorkspace = hasCaptainWorkspaceAccess(session);

  if (isCaptainWorkspace) {
    const municipality = payload.municipality || inheritedMunicipality;

    if (desiredStaffRole === 'system_admin') {
      return {
        municipality,
        office: resolveStaffOffice(desiredStaffRole, municipality, offices, payload.office, references),
        parentStaffId: null,
        rootManagerId: null,
      };
    }

    if (desiredStaffRole === 'barangay_captain' || desiredStaffRole === 'barangay_secretary') {
      return {
        municipality,
        barangay: payload.barangay || '',
        office: resolveStaffOffice(desiredStaffRole, municipality, offices, payload.office, { ...references, barangay: payload.barangay }),
        parentStaffId: session.id,
        rootManagerId: session.id,
      };
    }

    return {
      municipality,
      office: resolveStaffOffice(desiredStaffRole, municipality, offices, payload.office || inheritedOffice, references),
      parentStaffId: session.id,
      rootManagerId: session.id,
    };
  }

  return {
    municipality: payload.municipality || inheritedMunicipality || '',
    office: inheritedOffice || payload.office || '',
    parentStaffId: session?.id || null,
    rootManagerId: session?.rootManagerId || session?.id || null,
  };
}

function reconcileProgramTaxonomy(state) {
  const programs = state?.programs || [];
  const nextCategories = mergeTaxonomyItems(
    state?.categories || [],
    programs.map((program) => program?.category),
    'category'
  );
  const nextSectors = mergeTaxonomyItems(
    state?.sectors || [],
    programs.map((program) => program?.sector),
    'sector'
  );

  if (
    hasSameTaxonomyNames(state?.categories, nextCategories) &&
    hasSameTaxonomyNames(state?.sectors, nextSectors)
  ) {
    return state;
  }

  return {
    ...state,
    categories: nextCategories,
    sectors: nextSectors,
  };
}

export function useProgramFinderApp() {
  const [path, setPath] = useState(() => normalizePath(getHashPath()));
  const [storedSession, setStoredSession] = useState(() => readSessionSnapshot());
  const [rawData, setData] = useState(() => createEmptyAppState());
  const [toast, setToast] = useState(null);
  const session = resolveLiveSessionSnapshot(storedSession, rawData);
  const data = projectApplicantScopedData(rawData, session);

  useEffect(() => {
    setData((current) => {
      const reconciled = reconcileProgramTaxonomy(current);
      return reconciled === current ? current : reconciled;
    });
  }, [rawData.programs, rawData.categories, rawData.sectors]);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
      setPath('/');
    }

    const handleHashChange = () => {
      setPath(normalizePath(getHashPath()));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    clearLegacyPrototypeStorage();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (!storedSession) {
        window.localStorage.removeItem(APP_SESSION_SNAPSHOT_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(APP_SESSION_SNAPSHOT_STORAGE_KEY, JSON.stringify(storedSession));
    } catch (error) {
      // Ignore storage quota/privacy mode errors.
    }
  }, [storedSession]);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setData(createEmptyAppState());
      applyUiBrandingTheme(DEFAULT_UI_BRANDING);
      showToast('Supabase is not configured. Runtime demo data and local fallback storage are disabled.', 'warning');
      return undefined;
    }

    Promise.all([
      listOfficeManagementRecords(),
      getLatestUiSettings(),
      listProgramRecords().catch((error) => {
        showToast(error?.message || 'Unable to load program listings.', 'danger');
        return { programs: [], categories: [], sectors: [], requirementTemplates: [] };
      }),
      listActiveSectors().catch(() => []),
    ])
      .then(([records, uiBranding, programRecords, activeSectors]) => {
        if (!isMounted) {
          return;
        }

        setData((current) => ({
          ...current,
          offices: records.offices || [],
          municipalities: records.municipalities || [],
          barangays: records.barangays || [],
          programs: programRecords.programs || [],
          categories: programRecords.categories || [],
          sectors: programRecords.sectors || [],
          activeSectors: activeSectors || [],
          requirementTemplates: programRecords.requirementTemplates || [],
          uiBranding: getNormalizedUiBranding(uiBranding),
        }));
      })
      .catch((error) => {
        if (isMounted) {
          showToast(error.message || 'Unable to load Supabase reference records.', 'danger');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const currentSessionId = session?.id;
    const currentSessionRole = session?.role;

    if (!isSupabaseConfigured || !currentSessionId || currentSessionRole !== 'applicant') {
      return undefined;
    }

    ensureApplicantSurveyResponse(session.id)
      .then((surveyResponse) => {
        if (!isMounted) {
          return;
        }

        const emailKey = normalizeEmail(session.email);
        const hasSurveyContent = hasSurveyResponseContent(surveyResponse);
        const surveyCompletedAt = hasSurveyContent
          ? String(surveyResponse.updated_at || surveyResponse.created_at || getTodayDateValue()).trim()
          : '';

        setData((current) => {
          const draft = clone(current);
          const existingProfile =
            draft.applicantProfiles?.[emailKey] ||
            createApplicantProfileTemplate({
              fullName: session.name,
              email: session.email,
              municipality: session.municipality,
            });

          draft.applicantProfiles = {
            ...(draft.applicantProfiles || {}),
            [emailKey]: sanitizeApplicantProfile(existingProfile, {
              fullName: session.name,
              email: session.email,
              municipality: session.municipality,
              educationStatus: String(surveyResponse.education_status || existingProfile?.educationStatus || '').trim(),
              employmentStatus:
                getEmploymentStatusFromSurveyTypes(surveyResponse.applicant_types) ||
                existingProfile?.employmentStatus ||
                '',
              specialCategory: getProfileSpecialCategoryFromSurveyTypes(surveyResponse.applicant_types) || existingProfile?.specialCategory || '',
              searchSurvey: {
                ...(existingProfile?.searchSurvey || {}),
                interestCategory: String(surveyResponse.assistance_needs?.[0] || existingProfile?.searchSurvey?.interestCategory || '').trim(),
                assistanceNeeds: Array.isArray(surveyResponse.assistance_needs) ? surveyResponse.assistance_needs : [],
                discoveryMode: 'browse',
                householdIncomeBracket: String(
                  surveyResponse.household_income_bracket ||
                    existingProfile?.searchSurvey?.householdIncomeBracket ||
                    ''
                ).trim(),
                educationStatus: String(
                  surveyResponse.education_status ||
                    existingProfile?.searchSurvey?.educationStatus ||
                    ''
                ).trim(),
                isCurrentResident:
                  typeof surveyResponse.is_current_resident === 'boolean'
                    ? surveyResponse.is_current_resident
                    : existingProfile?.searchSurvey?.isCurrentResident ?? null,
                wantsProgramNotifications:
                  typeof surveyResponse.wants_program_notifications === 'boolean'
                    ? surveyResponse.wants_program_notifications
                    : existingProfile?.searchSurvey?.wantsProgramNotifications ?? true,
                programFilterPreference: String(
                  surveyResponse.program_filter_preference ||
                    existingProfile?.searchSurvey?.programFilterPreference ||
                    'qualified_only'
                ).trim(),
                completedAt: surveyCompletedAt,
                applicantTypes: Array.isArray(surveyResponse.applicant_types) ? surveyResponse.applicant_types : [],
              },
            }),
          };

          draft.applicantProfiles[emailKey].searchSurvey = {
            ...(draft.applicantProfiles[emailKey]?.searchSurvey || {}),
            interestCategory: String(surveyResponse.assistance_needs?.[0] || draft.applicantProfiles[emailKey]?.searchSurvey?.interestCategory || '').trim(),
            assistanceNeeds: Array.isArray(surveyResponse.assistance_needs) ? surveyResponse.assistance_needs : [],
            discoveryMode: 'browse',
            householdIncomeBracket: String(
            surveyResponse.household_income_bracket ||
                draft.applicantProfiles[emailKey]?.searchSurvey?.householdIncomeBracket ||
                ''
            ).trim(),
            educationStatus: String(
              surveyResponse.education_status ||
                draft.applicantProfiles[emailKey]?.searchSurvey?.educationStatus ||
                ''
            ).trim(),
            isCurrentResident:
              typeof surveyResponse.is_current_resident === 'boolean'
                ? surveyResponse.is_current_resident
                : draft.applicantProfiles[emailKey]?.searchSurvey?.isCurrentResident ?? null,
            wantsProgramNotifications:
              typeof surveyResponse.wants_program_notifications === 'boolean'
                ? surveyResponse.wants_program_notifications
                : draft.applicantProfiles[emailKey]?.searchSurvey?.wantsProgramNotifications ?? true,
            programFilterPreference: String(
              surveyResponse.program_filter_preference ||
                draft.applicantProfiles[emailKey]?.searchSurvey?.programFilterPreference ||
                'qualified_only'
            ).trim(),
            completedAt: surveyCompletedAt,
            applicantTypes: Array.isArray(surveyResponse.applicant_types) ? surveyResponse.applicant_types : [],
          };
          if (!draft.applicantProfiles[emailKey].educationStatus) {
            draft.applicantProfiles[emailKey].educationStatus = String(surveyResponse.education_status || '').trim();
          }
          if (!draft.applicantProfiles[emailKey].employmentStatus) {
            draft.applicantProfiles[emailKey].employmentStatus = getEmploymentStatusFromSurveyTypes(surveyResponse.applicant_types) || '';
          }
          if (!draft.applicantProfiles[emailKey].specialCategory) {
            draft.applicantProfiles[emailKey].specialCategory = getProfileSpecialCategoryFromSurveyTypes(surveyResponse.applicant_types) || '';
          }

          return draft;
        });
      })
      .catch((error) => {
        if (isMounted) {
          showToast(error.message || 'Unable to load your survey responses.', 'danger');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !session?.id) {
      return undefined;
    }

    listUserNotifications(session.id)
      .then((notifications) => {
        if (!isMounted) {
          return;
        }
        setData((current) => ({
          ...current,
          notifications,
        }));
      })
      .catch((error) => {
        if (isMounted) {
          showToast(error.message || 'Unable to load notifications.', 'danger');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    const currentSessionId = session?.id;
    const currentSessionRole = session?.role;

    if (!isSupabaseConfigured || !currentSessionId || currentSessionRole !== 'applicant') {
      return undefined;
    }

    Promise.all([
      listApplicantProfileDocuments(session.id),
      listApplicantFamilyMembers(session.id),
      listApplicantSectorTags(session.id),
    ])
      .then(([documents, familyMembers, sectorTags]) => {
        if (!isMounted) {
          return;
        }

        const emailKey = normalizeEmail(session.email);
        setData((current) => {
          const draft = clone(current);
          const existingProfile =
            draft.applicantProfiles?.[emailKey] ||
            createApplicantProfileTemplate({
              fullName: session.name,
              email: session.email,
              municipality: session.municipality,
            });

          draft.applicantProfileDocuments = documents || [];
          draft.applicantProfiles = {
            ...(draft.applicantProfiles || {}),
            [emailKey]: sanitizeApplicantProfile(
              {
                ...existingProfile,
                familyMembers: familyMembers || [],
                sectorTags: sectorTags || [],
              },
              existingProfile
            ),
          };

          return draft;
        });
      })
      .catch((error) => {
        if (isMounted) {
          showToast(error.message || 'Unable to load applicant profile records.', 'danger');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    const currentSessionId = session?.id;
    const currentSessionRole = session?.role;

    if (!isSupabaseConfigured || !currentSessionId || currentSessionRole !== 'applicant') {
      return undefined;
    }

    listApplicantBookmarks(session.id)
      .then((bookmarkProgramIds) => {
        if (!isMounted) {
          return;
        }

        const emailKey = normalizeEmail(session.email);
        setData((current) => {
          const draft = clone(current);
          draft.applicantBookmarks = {
            ...(draft.applicantBookmarks || {}),
            [emailKey]: bookmarkProgramIds || [],
          };
          return draft;
        });
      })
      .catch((error) => {
        if (isMounted) {
          showToast(error.message || 'Unable to load bookmarked programs.', 'danger');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !session?.id) {
      return undefined;
    }

    listApplicationRecords(session)
      .then((applications) => {
        if (!isMounted) {
          return;
        }

        const applicationDocuments = applications.flatMap((application) =>
          (application.requirementFiles || []).map((file) => ({
            id: file.applicationDocumentId || `${application.id}-${file.requirementName}`,
            requirementId: file.requirementId || '',
            applicationId: application.id,
            ownerEmail: application.applicantEmail,
            name: file.requirementName,
            category: 'Application Requirement',
            status: file.status || 'Pending Review',
            uploadedAt: file.uploadedAt || application.submittedAt || '',
            fileName: file.fileName || '',
            fileType: file.fileType || 'File',
            fileUrl: file.fileUrl || '',
            aiCheckStatus: file.aiCheckStatus || 'not_checked',
            aiCheckResult: file.aiCheckResult || null,
          }))
        );

        setData((current) => ({
          ...current,
          applications,
          documents: [
            ...applicationDocuments,
            ...(current.documents || []).filter((document) => document.category !== 'Application Requirement'),
          ],
        }));
      })
      .catch((error) => {
        if (isMounted) {
          showToast(error.message || 'Unable to load application records.', 'danger');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || storedSession) {
      return undefined;
    }

    async function restoreSupabaseSession() {
      try {
        const staffAccount = await getSignedInStaffAccount();
        if (!isMounted || !staffAccount) {
          if (!isMounted) {
            return;
          }
        } else {
          setStoredSession(createSessionPayload(staffAccount, [staffAccount, ...(rawData.users || [])]));
          return;
        }

        const applicantAccount = await getSignedInApplicantAccount();
        if (!isMounted || !applicantAccount) {
          return;
        }

        setData((current) => {
          const draft = clone(current);
          const emailKey = normalizeEmail(applicantAccount.email);
          const existingProfile = draft.applicantProfiles?.[emailKey] || {};
          const nextApplicantAccount = {
            ...applicantAccount,
            role: 'applicant',
            phone: applicantAccount.mobileNumber || applicantAccount.phone || '',
          };

          draft.users = [
            nextApplicantAccount,
            ...(draft.users || []).filter((user) => normalizeEmail(user.email) !== emailKey),
          ];
          draft.applicantProfiles = {
            ...(draft.applicantProfiles || {}),
            [emailKey]: sanitizeApplicantProfile(
              {
                ...existingProfile,
                ...nextApplicantAccount,
                fullName: nextApplicantAccount.name || existingProfile.fullName,
              },
              nextApplicantAccount
            ),
          };
          return draft;
        });

        setStoredSession(createSessionPayload(applicantAccount, [applicantAccount, ...(rawData.users || [])]));
      } catch (error) {
        // No active Supabase session to restore.
      }
    }

    restoreSupabaseSession();

    return () => {
      isMounted = false;
    };
    // Session restore should run once after initial mount and Supabase URL parsing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    const currentSessionId = session?.id;
    const currentSessionRole = session?.role;
    const currentSessionEmail = session?.email;

    if (!isSupabaseConfigured || !currentSessionId || currentSessionRole !== 'applicant') {
      return undefined;
    }

    getSignedInApplicantAccount()
      .then((account) => {
        if (!isMounted || !account) {
          return;
        }

        const sameUserId = String(account.id || '').trim() === String(currentSessionId || '').trim();
        const sameEmail = normalizeEmail(account.email) === normalizeEmail(currentSessionEmail);
        if (!sameUserId && !sameEmail) {
          return;
        }

        const nextApplicantAccount = {
          ...account,
          role: 'applicant',
          phone: account.mobileNumber || account.phone || '',
        };

        setData((current) => {
          const draft = clone(current);
          const emailKey = normalizeEmail(nextApplicantAccount.email || currentSessionEmail);
          const existingProfile = draft.applicantProfiles?.[emailKey] || {};

          draft.users = [
            nextApplicantAccount,
            ...(draft.users || []).filter((user) => normalizeEmail(user.email) !== emailKey),
          ];
          draft.applicantProfiles = {
            ...(draft.applicantProfiles || {}),
            [emailKey]: sanitizeApplicantProfile(
              {
                ...existingProfile,
                ...nextApplicantAccount,
                fullName: nextApplicantAccount.name || existingProfile.fullName,
              },
              nextApplicantAccount
            ),
          };
          return draft;
        });

        setStoredSession((current) => {
          if (!current || current.role !== 'applicant') {
            return current;
          }
          if (current.id && nextApplicantAccount.id && current.id !== nextApplicantAccount.id) {
            return current;
          }

          const nextSession = createSessionPayload(nextApplicantAccount, [nextApplicantAccount]);
          const hasChanged = Object.keys(nextSession).some((key) => nextSession[key] !== current[key]);
          return hasChanged ? { ...current, ...nextSession } : current;
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [session?.id, session?.role, session?.email]);

  useEffect(() => {
    applyUiBrandingTheme(data.uiBranding);
  }, [data.uiBranding]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigate = (nextPath, options = {}) => {
    const normalized = normalizePath(nextPath);
    const target = `${window.location.pathname}${window.location.search}#${normalized}`;

    if (options.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.location.hash = normalized;
    }

    setPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loginRole = getLoginRoleFromPath(path);
    const roleFromPath = getRoleFromPath(path);
    const sectionFromPath = getSectionFromPath(path);

    if (path === '/' && session) {
      navigate(getHomeRoute(session.role, session), { replace: true });
      return;
    }

    if (roleFromPath && roleFromPath !== 'login' && !session) {
      navigate(getLoginRoute(roleFromPath), { replace: true });
      return;
    }

    if (roleFromPath && roleFromPath !== 'login' && session && session.role !== roleFromPath) {
      navigate(getHomeRoute(session.role, session), { replace: true });
      return;
    }

    if (
      roleFromPath &&
      roleFromPath !== 'login' &&
      session &&
      !isSectionAllowed(roleFromPath, sectionFromPath, session)
    ) {
      navigate(getHomeRoute(session.role, session), { replace: true });
      return;
    }

    if (loginRole && session && loginRole !== session.role) {
      setStoredSession(null);
      if (isSupabaseConfigured) {
        supabase?.auth.signOut();
      }
      return;
    }

    if (loginRole && session) {
      navigate(getHomeRoute(session.role, session), { replace: true });
    }
  }, [path, session]);

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone });
  };

  const beginSession = (account, users = data.users || []) => {
    setStoredSession(createSessionPayload(account, users));
    showToast(`${getSessionRoleLabel(account)} dashboard loaded.`);
    navigate(getHomeRoute(account.role, account), { replace: true });
    return { ok: true };
  };

  const appendAuditLog = (draft, actor, role, action, module) => {
    draft.auditLogs.unshift({
      id: makeId('audit'),
      actor,
      role,
      action,
      module,
      time: new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
    });
  };

  const addNotification = (draft, recipient, role, title, message, tone = 'neutral') => {
    draft.notifications.unshift({
      id: makeId('notification'),
      recipient,
      role,
      title,
      message,
      tone,
      unread: true,
      time: new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
    });
  };

  const refreshSessionNotifications = async (targetSession = session) => {
    if (!isSupabaseConfigured || !targetSession?.id) {
      return [];
    }

    const notifications = await listUserNotifications(targetSession.id);
    setData((current) => ({
      ...current,
      notifications,
    }));
    return notifications;
  };

  const login = async (role, form) => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        error: 'Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.',
      };
    }

    if (role === 'personnel') {
      try {
        const account = await signInStaffAccount(form);
        return beginSession(account, [account, ...(data.users || [])]);
      } catch (error) {
        return {
          ok: false,
          error: error?.message || `Invalid credentials for the ${ROLE_LABELS[role]} portal.`,
        };
      }
    }

    if (role === 'applicant') {
      try {
        const account = await signInApplicantAccount(form);
        setData((current) => {
          const draft = clone(current);
          const emailKey = normalizeEmail(account.email);
          const existingProfile = draft.applicantProfiles?.[emailKey] || {};
          const applicantAccount = {
            ...account,
            role: 'applicant',
            phone: account.mobileNumber || account.phone || '',
          };

          draft.users = [
            applicantAccount,
            ...(draft.users || []).filter((user) => normalizeEmail(user.email) !== emailKey),
          ];
          draft.applicantProfiles = {
            ...(draft.applicantProfiles || {}),
            [emailKey]: sanitizeApplicantProfile(
              {
                ...existingProfile,
                ...applicantAccount,
                fullName: applicantAccount.name || existingProfile.fullName,
              },
              applicantAccount
            ),
          };

          return draft;
        });
        return beginSession(account, [account, ...(data.users || [])]);
      } catch (error) {
        return {
          ok: false,
          error: error?.message || `Invalid credentials for the ${ROLE_LABELS[role]} portal.`,
        };
      }
    }

    return {
      ok: false,
      error: `Invalid credentials for the ${ROLE_LABELS[role]} portal.`,
    };
  };

  const updateStaffPasswordAfterFirstLogin = async (payload) => {
    const password = String(payload?.password || '');
    const confirmPassword = String(payload?.confirmPassword || '');

    if (!password || !confirmPassword) {
      return { ok: false, error: 'Enter and confirm the new password.' };
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    if (password !== confirmPassword) {
      return { ok: false, error: 'Passwords do not match.' };
    }

    try {
      await completeStaffPasswordChange(password);
      setStoredSession((current) => current ? { ...current, mustChangePassword: false } : current);
      showToast('Password updated. Continue using your new password on your next login.');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || 'Unable to update the staff password.' };
    }
  };

  function createApplicantAccountFromPayload(payload, supabaseApplicant) {
    const firstName = String(payload?.firstName || '').trim();
    const middleName = String(payload?.middleName || '').trim();
    const lastName = String(payload?.lastName || '').trim();
    const suffix = String(payload?.suffix || '').trim();
    const fullName = String(
      payload?.fullName ||
        [firstName, middleName, lastName, suffix].filter(Boolean).join(' ')
    ).trim();
    const email = normalizeEmail(payload?.email);
    const municipality = String(payload?.municipality || '').trim();
    const barangay = String(payload?.barangay || '').trim();
    const phone = String(payload?.phone || '').trim();
    const password = String(payload?.password || '');

    const applicantAccount = {
      id: supabaseApplicant?.userId || makeId('user'),
      name: fullName,
      email,
      role: 'applicant',
      password,
      office: 'Resident Applicant Portal',
      municipality,
      title: 'Applicant',
      username: buildApplicantUsername(fullName, email),
      status: 'Active',
      lastActive: formatLastActiveLabel(),
    };

    const applicantProfile = createApplicantProfileTemplate({
      fullName,
      email,
      municipality,
      barangay,
      phone,
    });
    const nextUsers = [applicantAccount, ...(data.users || [])];

    setData((current) => {
      const draft = clone(current);
      const existingUsers = (draft.users || []).filter((user) => normalizeEmail(user.email) !== email);
      draft.users = [applicantAccount, ...existingUsers];
      draft.applicantProfiles = {
        ...(draft.applicantProfiles || {}),
        [email]: applicantProfile,
      };
      draft.applicantBookmarks = {
        ...(draft.applicantBookmarks || {}),
        [email]: draft.applicantBookmarks?.[email] || [],
      };

      if (draft.passwordResetRequests?.[email]) {
        delete draft.passwordResetRequests[email];
      }

      addNotification(
        draft,
        email,
        'applicant',
        'Applicant account activated',
        'Welcome to ProgramFinder. Complete your profile to begin browsing and applying for programs.',
        'success'
      );
      appendAuditLog(
        draft,
        fullName,
        'Applicant',
        'Activated applicant account through email OTP',
        'Authentication'
      );

      return draft;
    });

    setStoredSession(createSessionPayload(applicantAccount, nextUsers));
    navigate('/applicant/onboarding-survey', { replace: true });
    showToast('Account activated. Answer a few questions to get started.');

    return applicantAccount;
  }

  const registerApplicant = async (payload) => {
    const firstName = String(payload?.firstName || '').trim();
    const middleName = String(payload?.middleName || '').trim();
    const lastName = String(payload?.lastName || '').trim();
    const suffix = String(payload?.suffix || '').trim();
    const fullName = String(
      payload?.fullName ||
        [firstName, middleName, lastName, suffix].filter(Boolean).join(' ')
    ).trim();
    const email = normalizeEmail(payload?.email);
    const municipality = String(payload?.municipality || '').trim();
    const barangay = String(payload?.barangay || '').trim();
    const phone = String(payload?.phone || '').trim();
    const password = String(payload?.password || '');
    const confirmPassword = String(payload?.confirmPassword || '');

    if (!firstName || !lastName || !email || !municipality || !password || !confirmPassword) {
      return { ok: false, error: 'Complete the required applicant sign-up fields first.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Enter a valid email address.' };
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    if (password !== confirmPassword) {
      return { ok: false, error: 'Password confirmation does not match.' };
    }

    if (!isSupabaseConfigured) {
      return {
        ok: false,
        error: 'Supabase is not configured. Applicant registration is disabled.',
      };
    }

    try {
      await registerApplicantAccount({
        ...payload,
        firstName,
        middleName,
        lastName,
        suffix,
        fullName,
        email,
        municipality,
        barangay,
        phone,
        password,
      });
    } catch (error) {
      return {
        ok: false,
        error: error?.message || 'Unable to create the applicant account in Supabase.',
      };
    }

    showToast('OTP sent. Check your email to activate your applicant account.', 'success');
    return { ok: true, requiresOtp: true, email };
  };

  const verifyApplicantSignup = async (payload) => {
    let supabaseApplicant = null;

    try {
      supabaseApplicant = await verifyApplicantSignupOtp(payload);
    } catch (error) {
      return {
        ok: false,
        error: error?.message || 'Unable to verify the applicant OTP.',
      };
    }

    const account = createApplicantAccountFromPayload(payload, supabaseApplicant);
    return { ok: true, account };
  };

  const resendApplicantSignupCode = async (email) => {
    try {
      const result = await resendApplicantSignupOtp(email);
      showToast('A new OTP was sent to the applicant email address.', 'success');
      return { ok: true, email: result.email };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || 'Unable to resend the applicant OTP.',
      };
    }
  };

  const requestApplicantPasswordReset = async (payload) => {
    const email = normalizeEmail(
      typeof payload === 'string' ? payload : payload?.email
    );

    if (!email) {
      return { ok: false, error: 'Enter the applicant email address first.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        ok: false,
        error: 'Supabase is not configured. Applicant password reset is disabled.',
      };
    }

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}#/login/applicant/forgot-password`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return { ok: false, error: error.message || 'Unable to send password reset instructions.' };
    }

    showToast('Password reset instructions were sent to the applicant email address.', 'neutral');

    return {
      ok: true,
      email,
    };
  };

  const resetApplicantPassword = async (payload) => {
    const password = String(payload?.password || '');
    const confirmPassword = String(payload?.confirmPassword || '');

    if (!password || !confirmPassword) {
      return { ok: false, error: 'Complete the reset form before submitting it.' };
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    if (password !== confirmPassword) {
      return { ok: false, error: 'Password confirmation does not match.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        ok: false,
        error: 'Supabase is not configured. Applicant password reset is disabled.',
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { ok: false, error: error.message || 'Unable to update the applicant password.' };
    }

    showToast('Applicant password updated. You can sign in with the new password.');

    return { ok: true };
  };

  const logout = () => {
    const nextRoute = session
      ? session.role === 'personnel'
        ? STAFF_LOGIN_ROUTE
        : getLoginRoute(session.role)
      : '/';
    setStoredSession(null);
    if (isSupabaseConfigured) {
      supabase?.auth.signOut();
    }
    navigate(nextRoute, { replace: true });
    showToast('Signed out.', 'neutral');
  };

  const reset = () => {
    setData(createEmptyAppState());
    setStoredSession(null);
    navigate('/', { replace: true });
    showToast('Local session cleared. Supabase data is unchanged.', 'neutral');
  };

  const selectProgram = (programId) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.programId = programId;
      return draft;
    });
  };

  const openProgramDetails = (programId) => {
    selectProgram(programId);
    navigate('/applicant/program-view');
  };

  const startApplication = async (programId) => {
    const program = getProgramById(data.programs, programId);
    const missingProfileFields = getMissingRequiredApplicantProfileFields(data.applicantProfile, session);

    if (!isSupabaseConfigured) {
      showToast('Supabase is not configured. Application drafts and uploads are disabled.', 'warning');
      return;
    }

    if (!program) {
      showToast('Select a valid program before applying.', 'warning');
      return;
    }

    if (missingProfileFields.length > 0) {
      const highlightedFields = missingProfileFields.slice(0, 3).map((field) => field.label).join(', ');
      const hasMoreMissingFields = missingProfileFields.length > 3;
      navigate('/applicant/profile-management');
      showToast(
        `Complete your profile before applying. Missing: ${highlightedFields}${hasMoreMissingFields ? ', and more.' : '.'}`,
        'warning'
      );
      return;
    }

    const missingProgramDetails = getMissingProgramSpecificApplicantDetails(data.applicantProfile, program);
    if (missingProgramDetails.length > 0) {
      const highlightedFields = missingProgramDetails.slice(0, 3).join(', ');
      navigate('/applicant/profile-management');
      showToast(
        `Complete program-specific details before applying. Missing: ${highlightedFields}${missingProgramDetails.length > 3 ? ', and more.' : '.'}`,
        'warning'
      );
      return;
    }

    const activeApplicationCount = data.applications.filter(
      (application) =>
        application.programId === program.id &&
        !['Rejected', 'Cancelled'].includes(application.status)
    ).length;
    const eligibility = checkProgramEligibility(data.applicantProfile, program, activeApplicationCount);
    if (!eligibility.qualified) {
      showToast(eligibility.reasons[0] || 'You are not eligible for this program.', 'warning');
      return;
    }

    if (!canApplicantApplyToProgram(program)) {
      selectProgram(programId);
      navigate('/applicant/program-view');
      showToast('This program is no longer accepting applications. Review the details and prepare the requirements for the next opening.', 'warning');
      return;
    }

    try {
      const applicationDraft = await createDraftApplication({
        applicantUserId: session.id,
        applicantName: session.name || '',
        program,
      });

      setData((current) => {
        const draft = clone(current);
        const existingIndex = draft.applications.findIndex((application) => application.id === applicationDraft.id);
        if (existingIndex >= 0) {
          draft.applications[existingIndex] = applicationDraft;
        } else {
          draft.applications.unshift(applicationDraft);
        }
        const draftDocuments = (applicationDraft.requirementFiles || []).map((file) => ({
          id: file.applicationDocumentId || `${applicationDraft.id}-${file.requirementName}`,
          requirementId: file.requirementId || '',
          applicationId: applicationDraft.id,
          ownerEmail: applicationDraft.applicantEmail || session.email,
          name: file.requirementName,
          category: 'Application Requirement',
          status: file.status || 'Pending Review',
          uploadedAt: file.uploadedAt || '',
          fileName: file.fileName || '',
          fileType: file.fileType || 'File',
          fileUrl: file.fileUrl || '',
          aiCheckStatus: file.aiCheckStatus || 'not_checked',
          aiCheckResult: file.aiCheckResult || null,
        }));
        draft.documents = [
          ...draftDocuments,
          ...(draft.documents || []).filter(
            (document) => document.applicationId !== applicationDraft.id
          ),
        ];
        draft.composer.applicationId = applicationDraft.id;
        draft.composer.programId = programId;
        draft.composer.attachedDocs = applicationDraft.documents || [];
        draft.composer.notes = applicationDraft.notes || '';
        return draft;
      });
      navigate('/applicant/program-apply');
      showToast(`Application draft opened for ${program.title}.`);
    } catch (error) {
      showToast(error.message || 'Unable to start this application.', 'danger');
    }
  };

  const toggleBookmark = async (programId) => {
    if (!session || session.role !== 'applicant') {
      return { ok: false };
    }

    const emailKey = normalizeEmail(session.email);
    const currentBookmarks = data.applicantBookmarks?.[emailKey] || [];
    const bookmarked = currentBookmarks.includes(programId);
    const nextBookmarks = bookmarked
      ? currentBookmarks.filter((item) => item !== programId)
      : [programId, ...currentBookmarks];

    if (isSupabaseConfigured) {
      try {
        if (bookmarked) {
          await removeApplicantBookmark(session.id, programId);
        } else {
          await addApplicantBookmark(session.id, programId);
        }
      } catch (error) {
        showToast(error.message || 'Unable to update bookmark.', 'danger');
        return { ok: false, error: error.message || 'Unable to update bookmark.' };
      }
    }

    setData((current) => {
      const draft = clone(current);
      draft.applicantBookmarks = {
        ...(draft.applicantBookmarks || {}),
        [emailKey]: nextBookmarks,
      };

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        bookmarked ? 'Removed bookmarked program' : 'Bookmarked a program',
        'Bookmarks'
      );
      return draft;
    });

    return { ok: true };
  };

  const updateComposerNotes = (notes) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.notes = notes;
      return draft;
    });
  };

  const clearComposer = () => {
    setData((current) => {
      const draft = clone(current);
      draft.composer = { applicationId: null, programId: null, attachedDocs: [], notes: '' };
      return draft;
    });
  };

  const attachRequirement = (requirementName) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      if (!draft.composer.attachedDocs.includes(requirementName)) {
        draft.composer.attachedDocs.push(requirementName);
      }

      return draft;
    });
  };

  const uploadRequirementFile = async (requirementName, payload) => {
    if (!session || !requirementName || !payload?.file) {
      showToast('Select a file before attaching this requirement.', 'warning');
      return { ok: false };
    }

    const selectedProgram = getProgramById(data.programs, data.composer.programId);
    const requirement =
      getProgramRequirementItems(selectedProgram).find(
        (item) => String(getRequirementName(item)).toLowerCase() === String(requirementName).toLowerCase()
      ) || { name: requirementName, acceptedDocumentTypes: [] };
    const templateMatchById = (data.requirementTemplates || []).find(
      (template) =>
        String(template?.id || '').trim() &&
        String(template?.id || '').trim() === String(requirement?.requirementTemplateId || requirement?.requirement_template_id || '').trim()
    );
    const templateMatchByName = (data.requirementTemplates || []).find(
      (template) => String(template?.name || '').trim().toLowerCase() === String(requirementName).trim().toLowerCase()
    );
    const fallbackAcceptedDocumentTypes = uniqueDocumentTypes(
      payload?.acceptedDocumentTypes ||
      requirement?.acceptedDocumentTypes ||
      requirement?.accepted_document_types ||
      templateMatchById?.acceptedDocumentTypes ||
      templateMatchById?.accepted_document_types ||
      templateMatchByName?.acceptedDocumentTypes ||
      templateMatchByName?.accepted_document_types ||
      []
    );

    if (!data.composer.applicationId) {
      showToast('Open an application draft before uploading requirements.', 'warning');
      return { ok: false };
    }

    let savedDocument = null;
    try {
      savedDocument = await uploadApplicationRequirementFile({
        applicationId: data.composer.applicationId,
        applicantUserId: session.id,
        applicantName: session.name || '',
        requirement: {
          ...requirement,
          acceptedDocumentTypes: fallbackAcceptedDocumentTypes,
          selectedDocumentType: payload.documentType || '',
        },
        file: payload.file,
      });
    } catch (error) {
      showToast(error.message || 'Unable to upload this requirement.', 'danger');
      return { ok: false, error: error.message };
    }

    setData((current) => {
      const draft = clone(current);
      const existingDocument = draft.documents.find(
        (document) =>
          document.ownerEmail === session.email &&
          (!document.applicationId || document.applicationId === data.composer.applicationId) &&
          document.name.toLowerCase() === String(requirementName).toLowerCase()
      );

      const nextDocument = {
        ...savedDocument,
        id: savedDocument.id || existingDocument?.id || makeId('document'),
        ownerEmail: session.email,
        name: requirementName,
        category: savedDocument.category || 'Application Requirement',
        status: savedDocument.status || 'Pending Review',
        uploadedAt: savedDocument.uploadedAt || new Intl.DateTimeFormat('en-CA').format(new Date()),
        fileName: savedDocument.fileName || payload.file.name,
        fileType: savedDocument.fileType || payload.file.type || 'File',
        fileUrl: savedDocument.fileUrl || '',
        aiCheckStatus: savedDocument.aiCheckStatus || 'not_checked',
        aiCheckResult: savedDocument.aiCheckResult || null,
      };

      if (existingDocument) {
        if (
          existingDocument.fileUrl &&
          existingDocument.fileUrl.startsWith('blob:') &&
          existingDocument.fileUrl !== payload.fileUrl
        ) {
          URL.revokeObjectURL(existingDocument.fileUrl);
        }
        Object.assign(existingDocument, nextDocument);
      } else {
        draft.documents.unshift(nextDocument);
      }

      if (!draft.composer.attachedDocs.includes(requirementName)) {
        draft.composer.attachedDocs.push(requirementName);
      }

      return draft;
    });

    showToast(`${requirementName} attached to the application draft.`);
    return { ok: true };
  };

  const reuseVaultDocumentsForApplication = async (requirementName = '') => {
    if (!session) {
      return { ok: false, error: 'Sign in to continue.' };
    }

    if (!isSupabaseConfigured) {
      showToast('Vault reuse requires the Supabase connection.', 'warning');
      return { ok: false, error: 'Vault reuse is unavailable while Supabase is not configured.' };
    }

    const applicationId = String(data?.composer?.applicationId || '').trim();
    const programId = String(data?.composer?.programId || '').trim();
    const targetRequirementName = String(requirementName || '').trim();

    if (!applicationId || !programId) {
      showToast('Open an application draft before reusing vault documents.', 'warning');
      return { ok: false, error: 'Open an application draft first.' };
    }

    const vaultDocuments = data?.applicantProfileDocuments || [];
    if (!vaultDocuments.length) {
      showToast('No vault documents found yet. Upload to Document Vault first.', 'warning');
      return { ok: false, error: 'No vault documents found. Upload documents in your vault first.' };
    }

    let summary = null;
    try {
      summary = await linkExistingDocumentsToApplication({
        applicationId,
        applicantUserId: session.id,
        programId,
        applicantName: session.name || '',
      });
    } catch (error) {
      const message = error?.message || 'Unable to reuse documents from your vault.';
      showToast(message, 'danger');
      return { ok: false, error: message };
    }

    let refreshedApplication = null;
    try {
      refreshedApplication = await getApplicationRecordById(applicationId);
    } catch (error) {
      const message = error?.message || 'Vault linking completed, but application refresh failed.';
      showToast(message, 'warning');
      return {
        ok: false,
        error: message,
        summary,
      };
    }

    const refreshedRequirementDocuments = (refreshedApplication.requirementFiles || []).map((file) => ({
      id: file.applicationDocumentId || `${refreshedApplication.id}-${file.requirementName}`,
      requirementId: file.requirementId || '',
      applicationId: refreshedApplication.id,
      ownerEmail: refreshedApplication.applicantEmail || session.email,
      name: file.requirementName,
      category: 'Application Requirement',
      status: file.status || 'Pending Review',
      uploadedAt: file.uploadedAt || refreshedApplication.submittedAt || '',
      fileName: file.fileName || '',
      fileType: file.fileType || 'File',
      fileUrl: file.fileUrl || '',
      aiCheckStatus: file.aiCheckStatus || 'not_checked',
      aiCheckResult: file.aiCheckResult || null,
    }));

    setData((current) => {
      const draft = clone(current);
      const existingIndex = draft.applications.findIndex((application) => application.id === refreshedApplication.id);
      if (existingIndex >= 0) {
        draft.applications[existingIndex] = refreshedApplication;
      } else {
        draft.applications.unshift(refreshedApplication);
      }

      draft.documents = [
        ...refreshedRequirementDocuments,
        ...(draft.documents || []).filter((document) => document.applicationId !== refreshedApplication.id),
      ];

      if (draft.composer.applicationId === refreshedApplication.id) {
        const mergedAttached = new Set([
          ...(draft.composer.attachedDocs || []),
          ...(refreshedApplication.documents || []),
        ]);
        draft.composer.attachedDocs = Array.from(mergedAttached);
      }

      return draft;
    });

    const linkedCount = Array.isArray(summary?.linked) ? summary.linked.length : 0;
    const requirementLinked = targetRequirementName
      ? refreshedRequirementDocuments.some(
          (document) =>
            String(document.name || '').toLowerCase() === targetRequirementName.toLowerCase() &&
            Boolean(document.fileName || document.fileUrl)
        )
      : linkedCount > 0;

    if (linkedCount > 0) {
      showToast(
        `${linkedCount} vault document${linkedCount === 1 ? '' : 's'} linked to this draft.`,
        'success'
      );
    } else {
      const noConfiguredType = targetRequirementName
        ? (summary?.skipped || []).some(
            (item) =>
              String(item?.requirementName || '').toLowerCase() === targetRequirementName.toLowerCase() &&
              item?.reason === 'no_configured_document_type'
          )
        : false;
      showToast(
        noConfiguredType
          ? `No accepted document type is configured for "${targetRequirementName}". Contact the program office.`
          : 'No matching vault documents found for this application.',
        'warning'
      );
    }

    return {
      ok: true,
      summary,
      linkedCount,
      requirementLinked,
    };
  };

  const removeAttachedRequirement = (requirementName) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.attachedDocs = draft.composer.attachedDocs.filter((item) => item !== requirementName);
      return draft;
    });
  };

  const removeRequirementFile = async (requirementName, payload = {}) => {
    if (!session || !requirementName) {
      return { ok: false, error: 'Requirement name is required.' };
    }

    const applicationId = String(payload.applicationId || data.composer.applicationId || '').trim();
    const requirementId = String(payload.requirementId || '').trim();
    const applicationDocumentId = String(payload.applicationDocumentId || '').trim();

    if (!applicationId) {
      showToast('Open an application draft before removing requirement files.', 'warning');
      return { ok: false, error: 'Open an application draft first.' };
    }

    if (isSupabaseConfigured) {
      try {
        await removeApplicationRequirementFile({
          applicationId,
          applicantUserId: session.id,
          applicationDocumentId,
          requirementId,
        });
      } catch (error) {
        showToast(error.message || 'Unable to remove this requirement file.', 'danger');
        return { ok: false, error: error.message };
      }
    }

    setData((current) => {
      const draft = clone(current);
      draft.documents = (draft.documents || []).filter((document) => {
        if (String(document.applicationId || '') !== applicationId) {
          return true;
        }
        if (applicationDocumentId && String(document.id || '') === applicationDocumentId) {
          return false;
        }
        return String(document.name || '').toLowerCase() !== String(requirementName).toLowerCase();
      });

      const applicationIndex = (draft.applications || []).findIndex(
        (application) => String(application.id || '') === applicationId
      );
      if (applicationIndex >= 0) {
        const targetApplication = draft.applications[applicationIndex];
        targetApplication.requirementFiles = (targetApplication.requirementFiles || []).filter(
          (file) => String(file.requirementName || '').toLowerCase() !== String(requirementName).toLowerCase()
        );
        targetApplication.documents = (targetApplication.documents || []).filter(
          (name) => String(name || '').toLowerCase() !== String(requirementName).toLowerCase()
        );
      }

      if (String(draft.composer.applicationId || '') === applicationId) {
        draft.composer.attachedDocs = (draft.composer.attachedDocs || []).filter(
          (item) => String(item || '').toLowerCase() !== String(requirementName).toLowerCase()
        );
      }

      return draft;
    });

    showToast(`${requirementName} attachment removed from this draft.`, 'success');
    return { ok: true };
  };

  const submitApplication = async () => {
    if (!session) {
      return;
    }

    const missingProfileFields = getMissingRequiredApplicantProfileFields(data.applicantProfile, session);
    if (missingProfileFields.length > 0) {
      const highlightedFields = missingProfileFields.slice(0, 3).map((field) => field.label).join(', ');
      const hasMoreMissingFields = missingProfileFields.length > 3;
      navigate('/applicant/profile-management');
      showToast(
        `Complete your profile before submitting. Missing: ${highlightedFields}${hasMoreMissingFields ? ', and more.' : '.'}`,
        'warning'
      );
      return;
    }

    if (!isSupabaseConfigured) {
      showToast('Supabase is not configured. Application submission is disabled.', 'warning');
      return;
    }

    const selectedProgram = getProgramById(data.programs, data.composer.programId);
    if (!selectedProgram) {
      showToast('Select a program first.', 'warning');
      return;
    }

    const existingApplication = data.applications.find(
      (application) =>
        application.applicantEmail === session.email &&
        application.programId === selectedProgram.id &&
        application.id !== data.composer.applicationId
    );
    if (existingApplication) {
      showToast('You already have an application for this program.', 'warning');
      navigate('/applicant/manage-applications');
      return;
    }

    const missingProgramDetails = getMissingProgramSpecificApplicantDetails(data.applicantProfile, selectedProgram);
    if (missingProgramDetails.length > 0) {
      navigate('/applicant/profile-management');
      showToast(`Complete program-specific details before submitting. Missing: ${missingProgramDetails.slice(0, 3).join(', ')}.`, 'warning');
      return;
    }

    const activeApplicationCount = data.applications.filter(
      (application) =>
        application.programId === selectedProgram.id &&
        !['Rejected', 'Cancelled'].includes(application.status) &&
        application.id !== data.composer.applicationId
    ).length;
    const eligibility = checkProgramEligibility(data.applicantProfile, selectedProgram, activeApplicationCount);
    if (!eligibility.qualified) {
      showToast(eligibility.reasons[0] || 'You are not eligible for this program.', 'warning');
      return;
    }

    if (!canApplicantApplyToProgram(selectedProgram)) {
      showToast('This program is not currently accepting applications.', 'warning');
      return;
    }

    const requiredRequirements = getProgramRequirementItems(selectedProgram, true);
    const missingRequirements = requiredRequirements.filter(
      (requirement) =>
        !data.composer.attachedDocs.includes(getRequirementName(requirement)) ||
        !buildRequirementFileSnapshot(data.documents, session.email, getRequirementName(requirement), data.composer.applicationId)
    );

    if (missingRequirements.length) {
      showToast('Attach all required documents before submitting.', 'warning');
      return;
    }

    const unreadableDocuments = requiredRequirements.filter((requirement) => {
      const requirementName = getRequirementName(requirement);
      const document = getRequirementDocument(data.documents, session.email, requirementName, data.composer.applicationId);
      return document?.aiCheckStatus === 'unreadable';
    });

    if (unreadableDocuments.length) {
      showToast('Some uploaded requirements are unclear. Upload clearer copies before submitting.', 'warning');
      return;
    }

    if (!data.composer.applicationId) {
      showToast('Application draft was not found. Start the application again.', 'warning');
      return;
    }

    let savedApplication = null;
    try {
      savedApplication = await submitApplicationRecord({
        applicationId: data.composer.applicationId,
        applicantUserId: session.id,
        notes: data.composer.notes || '',
      });
    } catch (error) {
      showToast(error.message || 'Unable to submit the application.', 'danger');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const existingIndex = draft.applications.findIndex((application) => application.id === savedApplication.id);
      if (existingIndex >= 0) {
        draft.applications[existingIndex] = savedApplication;
      } else {
        draft.applications.unshift(savedApplication);
      }

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Submitted application for ${selectedProgram.title}`,
        'Applications'
      );

      draft.composer = { applicationId: null, programId: selectedProgram.id, attachedDocs: [], notes: '' };
      return draft;
    });

    if (isSupabaseConfigured) {
      await refreshSessionNotifications(session).catch(() => {});
    }

    showToast(`${selectedProgram.title} submitted successfully.`);
    navigate('/applicant/manage-applications');
  };

  const uploadDocument = (name, category) => {
    if (!session || !name.trim()) {
      showToast('Enter a document name before uploading.', 'warning');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.documents.unshift({
        id: makeId('document'),
        ownerEmail: session.email,
        name: name.trim(),
        category: category.trim() || 'General',
        status: 'Pending Review',
        uploadedAt: new Intl.DateTimeFormat('en-CA').format(new Date()),
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Uploaded document: ${name.trim()}`,
        'Documents'
      );

      return draft;
    });
  };

  const markNotificationsRead = async () => {
    if (!session) {
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await markAllNotificationsAsRead(session.id);
      } catch (error) {
        showToast(error.message || 'Unable to mark notifications as read.', 'danger');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      draft.notifications = draft.notifications.map((notification) =>
        notification.recipientUserId === session.id || notification.recipient === session.id
          ? {
              ...notification,
              unread: false,
              isRead: true,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification
      );
      return draft;
    });
  };

  const markNotificationReadById = async (notificationId) => {
    if (!session || !notificationId) {
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await markNotificationAsRead(notificationId, session.id);
      } catch (error) {
        showToast(error.message || 'Unable to mark this notification as read.', 'danger');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      draft.notifications = (draft.notifications || []).map((notification) =>
        String(notification.id || '') === String(notificationId)
          ? {
              ...notification,
              unread: false,
              isRead: true,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification
      );
      return draft;
    });
  };

  const saveApplicantProfile = async (nextProfile) => {
    if (!session || session.role !== 'applicant') {
      return { ok: false };
    }

    let savedProfile = null;
    let surveySyncError = null;

    if (isSupabaseConfigured) {
      try {
        savedProfile = await updateApplicantProfile(nextProfile, session);
      } catch (error) {
        showToast(error.message || 'Unable to save applicant profile.', 'danger');
        return { ok: false, error: error.message };
      }

      try {
        await saveApplicantProfileSurveyFields(session.id, nextProfile);
      } catch (error) {
        surveySyncError = error;
      }
    }

    const persistedProfile = savedProfile
      ? {
          ...nextProfile,
          ...savedProfile,
          fullName: savedProfile.name || nextProfile.fullName,
          phone: savedProfile.mobileNumber || nextProfile.phone,
        }
      : nextProfile;
    const currentEmailKey = normalizeEmail(session.email);
    const nextEmailKey = normalizeEmail(persistedProfile.email || session.email);

    setStoredSession((current) => {
      if (!current || current.id !== session.id) {
        return current;
      }

      return {
        ...current,
        email: persistedProfile.email || current.email,
        name: persistedProfile.fullName || persistedProfile.name || current.name,
        firstName: persistedProfile.firstName || current.firstName,
        middleName: persistedProfile.middleName || '',
        lastName: persistedProfile.lastName || current.lastName,
        suffix: persistedProfile.suffix || '',
        mobileNumber: persistedProfile.mobileNumber || persistedProfile.phone || current.mobileNumber || '',
        alternateContactNumber: persistedProfile.alternateContactNumber || '',
        municipality: persistedProfile.municipality || current.municipality,
        barangay: persistedProfile.barangay || '',
        houseNumber: persistedProfile.houseNumber || '',
        streetName: persistedProfile.streetName || '',
        subdivisionArea: persistedProfile.subdivisionArea || '',
        zipCode: persistedProfile.zipCode || '',
        address: persistedProfile.address || '',
        birthDate: persistedProfile.birthDate || '',
        sex: persistedProfile.sex || '',
        civilStatus: persistedProfile.civilStatus || '',
        citizenship: persistedProfile.citizenship || '',
        employmentStatus: persistedProfile.employmentStatus || '',
        occupation: persistedProfile.occupation || '',
        employerName: persistedProfile.employerName || '',
        monthlyPersonalIncome: persistedProfile.monthlyPersonalIncome || '',
        educationStatus: persistedProfile.educationStatus || '',
        householdIncome: persistedProfile.householdIncome || '',
        householdMemberCount: persistedProfile.householdMemberCount || '',
        dependentCount: persistedProfile.dependentCount || '',
        housingStatus: persistedProfile.housingStatus || '',
        specialCategory: persistedProfile.specialCategory || '',
      };
    });

    setData((current) => {
      const draft = clone(current);
      if (currentEmailKey && currentEmailKey !== nextEmailKey) {
        delete draft.applicantProfiles?.[currentEmailKey];
      }

      draft.applicantProfiles = {
        ...(draft.applicantProfiles || {}),
        [nextEmailKey || currentEmailKey]: sanitizeApplicantProfile(persistedProfile, {
          fullName: session.name,
          firstName: session.firstName,
          middleName: session.middleName,
          lastName: session.lastName,
          suffix: session.suffix,
          email: session.email,
          phone: session.mobileNumber,
          alternateContactNumber: session.alternateContactNumber,
          municipality: session.municipality,
          barangay: session.barangay,
        }),
      };
      draft.users = (draft.users || []).map((user) =>
        user.id === session.id
          ? {
              ...user,
              email: persistedProfile.email || user.email,
              name: persistedProfile.fullName || persistedProfile.name || user.name,
              firstName: persistedProfile.firstName || user.firstName,
              middleName: persistedProfile.middleName || '',
              lastName: persistedProfile.lastName || user.lastName,
              suffix: persistedProfile.suffix || '',
              mobileNumber: persistedProfile.mobileNumber || persistedProfile.phone || user.mobileNumber || '',
              phone: persistedProfile.mobileNumber || persistedProfile.phone || user.phone || '',
              municipality: persistedProfile.municipality || user.municipality,
              barangay: persistedProfile.barangay || user.barangay,
            }
          : user
      );

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        'Updated applicant profile information',
        'Profile'
      );

      return draft;
    });

    if (surveySyncError) {
      showToast('Applicant profile saved, but survey-backed fields could not be refreshed.', 'warning');
      return { ok: true, warning: surveySyncError.message };
    }

    showToast('Applicant profile saved.', 'success');
    return { ok: true };
  };

  const saveApplicantSearchSurvey = (surveyPayload) => {
    if (!session || session.role !== 'applicant') {
      return { ok: false };
    }

    const interestCategory = String(surveyPayload?.interestCategory || '').trim() || 'All';
    const discoveryMode = String(surveyPayload?.discoveryMode || '').trim() || 'browse';

    setData((current) => {
      const draft = clone(current);
      const emailKey = normalizeEmail(session.email);
      const existingProfile =
        draft.applicantProfiles?.[emailKey] ||
        createApplicantProfileTemplate({
          fullName: session.name,
          email: session.email,
          municipality: session.municipality,
        });

      draft.applicantProfiles = {
        ...(draft.applicantProfiles || {}),
        [emailKey]: sanitizeApplicantProfile(existingProfile, {
          fullName: session.name,
          email: session.email,
          municipality: session.municipality,
          searchSurvey: {
            ...(existingProfile?.searchSurvey || {}),
          },
        }),
      };
      draft.applicantProfiles[emailKey] = {
        ...draft.applicantProfiles[emailKey],
        searchSurvey: {
          ...(draft.applicantProfiles[emailKey]?.searchSurvey || {}),
          interestCategory,
          assistanceNeeds: [interestCategory],
          discoveryMode,
          completedAt: getTodayDateValue(),
        },
      };

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        'Updated applicant search survey preferences',
        'Profile'
      );

      return draft;
    });

    if (isSupabaseConfigured) {
      const profileSnapshot = data.applicantProfile || {};
      const fallbackSurvey = getSurveyFromProfile(profileSnapshot);
      const mergedSurvey = normalizeSurveyPayload(
        {
          ...fallbackSurvey,
          assistanceNeeds: [interestCategory],
        },
        fallbackSurvey
      );

      saveApplicantSurveyResponse(session.id, mergedSurvey)
        .then(() => {
          const sectorIds = resolveSectorIdsForSurvey(data.activeSectors, mergedSurvey);
          if (sectorIds.length) {
            return replaceApplicantSectorTags(session.id, sectorIds);
          }
          return replaceApplicantSectorTags(session.id, []);
        })
        .then((sectorTags) => {
          const emailKey = normalizeEmail(session.email);
          setData((current) => {
            const draft = clone(current);
            const existingProfile =
              draft.applicantProfiles?.[emailKey] ||
              createApplicantProfileTemplate({
                fullName: session.name,
                email: session.email,
                municipality: session.municipality,
              });

            draft.applicantProfiles = {
              ...(draft.applicantProfiles || {}),
              [emailKey]: sanitizeApplicantProfile(
                {
                  ...existingProfile,
                  sectorTags: sectorTags || [],
                },
                existingProfile
              ),
            };

            return draft;
          });
        })
        .catch((error) => {
          showToast(error.message || 'Search preferences saved locally, but survey sync failed.', 'warning');
        });
    }

    showToast('Search preferences saved. Program recommendations were updated.', 'success');
    return { ok: true };
  };

  const saveApplicantOnboardingSurvey = async (payload) => {
    if (!session || session.role !== 'applicant') return { ok: false };

    const normalizedSurvey = normalizeSurveyPayload(payload);
    let nextSectorTags = null;
    let syncWarningMessage = '';

    if (isSupabaseConfigured) {
      try {
        await runWithSessionLockRetry(() => saveApplicantSurveyResponse(session.id, normalizedSurvey), 3);
        const sectorIds = resolveSectorIdsForSurvey(data.activeSectors, normalizedSurvey);
        nextSectorTags = await runWithSessionLockRetry(
          () => replaceApplicantSectorTags(session.id, sectorIds),
          3
        );
      } catch (error) {
        if (isSessionLockAbortError(error)) {
          syncWarningMessage =
            'Survey saved locally. Background sync will retry automatically if needed.';
        } else {
          showToast(error.message || 'Unable to save your survey responses.', 'danger');
          return { ok: false };
        }
      }
    }

    setData((current) => {
      const draft = clone(current);
      const emailKey = normalizeEmail(session.email);
      const existingProfile =
        draft.applicantProfiles?.[emailKey] ||
        createApplicantProfileTemplate({
          fullName: session.name,
          email: session.email,
          municipality: session.municipality,
        });

      draft.applicantProfiles = {
        ...(draft.applicantProfiles || {}),
        [emailKey]: sanitizeApplicantProfile(existingProfile, {
          fullName: session.name,
          email: session.email,
          municipality: session.municipality,
          educationStatus: String(payload.educationStatus || existingProfile?.educationStatus || '').trim(),
          employmentStatus:
            getEmploymentStatusFromSurveyTypes(payload.applicantTypes) ||
            existingProfile?.employmentStatus ||
            '',
          specialCategory: getProfileSpecialCategoryFromSurveyTypes(payload.applicantTypes) || existingProfile?.specialCategory || '',
          searchSurvey: {
            ...(existingProfile?.searchSurvey || {}),
            interestCategory: String(normalizedSurvey.assistanceNeeds?.[0] || existingProfile?.searchSurvey?.interestCategory || '').trim(),
            assistanceNeeds: normalizedSurvey.assistanceNeeds,
            discoveryMode: 'browse',
            householdIncomeBracket: String(
              normalizedSurvey.householdIncomeBracket ||
                existingProfile?.searchSurvey?.householdIncomeBracket ||
                ''
            ).trim(),
            educationStatus: String(
              normalizedSurvey.educationStatus ||
                existingProfile?.searchSurvey?.educationStatus ||
                ''
            ).trim(),
            isCurrentResident: normalizedSurvey.isCurrentResident,
            wantsProgramNotifications: normalizedSurvey.wantsProgramNotifications,
            programFilterPreference: normalizedSurvey.programFilterPreference,
            completedAt: getTodayDateValue(),
            applicantTypes: normalizedSurvey.applicantTypes,
          },
          sectorTags: Array.isArray(nextSectorTags) ? nextSectorTags : existingProfile?.sectorTags || [],
        }),
      };

      draft.applicantProfiles[emailKey].searchSurvey = {
        ...(draft.applicantProfiles[emailKey]?.searchSurvey || {}),
        interestCategory: String(normalizedSurvey.assistanceNeeds?.[0] || draft.applicantProfiles[emailKey]?.searchSurvey?.interestCategory || '').trim(),
        assistanceNeeds: normalizedSurvey.assistanceNeeds,
        discoveryMode: 'browse',
        householdIncomeBracket: String(
          normalizedSurvey.householdIncomeBracket ||
            draft.applicantProfiles[emailKey]?.searchSurvey?.householdIncomeBracket ||
            ''
        ).trim(),
        educationStatus: String(
          normalizedSurvey.educationStatus ||
            draft.applicantProfiles[emailKey]?.searchSurvey?.educationStatus ||
            ''
        ).trim(),
        isCurrentResident: normalizedSurvey.isCurrentResident,
        wantsProgramNotifications: normalizedSurvey.wantsProgramNotifications,
        programFilterPreference: normalizedSurvey.programFilterPreference,
        completedAt: getTodayDateValue(),
        applicantTypes: normalizedSurvey.applicantTypes,
      };
      draft.applicantProfiles[emailKey].educationStatus = String(normalizedSurvey.educationStatus || draft.applicantProfiles[emailKey].educationStatus || '').trim();
      draft.applicantProfiles[emailKey].employmentStatus =
        getEmploymentStatusFromSurveyTypes(normalizedSurvey.applicantTypes) ||
        draft.applicantProfiles[emailKey].employmentStatus ||
        '';
      draft.applicantProfiles[emailKey].specialCategory = getProfileSpecialCategoryFromSurveyTypes(normalizedSurvey.applicantTypes) || draft.applicantProfiles[emailKey].specialCategory || '';
      if (Array.isArray(nextSectorTags)) {
        draft.applicantProfiles[emailKey].sectorTags = nextSectorTags;
      }

      return draft;
    });

    navigate(getHomeRoute('applicant', session), { replace: true });
    if (syncWarningMessage) {
      showToast(syncWarningMessage, 'warning');
      return { ok: true, warning: syncWarningMessage };
    }

    showToast('Preferences saved. Showing programs tailored to your needs.', 'success');
    return { ok: true, warning: null };
  };

  const saveApplicantSurvey = async (payload) => {
    if (!session || session.role !== 'applicant') {
      return { ok: false };
    }

    const emailKey = normalizeEmail(session.email);
    const existingSurvey = getSurveyFromProfile(data.applicantProfile || {});
    const normalizedSurvey = normalizeSurveyPayload(payload, existingSurvey);

    let sectorTags = data.applicantProfile?.sectorTags || [];

    if (isSupabaseConfigured) {
      try {
        await saveApplicantSurveyResponse(session.id, normalizedSurvey);
        const sectorIds = resolveSectorIdsForSurvey(data.activeSectors, normalizedSurvey);
        sectorTags = await replaceApplicantSectorTags(session.id, sectorIds);
      } catch (error) {
        showToast(error.message || 'Unable to save survey responses.', 'danger');
        return { ok: false, error: error.message };
      }
    }

    setData((current) => {
      const draft = clone(current);
      const existingProfile =
        draft.applicantProfiles?.[emailKey] ||
        createApplicantProfileTemplate({
          fullName: session.name,
          email: session.email,
          municipality: session.municipality,
        });

      const educationStatus = String(
        normalizedSurvey.educationStatus || existingProfile.educationStatus || ''
      ).trim();
      const applicantTypes = normalizedSurvey.applicantTypes || [];
      const searchSurveyPatch = {
        ...(existingProfile.searchSurvey || {}),
        interestCategory: String(normalizedSurvey.assistanceNeeds?.[0] || '').trim(),
        assistanceNeeds: normalizedSurvey.assistanceNeeds,
        discoveryMode: String(existingProfile.searchSurvey?.discoveryMode || 'browse').trim() || 'browse',
        householdIncomeBracket: String(normalizedSurvey.householdIncomeBracket || '').trim(),
        educationStatus,
        isCurrentResident: normalizedSurvey.isCurrentResident,
        wantsProgramNotifications: normalizedSurvey.wantsProgramNotifications,
        programFilterPreference: normalizedSurvey.programFilterPreference,
        completedAt: getTodayDateValue(),
        applicantTypes,
      };

      draft.applicantProfiles = {
        ...(draft.applicantProfiles || {}),
        [emailKey]: sanitizeApplicantProfile(
          {
            ...existingProfile,
            educationStatus: educationStatus || existingProfile.educationStatus || '',
            employmentStatus:
              getEmploymentStatusFromSurveyTypes(applicantTypes) ||
              existingProfile.employmentStatus ||
              '',
            specialCategory:
              getProfileSpecialCategoryFromSurveyTypes(applicantTypes) ||
              existingProfile.specialCategory ||
              '',
            searchSurvey: searchSurveyPatch,
            sectorTags: Array.isArray(sectorTags) ? sectorTags : existingProfile.sectorTags || [],
          },
          existingProfile
        ),
      };

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        'Updated applicant intake survey details',
        'Profile'
      );

      return draft;
    });

    showToast('Survey preferences saved.', 'success');
    return { ok: true };
  };

  const addApplicantFamilyMemberRecord = async (payload) => {
    if (!session || session.role !== 'applicant' || !session.id) {
      return { ok: false };
    }

    try {
      const created = await createApplicantFamilyMember(session.id, payload);
      const emailKey = normalizeEmail(session.email);

      setData((current) => {
        const draft = clone(current);
        const existingProfile =
          draft.applicantProfiles?.[emailKey] ||
          createApplicantProfileTemplate({
            fullName: session.name,
            email: session.email,
            municipality: session.municipality,
          });

        const nextMembers = [...(existingProfile.familyMembers || []), created];
        draft.applicantProfiles = {
          ...(draft.applicantProfiles || {}),
          [emailKey]: sanitizeApplicantProfile(
            {
              ...existingProfile,
              familyMembers: nextMembers,
            },
            existingProfile
          ),
        };

        appendAuditLog(
          draft,
          session.name,
          getActorRoleLabel(session),
          'Added family member record',
          'Profile'
        );

        return draft;
      });

      showToast('Family member added.', 'success');
      return { ok: true, data: created };
    } catch (error) {
      showToast(error.message || 'Unable to add family member.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const updateApplicantFamilyMemberRecord = async (memberId, payload) => {
    if (!session || session.role !== 'applicant' || !session.id) {
      return { ok: false };
    }

    try {
      const updated = await updateApplicantFamilyMember(session.id, memberId, payload);
      const emailKey = normalizeEmail(session.email);

      setData((current) => {
        const draft = clone(current);
        const existingProfile =
          draft.applicantProfiles?.[emailKey] ||
          createApplicantProfileTemplate({
            fullName: session.name,
            email: session.email,
            municipality: session.municipality,
          });

        const nextMembers = (existingProfile.familyMembers || []).map((member) =>
          member.id === updated.id ? { ...member, ...updated } : member
        );
        draft.applicantProfiles = {
          ...(draft.applicantProfiles || {}),
          [emailKey]: sanitizeApplicantProfile(
            {
              ...existingProfile,
              familyMembers: nextMembers,
            },
            existingProfile
          ),
        };

        appendAuditLog(
          draft,
          session.name,
          getActorRoleLabel(session),
          'Updated family member record',
          'Profile'
        );

        return draft;
      });

      showToast('Family member updated.', 'success');
      return { ok: true, data: updated };
    } catch (error) {
      showToast(error.message || 'Unable to update family member.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const removeApplicantFamilyMemberRecord = async (memberId) => {
    if (!session || session.role !== 'applicant' || !session.id) {
      return { ok: false };
    }

    try {
      await deleteApplicantFamilyMember(session.id, memberId);
      const emailKey = normalizeEmail(session.email);

      setData((current) => {
        const draft = clone(current);
        const existingProfile =
          draft.applicantProfiles?.[emailKey] ||
          createApplicantProfileTemplate({
            fullName: session.name,
            email: session.email,
            municipality: session.municipality,
          });

        const nextMembers = (existingProfile.familyMembers || []).filter(
          (member) => member.id !== memberId
        );
        draft.applicantProfiles = {
          ...(draft.applicantProfiles || {}),
          [emailKey]: sanitizeApplicantProfile(
            {
              ...existingProfile,
              familyMembers: nextMembers,
            },
            existingProfile
          ),
        };

        appendAuditLog(
          draft,
          session.name,
          getActorRoleLabel(session),
          'Deleted family member record',
          'Profile'
        );

        return draft;
      });

      showToast('Family member removed.', 'success');
      return { ok: true };
    } catch (error) {
      showToast(error.message || 'Unable to remove family member.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const uploadApplicantProfileDocumentRecord = async (payload) => {
    if (!session || session.role !== 'applicant' || !session.id) {
      return { ok: false };
    }

    try {
      const uploaded = await uploadApplicantProfileDocument({
        ...payload,
        applicantUserId: session.id,
        uploadedBy: session.id,
      });

      if (isSupabaseConfigured) {
        await refreshSessionNotifications(session).catch(() => {});
      }

      setData((current) => {
        const draft = clone(current);
        draft.applicantProfileDocuments = [
          uploaded,
          ...(draft.applicantProfileDocuments || []).filter((item) => item.id !== uploaded.id),
        ];
        return draft;
      });

      showToast('Document uploaded to your profile vault.', 'success');
      return { ok: true, data: uploaded };
    } catch (error) {
      showToast(error.message || 'Unable to upload profile document.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const updateApplicantProfileDocumentRecord = async (documentId, payload) => {
    if (!session || session.role !== 'applicant' || !session.id) {
      return { ok: false };
    }

    try {
      const updated = await updateApplicantProfileDocumentMetadata(session.id, documentId, payload);
      setData((current) => {
        const draft = clone(current);
        draft.applicantProfileDocuments = (draft.applicantProfileDocuments || []).map((record) =>
          record.id === updated.id ? { ...record, ...updated } : record
        );
        return draft;
      });
      showToast('Document details updated.', 'success');
      return { ok: true, data: updated };
    } catch (error) {
      showToast(error.message || 'Unable to update document metadata.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const deleteApplicantProfileDocumentRecord = async (documentId) => {
    if (!session || session.role !== 'applicant' || !session.id) {
      return { ok: false };
    }

    try {
      await deleteApplicantProfileDocument(session.id, documentId);
      setData((current) => {
        const draft = clone(current);
        draft.applicantProfileDocuments = (draft.applicantProfileDocuments || []).filter(
          (record) => record.id !== documentId
        );
        return draft;
      });
      showToast('Document removed from profile vault.', 'success');
      return { ok: true };
    } catch (error) {
      showToast(error.message || 'Unable to delete document.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const toggleProgramStatus = (programId) => {
    if (!session) {
      return;
    }

    if (!canComposeProgramContent(session)) {
      showToast('Your current staff role cannot post or close programs.', 'warning');
      return;
    }

    const existingProgram = data.programs.find((program) => program.id === programId);
    if (!existingProgram) {
      return;
    }

    if (session.role === 'personnel' && !isProgramManagedBySessionOffice(existingProgram, session)) {
      showToast('You can only manage programs assigned to your own office.', 'warning');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.programs.find((program) => program.id === programId);
      if (!target) {
        return draft;
      }

      if (target.archived) {
        return draft;
      }

      target.status = target.status === 'Open' ? 'Closed' : 'Open';
      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `${target.status === 'Open' ? 'Opened' : 'Closed'} program: ${target.title}`,
        'Program Listings'
      );
      return draft;
    });
  };

  const refreshProgramRecords = async () => {
    if (!isSupabaseConfigured) {
      return { ok: false };
    }

    try {
      const programRecords = await listProgramRecords();
      setData((current) => ({
        ...current,
        programs: programRecords.programs || [],
        categories: programRecords.categories || [],
        sectors: programRecords.sectors || [],
        requirementTemplates: programRecords.requirementTemplates || [],
      }));
      return { ok: true, data: programRecords };
    } catch (error) {
      showToast(error.message || 'Unable to refresh program setup records.', 'danger');
      return { ok: false, error: error.message };
    }
  };

  const createProgram = async (payload) => {
    const normalizedProgram = normalizeProgramPayload(payload, session);

    if (!session || !normalizedProgram.title) {
      showToast('Enter the program title before publishing.', 'warning');
      return { ok: false };
    }

    if (!canComposeProgramContent(session)) {
      showToast('Your current staff role cannot create programs.', 'warning');
      return { ok: false };
    }

    if (isSupabaseConfigured) {
      try {
        const savedProgram = await createProgramListing(payload, session);
        const nextProgram = savedProgram || {
          id: makeId('program'),
          createdAt: getTodayDateValue(),
          updatedAt: getTodayDateValue(),
          createdByUserId: session.id || null,
          rootManagerId: session.rootManagerId || session.id || null,
          ...normalizedProgram,
        };

        setData((current) => {
          const draft = clone(current);
          draft.programs = [nextProgram, ...draft.programs.filter((program) => program.id !== nextProgram.id)];

          appendAuditLog(
            draft,
            session.name,
            getActorRoleLabel(session),
            `Created program: ${nextProgram.title}`,
            'Program Listings'
          );

          return reconcileProgramTaxonomy(draft);
        });

        showToast(`${nextProgram.title} published.`);
        return { ok: true, program: nextProgram };
      } catch (error) {
        showToast(error.message || 'Unable to create the program listing.', 'danger');
        return { ok: false, error: error.message };
      }
    }

    setData((current) => {
      const draft = clone(current);
      const programId = makeId('program');
      draft.programs.unshift({
        id: programId,
        createdAt: getTodayDateValue(),
        updatedAt: getTodayDateValue(),
        createdByUserId: session.id || null,
        rootManagerId: session.rootManagerId || session.id || null,
        ...normalizedProgram,
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Created program: ${normalizedProgram.title}`,
        'Program Listings'
      );

      return reconcileProgramTaxonomy(draft);
    });

    showToast(`${normalizedProgram.title} published.`);
    return { ok: true };
  };

  const updateProgram = async (programId, payload) => {
    if (!session) {
      return { ok: false };
    }

    const existingProgram = data.programs.find((program) => program.id === programId);
    if (!existingProgram) {
      return { ok: false };
    }

    if (session.role === 'personnel' && !isProgramManagedBySessionOffice(existingProgram, session)) {
      showToast('You can only update programs assigned to your own office.', 'warning');
      return { ok: false };
    }

    if (!canManageProgramSections(session)) {
      showToast('Your current staff role can only view this program.', 'warning');
      return { ok: false };
    }

    const normalizedProgram = normalizeProgramPayload(payload, session, existingProgram);
    const programPatch = getProgramUpdatePatch(session, normalizedProgram);

    if (canComposeProgramContent(session) && !normalizedProgram.title) {
      showToast('Enter the program title before saving changes.', 'warning');
      return { ok: false };
    }

    if (!Object.keys(programPatch).length) {
      showToast('There are no program fields available for your current role to update.', 'warning');
      return { ok: false };
    }

    if (isSupabaseConfigured) {
      try {
        const savedProgram = await updateProgramListing(programId, payload, session);
        setData((current) => {
          const draft = clone(current);
          if (savedProgram) {
            draft.programs = [
              savedProgram,
              ...draft.programs.filter((program) => program.id !== savedProgram.id),
            ];
          }

          appendAuditLog(
            draft,
            session.name,
            getActorRoleLabel(session),
            `Updated program: ${normalizedProgram.title}`,
            'Program Listings'
          );

          return reconcileProgramTaxonomy(draft);
        });

        showToast('Program details updated.', 'neutral');
        return { ok: true, program: savedProgram };
      } catch (error) {
        showToast(error.message || 'Unable to update the program listing.', 'danger');
        return { ok: false, error: error.message };
      }
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.programs.find((program) => program.id === programId);
      if (!target) {
        return draft;
      }

      Object.assign(target, programPatch, {
        archived: Boolean(target.archived),
        createdAt: target.createdAt || getTodayDateValue(),
        updatedAt: getTodayDateValue(),
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Updated program: ${normalizedProgram.title}`,
        'Program Listings'
      );

      return reconcileProgramTaxonomy(draft);
    });

    showToast('Program details updated.', 'neutral');
    return { ok: true };
  };

  const archiveProgram = (programId) => {
    if (!session) {
      return { ok: false };
    }

    if (!canComposeProgramContent(session)) {
      showToast('Your current staff role cannot archive programs.', 'warning');
      return { ok: false };
    }

    const existingProgram = data.programs.find((program) => program.id === programId);
    if (!existingProgram) {
      return { ok: false };
    }

    if (session.role === 'personnel' && !isProgramManagedBySessionOffice(existingProgram, session)) {
      showToast('You can only archive programs assigned to your own office.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.programs.find((program) => program.id === programId);
      if (!target) {
        return draft;
      }

      target.archived = true;
      target.status = 'Closed';

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Archived program: ${target.title}`,
        'Program Listings'
      );

      return draft;
    });

    showToast('Program archived.', 'neutral');
    return { ok: true };
  };

  const deleteProgram = (programId) => {
    if (!session) {
      return { ok: false };
    }

    if (!canComposeProgramContent(session)) {
      showToast('Your current staff role cannot delete programs.', 'warning');
      return { ok: false };
    }

    const target = data.programs.find((program) => program.id === programId);
    if (!target) {
      return { ok: false };
    }

    if (session.role === 'personnel' && !isProgramManagedBySessionOffice(target, session)) {
      showToast('You can only delete programs assigned to your own office.', 'warning');
      return { ok: false };
    }

    if (data.applications.some((application) => application.programId === programId)) {
      showToast('This program already has application records. Archive it instead of deleting.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      draft.programs = draft.programs.filter((program) => program.id !== programId);
      draft.bookmarks = draft.bookmarks.filter((bookmarkId) => bookmarkId !== programId);

      if (draft.composer.programId === programId) {
        draft.composer = { applicationId: null, programId: null, attachedDocs: [], notes: '' };
      }

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Deleted program: ${target.title}`,
        'Program Listings'
      );

      return draft;
    });

    showToast('Program deleted.', 'neutral');
    return { ok: true };
  };

  const reviewApplication = async (applicationId, nextStatus, detail) => {
    if (!session) {
      return;
    }

    if (!canReviewApplicants(session)) {
      showToast('Your current staff role cannot review applicant records.', 'warning');
      return;
    }

    const existingApplication = data.applications.find((application) => application.id === applicationId);
    if (!existingApplication) {
      return;
    }

    if (session.role === 'personnel' && existingApplication.office !== session.office) {
      showToast('You can only review applications routed to your own office.', 'warning');
      return;
    }

    const note = String(detail || '').trim();

    if (nextStatus === 'Rejected' && !note) {
      showToast('Add a rejection note before rejecting the application.', 'warning');
      return;
    }

    let savedApplication = null;
    if (isSupabaseConfigured) {
      try {
        savedApplication = await reviewApplicationRecord({
          applicationId,
          reviewerId: session.id,
          nextStatus,
          note,
        });
      } catch (error) {
        showToast(error.message || 'Unable to save the application decision.', 'danger');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.applications.find((application) => application.id === applicationId);
      if (!target) {
        return draft;
      }

      Object.assign(target, savedApplication || {
        status: nextStatus,
        reviewedAt: new Intl.DateTimeFormat('en-CA').format(new Date()),
        reviewerNote: note,
        rejectionReason: nextStatus === 'Rejected' ? note : '',
        followUpNote: nextStatus === 'Incomplete' ? note : '',
        history: [
          {
            time: new Intl.DateTimeFormat('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date()),
            status: nextStatus,
            detail: note || `Application was marked as ${nextStatus.toLowerCase()}.`,
          },
          ...(target.history || []),
        ],
      });

      const program = draft.programs.find((item) => item.id === target.programId);

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `${nextStatus} application for ${program?.title || 'a program'}`,
        'Application Decisions'
      );

      return draft;
    });

    showToast(`Application ${nextStatus.toLowerCase()} recorded.`, nextStatus === 'Rejected' ? 'neutral' : 'success');

    if (isSupabaseConfigured) {
      await refreshSessionNotifications(session).catch(() => {});
    }
  };

  const sendMessageToApplicants = async (scope, title, message) => {
    if (!session) {
      return;
    }

    if (!canReviewApplicants(session)) {
      showToast('Your current staff role cannot message applicants.', 'warning');
      return;
    }

    const recipients =
      scope === 'all'
        ? data.applications
            .filter((application) => application.office === session.office)
            .map((application) => application.applicantUserId)
        : [scope];

    const uniqueRecipients = [...new Set(recipients.map((item) => String(item || '').trim()).filter(Boolean))];

    if (!uniqueRecipients.length) {
      showToast('No valid recipient found for this message.', 'warning');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await Promise.all(
          uniqueRecipients.map((recipientUserId) =>
            createSupabaseNotification({
              recipientUserId,
              actorUserId: session.id || null,
              notificationType: 'office_message',
              title: String(title || '').trim() || 'Program update',
              message: String(message || '').trim() || 'Please check your applicant dashboard for the latest update.',
              relatedTable: null,
              relatedRecordId: null,
              actionRoute: '/applicant/notifications',
            })
          )
        );
      } catch (error) {
        showToast(error.message || 'Unable to send notifications.', 'danger');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      if (!isSupabaseConfigured) {
        uniqueRecipients.forEach((recipient) => {
          addNotification(draft, recipient, 'applicant', title, message, 'neutral');
        });
      }

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Sent notification: ${title}`,
        'Notifications'
      );

      return draft;
    });

    if (isSupabaseConfigured) {
      await refreshSessionNotifications(session).catch(() => {});
    }

    showToast('Notification sent.', 'success');
  };

  const publishAnnouncement = (payload, audience) => {
    if (!session || !payload.title.trim()) {
      return;
    }

    if (!canPublishAnnouncements(session)) {
      showToast('Your current staff role cannot publish announcements.', 'warning');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.announcements.unshift({
        id: makeId('announcement'),
        title: payload.title,
        message: payload.message,
        author: session.name,
        audience,
        office: session.office,
        date: new Intl.DateTimeFormat('en-CA').format(new Date()),
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Published announcement: ${payload.title}`,
        'Announcements'
      );

      return draft;
    });
  };

  const updateUserRole = (userId, nextRole) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId);
      if (!target) {
        return draft;
      }

      target.role = nextRole;
      target.staffRole = nextRole === 'personnel' ? target.staffRole || 'personnel' : null;
      target.title = getRoleTitle(nextRole, target.staffRole);
      target.office = resolveManagedOffice(nextRole, target.municipality, draft.offices);
      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Changed ${target.name}'s role to ${ROLE_LABELS[nextRole]}`,
        'Account Management'
      );

      return draft;
    });
  };

  const toggleUserStatus = (userId) => {
    if (!session) {
      return;
    }

    if (session.role === 'personnel' && session.id === userId) {
      showToast('You cannot change the status of the account you are currently using.', 'warning');
      return;
    }

    if (session.role === 'personnel' && !hasCaptainWorkspaceAccess(session)) {
      const managedUsers = getManagedStaffUsers(data.users, session);
      const allowedTarget = managedUsers.find((user) => user.id === userId && user.id !== session.id);

      if (!allowedTarget) {
        showToast('You can only update staff accounts inside your assigned hierarchy.', 'warning');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId);
      if (!target) {
        return draft;
      }

      const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';
      target.status = nextStatus;

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} ${target.name}'s account`,
        'Account Management'
      );

      return draft;
    });

    showToast('Account access updated.', 'neutral');
  };

  const createUserAccount = async (payload) => {
    if (!session) {
      return { ok: false };
    }

    const submittedName = String(payload.name || '').trim();
    const submittedNameParts = submittedName.split(/\s+/).filter(Boolean);
    const firstName = String(payload.firstName || submittedNameParts[0] || '').trim();
    const middleName = String(payload.middleName || '').trim();
    const lastName = String(payload.lastName || submittedNameParts.slice(1).join(' ') || '').trim();
    const suffix = String(payload.suffix || '').trim();
    const name = String(submittedName || [firstName, middleName, lastName, suffix].filter(Boolean).join(' ')).trim();
    const email = payload.email.trim().toLowerCase();
    const gmailPattern = /^[^\s@]+@gmail\.com$/i;
    const nextStaffRole = payload.role === 'personnel' ? getStaffRoleKey(payload) : null;
    const assignableStaffRoles = getAssignableStaffRoles(session);
    const isCaptainWorkspace = hasCaptainWorkspaceAccess(session);
    const captainWorkspaceStaffRoles = assignableStaffRoles;
    const roleLabel = payload.role === 'personnel' ? getStaffRoleLabel(nextStaffRole) : ROLE_LABELS[payload.role];

    if (!['personnel', 'applicant'].includes(payload.role)) {
      showToast('Select a valid role before sending access.', 'warning');
      return { ok: false };
    }

    if (!isCaptainWorkspace) {
      if (payload.role !== 'personnel') {
        showToast('This workspace can only create personnel accounts under the staff hierarchy.', 'warning');
        return { ok: false };
      }

      if (!assignableStaffRoles.includes(nextStaffRole)) {
        showToast(`Your ${getSessionRoleLabel(session)} account cannot create a ${getStaffRoleLabel(nextStaffRole)}.`, 'warning');
        return { ok: false };
      }
    }

    if (payload.role === 'personnel' && !nextStaffRole) {
      showToast('Select the staff role before sending access.', 'warning');
      return { ok: false };
    }

    if (isCaptainWorkspace && payload.role === 'personnel' && !captainWorkspaceStaffRoles.includes(nextStaffRole)) {
      showToast('System admin account creation supports municipal mayor accounts only.', 'warning');
      return { ok: false };
    }

    const requiredMunicipality =
      payload.role === 'personnel' && !isCaptainWorkspace
        ? payload.municipality || session.municipality
        : payload.municipality || session.municipality;

    if (!firstName || !lastName || !email || !payload.role || !requiredMunicipality || !payload.accessStartDate || !payload.accessEndDate) {
      showToast('Complete the user invite form before sending access.', 'warning');
      return { ok: false };
    }

    if (!gmailPattern.test(email)) {
      showToast('Use a valid Gmail address for the invite.', 'warning');
      return { ok: false };
    }

    if (payload.accessEndDate < payload.accessStartDate) {
      showToast('The access end date must be after the start date.', 'warning');
      return { ok: false };
    }

    if (data.users.some((user) => user.email.toLowerCase() === email)) {
      showToast('That email address is already assigned to an account.', 'danger');
      return { ok: false };
    }

    const personnelLoginLink = getPersonnelLoginLink();
    const nextStatus = getAccessStatus(payload.accessStartDate, payload.accessEndDate);
    let persistedAccount = null;

    if (!isSupabaseConfigured) {
      showToast('Supabase is not configured. Local account creation is disabled.', 'danger');
      return { ok: false };
    }

    if (payload.role === 'personnel') {
      try {
        persistedAccount = await createStaffAccount({
          ...payload,
          firstName,
          middleName,
          lastName,
          suffix,
          email,
          createdBy: session.id || null,
        });
      } catch (error) {
        showToast(
          error.message ||
            'Unable to create the staff account in Supabase. Confirm the create-staff-account Edge Function is deployed.',
          'danger'
        );
        return { ok: false };
      }
    } else {
      showToast('Applicant accounts must be created through the applicant signup flow.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      const userId = persistedAccount?.userId || makeId('user');
      const nextScope =
        payload.role === 'personnel'
          ? getStaffInviteScope(
              session,
              nextStaffRole,
              { ...payload, municipality: requiredMunicipality },
              draft.offices,
              { municipalities: draft.municipalities || [], barangays: draft.barangays || [] }
            )
          : {
              municipality: requiredMunicipality,
              office: resolveManagedOffice(payload.role, requiredMunicipality, draft.offices, payload.office),
              parentStaffId: null,
              rootManagerId: null,
            };
      const rootManagerId =
        payload.role === 'personnel'
          ? nextStaffRole === 'system_admin'
            ? userId
            : nextScope.rootManagerId
          : null;

      draft.users.unshift({
        id: userId,
        name,
        firstName,
        middleName,
        lastName,
        suffix,
        email,
        role: payload.role,
        staffRole: payload.role === 'personnel' ? nextStaffRole : null,
        title: getRoleTitle(payload.role, nextStaffRole),
        username: payload.username || email.split('@')[0],
        office: nextScope.office,
        municipality: nextScope.municipality,
        barangay: nextScope.barangay || payload.barangay || '',
        status: nextStatus,
        lastActive: 'Never',
        dateAssigned: getTodayDateValue(),
        accessStartDate: payload.accessStartDate,
        accessEndDate: payload.accessEndDate,
        mobileNumber: String(payload.mobileNumber || '').trim(),
        alternateContactNumber: String(payload.alternateContactNumber || '').trim(),
        inviteStatus: persistedAccount?.inviteStatus || 'Magic Link Sent',
        createdByUserId: session.id || null,
        parentStaffId: payload.role === 'personnel' ? nextScope.parentStaffId : null,
        rootManagerId,
      });

      addNotification(
        draft,
        email,
        payload.role,
        'Magic link sent',
        `Your ${roleLabel} access is scheduled from ${payload.accessStartDate} to ${payload.accessEndDate}. Open the magic link sent to your Gmail account or login at ${persistedAccount?.personnelLoginUrl || personnelLoginLink}.`,
        'success'
      );

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Created ${roleLabel} account for ${name}`,
        'Account Management'
      );

      return draft;
    });

    showToast('Staff account created and magic link sent.');
    return { ok: true };
  };

  const addMunicipality = (payload) => {
    if (!session || !payload.name.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.municipalities = draft.municipalities || [];
      draft.municipalities.unshift({
        id: makeId('municipality'),
        name: payload.name.trim(),
        province: payload.province?.trim() || 'Bulacan',
        description:
          payload.description?.trim() ||
          `${payload.name.trim()} municipality coordination record for offices and personnel assignments.`,
        status: 'Active',
        createdAt: getTodayDateValue(),
        updatedAt: getTodayDateValue(),
        contactNumber: payload.contactNumber?.trim() || 'Not provided',
        emailAddress: payload.emailAddress?.trim() || '',
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Added municipality: ${payload.name.trim()}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality record added.');
  };

  const updateMunicipality = (municipalityId, payload) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = (draft.municipalities || []).find((municipality) => municipality.id === municipalityId);
      if (!target) {
        return draft;
      }

      target.name = payload.name?.trim() || target.name;
      target.province = payload.province?.trim() || target.province;
      target.description = payload.description?.trim() || target.description;
      target.contactNumber = payload.contactNumber?.trim() || target.contactNumber;
      target.emailAddress = payload.emailAddress?.trim() || target.emailAddress;
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Updated municipality: ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality record updated.', 'neutral');
  };

  const toggleMunicipalityStatus = (municipalityId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = (draft.municipalities || []).find((municipality) => municipality.id === municipalityId);
      if (!target) {
        return draft;
      }

      target.status = target.status === 'Active' ? 'Inactive' : 'Active';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `${target.status === 'Active' ? 'Activated' : 'Deactivated'} municipality ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality status updated.', 'neutral');
  };

  const archiveMunicipality = (municipalityId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = (draft.municipalities || []).find((municipality) => municipality.id === municipalityId);
      if (!target) {
        return draft;
      }

      target.status = 'Archived';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Archived municipality ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality archived.', 'neutral');
  };

  const addBarangay = (municipalityId, payload) => {
    const barangayName = String(payload?.name || '').trim();

    if (!session || !municipalityId || !barangayName) {
      return { ok: false };
    }

    let created = false;

    setData((current) => {
      const draft = clone(current);
      const municipality = (draft.municipalities || []).find((item) => item.id === municipalityId);

      if (!municipality) {
        return draft;
      }

      draft.barangays = draft.barangays || [];

      const duplicate = draft.barangays.some(
        (barangay) =>
          String(barangay.municipality || '').toLowerCase() === String(municipality.name || '').toLowerCase() &&
          String(barangay.name || '').toLowerCase() === barangayName.toLowerCase()
      );

      if (duplicate) {
        return draft;
      }

      draft.barangays.unshift({
        id: makeId('barangay'),
        municipality: municipality.name,
        name: barangayName,
        status: 'Active',
        createdAt: getTodayDateValue(),
        updatedAt: getTodayDateValue(),
      });

      created = true;

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Added barangay ${barangayName} under ${municipality.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast(created ? 'Barangay record added.' : 'Barangay already exists for this municipality.', created ? 'success' : 'warning');
    return { ok: created };
  };

  const addOffice = (payload) => {
    if (!session || !payload.name.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.offices.unshift({
        id: makeId('office'),
        name: payload.name.trim(),
        type: payload.type?.trim() || 'Municipal Office',
        municipality: payload.municipality?.trim() || 'Unassigned',
        province: payload.province?.trim() || 'Bulacan',
        address: payload.address?.trim() || '',
        houseNumber: payload.houseNumber?.trim() || '',
        streetName: payload.streetName?.trim() || '',
        subdivisionArea: payload.subdivisionArea?.trim() || '',
        contactNumber: payload.contactNumber?.trim() || 'Not provided',
        emailAddress: payload.emailAddress?.trim() || '',
        officeHours: payload.officeHours?.trim() || 'Mon-Fri, 8:00 AM - 5:00 PM',
        status: payload.status || 'Active',
        inCharge: payload.inCharge?.trim() || payload.lead?.trim() || 'Not set',
        lead: payload.inCharge?.trim() || payload.lead?.trim() || 'Not set',
        createdAt: getTodayDateValue(),
        updatedAt: getTodayDateValue(),
        description: payload.description?.trim() || `${payload.name.trim()} office record`,
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Registered office: ${payload.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office record added.');
  };

  const updateOffice = (officeId, payload) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.offices.find((office) => office.id === officeId);
      if (!target) {
        return draft;
      }

      target.name = payload.name?.trim() || target.name;
      target.type = payload.type?.trim() || target.type;
      target.municipality = payload.municipality?.trim() || target.municipality;
      target.province = payload.province?.trim() || target.province;
      target.address = payload.address?.trim() || target.address;
      target.houseNumber = payload.houseNumber?.trim() || target.houseNumber || '';
      target.streetName = payload.streetName?.trim() || target.streetName || '';
      target.subdivisionArea = payload.subdivisionArea?.trim() || target.subdivisionArea || '';
      target.contactNumber = payload.contactNumber?.trim() || target.contactNumber;
      target.emailAddress = payload.emailAddress?.trim() || target.emailAddress;
      target.officeHours = payload.officeHours?.trim() || target.officeHours;
      target.inCharge = payload.inCharge?.trim() || payload.lead?.trim() || target.inCharge || target.lead;
      target.lead = target.inCharge;
      target.description = payload.description?.trim() || target.description;
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Updated office: ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office record updated.', 'neutral');
  };

  const toggleOfficeStatus = (officeId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.offices.find((office) => office.id === officeId);
      if (!target) {
        return draft;
      }

      target.status = target.status === 'Active' ? 'Inactive' : 'Active';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `${target.status === 'Active' ? 'Activated' : 'Deactivated'} office ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office status updated.', 'neutral');
  };

  const archiveOffice = (officeId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.offices.find((office) => office.id === officeId);
      if (!target) {
        return draft;
      }

      target.status = 'Archived';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Archived office ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office archived.', 'neutral');
  };

  const updatePersonnelAssignment = (userId, payload) => {
    if (!session) {
      return;
    }

    if (session.role === 'personnel') {
      const managedUsers = getManagedStaffUsers(data.users, session);
      const allowedTarget = managedUsers.find((user) => user.id === userId && user.id !== session.id);

      if (!allowedTarget) {
        showToast('You can only update assignments for staff inside your assigned hierarchy.', 'warning');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId && user.role === 'personnel');
      if (!target) {
        return draft;
      }

      const nextStaffRole = getStaffRoleKey({ role: 'personnel', staffRole: payload.role, title: payload.role });
      target.municipality = payload.municipality?.trim() || '';
      target.office = target.municipality
        ? resolveManagedOffice('personnel', target.municipality, draft.offices, target.office)
        : '';
      target.staffRole = nextStaffRole;
      target.title = getRoleTitle('personnel', nextStaffRole);
      target.dateAssigned = payload.dateAssigned || getTodayDateValue();
      target.accessStartDate = payload.accessStartDate || target.accessStartDate;
      target.accessEndDate = payload.accessEndDate || target.accessEndDate;
      target.status =
        payload.status ||
        getAccessStatus(target.accessStartDate || getTodayDateValue(), target.accessEndDate);

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Updated personnel assignment for ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Personnel assignment updated.', 'neutral');
  };

  const resetUserCredentials = (userId) => {
    void userId;

    if (!session) {
      return;
    }

    showToast('Credential resets must be handled through Supabase Auth or a deployed Edge Function.', 'warning');
  };

  const removePersonnelAssignment = (userId) => {
    if (!session) {
      return;
    }

    if (session.role === 'personnel') {
      const managedUsers = getManagedStaffUsers(data.users, session);
      const allowedTarget = managedUsers.find((user) => user.id === userId && user.id !== session.id);

      if (!allowedTarget) {
        showToast('You can only remove assignments for staff inside your assigned hierarchy.', 'warning');
        return;
      }
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId && user.role === 'personnel');
      if (!target) {
        return draft;
      }

      target.municipality = '';
      target.office = '';
      target.status = 'Inactive';
      target.inviteStatus = 'Assignment Removed';

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Removed hierarchy assignment for ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Personnel assignment removed.', 'neutral');
  };

  const addTaxonomyItem = (type, name) => {
    if (!session || !name.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      if (type === 'category') {
        draft.categories.unshift({ id: makeId('category'), name: name.trim(), programCount: 0 });
      } else {
        draft.sectors.unshift({ id: makeId('sector'), name: name.trim() });
      }

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Added ${type}: ${name.trim()}`,
        'Categories & Sectors'
      );

      return draft;
    });
  };

  const toggleSetting = (key) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.settings[key] = !draft.settings[key];
      appendAuditLog(draft, session.name, getActorRoleLabel(session), `Toggled setting: ${key}`, 'System Settings');
      return draft;
    });
  };

  const updateRetentionDays = (days) => {
    setData((current) => {
      const draft = clone(current);
      draft.settings.auditRetentionDays = days;
      return draft;
    });
  };

  const saveSystemBranding = async (payload) => {
    const nextBranding = getNormalizedUiBranding(payload);

    if (!isSupabaseConfigured) {
      setData((current) => ({
        ...current,
        uiBranding: nextBranding,
      }));

      showToast('Supabase is not configured. Branding was applied locally only.', 'warning');
      return { ok: true, data: nextBranding };
    }

    try {
      const saved = await saveUiSettings({
        ...nextBranding,
        updatedBy: session?.id || null,
      });

      setData((current) => {
        const draft = clone(current);
        draft.uiBranding = getNormalizedUiBranding(saved);

        if (session) {
          appendAuditLog(
            draft,
            session.name,
            getActorRoleLabel(session),
            `Updated system branding for ${saved.systemName || DEFAULT_UI_BRANDING.systemName}`,
            'System Branding'
          );
        }

        return draft;
      });

      showToast('System branding updated across the platform.');
      return { ok: true, data: saved };
    } catch (error) {
      showToast(error.message || 'Unable to save system branding.', 'danger');
      return { ok: false, error: error.message || 'Unable to save system branding.' };
    }
  };

  const uploadSystemBrandingLogo = async (file) => {
    if (!file) {
      return { ok: false, error: 'Select a logo before uploading.' };
    }

    if (!isSupabaseConfigured) {
      showToast('Supabase is not configured. Logo upload is unavailable.', 'warning');
      return { ok: false, error: 'Supabase is not configured.' };
    }

    try {
      const uploadResult = await uploadUiLogo(file, session?.id || null);
      showToast('Logo uploaded to programfinder-logos. Save branding to apply it globally.');
      return { ok: true, logoUrl: uploadResult.publicUrl };
    } catch (error) {
      showToast(error.message || 'Unable to upload branding logo.', 'danger');
      return { ok: false, error: error.message || 'Unable to upload branding logo.' };
    }
  };

  const createBackup = () => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.backupHistory.unshift({
        id: makeId('backup'),
        date: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date()),
        type: 'Manual Snapshot',
        status: 'Completed',
        size: '85 MB',
      });

      appendAuditLog(draft, session.name, getActorRoleLabel(session), 'Created manual backup snapshot', 'Backup & Restore');
      return draft;
    });
  };

  const restoreBackup = (payload) => {
    if (!session) {
      return { ok: false };
    }

    const fileName = payload?.fileName?.trim();

    if (!fileName) {
      showToast('Select a restore file before starting the database restore.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      draft.restoreHistory = draft.restoreHistory || [];
      draft.restoreHistory.unshift({
        id: makeId('restore'),
        date: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date()),
        source: payload.source || 'Uploaded Backup File',
        fileName,
        size: payload.size || 'Uploaded file',
        status: 'Completed',
        initiatedBy: session.name,
      });

      appendAuditLog(
        draft,
        session.name,
        getActorRoleLabel(session),
        `Restored database from ${fileName}`,
        'Backup & Restore'
      );

      return draft;
    });

    showToast('Database restore completed from the uploaded file.');
    return { ok: true };
  };

  return {
    path,
    session,
    data,
    toast,
    navigate,
    login,
    registerApplicant,
    requestApplicantPasswordReset,
    resetApplicantPassword,
    resendApplicantSignupCode,
    verifyApplicantSignup,
    logout,
    reset,
    roleFromPath: getRoleFromPath(path),
    sectionFromPath: getSectionFromPath(path),
    loginRoleFromPath: getLoginRoleFromPath(path),
    authModeFromPath: getAuthModeFromPath(path),
    actions: {
      openProgramDetails,
      startApplication,
      toggleBookmark,
      updateComposerNotes,
      clearComposer,
      attachRequirement,
      uploadRequirementFile,
      reuseVaultDocumentsForApplication,
      removeAttachedRequirement,
      removeRequirementFile,
      submitApplication,
      uploadDocument,
      markNotificationsRead,
      markNotificationRead: markNotificationReadById,
      saveApplicantProfile,
      saveApplicantSearchSurvey,
      saveApplicantOnboardingSurvey,
      saveApplicantSurvey,
      addApplicantFamilyMember: addApplicantFamilyMemberRecord,
      updateApplicantFamilyMember: updateApplicantFamilyMemberRecord,
      deleteApplicantFamilyMember: removeApplicantFamilyMemberRecord,
      uploadApplicantProfileDocument: uploadApplicantProfileDocumentRecord,
      updateApplicantProfileDocument: updateApplicantProfileDocumentRecord,
      deleteApplicantProfileDocument: deleteApplicantProfileDocumentRecord,
      registerApplicant,
      verifyApplicantSignup,
      resendApplicantSignupCode,
      requestApplicantPasswordReset,
      resetApplicantPassword,
      createProgram,
      refreshProgramRecords,
      updateProgram,
      archiveProgram,
      deleteProgram,
      toggleProgramStatus,
      reviewApplication,
      sendMessageToApplicants,
      publishAnnouncement,
      updateUserRole,
      toggleUserStatus,
      createUserAccount,
      updateStaffPasswordAfterFirstLogin,
      addMunicipality,
      updateMunicipality,
      toggleMunicipalityStatus,
      archiveMunicipality,
      addBarangay,
      addOffice,
      updateOffice,
      toggleOfficeStatus,
      archiveOffice,
      updatePersonnelAssignment,
      resetUserCredentials,
      removePersonnelAssignment,
      addTaxonomyItem,
      toggleSetting,
      updateRetentionDays,
      saveSystemBranding,
      uploadSystemBrandingLogo,
      createBackup,
      restoreBackup,
    },
  };
}
