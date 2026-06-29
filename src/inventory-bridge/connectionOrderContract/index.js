export const INVENTORY_BRIDGE_P30N_PHASE = '30N-CONNECTION-ORDER-CONTRACT';

export const INVENTORY_BRIDGE_P30N_STATUS = Object.freeze({
  READY: 'CONNECTION_ORDER_CONTRACT_READY',
  BLOCKED: 'CONNECTION_ORDER_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30N_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30N_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30N_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30N_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildConnectionOrderContract(environment = INVENTORY_BRIDGE_P30N_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30N_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30N_STATUS.READY : INVENTORY_BRIDGE_P30N_STATUS.BLOCKED,
    connection_order_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    client_owned_boundary: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    connection_order_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30m_client_installation_identity_contract: true,
      inventory_30l_sync_devices_ui_governance_contract: true,
      inventory_30j_receipt_policy_contract: true,
      scanops_30i_receipt_policy_contract: true,
      scanops_30g_envelope_queue_contract: true,
    }),
    preferred_connection_order: Object.freeze([
      Object.freeze({ order: 1, method: 'AUTOMATIC_LOCAL_DISCOVERY', active: false, future_only: true }),
      Object.freeze({ order: 2, method: 'QR_CODE_PAIRING', active: false, future_only: true }),
      Object.freeze({ order: 3, method: 'MANUAL_IP_HOSTNAME_ADVANCED', active: false, future_only: true }),
      Object.freeze({ order: 4, method: 'IT_ADMIN_SETUP', active: false, future_only: true }),
    ]),
    connection_method_policy: Object.freeze({
      automatic_local_discovery_preferred: true,
      qr_pairing_second: true,
      manual_ip_hostname_advanced_fallback_only: true,
      it_admin_setup_final_fallback: true,
      staff_should_not_need_networking_knowledge: true,
      developer_network_assumption_allowed: false,
    }),
    prohibited_connection_operations: Object.freeze({
      start_discovery: false,
      scan_lan: false,
      read_wifi_credentials: false,
      join_wifi_network: false,
      generate_qr_pairing_payload: false,
      consume_qr_pairing_payload: false,
      save_manual_endpoint: false,
      test_manual_endpoint: false,
      start_admin_setup_flow: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
    }),
    portable_network_guardrails: Object.freeze({
      hardcoded_ip_allowed: false,
      hardcoded_router_allowed: false,
      hardcoded_ssid_allowed: false,
      hardcoded_gateway_allowed: false,
      hardcoded_machine_name_allowed: false,
      developer_network_assumption_allowed: false,
      fixed_client_network_assumption_allowed: false,
      cloud_required_for_store_scanning: false,
    }),
    automatic_discovery_active: false,
    qr_pairing_active: false,
    manual_ip_hostname_active: false,
    it_admin_setup_active: false,
    wifi_management_active: false,
    listener_active: false,
    transport_active: false,
    network_call_attempted: false,
    endpoint_configured: false,
    endpoint_persisted: false,
    pairing_payload_generated: false,
    pairing_payload_consumed: false,
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
