export const INVENTORY_BRIDGE_P31I_PHASE = '31I-FOUNDATION-CLOSURE';

export const INVENTORY_BRIDGE_P31I_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31I_CLOSURE_STATES = Object.freeze({
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31I_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31I_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31I_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildPhase31Closure(environment = INVENTORY_BRIDGE_P31I_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31I_PHASE,
    environment: normalizedEnvironment,
    phase_31_closure_ready: safeEnvironment,
    closure_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31I_CLOSURE_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31I_CLOSURE_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    completed_phase_31_foundations: Object.freeze({
      phase_31a_runtime_foundation: true,
      phase_31b_connection_setup: true,
      phase_31c_transport_foundation: true,
      phase_31d_queue_envelope_foundation: true,
      phase_31e_reference_checks: true,
      phase_31f_offline_recovery_foundation: true,
      phase_31g_visibility_foundation: true,
      phase_31h_test_readiness_gate: true,
    }),
    phase_32_entry_shape: Object.freeze({
      phase_32_entry_reference_required: true,
      phase_30_lock_reference_required: true,
      phase_31_foundation_reference_required: true,
      test_plan_reference_required: true,
      rollback_reference_required: true,
      created: false,
      approved: false,
      persisted: false,
    }),
    next_phase_guardrails: Object.freeze({
      explicit_phase_32_scope_required: true,
      single_runtime_surface_required: true,
      test_environment_only_required: true,
      rollback_before_enablement_required: true,
      live_production_block_required: true,
      inventory_system_of_record_required: true,
    }),
    disabled_operations: Object.freeze({
      approve_phase_32: false,
      enable_runtime: false,
      start_transport: false,
      open_listener: false,
      process_queue: false,
      process_inbox: false,
      emit_receipt: false,
      persist_state: false,
      write_inventory: false,
      write_scanops: false,
    }),
    phase_32_approved: false,
    runtime_enabled: false,
    transport_active: false,
    listener_active: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_emitted: false,
    state_persisted: false,
    network_call_attempted: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
    runtime_activation_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
