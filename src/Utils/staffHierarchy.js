const CORE_ROLE_LABELS = {
  personnel: 'Government Personnel',
  applicant: 'Applicant',
  system_admin: 'System Admin',
  system_secretary: 'System Secretary',
  municipal_mayor: 'Municipal Mayor',
  municipal_secretary: 'Municipal Secretary',
  barangay_captain: 'Barangay Captain',
  barangay_secretary: 'Barangay Secretary',
  provincial_captain: 'System Admin',
  provincial_secretary: 'System Secretary',
};

export const STAFF_ROLE_LABELS = {
  system_admin: 'System Admin',
  system_secretary: 'System Secretary',
  municipal_mayor: 'Municipal Mayor',
  municipal_secretary: 'Municipal Secretary',
  barangay_captain: 'Barangay Captain',
  barangay_secretary: 'Barangay Secretary',
  captain: 'System Admin',
  secretary: 'System Secretary',
  barangay: 'Barangay Captain',
  personnel: 'Government Personnel',
};

export const SUPABASE_STAFF_ROLE_MAP = {
  system_admin: 'system_admin',
  system_secretary: 'system_secretary',
  municipal_mayor: 'municipal_mayor',
  municipal_secretary: 'municipal_secretary',
  barangay_captain: 'barangay_captain',
  barangay_secretary: 'barangay_secretary',
  captain: 'system_admin',
  secretary: 'system_secretary',
  barangay: 'barangay_captain',
};

export const SUPABASE_ROLE_TO_STAFF_ROLE = {
  system_admin: 'system_admin',
  system_secretary: 'system_secretary',
  municipal_mayor: 'municipal_mayor',
  municipal_secretary: 'municipal_secretary',
  barangay_captain: 'barangay_captain',
  barangay_secretary: 'barangay_secretary',
  provincial_captain: 'system_admin',
  provincial_secretary: 'system_secretary',
};

export const STAFF_ROLE_DESCRIPTIONS = {
  system_admin: 'Top-level administrator who creates municipal mayor accounts and oversees the full hierarchy.',
  system_secretary: 'System-level support account for workspace operations.',
  municipal_mayor: 'Municipality lead who creates barangay captain accounts inside the assigned municipality.',
  municipal_secretary: 'Municipal support account for workspace operations.',
  barangay_captain: 'Barangay lead who creates barangay secretary accounts inside the assigned barangay.',
  barangay_secretary: 'Barangay support account for local office operations.',
  personnel: 'Personnel access with the same broad office controls used before the hierarchy split.',
};

export const STAFF_ROLE_ORDER = {
  system_admin: 0,
  system_secretary: 1,
  municipal_mayor: 2,
  municipal_secretary: 3,
  barangay_captain: 4,
  barangay_secretary: 5,
  personnel: 6,
};

function normalizeWords(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function normalizeStaffRole(value) {
  const normalized = normalizeWords(value);
  const enumRole = normalized.replace(/\s+/g, '_');

  if (!normalized) {
    return 'personnel';
  }

  if (SUPABASE_ROLE_TO_STAFF_ROLE[enumRole]) {
    return SUPABASE_ROLE_TO_STAFF_ROLE[enumRole];
  }

  if (enumRole === 'captain') {
    return 'system_admin';
  }

  if (enumRole === 'secretary') {
    return 'system_secretary';
  }

  if (enumRole === 'barangay') {
    return 'barangay_captain';
  }

  if (STAFF_ROLE_LABELS[enumRole]) {
    return enumRole;
  }

  if (normalized.includes('system') && normalized.includes('admin')) {
    return 'system_admin';
  }

  if (normalized.includes('system') && normalized.includes('secretary')) {
    return 'system_secretary';
  }

  if (normalized.includes('municipal') && normalized.includes('mayor')) {
    return 'municipal_mayor';
  }

  if (normalized.includes('municipal') && normalized.includes('secretary')) {
    return 'municipal_secretary';
  }

  if (normalized.includes('barangay') && normalized.includes('secretary')) {
    return 'barangay_secretary';
  }

  if (normalized.includes('barangay') && normalized.includes('captain')) {
    return 'barangay_captain';
  }

  if (normalized === 'barangay' || normalized.includes('barangay personnel')) {
    return 'barangay_captain';
  }

  if (normalized.includes('captain')) {
    return 'system_admin';
  }

  if (normalized.includes('secretary')) {
    return 'system_secretary';
  }

  if (normalized.includes('mayor')) {
    return 'municipal_mayor';
  }

  return 'personnel';
}

export function isStaffAccount(account) {
  if (!account) {
    return false;
  }

  return account.role === 'personnel' || Boolean(SUPABASE_ROLE_TO_STAFF_ROLE[String(account.role || '').toLowerCase()]);
}

export function getStaffRoleKey(account) {
  if (!isStaffAccount(account)) {
    return null;
  }

  return normalizeStaffRole(account.staffRole || account.title || account.role);
}

export function getStaffRoleLabel(value) {
  const key = normalizeStaffRole(value);
  return STAFF_ROLE_LABELS[key] || STAFF_ROLE_LABELS.personnel;
}

export function getCoreRoleLabel(role) {
  return CORE_ROLE_LABELS[role] || String(role || 'User');
}

export function getAccountRoleLabel(account) {
  if (!account) {
    return 'User';
  }

  return account.role === 'personnel'
    ? getStaffRoleLabel(account.staffRole || account.title)
    : getCoreRoleLabel(account.role);
}

export function hasCaptainWorkspaceAccess(account) {
  return isStaffAccount(account) && ['system_admin', 'system_secretary'].includes(getStaffRoleKey(account));
}

export function canManageStaffAccounts(account) {
  if (!account) {
    return false;
  }

  if (!isStaffAccount(account)) {
    return false;
  }

  return ['system_admin', 'system_secretary', 'municipal_mayor', 'barangay_captain'].includes(getStaffRoleKey(account));
}

export function getAssignableStaffRoles(account) {
  if (!account) {
    return [];
  }

  if (!isStaffAccount(account)) {
    return [];
  }

  const staffRole = getStaffRoleKey(account);

  if (staffRole === 'system_admin' || staffRole === 'system_secretary') {
    return ['municipal_mayor'];
  }

  if (staffRole === 'municipal_mayor') {
    return ['municipal_secretary', 'barangay_captain'];
  }

  if (staffRole === 'barangay_captain') {
    return ['barangay_secretary'];
  }

  return [];
}

export function canComposeProgramContent(account) {
  if (!account) {
    return false;
  }

  if (!isStaffAccount(account)) {
    return false;
  }

  return [
    'system_admin',
    'system_secretary',
    'municipal_mayor',
    'municipal_secretary',
    'barangay_captain',
    'barangay_secretary',
    'personnel',
  ].includes(getStaffRoleKey(account));
}

export function canSetProgramRelease(account) {
  if (!account) {
    return false;
  }

  if (!isStaffAccount(account)) {
    return false;
  }

  return ['system_admin', 'municipal_mayor', 'barangay_captain', 'personnel'].includes(getStaffRoleKey(account));
}

export function canReviewApplicants(account) {
  if (!account) {
    return false;
  }

  if (!isStaffAccount(account)) {
    return false;
  }

  return [
    'system_admin',
    'system_secretary',
    'municipal_mayor',
    'municipal_secretary',
    'barangay_captain',
    'barangay_secretary',
    'personnel',
  ].includes(getStaffRoleKey(account));
}

export function canPublishAnnouncements(account) {
  return canReviewApplicants(account);
}

export function getDefaultRootManagerId(account) {
  if (!isStaffAccount(account)) {
    return null;
  }

  const staffRole = getStaffRoleKey(account);

  if (staffRole === 'system_admin') {
    return account.id || null;
  }

  return account.rootManagerId || account.parentStaffId || account.id || null;
}

export function getManagedStaffUsers(users, account) {
  const staffUsers = (users || []).filter((user) => isStaffAccount(user));

  if (!account) {
    return [];
  }

  if (hasCaptainWorkspaceAccess(account)) {
    return [...staffUsers].sort((left, right) =>
      (STAFF_ROLE_ORDER[getStaffRoleKey(left)] ?? 99) - (STAFF_ROLE_ORDER[getStaffRoleKey(right)] ?? 99) ||
      String(left.name || '').localeCompare(String(right.name || ''), undefined, { sensitivity: 'base' })
    );
  }

  if (!isStaffAccount(account)) {
    return [];
  }

  const actorStaffRole = getStaffRoleKey(account);

  const visibleUsers = staffUsers.filter((user) => {
    if (user.id === account.id) {
      return true;
    }

    if (actorStaffRole === 'system_admin') {
      return user.rootManagerId === account.id || user.parentStaffId === account.id || user.createdByUserId === account.id;
    }

    return user.parentStaffId === account.id || user.createdByUserId === account.id;
  });

  return visibleUsers.sort((left, right) =>
    (STAFF_ROLE_ORDER[getStaffRoleKey(left)] ?? 99) - (STAFF_ROLE_ORDER[getStaffRoleKey(right)] ?? 99) ||
    String(left.name || '').localeCompare(String(right.name || ''), undefined, { sensitivity: 'base' })
  );
}
