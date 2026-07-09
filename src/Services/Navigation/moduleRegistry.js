import { ADMIN_MODULES } from 'Data/Modules/admin-user-modules-config';
import { PERSONNEL_MODULES } from 'Data/Modules/personnel-user-modules-config';
import { APPLICANT_MODULES } from 'Data/Modules/applicant-user-modules-config';
import { getStaffRoleKey, hasCaptainWorkspaceAccess } from 'Utils/staffHierarchy';

function mergeModules(...groups) {
  const seenKeys = new Set();

  return groups.flat().filter((item) => {
    if (!item || seenKeys.has(item.key)) {
      return false;
    }

    seenKeys.add(item.key);
    return true;
  });
}

const CAPTAIN_ADMIN_MODULES = ADMIN_MODULES.map((item) =>
  item.key === 'user-accounts' || item.key === 'reports-analytics'
    ? { ...item, hiddenInNav: true }
    : item
);

export const CAPTAIN_MODULES = mergeModules(CAPTAIN_ADMIN_MODULES, PERSONNEL_MODULES);
const PERSONNEL_SECTION_MODULES = mergeModules(ADMIN_MODULES, PERSONNEL_MODULES);
const HIDDEN_DETAIL_SECTIONS = ['view-municipality', 'view-offices'];
const PROGRAM_SETUP_ROLES = [
  'system_admin',
  'system_secretary',
  'provincial_captain',
  'provincial_secretary',
  'municipal_mayor',
  'municipal_secretary',
  'barangay_captain',
  'barangay_secretary',
];

function applyRoleModuleFilters(modules, session) {
  const staffRole = getStaffRoleKey(session);

  return modules.filter((item) => {
    if (item.key === 'categories-sectors') {
      return PROGRAM_SETUP_ROLES.includes(staffRole);
    }

    if (item.key === 'team-management' && staffRole === 'barangay_secretary') {
      return false;
    }

    return true;
  });
}

export const MODULE_REGISTRY = {
  personnel: PERSONNEL_MODULES,
  applicant: APPLICANT_MODULES,
};

export function getModulesForRole(role, session = null) {
  if (role === 'personnel' && hasCaptainWorkspaceAccess(session)) {
    return applyRoleModuleFilters(CAPTAIN_MODULES, session);
  }

  return applyRoleModuleFilters(MODULE_REGISTRY[role] || [], session);
}

export function getDefaultSection(role, session = null) {
  return getModulesForRole(role, session)?.[0]?.key || 'dashboard';
}

export function getSectionKeys(role) {
  if (role === 'personnel') {
    return PERSONNEL_SECTION_MODULES.map((item) => item.key);
  }

  return (MODULE_REGISTRY[role] || []).map((item) => item.key);
}

export function isSectionAllowed(role, section, session = null) {
  if (role === 'personnel' && HIDDEN_DETAIL_SECTIONS.includes(section)) {
    return getSectionKeys(role).includes(section);
  }

  return getModulesForRole(role, session).some((item) => item.key === section);
}
