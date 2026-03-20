import { ADMIN_MODULES } from '../modules/admin/config';
import { PERSONNEL_MODULES } from '../modules/personnel/config';
import { APPLICANT_MODULES } from '../modules/applicant/config';

export const MODULE_REGISTRY = {
  admin: ADMIN_MODULES,
  personnel: PERSONNEL_MODULES,
  applicant: APPLICANT_MODULES,
};

export function getDefaultSection(role) {
  return MODULE_REGISTRY[role]?.[0]?.key || 'dashboard';
}

export function getSectionKeys(role) {
  return (MODULE_REGISTRY[role] || []).map((item) => item.key);
}
