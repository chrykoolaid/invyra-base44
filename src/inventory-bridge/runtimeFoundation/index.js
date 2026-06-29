export const INVENTORY_BRIDGE_P31A_PHASE = '31A-RUNTIME-FOUNDATION-BUNDLE';

export const INVENTORY_BRIDGE_P31A_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31A_RUNTIME_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  CONFIG_PREVIEW: 'CONFIG_PREVIEW',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31A_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31A_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31A_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildRuntimeFoundation(environment = INVENTORY_BRIDGE_P31A_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31A_PHASE,
    environment: normalizedEnvironment,
    runtime_foundation_ready: safeEnvironment,
    runtime_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31A_RUNTIME_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31A_RUNTIME_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    cloud_optional: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    lifecycle_model: Object.freeze({
      allowed_states: Object.freeze([
        INVENTORY_BRIDGE_P31A_RUNTIME_STATES.NOT_CONFIGURED,
        INVENTORY_BRIDGE_P31A_RUNTIME_STATES.CONFIG_PREVIEW,
        INVENTORY_BRIDGE_P31A_RUNTIME_STATES.READY_DISABLED,
        INVENTORY_BRIDGE_P31A_RUNTIME_STATES.BLOCKED,
      ]),
      startup_state: INVENTORY_BRIDGE_P31A_RUNTIME_STATES.READY_DISABLED,
      shutdown_state: INVENTORY_BRIDGE_P31A_RUNTIME_STATES.READY_DISABLED,
      executable_state_present: false,
    }),
    feature_flags: Object.freeze({
      bridge_runtime_enabled: false,
      discovery_enabled: false,
      pairing_enabled: false,
      transport_enabled: false,
      listener_enabled: false,
      polling_enabled: false,
      queue_processing_enabled: false,
      inbox_processing_enabled: false,
      receipt_processing_enabled: false,
    }),
    activation_prerequisites: Object.freeze({
      phase_30_architecture_lock_required: true,
      explicit_future_phase_required: true,
      rollback_plan_required: true,
      test_environment_required: true,
      admin_approval_required_future: true,
      satisfied: false,
    }),
    disabled_operations: Object.freeze({
      start_runtime: false,
      stop_runtime: false,
      open_listener: false,
      start_transport: false,
      start_discovery: false,
      start_pairing: false,
      start_polling: false,
      process_queue: false,
      process_inbox: false,
      process_receipt: false,
      persist_runtime_state: false,
      write_inventory: false,
      write_scanops: false,
    }),
    runtime_started: false,
    runtime_stopped: false,
    listener_active: false,
    transport_active: false,
    discovery_active: false,
    pairing_active: false,
    polling_active: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_processed: false,
    runtime_state_persisted: false,
    network_call_attempted: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
    item_master_mutation_allowed: false,
    price_mutation_allowed: false,
    accounting_mutation_allowed: false,
    purchase_order_write_allowed: false,
    forecast_write_allowed: false,
    runtime_activation_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
