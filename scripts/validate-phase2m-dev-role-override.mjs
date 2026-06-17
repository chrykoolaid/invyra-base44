import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  override: path.join(root, 'src/lib/devRoleOverride.js'),
  roleGuard: path.join(root, 'src/components/RoleGuard.jsx'),
  layout: path.join(root, 'src/components/Layout.jsx'),
  permissions: path.join(root, 'src/lib/permissions.js'),
};

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(content, needle, label) {
  if (!content.includes(needle)) {
    throw new Error(`${label} missing required guard: ${needle}`);
  }
}

function assertNotContains(content, needle, label) {
  if (content.includes(needle)) {
    throw new Error(`${label} contains forbidden pattern: ${needle}`);
  }
}

const override = read(files.override);
const roleGuard = read(files.roleGuard);
const layout = read(files.layout);
const permissions = read(files.permissions);

assertContains(override, 'VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE', 'dev role override resolver');
assertContains(override, 'env.DEV !== true', 'dev role override resolver');
assertContains(override, "'staff'", 'dev role override resolver');
assertContains(override, "'supervisor'", 'dev role override resolver');
assertContains(override, "'manager'", 'dev role override resolver');
assertContains(override, "'admin'", 'dev role override resolver');
assertContains(override, 'normalizeRole(authRole)', 'dev role override resolver');
assertContains(override, "?? 'staff'", 'dev role override resolver');
assertNotContains(override, 'env.PROD', 'dev role override resolver');

assertContains(roleGuard, "import { resolveEffectiveRole } from '@/lib/devRoleOverride';", 'role guard');
assertContains(roleGuard, 'const userRole = resolveEffectiveRole(user?.role);', 'role guard');
assertContains(roleGuard, 'canAccessRoute(userRole, location.pathname)', 'role guard');

assertContains(layout, "import { resolveEffectiveRole } from '@/lib/devRoleOverride';", 'layout navigation');
assertContains(layout, 'const userRole = resolveEffectiveRole(user?.role);', 'layout navigation');
assertContains(layout, 'hasAccess(userRole, item.minRole)', 'layout navigation');

assertContains(permissions, "'/Inventory':          'supervisor'", 'permissions matrix');
assertContains(permissions, "'/Suppliers':          'manager'", 'permissions matrix');
assertContains(permissions, "'/InventoryAdmin':        'admin'", 'permissions matrix');
assertNotContains(permissions, "'/Inventory':          'staff'", 'permissions matrix');
assertNotContains(permissions, "'/InventoryAdmin':        'staff'", 'permissions matrix');

console.log('Phase 2M dev role override validation passed.');
