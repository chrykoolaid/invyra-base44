/**
 * Invyra Role-Based Access Control
 *
 * Roles (lowest → highest privilege):
 *   staff       – floor scans, POS register, wastage entry
 *   supervisor  – + receiving, stocktake, transfers, adjustments
 *   manager     – + reorder review, orders, suppliers, reports
 *   admin       – full access including admin panel & integrations
 */

// Every route path the app has, mapped to the minimum role allowed.
export const ROUTE_PERMISSIONS = {
  '/Dashboard':          'staff',
  '/POSMode':            'staff',
  '/GapScan':            'staff',
  '/GapScan/floor':      'staff',
  '/Wastage':            'staff',
  '/Wastage/workspace':  'staff',
  '/Inventory':          'supervisor',
  '/Receiving':          'supervisor',
  '/Receiving/workspace':'supervisor',
  '/Receiving/log':      'supervisor',
  '/Stocktake':          'supervisor',
  '/Transfers':          'supervisor',
  '/Adjustments':        'supervisor',
  '/Movements':          'supervisor',
  '/Exceptions':         'supervisor',
  '/DeliveryPortal':     'supervisor',
  '/Suppliers':          'manager',
  '/ReorderReview':      'manager',
  '/Orders':             'manager',
  '/Reports':            'manager',
  '/Payroll':            'manager',
  '/TimeTracking':       'manager',
  '/InventoryAdmin':        'admin',
  '/ExportsIntegrations':   'admin',
  '/InventoryRoadmap':      'admin',
  '/LocalForecastVerification': 'admin',
  '/Training/Staff':        'staff',
  '/Training/Supervisor':   'supervisor',
  '/Training/Manager':      'manager',
};

const ROLE_RANK = { staff: 1, supervisor: 2, manager: 3, admin: 4 };

/** Returns true if `userRole` meets or exceeds `requiredRole`. */
export function hasAccess(userRole, requiredRole) {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[requiredRole] ?? 99);
}

/** Returns true if the user can visit a given route path. */
export function canAccessRoute(userRole, path) {
  // Find the most specific matching prefix
  const match = Object.entries(ROUTE_PERMISSIONS)
    .filter(([route]) => path === route || path.startsWith(route + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (!match) return true; // unregistered routes are open
  return hasAccess(userRole, match[1]);
}

/** Human-readable role label. */
export function roleLabel(role) {
  return { admin: 'Admin', manager: 'Manager', supervisor: 'Supervisor', staff: 'Staff' }[role] ?? role;
}

/** Badge colour class for a role chip. */
export function roleBadgeClass(role) {
  return {
    admin:      'bg-violet-100 text-violet-700 border-violet-200',
    manager:    'bg-blue-100 text-blue-700 border-blue-200',
    supervisor: 'bg-amber-100 text-amber-700 border-amber-200',
    staff:      'bg-slate-100 text-slate-600 border-slate-200',
  }[role] ?? 'bg-muted text-muted-foreground border-border';
}
