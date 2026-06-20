export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PHASE = '1D-D-AH';
export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SOURCE_PHASE = '1D-D-AF';
export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_SOURCE_PHASE = '1D-D-AG';
export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SCHEMA_VERSION = '1.0.0';
export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROTOCOL_VERSION = '1.0.0';

export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_STATUS = Object.freeze({
  PROJECTED_LOCKED: 'BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED_LOCKED_NON_EXECUTABLE',
  BLOCKED: 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKED',
});

export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE = Object.freeze({
  PROJECTED: 'INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED',
  INVALID: 'BRIDGE_RELEASE_PLAN_DRAFT_INPUT_INVALID',
  RELEASE_BLOCKER_PHASE_MISMATCH: 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_PHASE_MISMATCH',
  RELEASE_BLOCKER_STATUS_MISMATCH: 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_STATUS_MISMATCH',
  RELEASE_BLOCKER_LIST_MISSING: 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_LIST_MISSING',
  SCANOPS_ACCEPTANCE_MISSING: 'BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_ACCEPTANCE_MISSING',
  SCANOPS_ACCEPTANCE_STATUS_MISMATCH: 'BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_STATUS_MISMATCH',
  SCANOPS_ACCEPTANCE_PHASE_MISMATCH: 'BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_PHASE_MISMATCH',
  SCOPE_MISMATCH: 'BRIDGE_RELEASE_PLAN_DRAFT_SCOPE_MISMATCH',
  UNSAFE_CAPABILITY_ENABLED: 'BRIDGE_RELEASE_PLAN_DRAFT_UNSAFE_CAPABILITY_ENABLED',
});

export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_STEPS = Object.freeze([
  'confirm_stacked_prs_verified_in_order',
  'confirm_device_scope_rechecked',
  'confirm_store_environment_scope_rechecked',
  'confirm_event_schema_review_required',
  'confirm_idempotency_review_required',
  'confirm_inbound_ledger_review_required',
  'confirm_inventory_workflow_guard_review_required',
  'confirm_rollback_plan_required',
  'confirm_future_release_requires_new_explicit_pr',
]);

export const INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_GUARDRAILS = Object.freeze({
  projection_only: true,
  local_validator_only: true,
  draft_plan_only: true,
  non_executable: true,
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
  separate_release_pr_required: true,
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

function anyCapabilityEnabled(input = {}) {
  return input.release_allowed === true
    || input.relay_enforcement_allowed === true
    || input.relay_transport_allowed === true
    || input.event_transport_allowed === true
    || input.event_sync_allowed === true
    || input.event_ingestion_allowed === true
    || input.inventory_mutation_allowed === true;
}

function scopeMatches(blocker = {}, state = {}, scope = {}) {
  if (scope.source_device_id && blocker.source_device_id !== scope.source_device_id) return false;
  if (scope.environment && blocker.environment !== scope.environment) return false;
  if (scope.store_id && blocker.store_id !== scope.store_id) return false;
  if (scope.inventory_instance_id && blocker.inventory_instance_id !== scope.inventory_instance_id) return false;
  if (state.source_device_id && blocker.source_device_id !== state.source_device_id) return false;
  if (state.environment && blocker.environment !== state.environment) return false;
  if (state.store_id && blocker.store_id !== state.store_id) return false;
  if (state.inventory_instance_id && blocker.inventory_instance_id !== state.inventory_instance_id) return false;
  return true;
}

export function validateInventoryBridgeReleasePlanDraftInput(blockerInput = {}, scanOpsAcceptanceInput = {}, expectedScopeInput = {}) {
  const blocker = parseJsonMaybe(blockerInput);
  const scanOpsAcceptance = parseJsonMaybe(scanOpsAcceptanceInput);
  const expectedScope = normalizeScope(expectedScopeInput);
  const errors = [];

  if (!blocker || typeof blocker !== 'object' || Array.isArray(blocker)) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.INVALID,
      errors: ['Release blocker must be an object or JSON string.'],
      blocker: null,
      scanops_acceptance: null,
      expected_scope: expectedScope,
    };
  }

  if (blocker.phase !== INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.RELEASE_BLOCKER_PHASE_MISMATCH);
  if (blocker.code !== 'INVENTORY_BRIDGE_RELEASE_BLOCKER_PROJECTED' || blocker.status !== 'BRIDGE_RELEASE_BLOCKED_PENDING_EXPLICIT_RELEASE_PLAN' || blocker.bridge_gate_locked !== true || blocker.release_allowed !== false || blocker.release_plan_required !== true) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.RELEASE_BLOCKER_STATUS_MISMATCH);
  if (!Array.isArray(blocker.blockers) || blocker.blockers.length < 1 || blocker.blocker_count !== blocker.blockers.length) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.RELEASE_BLOCKER_LIST_MISSING);
  if (anyCapabilityEnabled(blocker)) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.UNSAFE_CAPABILITY_ENABLED);

  if (!scanOpsAcceptance || typeof scanOpsAcceptance !== 'object' || Array.isArray(scanOpsAcceptance)) {
    errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.SCANOPS_ACCEPTANCE_MISSING);
  } else {
    const state = scanOpsAcceptance.local_state || {};
    if (scanOpsAcceptance.code !== 'SCANOPS_RELEASE_BLOCKER_ACCEPTED' || state.status !== 'RELEASE_BLOCKER_ACCEPTED_LOCKED_PENDING_RELEASE_PLAN' || state.bridge_gate_locked !== true || state.release_allowed !== false || state.release_plan_required !== true || state.capabilities_enabled !== false) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.SCANOPS_ACCEPTANCE_STATUS_MISMATCH);
    if (state.inventory_release_blocker_phase !== INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SOURCE_PHASE) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.SCANOPS_ACCEPTANCE_PHASE_MISMATCH);
    if (!scopeMatches(blocker, state, expectedScope)) errors.push(INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.SCOPE_MISMATCH);
  }

  return {
    ok: errors.length === 0,
    code: errors[0] || 'BRIDGE_RELEASE_PLAN_DRAFT_INPUT_VALID',
    errors,
    blocker,
    scanops_acceptance: scanOpsAcceptance,
    expected_scope: expectedScope,
  };
}

export function projectInventoryBridgeReleasePlanDraft(blockerInput = {}, scanOpsAcceptanceInput = {}, expectedScopeInput = {}, options = {}) {
  const validation = validateInventoryBridgeReleasePlanDraftInput(blockerInput, scanOpsAcceptanceInput, expectedScopeInput);
  const projectedAt = options.projected_at || nowIso();

  if (!validation.ok) {
    return {
      ok: false,
      schema_version: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SCHEMA_VERSION,
      phase: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PHASE,
      bridge_protocol_version: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROTOCOL_VERSION,
      code: validation.code,
      status: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_STATUS.BLOCKED,
      executable: false,
      release_allowed: false,
      release_pr_required: true,
      plan_steps: [],
      plan_step_count: 0,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      projected_at: projectedAt,
      validation,
      guardrails: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_GUARDRAILS,
    };
  }

  const blocker = validation.blocker;
  const acceptanceState = validation.scanops_acceptance.local_state || {};
  return {
    ok: true,
    schema_version: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PHASE,
    bridge_protocol_version: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROTOCOL_VERSION,
    code: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_CODE.PROJECTED,
    status: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_STATUS.PROJECTED_LOCKED,
    source_device_id: blocker.source_device_id,
    environment: blocker.environment,
    store_id: blocker.store_id,
    inventory_instance_id: blocker.inventory_instance_id,
    source_release_blocker_phase: blocker.phase,
    scanops_release_blocker_acceptance_phase: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_SOURCE_PHASE,
    scanops_acceptance_status: acceptanceState.status,
    bridge_gate_locked: true,
    executable: false,
    release_allowed: false,
    release_pr_required: true,
    plan_steps: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_STEPS,
    plan_step_count: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_STEPS.length,
    relay_enforcement_allowed: false,
    relay_transport_allowed: false,
    event_transport_allowed: false,
    event_sync_allowed: false,
    event_ingestion_allowed: false,
    inventory_mutation_allowed: false,
    evidence_projection_only: true,
    projected_at: projectedAt,
    validation,
    guardrails: INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_GUARDRAILS,
  };
}

export function getInventoryBridgeReleasePlanDraftSafeSummary(input = {}) {
  const plan = parseJsonMaybe(input) || {};
  return {
    ok: plan.ok ?? null,
    code: plan.code || null,
    status: plan.status || null,
    phase: plan.phase || null,
    source_device_id: plan.source_device_id || null,
    environment: plan.environment || null,
    store_id: plan.store_id || null,
    inventory_instance_id: plan.inventory_instance_id || null,
    bridge_gate_locked: plan.bridge_gate_locked ?? null,
    executable: plan.executable ?? null,
    release_allowed: plan.release_allowed ?? null,
    release_pr_required: plan.release_pr_required ?? null,
    plan_step_count: plan.plan_step_count ?? null,
    event_sync_allowed: plan.event_sync_allowed ?? null,
    event_ingestion_allowed: plan.event_ingestion_allowed ?? null,
    inventory_mutation_allowed: plan.inventory_mutation_allowed ?? null,
    evidence_projection_only: plan.evidence_projection_only ?? null,
    projected_at: plan.projected_at || null,
  };
}

export function assertNoInventoryBridgeReleasePlanDraftOperationalMutation() {
  return INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_GUARDRAILS;
}
