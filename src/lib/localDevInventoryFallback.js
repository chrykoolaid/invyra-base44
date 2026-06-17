export const LOCAL_DEV_INVENTORY_FALLBACK_ENV = 'VITE_INVYRA_LOCAL_DEV_ROLE_OVERRIDE';

export function isLocalDevInventoryFallbackEnabled() {
  const env = import.meta.env ?? {};
  return env.DEV === true && Boolean(env[LOCAL_DEV_INVENTORY_FALLBACK_ENV]);
}

export function withLocalDevTimeout(promise, timeoutMs, label) {
  if (!isLocalDevInventoryFallbackEnabled()) {
    return promise;
  }

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out in local dev fallback mode.`));
      }, timeoutMs);
    }),
  ]);
}

export function localDevInventoryFallbackNotice(entityName) {
  return `${entityName} did not load from the local Base44 SDK connection. Local dev fallback data is being used for browser-only forecasting verification. Hosted Base44 and production permissions are unchanged.`;
}

export function getLocalDevInventoryItems() {
  return [
    {
      id: 'LOCAL-DEV-FORECAST-ITEM-001',
      sku: 'CHM-LIVE-002',
      name: 'Phase 2M Forecast Verification Item',
      stock: 18,
      unit: 'unit',
      cost_per_unit: 12.5,
      preferred_supplier: 'Local Dev Supplier',
      reorder_point: 6,
      reorder_qty: 12,
      is_active: true,
      environment: 'LIVE',
      site_id: 'LOCAL-DEV-BRANCH',
      updated_date: new Date().toISOString(),
    },
  ];
}

export function getLocalDevStockMovements(item) {
  const now = new Date();
  const isoDaysAgo = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const itemId = item?.id || 'LOCAL-DEV-FORECAST-ITEM-001';
  const sku = item?.sku || 'CHM-LIVE-002';
  const itemName = item?.name || 'Phase 2M Forecast Verification Item';

  return [
    {
      id: 'LOCAL-DEV-MOV-001',
      item_id: itemId,
      sku,
      item_name: itemName,
      movement_type: 'SALE',
      direction: 'OUT',
      qty: 3,
      environment: 'LIVE',
      created_date: isoDaysAgo(2),
      updated_date: isoDaysAgo(2),
    },
    {
      id: 'LOCAL-DEV-MOV-002',
      item_id: itemId,
      sku,
      item_name: itemName,
      movement_type: 'SALE',
      direction: 'OUT',
      qty: 4,
      environment: 'LIVE',
      created_date: isoDaysAgo(8),
      updated_date: isoDaysAgo(8),
    },
    {
      id: 'LOCAL-DEV-MOV-003',
      item_id: itemId,
      sku,
      item_name: itemName,
      movement_type: 'SALE',
      direction: 'OUT',
      qty: 2,
      environment: 'LIVE',
      created_date: isoDaysAgo(15),
      updated_date: isoDaysAgo(15),
    },
    {
      id: 'LOCAL-DEV-MOV-004',
      item_id: itemId,
      sku,
      item_name: itemName,
      movement_type: 'RECEIVE',
      direction: 'IN',
      qty: 12,
      environment: 'LIVE',
      created_date: isoDaysAgo(21),
      updated_date: isoDaysAgo(21),
    },
  ];
}
