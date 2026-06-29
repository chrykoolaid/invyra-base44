export const INVENTORY_BRIDGE_P30O_PHASE = '30O-OFFLINE-LOCAL-FIRST-CONTRACT';

export const INVENTORY_BRIDGE_P30O_STATUS = Object.freeze({
  READY: 'OFFLINE_LOCAL_FIRST_CONTRACT_READY',
  BLOCKED: 'OFFLINE_LOCAL_FIRST_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30O_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30O_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30O_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30O_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildOfflineLocalFirstContract(environment = INVENTORY_BRIDGE_P30O_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30O_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30O_STATUS.READY : INVENTORY_BRIDGE_P30O_STATUS.BLOCKED,
    offline_local_first_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    cloud_optional: true,
    review_only: true,
    offline_boundary_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30n_connection_order_contract: true,
      inventory_30m_client_installation_identity_contract: true,
      inventory_30l_sync_devices_ui_governance_contract: true,
      inventory_30j_receipt_policy_contract: true,
      scanops_30i_receipt_policy_contract: true,
    }),
    local_first_policy: Object.freeze({
      inventory_desktop_host_required_future: true,
      local_lan_preferred_future: true,
      store_scanning_cloud_required: false,
      cloud_backup_optional_future: true,
      remote_diagnostics_optional_future: true,
      central_management_optional_future: true,
      normal_scanning_must_continue_without_cloud_future: true,
    }),
    offline_candidate_shape: Object.freeze({
      offline_state_reference_required: true,
      local_bridge_state_reference_required: true,
      local_queue_state_reference_required: true,
      reconnect_policy_reference_required: true,
      created: false,
      persisted: false,
      executed: false,
    }),
    prohibited_offline_operations: Object.freeze({
      create_offline_state: false,
      persist_offline_state: false,
      create_local_queue: false,
      persist_local_queue: false,
      replay_queue: false,
      start_reconnect_loop: false,
      call_cloud_service: false,
      require_cloud_for_scanning: false,
      send_event: false,
      receive_event: false,
      open_listener: false,
      call_transport: false,
    }),
    offline_state_created: false,
    offline_state_persisted: false,
    local_queue_created: false,
    local_queue_persisted: false,
    queue_replay_active: false,
    reconnect_loop_active: false,
    cloud_call_attempted: false,
    cloud_required_for_scanning: false,
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
