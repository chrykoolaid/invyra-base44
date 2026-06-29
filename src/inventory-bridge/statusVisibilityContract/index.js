export const INVENTORY_BRIDGE_P30R_PHASE = '30R-STATUS-VISIBILITY-CONTRACT';

export const INVENTORY_BRIDGE_P30R_STATUS = Object.freeze({
  READY: 'STATUS_VISIBILITY_CONTRACT_READY',
  BLOCKED: 'STATUS_VISIBILITY_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30R_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30R_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30R_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30R_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildStatusVisibilityContract(environment = INVENTORY_BRIDGE_P30R_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30R_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30R_STATUS.READY : INVENTORY_BRIDGE_P30R_STATUS.BLOCKED,
    status_visibility_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    visibility_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30q_bridge_health_status_contract: true,
      inventory_30p_reconnection_policy_contract: true,
      inventory_30o_offline_local_first_contract: true,
      inventory_30n_connection_order_contract: true,
      inventory_30m_client_installation_identity_contract: true,
    }),
    visible_summary_candidate_shape: Object.freeze({
      visible_summary_candidate_id_required: true,
      bridge_status_reference_required: true,
      device_count_reference_allowed: true,
      queue_count_reference_allowed: true,
      readiness_message_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    status_category_candidate_shape: Object.freeze({
      status_category_candidate_id_required: true,
      network_status_reference_allowed: true,
      device_status_reference_allowed: true,
      queue_status_reference_allowed: true,
      printer_status_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    prohibited_visibility_operations: Object.freeze({
      collect_status: false,
      probe_device: false,
      probe_bridge: false,
      refresh_runtime_state: false,
      persist_visible_summary: false,
      persist_status_category: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
    }),
    status_collected: false,
    device_probe_attempted: false,
    bridge_probe_attempted: false,
    runtime_state_refreshed: false,
    visible_summary_persisted: false,
    status_category_persisted: false,
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
