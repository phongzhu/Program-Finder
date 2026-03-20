import { getDefaultSection, getSectionKeys } from './moduleRegistry';

export const LOGIN_ROUTES = {
  admin: '/login/admin',
  personnel: '/login/personnel',
  applicant: '/login/applicant',
};
export const STAFF_LOGIN_ROUTE = '/personnel-login';

export function getHashPath() {
  const raw = window.location.hash.replace(/^#/, '');
  return raw || '/';
}

export function normalizePath(path) {
  if (!path) {
    return '/';
  }

  const clean = path.startsWith('/') ? path : `/${path}`;
  const parts = clean.split('/').filter(Boolean);

  if (!parts.length) {
    return '/';
  }

  const [root, second] = parts;

  if (root === 'personnel-login') {
    return STAFF_LOGIN_ROUTE;
  }

  if (root === 'login' && LOGIN_ROUTES[second]) {
    return `/login/${second}`;
  }

  if (Object.prototype.hasOwnProperty.call(LOGIN_ROUTES, root)) {
    const allowed = getSectionKeys(root);
    const safeSection = allowed.includes(second) ? second : getDefaultSection(root);
    return `/${root}/${safeSection}`;
  }

  return '/';
}

export function getRoleFromPath(path) {
  if (normalizePath(path) === STAFF_LOGIN_ROUTE) {
    return null;
  }

  const [root] = normalizePath(path).split('/').filter(Boolean);
  return root || null;
}

export function getSectionFromPath(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);
  return parts[1] || null;
}

export function getLoginRoleFromPath(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);
  if (parts[0] === 'login' && LOGIN_ROUTES[parts[1]]) {
    return parts[1];
  }
  return null;
}

export function isStaffLoginPath(path) {
  return normalizePath(path) === STAFF_LOGIN_ROUTE;
}

export function getHomeRoute(role) {
  return `/${role}/${getDefaultSection(role)}`;
}

export function getLoginRoute(role) {
  return LOGIN_ROUTES[role];
}
