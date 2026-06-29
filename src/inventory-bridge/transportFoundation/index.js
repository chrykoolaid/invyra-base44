export const INVENTORY_BRIDGE_P31C_PHASE = '31C-TRANSPORT-BUNDLE';

export const INVENTORY_BRIDGE_P31C_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31C_TRANSPORT_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31C_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31C_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31C_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildTransportFoundation(environment = INVENTORY_BRIDGE_P31C_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31C_PHASE,
    environment: normalizedEnvironment,
    transport_foundation_ready: safeEnvironment,
    transport_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31C_TRANSPORT_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31C_TRANSPORT_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    abstraction_shape: Object.freeze({
      transport_adapter_reference_required: true,
      connection_lifecycle_reference_required: true,
      session_reference_allowed: true,
      receipt_reference_allowed: true,
      created: false,
      connected: false,
      persisted: false,
    }),
    lifecycle_shape: Object.freeze({
      allowed_states: Object.freeze([
        INVENTORY_BRIDGE_P31C_TRANSPORT_STATES.NOT_CONFIGURED,
        INVENTORY_BRIDGE_P31C_TRANSPORT_STATES.PREVIEW_ONLY,
        INVENTORY_BRIDGE_P31C_TRANSPORT_STATES.READY_DISABLED,
        INVENTORY_BRIDGE_P31C_TRANSPORT_STATES.BLOCKED,
      ]),
      executable_state_present: false,
      send_state_present: false,
      receive_state_present: false,
    }),
    feature_flags: Object.freeze({
      transport_enabled: false,
      connection_lifecycle_enabled: false,
      session_establishment_enabled: false,
      outbound_enabled: false,
      inbound_enabled: false,
      listener_enabled: false,
      polling_enabled: false,
    }),
    disabled_operations: Object.freeze({
      create_adapter: false,
      start_transport: false,
      establish_session: false,
      open_listener: false,
      start_polling: false,
      send_event: false,
      receive_event: false,
      persist_connection_state: false,
      process_business_payload: false,
    }),
    adapter_created: false,
    transport_started: false,
    session_established: false,
    listener_active: false,
    polling_active: false,
    outbound_attempted: false,
    inbound_attempted: false,
    connection_state_persisted: false,
    business_payload_processed: false,
    network_call_attempted: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    runtime_activation_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
