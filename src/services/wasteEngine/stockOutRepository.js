/**
 * stockOutRepository.js
 * Public API consumed by React components.
 *
 * Routing logic:
 *   base44  → Base44 entities & functions only (DEFAULT — prototype safe)
 *   engine  → Invyra Waste Engine only
 *   hybrid  → Engine first; falls back to Base44 on WasteEngineUnavailableError
 *
 * React components must ONLY import from this file, never from the adapter,
 * client, or mappers directly.
 */

import { base44 } from '@/api/base44Client';
import { isBase44Mode, isHybridMode } from './wasteEngineConfig.js';
import { stockOutAdapter } from './stockOutAdapter.js';
import { isFallbackSafe } from './wasteEngineErrors.js';

// ---------------------------------------------------------------------------
// Internal Base44 helpers
// ---------------------------------------------------------------------------

const ALL_STATUSES = ['DRAFT', 'SUBMITTED', 'POSTED', 'REVERSED', 'REJECTED', 'AMENDED'];

async function _b44LoadAllRecordsForReports(environment = 'LIVE') {
  const results = await Promise.all(
    ALL_STATUSES.map(status =>
      base44.entities.StockOutRecord.filter({ status, environment }, '-created_date', 200)
    )
  );
  return results.flat().filter(Boolean);
}

async function _b44ListByClass(stockOutClass, environment = 'LIVE') {
  return base44.entities.StockOutRecord.filter(
    { stock_out_class: stockOutClass, environment },
    '-created_date',
    200
  );
}

// ---------------------------------------------------------------------------
// Hybrid wrapper: try engine, fall back to base44 fn on safe errors
// ---------------------------------------------------------------------------

async function withHybridFallback(engineFn, fallbackFn) {
  if (isBase44Mode()) return fallbackFn();

  try {
    return await engineFn();
  } catch (err) {
    if (isHybridMode() && isFallbackSafe(err)) {
      console.warn('[WasteEngine] Engine unavailable, falling back to Base44:', err.message);
      return fallbackFn();
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

async function healthCheck() {
  if (isBase44Mode()) return { status: 'base44', mode: 'base44' };
  return stockOutAdapter.healthCheck();
}

// ---------------------------------------------------------------------------
// Record reads
// ---------------------------------------------------------------------------

/**
 * Load all stock-out records across all statuses for the Reports tab.
 * In base44 mode: 6 parallel entity queries.
 * In engine mode: single /review/stock-out-ledger call with mapped UI records.
 * In hybrid: engine first, Base44 fallback.
 */
async function loadAllRecordsForReports(environment = 'LIVE', filters = {}) {
  return withHybridFallback(
    () => stockOutAdapter.listAllRecords(filters),
    () => _b44LoadAllRecordsForReports(environment),
  );
}

async function listWastageRecords(filters = {}) {
  return withHybridFallback(
    () => stockOutAdapter.listWastageRecords(filters),
    () => _b44ListByClass('WASTAGE'),
  );
}

async function listStoreUseRecords(filters = {}) {
  return withHybridFallback(
    () => stockOutAdapter.listStoreUseRecords(filters),
    () => _b44ListByClass('STORE_USE'),
  );
}

async function getRecord(recordId) {
  return withHybridFallback(
    () => stockOutAdapter.getRecord(recordId),
    async () => {
      const results = await base44.entities.StockOutRecord.filter({ id: recordId });
      return results[0] || null;
    },
  );
}

// ---------------------------------------------------------------------------
// Record mutations (Base44 mode: calls existing backend functions)
// ---------------------------------------------------------------------------

async function createStockOutDraft(payload) {
  return withHybridFallback(
    () => (payload.stock_out_class === 'STORE_USE'
      ? stockOutAdapter.createStoreUseDraft(payload)
      : stockOutAdapter.createWastageDraft(payload)),
    () => base44.functions.invoke('createStockOutRecord', payload),
  );
}

async function updateDraft(recordId, payload) {
  return withHybridFallback(
    () => stockOutAdapter.updateDraft(recordId, payload),
    () => base44.entities.StockOutRecord.update(recordId, payload),
  );
}

async function submitRecord(recordId, payload = {}) {
  return withHybridFallback(
    () => stockOutAdapter.submitRecord(recordId, payload),
    () => base44.functions.invoke('submitStockOutRecord', { record_id: recordId }),
  );
}

async function approveRecord(recordId, payload = {}) {
  return withHybridFallback(
    () => stockOutAdapter.approveRecord(recordId, payload),
    () => base44.functions.invoke('approveStockOutRecordV2', { record_id: recordId }),
  );
}

async function rejectRecord(recordId, reason, payload = {}) {
  return withHybridFallback(
    () => stockOutAdapter.rejectRecord(recordId, reason, payload),
    () => base44.functions.invoke('rejectStockOutRecord', { record_id: recordId, reason }),
  );
}

async function reverseRecord(recordId, reason, payload = {}) {
  return withHybridFallback(
    () => stockOutAdapter.reverseRecord(recordId, reason, payload),
    () => base44.functions.invoke('reverseStockOutRecord', { record_id: recordId, reason }),
  );
}

// ---------------------------------------------------------------------------
// Amendments
// ---------------------------------------------------------------------------

async function listAmendments(filters = {}) {
  return withHybridFallback(
    () => stockOutAdapter.listAmendments(filters),
    () => base44.entities.StockOutAmendment.filter({ request_status: 'PENDING', environment: 'LIVE' }, '-created_date', 100),
  );
}

async function requestAmendment(recordId, payload) {
  return withHybridFallback(
    () => stockOutAdapter.requestAmendment(recordId, payload),
    () => base44.functions.invoke('requestStockOutAmendment', { record_id: recordId, ...payload }),
  );
}

async function approveAmendment(amendmentId, notes = '') {
  return withHybridFallback(
    () => stockOutAdapter.approveAmendment(amendmentId, notes),
    () => base44.functions.invoke('approveStockOutAmendment', { amendment_id: amendmentId, approval_notes: notes }),
  );
}

async function rejectAmendment(amendmentId, reason) {
  return withHybridFallback(
    () => stockOutAdapter.rejectAmendment(amendmentId, reason),
    () => base44.functions.invoke('rejectStockOutAmendment', { amendment_id: amendmentId, reason }),
  );
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

async function listAlerts(filters = {}) {
  return withHybridFallback(
    () => stockOutAdapter.listAlerts(filters),
    () => base44.entities.StockOutAlert.filter({ status: 'OPEN', environment: 'LIVE' }, '-created_date', 100),
  );
}

async function evaluateAlerts(payload = {}) {
  // Engine-only; no Base44 equivalent for on-demand evaluation.
  if (isBase44Mode()) return { message: 'Alert evaluation only available in engine mode' };
  return stockOutAdapter.evaluateAlerts(payload);
}

async function acknowledgeAlert(alertId, notes = '') {
  return withHybridFallback(
    () => stockOutAdapter.acknowledgeAlert(alertId, notes),
    () => base44.functions.invoke('acknowledgeStockOutAlert', { alert_id: alertId, notes }),
  );
}

async function resolveAlert(alertId, notes = '') {
  return withHybridFallback(
    () => stockOutAdapter.resolveAlert(alertId, notes),
    () => base44.functions.invoke('resolveStockOutAlert', { alert_id: alertId, notes }),
  );
}

// ---------------------------------------------------------------------------
// Reports / finance
// ---------------------------------------------------------------------------

/**
 * Supplemental engine summary for future use. ReportsTab v1 calculates displayed
 * KPIs locally from mapped records so UI filters/search remain accurate and so
 * pending/rejected values remain visible until the engine summary contract grows.
 */
async function getReportSummary(filters = {}) {
  if (isBase44Mode()) return null;
  try {
    return await stockOutAdapter.getReportSummary(filters);
  } catch (err) {
    if (isHybridMode() && isFallbackSafe(err)) {
      console.warn('[WasteEngine] getReportSummary falling back to null:', err.message);
      return null;
    }
    throw err;
  }
}

async function getReportBreakdown(filters = {}) {
  if (isBase44Mode()) return null;
  try {
    return await stockOutAdapter.getReportBreakdown(filters);
  } catch (err) {
    if (isHybridMode() && isFallbackSafe(err)) {
      console.warn('[WasteEngine] getReportBreakdown falling back to null:', err.message);
      return null;
    }
    throw err;
  }
}

async function getReportMovements(filters = {}) {
  if (isBase44Mode()) return [];
  return withHybridFallback(
    () => stockOutAdapter.getReportMovements(filters),
    () => [],
  );
}

// ---------------------------------------------------------------------------
// Scanner intake
// NOTE: ScannerIntakeTab stays on Base44 in v1.
// These stubs support future wiring. Read methods are safe to call.
// ---------------------------------------------------------------------------

async function listScannerIntake(filters = {}) {
  return withHybridFallback(
    () => stockOutAdapter.listScannerIntake(filters),
    () => base44.entities.ScannerIntakeQueue.filter({ sync_status: 'QUEUED', environment: 'LIVE' }, '-created_date', 100),
  );
}

async function getScannerIntakeDetail(sessionId) {
  if (isBase44Mode()) {
    const results = await base44.entities.ScannerIntakeQueue.filter({ session_id: sessionId, environment: 'LIVE' });
    return results || [];
  }
  return stockOutAdapter.getScannerIntakeDetail(sessionId);
}

async function syncScannerSession(sessionId, payload) {
  // Not wired to Base44 in v1; action endpoints need confirmation first.
  if (isBase44Mode()) throw new Error('syncScannerSession is not available in base44 mode');
  return stockOutAdapter.syncScannerSession(sessionId, payload);
}

async function importScannerSession(sessionId, payload) {
  if (isBase44Mode()) throw new Error('importScannerSession is not available in base44 mode');
  return stockOutAdapter.importScannerSession(sessionId, payload);
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const stockOutRepository = {
  healthCheck,

  // Records
  loadAllRecordsForReports,
  listWastageRecords,
  listStoreUseRecords,
  getRecord,

  // Mutations
  createStockOutDraft,
  updateDraft,
  submitRecord,
  approveRecord,
  rejectRecord,
  reverseRecord,

  // Amendments
  listAmendments,
  requestAmendment,
  approveAmendment,
  rejectAmendment,

  // Alerts
  listAlerts,
  evaluateAlerts,
  acknowledgeAlert,
  resolveAlert,

  // Reports
  getReportSummary,
  getReportBreakdown,
  getReportMovements,

  // Scanner (read-only in v1; action wiring deferred)
  listScannerIntake,
  getScannerIntakeDetail,
  syncScannerSession,
  importScannerSession,
};
