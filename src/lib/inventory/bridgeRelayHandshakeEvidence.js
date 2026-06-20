/**
 * bridgeRelayHandshakeEvidence.js — Inventory Phase 1D-D-Z
 *
 * Inventory-side acceptance contract for ScanOps Phase 1D-D-Y relay enforcement
 * candidate acceptance evidence.
 *
 * Scope for this phase:
 * - Projection-only and validator-only.
 * - Accepts ScanOps acknowledgement of Inventory's relay enforcement candidate
 *   as handshake evidence.
 * - Projects a closed evidence chain that is still pending a future, explicit
 *   relay enforcement phase.
 * - Does not enforce relay trust, start relay transport, enable event transport,
 *   sync events, ingest events, write entities, or mutate Inventory/POS/order/
 *   forecasting state.
 */

export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_EVIDENCE_PHASE = '1D-D-Z';
export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_SOURCE_PHASE = '1D-D-Y';
export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_CONTRACT_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_STATUS = Object.freeze({
  CLOSED_PENDING_FUTURE_ENFORCEMENT: 'RELAY_HANDSHAKE_EVIDENCE_CLOSED_PENDING_FUTURE_ENFORCEMENT',
  BLOCKED: 'RELAY_HANDSHAKE_EVIDENCE_BLOCKED',
});

export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_RELAY_HANDSHAKE_EVIDENCE_PROJECTED',
  INVALID: 'RELAY_HANDSHAKE_EVIDENCE_INVALID',
  STATUS_INVALID: 'RELAY_HANDSHAKE_STATUS_INVALID',
  DEVICE_MISMATCH: 'RELAY_HANDSHAKE_DEVICE_MISMATCH',
  ENVIRONMENT_MISMATCH: 'RELAY_HANDSHAKE_ENVIRONMENT_MISMATCH',
  STORE_MISMATCH: 'RELAY_HANDSHAKE_STORE_MISMATCH',
  INSTANCE_MISMATCH: 'RELAY_HANDSHAKE_INSTANCE_MISMATCH',
  PHASE_MISMATCH: 'RELAY_HANDSHAKE_PHASE_MISMATCH',
  CANDIDATE_NOT_ACCEPTED: 'RELAY_ENFORCEMENT_CANDIDATE_NOT_ACCEPTED',
  ENFORCEMENT_ALREADY_ALLOWED: 'RELAY_ENFORCEMENT_ALREADY_ALLOWED',
  RELAY_TRANSPORT_ALREADY_ALLOWED: 'RELAY_TRANSPORT_ALREADY_ALLOWED',
  EVENT_TRANSPORT_ALREADY_ALLOWED: 'EVENT_TRANSPORT_ALREADY_ALLOWED',
  EVENT_SYNC_ALREADY_ALLOWED: 'EVENT_SYNC_ALREADY_ALLOWED',
  INGESTION_ALREADY_ALLOWED: 'EVENT_INGESTION_ALREADY_ALLOWED',
  LOCAL_WRITE_ALREADY_ALLOWED: 'LOCAL_WRITE_ALREADY_ALLOWED',
});

export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_REQUIRED_FIELDS = Object.freeze([
  'status',
  'source_device_id',
  'environment',
  'store_id',
  'inventory_instance_id',
  'inventory_candidate_status',
  'scanops_preflight_phase',
  'relay_readiness_preflight_accepted',
  'relay_enforcement_candidate_accepted',
  'relay_enforcement_allowed',
  'relay_transport_allowed',
  'event_transport_allowed',
  'event_sync_allowed',
  'event_ingestion_allowed',
  'relay_enforcement_still_required',
  'ingestion_validation_still_required_per_event',
  'evidence_projection_only',
  'accepted_at',
]);

export const INVENTORY_BRIDGE_RELAY_HANDSHAKE_GUARDRAILS = Object.freeze({
  inventory_relay_handshake_evidence_projection_only: true,
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
  relay_enforcement_still_required: true,
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
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.PHASE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.DEVICE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.ENVIRONMENT_MISMATCH,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.STORE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.INSTANCE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.STATUS_INVALID,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.CANDIDATE_NOT_ACCEPTED,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.ENFORCEMENT_ALREADY_ALLOWED,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.RELAY_TRANSPORT_ALREADY_ALLOWED,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.EVENT_TRANSPORT_ALREADY_ALLOWED,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.EVENT_SYNC_ALREADY_ALLOWED,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.INGESTION_ALREADY_ALLOWED,
    INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.LOCAL_WRITE_ALREADY_ALLOWED,
  ];

  return priority.find((code) => errors.includes(code))
    || INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.INVALID;
}

export function validateInventoryBridgeRelayHandshakeEvidence(input = {}, expectedScopeInput = {}) {
  const evidence = parseJsonMaybe(input);
  const expectedScope = normalizeExpectedScope(expectedScopeInput);
  const errors = [];

  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.INVALID,
      errors: ['Relay handshake evidence must be an object or JSON string.'],
      evidence: null,
      expected_scope: expectedScope,
    };
  }

  for (const field of INVENTORY_BRIDGE_RELAY_HANDSHAKE_REQUIRED_FIELDS) {
    if (evidence[field] === null || evidence[field] === undefined || evidence[field] === '') {
      errors.push(`Missing ${field}.`);
    }
  }

  if (evidence.status !== 'RELAY_ENFORCEMENT_CANDIDATE_ACCEPTED_PENDING_FUTURE_RELAY_ENFORCEMENT') {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.STATUS_INVALID);
  }

  if (evidence.inventory_candidate_status !== 'RELAY_ENFORCEMENT_CANDIDATE_PROJECTED_PENDING_ENFORCEMENT') {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.STATUS_INVALID);
  }

  if (evidence.scanops_preflight_phase !== '1D-D-W') {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.PHASE_MISMATCH);
  }

  if (expectedScope.source_device_id && evidence.source_device_id !== expectedScope.source_device_id) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.DEVICE_MISMATCH);
  }

  if (expectedScope.environment && evidence.environment !== expectedScope.environment) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.ENVIRONMENT_MISMATCH);
  }

  if (expectedScope.store_id && evidence.store_id !== expectedScope.store_id) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.STORE_MISMATCH);
  }

  if (expectedScope.inventory_instance_id && evidence.inventory_instance_id !== expectedScope.inventory_instance_id) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.INSTANCE_MISMATCH);
  }

  if (evidence.relay_readiness_preflight_accepted !== true || evidence.relay_enforcement_candidate_accepted !== true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.CANDIDATE_NOT_ACCEPTED);
  }

  if (evidence.relay_enforcement_allowed !== false || evidence.relay_enforcement_still_required !== true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.ENFORCEMENT_ALREADY_ALLOWED);
  }

  if (evidence.relay_transport_allowed !== false || evidence.can_start_relay_transport === true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.RELAY_TRANSPORT_ALREADY_ALLOWED);
  }

  if (evidence.event_transport_allowed !== false || evidence.can_enable_event_transport === true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.EVENT_TRANSPORT_ALREADY_ALLOWED);
  }

  if (evidence.event_sync_allowed !== false || evidence.can_sync_events === true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.EVENT_SYNC_ALREADY_ALLOWED);
  }

  if (evidence.event_ingestion_allowed !== false || evidence.can_call_inventory_ingestion === true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.INGESTION_ALREADY_ALLOWED);
  }

  if (evidence.can_write_event_outbox === true || evidence.can_write_local_storage === true) {
    errors.push(INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.LOCAL_WRITE_ALREADY_ALLOWED);
  }

  if (evidence.ingestion_validation_still_required_per_event !== true) {
    errors.push('ingestion validation must remain required per future event.');
  }

  if (evidence.evidence_projection_only !== true) {
    errors.push('relay handshake evidence must remain projection-only.');
  }

  return {
    ok: errors.length === 0,
    code: errors.length === 0
      ? 'RELAY_HANDSHAKE_EVIDENCE_VALID'
      : errorCode(errors),
    errors,
    evidence,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeRelayHandshakeEvidence(input = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeRelayHandshakeEvidence(input, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_RELAY_HANDSHAKE_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_RELAY_HANDSHAKE_EVIDENCE_PHASE,
      contract_version: INVENTORY_BRIDGE_RELAY_HANDSHAKE_CONTRACT_VERSION,
      bridge_protocol_version: INVENTORY_BRIDGE_RELAY_HANDSHAKE_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_RELAY_HANDSHAKE_STATUS.BLOCKED,
      validation,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      relay_enforcement_still_required: true,
      ingestion_validation_still_required_per_event: true,
      evidence_projection_only: true,
      projected_at: projectedAt,
      guardrails: INVENTORY_BRIDGE_RELAY_HANDSHAKE_GUARDRAILS,
    };
  }

  const evidence = validation.evidence;
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_RELAY_HANDSHAKE_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_RELAY_HANDSHAKE_EVIDENCE_PHASE,
    contract_version: INVENTORY_BRIDGE_RELAY_HANDSHAKE_CONTRACT_VERSION,
    bridge_protocol_version: INVENTORY_BRIDGE_RELAY_HANDSHAKE_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_RELAY_HANDSHAKE_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_RELAY_HANDSHAKE_STATUS.CLOSED_PENDING_FUTURE_ENFORCEMENT,
    source_device_id: evidence.source_device_id,
    environment: evidence.environment,
    store_id: evidence.store_id,
    inventory_instance_id: evidence.inventory_instance_id,
    relay_instance_ref: evidence.relay_instance_ref || validation.expected_scope.relay_instance_ref || null,
    inventory_candidate_status: evidence.inventory_candidate_status,
    scanops_preflight_phase: evidence.scanops_preflight_phase,
    scanops_candidate_acceptance_status: evidence.status,
    relay_readiness_preflight_accepted: true,
    relay_enforcement_candidate_accepted: true,
    handshake_evidence_closed: true,
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
    relay_enforcement_still_required: true,
    ingestion_validation_still_required_per_event: true,
    evidence_projection_only: true,
    scanops_candidate_accepted_at: evidence.accepted_at,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_RELAY_HANDSHAKE_GUARDRAILS,
  };
}

export function getInventoryBridgeRelayHandshakeEvidenceSafeSummary(input = {}) {
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
    relay_instance_ref: projection.relay_instance_ref || null,
    handshake_evidence_closed: projection.handshake_evidence_closed ?? null,
    relay_enforcement_allowed: projection.relay_enforcement_allowed ?? null,
    relay_transport_allowed: projection.relay_transport_allowed ?? null,
    event_transport_allowed: projection.event_transport_allowed ?? null,
    event_sync_allowed: projection.event_sync_allowed ?? null,
    event_ingestion_allowed: projection.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: projection.inventory_mutation_allowed ?? null,
    relay_enforcement_still_required: projection.relay_enforcement_still_required ?? null,
    ingestion_validation_still_required_per_event: projection.ingestion_validation_still_required_per_event ?? null,
    evidence_projection_only: projection.evidence_projection_only ?? null,
    projected_at: projection.projected_at || null,
  };
}

export function assertNoInventoryBridgeRelayHandshakeEvidenceOperationalMutation() {
  return INVENTORY_BRIDGE_RELAY_HANDSHAKE_GUARDRAILS;
}
