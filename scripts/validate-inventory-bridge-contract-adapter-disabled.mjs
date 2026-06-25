import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../src/inventory-bridge/config/bridgeConfigurationDefaults.js';
import {
  INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS,
  assessInventoryBridgeEventEnvelopeContract,
  classifyInventoryBridgeEventEnvelopeShape,
  getInventoryBridgeEventEnvelopeContractDiagnostics,
  normalizeInventoryBridgeEventEnvelopeCandidate,
} from '../src/inventory-bridge/contracts/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const validCandidate = Object.freeze({
  schema_version: 'inventory-bridge.v1',
  event_type: 'scanops.capture.recorded',
  event_id: 'evt_phase5a_candidate_001',
  occurred_at: '2026-06-25T00:00:00.000Z',
  source: Object.freeze({
    system: 'scanops',
    device_id: 'device-001',
    store_id: 'store-001',
    session_id: 'session-001',
  }),
  payload: Object.freeze({
    evidence_only: true,
  }),
});

const normalized = normalizeInventoryBridgeEventEnvelopeCandidate(validCandidate);
const shape = classifyInventoryBridgeEventEnvelopeShape(validCandidate);

assert(normalized.schema_version === validCandidate.schema_version, 'normalized schema version must preserve candidate data');
assert(normalized.event_type === validCandidate.event_type, 'normalized event type must preserve candidate data');
assert(shape.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE, 'valid candidate shape must be acceptable shape only');
assert(shape.acceptable_shape === true, 'valid candidate shape must set acceptable_shape=true');

const defaultAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate);

assert(defaultAssessment.accepted === false, 'default assessment must never accept ingestion');
assert(defaultAssessment.ingestible === false, 'default assessment must never be ingestible');
assert(defaultAssessment.writable === false, 'default assessment must never be writable');
assert(defaultAssessment.runtime_status.enabled === false, 'runtime must remain disabled');
assert(defaultAssessment.runtime_status.ready === false, 'runtime must remain not ready');
assert(defaultAssessment.runtime_status.operational === false, 'runtime must remain non-operational');
assert(defaultAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_RUNTIME_DISABLED, 'valid candidate must still be rejected while runtime is disabled');

const configuredAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate, {
  configuration: {
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    bridge_enabled: true,
    transport_enabled: true,
    ingestion_enabled: true,
    replay_enabled: true,
    accepted_schema_versions: ['inventory-bridge.v1'],
    accepted_event_types: ['scanops.capture.recorded'],
    allowed_store_ids: ['store-001'],
    trusted_device_ids: ['device-001'],
  },
});

assert(configuredAssessment.accepted === false, 'configured assessment must never accept ingestion');
assert(configuredAssessment.ingestible === false, 'configured assessment must never be ingestible');
assert(configuredAssessment.writable === false, 'configured assessment must never be writable');
assert(configuredAssessment.runtime_status.enabled === false, 'attempted enabled config must not enable runtime');
assert(configuredAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_RUNTIME_DISABLED, 'attempted enabled config must still reject runtime disabled');

const rejectedSchemaAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate, {
  configuration: {
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    accepted_schema_versions: ['other-schema'],
  },
});

assert(rejectedSchemaAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SCHEMA_VERSION, 'schema mismatch must reject schema version');
assert(rejectedSchemaAssessment.accepted === false, 'schema mismatch must not accept');

const rejectedEventTypeAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate, {
  configuration: {
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    accepted_event_types: ['other-event'],
  },
});

assert(rejectedEventTypeAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_EVENT_TYPE, 'event type mismatch must reject event type');
assert(rejectedEventTypeAssessment.accepted === false, 'event type mismatch must not accept');

const rejectedStoreAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate, {
  configuration: {
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    allowed_store_ids: ['other-store'],
  },
});

assert(rejectedStoreAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SOURCE_CONTEXT, 'store mismatch must reject source context');
assert(rejectedStoreAssessment.accepted === false, 'store mismatch must not accept');

const rejectedDeviceAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate, {
  configuration: {
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    trusted_device_ids: ['other-device'],
  },
});

assert(rejectedDeviceAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SOURCE_CONTEXT, 'device mismatch must reject source context');
assert(rejectedDeviceAssessment.accepted === false, 'device mismatch must not accept');

const malformedAssessment = assessInventoryBridgeEventEnvelopeContract({
  schema_version: '',
  event_type: '',
  payload: null,
});

assert(malformedAssessment.accepted === false, 'malformed candidate must not accept');
assert(malformedAssessment.ingestible === false, 'malformed candidate must not be ingestible');
assert(malformedAssessment.writable === false, 'malformed candidate must not be writable');
assert(malformedAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SOURCE_CONTEXT, 'malformed candidate must reject source context/shape');

const diagnostics = getInventoryBridgeEventEnvelopeContractDiagnostics(validCandidate, {
  configuration: {
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    accepted_schema_versions: ['inventory-bridge.v1'],
    accepted_event_types: ['scanops.capture.recorded'],
    allowed_store_ids: ['store-001'],
    trusted_device_ids: ['device-001'],
  },
});

assert(diagnostics.passed === true, 'diagnostics must pass disabled contract checks');
assert(Array.isArray(diagnostics.checks), 'diagnostics must expose checks');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 5A disabled contract adapter remains pure, disabled, non-ingestible, and non-writable.');
