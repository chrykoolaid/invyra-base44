export const INVENTORY_BRIDGE_STACK_EVIDENCE_PHASE = '1D-D-AJ';
export const INVENTORY_BRIDGE_STACK_EVIDENCE_SOURCE_PHASE = '1D-D-AH';
export const INVENTORY_BRIDGE_STACK_EVIDENCE_SCANOPS_SOURCE_PHASE = '1D-D-AI';
export const INVENTORY_BRIDGE_STACK_EVIDENCE_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_STACK_EVIDENCE_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_STACK_EVIDENCE_STATUS = Object.freeze({
  PROJECTED_LOCKED: 'BRIDGE_STACK_EVIDENCE_PROJECTED_LOCKED_NON_OPERATIONAL',
  BLOCKED: 'BRIDGE_STACK_EVIDENCE_BLOCKED',
});

export const INVENTORY_BRIDGE_STACK_EVIDENCE_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_BRIDGE_STACK_EVIDENCE_PROJECTED',
  INVALID: 'BRIDGE_STACK_EVIDENCE_INPUT_INVALID',
  PLAN_PHASE_MISMATCH: 'BRIDGE_STACK_EVIDENCE_PLAN_PHASE_MISMATCH',
  PLAN_STATUS_MISMATCH: 'BRIDGE_STACK_EVIDENCE_PLAN_STATUS_MISMATCH',
  PLAN_STEPS_MISSING: 'BRIDGE_STACK_EVIDENCE_PLAN_STEPS_MISSING',
  ACCEPTANCE_MISSING: 'BRIDGE_STACK_EVIDENCE_ACCEPTANCE_MISSING',
  ACCEPTANCE_STATUS_MISMATCH: 'BRIDGE_STACK_EVIDENCE_ACCEPTANCE_STATUS_MISMATCH',
  ACCEPTANCE_PHASE_MISMATCH: 'BRIDGE_STACK_EVIDENCE_ACCEPTANCE_PHASE_MISMATCH',
  SCOPE_MISMATCH: 'BRIDGE_STACK_EVIDENCE_SCOPE_MISMATCH',
  UNSAFE_CAPABILITY_ENABLED: 'BRIDGE_STACK_EVIDENCE_UNSAFE_CAPABILITY_ENABLED',
});

export const INVENTORY_BRIDGE_STACK_EVIDENCE_REQUIRED_PHASES = Object.freeze([
  '1D-D-U',
  '1D-D-V',
  '1D-D-W',
  '1D-D-X',
  '1D-D-Y',
  '1D-D-Z',
  '1D-D-AA',
  '1D-D-AB',
  '1D-D-AC',
  '1D-D-AD',
  '1D-D-AE',
  '1D-D-AF',
  '1D-D-AG',
  '1D-D-AH',
  '1D-D-AI',
]);

export const INVENTORY_BRIDGE_STACK_EVIDENCE_GUARDRAILS = Object.freeze({
  projection_only: true,
  local_validator_only: true,
  stack_evidence_only: true,
  non_operational: true,
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
  return input.executable === true
    || input.release_allowed === true
    || input.relay_enforcement_allowed === true
    || input.relay_transport_allowed === true
    || input.event_transport_allowed === true
    || input.event_sync_allowed === true
    || input.event_ingestion_allowed === true
    || input.inventory_mutation_allowed === true;
}

function scopeMatches(plan = {}, state = {}, scope = {}) {
  if (scope.source_device_id && plan.source_device_id !== scope.source_device_id) return false;
  if (scope.environment && plan.environment !== scope.environment) return false;
  if (scope.store_id && plan.store_id !== scope.store_id) return false;
  if (scope.inventory_instance_id && plan.inventory_instance_id !== scope.inventory_instance_id) return false;
  if (state.source_device_id && plan.source_device_id !== state.source_device_id) return false;
  if (state.environment && plan.environment !== state.environment) return false;
  if (state.store_id && plan.store_id !== state.store_id) return false;
  if (state.inventory_instance_id && plan.inventory_instance_id !== state.inventory_instance_id) return false;
  return true;
}

export function validateInventoryBridgeStackEvidenceInput(planInput = {}, scanOpsAcceptanceInput = {}, expectedScopeInput = {}) {
  const plan = parseJsonMaybe(planInput);
  const scanOpsAcceptance = parseJsonMaybe(scanOpsAcceptanceInput);
  const expectedScope = normalizeScope(expectedScopeInput);
  const errors = [];

  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.INVALID,
      errors: ['Release plan draft must be an object or JSON string.'],
      plan: null,
      scanops_acceptance: null,
      expected_scope: expectedScope,
    };
  }

  if (plan.phase !== INVENTORY_BRIDGE_STACK_EVIDENCE_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.PLAN_PHASE_MISMATCH);
  if (plan.code !== 'INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED' || plan.status !== 'BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED_LOCKED_NON_EXECUTABLE' || plan.bridge_gate_locked !== true || plan.executable !== false || plan.release_allowed !== false || plan.release_pr_required !== true) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.PLAN_STATUS_MISMATCH);
  if (!Array.isArray(plan.plan_steps) || plan.plan_steps.length < 1 || plan.plan_step_count !== plan.plan_steps.length) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.PLAN_STEPS_MISSING);
  if (unsafe(plan)) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.UNSAFE_CAPABILITY_ENABLED);

  if (!scanOpsAcceptance || typeof scanOpsAcceptance !== 'object' || Array.isArray(scanOpsAcceptance)) {
    errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.ACCEPTANCE_MISSING);
  } else {
    const state = scanOpsAcceptance.local_state || {};
    if (scanOpsAcceptance.code !== 'SCANOPS_RELEASE_PLAN_DRAFT_ACCEPTED' || state.status !== 'RELEASE_PLAN_DRAFT_ACCEPTED_LOCKED_NON_EXECUTABLE' || state.bridge_gate_locked !== true || state.executable !== false || state.release_allowed !== false || state.release_pr_required !== true || state.capabilities_enabled !== false) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.ACCEPTANCE_STATUS_MISMATCH);
    if (state.inventory_release_plan_draft_phase !== INVENTORY_BRIDGE_STACK_EVIDENCE_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.ACCEPTANCE_PHASE_MISMATCH);
    if (!scopeMatches(plan, state, expectedScope)) errors.push(INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.SCOPE_MISMATCH);
  }

  return {
    ok: errors.length === 0,
    code: errors[0] || 'BRIDGE_STACK_EVIDENCE_INPUT_VALID',
    errors,
    plan,
    scanops_acceptance: scanOpsAcceptance,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeStackEvidenceManifest(planInput = {}, scanOpsAcceptanceInput = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeStackEvidenceInput(planInput, scanOpsAcceptanceInput, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_STACK_EVIDENCE_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_STACK_EVIDENCE_PHASE,
      bridge_protocol_version: INVENTORY_BRIDGE_STACK_EVIDENCE_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_STACK_EVIDENCE_STATUS.BLOCKED,
      operationally_enabled: false,
      required_phases: [],
      required_phase_count: 0,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      projected_at: projectedAt,
      validation,
      guardrails: INVENTORY_BRIDGE_STACK_EVIDENCE_GUARDRAILS,
    };
  }

  const plan = validation.plan;
  const state = validation.scanops_acceptance.local_state || {};
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_STACK_EVIDENCE_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_STACK_EVIDENCE_PHASE,
    bridge_protocol_version: INVENTORY_BRIDGE_STACK_EVIDENCE_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_STACK_EVIDENCE_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_STACK_EVIDENCE_STATUS.PROJECTED_LOCKED,
    source_device_id: plan.source_device_id,
    environment: plan.environment,
    store_id: plan.store_id,
    inventory_instance_id: plan.inventory_instance_id,
    source_release_plan_draft_phase: plan.phase,
    scanops_release_plan_acceptance_phase: INVENTORY_BRIDGE_STACK_EVIDENCE_SCANOPS_SOURCE_PHASE,
    scanops_acceptance_status: state.status,
    bridge_gate_locked: true,
    operationally_enabled: false,
    required_phases: INVENTORY_BRIDGE_STACK_EVIDENCE_REQUIRED_PHASES,
    required_phase_count: INVENTORY_BRIDGE_STACK_EVIDENCE_REQUIRED_PHASES.length,
    relay_enforcement_allowed: false,
    relay_transport_allowed: false,
    event_transport_allowed: false,
    event_sync_allowed: false,
    event_ingestion_allowed: false,
    inventory_mutation_allowed: false,
    evidence_projection_only: true,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_STACK_EVIDENCE_GUARDRAILS,
  };
}

export function getInventoryBridgeStackEvidenceSafeSummary(input = {}) {
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
    operationally_enabled: manifest.operationally_enabled ?? null,
    required_phase_count: manifest.required_phase_count ?? null,
    event_sync_allowed: manifest.event_sync_allowed ?? null,
    event_ingestion_allowed: manifest.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: manifest.inventory_mutation_allowed ?? null,
    evidence_projection_only: manifest.evidence_projection_only ?? null,
    projected_at: manifest.projected_at || null,
  };
}

export function assertNoInventoryBridgeStackEvidenceOperationalMutation() {
  return INVENTORY_BRIDGE_STACK_EVIDENCE_GUARDRAILS;
}
