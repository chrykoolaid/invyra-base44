/**
 * rolePermissions.js
 * Role-based permission checks for UI visibility
 */

function normalise(role) {
  return (role || '').toLowerCase().trim();
}

export function canApproveStockOut(role) {
  const r = normalise(role);
  return ['supervisor', 'manager', 'admin', 'owner'].includes(r);
}

export function canRejectStockOut(role) {
  const r = normalise(role);
  return ['supervisor', 'manager', 'admin', 'owner'].includes(r);
}

export function canReverseStockOut(role) {
  const r = normalise(role);
  return ['manager', 'admin', 'owner'].includes(r);
}

export function canAccessScannerIntake(role) {
  const r = normalise(role);
  return ['supervisor', 'manager', 'admin', 'owner'].includes(r);
}

export function canAccessAmendments(role) {
  const r = normalise(role);
  return ['manager', 'admin', 'owner'].includes(r);
}

export function canAccessAlerts(role) {
  const r = normalise(role);
  return ['manager', 'admin', 'owner'].includes(r);
}

export function canAccessReports(role) {
  const r = normalise(role);
  return ['manager', 'admin', 'owner'].includes(r);
}

export function canCreateStockOut(role) {
  return Boolean(role); // All signed-in roles can create drafts
}

export function isOwnStockOutDraft(user, record) {
  if (!user || !record) return false;
  const actorIds = [user.id, user.email].filter(Boolean);
  return actorIds.includes(record.created_by) || actorIds.includes(record.created_by_email);
}

export function canSubmitStockOut(role, user, record) {
  const r = normalise(role);
  if (!record || record.status !== 'DRAFT') return false;
  if (r === 'staff') return isOwnStockOutDraft(user, record);
  return ['supervisor', 'manager', 'admin', 'owner'].includes(r);
}

export function canEditStockOutDraft(role, user, record) {
  const r = normalise(role);
  if (!record || record.status !== 'DRAFT') return false;
  if (r === 'staff') return isOwnStockOutDraft(user, record);
  return ['supervisor', 'manager', 'admin', 'owner'].includes(r);
}

export function canDeleteStockOutDraft(role, user, record) {
  const r = normalise(role);
  if (!record || record.status !== 'DRAFT') return false;
  if (r === 'staff') return isOwnStockOutDraft(user, record);
  return ['supervisor', 'manager', 'admin', 'owner'].includes(r);
}

export function canApproveAdjustment(role) {
  return ['supervisor', 'manager', 'admin', 'owner'].includes(normalise(role));
}

export function canSelfPostAdjustment(role) {
  return ['supervisor', 'manager', 'admin', 'owner'].includes(normalise(role));
}

export function canManageGovernance(role) {
  // Only manager/admin/owner may edit item governance metadata
  return ['manager', 'admin', 'owner'].includes(normalise(role));
}