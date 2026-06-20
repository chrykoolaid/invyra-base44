/**
 * bridgeGateProjection.js — Inventory Phase 1D-D-AB
 *
 * Inventory-side bridge gate projection after the relay handshake evidence chain.
 *
 * Scope for this phase:
 * - Projection-only and validator-only.
 * - Reads Inventory Phase 1D-D-Z handshake evidence and projects a locked gate
 *   state for any future bridge activation.
 * - Explicitly keeps relay enforcement, relay transport, event transport, event
 *   sync, and event ingestion disabled until a later, explicit enforcement phase.
 * - Does not write entities, create receipts, ingest events, or mutate inventory.
 */

export const INVENTORY_BRIDGE_GATE_PHASE = '1D-D-AB';
export const INVENTORY_BRIDGE_GATE_SOURCE_PHASE = '1D-D-Z';
export const INVENTORY_BRIDGE_GATE_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_GATE_CONTRACT_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_GATE_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_GATE_STATUS = Object.freeze({
  LOCKED_PENDING_EXPLICIT_ENFORCEMENT: 'BRIDGE_GATE_LOCKED_PENDING_EXPLICIT_ENFORCEMENT',
  BLOCKED: 'BRIDGE_GATE_BLOCKED',
});

export const INVENTORY_BRIDGE_GATE_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_BRIDGE_GATE_PROJECTED',
  INVALID: 'BRIDGE_GATE_INPUT_INVALID',
  HANDSHAKE_NOT_CLOSED: 'BRIDGE_HANDSHAKE_NOT_CLOSED',
  PHASE_MISMATCH: 'BRIDGE_HANDSHAKE_PHASE_MISMATCH',
  DEVICE_MISMATCH: 'BRIDGE_GATE_DEVICE_MISMATCH',
  ENVIRONMENT_MISMATCH: 'BRIDGE_GATE_ENVIRONMENT_MISMATCH',
  STORE_MISMATCH: 'BRIDGE_GATE_STORE_MISMATCH',
  INSTANCE_MISMATCH: 'BRIDGE_GATE_INSTANCE_MISMATCH',
  RELAY_ENFORCEMENT_ALREADY_ENABLED: 'RELAY_ENFORCEMENT_ALREADY_ENABLED',
  RELAY_TRANSPORT_ALREADY_ENABLED: 'RELAY_TRANSPORT_ALREADY_ENABLED',
  EVENT_TRANSPORT_ALREADY_ENABLED: 'EVENT_TRANSPORT_ALREADY_ENABLED',
  EVENT_SYNC_ALREADY_ENABLED: 'EVENT_SYNC_ALREADY_ENABLED',
  INGESTION_ALREADY_ENABLED: 'EVENT_INGESTION_ALREADY_ENABLED',
  INVENTORY_MUTATION_ALREADY_ALLOWED: 'INVENTORY_MUTATION_ALREADY_ALLOWED',
});

export const INVENTORY_BRIDGE_GATE_REQUIRED_FIELDS = Object.freeze([
  'schema_version',
  'phase',
  'contract_version',
  'bridge_protocol_version',
  'code',
  'status',
  'source_device_id',
  'environment',
  'store_id',
  'inventory_instance_id',
  'handshake_evidence_closed',
  'relay_enforcement_allowed',
  'relay_transport_allowed',
  'event_transport_allowed',
  'event_sync_allowed',
  'event_ingestion_allowed',
  'inventory_mutation_allowed',
  'relay_enforcement_still_required',
  'ingestion_validation_still_required_per_event',
  'evidence_projection_only',
  'projected_at',
]);

export const INVENTORY_BRIDGE_GATE_GUARDRAILS = Object.freeze({
  inventory_bridge_gate_projection_only: true,
  local_validator_only: true,
  no_relay_enforcement: true,
  no_relay_transport: true,
  no_event_transport: true,
  no_event_sync: true,
  no_event_ingestion: true,
  no_process_inbound_call: true,
  no_entity_writes: true,
  no_device_registry_writes: true,
  no_inventory_sync_inbound_event_writes: true,
  no_inventory_sync_receipt_writes: true,
  no_inventory_bridge_device_writes: true,
  no_live_pairing: true,
  no_ui: true,
  no_sync_enablement: true,
  no_stock_mutation: true,
  no_price_mutation: true,
  no_pos_order_forecast_mutation: true,
  no_item_master_mutation: true,
  explicit_future_enforcement_phase_required: true,
  ingestion_validation_still_required_per_event: true,
  base44_cloud_relay_not_lan_bridge: true,
});

function nowIso() {
  return new Date().toISOString();
}

function parseJsonMaybe(input) {
  if (!input) return null;
  if (typeof input === 'object' && !Array.isArray(input)) return input;
  if (typeof input !== 'string') return null;

  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function normalizeExpectedScope(input = {}) {
  const scope = parseJsonMaybe(input) || {};
  return {
    source_device_id: scope.source_device_id || scope.device_id || null,
    environment: scope.environment || null,
    store_id: scope.store_id || null,
    inventory_instance_id: scope.inventory_instance_id || null,
    relay_instance_ref: scope.relay_instance_ref || null,
  };
}

function errorCode(errors = []) {
  const priority = [
    INVENTORY_BRIDGE_GATE_CODE.PHASE_MISMATCH,
    INVENTORY_BRIDGE_GATE_CODE.DEVICE_MISMATCH,
    INVENTORY_BRIDGE_GATE_CODE.ENVIRONMENT_MISMATCH,
    INVENTORY_BRIDGE_GATE_CODE.STORE_MISMATCH,
    INVENTORY_BRIDGE_GATE_CODE.INSTANCE_MISMATCH,
    INVENTORY_BRIDGE_GATE_CODE.HANDSHAKE_NOT_CLOSED,
    INVENTORY_BRIDGE_GATE_CODE.RELAY_ENFORCEMENT_ALREADY_ENABLED,
    INVENTORY_BRIDGE_GATE_CODE.RELAY_TRANSPORT_ALREADY_ENABLED,
    INVENTORY_BRIDGE_GATE_CODE.EVENT_TRANSPORT_ALREADY_ENABLED,
    INVENTORY_BRIDGE_GATE_CODE.EVENT_SYNC_ALREADY_ENABLED,
    INVENTORY_BRIDGE_GATE_CODE.INGESTION_ALREADY_ENABLED,
    INVENTORY_BRIDGE_GATE_CODE.INVENTORY_MUTATION_ALREADY_ALLOWED,
  ];

  return priority.find((code) => errors.includes(code)) || INVENTORY_BRIDGE_GATE_CODE.INVALID;
}

export function validateInventoryBridgeGateInput(input = {}, expectedScopeInput = {}) {
  const handshake = parseJsonMaybe(input);
  const expectedScope = normalizeExpectedScope(expectedScopeInput);
  const errors = [];

  if (!handshake || typeof handshake !== 'object' || Array.isArray(handshake)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_GATE_CODE.INVALID,
      errors: ['Bridge gate input must be an object or JSON string.'],
      handshake: null,
      expected_scope: expectedScope,
    };
  }

  for (const field of INVENTORY_BRIDGE_GATE_REQUIRED_FIELDS) {
    if (handshake[field] === null || handshake[field] === undefined || handshake[field] === '') {
      errors.push(`Missing ${field}.`);
    }
  }

  if (handshake.phase !== INVENTORY_BRIDGE_GATE_SOURCE_PHASE) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.PHASE_MISMATCH);
  }

  if (handshake.code !== 'INVENTORY_RELAY_HANDSHAKE_EVIDENCE_PROJECTED') {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.HANDSHAKE_NOT_CLOSED);
  }

  if (handshake.status !== 'RELAY_HANDSHAKE_EVIDENCE_CLOSED_PENDING_FUTURE_ENFORCEMENT') {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.HANDSHAKE_NOT_CLOSED);
  }

  if (handshake.handshake_evidence_closed !== true) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.HANDSHAKE_NOT_CLOSED);
  }

  if (expectedScope.source_device_id && handshake.source_device_id !== expectedScope.source_device_id) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.DEVICE_MISMATCH);
  }

  if (expectedScope.environment && handshake.environment !== expectedScope.environment) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.ENVIRONMENT_MISMATCH);
  }

  if (expectedScope.store_id && handshake.store_id !== expectedScope.store_id) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.STORE_MISMATCH);
  }

  if (expectedScope.inventory_instance_id && handshake.inventory_instance_id !== expectedScope.inventory_instance_id) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.INSTANCE_MISMATCH);
  }

  if (handshake.relay_enforcement_allowed !== false || handshake.relay_enforcement_still_required !== true) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.RELAY_ENFORCEMENT_ALREADY_ENABLED);
  }

  if (handshake.relay_transport_allowed !== false) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.RELAY_TRANSPORT_ALREADY_ENABLED);
  }

  if (handshake.event_transport_allowed !== false) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.EVENT_TRANSPORT_ALREADY_ENABLED);
  }

  if (handshake.event_sync_allowed !== false) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.EVENT_SYNC_ALREADY_ENABLED);
  }

  if (handshake.event_ingestion_allowed !== false) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.INGESTION_ALREADY_ENABLED);
  }

  if (handshake.inventory_mutation_allowed !== false) {
    errors.push(INVENTORY_BRIDGE_GATE_CODE.INVENTORY_MUTATION_ALREADY_ALLOWED);
  }

  if (handshake.ingestion_validation_still_required_per_event !== true) {
    errors.push('ingestion validation must remain required per future event.');
  }

  if (handshake.evidence_projection_only !== true) {
    errors.push('handshake evidence must remain projection-only.');
  }

  return {
    ok: errors.length === 0,
    code: errors.length === 0 ? 'BRIDGE_GATE_INPUT_VALID' : errorCode(errors),
    errors,
    handshake,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeGate(input = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeGateInput(input, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_GATE_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_GATE_PHASE,
      contract_version: INVENTORY_BRIDGE_GATE_CONTRACT_VERSION,
      bridge_protocol_version: INVENTORY_BRIDGE_GATE_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_GATE_STATUS.BLOCKED,
      validation,
      bridge_gate_locked: true,
      explicit_future_enforcement_phase_required: true,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      projected_at: projectedAt,
      guardrails: INVENTORY_BRIDGE_GATE_GUARDRAILS,
    };
  }

  const handshake = validation.handshake;
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_GATE_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_GATE_PHASE,
    contract_version: INVENTORY_BRIDGE_GATE_CONTRACT_VERSION,
    bridge_protocol_version: INVENTORY_BRIDGE_GATE_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_GATE_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_GATE_STATUS.LOCKED_PENDING_EXPLICIT_ENFORCEMENT,
    source_device_id: handshake.source_device_id,
    environment: handshake.environment,
    store_id: handshake.store_id,
    inventory_instance_id: handshake.inventory_instance_id,
    relay_instance_ref: handshake.relay_instance_ref || validation.expected_scope.relay_instance_ref || null,
    source_handshake_phase: handshake.phase,
    source_handshake_status: handshake.status,
    handshake_evidence_closed: true,
    bridge_gate_locked: true,
    explicit_future_enforcement_phase_required: true,
    relay_enforcement_allowed: false,
    relay_transport_allowed: false,
    event_transport_allowed: false,
    event_sync_allowed: false,
    event_ingestion_allowed: false,
    inventory_mutation_allowed: false,
    stock_mutation_allowed: false,
    price_mutation_allowed: false,
    pos_order_forecast_mutation_allowed: false,
    item_master_mutation_allowed: false,
    ingestion_validation_still_required_per_event: true,
    evidence_projection_only: true,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_GATE_GUARDRAILS,
  };
}

export function getInventoryBridgeGateSafeSummary(input = {}) {
  const projection = parseJsonMaybe(input) || {};
  return {
    ok: projection.ok ?? null,
    code: projection.code || null,
    status: projection.status || null,
    phase: projection.phase || null,
    source_device_id: projection.source_device_id || null,
    environment: projection.environment || null,
    store_id: projection.store_id || null,
    inventory_instance_id: projection.inventory_instance_id || null,
    bridge_gate_locked: projection.bridge_gate_locked ?? null,
    explicit_future_enforcement_phase_required: projection.explicit_future_enforcement_phase_required ?? null,
    relay_enforcement_allowed: projection.relay_enforcement_allowed ?? null,
    relay_transport_allowed: projection.relay_transport_allowed ?? null,
    event_transport_allowed: projection.event_transport_allowed ?? null,
    event_sync_allowed: projection.event_sync_allowed ?? null,
    event_ingestion_allowed: projection.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: projection.inventory_mutation_allowed ?? null,
    evidence_projection_only: projection.evidence_projection_only ?? null,
    projected_at: projection.projected_at || null,
  };
}

export function assertNoInventoryBridgeGateOperationalMutation() {
  return INVENTORY_BRIDGE_GATE_GUARDRAILS;
}
