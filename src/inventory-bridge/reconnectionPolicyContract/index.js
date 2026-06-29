export const INVENTORY_BRIDGE_P30P_PHASE = '30P-RECONNECTION-POLICY-CONTRACT';

export const INVENTORY_BRIDGE_P30P_STATUS = Object.freeze({
  READY: 'RECONNECTION_POLICY_CONTRACT_READY',
  BLOCKED: 'RECONNECTION_POLICY_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30P_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30P_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30P_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30P_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildReconnectionPolicyContract(environment = INVENTORY_BRIDGE_P30P_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30P_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30P_STATUS.READY : INVENTORY_BRIDGE_P30P_STATUS.BLOCKED,
    reconnection_policy_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    recovery_policy_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30o_offline_local_first_contract: true,
      inventory_30n_connection_order_contract: true,
      inventory_30m_client_installation_identity_contract: true,
      inventory_30l_sync_devices_ui_governance_contract: true,
      inventory_30j_receipt_policy_contract: true,
    }),
    recovery_policy_candidate_shape: Object.freeze({
      recovery_policy_candidate_id_required: true,
      retry_sequence_reference_required: true,
      backoff_policy_reference_required: true,
      max_attempts_reference_required: true,
      last_success_reference_allowed: true,
      last_failure_reference_allowed: true,
      executed: false,
      persisted: false,
    }),
    health_reference_candidate_shape: Object.freeze({
      health_reference_candidate_id_required: true,
      bridge_status_reference_required: true,
      device_status_reference_required: true,
      status_ping_reference_allowed: true,
      last_seen_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    prohibited_recovery_operations: Object.freeze({
      start_recovery_loop: false,
      schedule_recovery: false,
      attempt_recovery: false,
      send_status_ping: false,
      receive_status_ping: false,
      update_last_seen: false,
      replay_queue: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
      persist_health: false,
      persist_recovery_state: false,
    }),
    recovery_loop_active: false,
    recovery_scheduled: false,
    recovery_attempted: false,
    status_ping_sent: false,
    status_ping_received: false,
    last_seen_updated: false,
    queue_replay_active: false,
    listener_active: false,
    transport_active: false,
    network_call_attempted: false,
    event_sent: false,
    event_received: false,
    health_persisted: false,
    recovery_state_persisted: false,
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
