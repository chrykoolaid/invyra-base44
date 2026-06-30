export const INVENTORY_BRIDGE_P31F_PHASE = '31F-OFFLINE-RECOVERY-BUNDLE';

export const INVENTORY_BRIDGE_P31F_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31F_RECOVERY_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31F_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31F_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31F_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildOfflineRecoveryFoundation(environment = INVENTORY_BRIDGE_P31F_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31F_PHASE,
    environment: normalizedEnvironment,
    offline_recovery_foundation_ready: safeEnvironment,
    recovery_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31F_RECOVERY_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31F_RECOVERY_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    offline_state_shape: Object.freeze({
      offline_state_reference_required: true,
      local_queue_reference_required: true,
      bridge_identity_reference_required: true,
      created: false,
      active: false,
      persisted: false,
    }),
    retry_policy_shape: Object.freeze({
      retry_policy_reference_required: true,
      retry_window_reference_allowed: true,
      max_attempts_reference_allowed: true,
      backoff_reference_allowed: true,
      created: false,
      scheduled: false,
      persisted: false,
    }),
    recovery_state_shape: Object.freeze({
      recovery_state_reference_required: true,
      last_success_reference_allowed: true,
      last_failure_reference_allowed: true,
      rollback_reference_allowed: true,
      created: false,
      executed: false,
      persisted: false,
    }),
    reconnect_reference_shape: Object.freeze({
      reconnect_reference_required: true,
      connection_state_reference_allowed: true,
      device_state_reference_allowed: true,
      created: false,
      attempted: false,
      persisted: false,
    }),
    feature_flags: Object.freeze({
      offline_state_enabled: false,
      local_queue_enabled: false,
      retry_policy_enabled: false,
      recovery_enabled: false,
      reconnect_enabled: false,
      queue_replay_enabled: false,
    }),
    disabled_operations: Object.freeze({
      create_offline_state: false,
      persist_offline_state: false,
      create_retry_policy: false,
      schedule_retry: false,
      execute_recovery: false,
      attempt_reconnect: false,
      replay_queue: false,
      call_transport: false,
      write_inventory: false,
      write_scanops: false,
    }),
    offline_state_created: false,
    offline_state_persisted: false,
    retry_policy_created: false,
    retry_scheduled: false,
    recovery_executed: false,
    reconnect_attempted: false,
    queue_replay_attempted: false,
    transport_called: false,
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
