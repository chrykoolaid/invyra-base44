export const INVENTORY_BRIDGE_P30L_PHASE = '30L-SYNC-DEVICES-UI-GOVERNANCE-CONTRACT';

export const INVENTORY_BRIDGE_P30L_STATUS = Object.freeze({
  READY: 'SYNC_DEVICES_UI_GOVERNANCE_READY',
  BLOCKED: 'SYNC_DEVICES_UI_GOVERNANCE_BLOCKED',
});

export const INVENTORY_BRIDGE_P30L_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30L_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30L_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30L_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildSyncDevicesUiGovernanceContract(environment = INVENTORY_BRIDGE_P30L_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30L_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30L_STATUS.READY : INVENTORY_BRIDGE_P30L_STATUS.BLOCKED,
    sync_devices_ui_governance_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    ui_governance_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30k_bridge_ui_foundation: true,
      inventory_30j_receipt_policy_contract: true,
      inventory_30h_envelope_inbox_contract: true,
      scanops_30i_receipt_policy_contract: true,
      scanops_30g_envelope_queue_contract: true,
    }),
    allowed_ui_surface: Object.freeze({
      bridge_status_display: true,
      scanner_fleet_counts_display: true,
      bridge_contract_checklist_display: true,
      queue_visibility_placeholder: true,
      diagnostics_placeholder: true,
      device_trust_placeholder: true,
      labels_printers_placeholder: true,
      configuration_readiness_copy: true,
    }),
    required_disabled_actions: Object.freeze({
      configure_bridge: true,
      test_connection: true,
      start_bridge: true,
      enable_sync: true,
      register_device: true,
      add_printer: true,
      test_print: true,
    }),
    prohibited_ui_behavior: Object.freeze({
      open_network_listener: false,
      scan_network: false,
      test_connection: false,
      start_bridge_runtime: false,
      enable_sync_runtime: false,
      register_scanner_device: false,
      issue_pairing_token: false,
      trust_device: false,
      create_endpoint: false,
      persist_endpoint: false,
      persist_device_registry: false,
      process_queue: false,
      process_inbox: false,
      emit_receipt: false,
      print_label: false,
      create_print_job: false,
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
    }),
    bridge_runtime_enabled: false,
    bridge_runtime_started: false,
    listener_active: false,
    transport_active: false,
    discovery_active: false,
    qr_pairing_active: false,
    manual_endpoint_active: false,
    network_call_attempted: false,
    endpoint_configured: false,
    endpoint_persisted: false,
    device_registered: false,
    device_trusted: false,
    pairing_token_issued: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_emitted: false,
    printer_job_created: false,
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
