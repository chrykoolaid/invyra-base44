export const INVENTORY_BRIDGE_P30M_PHASE = '30M-CLIENT-INSTALLATION-IDENTITY-CONTRACT';

export const INVENTORY_BRIDGE_P30M_STATUS = Object.freeze({
  READY: 'CLIENT_INSTALLATION_IDENTITY_CONTRACT_READY',
  BLOCKED: 'CLIENT_INSTALLATION_IDENTITY_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30M_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30M_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30M_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30M_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildClientInstallationIdentityContract(environment = INVENTORY_BRIDGE_P30M_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30M_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30M_STATUS.READY : INVENTORY_BRIDGE_P30M_STATUS.BLOCKED,
    client_installation_identity_contract_ready: ready,
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
    identity_reference_only: true,
    boundary_reference_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30l_sync_devices_ui_governance_contract: true,
      inventory_30j_receipt_policy_contract: true,
      inventory_30h_envelope_inbox_contract: true,
      scanops_30i_receipt_policy_contract: true,
      scanops_30g_envelope_queue_contract: true,
    }),
    client_installation_reference_shape: Object.freeze({
      store_site_id_reference_required: true,
      installation_id_reference_required: true,
      environment_reference_required: true,
      bridge_identity_reference_required: true,
      client_owned_boundary: true,
      created: false,
      persisted: false,
    }),
    bridge_identity_reference_shape: Object.freeze({
      bridge_identity_candidate_id_required: true,
      inventory_host_reference_required: true,
      installation_id_reference_required: true,
      bridge_instance_reference_required: true,
      active: false,
      emitted: false,
      persisted: false,
    }),
    device_boundary_reference_shape: Object.freeze({
      scanner_registry_reference_required: true,
      device_id_reference_required: true,
      session_id_reference_required: true,
      pairing_code_reference_required: true,
      device_status_candidate_required: true,
      registered: false,
      persisted: false,
    }),
    prohibited_identity_operations: Object.freeze({
      create_site_id: false,
      create_installation_id: false,
      create_bridge_identity: false,
      persist_bridge_identity: false,
      create_scanner_registry: false,
      persist_scanner_registry: false,
      register_device: false,
      create_session: false,
      issue_pairing_code: false,
      activate_pairing: false,
      share_pairing_across_installations: false,
    }),
    portable_network_guardrails: Object.freeze({
      automatic_local_discovery_preferred_future: true,
      qr_pairing_future: true,
      manual_ip_hostname_advanced_fallback_future: true,
      it_admin_setup_future: true,
      hardcoded_ip_allowed: false,
      hardcoded_router_allowed: false,
      hardcoded_ssid_allowed: false,
      hardcoded_gateway_allowed: false,
      hardcoded_machine_name_allowed: false,
      developer_network_assumption_allowed: false,
      cross_installation_pairing_allowed: false,
    }),
    site_id_created: false,
    installation_id_created: false,
    bridge_identity_created: false,
    bridge_identity_persisted: false,
    scanner_registry_created: false,
    scanner_registry_persisted: false,
    device_registered: false,
    session_created: false,
    pairing_code_issued: false,
    pairing_active: false,
    cross_installation_pairing_allowed: false,
    listener_active: false,
    transport_active: false,
    discovery_active: false,
    qr_pairing_active: false,
    manual_endpoint_active: false,
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
