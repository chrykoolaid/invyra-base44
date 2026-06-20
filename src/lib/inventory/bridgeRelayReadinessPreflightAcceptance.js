/**
 * bridgeRelayReadinessPreflightAcceptance.js — Inventory Phase 1D-D-X
 *
 * Inventory-side acceptance contract for ScanOps Phase 1D-D-W relay readiness
 * preflight projections.
 *
 * Scope for this phase:
 * - Projection-only and validator-only.
 * - Accepts a ScanOps readiness preflight projection as non-authoritative evidence
 *   that a device has completed current contract checks and is ready for a future
 *   relay enforcement phase.
 * - Does not enforce relay trust, start relay transport, enable event transport,
 *   ingest events, write entities, or mutate Inventory/POS/order/forecasting state.
 *
 * Hard guardrails:
 * - A readiness preflight is not relay enforcement.
 * - Transport trust does not equal ingestion trust.
 * - Future event ingestion validation remains required per event.
 */

export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_PHASE = '1D-D-X';
export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_SOURCE_PHASE = '1D-D-W';
export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CONTRACT_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE = Object.freeze({
  ACCEPTED: 'INVENTORY_RELAY_READINESS_PREFLIGHT_ACCEPTED',
  INVALID: 'RELAY_READINESS_PREFLIGHT_INVALID',
  NOT_READY: 'RELAY_READINESS_PREFLIGHT_NOT_READY',
  STATUS_NOT_READY: 'RELAY_READINESS_STATUS_NOT_READY',
  DEVICE_MISMATCH: 'RELAY_READINESS_DEVICE_MISMATCH',
  ENVIRONMENT_MISMATCH: 'RELAY_READINESS_ENVIRONMENT_MISMATCH',
  STORE_MISMATCH: 'RELAY_READINESS_STORE_MISMATCH',
  INSTANCE_MISMATCH: 'RELAY_READINESS_INSTANCE_MISMATCH',
  PROTOCOL_MISMATCH: 'RELAY_READINESS_PROTOCOL_MISMATCH',
  ENFORCEMENT_ALREADY_ENABLED: 'RELAY_ENFORCEMENT_ALREADY_ENABLED',
  RELAY_TRANSPORT_ALREADY_ENABLED: 'RELAY_TRANSPORT_ALREADY_ENABLED',
  EVENT_TRANSPORT_ALREADY_ENABLED: 'EVENT_TRANSPORT_ALREADY_ENABLED',
  EVENT_SYNC_ALREADY_ENABLED: 'EVENT_SYNC_ALREADY_ENABLED',
  INGESTION_ALREADY_ALLOWED: 'EVENT_INGESTION_ALREADY_ALLOWED',
});

export const INVENTORY_BRIDGE_RELAY_ENFORCEMENT_CANDIDATE_STATUS = Object.freeze({
  PROJECTED_PENDING_ENFORCEMENT: 'RELAY_ENFORCEMENT_CANDIDATE_PROJECTED_PENDING_ENFORCEMENT',
  BLOCKED: 'RELAY_ENFORCEMENT_CANDIDATE_BLOCKED',
});

export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_REQUIRED_FIELDS = Object.freeze([
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
  'relay_admission_evidence_accepted',
  'relay_enforcement_still_required',
  'can_start_relay_transport',
  'can_enable_event_transport',
  'can_sync_events',
  'can_call_inventory_ingestion',
  'event_ingestion_allowed',
  'ingestion_validation_still_required_per_event',
  'evidence_projection_only',
  'projected_at',
]);

export const INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_GUARDRAILS = Object.freeze({
  inventory_relay_readiness_preflight_acceptance_projection_only: true,
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
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.PROTOCOL_MISMATCH,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.DEVICE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.ENVIRONMENT_MISMATCH,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.STORE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.INSTANCE_MISMATCH,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.STATUS_NOT_READY,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.NOT_READY,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.ENFORCEMENT_ALREADY_ENABLED,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.RELAY_TRANSPORT_ALREADY_ENABLED,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.EVENT_TRANSPORT_ALREADY_ENABLED,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.EVENT_SYNC_ALREADY_ENABLED,
    INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.INGESTION_ALREADY_ALLOWED,
  ];

  return priority.find((code) => errors.includes(code))
    || INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.INVALID;
}

export function validateInventoryBridgeRelayReadinessPreflightProjection(input = {}, expectedScopeInput = {}) {
  const preflight = parseJsonMaybe(input);
  const expectedScope = normalizeExpectedScope(expectedScopeInput);
  const errors = [];

  if (!preflight || typeof preflight !== 'object' || Array.isArray(preflight)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.INVALID,
      errors: ['Relay readiness preflight must be an object or JSON string.'],
      preflight: null,
      expected_scope: expectedScope,
    };
  }

  for (const field of INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_REQUIRED_FIELDS) {
    if (preflight[field] === null || preflight[field] === undefined || preflight[field] === '') {
      errors.push(`Missing ${field}.`);
    }
  }

  if (preflight.schema_version !== INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_SCHEMA_VERSION) {
    errors.push('schema_version mismatch.');
  }

  if (preflight.phase !== INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_SOURCE_PHASE) {
    errors.push('relay readiness preflight phase mismatch.');
  }

  if (preflight.contract_version !== INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CONTRACT_VERSION) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.PROTOCOL_MISMATCH);
  }

  if (preflight.bridge_protocol_version !== INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_PROTOCOL_VERSION) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.PROTOCOL_MISMATCH);
  }

  if (expectedScope.source_device_id && preflight.source_device_id !== expectedScope.source_device_id) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.DEVICE_MISMATCH);
  }

  if (expectedScope.environment && preflight.environment !== expectedScope.environment) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.ENVIRONMENT_MISMATCH);
  }

  if (expectedScope.store_id && preflight.store_id !== expectedScope.store_id) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.STORE_MISMATCH);
  }

  if (expectedScope.inventory_instance_id && preflight.inventory_instance_id !== expectedScope.inventory_instance_id) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.INSTANCE_MISMATCH);
  }

  if (preflight.code !== 'SCANOPS_RELAY_READINESS_PREFLIGHT_PROJECTED') {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.NOT_READY);
  }

  if (preflight.status !== 'READY_PENDING_RELAY_ENFORCEMENT') {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.STATUS_NOT_READY);
  }

  if (preflight.relay_admission_evidence_accepted !== true) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.NOT_READY);
  }

  if (preflight.relay_enforcement_still_required !== true) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.ENFORCEMENT_ALREADY_ENABLED);
  }

  if (preflight.can_start_relay_transport !== false) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.RELAY_TRANSPORT_ALREADY_ENABLED);
  }

  if (preflight.can_enable_event_transport !== false) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.EVENT_TRANSPORT_ALREADY_ENABLED);
  }

  if (preflight.can_sync_events !== false) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.EVENT_SYNC_ALREADY_ENABLED);
  }

  if (preflight.can_call_inventory_ingestion !== false || preflight.event_ingestion_allowed !== false) {
    errors.push(INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.INGESTION_ALREADY_ALLOWED);
  }

  if (preflight.ingestion_validation_still_required_per_event !== true) {
    errors.push('ingestion validation must remain required per future event.');
  }

  if (preflight.evidence_projection_only !== true) {
    errors.push('relay readiness preflight must remain projection-only.');
  }

  return {
    ok: errors.length === 0,
    code: errors.length === 0
      ? 'RELAY_READINESS_PREFLIGHT_VALID'
      : errorCode(errors),
    errors,
    preflight,
    expected_scope: expectedScope,
  };
}

export function acceptInventoryBridgeRelayReadinessPreflightProjection(input = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeRelayReadinessPreflightProjection(input, expectedScopeInput);
  const acceptedAt = options.accepted_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      code: validation.code,
      validation,
      enforcement_candidate: {
        status: INVENTORY_BRIDGE_RELAY_ENFORCEMENT_CANDIDATE_STATUS.BLOCKED,
        relay_enforcement_allowed: false,
        relay_transport_allowed: false,
        event_transport_allowed: false,
        event_sync_allowed: false,
        event_ingestion_allowed: false,
        inventory_mutation_allowed: false,
      },
      guardrails: INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_GUARDRAILS,
    };
  }

  const preflight = validation.preflight;
  const enforcementCandidate = {
    status: INVENTORY_BRIDGE_RELAY_ENFORCEMENT_CANDIDATE_STATUS.PROJECTED_PENDING_ENFORCEMENT,
    source_device_id: preflight.source_device_id,
    environment: preflight.environment,
    store_id: preflight.store_id,
    inventory_instance_id: preflight.inventory_instance_id,
    relay_instance_ref: preflight.relay_instance_ref || validation.expected_scope.relay_instance_ref || null,
    scanops_preflight_phase: preflight.phase,
    scanops_preflight_projected_at: preflight.projected_at,
    relay_readiness_preflight_accepted: true,
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
    accepted_at: acceptedAt,
  };

  return {
    ok: true,
    code: INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_CODE.ACCEPTED,
    validation,
    enforcement_candidate: enforcementCandidate,
    guardrails: INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_GUARDRAILS,
  };
}

export function getInventoryBridgeRelayReadinessPreflightAcceptanceSafeSummary(input = {}) {
  const acceptance = parseJsonMaybe(input) || {};
  const candidate = acceptance.enforcement_candidate || {};
  return {
    ok: acceptance.ok ?? null,
    code: acceptance.code || null,
    candidate_status: candidate.status || null,
    source_device_id: candidate.source_device_id || null,
    environment: candidate.environment || null,
    store_id: candidate.store_id || null,
    inventory_instance_id: candidate.inventory_instance_id || null,
    relay_instance_ref: candidate.relay_instance_ref || null,
    scanops_preflight_phase: candidate.scanops_preflight_phase || null,
    relay_readiness_preflight_accepted: candidate.relay_readiness_preflight_accepted ?? null,
    relay_enforcement_allowed: candidate.relay_enforcement_allowed ?? null,
    relay_transport_allowed: candidate.relay_transport_allowed ?? null,
    event_transport_allowed: candidate.event_transport_allowed ?? null,
    event_sync_allowed: candidate.event_sync_allowed ?? null,
    event_ingestion_allowed: candidate.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: candidate.inventory_mutation_allowed ?? null,
    relay_enforcement_still_required: candidate.relay_enforcement_still_required ?? null,
    ingestion_validation_still_required_per_event: candidate.ingestion_validation_still_required_per_event ?? null,
    evidence_projection_only: candidate.evidence_projection_only ?? null,
    accepted_at: candidate.accepted_at || null,
  };
}

export function assertNoInventoryBridgeRelayReadinessPreflightAcceptanceOperationalMutation() {
  return INVENTORY_BRIDGE_RELAY_READINESS_PREFLIGHT_ACCEPTANCE_GUARDRAILS;
}
