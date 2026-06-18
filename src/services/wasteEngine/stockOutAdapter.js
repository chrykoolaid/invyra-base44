/**
 * stockOutAdapter.js
 * Engine-specific operations — all calls go through wasteEngineClient.
 * Translates between Base44/UI shapes and the Waste Engine API.
 *
 * Import this only from stockOutRepository. React components must not
 * import it directly.
 */

import { wasteEngineClient } from './wasteEngineClient.js';
import {
  mapEngineRecordToUI,
  mapDraftToEngine,
  mapFiltersToEngineParams,
  mapEngineSummaryToUI,
  mapEngineBreakdownToUI,
} from './stockOutMappers.js';

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

async function healthCheck() {
  return wasteEngineClient.get('/health');
}

// ---------------------------------------------------------------------------
// Record reads
// ---------------------------------------------------------------------------

async function listWastageRecords(filters = {}) {
  const data = await wasteEngineClient.get('/review/wastage-ledger', mapFiltersToEngineParams(filters));
  return (data.items || data.records || data || []).map(mapEngineRecordToUI);
}

async function listStoreUseRecords(filters = {}) {
  const data = await wasteEngineClient.get('/review/store-use-ledger', mapFiltersToEngineParams(filters));
  return (data.items || data.records || data || []).map(mapEngineRecordToUI);
}

async function listAllRecords(filters = {}) {
  const data = await wasteEngineClient.get('/review/stock-out-ledger', mapFiltersToEngineParams(filters));
  return (data.items || data.records || data || []).map(mapEngineRecordToUI);
}

async function getRecord(eventId) {
  const data = await wasteEngineClient.get(`/review/record/${eventId}`);
  return mapEngineRecordToUI(data);
}

// ---------------------------------------------------------------------------
// Record mutations
// ---------------------------------------------------------------------------

async function createWastageDraft(payload) {
  const data = await wasteEngineClient.post('/wastage', mapDraftToEngine({ ...payload, stock_out_class: 'WASTAGE' }));
  return mapEngineRecordToUI(data);
}

async function createStoreUseDraft(payload) {
  const data = await wasteEngineClient.post('/store-use', mapDraftToEngine({ ...payload, stock_out_class: 'STORE_USE' }));
  return mapEngineRecordToUI(data);
}

async function updateDraft(eventId, payload) {
  const data = await wasteEngineClient.patch(`/stock-out/${eventId}/draft`, mapDraftToEngine(payload));
  return mapEngineRecordToUI(data);
}

async function submitRecord(eventId) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/submit`, {});
  return mapEngineRecordToUI(data);
}

async function approveRecord(eventId, notes = '') {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/approve`, { notes });
  return mapEngineRecordToUI(data);
}

async function rejectRecord(eventId, reason) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/reject`, { reason });
  return mapEngineRecordToUI(data);
}

async function reverseRecord(eventId, reason) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/reverse`, { reason });
  return mapEngineRecordToUI(data);
}

// ---------------------------------------------------------------------------
// Amendments
// ---------------------------------------------------------------------------

async function listAmendments(filters = {}) {
  const data = await wasteEngineClient.get('/review/amendments', mapFiltersToEngineParams(filters));
  return data.items || data.records || data || [];
}

async function requestAmendment(eventId, payload) {
  return wasteEngineClient.post(`/stock-out/${eventId}/amendments`, payload);
}

async function approveAmendment(amendmentId, notes = '') {
  return wasteEngineClient.post(`/amendments/${amendmentId}/approve`, { notes });
}

async function rejectAmendment(amendmentId, reason) {
  return wasteEngineClient.post(`/amendments/${amendmentId}/reject`, { reason });
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

async function listAlerts(filters = {}) {
  const data = await wasteEngineClient.get('/alerts', mapFiltersToEngineParams(filters));
  return data.items || data.alerts || data || [];
}

async function evaluateAlerts(payload = {}) {
  return wasteEngineClient.post('/alerts/evaluate', payload);
}

async function acknowledgeAlert(alertId, notes = '') {
  return wasteEngineClient.post(`/alerts/${alertId}/acknowledge`, { notes });
}

async function resolveAlert(alertId, notes = '') {
  return wasteEngineClient.post(`/alerts/${alertId}/resolve`, { notes });
}

// ---------------------------------------------------------------------------
// Reports / finance
// ---------------------------------------------------------------------------

async function getReportSummary(filters = {}) {
  const data = await wasteEngineClient.get('/reports/finance/summary', mapFiltersToEngineParams(filters));
  return mapEngineSummaryToUI(data);
}

async function getReportBreakdown(filters = {}) {
  const data = await wasteEngineClient.get('/reports/finance/breakdown', mapFiltersToEngineParams(filters));
  return mapEngineBreakdownToUI(data);
}

async function getReportMovements(filters = {}) {
  const data = await wasteEngineClient.get('/reports/finance/movements', mapFiltersToEngineParams(filters));
  return data.items || data.movements || data || [];
}

// ---------------------------------------------------------------------------
// Scanner intake (read-only stubs for v1; actions not wired yet)
// ---------------------------------------------------------------------------

async function listScannerIntake(filters = {}) {
  const data = await wasteEngineClient.get('/review/scanner-intake', mapFiltersToEngineParams(filters));
  return data.items || data.records || data || [];
}

async function getScannerIntakeDetail(sessionId) {
  return wasteEngineClient.get(`/review/scanner-intake/${sessionId}`);
}

async function syncScannerSession(sessionId, payload) {
  return wasteEngineClient.post(`/scanner/sessions/${sessionId}/sync`, payload);
}

async function importScannerSession(sessionId, payload) {
  return wasteEngineClient.post(`/scanner/sessions/${sessionId}/import`, payload);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const stockOutAdapter = {
  healthCheck,

  listWastageRecords,
  listStoreUseRecords,
  listAllRecords,
  getRecord,

  createWastageDraft,
  createStoreUseDraft,
  updateDraft,
  submitRecord,
  approveRecord,
  rejectRecord,
  reverseRecord,

  listAmendments,
  requestAmendment,
  approveAmendment,
  rejectAmendment,

  listAlerts,
  evaluateAlerts,
  acknowledgeAlert,
  resolveAlert,

  getReportSummary,
  getReportBreakdown,
  getReportMovements,

  listScannerIntake,
  getScannerIntakeDetail,
  syncScannerSession,
  importScannerSession,
};