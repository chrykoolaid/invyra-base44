const reasonPolicyMeta = {
  'Damage in Handling': {
    effect: 'Reorder affecting',
    helper: 'Included in inventory intelligence demand and wastage signals.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    stockTone: 'text-foreground',
  },
  'Theft/Shrink': {
    effect: 'Reorder affecting',
    helper: 'Included in shrink and replenishment review signals.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    stockTone: 'text-foreground',
  },
  'Production Use': {
    effect: 'Reorder affecting',
    helper: 'Counts toward operational consumption and planning visibility.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    stockTone: 'text-foreground',
  },
  'Sampling/Promos': {
    effect: 'Reorder affecting',
    helper: 'Counts toward promotional drawdown review and future planning.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    stockTone: 'text-foreground',
  },
  Spillage: {
    effect: 'Reorder affecting',
    helper: 'Included in stock-loss review and replenishment assessment.',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    impactTone: 'text-amber-800',
    stockTone: 'text-foreground',
  },
  Expired: {
    effect: 'Report only',
    helper: 'Tracked for reporting, but excluded from reorder demand logic.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    impactTone: 'text-slate-700',
    stockTone: 'text-muted-foreground',
  },
  Damaged: {
    effect: 'Report only',
    helper: 'Tracked for review, but not counted as a planning signal in this prototype.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    impactTone: 'text-slate-700',
    stockTone: 'text-muted-foreground',
  },
};

const defaultPolicyMeta = {
  effect: 'Needs review',
  helper: 'Policy classification has not been assigned for this reason yet.',
  chipClass: 'bg-muted text-muted-foreground border border-border',
  impactTone: 'text-muted-foreground',
  stockTone: 'text-muted-foreground',
};

const barcodeCatalog = {
  '9351000001111': { sku: 'CHM-001', itemName: 'Premium Detergent 20L' },
  '9351000002228': { sku: 'PKG-003', itemName: 'Garment Tag Roll' },
  '9351000003335': { sku: 'CHM-005', itemName: 'Bleach 5L' },
  '9351000004442': { sku: 'SAFE-021', itemName: 'Disposable Gloves' },
  '9351000005559': { sku: 'CHEM-009', itemName: 'Stain Remover 2L' },
  '9351000006666': { sku: 'PKG-011', itemName: 'Laundry Bag Large' },
};

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
    reason: 'Damaged',
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
    reason: 'Expired',
    source: 'IMPORT',
    status: 'DRAFT',
    recordedBy: 'R. Santos',
    notes: 'Pending supervisor review.',
    currentOnHand: 24,
    activeAlert: true,
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
    notes: 'Rejected due to incorrect SKU selection.',
    currentOnHand: 41,
    activeAlert: false,
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

export function getEventById(id) {
  return wastageRows.find((row) => row.id === id) || null;
}

export function getScannerCatalog() {
  return Object.entries(barcodeCatalog).map(([barcode, value]) => ({ barcode, ...value }));
}

export function resolveScannedItem(scanValue) {
  const raw = String(scanValue || '').trim();
  if (!raw) {
    return { status: 'empty' };
  }

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
    helper: 'No barcode or SKU match found. Resolve the item manually before submit.',
  };
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
  if (payload.id) {
    updateEvent(payload.id, { ...payload, status: 'DRAFT' });
    return payload.id;
  }

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
  if (payload.id) {
    updateEvent(payload.id, { ...payload, status: 'SUBMITTED' });
    return payload.id;
  }

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
