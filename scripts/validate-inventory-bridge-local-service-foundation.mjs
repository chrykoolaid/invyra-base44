import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../src/inventory-bridge/config/bridgeConfigurationDefaults.js';
import {
  INVENTORY_DESKTOP_LOCAL_BRIDGE_OPERATION_TYPES,
  INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES,
  createInventoryDesktopLocalBridgeService,
  getInventoryDesktopLocalBridgeServiceDiagnostics,
} from '../src/inventory-bridge/localBridgeService/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const stableNow = () => '2026-06-30T00:00:00.000Z';
const desktopIdentity = Object.freeze({ desktopId: 'desktop-001', desktopName: 'Invyra Inventory Desktop' });
const enabledConfiguration = Object.freeze({
  ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
  bridge_enabled: true,
  target_inventory_instance_id: 'desktop-001',
  trusted_device_ids: ['scanops-device-001'],
});

const validEnvelope = Object.freeze({
  envelopeId: 'env-phase5-local-service-001',
  operationType: 'COUNT_SUBMISSION',
  timestamp: '2026-06-30T00:00:00.000Z',
  environment: 'LIVE',
  source: Object.freeze({
    deviceId: 'scanops-device-001',
    sessionId: 'session-001',
    storeId: 'store-001',
  }),
  target: Object.freeze({
    desktopId: 'desktop-001',
    environment: 'LIVE',
  }),
  payload: Object.freeze({
    evidenceOnly: true,
    itemId: 'item-001',
    countedQuantity: 1,
  }),
});

assert(INVENTORY_DESKTOP_LOCAL_BRIDGE_OPERATION_TYPES.includes('LOOKUP_REQUEST'), 'operation type list must include LOOKUP_REQUEST');
assert(INVENTORY_DESKTOP_LOCAL_BRIDGE_OPERATION_TYPES.includes('COUNT_SUBMISSION'), 'operation type list must include COUNT_SUBMISSION');
assert(INVENTORY_DESKTOP_LOCAL_BRIDGE_OPERATION_TYPES.includes('DEVICE_HEALTH_PING'), 'operation type list must include DEVICE_HEALTH_PING');

const disabledService = createInventoryDesktopLocalBridgeService({ now: stableNow });
const disabledHealth = disabledService.getHealth({ requestId: 'disabled-health' });
const disabledReceipt = disabledService.handleHandoff(validEnvelope);

assert(disabledService.enabled === false, 'default service must be disabled');
assert(disabledHealth.ok === false, 'disabled health response must report ok=false');
assert(disabledHealth.acceptsHandoff === false, 'disabled health response must not accept handoff');
assert(disabledReceipt.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.SERVICE_UNAVAILABLE, 'disabled handoff must return SERVICE_UNAVAILABLE receipt');
assert(disabledReceipt.inventoryMutationAttempted === false, 'disabled handoff must not attempt inventory mutation');
assert(disabledReceipt.ledgerWriteAttempted === false, 'disabled handoff must not attempt ledger write');
assert(disabledReceipt.stockMutationAttempted === false, 'disabled handoff must not attempt stock mutation');

const service = createInventoryDesktopLocalBridgeService({
  configuration: enabledConfiguration,
  desktopIdentity,
  environment: 'LIVE',
  now: stableNow,
});

const health = service.getHealth({ requestId: 'enabled-health' });
const accepted = service.handleHandoff(validEnvelope);
const duplicate = service.handleHandoff(validEnvelope);
const missingEnvelopeId = service.handleHandoff({ ...validEnvelope, envelopeId: '' });
const unsupported = service.handleHandoff({ ...validEnvelope, envelopeId: 'env-phase5-local-service-unsupported', operationType: 'UNSAFE_STOCK_MUTATION' });
const wrongDesktop = service.handleHandoff({ ...validEnvelope, envelopeId: 'env-phase5-local-service-wrong-desktop', target: { desktopId: 'other-desktop', environment: 'LIVE' } });
const wrongDevice = service.handleHandoff({ ...validEnvelope, envelopeId: 'env-phase5-local-service-wrong-device', source: { deviceId: 'unknown-device', sessionId: 'session-001', storeId: 'store-001' } });
const status = service.getStatus();
const events = service.getEvents();

assert(service.enabled === true, 'enabled configuration should enable local service foundation only');
assert(health.ok === true, 'enabled health response must report ok=true');
assert(health.service === 'Inventory Desktop Local Bridge Service', 'health response must expose safe service name');
assert(health.environment === 'LIVE', 'health response must expose environment');
assert(health.desktopId === 'desktop-001', 'health response must expose desktop identity');
assert(health.bridgeVersion === 'inventory-desktop-local-bridge.v0.5.0', 'health response must expose bridge version');
assert(health.acceptsHandoff === true, 'enabled service should accept governed handoff validation');
assert(health.requiresPairing === true, 'trusted device configuration should require pairing');

assert(accepted.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.ACCEPTED, 'valid envelope must be accepted into bridge staging');
assert(accepted.envelopeId === validEnvelope.envelopeId, 'accepted receipt must preserve envelope ID');
assert(accepted.operationType === validEnvelope.operationType, 'accepted receipt must preserve operation type');
assert(accepted.inventoryMutationAttempted === false, 'accepted handoff must not attempt inventory mutation');
assert(accepted.ledgerWriteAttempted === false, 'accepted handoff must not attempt ledger write');
assert(accepted.stockMutationAttempted === false, 'accepted handoff must not attempt stock mutation');
assert(duplicate.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.DUPLICATE, 'duplicate envelope must return DUPLICATE receipt');
assert(missingEnvelopeId.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.REJECTED, 'missing envelope ID must reject');
assert(unsupported.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.UNSUPPORTED, 'unsupported operation must return UNSUPPORTED receipt');
assert(wrongDesktop.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.REJECTED, 'desktop target mismatch must reject');
assert(wrongDevice.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.REJECTED, 'untrusted source device must reject');

for (const receipt of [accepted, duplicate, missingEnvelopeId, unsupported, wrongDesktop, wrongDevice]) {
  assert(receipt.desktopId === 'desktop-001', 'receipt must include desktop ID');
  assert(receipt.environment === 'LIVE', 'receipt must include environment');
  assert(Array.isArray(receipt.errors), 'receipt errors must be an array');
  assert(Array.isArray(receipt.warnings), 'receipt warnings must be an array');
  assert(receipt.inventoryMutationAttempted === false, `receipt ${receipt.status} must not attempt inventory mutation`);
  assert(receipt.ledgerWriteAttempted === false, `receipt ${receipt.status} must not attempt ledger write`);
  assert(receipt.stockMutationAttempted === false, `receipt ${receipt.status} must not attempt stock mutation`);
}

assert(status.listener.localOnly === true, 'listener foundation must be local-only');
assert(status.listener.networkSocketOpened === false, 'listener foundation must not open network sockets in this validation');
assert(status.listener.httpServerStarted === false, 'listener foundation must not start an HTTP server in this validation');
assert(status.listener.websocketServerStarted === false, 'listener foundation must not start a WebSocket server in this validation');
assert(status.guards.inventoryMutationAttempted === false, 'status guard must report no inventory mutation');
assert(status.guards.ledgerWriteAttempted === false, 'status guard must report no ledger write');
assert(status.guards.stockMutationAttempted === false, 'status guard must report no stock mutation');
assert(status.metrics.acceptedCount === 1, 'accepted count must be 1');
assert(status.metrics.duplicateCount === 1, 'duplicate count must be 1');
assert(status.metrics.rejectedCount === 3, 'rejected count must include malformed, wrong desktop, and wrong device');
assert(status.metrics.unsupportedCount === 1, 'unsupported count must be 1');
assert(events.some((event) => event.type === 'BRIDGE_SERVICE_STARTED'), 'event log must record service started');
assert(events.some((event) => event.type === 'HEALTH_CHECK_RECEIVED'), 'event log must record health check');
assert(events.some((event) => event.type === 'HANDOFF_ACCEPTED'), 'event log must record accepted handoff');
assert(events.some((event) => event.type === 'DUPLICATE_ENVELOPE_DETECTED'), 'event log must record duplicate detection');
assert(events.some((event) => event.type === 'UNSUPPORTED_OPERATION_REJECTED'), 'event log must record unsupported operation');
assert(events.some((event) => event.type === 'VALIDATION_ERROR'), 'event log must record validation errors');

const diagnostics = getInventoryDesktopLocalBridgeServiceDiagnostics({ now: stableNow });
assert(diagnostics.passed === true, 'local bridge service diagnostics must pass');

for (const check of diagnostics.checks) {
  assert(check.passed === true, `diagnostic check failed: ${check.name}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 5 local desktop bridge service foundation validates health, governed handoff receipts, duplicate protection, event logging, and no inventory/ledger/stock mutation.');
