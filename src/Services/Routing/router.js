import { getDefaultSection, getSectionKeys } from 'Services/Navigation/moduleRegistry';

export const LOGIN_ROUTES = {
  personnel: '/login/personnel-login',
  applicant: '/login/applicant',
};
export const STAFF_LOGIN_ROUTE = LOGIN_ROUTES.personnel;
const APPLICANT_AUTH_VIEWS = new Set(['signup', 'verify-signup', 'forgot-password']);

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

  const [root, second, third] = parts;

  if (root === 'personnel-login') {
    return LOGIN_ROUTES.personnel;
  }

  if (root === 'login' && second === 'personnel-login') {
    return LOGIN_ROUTES.personnel;
  }

  if (root === 'login' && second === 'personnel') {
    return LOGIN_ROUTES.personnel;
  }

  if (root === 'login' && second === 'admin') {
    return LOGIN_ROUTES.personnel;
  }

  if (root === 'login' && LOGIN_ROUTES[second]) {
    if (second === 'applicant' && APPLICANT_AUTH_VIEWS.has(third)) {
      return `/login/${second}/${third}`;
    }

    return `/login/${second}`;
  }

  if (root === 'admin') {
    const allowed = getSectionKeys('personnel');
    const safeSection = allowed.includes(second) ? second : getDefaultSection('personnel');
    const extraPath = allowed.includes(second) ? parts.slice(2).join('/') : '';
    return `/personnel/${safeSection}${extraPath ? `/${extraPath}` : ''}`;
  }

  if (Object.prototype.hasOwnProperty.call(LOGIN_ROUTES, root)) {
    const allowed = getSectionKeys(root);
    const safeSection = allowed.includes(second) ? second : getDefaultSection(root);
    const extraPath = allowed.includes(second) ? parts.slice(2).join('/') : '';
    return `/${root}/${safeSection}${extraPath ? `/${extraPath}` : ''}`;
  }

  return '/';
}

export function getRoleFromPath(path) {
  const [root] = normalizePath(path).split('/').filter(Boolean);
  return root || null;
}

export function getSectionFromPath(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);
  return parts[1] || null;
}

export function getLoginRoleFromPath(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);
  if (parts[0] === 'login' && parts[1] === 'personnel-login') {
    return 'personnel';
  }

  if (parts[0] === 'login' && LOGIN_ROUTES[parts[1]]) {
    return parts[1];
  }
  return null;
}

export function getAuthModeFromPath(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);

  if (parts[0] === 'login' && parts[1] === 'applicant') {
    if (parts[2] === 'signup') {
      return 'signup';
    }

    if (parts[2] === 'verify-signup') {
      return 'verify-signup';
    }

    if (parts[2] === 'forgot-password') {
      return 'forgot';
    }
  }

  return 'signin';
}

export function getHomeRoute(role, session = null) {
  return `/${role}/${getDefaultSection(role, session)}`;
}

export function getLoginRoute(role, authMode = 'signin') {
  if (role === 'applicant') {
    if (authMode === 'signup') {
      return '/login/applicant/signup';
    }

    if (authMode === 'forgot') {
      return '/login/applicant/forgot-password';
    }
  }

  return LOGIN_ROUTES[role];
}
