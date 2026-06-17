/**
 * rolePermissions.js
 * Role-based permission checks for UI visibility
 */

export function canApproveStockOut(role) {
  const r = (role || '').toLowerCase();
  return ['supervisor', 'manager', 'admin'].includes(r);
}

export function canRejectStockOut(role) {
  const r = (role || '').toLowerCase();
  return ['supervisor', 'manager', 'admin'].includes(r);
}

export function canReverseStockOut(role) {
  const r = (role || '').toLowerCase();
  return ['manager', 'admin'].includes(r);
}

export function canAccessScannerIntake(role) {
  const r = (role || '').toLowerCase();
  return ['supervisor', 'manager', 'admin'].includes(r);
}

export function canAccessAmendments(role) {
  const r = (role || '').toLowerCase();
  return ['manager', 'admin'].includes(r);
}

export function canAccessAlerts(role) {
  const r = (role || '').toLowerCase();
  return ['manager', 'admin'].includes(r);
}

export function canAccessReports(role) {
  const r = (role || '').toLowerCase();
  return ['manager', 'admin'].includes(r);
}

export function canCreateStockOut(role) {
  return true; // All roles can create drafts
}

export function canSubmitStockOut(role) {
  return true; // All roles can submit their own drafts
}