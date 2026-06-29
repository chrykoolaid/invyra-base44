export const INVENTORY_BRIDGE_P30T_PHASE = '30T-DEVICE-GOVERNANCE-BUNDLE';

export const INVENTORY_BRIDGE_P30T_STATUS = Object.freeze({
  READY: 'DEVICE_GOVERNANCE_CONTRACT_READY',
  BLOCKED: 'DEVICE_GOVERNANCE_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30T_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30T_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30T_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30T_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildDeviceGovernanceContract(environment = INVENTORY_BRIDGE_P30T_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30T_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30T_STATUS.READY : INVENTORY_BRIDGE_P30T_STATUS.BLOCKED,
    device_governance_contract_ready: ready,
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
    device_bundle_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30s_runtime_governance_bundle: true,
      inventory_30r_status_visibility_contract: true,
      inventory_30q_bridge_health_status_contract: true,
      inventory_30m_client_installation_identity_contract: true,
      scanops_30i_receipt_policy_contract: true,
    }),
    device_capability_candidate_shape: Object.freeze({
      device_capability_candidate_id_required: true,
      scanner_model_reference_allowed: true,
      camera_scanner_reference_allowed: true,
      hardware_scanner_reference_allowed: true,
      printer_reference_allowed: true,
      offline_queue_reference_allowed: true,
      generated: false,
      persisted: false,
    }),
    scanner_profile_candidate_shape: Object.freeze({
      scanner_profile_candidate_id_required: true,
      device_id_reference_required: true,
      site_id_reference_required: true,
      session_policy_reference_required: true,
      role_scope_reference_allowed: true,
      created: false,
      enabled: false,
      persisted: false,
    }),
    local_link_reference_candidate_shape: Object.freeze({
      local_link_reference_candidate_id_required: true,
      bridge_identity_reference_required: true,
      device_id_reference_required: true,
      session_id_reference_allowed: true,
      issued: false,
      accepted: false,
      persisted: false,
    }),
    prohibited_device_operations: Object.freeze({
      create_device_record: false,
      enable_device: false,
      create_local_link_reference: false,
      accept_local_link_reference: false,
      persist_scanner_profile: false,
      persist_device_capability: false,
      persist_local_link_reference: false,
      share_link_across_installations: false,
      start_device_session: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
    }),
    device_record_created: false,
    device_enabled: false,
    local_link_reference_created: false,
    local_link_reference_accepted: false,
    scanner_profile_persisted: false,
    device_capability_persisted: false,
    local_link_reference_persisted: false,
    cross_installation_link_allowed: false,
    device_session_started: false,
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
