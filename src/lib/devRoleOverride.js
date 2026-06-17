const VALID_LOCAL_DEV_ROLES = new Set(['staff', 'supervisor', 'manager', 'admin']);

export const LOCAL_DEV_ROLE_OVERRIDE_ENV = 'VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE';

export function normalizeRole(role) {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase();
  return VALID_LOCAL_DEV_ROLES.has(normalized) ? normalized : null;
}

export function getLocalDevRoleOverride() {
  const env = import.meta.env ?? {};

  if (env.DEV !== true) {
    return null;
  }

  return normalizeRole(env[LOCAL_DEV_ROLE_OVERRIDE_ENV]);
}

export function resolveEffectiveRole(authRole) {
  return getLocalDevRoleOverride() ?? normalizeRole(authRole) ?? 'staff';
}
