const reasonPolicyMeta = {
  'Damage in Handling': {
    bucket: 'Reorder affecting',
    helper: 'Counts toward stock-loss review and may influence replenishment planning.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    reorderBehavior: 'Included in reorder review',
    approvalPath: 'Manager review',
    reviewNote: 'Operational loss should be reviewed before stock is posted.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when product was damaged during handling, transfer, or storage.',
  },
  'Theft/Shrink': {
    bucket: 'Reorder affecting',
    helper: 'Counts toward shrink review and may influence replenishment planning.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    reorderBehavior: 'Included in reorder review',
    approvalPath: 'Manager review',
    reviewNote: 'Higher-sensitivity stock loss should stay under stronger review.',
    catalogStatus: 'Watchlist',
    captureGuidance: 'Use when unexplained loss or suspected theft needs to be recorded.',
  },
  'Production Use': {
    bucket: 'Reorder affecting',
    helper: 'Counts toward operational consumption and planning visibility.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    reorderBehavior: 'Included in reorder review',
    approvalPath: 'Standard review',
    reviewNote: 'Can follow the normal wastage approval flow.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when inventory is consumed operationally and should remain visible to planning.',
  },
  'Sampling/Promos': {
    bucket: 'Reorder affecting',
    helper: 'Counts toward promotional drawdown review and planning visibility.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    reorderBehavior: 'Included in reorder review',
    approvalPath: 'Standard review',
    reviewNote: 'Promo-linked drawdown can use the normal manager workflow.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when stock is intentionally consumed for demos, promos, or sampling.',
  },
  Spillage: {
    bucket: 'Reorder affecting',
    helper: 'Counts toward stock-loss review and may influence replenishment planning.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    reorderBehavior: 'Included in reorder review',
    approvalPath: 'Standard review',
    reviewNote: 'Still affects replenishment visibility even when operationally routine.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when product is lost through spills, leaks, or breakage during use.',
  },
  'Expired/Out of Date': {
    bucket: 'Report only',
    helper: 'Tracked for reporting, but excluded from reorder demand logic.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    impactTone: 'text-slate-700',
    reorderBehavior: 'Excluded from reorder logic',
    approvalPath: 'Manager review',
    reviewNote: 'Expiry should stay visible for reporting and operational follow-up.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when stock is unsellable due to age, date control, or expiry.',
  },
  'Spoiled/Rotten': {
    bucket: 'Report only',
    helper: 'Tracked for reporting, but excluded from reorder demand logic.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    impactTone: 'text-slate-700',
    reorderBehavior: 'Excluded from reorder logic',
    approvalPath: 'Manager review',
    reviewNote: 'Quality-based loss stays reportable without inflating demand.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when stock quality has degraded and it should not count as demand.',
  },
  'Over-ordering': {
    bucket: 'Report only',
    helper: 'Tracked for review, but excluded from reorder demand logic.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    impactTone: 'text-slate-700',
    reorderBehavior: 'Excluded from reorder logic',
    approvalPath: 'Manager review',
    reviewNote: 'Review for planning lessons, not replenishment demand.',
    catalogStatus: 'Watchlist',
    captureGuidance: 'Use when excess buying or overstock led to the loss.',
  },
  'Supplier Fault (Credited/Returned)': {
    bucket: 'Report only',
    helper: 'Tracked for review, but excluded from reorder demand logic.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    impactTone: 'text-slate-700',
    reorderBehavior: 'Excluded from reorder logic',
    approvalPath: 'Standard review',
    reviewNote: 'Keep reportable for vendor follow-up without affecting replenishment demand.',
    catalogStatus: 'Active',
    captureGuidance: 'Use when the supplier owns the issue and stock is credited or returned.',
  },
};

const defaultPolicyMeta = {
  bucket: 'Needs review',
  helper: 'This reason has not been classified yet.',
  chipClass: 'bg-muted text-muted-foreground border border-border',
  impactTone: 'text-muted-foreground',
  reorderBehavior: 'Needs policy decision',
  approvalPath: 'Needs review',
  reviewNote: 'Reason governance has not been assigned yet.',
  catalogStatus: 'Watchlist',
  captureGuidance: 'Classify this reason before relying on it operationally.',
};

const barcodeCatalog = {
  '9351000001111': { sku: 'CHM-001', itemName: 'Premium Detergent 20L', mappingStatus: 'Active', captureMode: 'Barcode to SKU', updatedAt: '30 Mar 2026, 18:20', locationHint: 'Main Store default mapping', notes: 'Primary scanner mapping for detergent bulk stock.' },
  '9351000002228': { sku: 'PKG-003', itemName: 'Garment Tag Roll', mappingStatus: 'Active', captureMode: 'Barcode to SKU', updatedAt: '30 Mar 2026, 18:14', locationHint: 'Shared packaging item', notes: 'Used by receiving and wastage capture.' },
  '9351000003335': { sku: 'CHM-005', itemName: 'Bleach 5L', mappingStatus: 'Needs Review', captureMode: 'Barcode to SKU', updatedAt: '29 Mar 2026, 16:40', locationHint: 'Branch A observed mismatch risk', notes: 'Prototype placeholder for mappings needing manager verification.' },
  '9351000004442': { sku: 'SAFE-021', itemName: 'Disposable Gloves', mappingStatus: 'Active', captureMode: 'Barcode to SKU', updatedAt: '30 Mar 2026, 17:55', locationHint: 'Main Store default mapping', notes: 'Shared consumable with stable barcode mapping.' },
  '9351000005559': { sku: 'CHEM-009', itemName: 'Stain Remover 2L', mappingStatus: 'Active', captureMode: 'Barcode to SKU', updatedAt: '30 Mar 2026, 18:02', locationHint: 'Branch A observed mapping', notes: 'Seen in a rejected scanner-originated wastage event.' },
  '9351000006666': { sku: 'PKG-011', itemName: 'Laundry Bag Large', mappingStatus: 'Active', captureMode: 'Barcode to SKU', updatedAt: '30 Mar 2026, 17:48', locationHint: 'Main Store default mapping', notes: 'Supports high-volume promo and drawdown capture.' },
};

const unresolvedScanQueue = [
  {
    id: 'SCAN-001',
    rawValue: '9351000099999',
    location: 'Main Store',
    recordedAt: '30 Mar 2026, 20:21',
    operator: 'K. Flores',
    helper: 'Scanner captured a code that is not yet in the mapping catalog. Manager review should decide whether this is a new barcode or operator error.',
  },
  {
    id: 'SCAN-002',
    rawValue: 'PKG011-ALT',
    location: 'Branch A',
    recordedAt: '30 Mar 2026, 19:46',
    operator: 'M. Rivera',
    helper: 'Alternate vendor code was entered through handheld scan. Prototype keeps this in a review queue until a formal mapping exists.',
  },
];

const initialRows = [
  {
    id: 'WE-2026-001',
    occurredAt: '29 Mar 2026, 09:20',
    recordedAt: '29 Mar 2026, 09:22',
    location: 'Main Store',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 2,
    reason: 'Spillage',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'A. Manager',
    notes: 'Leaked during transfer.',
    currentOnHand: 18,
    activeAlert: true,
  },
  {
    id: 'WE-2026-002',
    occurredAt: '29 Mar 2026, 08:05',
    recordedAt: '29 Mar 2026, 08:09',
    location: 'Main Store',
    sku: 'PKG-003',
    itemName: 'Garment Tag Roll',
    qty: 1,
    reason: 'Supplier Fault (Credited/Returned)',
    source: 'ADMIN',
    status: 'APPROVED',
    recordedBy: 'S. Cruz',
    notes: 'Outer wrap torn during unloading.',
    currentOnHand: 57,
    activeAlert: false,
  },
  {
    id: 'WE-2026-003',
    occurredAt: '28 Mar 2026, 17:45',
    recordedAt: '28 Mar 2026, 17:52',
    location: 'Branch A',
    sku: 'CHM-005',
    itemName: 'Bleach 5L',
    qty: 4,
    reason: 'Expired/Out of Date',
    source: 'IMPORT',
    status: 'DRAFT',
    recordedBy: 'R. Santos',
    notes: 'Pending supervisor review.',
    currentOnHand: 24,
    activeAlert: false,
  },
  {
    id: 'WE-2026-004',
    occurredAt: '28 Mar 2026, 15:10',
    recordedAt: '28 Mar 2026, 15:16',
    location: 'Main Store',
    sku: 'SAFE-021',
    itemName: 'Disposable Gloves',
    qty: 12,
    reason: 'Production Use',
    source: 'POS',
    status: 'REVERSED',
    recordedBy: 'M. Lopez',
    notes: 'Reversed after duplicate count.',
    currentOnHand: 320,
    activeAlert: false,
  },
  {
    id: 'WE-2026-005',
    occurredAt: '28 Mar 2026, 11:28',
    recordedAt: '28 Mar 2026, 11:30',
    location: 'Branch A',
    sku: 'CHEM-009',
    itemName: 'Stain Remover 2L',
    qty: 3,
    reason: 'Damage in Handling',
    source: 'SCANNER',
    status: 'REJECTED',
    recordedBy: 'L. David',
    notes: 'Rejected due to incorrect item selection.',
    currentOnHand: 41,
    activeAlert: false,
    scanValue: '9351000005559',
    scanResolution: 'Resolved from barcode 9351000005559',
  },
  {
    id: 'WE-2026-006',
    occurredAt: '27 Mar 2026, 18:40',
    recordedAt: '27 Mar 2026, 18:46',
    location: 'Main Store',
    sku: 'PKG-011',
    itemName: 'Laundry Bag Large',
    qty: 22,
    reason: 'Sampling/Promos',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'J. Reyes',
    notes: 'Promo bundle drawdown awaiting approval.',
    currentOnHand: 260,
    activeAlert: true,
  },
];

const alertRules = [
  {
    id: 'ALR-01',
    name: 'High single-event quantity',
    scope: 'Per event',
    threshold: '10+ units',
    window: 'Immediate',
    severity: 'High',
  },
  {
    id: 'ALR-02',
    name: 'Repeat loss on same SKU',
    scope: 'Per SKU',
    threshold: '2+ reviewed events',
    window: '7 days',
    severity: 'Medium',
  },
  {
    id: 'ALR-03',
    name: 'Reorder-affecting surge',
    scope: 'Per location',
    threshold: '20+ units',
    window: '7 days',
    severity: 'High',
  },
];

export const statusStyle = {
  DRAFT: 'bg-muted text-muted-foreground border border-border',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  REVERSED: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export const sourceOptions = ['ADMIN', 'SCANNER', 'POS', 'IMPORT'];
export const captureModes = ['SCANNER', 'MANUAL'];
export const reasonOptions = Object.keys(reasonPolicyMeta);

let wastageRows = initialRows.map((row) => ({ ...row }));

export function getWastageRows() {
  return wastageRows.map((row) => ({ ...row }));
}

export function getReasonPolicy(reason) {
  return reasonPolicyMeta[reason] || defaultPolicyMeta;
}

export function getReasonGovernanceRows() {
  return Object.entries(reasonPolicyMeta).map(([reason, meta]) => ({ reason, ...meta }));
}

export function getEventById(id) {
  return wastageRows.find((row) => row.id === id) || null;
}

export function getScannerCatalog() {
  return Object.entries(barcodeCatalog).map(([barcode, value]) => ({ barcode, ...value }));
}

export function getBarcodeMappings() {
  return getScannerCatalog();
}

export function getUnresolvedScans() {
  return unresolvedScanQueue.map((scan) => ({ ...scan }));
}

export function resolveScannedItem(scanValue) {
  const raw = String(scanValue || '').trim();
  if (!raw) return { status: 'empty' };

  const normalized = raw.toUpperCase();
  const barcodeMatch = barcodeCatalog[raw] || barcodeCatalog[normalized];
  if (barcodeMatch) {
    const rowMatch = wastageRows.find((row) => row.sku === barcodeMatch.sku) || {};
    return {
      status: 'resolved',
      resolutionType: 'BARCODE',
      scanValue: raw,
      sku: barcodeMatch.sku,
      itemName: barcodeMatch.itemName,
      location: rowMatch.location || 'Main Store',
      currentOnHand: rowMatch.currentOnHand ?? '—',
      activeAlert: Boolean(rowMatch.activeAlert),
      helper: `Barcode matched ${barcodeMatch.sku}.`,
    };
  }

  const skuMatch = wastageRows.find((row) => row.sku.toUpperCase() === normalized);
  if (skuMatch) {
    return {
      status: 'resolved',
      resolutionType: 'SKU',
      scanValue: raw,
      sku: skuMatch.sku,
      itemName: skuMatch.itemName,
      location: skuMatch.location,
      currentOnHand: skuMatch.currentOnHand,
      activeAlert: Boolean(skuMatch.activeAlert),
      helper: `Scan matched SKU ${skuMatch.sku}.`,
    };
  }

  return {
    status: 'unresolved',
    scanValue: raw,
    helper: 'No match found. Enter SKU manually.',
  };
}

export function getKpiSummary(rows = wastageRows) {
  const drafts = rows.filter((row) => row.status === 'DRAFT').length;
  const submitted = rows.filter((row) => row.status === 'SUBMITTED').length;
  const approvedEvents = rows.filter((row) => row.status === 'APPROVED').length;
  const approvedQty = rows
    .filter((row) => row.status === 'APPROVED')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
  return { drafts, submitted, approvedEvents, approvedQty };
}

export function getGovernanceSummary() {
  const reasonRows = getReasonGovernanceRows();
  const scannerCatalog = getScannerCatalog();
  const unresolved = getUnresolvedScans();

  return {
    totalReasons: reasonRows.length,
    reorderAffecting: reasonRows.filter((row) => row.bucket === 'Reorder affecting').length,
    reportOnly: reasonRows.filter((row) => row.bucket === 'Report only').length,
    managerReview: reasonRows.filter((row) => row.approvalPath === 'Manager review').length,
    mappedBarcodes: scannerCatalog.length,
    scannerReadySkus: new Set(scannerCatalog.filter((row) => row.mappingStatus === 'Active').map((row) => row.sku)).size,
    manualFallbackCount: unresolved.length + 1,
  };
}

export function getAlertRules() {
  return alertRules.map((rule) => ({ ...rule }));
}

export function getAlertBreaches(rows = wastageRows) {
  const breaches = [];

  rows
    .filter((row) => ['SUBMITTED', 'APPROVED'].includes(row.status) && Number(row.qty || 0) >= 10)
    .forEach((row) => {
      breaches.push({
        id: `BR-${row.id}-QTY`,
        severity: 'High',
        label: 'High single-event quantity',
        message: `${row.id} recorded ${row.qty} units for ${row.itemName}.`,
        scope: `${row.location} · ${row.sku}`,
      });
    });

  const reviewedRows = rows.filter((row) => ['SUBMITTED', 'APPROVED'].includes(row.status));
  const bySku = reviewedRows.reduce((acc, row) => {
    acc[row.sku] = acc[row.sku] || [];
    acc[row.sku].push(row);
    return acc;
  }, {});

  Object.entries(bySku).forEach(([sku, skuRows]) => {
    if (skuRows.length >= 2) {
      breaches.push({
        id: `BR-${sku}-REPEAT`,
        severity: 'Medium',
        label: 'Repeat loss on same SKU',
        message: `${sku} appears in ${skuRows.length} reviewed wastage events.`,
        scope: `${skuRows[0].itemName} · ${sku}`,
      });
    }
  });

  const reorderRows = reviewedRows.filter((row) => getReasonPolicy(row.reason).bucket === 'Reorder affecting');
  const byLocation = reorderRows.reduce((acc, row) => {
    acc[row.location] = acc[row.location] || 0;
    acc[row.location] += Number(row.qty || 0);
    return acc;
  }, {});

  Object.entries(byLocation).forEach(([location, totalQty]) => {
    if (totalQty >= 20) {
      breaches.push({
        id: `BR-${location}-SURGE`,
        severity: 'High',
        label: 'Reorder-affecting surge',
        message: `${location} has ${totalQty} units of reorder-affecting waste in reviewed events.`,
        scope: location,
      });
    }
  });

  return breaches;
}

export function getWorkflowSteps(status) {
  return [
    { key: 'created', label: 'Created', done: true },
    { key: 'submitted', label: 'Submitted', done: ['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(status) },
    { key: 'approved', label: 'Approved', done: status === 'APPROVED' },
    { key: 'rejected', label: 'Rejected', done: status === 'REJECTED' },
    { key: 'reversed', label: 'Reversed', done: status === 'REVERSED' },
  ];
}

function nextEventId() {
  const maxNumber = wastageRows.reduce((max, row) => {
    const match = row.id.match(/(\d+)$/);
    const current = match ? Number(match[1]) : 0;
    return Math.max(max, current);
  }, 0);
  return `WE-2026-${String(maxNumber + 1).padStart(3, '0')}`;
}

export function saveDraftEvent(payload) {
  const id = nextEventId();
  const recordedAt = payload.recordedAt || '30 Mar 2026, 21:05';
  wastageRows = [
    {
      id,
      recordedAt,
      recordedBy: payload.recordedBy || 'Current User',
      activeAlert: Boolean(payload.activeAlert),
      status: 'DRAFT',
      ...payload,
    },
    ...wastageRows,
  ];
  return id;
}

export function createSubmittedEvent(payload) {
  const id = nextEventId();
  const recordedAt = payload.recordedAt || '30 Mar 2026, 21:05';
  wastageRows = [
    {
      id,
      recordedAt,
      recordedBy: payload.recordedBy || 'Current User',
      activeAlert: Boolean(payload.activeAlert),
      status: 'SUBMITTED',
      ...payload,
    },
    ...wastageRows,
  ];
  return id;
}

export function updateEvent(id, patch) {
  wastageRows = wastageRows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

export function appendEventNote(id, note, nextStatus = null) {
  wastageRows = wastageRows.map((row) => {
    if (row.id !== id) return row;
    return {
      ...row,
      status: nextStatus || row.status,
      notes: note ? `${row.notes}${row.notes ? ' ' : ''}${note}` : row.notes,
    };
  });
}
