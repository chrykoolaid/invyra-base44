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
// Response helpers
// ---------------------------------------------------------------------------

function unwrapList(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function unwrapRecord(data, keys = []) {
  if (!data || Array.isArray(data)) return data;

  for (const key of keys) {
    if (data?.[key] && !Array.isArray(data[key])) return data[key];
  }

  return data;
}

function actorPayload(payload = {}) {
  return {
    actor_user_id: payload.actor_user_id || payload.user_id || undefined,
    actor_username: payload.actor_username || payload.username || payload.created_by_email || payload.created_by || undefined,
  };
}

function roleForEngine(role, fallback = undefined) {
  const r = (role || fallback || '').toString().trim().toUpperCase();
  return r === 'OWNER' ? 'ADMIN' : r || undefined;
}

function amendmentPayload(payload = {}) {
  const mapped = mapDraftToEngine(payload);
  delete mapped.stock_out_class;
  delete mapped.source;
  delete mapped.recorded_by_username;
  delete mapped.recorded_by_user_id;
  delete mapped.actor_username;
  delete mapped.actor_user_id;
  delete mapped.actor_role;

  return {
    ...mapped,
    amendment_reason: payload.amendment_reason || payload.reason || payload.amendment_notes || 'Stock-out amendment requested',
    requested_by_user_id: payload.requested_by_user_id || payload.actor_user_id || payload.user_id || undefined,
    requested_by_username: payload.requested_by_username || payload.actor_username || payload.username || payload.created_by_email || payload.created_by || undefined,
    requested_by_role: roleForEngine(payload.requested_by_role || payload.actor_role, 'MANAGER'),
  };
}

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
  return unwrapList(data, ['events', 'items', 'records']).map(mapEngineRecordToUI);
}

async function listStoreUseRecords(filters = {}) {
  const data = await wasteEngineClient.get('/review/store-use-ledger', mapFiltersToEngineParams(filters));
  return unwrapList(data, ['events', 'items', 'records']).map(mapEngineRecordToUI);
}

async function listAllRecords(filters = {}) {
  const data = await wasteEngineClient.get('/review/stock-out-ledger', mapFiltersToEngineParams(filters));
  return unwrapList(data, ['events', 'items', 'records']).map(mapEngineRecordToUI);
}

async function getRecord(eventId) {
  const data = await wasteEngineClient.get(`/review/record/${eventId}`);
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record', 'item']));
}

// ---------------------------------------------------------------------------
// Record mutations
// ---------------------------------------------------------------------------

async function createWastageDraft(payload) {
  const data = await wasteEngineClient.post('/wastage', mapDraftToEngine({ ...payload, stock_out_class: 'WASTAGE' }));
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

async function createStoreUseDraft(payload) {
  const data = await wasteEngineClient.post('/store-use', mapDraftToEngine({ ...payload, stock_out_class: 'STORE_USE' }));
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

async function updateDraft(eventId, payload) {
  const data = await wasteEngineClient.patch(`/stock-out/${eventId}/draft`, mapDraftToEngine(payload));
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

async function submitRecord(eventId, payload = {}) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/submit`, actorPayload(payload));
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

async function approveRecord(eventId, payload = {}) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/approve`, actorPayload(payload));
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

async function rejectRecord(eventId, reason, payload = {}) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/reject`, { reason, ...actorPayload(payload) });
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

async function reverseRecord(eventId, reason, payload = {}) {
  const data = await wasteEngineClient.post(`/stock-out/${eventId}/reverse`, { reason, ...actorPayload(payload) });
  return mapEngineRecordToUI(unwrapRecord(data, ['event', 'record']));
}

// ---------------------------------------------------------------------------
// Amendments
// ---------------------------------------------------------------------------

async function listAmendments(filters = {}) {
  const data = await wasteEngineClient.get('/review/amendments', mapFiltersToEngineParams(filters));
  return unwrapList(data, ['amendments', 'items', 'records']);
}

async function requestAmendment(eventId, payload) {
  return wasteEngineClient.post(`/stock-out/${eventId}/amendments`, amendmentPayload(payload));
}

async function approveAmendment(amendmentId, notes = '', payload = {}) {
  return wasteEngineClient.post(`/amendments/${amendmentId}/approve`, {
    ...actorPayload(payload),
    actor_role: roleForEngine(payload.actor_role, 'MANAGER'),
    notes,
  });
}

async function rejectAmendment(amendmentId, reason, payload = {}) {
  return wasteEngineClient.post(`/amendments/${amendmentId}/reject`, {
    reason,
    ...actorPayload(payload),
    actor_role: roleForEngine(payload.actor_role, 'MANAGER'),
  });
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

async function listAlerts(filters = {}) {
  const data = await wasteEngineClient.get('/alerts', mapFiltersToEngineParams(filters));
  return unwrapList(data, ['alerts', 'items', 'records']);
}

async function evaluateAlerts(payload = {}) {
  return wasteEngineClient.post('/alerts/evaluate', payload);
}

async function acknowledgeAlert(alertId, notes = '', payload = {}) {
  return wasteEngineClient.post(`/alerts/${alertId}/acknowledge`, {
    actor_username: payload.actor_username || payload.username || payload.created_by_email || payload.created_by || undefined,
    note: notes,
  });
}

async function resolveAlert(alertId, notes = '', payload = {}) {
  return wasteEngineClient.post(`/alerts/${alertId}/resolve`, {
    actor_username: payload.actor_username || payload.username || payload.created_by_email || payload.created_by || undefined,
    resolution_note: notes,
  });
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
  return unwrapList(data, ['movements', 'items', 'records']);
}

// ---------------------------------------------------------------------------
// Scanner intake (read-only stubs for v1; actions not wired yet)
// ---------------------------------------------------------------------------

async function listScannerIntake(filters = {}) {
  const data = await wasteEngineClient.get('/review/scanner-intake', mapFiltersToEngineParams(filters));
  return unwrapList(data, ['sessions', 'items', 'records']);
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
