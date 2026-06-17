/**
 * Shared role utilities for Markdown backend functions.
 * Roles are stored and compared LOWERCASE: staff | supervisor | manager | admin
 * This matches lib/permissions.js ROLE_RANK exactly.
 *
 * Normalise on every inbound user.role to guard against any future casing drift.
 */

export function normaliseRole(role) {
  return (role || '').toLowerCase().trim();
}

export function isPrivileged(role) {
  return ['supervisor', 'manager', 'admin'].includes(normaliseRole(role));
}

export function isManager(role) {
  return ['manager', 'admin'].includes(normaliseRole(role));
}

export function isAdmin(role) {
  return normaliseRole(role) === 'admin';
}

/** Outcomes that require Manager or Admin to process */
export const MANAGER_REQUIRED_OUTCOMES = ['Donate', 'Return_To_Supplier', 'Transfer'];