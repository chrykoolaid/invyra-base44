import { envFilter } from '@/lib/envFilter';

const ACTIVE_FILL_TASK_STATUSES = new Set(['OPEN', 'ASSIGNED']);
const PROMOTABLE_RISKS = new Set(['Critical', 'High', 'Medium']);
const PROMOTABLE_FLAGS = new Set(['Critical', 'Watch']);

const parseTaskNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value) => String(value ?? '').trim();

export const normalizeDaysLeft = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isActiveFillTask = (task) => ACTIVE_FILL_TASK_STATUSES.has(task?.status || '');

export const isGapScanFillTask = (task) =>
  task?.source === 'GAP_SCAN' || !!task?.created_from_scan || !!task?.source_gap_scan_sku;

export const getRowFillTaskLocationId = (row) => normalizeText(
  row?.location_id ||
  row?.locationId ||
  row?.shelf_location_id ||
  row?.shelfLocationId ||
  ''
);

const getTaskFillTaskLocationId = (task) => normalizeText(
  task?.location_id ||
  task?.locationId ||
  task?.shelf_location_id ||
  task?.shelfLocationId ||
  ''
);

export const getFillTaskIdentityKey = (row) =>
  `${normalizeText(row?.sku)}::${getRowFillTaskLocationId(row) || 'NO_LOCATION'}`;

export const isFillTaskEligible = (row) => {
  const systemStock = parseTaskNumber(row?.systemStock ?? row?.system_stock ?? row?.onHand, null);
  const daysLeft = normalizeDaysLeft(row?.daysLeft ?? row?.days_left);

  return (
    PROMOTABLE_FLAGS.has(row?.flag) ||
    PROMOTABLE_RISKS.has(row?.risk) ||
    systemStock === 0 ||
    (daysLeft != null && daysLeft <= 14)
  );
};

export const hasOpenGapScanFillTaskForRow = (row, tasks = []) => {
  const rowSku = normalizeText(row?.sku);
  const rowLocation = getRowFillTaskLocationId(row);
  if (!rowSku) return false;

  return tasks.some(task => {
    if (!isActiveFillTask(task) || !isGapScanFillTask(task)) return false;

    const taskSku = normalizeText(task.sku || task.source_gap_scan_sku);
    if (taskSku !== rowSku) return false;

    const taskLocation = getTaskFillTaskLocationId(task);
    if (!rowLocation || !taskLocation) return true;
    return taskLocation === rowLocation;
  });
};

export const getFillTaskPriority = (row) => {
  if (row?.risk === 'Critical' || row?.flag === 'Critical') return 'Critical';
  if (row?.risk === 'High') return 'High';
  if (row?.risk === 'Medium' || row?.flag === 'Watch') return 'Medium';
  return 'Low';
};

export const buildGapScanFillTaskPayload = ({ row, user, overrides = {} }) => {
  const suggestedOrderQty = parseTaskNumber(row?.suggested ?? row?.suggested_order_qty, 0);
  const createdAt = new Date().toISOString();
  const locationId = normalizeText(
    overrides.location_id ||
    overrides.shelf_location_id ||
    row?.location_id ||
    row?.locationId ||
    row?.shelf_location_id ||
    ''
  );
  const locationName = normalizeText(
    overrides.location_name ||
    overrides.shelf_location_name ||
    row?.location_name ||
    row?.locationName ||
    row?.shelf_location_name ||
    ''
  );

  return {
    ...envFilter(),
    item_id: row?.item_id || row?.itemId || null,
    sku: row?.sku,
    item_name: row?.item_name || row?.name,
    system_stock: parseTaskNumber(row?.systemStock ?? row?.system_stock ?? row?.onHand, 0),
    avg_use_per_day: parseTaskNumber(row?.avgUse ?? row?.avg_use_per_day, 0),
    days_left: normalizeDaysLeft(row?.daysLeft ?? row?.days_left),
    risk: row?.risk || 'None',
    flag: row?.flag || 'OK',
    suggested_order_qty: suggestedOrderQty,
    source: 'GAP_SCAN',
    status: 'OPEN',
    created_from_scan: true,
    created_at: createdAt,
    created_by: user?.email || user?.full_name || user?.id || '',
    location_id: locationId || null,
    location_name: locationName || null,
    qty_requested: suggestedOrderQty > 0 ? suggestedOrderQty : null,
    source_gap_scan_sku: row?.sku,
    priority: getFillTaskPriority(row),
    notes: 'Created from Gap Scan manual promotion. No StockMovement posted.',
    ...overrides,
  };
};
