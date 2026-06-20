/**
 * bridgeGateRequirementsManifest.js — Inventory Phase 1D-D-AD
 *
 * Projection-only manifest for the future bridge gate release requirements.
 * This phase reads a locked bridge gate and returns a non-operational checklist.
 * It does not start transport, sync, ingestion, writes, or inventory mutation.
 */

export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_PHASE = '1D-D-AD';
export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_SOURCE_PHASE = '1D-D-AB';
export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_STATUS = Object.freeze({
  PROJECTED_LOCKED: 'BRIDGE_GATE_REQUIREMENTS_PROJECTED_LOCKED',
  BLOCKED: 'BRIDGE_GATE_REQUIREMENTS_BLOCKED',
});

export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROJECTED',
  INVALID: 'BRIDGE_GATE_REQUIREMENTS_INPUT_INVALID',
  SOURCE_PHASE_MISMATCH: 'BRIDGE_GATE_SOURCE_PHASE_MISMATCH',
  SOURCE_GATE_NOT_LOCKED: 'BRIDGE_GATE_SOURCE_NOT_LOCKED',
  DEVICE_MISMATCH: 'BRIDGE_GATE_REQUIREMENTS_DEVICE_MISMATCH',
  ENVIRONMENT_MISMATCH: 'BRIDGE_GATE_REQUIREMENTS_ENVIRONMENT_MISMATCH',
  STORE_MISMATCH: 'BRIDGE_GATE_REQUIREMENTS_STORE_MISMATCH',
  INSTANCE_MISMATCH: 'BRIDGE_GATE_REQUIREMENTS_INSTANCE_MISMATCH',
  UNSAFE_CAPABILITY_ENABLED: 'BRIDGE_GATE_UNSAFE_CAPABILITY_ENABLED',
});

export const INVENTORY_BRIDGE_GATE_REQUIREMENTS = Object.freeze([
  'separate_release_phase_required',
  'device_scope_recheck_required',
  'store_scope_recheck_required',
  'environment_scope_recheck_required',
  'transport_contract_required',
  'event_schema_check_required',
  'idempotency_check_required',
  'inbound_ledger_required',
  'inventory_workflow_guard_required',
  'price_pos_order_forecast_mutation_block_required',
]);

export const INVENTORY_BRIDGE_GATE_REQUIREMENTS_GUARDRAILS = Object.freeze({
  projection_only: true,
  local_validator_only: true,
  no_relay_transport: true,
  no_event_transport: true,
  no_event_sync: true,
  no_event_ingestion: true,
  no_entity_writes: true,
  no_device_registry_writes: true,
  no_inventory_sync_writes: true,
  no_stock_mutation: true,
  no_price_mutation: true,
  no_pos_order_forecast_mutation: true,
  no_item_master_mutation: true,
  later_release_phase_required: true,
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

function normalizeScope(input = {}) {
  const scope = parseJsonMaybe(input) || {};
  return {
    source_device_id: scope.source_device_id || scope.device_id || null,
    environment: scope.environment || null,
    store_id: scope.store_id || null,
    inventory_instance_id: scope.inventory_instance_id || null,
    relay_instance_ref: scope.relay_instance_ref || null,
  };
}

function hasUnsafeCapability(gate) {
  return gate.relay_enforcement_allowed === true
    || gate.relay_transport_allowed === true
    || gate.event_transport_allowed === true
    || gate.event_sync_allowed === true
    || gate.event_ingestion_allowed === true
    || gate.inventory_mutation_allowed === true;
}

export function validateInventoryBridgeGateRequirementsInput(input = {}, expectedScopeInput = {}) {
  const gate = parseJsonMaybe(input);
  const expectedScope = normalizeScope(expectedScopeInput);
  const errors = [];

  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) {
    return { ok: false, code: INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.INVALID, errors: ['Gate input must be an object or JSON string.'], gate: null, expected_scope: expectedScope };
  }

  if (gate.phase !== INVENTORY_BRIDGE_GATE_REQUIREMENTS_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.SOURCE_PHASE_MISMATCH);
  if (gate.code !== 'INVENTORY_BRIDGE_GATE_PROJECTED') errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.SOURCE_GATE_NOT_LOCKED);
  if (gate.status !== 'BRIDGE_GATE_LOCKED_PENDING_EXPLICIT_ENFORCEMENT') errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.SOURCE_GATE_NOT_LOCKED);
  if (gate.bridge_gate_locked !== true) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.SOURCE_GATE_NOT_LOCKED);
  if (gate.explicit_future_enforcement_phase_required !== true) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.SOURCE_GATE_NOT_LOCKED);
  if (expectedScope.source_device_id && gate.source_device_id !== expectedScope.source_device_id) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.DEVICE_MISMATCH);
  if (expectedScope.environment && gate.environment !== expectedScope.environment) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.ENVIRONMENT_MISMATCH);
  if (expectedScope.store_id && gate.store_id !== expectedScope.store_id) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.STORE_MISMATCH);
  if (expectedScope.inventory_instance_id && gate.inventory_instance_id !== expectedScope.inventory_instance_id) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.INSTANCE_MISMATCH);
  if (hasUnsafeCapability(gate)) errors.push(INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.UNSAFE_CAPABILITY_ENABLED);

  return {
    ok: errors.length === 0,
    code: errors[0] || 'BRIDGE_GATE_REQUIREMENTS_INPUT_VALID',
    errors,
    gate,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeGateRequirementsManifest(input = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeGateRequirementsInput(input, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_GATE_REQUIREMENTS_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_GATE_REQUIREMENTS_PHASE,
      bridge_protocol_version: INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_GATE_REQUIREMENTS_STATUS.BLOCKED,
      requirements: [],
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      projected_at: projectedAt,
      validation,
      guardrails: INVENTORY_BRIDGE_GATE_REQUIREMENTS_GUARDRAILS,
    };
  }

  const gate = validation.gate;
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_GATE_REQUIREMENTS_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_GATE_REQUIREMENTS_PHASE,
    bridge_protocol_version: INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_GATE_REQUIREMENTS_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_GATE_REQUIREMENTS_STATUS.PROJECTED_LOCKED,
    source_device_id: gate.source_device_id,
    environment: gate.environment,
    store_id: gate.store_id,
    inventory_instance_id: gate.inventory_instance_id,
    relay_instance_ref: gate.relay_instance_ref || validation.expected_scope.relay_instance_ref || null,
    source_gate_phase: gate.phase,
    source_gate_status: gate.status,
    bridge_gate_locked: true,
    later_release_phase_required: true,
    requirements: INVENTORY_BRIDGE_GATE_REQUIREMENTS,
    requirement_count: INVENTORY_BRIDGE_GATE_REQUIREMENTS.length,
    relay_transport_allowed: false,
    event_transport_allowed: false,
    event_sync_allowed: false,
    event_ingestion_allowed: false,
    inventory_mutation_allowed: false,
    evidence_projection_only: true,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_GATE_REQUIREMENTS_GUARDRAILS,
  };
}

export function getInventoryBridgeGateRequirementsSafeSummary(input = {}) {
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
    later_release_phase_required: projection.later_release_phase_required ?? null,
    requirement_count: projection.requirement_count ?? null,
    event_sync_allowed: projection.event_sync_allowed ?? null,
    event_ingestion_allowed: projection.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: projection.inventory_mutation_allowed ?? null,
    evidence_projection_only: projection.evidence_projection_only ?? null,
    projected_at: projection.projected_at || null,
  };
}

export function assertNoInventoryBridgeGateRequirementsOperationalMutation() {
  return INVENTORY_BRIDGE_GATE_REQUIREMENTS_GUARDRAILS;
}
