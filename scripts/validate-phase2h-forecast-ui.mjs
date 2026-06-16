import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  client: path.join(root, 'src/lib/forecastingItemDetails.js'),
  panel: path.join(root, 'src/components/ItemDetailsForecastPanel.jsx'),
  workspace: path.join(root, 'src/components/ItemDetailsWorkspace.jsx'),
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

const client = read(files.client);
const panel = read(files.panel);
const workspace = read(files.workspace);

assertContains(client, 'VITE_INVYRA_FORECASTING_API_BASE_URL', 'forecasting client');
assertContains(client, '/inventory/item-details/forecast', 'forecasting client');
assertContains(client, 'Forecast unavailable. Item Details and stock history remain usable.', 'forecasting client');
assertContains(client, 'mutates_stock: false', 'forecasting client');
assertContains(client, 'creates_purchase_order: false', 'forecasting client');
assertContains(client, 'approves_purchase_order: false', 'forecasting client');
assertContains(client, 'show_raw_model_internals: false', 'forecasting client');
assertContains(client, 'show_raw_movement_rows: false', 'forecasting client');
assertContains(client, 'duplicate_stock_history: false', 'forecasting client');
assertContains(client, 'duplicate_reorder_review: false', 'forecasting client');

assertNotContains(client, 'base44.entities.InventoryItem.update', 'forecasting client');
assertNotContains(client, 'base44.entities.InventoryItem.create', 'forecasting client');
assertNotContains(client, 'base44.entities.PurchaseOrder.create', 'forecasting client');
assertNotContains(client, 'base44.entities.PurchaseOrder.update', 'forecasting client');
assertNotContains(client, 'base44.entities.StockMovement.create', 'forecasting client');

assertContains(panel, 'ItemDetailsForecastPanel', 'forecast panel');
assertContains(panel, '/inventory/item-details/forecast/snapshots/', 'forecast panel');
assertContains(panel, 'Advisory only', 'forecast panel');
assertContains(panel, 'Ledger remains source of truth', 'forecast panel');
assertContains(panel, 'No stock adjustment', 'forecast panel');
assertContains(panel, 'No purchase order action', 'forecast panel');
assertContains(panel, 'Item Details and Stock History remain usable.', 'forecast panel');
assertNotContains(panel, 'base44.entities.InventoryItem.update', 'forecast panel');
assertNotContains(panel, 'base44.entities.PurchaseOrder.create', 'forecast panel');
assertNotContains(panel, 'base44.entities.StockMovement.create', 'forecast panel');

assertContains(workspace, 'ItemDetailsForecastPanel', 'item details workspace');
assertContains(workspace, '<ItemDetailsForecastPanel item={item} movements={movements} loadingMovements={loadingMovements} />', 'item details workspace');
assertContains(workspace, 'Full transaction history remains in the Movements module.', 'item details workspace');
assertContains(workspace, 'Safety lock: this screen is read-only', 'item details workspace');
assertNotContains(workspace, 'base44.entities.PurchaseOrder.create', 'item details workspace');

console.log('Phase 2H forecast UI runtime validation passed.');
