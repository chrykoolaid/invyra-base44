export const INVENTORY_BRIDGE_P31H_PHASE = '31H-TEST-READINESS-GATE';

export const INVENTORY_BRIDGE_P31H_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31H_GATE_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31H_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31H_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31H_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildTestReadinessGate(environment = INVENTORY_BRIDGE_P31H_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31H_PHASE,
    environment: normalizedEnvironment,
    test_readiness_gate_ready: safeEnvironment,
    gate_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31H_GATE_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31H_GATE_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    readiness_check_shape: Object.freeze({
      readiness_check_reference_required: true,
      phase_30_lock_reference_required: true,
      phase_31_foundation_reference_required: true,
      rollback_reference_required: true,
      created: false,
      checked: false,
      passed: false,
      persisted: false,
    }),
    test_scope_shape: Object.freeze({
      test_scope_reference_required: true,
      environment_reference_required: true,
      operator_reference_allowed: true,
      approval_reference_allowed: true,
      created: false,
      approved: false,
      persisted: false,
    }),
    disabled_runtime_shape: Object.freeze({
      disabled_runtime_reference_required: true,
      feature_flag_reference_required: true,
      rollback_reference_required: true,
      created: false,
      enabled: false,
      persisted: false,
    }),
    feature_flags: Object.freeze({
      test_gate_enabled: false,
      runtime_enabled: false,
      transport_enabled: false,
      listener_enabled: false,
      queue_processing_enabled: false,
      inbox_processing_enabled: false,
      receipt_processing_enabled: false,
      writeback_enabled: false,
    }),
    disabled_operations: Object.freeze({
      approve_test_scope: false,
      pass_readiness_gate: false,
      enable_runtime: false,
      start_transport: false,
      open_listener: false,
      process_queue: false,
      process_inbox: false,
      process_receipt: false,
      persist_gate_state: false,
      write_inventory: false,
      write_scanops: false,
    }),
    test_scope_approved: false,
    readiness_gate_passed: false,
    runtime_enabled: false,
    transport_active: false,
    listener_active: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_processed: false,
    gate_state_persisted: false,
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
