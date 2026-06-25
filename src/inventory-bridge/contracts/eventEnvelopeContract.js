import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../config/bridgeConfigurationDefaults.js';
import { getInventoryBridgeRuntimeStatus } from '../runtime/index.js';

export const INVENTORY_BRIDGE_CONTRACT_ADAPTER_PHASE = '5A';
export const INVENTORY_BRIDGE_CONTRACT_ADAPTER_COMPONENT = 'inventory_bridge_disabled_contract_adapter';

export const INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS = Object.freeze({
  ACCEPTABLE_SHAPE: 'ACCEPTABLE_SHAPE',
  REJECTED_DISABLED: 'REJECTED_DISABLED',
  REJECTED_SCHEMA_VERSION: 'REJECTED_SCHEMA_VERSION',
  REJECTED_EVENT_TYPE: 'REJECTED_EVENT_TYPE',
  REJECTED_SOURCE_CONTEXT: 'REJECTED_SOURCE_CONTEXT',
  REJECTED_RUNTIME_DISABLED: 'REJECTED_RUNTIME_DISABLED',
});

const REQUIRED_TOP_LEVEL_FIELDS = Object.freeze([
  'schema_version',
  'event_type',
  'event_id',
  'source',
  'occurred_at',
  'payload',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function freezeIssue(code, detail) {
  return Object.freeze({ code, detail });
}

export function normalizeInventoryBridgeEventEnvelopeCandidate(candidate = {}) {
  const source = hasPlainObject(candidate.source) ? candidate.source : {};

  return Object.freeze({
    schema_version: asTrimmedString(candidate.schema_version),
    event_type: asTrimmedString(candidate.event_type),
    event_id: asTrimmedString(candidate.event_id),
    occurred_at: asTrimmedString(candidate.occurred_at),
    source: Object.freeze({
      system: asTrimmedString(source.system),
      device_id: asTrimmedString(source.device_id),
      store_id: asTrimmedString(source.store_id),
      session_id: asTrimmedString(source.session_id),
    }),
    payload: hasPlainObject(candidate.payload) ? Object.freeze({ ...candidate.payload }) : null,
  });
}

export function classifyInventoryBridgeEventEnvelopeShape(candidate = {}) {
  const issues = [];
  const missingFields = REQUIRED_TOP_LEVEL_FIELDS.filter((field) => candidate[field] === undefined || candidate[field] === null);

  for (const field of missingFields) {
    issues.push(freezeIssue('MISSING_FIELD', field));
  }

  const normalized = normalizeInventoryBridgeEventEnvelopeCandidate(candidate);

  if (!normalized.schema_version) {
    issues.push(freezeIssue('INVALID_SCHEMA_VERSION', 'schema_version must be a non-empty string'));
  }

  if (!normalized.event_type) {
    issues.push(freezeIssue('INVALID_EVENT_TYPE', 'event_type must be a non-empty string'));
  }

  if (!normalized.event_id) {
    issues.push(freezeIssue('INVALID_EVENT_ID', 'event_id must be a non-empty string'));
  }

  if (!normalized.occurred_at) {
    issues.push(freezeIssue('INVALID_OCCURRED_AT', 'occurred_at must be a non-empty string'));
  }

  if (!hasPlainObject(candidate.source)) {
    issues.push(freezeIssue('INVALID_SOURCE', 'source must be an object'));
  }

  if (!normalized.source.system || !normalized.source.device_id || !normalized.source.store_id) {
    issues.push(freezeIssue('INVALID_SOURCE_CONTEXT', 'source.system, source.device_id, and source.store_id are required'));
  }

  if (!hasPlainObject(candidate.payload)) {
    issues.push(freezeIssue('INVALID_PAYLOAD', 'payload must be an object'));
  }

  return Object.freeze({
    component: INVENTORY_BRIDGE_CONTRACT_ADAPTER_COMPONENT,
    phase: INVENTORY_BRIDGE_CONTRACT_ADAPTER_PHASE,
    classification: issues.length === 0
      ? INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE
      : INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SOURCE_CONTEXT,
    acceptable_shape: issues.length === 0,
    normalized,
    issues: Object.freeze(issues),
  });
}

export function assessInventoryBridgeEventEnvelopeContract(candidate = {}, options = {}) {
  const configuration = options.configuration || INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS;
  const shapeResult = classifyInventoryBridgeEventEnvelopeShape(candidate);
  const runtimeStatus = getInventoryBridgeRuntimeStatus({
    configuration,
    requested_action: 'contract_adapter_assessment',
  });

  const acceptedSchemaVersions = asArray(configuration.accepted_schema_versions).map(asTrimmedString).filter(Boolean);
  const acceptedEventTypes = asArray(configuration.accepted_event_types).map(asTrimmedString).filter(Boolean);
  const allowedStoreIds = asArray(configuration.allowed_store_ids).map(asTrimmedString).filter(Boolean);
  const trustedDeviceIds = asArray(configuration.trusted_device_ids).map(asTrimmedString).filter(Boolean);

  let classification = shapeResult.classification;
  const issues = [...shapeResult.issues];

  if (shapeResult.acceptable_shape && acceptedSchemaVersions.length > 0 && !acceptedSchemaVersions.includes(shapeResult.normalized.schema_version)) {
    classification = INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SCHEMA_VERSION;
    issues.push(freezeIssue('SCHEMA_VERSION_NOT_ACCEPTED', shapeResult.normalized.schema_version));
  }

  if (shapeResult.acceptable_shape && classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE && acceptedEventTypes.length > 0 && !acceptedEventTypes.includes(shapeResult.normalized.event_type)) {
    classification = INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_EVENT_TYPE;
    issues.push(freezeIssue('EVENT_TYPE_NOT_ACCEPTED', shapeResult.normalized.event_type));
  }

  if (shapeResult.acceptable_shape && classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE && allowedStoreIds.length > 0 && !allowedStoreIds.includes(shapeResult.normalized.source.store_id)) {
    classification = INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SOURCE_CONTEXT;
    issues.push(freezeIssue('STORE_NOT_ALLOWED', shapeResult.normalized.source.store_id));
  }

  if (shapeResult.acceptable_shape && classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE && trustedDeviceIds.length > 0 && !trustedDeviceIds.includes(shapeResult.normalized.source.device_id)) {
    classification = INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_SOURCE_CONTEXT;
    issues.push(freezeIssue('DEVICE_NOT_TRUSTED', shapeResult.normalized.source.device_id));
  }

  if (classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE && runtimeStatus.enabled === false) {
    classification = INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_RUNTIME_DISABLED;
    issues.push(freezeIssue('RUNTIME_DISABLED', runtimeStatus.reason));
  }

  return Object.freeze({
    component: INVENTORY_BRIDGE_CONTRACT_ADAPTER_COMPONENT,
    phase: INVENTORY_BRIDGE_CONTRACT_ADAPTER_PHASE,
    classification,
    accepted: false,
    ingestible: false,
    writable: false,
    runtime_status: runtimeStatus,
    normalized: shapeResult.normalized,
    issues: Object.freeze(issues),
  });
}
