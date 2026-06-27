export const STOCK_OUT_CLASS_CONFIG = {
  WASTAGE: {
    label: 'Wastage',
    shortLabel: 'Wastage',
    description: 'Unsaleable stock loss such as spoilage or contamination.',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    reasons: [
      ['SPOILED', 'Spoiled'],
      ['CONTAMINATED', 'Contaminated'],
      ['UNSALEABLE', 'Unsaleable'],
      ['OTHER_WASTAGE', 'Other wastage'],
    ],
  },
  DAMAGE: {
    label: 'Damage / Breakage',
    shortLabel: 'Damage',
    description: 'Item damaged or broken and no longer sellable.',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    reasons: [
      ['DAMAGED', 'Damaged'],
      ['BREAKAGE', 'Breakage'],
      ['PACKAGING_DAMAGED', 'Packaging damaged'],
      ['HANDLING_DAMAGE', 'Handling damage'],
    ],
  },
  EXPIRY: {
    label: 'Expired / Spoiled',
    shortLabel: 'Expiry',
    description: 'Expired, short-dated, or spoiled stock removed from sale.',
    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    reasons: [
      ['EXPIRED', 'Expired'],
      ['BEST_BEFORE_PASSED', 'Best-before passed'],
      ['QUALITY_FAILURE', 'Quality failure'],
      ['SPOILED', 'Spoiled'],
    ],
  },
  STORE_USE: {
    label: 'Store Use',
    shortLabel: 'Store Use',
    description: 'Legitimate internal use for store operations.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    reasons: [
      ['STAFF_REFRESHMENT', 'Staff refreshments'],
      ['CLEANING_USE', 'Cleaning use'],
      ['BREAKROOM', 'Breakroom supplies'],
      ['TOILETRIES', 'Toiletries / amenities'],
      ['OFFICE_USE', 'Office use'],
    ],
  },
  THEFT_SUSPECTED: {
    label: 'Suspected Theft / Loss',
    shortLabel: 'Suspected Loss',
    description: 'Controlled loss event requiring manager review before stock is adjusted.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    reasons: [
      ['SUSPECTED_LOSS', 'Suspected loss'],
      ['ITEM_MISSING', 'Item missing'],
      ['PACKAGING_FOUND', 'Packaging found'],
      ['UNEXPLAINED_REMOVAL', 'Unexplained removal'],
    ],
  },
  THEFT_CONFIRMED: {
    label: 'Confirmed Theft Loss',
    shortLabel: 'Confirmed Loss',
    description: 'Manager-reviewed confirmed theft loss outcome.',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    reasons: [
      ['REVIEW_CONFIRMED_LOSS', 'Review confirmed loss'],
      ['LOSS_PREVENTION_CONFIRMED', 'Loss prevention confirmed'],
      ['INCIDENT_CONFIRMED', 'Incident confirmed'],
    ],
  },
  UNKNOWN_SHRINKAGE: {
    label: 'Unknown Shrinkage',
    shortLabel: 'Unknown Shrinkage',
    description: 'Unexplained stock loss requiring review before adjustment.',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    reasons: [
      ['UNEXPLAINED_VARIANCE', 'Unexplained variance'],
      ['STOCK_NOT_FOUND', 'Stock not found'],
      ['LOCATION_MISMATCH', 'Location mismatch'],
      ['COUNT_MISMATCH', 'Count mismatch'],
    ],
  },
};

export const RECORDABLE_STOCK_OUT_CLASSES = [
  'WASTAGE',
  'DAMAGE',
  'EXPIRY',
  'STORE_USE',
  'THEFT_SUSPECTED',
  'UNKNOWN_SHRINKAGE',
];

export const REVIEW_REQUIRED_STOCK_OUT_CLASSES = [
  'THEFT_SUSPECTED',
  'UNKNOWN_SHRINKAGE',
];

export const OPERATIONAL_LOSS_CLASSES = [
  'WASTAGE',
  'DAMAGE',
  'EXPIRY',
];

export const STOCK_OUT_REVIEW_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED_FOR_ADJUSTMENT',
];

export const STOCK_OUT_STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Needs Review',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  APPROVED_FOR_ADJUSTMENT: 'Approved for Adjustment',
  POSTED: 'Posted',
  AMENDED: 'Amended',
  REVERSED: 'Reversed',
  REJECTED: 'Rejected',
  VOIDED: 'Voided',
};

export const STOCK_OUT_STATUS_COLORS = {
  DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED_FOR_ADJUSTMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  POSTED: 'bg-green-50 text-green-700 border-green-200',
  AMENDED: 'bg-purple-50 text-purple-700 border-purple-200',
  REVERSED: 'bg-slate-50 text-slate-700 border-slate-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  VOIDED: 'bg-zinc-50 text-zinc-700 border-zinc-200',
};

export function getStockOutClassConfig(stockOutClass) {
  return STOCK_OUT_CLASS_CONFIG[stockOutClass] || STOCK_OUT_CLASS_CONFIG.WASTAGE;
}

export function getStockOutClassLabel(stockOutClass) {
  return getStockOutClassConfig(stockOutClass).label;
}

export function getStockOutClassShortLabel(stockOutClass) {
  return getStockOutClassConfig(stockOutClass).shortLabel;
}

export function getReasonOptions(stockOutClass) {
  return getStockOutClassConfig(stockOutClass).reasons || [];
}

export function requiresControlledLossReview(stockOutClass) {
  return REVIEW_REQUIRED_STOCK_OUT_CLASSES.includes(stockOutClass);
}

export function isOperationalLossClass(stockOutClass) {
  return OPERATIONAL_LOSS_CLASSES.includes(stockOutClass);
}

export function isReviewWorkflowStatus(status) {
  return STOCK_OUT_REVIEW_STATUSES.includes(status);
}
