export const INVENTORY_BRIDGE_P30F_PHASE = '30F-INVENTORY-DEVICE-SESSION-CONTRACT';

export const INVENTORY_BRIDGE_P30F_STATUS = Object.freeze({
  READY: 'DEVICE_SESSION_CONTRACT_READY',
  BLOCKED: 'DEVICE_SESSION_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30F_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30F_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30F_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30F_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildInventoryDeviceSessionContract(environment = INVENTORY_BRIDGE_P30F_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30F_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30F_STATUS.READY : INVENTORY_BRIDGE_P30F_STATUS.BLOCKED,
    device_session_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    review_only: true,
    device_session_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      scanops_30e_device_session_contract: true,
      inventory_30d_runtime_config_contract: true,
      inventory_30b_runtime_scaffold: true,
    }),
    device_reference_shape: Object.freeze({
      scanops_device_id_reference_required: true,
      device_label_reference_allowed: true,
      device_role_reference_allowed: true,
      environment_required: true,
      operator_context_reference_allowed: true,
      registered_in_inventory: false,
      persisted: false,
    }),
    session_reference_shape: Object.freeze({
      scanops_session_id_reference_required: true,
      device_id_reference_required: true,
      operator_context_reference_allowed: true,
      started_at_candidate_allowed: true,
      ended_at_candidate_allowed: true,
      active: false,
      persisted: false,
    }),
    disabled_device_session_operations: Object.freeze({
      register_device: false,
      persist_device: false,
      start_session: false,
      persist_session: false,
      open_listener: false,
      ingest_candidate: false,
      emit_receipt: false,
    }),
    device_registered: false,
    device_persisted: false,
    session_started: false,
    session_persisted: false,
    listener_active: false,
    ingestion_engine_active: false,
    transport_active: false,
    network_call_attempted: false,
    event_received: false,
    inbound_persisted: false,
    receipt_emitted: false,
    receipt_persisted: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
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
