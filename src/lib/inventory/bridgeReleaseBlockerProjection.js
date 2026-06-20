export const INVENTORY_BRIDGE_RELEASE_BLOCKER_PHASE = '1D-D-AF';
export const INVENTORY_BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_PHASE = '1D-D-AD';
export const INVENTORY_BRIDGE_RELEASE_BLOCKER_ACK_PHASE = '1D-D-AE';
export const INVENTORY_BRIDGE_RELEASE_BLOCKER_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_RELEASE_BLOCKER_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_RELEASE_BLOCKER_STATUS = Object.freeze({
  BLOCKED_PENDING_RELEASE_PLAN: 'BRIDGE_RELEASE_BLOCKED_PENDING_EXPLICIT_RELEASE_PLAN',
  BLOCKED: 'BRIDGE_RELEASE_BLOCKER_INPUT_BLOCKED',
});

export const INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_BRIDGE_RELEASE_BLOCKER_PROJECTED',
  INVALID: 'BRIDGE_RELEASE_BLOCKER_INPUT_INVALID',
  REQUIREMENTS_PHASE_MISMATCH: 'BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_PHASE_MISMATCH',
  REQUIREMENTS_STATUS_MISMATCH: 'BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_STATUS_MISMATCH',
  REQUIREMENTS_LIST_MISSING: 'BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_LIST_MISSING',
  ACK_MISSING: 'BRIDGE_RELEASE_BLOCKER_ACK_MISSING',
  ACK_STATUS_MISMATCH: 'BRIDGE_RELEASE_BLOCKER_ACK_STATUS_MISMATCH',
  ACK_PHASE_MISMATCH: 'BRIDGE_RELEASE_BLOCKER_ACK_PHASE_MISMATCH',
  SCOPE_MISMATCH: 'BRIDGE_RELEASE_BLOCKER_SCOPE_MISMATCH',
  UNSAFE_CAPABILITY_ENABLED: 'BRIDGE_RELEASE_BLOCKER_UNSAFE_CAPABILITY_ENABLED',
});

export const INVENTORY_BRIDGE_RELEASE_BLOCKERS = Object.freeze([
  'explicit_release_plan_missing',
  'relay_enforcement_not_released',
  'relay_transport_not_released',
  'event_transport_not_released',
  'event_sync_not_released',
  'event_ingestion_not_released',
  'inventory_write_path_not_released',
  'stock_price_pos_order_forecast_mutation_not_released',
]);

export const INVENTORY_BRIDGE_RELEASE_BLOCKER_GUARDRAILS = Object.freeze({
  projection_only: true,
  local_validator_only: true,
  release_blocker_only: true,
  no_relay_enforcement: true,
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
  explicit_release_plan_required: true,
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
  };
}

function hasUnsafeCapability(input = {}) {
  return input.relay_enforcement_allowed === true
    || input.relay_transport_allowed === true
    || input.event_transport_allowed === true
    || input.event_sync_allowed === true
    || input.event_ingestion_allowed === true
    || input.inventory_mutation_allowed === true
    || input.release_allowed === true;
}

function scopeMatches(manifest = {}, ackState = {}, expectedScope = {}) {
  if (expectedScope.source_device_id && manifest.source_device_id !== expectedScope.source_device_id) return false;
  if (expectedScope.environment && manifest.environment !== expectedScope.environment) return false;
  if (expectedScope.store_id && manifest.store_id !== expectedScope.store_id) return false;
  if (expectedScope.inventory_instance_id && manifest.inventory_instance_id !== expectedScope.inventory_instance_id) return false;
  if (ackState.source_device_id && manifest.source_device_id !== ackState.source_device_id) return false;
  if (ackState.environment && manifest.environment !== ackState.environment) return false;
  if (ackState.store_id && manifest.store_id !== ackState.store_id) return false;
  if (ackState.inventory_instance_id && manifest.inventory_instance_id !== ackState.inventory_instance_id) return false;
  return true;
}

export function validateInventoryBridgeReleaseBlockerInput(requirementsInput = {}, ackInput = {}, expectedScopeInput = {}) {
  const requirements = parseJsonMaybe(requirementsInput);
  const ack = parseJsonMaybe(ackInput);
  const expectedScope = normalizeScope(expectedScopeInput);
  const errors = [];

  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.INVALID,
      errors: ['Requirements manifest must be an object or JSON string.'],
      requirements: null,
      ack: null,
      expected_scope: expectedScope,
    };
  }

  if (requirements.phase !== INVENTORY_BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_PHASE) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.REQUIREMENTS_PHASE_MISMATCH);
  if (requirements.code !== 'INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROJECTED' || requirements.status !== 'BRIDGE_GATE_REQUIREMENTS_PROJECTED_LOCKED' || requirements.bridge_gate_locked !== true || requirements.later_release_phase_required !== true) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.REQUIREMENTS_STATUS_MISMATCH);
  if (!Array.isArray(requirements.requirements) || requirements.requirements.length < 1 || requirements.requirement_count !== requirements.requirements.length) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.REQUIREMENTS_LIST_MISSING);
  if (hasUnsafeCapability(requirements)) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.UNSAFE_CAPABILITY_ENABLED);

  if (!ack || typeof ack !== 'object' || Array.isArray(ack)) {
    errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.ACK_MISSING);
  } else {
    const ackState = ack.local_state || {};
    if (ack.code !== 'SCANOPS_GATE_REQUIREMENTS_ACCEPTED' || ackState.status !== 'GATE_REQUIREMENTS_ACCEPTED_LOCKED_PENDING_RELEASE' || ackState.bridge_gate_locked !== true || ackState.later_release_required !== true || ackState.capabilities_enabled !== false) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.ACK_STATUS_MISMATCH);
    if (ackState.inventory_manifest_phase !== INVENTORY_BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_PHASE) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.ACK_PHASE_MISMATCH);
    if (!scopeMatches(requirements, ackState, expectedScope)) errors.push(INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.SCOPE_MISMATCH);
  }

  return {
    ok: errors.length === 0,
    code: errors[0] || 'BRIDGE_RELEASE_BLOCKER_INPUT_VALID',
    errors,
    requirements,
    ack,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeReleaseBlocker(requirementsInput = {}, ackInput = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeReleaseBlockerInput(requirementsInput, ackInput, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_RELEASE_BLOCKER_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_RELEASE_BLOCKER_PHASE,
      bridge_protocol_version: INVENTORY_BRIDGE_RELEASE_BLOCKER_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_RELEASE_BLOCKER_STATUS.BLOCKED,
      release_allowed: false,
      release_plan_required: true,
      blockers: INVENTORY_BRIDGE_RELEASE_BLOCKERS,
      blocker_count: INVENTORY_BRIDGE_RELEASE_BLOCKERS.length,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      projected_at: projectedAt,
      validation,
      guardrails: INVENTORY_BRIDGE_RELEASE_BLOCKER_GUARDRAILS,
    };
  }

  const requirements = validation.requirements;
  const ackState = validation.ack.local_state || {};
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_RELEASE_BLOCKER_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_RELEASE_BLOCKER_PHASE,
    bridge_protocol_version: INVENTORY_BRIDGE_RELEASE_BLOCKER_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_RELEASE_BLOCKER_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_RELEASE_BLOCKER_STATUS.BLOCKED_PENDING_RELEASE_PLAN,
    source_device_id: requirements.source_device_id,
    environment: requirements.environment,
    store_id: requirements.store_id,
    inventory_instance_id: requirements.inventory_instance_id,
    source_requirements_phase: requirements.phase,
    source_ack_phase: INVENTORY_BRIDGE_RELEASE_BLOCKER_ACK_PHASE,
    scanops_ack_status: ackState.status,
    bridge_gate_locked: true,
    release_allowed: false,
    release_plan_required: true,
    blockers: INVENTORY_BRIDGE_RELEASE_BLOCKERS,
    blocker_count: INVENTORY_BRIDGE_RELEASE_BLOCKERS.length,
    relay_enforcement_allowed: false,
    relay_transport_allowed: false,
    event_transport_allowed: false,
    event_sync_allowed: false,
    event_ingestion_allowed: false,
    inventory_mutation_allowed: false,
    evidence_projection_only: true,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_RELEASE_BLOCKER_GUARDRAILS,
  };
}

export function getInventoryBridgeReleaseBlockerSafeSummary(input = {}) {
  const blocker = parseJsonMaybe(input) || {};
  return {
    ok: blocker.ok ?? null,
    code: blocker.code || null,
    status: blocker.status || null,
    phase: blocker.phase || null,
    source_device_id: blocker.source_device_id || null,
    environment: blocker.environment || null,
    store_id: blocker.store_id || null,
    inventory_instance_id: blocker.inventory_instance_id || null,
    bridge_gate_locked: blocker.bridge_gate_locked ?? null,
    release_allowed: blocker.release_allowed ?? null,
    release_plan_required: blocker.release_plan_required ?? null,
    blocker_count: blocker.blocker_count ?? null,
    event_sync_allowed: blocker.event_sync_allowed ?? null,
    event_ingestion_allowed: blocker.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: blocker.inventory_mutation_allowed ?? null,
    evidence_projection_only: blocker.evidence_projection_only ?? null,
    projected_at: blocker.projected_at || null,
  };
}

export function assertNoInventoryBridgeReleaseBlockerOperationalMutation() {
  return INVENTORY_BRIDGE_RELEASE_BLOCKER_GUARDRAILS;
}
