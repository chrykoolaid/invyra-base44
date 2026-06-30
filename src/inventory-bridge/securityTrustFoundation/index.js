export const INVENTORY_BRIDGE_P31E_PHASE = '31E-SECURITY-TRUST-BUNDLE';

export const INVENTORY_BRIDGE_P31E_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31E_CHECK_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31E_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31E_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31E_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildSecurityTrustFoundation(environment = INVENTORY_BRIDGE_P31E_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31E_PHASE,
    environment: normalizedEnvironment,
    security_trust_foundation_ready: safeEnvironment,
    check_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31E_CHECK_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31E_CHECK_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    device_check_shape: Object.freeze({
      device_check_reference_required: true,
      device_reference_required: true,
      site_reference_required: true,
      created: false,
      checked: false,
      persisted: false,
    }),
    session_check_shape: Object.freeze({
      session_check_reference_required: true,
      session_reference_required: true,
      bridge_reference_required: true,
      created: false,
      checked: false,
      persisted: false,
    }),
    integrity_check_shape: Object.freeze({
      integrity_check_reference_required: true,
      envelope_reference_required: true,
      sequence_reference_allowed: true,
      created: false,
      checked: false,
      persisted: false,
    }),
    replay_guard_shape: Object.freeze({
      replay_guard_reference_required: true,
      message_reference_required: true,
      time_window_reference_allowed: true,
      created: false,
      checked: false,
      persisted: false,
    }),
    feature_flags: Object.freeze({
      device_check_enabled: false,
      session_check_enabled: false,
      integrity_check_enabled: false,
      replay_guard_enabled: false,
      approval_enabled: false,
    }),
    disabled_operations: Object.freeze({
      check_device: false,
      check_session: false,
      check_integrity: false,
      check_replay: false,
      approve_device: false,
      start_session: false,
      persist_check_state: false,
      call_transport: false,
      write_inventory: false,
      write_scanops: false,
    }),
    device_check_attempted: false,
    session_check_attempted: false,
    integrity_check_attempted: false,
    replay_check_attempted: false,
    device_approved: false,
    session_started: false,
    check_state_persisted: false,
    transport_called: false,
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
