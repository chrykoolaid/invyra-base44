export const INVENTORY_BRIDGE_P30V_PHASE = '30V-ENTERPRISE-DEPLOYMENT-BUNDLE';

export const INVENTORY_BRIDGE_P30V_STATUS = Object.freeze({
  READY: 'ENTERPRISE_DEPLOYMENT_CONTRACT_READY',
  BLOCKED: 'ENTERPRISE_DEPLOYMENT_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30V_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30V_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30V_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30V_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildEnterpriseDeploymentContract(environment = INVENTORY_BRIDGE_P30V_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30V_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30V_STATUS.READY : INVENTORY_BRIDGE_P30V_STATUS.BLOCKED,
    enterprise_deployment_contract_ready: ready,
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
    enterprise_bundle_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30u_error_recovery_bundle: true,
      inventory_30t_device_governance_bundle: true,
      inventory_30s_runtime_governance_bundle: true,
      inventory_30o_offline_local_first_contract: true,
      inventory_30m_client_installation_identity_contract: true,
    }),
    enterprise_site_candidate_shape: Object.freeze({
      enterprise_site_candidate_id_required: true,
      store_site_reference_required: true,
      installation_reference_required: true,
      regional_group_reference_allowed: true,
      created: false,
      persisted: false,
    }),
    bridge_host_candidate_shape: Object.freeze({
      bridge_host_candidate_id_required: true,
      primary_host_reference_allowed: true,
      secondary_host_reference_allowed: true,
      failover_policy_reference_allowed: true,
      active: false,
      persisted: false,
    }),
    management_visibility_candidate_shape: Object.freeze({
      management_visibility_candidate_id_required: true,
      fleet_summary_reference_allowed: true,
      remote_status_reference_allowed: true,
      diagnostic_summary_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    prohibited_enterprise_operations: Object.freeze({
      create_enterprise_site: false,
      persist_enterprise_site: false,
      create_bridge_host: false,
      persist_bridge_host: false,
      enable_failover: false,
      enable_central_management: false,
      enable_remote_visibility: false,
      require_cloud_for_scanning: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
    }),
    enterprise_site_created: false,
    enterprise_site_persisted: false,
    bridge_host_created: false,
    bridge_host_persisted: false,
    failover_enabled: false,
    central_management_enabled: false,
    remote_visibility_enabled: false,
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
