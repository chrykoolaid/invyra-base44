const NOW_ISO = '2026-03-31T13:00:00Z';

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
  helper: 'This reason has not been classified yet and should be reviewed before posting.',
  chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
  impactTone: 'text-slate-700',
  reorderBehavior: 'Needs governance review',
  approvalPath: 'Manager review',
  reviewNote: 'This reason should be checked before approval.',
  catalogStatus: 'Draft',
  captureGuidance: 'Use only when a governed reason is not yet available.',
};

const barcodeCatalog = {
  '9351000005559': { sku: 'CHEM-009', itemName: 'Stain Remover 2L', mappingStatus: 'Active' },
  '9351000007771': { sku: 'CHM-001', itemName: 'Premium Detergent 20L', mappingStatus: 'Active' },
  '9351000008884': { sku: 'PKG-011', itemName: 'Laundry Bag Large', mappingStatus: 'Active' },
  '9351000009997': { sku: 'SAFE-021', itemName: 'Disposable Gloves', mappingStatus: 'Active' },
};

const unresolvedScanQueue = [
  {
    id: 'SCAN-01',
    scannedAt: '31 Mar 2026, 08:22',
    scanValue: '8800155522331',
    suggestedAction: 'Match to SKU before submission',
    status: 'Needs manual follow-up',
  },
  {
    id: 'SCAN-02',
    scannedAt: '31 Mar 2026, 12:05',
    scanValue: 'CHEM-NEW-44',
    suggestedAction: 'Confirm if this is a new barcode or a manual SKU entry',
    status: 'Pending review',
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

const sourcePostureMeta = {
  ADMIN: {
    label: 'Manual / admin capture',
    helper: 'Created directly by a user in the wastage workflow. Best for calm, deliberate review.',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
  SCANNER: {
    label: 'Scanner-assisted capture',
    helper: 'Item identity came through a scan flow. Keep scanner resolution visible so mismatches can be stopped before posting.',
    chipClass: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  POS: {
    label: 'POS-originated signal',
    helper: 'Originated from a POS-style operational flow. Keep it visible as source-aware wastage, not just a manual note.',
    chipClass: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
  IMPORT: {
    label: 'Import-originated capture',
    helper: 'Came from an external import path. These records often need a little extra review before submission.',
    chipClass: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
};

const defaultSourcePosture = {
  label: 'Unknown source',
  helper: 'This source type is not governed yet and should be reviewed before posting.',
  chipClass: 'bg-slate-100 text-slate-700 border border-slate-200',
};

function formatDisplayDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Manila',
  }).format(date).replace(',', ',');
}

function parseIso(value) {
  if (!value) return Date.parse(NOW_ISO);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.parse(NOW_ISO) : parsed;
}

function sortByIsoDesc(items, key = 'tsIso') {
  return [...items].sort((a, b) => parseIso(b[key]) - parseIso(a[key]));
}

function getLastAction(event) {
  return sortByIsoDesc(event.auditTrail || [])[0] || null;
}

function buildMovement({
  id,
  tsIso,
  location,
  sku,
  delta,
  reasonCode,
  refType,
  refId,
  actor,
  note,
  postOnHand,
}) {
  return {
    id,
    tsIso,
    ts: formatDisplayDate(tsIso),
    location,
    sku,
    delta,
    reasonCode,
    refType,
    refId,
    actor,
    note,
    postOnHand,
  };
}

function buildAudit({ id, tsIso, action, actor, details }) {
  return {
    id,
    tsIso,
    ts: formatDisplayDate(tsIso),
    action,
    actor,
    details,
  };
}

function createEvent(seed) {
  const event = {
    id: seed.id,
    occurredAtIso: seed.occurredAtIso,
    occurredAt: formatDisplayDate(seed.occurredAtIso),
    recordedAtIso: seed.recordedAtIso,
    recordedAt: formatDisplayDate(seed.recordedAtIso),
    location: seed.location,
    sku: seed.sku,
    itemName: seed.itemName,
    qty: seed.qty,
    reason: seed.reason,
    source: seed.source,
    status: seed.status,
    recordedBy: seed.recordedBy,
    notes: seed.notes || '',
    currentOnHand: seed.currentOnHand,
    onHandBefore: seed.onHandBefore,
    onHandAfterApproval: seed.onHandAfterApproval,
    postOnHandCurrent: seed.postOnHandCurrent,
    activeAlert: false,
    scanValue: seed.scanValue || '',
    scanResolution: seed.scanResolution || '',
    submittedAtIso: seed.submittedAtIso || '',
    submittedAt: seed.submittedAtIso ? formatDisplayDate(seed.submittedAtIso) : '',
    submittedBy: seed.submittedBy || '',
    approvedAtIso: seed.approvedAtIso || '',
    approvedAt: seed.approvedAtIso ? formatDisplayDate(seed.approvedAtIso) : '',
    approvedBy: seed.approvedBy || '',
    rejectedAtIso: seed.rejectedAtIso || '',
    rejectedAt: seed.rejectedAtIso ? formatDisplayDate(seed.rejectedAtIso) : '',
    rejectedBy: seed.rejectedBy || '',
    rejectionReason: seed.rejectionReason || '',
    reversedAtIso: seed.reversedAtIso || '',
    reversedAt: seed.reversedAtIso ? formatDisplayDate(seed.reversedAtIso) : '',
    reversedBy: seed.reversedBy || '',
    reversalReason: seed.reversalReason || '',
    movementRows: (seed.movementRows || []).map((row) => ({ ...row })),
    auditTrail: (seed.auditTrail || []).map((row) => ({ ...row })),
    detailContractStatus: seed.detailContractStatus || 'prototype_enriched',
  };

  event.movementState =
    event.status === 'APPROVED'
      ? 'Movement posted'
      : event.status === 'REVERSED'
        ? 'Posted and reversed'
        : event.status === 'SUBMITTED'
          ? 'Waiting for approval posting'
          : 'No movement posted';
  event.lastAction = getLastAction(event);
  return event;
}

let wastageRows = [
  createEvent({
    id: 'WE-2026-001',
    occurredAtIso: '2026-03-31T00:20:00Z',
    recordedAtIso: '2026-03-31T00:22:00Z',
    location: 'Main Store',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 2,
    reason: 'Spillage',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'A. Manager',
    notes: 'Leaked during transfer. Pending final review.',
    currentOnHand: 47,
    onHandBefore: 47,
    onHandAfterApproval: 45,
    submittedAtIso: '2026-03-31T00:28:00Z',
    submittedBy: 'A. Manager',
    auditTrail: [
      buildAudit({ id: 'AUD-001-A', tsIso: '2026-03-31T00:22:00Z', action: 'WASTAGE_CREATED', actor: 'A. Manager', details: 'Draft event recorded.' }),
      buildAudit({ id: 'AUD-001-B', tsIso: '2026-03-31T00:28:00Z', action: 'WASTAGE_SUBMITTED', actor: 'A. Manager', details: 'Submitted for approval.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-002',
    occurredAtIso: '2026-03-30T23:05:00Z',
    recordedAtIso: '2026-03-30T23:09:00Z',
    location: 'Main Store',
    sku: 'PKG-003',
    itemName: 'Garment Tag Roll',
    qty: 11,
    reason: 'Damage in Handling',
    source: 'ADMIN',
    status: 'APPROVED',
    recordedBy: 'S. Cruz',
    notes: 'Crushed during backroom handling.',
    currentOnHand: 46,
    onHandBefore: 57,
    onHandAfterApproval: 46,
    postOnHandCurrent: 46,
    submittedAtIso: '2026-03-30T23:18:00Z',
    submittedBy: 'S. Cruz',
    approvedAtIso: '2026-03-30T23:35:00Z',
    approvedBy: 'M. Lopez',
    movementRows: [
      buildMovement({
        id: 'MOVE-002-A',
        tsIso: '2026-03-30T23:35:00Z',
        location: 'Main Store',
        sku: 'PKG-003',
        delta: -11,
        reasonCode: 'Damage in Handling',
        refType: 'WASTAGE',
        refId: 'WE-2026-002',
        actor: 'M. Lopez',
        note: 'Crushed during backroom handling.',
        postOnHand: 46,
      }),
    ],
    auditTrail: [
      buildAudit({ id: 'AUD-002-A', tsIso: '2026-03-30T23:09:00Z', action: 'WASTAGE_CREATED', actor: 'S. Cruz', details: 'Draft event recorded.' }),
      buildAudit({ id: 'AUD-002-B', tsIso: '2026-03-30T23:18:00Z', action: 'WASTAGE_SUBMITTED', actor: 'S. Cruz', details: 'Submitted for approval.' }),
      buildAudit({ id: 'AUD-002-C', tsIso: '2026-03-30T23:35:00Z', action: 'WASTAGE_APPROVED', actor: 'M. Lopez', details: 'Stock movement posted. Before: 57 · After: 46.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-003',
    occurredAtIso: '2026-03-30T09:45:00Z',
    recordedAtIso: '2026-03-30T09:52:00Z',
    location: 'Branch A',
    sku: 'CHM-005',
    itemName: 'Bleach 5L',
    qty: 4,
    reason: 'Expired/Out of Date',
    source: 'IMPORT',
    status: 'DRAFT',
    recordedBy: 'R. Santos',
    notes: 'Imported count needs supervisor confirmation before review.',
    currentOnHand: 24,
    onHandBefore: 24,
    onHandAfterApproval: 20,
    auditTrail: [
      buildAudit({ id: 'AUD-003-A', tsIso: '2026-03-30T09:52:00Z', action: 'WASTAGE_CREATED', actor: 'R. Santos', details: 'Draft event recorded from import.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-004',
    occurredAtIso: '2026-03-29T23:10:00Z',
    recordedAtIso: '2026-03-29T23:16:00Z',
    location: 'Main Store',
    sku: 'SAFE-021',
    itemName: 'Disposable Gloves',
    qty: 12,
    reason: 'Production Use',
    source: 'POS',
    status: 'REVERSED',
    recordedBy: 'M. Lopez',
    notes: 'Duplicate count found after approval. Reversed to restore stock.',
    currentOnHand: 320,
    onHandBefore: 320,
    onHandAfterApproval: 308,
    postOnHandCurrent: 320,
    submittedAtIso: '2026-03-29T23:24:00Z',
    submittedBy: 'M. Lopez',
    approvedAtIso: '2026-03-29T23:41:00Z',
    approvedBy: 'J. Reyes',
    reversedAtIso: '2026-03-30T00:20:00Z',
    reversedBy: 'J. Reyes',
    reversalReason: 'Duplicate production-use count detected during reconciliation.',
    movementRows: [
      buildMovement({
        id: 'MOVE-004-A',
        tsIso: '2026-03-29T23:41:00Z',
        location: 'Main Store',
        sku: 'SAFE-021',
        delta: -12,
        reasonCode: 'Production Use',
        refType: 'WASTAGE',
        refId: 'WE-2026-004',
        actor: 'J. Reyes',
        note: 'Original approval posting.',
        postOnHand: 308,
      }),
      buildMovement({
        id: 'MOVE-004-B',
        tsIso: '2026-03-30T00:20:00Z',
        location: 'Main Store',
        sku: 'SAFE-021',
        delta: 12,
        reasonCode: 'Production Use',
        refType: 'WASTAGE_REVERSAL',
        refId: 'WE-2026-004',
        actor: 'J. Reyes',
        note: 'Duplicate production-use count detected during reconciliation.',
        postOnHand: 320,
      }),
    ],
    auditTrail: [
      buildAudit({ id: 'AUD-004-A', tsIso: '2026-03-29T23:16:00Z', action: 'WASTAGE_CREATED', actor: 'M. Lopez', details: 'Draft event recorded.' }),
      buildAudit({ id: 'AUD-004-B', tsIso: '2026-03-29T23:24:00Z', action: 'WASTAGE_SUBMITTED', actor: 'M. Lopez', details: 'Submitted for approval.' }),
      buildAudit({ id: 'AUD-004-C', tsIso: '2026-03-29T23:41:00Z', action: 'WASTAGE_APPROVED', actor: 'J. Reyes', details: 'Stock movement posted. Before: 320 · After: 308.' }),
      buildAudit({ id: 'AUD-004-D', tsIso: '2026-03-30T00:20:00Z', action: 'WASTAGE_REVERSED', actor: 'J. Reyes', details: 'Reversed movement posted. After reversal: 320.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-005',
    occurredAtIso: '2026-03-29T19:28:00Z',
    recordedAtIso: '2026-03-29T19:30:00Z',
    location: 'Branch A',
    sku: 'CHEM-009',
    itemName: 'Stain Remover 2L',
    qty: 3,
    reason: 'Damage in Handling',
    source: 'SCANNER',
    status: 'REJECTED',
    recordedBy: 'L. David',
    notes: 'Rejected after scanner matched the wrong item family.',
    currentOnHand: 41,
    onHandBefore: 41,
    onHandAfterApproval: 38,
    scanValue: '9351000005559',
    scanResolution: 'Resolved from barcode 9351000005559',
    submittedAtIso: '2026-03-29T19:36:00Z',
    submittedBy: 'L. David',
    rejectedAtIso: '2026-03-29T20:02:00Z',
    rejectedBy: 'A. Manager',
    rejectionReason: 'Wrong item matched during scan capture. Record stopped before stock posting.',
    auditTrail: [
      buildAudit({ id: 'AUD-005-A', tsIso: '2026-03-29T19:30:00Z', action: 'WASTAGE_CREATED', actor: 'L. David', details: 'Draft event recorded from handheld scan.' }),
      buildAudit({ id: 'AUD-005-B', tsIso: '2026-03-29T19:36:00Z', action: 'WASTAGE_SUBMITTED', actor: 'L. David', details: 'Submitted for approval.' }),
      buildAudit({ id: 'AUD-005-C', tsIso: '2026-03-29T20:02:00Z', action: 'WASTAGE_REJECTED', actor: 'A. Manager', details: 'Wrong item matched during scan capture.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-006',
    occurredAtIso: '2026-03-29T10:40:00Z',
    recordedAtIso: '2026-03-29T10:46:00Z',
    location: 'Main Store',
    sku: 'PKG-011',
    itemName: 'Laundry Bag Large',
    qty: 22,
    reason: 'Sampling/Promos',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'J. Reyes',
    notes: 'Promo bundle drawdown awaiting final manager approval.',
    currentOnHand: 260,
    onHandBefore: 260,
    onHandAfterApproval: 238,
    submittedAtIso: '2026-03-29T10:54:00Z',
    submittedBy: 'J. Reyes',
    auditTrail: [
      buildAudit({ id: 'AUD-006-A', tsIso: '2026-03-29T10:46:00Z', action: 'WASTAGE_CREATED', actor: 'J. Reyes', details: 'Draft event recorded.' }),
      buildAudit({ id: 'AUD-006-B', tsIso: '2026-03-29T10:54:00Z', action: 'WASTAGE_SUBMITTED', actor: 'J. Reyes', details: 'Submitted for approval.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-007',
    occurredAtIso: '2026-03-28T22:12:00Z',
    recordedAtIso: '2026-03-28T22:15:00Z',
    location: 'Main Store',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 10,
    reason: 'Production Use',
    source: 'POS',
    status: 'APPROVED',
    recordedBy: 'S. Cruz',
    notes: 'Operational chemical use signed off after reconciliation.',
    currentOnHand: 45,
    onHandBefore: 55,
    onHandAfterApproval: 45,
    postOnHandCurrent: 45,
    submittedAtIso: '2026-03-28T22:22:00Z',
    submittedBy: 'S. Cruz',
    approvedAtIso: '2026-03-28T22:35:00Z',
    approvedBy: 'A. Manager',
    movementRows: [
      buildMovement({
        id: 'MOVE-007-A',
        tsIso: '2026-03-28T22:35:00Z',
        location: 'Main Store',
        sku: 'CHM-001',
        delta: -10,
        reasonCode: 'Production Use',
        refType: 'WASTAGE',
        refId: 'WE-2026-007',
        actor: 'A. Manager',
        note: 'Operational chemical use signed off after reconciliation.',
        postOnHand: 45,
      }),
    ],
    auditTrail: [
      buildAudit({ id: 'AUD-007-A', tsIso: '2026-03-28T22:15:00Z', action: 'WASTAGE_CREATED', actor: 'S. Cruz', details: 'Draft event recorded from POS-linked capture.' }),
      buildAudit({ id: 'AUD-007-B', tsIso: '2026-03-28T22:22:00Z', action: 'WASTAGE_SUBMITTED', actor: 'S. Cruz', details: 'Submitted for approval.' }),
      buildAudit({ id: 'AUD-007-C', tsIso: '2026-03-28T22:35:00Z', action: 'WASTAGE_APPROVED', actor: 'A. Manager', details: 'Stock movement posted. Before: 55 · After: 45.' }),
    ],
  }),
  createEvent({
    id: 'WE-2026-008',
    occurredAtIso: '2026-03-28T07:50:00Z',
    recordedAtIso: '2026-03-28T07:56:00Z',
    location: 'Branch A',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 4,
    reason: 'Spillage',
    source: 'ADMIN',
    status: 'APPROVED',
    recordedBy: 'R. Santos',
    notes: 'Small spill near dosing station.',
    currentOnHand: 33,
    onHandBefore: 37,
    onHandAfterApproval: 33,
    postOnHandCurrent: 33,
    submittedAtIso: '2026-03-28T08:05:00Z',
    submittedBy: 'R. Santos',
    approvedAtIso: '2026-03-28T08:22:00Z',
    approvedBy: 'M. Lopez',
    movementRows: [
      buildMovement({
        id: 'MOVE-008-A',
        tsIso: '2026-03-28T08:22:00Z',
        location: 'Branch A',
        sku: 'CHM-001',
        delta: -4,
        reasonCode: 'Spillage',
        refType: 'WASTAGE',
        refId: 'WE-2026-008',
        actor: 'M. Lopez',
        note: 'Small spill near dosing station.',
        postOnHand: 33,
      }),
    ],
    auditTrail: [
      buildAudit({ id: 'AUD-008-A', tsIso: '2026-03-28T07:56:00Z', action: 'WASTAGE_CREATED', actor: 'R. Santos', details: 'Draft event recorded.' }),
      buildAudit({ id: 'AUD-008-B', tsIso: '2026-03-28T08:05:00Z', action: 'WASTAGE_SUBMITTED', actor: 'R. Santos', details: 'Submitted for approval.' }),
      buildAudit({ id: 'AUD-008-C', tsIso: '2026-03-28T08:22:00Z', action: 'WASTAGE_APPROVED', actor: 'M. Lopez', details: 'Stock movement posted. Before: 37 · After: 33.' }),
    ],
  }),
];

let alertRules = [
  {
    id: 'ALR-01',
    name: 'High single-event quantity',
    ruleType: 'single_qty',
    scope: 'Per approved event',
    scopeLabel: 'Any location · Any SKU',
    thresholdQty: 10,
    windowHours: 24,
    severity: 'HIGH',
    isEnabled: true,
    createdAtIso: '2026-03-28T01:00:00Z',
    createdAt: formatDisplayDate('2026-03-28T01:00:00Z'),
    createdBy: 'A. Manager',
  },
  {
    id: 'ALR-02',
    name: 'Repeat approved loss on same SKU',
    ruleType: 'repeat_sku',
    scope: 'Per approved SKU',
    scopeLabel: 'Any location · Grouped by SKU',
    thresholdCount: 2,
    windowHours: 168,
    severity: 'MEDIUM',
    isEnabled: true,
    createdAtIso: '2026-03-28T01:05:00Z',
    createdAt: formatDisplayDate('2026-03-28T01:05:00Z'),
    createdBy: 'A. Manager',
  },
  {
    id: 'ALR-03',
    name: 'Reorder-affecting surge',
    ruleType: 'reorder_location_qty',
    scope: 'Per location',
    scopeLabel: 'Approved reorder-affecting qty by location',
    thresholdQty: 20,
    windowHours: 168,
    severity: 'HIGH',
    isEnabled: true,
    createdAtIso: '2026-03-28T01:10:00Z',
    createdAt: formatDisplayDate('2026-03-28T01:10:00Z'),
    createdBy: 'A. Manager',
  },
];

let alertInstances = [];
let lastAlertEvaluationIso = '2026-03-31T12:40:00Z';

function nextEventId() {
  const maxNumber = wastageRows.reduce((max, row) => {
    const match = row.id.match(/(\d+)$/);
    const current = match ? Number(match[1]) : 0;
    return Math.max(max, current);
  }, 0);
  return `WE-2026-${String(maxNumber + 1).padStart(3, '0')}`;
}

function nextRuleId() {
  const maxNumber = alertRules.reduce((max, row) => {
    const match = row.id.match(/(\d+)$/);
    const current = match ? Number(match[1]) : 0;
    return Math.max(max, current);
  }, 0);
  return `ALR-${String(maxNumber + 1).padStart(2, '0')}`;
}

function nextAuditId(event) {
  return `AUD-${event.id.split('-').pop()}-${String((event.auditTrail || []).length + 1).padStart(2, '0')}`;
}

function nextMovementId(event) {
  return `MOVE-${event.id.split('-').pop()}-${String((event.movementRows || []).length + 1).padStart(2, '0')}`;
}

function setEvent(eventId, updater) {
  wastageRows = wastageRows.map((row) => {
    if (row.id !== eventId) return row;
    const updated = createEvent(updater({ ...row, movementRows: [...row.movementRows], auditTrail: [...row.auditTrail] }));
    return updated;
  });
}

function approvedRowsWithin(hours) {
  const now = parseIso(NOW_ISO);
  return wastageRows.filter((row) => {
    if (row.status !== 'APPROVED') return false;
    const approvedAt = parseIso(row.approvedAtIso || row.recordedAtIso);
    return now - approvedAt <= hours * 60 * 60 * 1000;
  });
}

function rebuildAlertInstances() {
  const created = [];
  const nowIso = lastAlertEvaluationIso;
  const enabledRules = alertRules.filter((rule) => rule.isEnabled);

  enabledRules.forEach((rule) => {
    const approvedRows = approvedRowsWithin(rule.windowHours);

    if (rule.ruleType === 'single_qty') {
      approvedRows
        .filter((row) => Number(row.qty || 0) >= Number(rule.thresholdQty || 0))
        .forEach((row) => {
          created.push({
            id: `${rule.id}-${row.id}`,
            createdAtIso: nowIso,
            createdAt: formatDisplayDate(nowIso),
            ruleId: rule.id,
            severity: rule.severity,
            status: 'ACTIVE',
            isAcknowledged: false,
            acknowledgedAt: '',
            acknowledgedBy: '',
            scope: `${row.location} · ${row.sku}`,
            message: `${row.id} approved ${row.qty} units for ${row.itemName}.`,
            window: `${rule.windowHours}h`,
            totalQty: row.qty,
            eventId: row.id,
          });
        });
    }

    if (rule.ruleType === 'repeat_sku') {
      const grouped = approvedRows.reduce((acc, row) => {
        acc[row.sku] = acc[row.sku] || [];
        acc[row.sku].push(row);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([sku, rows]) => {
        if (rows.length >= Number(rule.thresholdCount || 0)) {
          created.push({
            id: `${rule.id}-${sku}`,
            createdAtIso: nowIso,
            createdAt: formatDisplayDate(nowIso),
            ruleId: rule.id,
            severity: rule.severity,
            status: 'ACTIVE',
            isAcknowledged: false,
            acknowledgedAt: '',
            acknowledgedBy: '',
            scope: `${sku} · ${rows[0].itemName}`,
            message: `${rows.length} approved wastage events were recorded for ${sku} in the rule window.`,
            window: `${rule.windowHours}h`,
            totalQty: rows.reduce((sum, row) => sum + Number(row.qty || 0), 0),
            eventId: rows[0].id,
          });
        }
      });
    }

    if (rule.ruleType === 'reorder_location_qty') {
      const reorderRows = approvedRows.filter((row) => getReasonPolicy(row.reason).bucket === 'Reorder affecting');
      const grouped = reorderRows.reduce((acc, row) => {
        acc[row.location] = acc[row.location] || [];
        acc[row.location].push(row);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([location, rows]) => {
        const totalQty = rows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
        if (totalQty >= Number(rule.thresholdQty || 0)) {
          created.push({
            id: `${rule.id}-${location.replace(/\s+/g, '_')}`,
            createdAtIso: nowIso,
            createdAt: formatDisplayDate(nowIso),
            ruleId: rule.id,
            severity: rule.severity,
            status: 'ACTIVE',
            isAcknowledged: false,
            acknowledgedAt: '',
            acknowledgedBy: '',
            scope: location,
            message: `${location} accumulated ${totalQty} approved reorder-affecting units in the rule window.`,
            window: `${rule.windowHours}h`,
            totalQty,
            eventId: rows[0].id,
          });
        }
      });
    }
  });

  alertInstances = applyPrototypeAcknowledgementPosture(created);
  wastageRows = wastageRows.map((row) => ({
    ...row,
    activeAlert: alertInstances.some((instance) => instance.status === 'ACTIVE' && instance.eventId === row.id),
    linkedAlertInstances: alertInstances.filter((instance) => instance.eventId === row.id),
  }));
}

rebuildAlertInstances();

export function getWastageRows() {
  return sortByIsoDesc(wastageRows, 'recordedAtIso').map((row) => ({
    ...row,
    lastAction: row.lastAction || getLastAction(row),
    linkedAlertInstances: (row.linkedAlertInstances || []).map((instance) => decorateAlertInstance({ ...instance })),
  }));
}

export function getReasonPolicy(reason) {
  return reasonPolicyMeta[reason] || defaultPolicyMeta;
}

export function getReasonGovernanceRows() {
  return Object.entries(reasonPolicyMeta).map(([reason, meta]) => ({ reason, ...meta }));
}

export function getEventById(id) {
  const row = wastageRows.find((event) => event.id === id);
  return row
    ? {
        ...row,
        movementRows: [...row.movementRows],
        auditTrail: [...row.auditTrail],
        linkedAlertInstances: [...(row.linkedAlertInstances || [])].map((instance) => decorateAlertInstance({ ...instance })),
      }
    : null;
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

export function getSourcePosture(source) {
  return sourcePostureMeta[source] || defaultSourcePosture;
}

export function getMovementLedger(limit = 20) {
  const rows = wastageRows.flatMap((event) =>
    (event.movementRows || []).map((row) => ({
      ...row,
      eventId: event.id,
      eventStatus: event.status,
      itemName: event.itemName,
      location: row.location || event.location,
      source: event.source,
    }))
  );

  return sortByIsoDesc(rows, 'tsIso').slice(0, limit);
}

export function getAuditFeed(limit = 20) {
  const rows = wastageRows.flatMap((event) =>
    (event.auditTrail || []).map((row) => ({
      ...row,
      eventId: event.id,
      eventStatus: event.status,
      sku: event.sku,
      itemName: event.itemName,
      location: event.location,
      source: event.source,
    }))
  );

  return sortByIsoDesc(rows, 'tsIso').slice(0, limit);
}

export function getActionGuards(status) {
  const guardSets = {
    DRAFT: [
      { action: 'Submit draft', allowed: true, helper: 'Only DRAFT can be submitted.' },
      { action: 'Approve', allowed: false, helper: 'Blocked until the event reaches SUBMITTED.' },
      { action: 'Reject', allowed: false, helper: 'Blocked until the event reaches SUBMITTED.' },
      { action: 'Reverse', allowed: false, helper: 'Blocked until the event reaches APPROVED.' },
    ],
    SUBMITTED: [
      { action: 'Submit draft', allowed: false, helper: 'Already submitted.' },
      { action: 'Approve', allowed: true, helper: 'Only SUBMITTED can be approved.' },
      { action: 'Reject', allowed: true, helper: 'Only SUBMITTED can be rejected.' },
      { action: 'Reverse', allowed: false, helper: 'Blocked until approval posts stock movement.' },
    ],
    APPROVED: [
      { action: 'Submit draft', allowed: false, helper: 'Already beyond draft state.' },
      { action: 'Approve', allowed: false, helper: 'Already approved.' },
      { action: 'Reject', allowed: false, helper: 'Reject is only available while SUBMITTED.' },
      { action: 'Reverse', allowed: true, helper: 'Only APPROVED can be reversed.' },
    ],
    REJECTED: [
      { action: 'Submit draft', allowed: false, helper: 'Rejected records stay as stopped workflow history.' },
      { action: 'Approve', allowed: false, helper: 'Rejected records cannot be approved later.' },
      { action: 'Reject', allowed: false, helper: 'Already rejected.' },
      { action: 'Reverse', allowed: false, helper: 'No stock posting happened, so there is nothing to reverse.' },
    ],
    REVERSED: [
      { action: 'Submit draft', allowed: false, helper: 'This record is closed historical proof.' },
      { action: 'Approve', allowed: false, helper: 'Already approved and then reversed.' },
      { action: 'Reject', allowed: false, helper: 'Reject no longer applies after approval.' },
      { action: 'Reverse', allowed: false, helper: 'Already reversed.' },
    ],
  };

  return guardSets[status] || [];
}

export function getReadinessBoard() {
  const liveContracts = [
    { label: 'Create wastage event', state: 'live', helper: 'POST /wastage creates a DRAFT record.' },
    { label: 'Workflow writes', state: 'live', helper: 'Submit, approve, reject, and reverse are already exposed as write actions.' },
    { label: 'Thin event list', state: 'live', helper: 'GET /wastage returns a compact list record, not a full detail payload.' },
    { label: 'KPI report', state: 'live', helper: 'GET /reports/kpis exposes a basic live KPI surface.' },
    { label: 'Alert rule create + evaluate', state: 'live', helper: 'POST /alerts/rules and POST /alerts/evaluate are available.' },
  ];

  const storedContracts = [
    { label: 'Decision metadata read', state: 'stored', helper: 'submitted_at, approved_at/by, rejected_at/by/reason, and reversed_at/by/reason are stored but not yet exposed as a dedicated detail read.' },
    { label: 'Movement ledger read', state: 'stored', helper: 'stock_movements rows already exist with delta, reason_code, ref_type, ref_id, actor, note, and post_on_hand.' },
    { label: 'Audit trail read', state: 'stored', helper: 'wastage_audit_log is written today, but needs a clean read surface.' },
    { label: 'Alert rule / instance list reads', state: 'stored', helper: 'Rules and generated instances exist, but public list endpoints are still needed.' },
    { label: 'Acknowledgement posture', state: 'stored', helper: 'Acknowledgement fields are scaffolded but write support is not yet public.' },
  ];

  return {
    summary: {
      live: liveContracts.length,
      stored: storedContracts.length,
      approvedMovements: getMovementLedger(999).length,
      auditRows: getAuditFeed(999).length,
    },
    liveContracts,
    storedContracts,
  };
}

export function getAlertApiPosture() {
  return [
    { label: 'Create alert rule', state: 'live', helper: 'POST /alerts/rules exists now.' },
    { label: 'Evaluate alerts', state: 'live', helper: 'POST /alerts/evaluate exists now.' },
    { label: 'List rules', state: 'stored', helper: 'Rule rows exist, but a public list read is still needed.' },
    { label: 'List instances', state: 'stored', helper: 'Generated instances exist, but a public list read is still needed.' },
    { label: 'Acknowledge alert', state: 'stored', helper: 'Acknowledgement fields are scaffolded, but the write flow is not yet exposed.' },
  ];
}

export function getEventReadinessRows(event) {
  if (!event) return [];

  return [
    {
      label: 'Public list record',
      state: 'live',
      helper: 'Current API exposes this event as a thin list row with core fields only.',
    },
    {
      label: 'Decision detail payload',
      state: 'stored',
      helper: event.submittedAt || event.approvedAt || event.rejectedAt || event.reversedAt
        ? 'The engine already holds decision timestamps, actors, and reasons. A dedicated detail read would let the UI stop enriching this by hand.'
        : 'The UI is reserved for future decision metadata, even when the event has not progressed yet.',
    },
    {
      label: 'Movement ledger linkage',
      state: event.movementRows?.length ? 'stored' : 'future',
      helper: event.movementRows?.length
        ? 'Movement rows already exist and should eventually be read through a clean ledger contract.'
        : 'No movement rows exist yet because the event has not posted stock movement.',
    },
    {
      label: 'Audit history linkage',
      state: event.auditTrail?.length ? 'stored' : 'future',
      helper: event.auditTrail?.length
        ? 'Audit rows are already written for the visible workflow actions.'
        : 'Audit history will appear as workflow actions occur.',
    },
    {
      label: 'Alert posture',
      state: event.linkedAlertInstances?.length ? 'stored' : 'future',
      helper: event.linkedAlertInstances?.length
        ? 'Linked alert instances exist, but acknowledgement remains prototype-safe until a write endpoint exists.'
        : 'No linked alert instances are attached to this event right now.',
    },
  ];
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
  const pendingApproval = rows.filter((row) => row.status === 'SUBMITTED').length;
  const approvedEvents = rows.filter((row) => row.status === 'APPROVED').length;
  const approvedWasteQty = rows
    .filter((row) => row.status === 'APPROVED')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const activeAlerts = getAlertInstances().filter((row) => row.status === 'ACTIVE').length;
  return { pendingApproval, approvedEvents, approvedWasteQty, activeAlerts };
}

export function getLiveKpiSummary(windowHours = 24) {
  const rows = approvedRowsWithin(windowHours);
  return {
    windowHours,
    windowLabel: `${windowHours}h window`,
    totalWasteEvents: rows.length,
    totalWasteQty: rows.reduce((sum, row) => sum + Number(row.qty || 0), 0),
    totalWasteSkus: new Set(rows.map((row) => row.sku)).size,
  };
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

function matchesWindow(row, windowKey) {
  if (windowKey === 'SNAPSHOT') return true;
  const current = parseIso(NOW_ISO);
  const diffDays = (current - parseIso(row.occurredAtIso || row.recordedAtIso)) / (1000 * 60 * 60 * 24);
  if (windowKey === '7D') return diffDays <= 7;
  return diffDays <= 30;
}

function matchesScope(row, scopeKey) {
  if (scopeKey === 'ALL') return true;
  if (scopeKey === 'APPROVED') return row.status === 'APPROVED';
  return ['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(row.status);
}

function buildReportGroup(groupBy, key, groupedRows) {
  const sample = groupedRows[0];
  const events = groupedRows.length;
  const qty = groupedRows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const latestOccurred = sortByIsoDesc(groupedRows, 'occurredAtIso')[0]?.occurredAt || '—';
  const statusMix = Array.from(new Set(groupedRows.map((row) => row.status))).join(' · ');

  if (groupBy === 'SKU') {
    return {
      key,
      label: sample.sku,
      subLabel: sample.itemName,
      events,
      qty,
      latestOccurred,
      statusMix,
      note: `${sample.location} appears in the latest matching record.`,
    };
  }

  if (groupBy === 'LOCATION') {
    return {
      key,
      label: sample.location,
      subLabel: `${new Set(groupedRows.map((row) => row.sku)).size} SKUs represented`,
      events,
      qty,
      latestOccurred,
      statusMix,
      note: `Top visible reason: ${groupedRows[0]?.reason || '—'}.`,
    };
  }

  const policy = getReasonPolicy(sample.reason);
  return {
    key,
    label: sample.reason,
    subLabel: policy.bucket,
    events,
    qty,
    latestOccurred,
    statusMix,
    note: policy.reorderBehavior,
  };
}

export function getReportingPrototype(rows = wastageRows, options = {}) {
  const { window = '30D', scope = 'REVIEWED', groupBy = 'REASON' } = options;
  const visibleRows = rows.filter((row) => matchesWindow(row, window) && matchesScope(row, scope));

  const summary = {
    visibleEvents: visibleRows.length,
    visibleQty: visibleRows.reduce((sum, row) => sum + Number(row.qty || 0), 0),
    affectedSkus: new Set(visibleRows.map((row) => row.sku)).size,
    topDriverLabel: 'No data',
    topDriverHelper: 'Change the scope or grouping to see a stronger signal.',
  };

  const topReasonEntry = Object.entries(
    visibleRows.reduce((acc, row) => {
      acc[row.reason] = (acc[row.reason] || 0) + Number(row.qty || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  if (topReasonEntry) {
    summary.topDriverLabel = topReasonEntry[0];
    summary.topDriverHelper = `${topReasonEntry[1]} units in the current grouped view.`;
  }

  const keyForRow = (row) => {
    if (groupBy === 'SKU') return row.sku;
    if (groupBy === 'LOCATION') return row.location;
    return row.reason;
  };

  const grouped = visibleRows.reduce((acc, row) => {
    const key = keyForRow(row);
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {});

  const groups = Object.entries(grouped)
    .map(([key, groupedRows]) => buildReportGroup(groupBy, key, groupedRows))
    .sort((a, b) => b.qty - a.qty || b.events - a.events);

  const primaryHeading = groupBy === 'SKU' ? 'SKU' : groupBy === 'LOCATION' ? 'Location' : 'Reason';
  const tableSubtitle =
    groupBy === 'SKU'
      ? 'Prototype grouped view by SKU for calm manager review.'
      : groupBy === 'LOCATION'
        ? 'Prototype grouped view by location for trend scanning.'
        : 'Prototype grouped view by reason for calmer pattern review.';

  return {
    summary,
    groups,
    primaryHeading,
    tableSubtitle,
  };
}

export function getAlertRules() {
  return sortByIsoDesc(alertRules, 'createdAtIso').map((rule) => {
    const linkedInstances = alertInstances.filter((instance) => instance.ruleId === rule.id);

    return {
      ...rule,
      thresholdLabel: rule.thresholdQty ? `${rule.thresholdQty}+ qty` : `${rule.thresholdCount || 0}+ events`,
      linkedInstances: linkedInstances.length,
      linkedAcknowledged: linkedInstances.filter((instance) => instance.isAcknowledged).length,
      linkedActionNeeded: linkedInstances.filter((instance) => !instance.isAcknowledged).length,
      coverageLabel: rule.scopeLabel || rule.scope,
    };
  });
}

export function getAlertInstances() {
  return sortByIsoDesc(alertInstances, 'createdAtIso').map((row) => decorateAlertInstance({ ...row }));
}

export function getAlertBreaches() {
  return getAlertInstances();
}

export function getLastAlertEvaluation() {
  return {
    iso: lastAlertEvaluationIso,
    display: formatDisplayDate(lastAlertEvaluationIso),
  };
}

function decorateAlertInstance(instance) {
  const rule = alertRules.find((row) => row.id === instance.ruleId);
  const event = wastageRows.find((row) => row.id === instance.eventId);

  return {
    ...instance,
    ruleName: rule?.name || instance.ruleId,
    ruleType: rule?.ruleType || '',
    thresholdLabel: rule?.thresholdQty ? `${rule.thresholdQty}+ qty` : `${rule?.thresholdCount || 0}+ events`,
    ruleScopeLabel: rule?.scopeLabel || rule?.scope || instance.scope,
    relatedLocation: event?.location || '',
    relatedSku: event?.sku || '',
    relatedItemName: event?.itemName || '',
    relatedStatus: event?.status || '',
    relatedSource: event?.source || '',
    relatedRecordedAt: event?.recordedAt || '',
    stateLabel: instance.isAcknowledged ? 'Acknowledged' : 'Action needed',
    stateClass: instance.isAcknowledged
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
    severityClass: instance.severity === 'HIGH'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
    acknowledgementLabel: instance.isAcknowledged
      ? `Acknowledged by ${instance.acknowledgedBy || '—'}`
      : 'Acknowledgement write pending',
    acknowledgementHelper: instance.isAcknowledged
      ? `Scaffolded acknowledgement fields already show ${instance.acknowledgedAt || 'a timestamp'} for this instance.`
      : 'The engine has acknowledgement fields, but public write support is still pending.',
    nextAction: instance.isAcknowledged
      ? 'Keep this visible until the instance is no longer triggered.'
      : 'Review the related event and prepare for acknowledgement once the API exists.',
  };
}

function applyPrototypeAcknowledgementPosture(instances) {
  let acknowledgedAssigned = false;

  return sortByIsoDesc(instances, 'createdAtIso').map((instance) => {
    if (!acknowledgedAssigned && instance.severity !== 'HIGH') {
      acknowledgedAssigned = true;
      return {
        ...instance,
        isAcknowledged: true,
        acknowledgedAtIso: '2026-03-31T12:48:00Z',
        acknowledgedAt: formatDisplayDate('2026-03-31T12:48:00Z'),
        acknowledgedBy: 'L. Supervisor',
      };
    }
    return {
      ...instance,
      acknowledgedAtIso: instance.acknowledgedAtIso || '',
      acknowledgedAt: instance.acknowledgedAt || '',
      acknowledgedBy: instance.acknowledgedBy || '',
    };
  });
}

export function getAlertSummary() {
  const instances = getAlertInstances();
  return {
    rulesTotal: alertRules.length,
    totalInstances: instances.length,
    actionNeeded: instances.filter((row) => !row.isAcknowledged).length,
    acknowledged: instances.filter((row) => row.isAcknowledged).length,
    highSeverity: instances.filter((row) => row.severity === 'HIGH').length,
  };
}

export function getAlertRuleReadinessRows() {
  return [
    { label: 'Rule create + evaluate', state: 'live', helper: 'Write posture is already available through rule create and evaluate-now flows.' },
    { label: 'Rule list view', state: 'stored', helper: 'Rules are already structured cleanly enough for a manager-facing list surface.' },
    { label: 'Instance queue view', state: 'stored', helper: 'Generated instances already carry severity, scope, window, and message posture.' },
    { label: 'Acknowledgement display', state: 'stored', helper: 'Acknowledgement fields already exist and can be shown read-only today.' },
    { label: 'Acknowledgement write', state: 'future', helper: 'Keep the button posture disabled until a public write endpoint exists.' },
  ];
}

export function getAlertById(id) {
  const instance = alertInstances.find((row) => row.id === id);
  return instance ? decorateAlertInstance({ ...instance }) : null;
}

export function createAlertRule(payload) {
  const createdAtIso = NOW_ISO;
  const rule = {
    id: nextRuleId(),
    name: payload.name || 'Custom wastage threshold',
    ruleType: 'single_qty',
    scope: payload.scope || 'Per approved event',
    scopeLabel: [payload.location || 'Any location', payload.sku || 'Any SKU', payload.reason || 'Any reason'].join(' · '),
    thresholdQty: Number(payload.thresholdQty || 1),
    windowHours: Number(payload.windowHours || 24),
    severity: String(payload.severity || 'MEDIUM').toUpperCase(),
    isEnabled: true,
    createdAtIso,
    createdAt: formatDisplayDate(createdAtIso),
    createdBy: payload.createdBy || 'Current User',
    location: payload.location || '',
    sku: payload.sku || '',
    reason: payload.reason || '',
  };
  alertRules = [rule, ...alertRules];
  rebuildAlertInstances();
  return rule;
}

export function evaluateAlertRules() {
  lastAlertEvaluationIso = NOW_ISO;
  rebuildAlertInstances();
  return getAlertInstances();
}

export function getWorkflowSteps(status) {
  return [
    { key: 'created', label: 'Created', done: true },
    { key: 'submitted', label: 'Submitted', done: ['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(status) },
    { key: 'approved', label: 'Approved', done: ['APPROVED', 'REVERSED'].includes(status) },
    { key: 'rejected', label: 'Rejected', done: status === 'REJECTED' },
    { key: 'reversed', label: 'Reversed', done: status === 'REVERSED' },
  ];
}

export function saveDraftEvent(payload) {
  const id = nextEventId();
  const recordedAtIso = NOW_ISO;
  const event = createEvent({
    id,
    occurredAtIso: recordedAtIso,
    recordedAtIso,
    location: payload.location,
    sku: payload.sku.trim(),
    itemName: payload.itemName.trim(),
    qty: Number(payload.qty),
    reason: payload.reason,
    source: payload.source,
    status: 'DRAFT',
    recordedBy: payload.recordedBy || 'Current User',
    notes: payload.notes || '',
    currentOnHand: Number(payload.currentOnHand),
    onHandBefore: Number(payload.currentOnHand),
    onHandAfterApproval: Number(payload.currentOnHand) - Number(payload.qty),
    scanValue: payload.scanValue || '',
    scanResolution: payload.scanResolution || '',
    auditTrail: [
      buildAudit({ id: `AUD-${id.split('-').pop()}-01`, tsIso: recordedAtIso, action: 'WASTAGE_CREATED', actor: payload.recordedBy || 'Current User', details: 'Draft event recorded.' }),
    ],
  });

  wastageRows = [event, ...wastageRows];
  rebuildAlertInstances();
  return id;
}

export function createSubmittedEvent(payload) {
  const id = nextEventId();
  const recordedAtIso = NOW_ISO;
  const submittedAtIso = NOW_ISO;
  const actor = payload.recordedBy || 'Current User';
  const event = createEvent({
    id,
    occurredAtIso: recordedAtIso,
    recordedAtIso,
    location: payload.location,
    sku: payload.sku.trim(),
    itemName: payload.itemName.trim(),
    qty: Number(payload.qty),
    reason: payload.reason,
    source: payload.source,
    status: 'SUBMITTED',
    recordedBy: actor,
    notes: payload.notes || '',
    currentOnHand: Number(payload.currentOnHand),
    onHandBefore: Number(payload.currentOnHand),
    onHandAfterApproval: Number(payload.currentOnHand) - Number(payload.qty),
    scanValue: payload.scanValue || '',
    scanResolution: payload.scanResolution || '',
    submittedAtIso,
    submittedBy: actor,
    auditTrail: [
      buildAudit({ id: `AUD-${id.split('-').pop()}-01`, tsIso: recordedAtIso, action: 'WASTAGE_CREATED', actor, details: 'Draft event recorded.' }),
      buildAudit({ id: `AUD-${id.split('-').pop()}-02`, tsIso: submittedAtIso, action: 'WASTAGE_SUBMITTED', actor, details: 'Submitted for approval.' }),
    ],
  });

  wastageRows = [event, ...wastageRows];
  rebuildAlertInstances();
  return id;
}

export function submitEvent(id, actor = 'Current User') {
  setEvent(id, (row) => {
    const tsIso = NOW_ISO;
    return {
      ...row,
      status: 'SUBMITTED',
      submittedAtIso: tsIso,
      submittedBy: actor,
      auditTrail: [
        ...row.auditTrail,
        buildAudit({ id: nextAuditId(row), tsIso, action: 'WASTAGE_SUBMITTED', actor, details: 'Submitted for approval.' }),
      ],
    };
  });
  rebuildAlertInstances();
}

export function approveEvent(id, actor = 'Current User') {
  setEvent(id, (row) => {
    const tsIso = NOW_ISO;
    const postOnHand = Number(row.onHandBefore) - Number(row.qty);
    return {
      ...row,
      status: 'APPROVED',
      approvedAtIso: tsIso,
      approvedBy: actor,
      currentOnHand: postOnHand,
      postOnHandCurrent: postOnHand,
      movementRows: [
        ...row.movementRows,
        buildMovement({
          id: nextMovementId(row),
          tsIso,
          location: row.location,
          sku: row.sku,
          delta: -Number(row.qty),
          reasonCode: row.reason,
          refType: 'WASTAGE',
          refId: row.id,
          actor,
          note: row.notes || 'Approved wastage posting.',
          postOnHand,
        }),
      ],
      auditTrail: [
        ...row.auditTrail,
        buildAudit({ id: nextAuditId(row), tsIso, action: 'WASTAGE_APPROVED', actor, details: `Stock movement posted. Before: ${row.onHandBefore} · After: ${postOnHand}.` }),
      ],
    };
  });
  rebuildAlertInstances();
}

export function rejectEvent(id, reason, actor = 'Current User') {
  setEvent(id, (row) => {
    const tsIso = NOW_ISO;
    return {
      ...row,
      status: 'REJECTED',
      rejectedAtIso: tsIso,
      rejectedBy: actor,
      rejectionReason: reason,
      notes: `${row.notes}${row.notes ? ' ' : ''}Rejected: ${reason}`,
      auditTrail: [
        ...row.auditTrail,
        buildAudit({ id: nextAuditId(row), tsIso, action: 'WASTAGE_REJECTED', actor, details: reason }),
      ],
    };
  });
  rebuildAlertInstances();
}

export function reverseEvent(id, reason, actor = 'Current User') {
  setEvent(id, (row) => {
    const tsIso = NOW_ISO;
    const restoredOnHand = Number(row.onHandBefore);
    return {
      ...row,
      status: 'REVERSED',
      reversedAtIso: tsIso,
      reversedBy: actor,
      reversalReason: reason,
      currentOnHand: restoredOnHand,
      postOnHandCurrent: restoredOnHand,
      movementRows: [
        ...row.movementRows,
        buildMovement({
          id: nextMovementId(row),
          tsIso,
          location: row.location,
          sku: row.sku,
          delta: Number(row.qty),
          reasonCode: row.reason,
          refType: 'WASTAGE_REVERSAL',
          refId: row.id,
          actor,
          note: reason,
          postOnHand: restoredOnHand,
        }),
      ],
      auditTrail: [
        ...row.auditTrail,
        buildAudit({ id: nextAuditId(row), tsIso, action: 'WASTAGE_REVERSED', actor, details: `Reversal posted. After reversal: ${restoredOnHand}. Reason: ${reason}` }),
      ],
    };
  });
  rebuildAlertInstances();
}

export function updateEvent(id, patch) {
  setEvent(id, (row) => ({ ...row, ...patch }));
  rebuildAlertInstances();
}

export function appendEventNote(id, note, nextStatus = null) {
  setEvent(id, (row) => ({
    ...row,
    status: nextStatus || row.status,
    notes: note ? `${row.notes}${row.notes ? ' ' : ''}${note}` : row.notes,
  }));
  rebuildAlertInstances();
}
