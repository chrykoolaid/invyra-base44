export const INVENTORY_BRIDGE_P30Q_PHASE = '30Q-BRIDGE-HEALTH-STATUS-CONTRACT';

export const INVENTORY_BRIDGE_P30Q_STATUS = Object.freeze({
  READY: 'BRIDGE_HEALTH_STATUS_CONTRACT_READY',
  BLOCKED: 'BRIDGE_HEALTH_STATUS_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30Q_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30Q_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30Q_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30Q_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildBridgeHealthStatusContract(environment = INVENTORY_BRIDGE_P30Q_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30Q_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30Q_STATUS.READY : INVENTORY_BRIDGE_P30Q_STATUS.BLOCKED,
    bridge_health_status_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    health_status_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30p_reconnection_policy_contract: true,
      inventory_30o_offline_local_first_contract: true,
      inventory_30n_connection_order_contract: true,
      inventory_30m_client_installation_identity_contract: true,
      inventory_30l_sync_devices_ui_governance_contract: true,
    }),
    bridge_status_candidate_shape: Object.freeze({
      bridge_status_candidate_id_required: true,
      environment_reference_required: true,
      bridge_identity_reference_required: true,
      status_value_reference_required: true,
      status_reason_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    readiness_summary_candidate_shape: Object.freeze({
      readiness_summary_candidate_id_required: true,
      contract_readiness_reference_required: true,
      device_readiness_reference_allowed: true,
      queue_readiness_reference_allowed: true,
      diagnostic_summary_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    prohibited_health_operations: Object.freeze({
      collect_diagnostics: false,
      ping_device: false,
      ping_bridge: false,
      update_status: false,
      update_readiness: false,
      persist_health_status: false,
      persist_readiness_summary: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
    }),
    diagnostics_collected: false,
    device_ping_attempted: false,
    bridge_ping_attempted: false,
    status_updated: false,
    readiness_updated: false,
    health_status_persisted: false,
    readiness_summary_persisted: false,
    listener_active: false,
    transport_active: false,
    network_call_attempted: false,
    event_sent: false,
    event_received: false,
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
