export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PHASE = '1D-D-AL';
export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_INVENTORY_SOURCE_PHASE = '1D-D-AJ';
export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_SCANOPS_SOURCE_PHASE = '1D-D-AK';
export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_STATUS = Object.freeze({
  PROJECTED_LOCKED: 'BRIDGE_STACK_READINESS_REVIEW_PROJECTED_LOCKED_NON_OPERATIONAL',
  BLOCKED: 'BRIDGE_STACK_READINESS_REVIEW_BLOCKED',
});

export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PROJECTED',
  INVALID: 'BRIDGE_STACK_READINESS_REVIEW_INPUT_INVALID',
  INVENTORY_STACK_PHASE_MISMATCH: 'BRIDGE_STACK_READINESS_REVIEW_INVENTORY_STACK_PHASE_MISMATCH',
  INVENTORY_STACK_STATUS_MISMATCH: 'BRIDGE_STACK_READINESS_REVIEW_INVENTORY_STACK_STATUS_MISMATCH',
  SCANOPS_ACCEPTANCE_MISSING: 'BRIDGE_STACK_READINESS_REVIEW_SCANOPS_ACCEPTANCE_MISSING',
  SCANOPS_ACCEPTANCE_STATUS_MISMATCH: 'BRIDGE_STACK_READINESS_REVIEW_SCANOPS_ACCEPTANCE_STATUS_MISMATCH',
  SCANOPS_ACCEPTANCE_PHASE_MISMATCH: 'BRIDGE_STACK_READINESS_REVIEW_SCANOPS_ACCEPTANCE_PHASE_MISMATCH',
  SCOPE_MISMATCH: 'BRIDGE_STACK_READINESS_REVIEW_SCOPE_MISMATCH',
  REVIEW_ORDER_MISSING: 'BRIDGE_STACK_READINESS_REVIEW_ORDER_MISSING',
  UNSAFE_CAPABILITY_ENABLED: 'BRIDGE_STACK_READINESS_REVIEW_UNSAFE_CAPABILITY_ENABLED',
});

export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_ORDER = Object.freeze([
  'Inventory PR #1 / 1D-D-U relay admission evidence projection',
  'ScanOps PR #1 / 1D-D-V relay admission evidence acceptance',
  'ScanOps PR #2 / 1D-D-W relay readiness preflight projection',
  'Inventory PR #2 / 1D-D-X relay readiness preflight acceptance',
  'ScanOps PR #3 / 1D-D-Y relay enforcement candidate acceptance',
  'Inventory PR #3 / 1D-D-Z relay handshake evidence projection',
  'ScanOps PR #4 / 1D-D-AA handshake evidence acceptance',
  'Inventory PR #4 / 1D-D-AB bridge gate projection',
  'ScanOps PR #5 / 1D-D-AC bridge gate acceptance',
  'Inventory PR #5 / 1D-D-AD bridge gate requirements manifest',
  'ScanOps PR #6 / 1D-D-AE gate requirements acknowledgement',
  'Inventory PR #6 / 1D-D-AF bridge release blocker projection',
  'ScanOps PR #7 / 1D-D-AG release blocker acceptance',
  'Inventory PR #7 / 1D-D-AH release plan draft projection',
  'ScanOps PR #8 / 1D-D-AI release plan draft acceptance',
  'Inventory PR #8 / 1D-D-AJ stack evidence manifest projection',
  'ScanOps PR #9 / 1D-D-AK stack evidence acceptance',
  'Inventory PR / 1D-D-AL stack readiness review manifest projection',
]);

export const INVENTORY_BRIDGE_STACK_READINESS_REVIEW_GUARDRAILS = Object.freeze({
  projection_only: true,
  local_validator_only: true,
  review_readiness_only: true,
  non_operational: true,
  merge_allowed: false,
  release_allowed: false,
  runtime_activation_allowed: false,
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

function unsafe(input = {}) {
  return input.operationally_enabled === true
    || input.executable === true
    || input.merge_allowed === true
    || input.release_allowed === true
    || input.runtime_activation_allowed === true
    || input.relay_enforcement_allowed === true
    || input.relay_transport_allowed === true
    || input.event_transport_allowed === true
    || input.event_sync_allowed === true
    || input.event_ingestion_allowed === true
    || input.inventory_mutation_allowed === true
    || input.capabilities_enabled === true;
}

function scopeMatches(inventoryManifest = {}, scanOpsState = {}, scope = {}) {
  if (scope.source_device_id && inventoryManifest.source_device_id !== scope.source_device_id) return false;
  if (scope.environment && inventoryManifest.environment !== scope.environment) return false;
  if (scope.store_id && inventoryManifest.store_id !== scope.store_id) return false;
  if (scope.inventory_instance_id && inventoryManifest.inventory_instance_id !== scope.inventory_instance_id) return false;
  if (scanOpsState.source_device_id && inventoryManifest.source_device_id !== scanOpsState.source_device_id) return false;
  if (scanOpsState.environment && inventoryManifest.environment !== scanOpsState.environment) return false;
  if (scanOpsState.store_id && inventoryManifest.store_id !== scanOpsState.store_id) return false;
  if (scanOpsState.inventory_instance_id && inventoryManifest.inventory_instance_id !== scanOpsState.inventory_instance_id) return false;
  return true;
}

export function validateInventoryBridgeStackReadinessReviewInput(inventoryStackInput = {}, scanOpsStackAcceptanceInput = {}, expectedScopeInput = {}) {
  const inventoryStack = parseJsonMaybe(inventoryStackInput);
  const scanOpsAcceptance = parseJsonMaybe(scanOpsStackAcceptanceInput);
  const expectedScope = normalizeScope(expectedScopeInput);
  const errors = [];

  if (!inventoryStack || typeof inventoryStack !== 'object' || Array.isArray(inventoryStack)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.INVALID,
      errors: ['Inventory stack evidence manifest must be an object or JSON string.'],
      inventory_stack: null,
      scanops_acceptance: null,
      expected_scope: expectedScope,
    };
  }

  if (inventoryStack.phase !== INVENTORY_BRIDGE_STACK_READINESS_REVIEW_INVENTORY_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.INVENTORY_STACK_PHASE_MISMATCH);
  if (inventoryStack.code !== 'INVENTORY_BRIDGE_STACK_EVIDENCE_PROJECTED' || inventoryStack.status !== 'BRIDGE_STACK_EVIDENCE_PROJECTED_LOCKED_NON_OPERATIONAL' || inventoryStack.bridge_gate_locked !== true || inventoryStack.operationally_enabled !== false || inventoryStack.evidence_projection_only !== true) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.INVENTORY_STACK_STATUS_MISMATCH);
  if (!Array.isArray(inventoryStack.required_phases) || inventoryStack.required_phase_count !== inventoryStack.required_phases.length || inventoryStack.required_phase_count < 15) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.REVIEW_ORDER_MISSING);
  if (unsafe(inventoryStack)) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.UNSAFE_CAPABILITY_ENABLED);

  if (!scanOpsAcceptance || typeof scanOpsAcceptance !== 'object' || Array.isArray(scanOpsAcceptance)) {
    errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.SCANOPS_ACCEPTANCE_MISSING);
  } else {
    const state = scanOpsAcceptance.local_state || {};
    if (scanOpsAcceptance.code !== 'SCANOPS_STACK_EVIDENCE_ACCEPTED' || state.status !== 'STACK_EVIDENCE_ACCEPTED_LOCKED_NON_OPERATIONAL' || state.bridge_gate_locked !== true || state.operationally_enabled !== false || state.capabilities_enabled !== false || state.evidence_projection_only !== true) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.SCANOPS_ACCEPTANCE_STATUS_MISMATCH);
    if (state.inventory_stack_evidence_phase !== INVENTORY_BRIDGE_STACK_READINESS_REVIEW_INVENTORY_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.SCANOPS_ACCEPTANCE_PHASE_MISMATCH);
    if (unsafe(state)) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.UNSAFE_CAPABILITY_ENABLED);
    if (!scopeMatches(inventoryStack, state, expectedScope)) errors.push(INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.SCOPE_MISMATCH);
  }

  return {
    ok: errors.length === 0,
    code: errors[0] || 'BRIDGE_STACK_READINESS_REVIEW_INPUT_VALID',
    errors,
    inventory_stack: inventoryStack,
    scanops_acceptance: scanOpsAcceptance,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeStackReadinessReviewManifest(inventoryStackInput = {}, scanOpsStackAcceptanceInput = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeStackReadinessReviewInput(inventoryStackInput, scanOpsStackAcceptanceInput, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PHASE,
      bridge_protocol_version: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_STATUS.BLOCKED,
      ready_for_ordered_review: false,
      merge_allowed: false,
      release_allowed: false,
      runtime_activation_allowed: false,
      operationally_enabled: false,
      projected_at: projectedAt,
      validation,
      guardrails: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_GUARDRAILS,
    };
  }

  const inventoryStack = validation.inventory_stack;
  const state = validation.scanops_acceptance.local_state || {};
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PHASE,
    bridge_protocol_version: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_STATUS.PROJECTED_LOCKED,
    source_device_id: inventoryStack.source_device_id,
    environment: inventoryStack.environment,
    store_id: inventoryStack.store_id,
    inventory_instance_id: inventoryStack.inventory_instance_id,
    inventory_stack_evidence_phase: inventoryStack.phase,
    scanops_stack_acceptance_phase: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_SCANOPS_SOURCE_PHASE,
    scanops_acceptance_status: state.status,
    bridge_gate_locked: true,
    ready_for_ordered_review: true,
    merge_allowed: false,
    release_allowed: false,
    runtime_activation_allowed: false,
    operationally_enabled: false,
    review_order: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_ORDER,
    review_order_count: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_ORDER.length,
    relay_enforcement_allowed: false,
    relay_transport_allowed: false,
    event_transport_allowed: false,
    event_sync_allowed: false,
    event_ingestion_allowed: false,
    inventory_mutation_allowed: false,
    evidence_projection_only: true,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_STACK_READINESS_REVIEW_GUARDRAILS,
  };
}

export function getInventoryBridgeStackReadinessReviewSafeSummary(input = {}) {
  const manifest = parseJsonMaybe(input) || {};
  return {
    ok: manifest.ok ?? null,
    code: manifest.code || null,
    status: manifest.status || null,
    phase: manifest.phase || null,
    source_device_id: manifest.source_device_id || null,
    environment: manifest.environment || null,
    store_id: manifest.store_id || null,
    inventory_instance_id: manifest.inventory_instance_id || null,
    bridge_gate_locked: manifest.bridge_gate_locked ?? null,
    ready_for_ordered_review: manifest.ready_for_ordered_review ?? null,
    merge_allowed: manifest.merge_allowed ?? null,
    release_allowed: manifest.release_allowed ?? null,
    runtime_activation_allowed: manifest.runtime_activation_allowed ?? null,
    operationally_enabled: manifest.operationally_enabled ?? null,
    review_order_count: manifest.review_order_count ?? null,
    event_sync_allowed: manifest.event_sync_allowed ?? null,
    event_ingestion_allowed: manifest.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: manifest.inventory_mutation_allowed ?? null,
    projected_at: manifest.projected_at || null,
  };
}

export function assertNoInventoryBridgeStackReadinessReviewOperationalMutation() {
  return INVENTORY_BRIDGE_STACK_READINESS_REVIEW_GUARDRAILS;
}
