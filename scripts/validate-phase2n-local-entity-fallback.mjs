import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  fallback: path.join(root, 'src/lib/localDevInventoryFallback.js'),
  inventory: path.join(root, 'src/pages/Inventory.jsx'),
  itemDetails: path.join(root, 'src/components/ItemDetailsWorkspace.jsx'),
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

const fallback = read(files.fallback);
const inventory = read(files.inventory);
const itemDetails = read(files.itemDetails);

assertContains(fallback, 'env.DEV === true', 'local dev fallback helper');
assertContains(fallback, 'VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE', 'local dev fallback helper');
assertContains(fallback, 'Promise.race', 'local dev fallback helper');
assertContains(fallback, 'getLocalDevInventoryItems', 'local dev fallback helper');
assertContains(fallback, 'getLocalDevStockMovements', 'local dev fallback helper');
assertNotContains(fallback, 'env.PROD', 'local dev fallback helper');

assertContains(inventory, 'withLocalDevTimeout(request, 4000, \'InventoryItem.filter\')', 'Inventory page');
assertContains(inventory, 'isLocalDevInventoryFallbackEnabled()', 'Inventory page');
assertContains(inventory, 'getLocalDevInventoryItems()', 'Inventory page');
assertContains(inventory, 'setLoading(false)', 'Inventory page');
assertContains(inventory, 'localDevInventoryFallbackNotice(\'Inventory items\')', 'Inventory page');

assertContains(itemDetails, 'withLocalDevTimeout(request, 4000, \'StockMovement.filter\')', 'Item Details workspace');
assertContains(itemDetails, 'isLocalDevInventoryFallbackEnabled()', 'Item Details workspace');
assertContains(itemDetails, 'getLocalDevStockMovements(item)', 'Item Details workspace');
assertContains(itemDetails, 'setLoadingMovements(false)', 'Item Details workspace');
assertContains(itemDetails, 'localDevInventoryFallbackNotice(\'Stock movements\')', 'Item Details workspace');

console.log('Phase 2N local entity fallback validation passed.');
