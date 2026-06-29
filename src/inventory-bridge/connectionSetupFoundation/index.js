export const INVENTORY_BRIDGE_P31B_PHASE = '31B-CONNECTION-SETUP-BUNDLE';

export const INVENTORY_BRIDGE_P31B_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31B_SETUP_ORDER = Object.freeze([
  'LOCAL_LOOKUP_REFERENCE',
  'QR_REFERENCE',
  'MANUAL_HOST_REFERENCE',
  'ADMIN_SETUP_REFERENCE',
]);

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31B_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31B_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31B_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildConnectionSetupFoundation(environment = INVENTORY_BRIDGE_P31B_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31B_PHASE,
    environment: normalizedEnvironment,
    connection_setup_foundation_ready: safeEnvironment,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    setup_order: INVENTORY_BRIDGE_P31B_SETUP_ORDER,
    local_lookup_reference_shape: Object.freeze({
      local_lookup_reference_id_required: true,
      bridge_identity_reference_required: true,
      site_reference_required: true,
      generated: false,
      used: false,
      persisted: false,
    }),
    qr_reference_shape: Object.freeze({
      qr_reference_id_required: true,
      bridge_identity_reference_required: true,
      device_reference_required: true,
      site_reference_required: true,
      generated: false,
      accepted: false,
      persisted: false,
    }),
    manual_host_reference_shape: Object.freeze({
      manual_host_reference_id_required: true,
      host_reference_required: true,
      admin_scope_required: true,
      checked: false,
      saved: false,
      persisted: false,
    }),
    identity_reference_shape: Object.freeze({
      installation_reference_required: true,
      bridge_reference_required: true,
      device_reference_required: true,
      session_reference_allowed: true,
      checked: false,
      persisted: false,
    }),
    feature_flags: Object.freeze({
      local_lookup_enabled: false,
      qr_reference_enabled: false,
      manual_host_enabled: false,
      admin_setup_enabled: false,
      identity_check_enabled: false,
    }),
    disabled_operations: Object.freeze({
      start_local_lookup: false,
      create_qr_reference: false,
      accept_qr_reference: false,
      check_manual_host: false,
      save_manual_host: false,
      check_identity: false,
      open_listener: false,
      start_transport: false,
      persist_setup_state: false,
    }),
    local_lookup_started: false,
    qr_reference_created: false,
    qr_reference_accepted: false,
    manual_host_checked: false,
    manual_host_saved: false,
    identity_checked: false,
    listener_active: false,
    transport_active: false,
    network_call_attempted: false,
    setup_state_persisted: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    runtime_activation_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
