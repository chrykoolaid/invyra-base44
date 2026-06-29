export const INVENTORY_BRIDGE_P30W_PHASE = '30W-FINAL-ARCHITECTURE-LOCK';

export const INVENTORY_BRIDGE_P30W_STATUS = Object.freeze({
  READY: 'FINAL_ARCHITECTURE_LOCK_READY',
  BLOCKED: 'FINAL_ARCHITECTURE_LOCK_BLOCKED',
});

export const INVENTORY_BRIDGE_P30W_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30W_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30W_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30W_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildFinalArchitectureLockContract(environment = INVENTORY_BRIDGE_P30W_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30W_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30W_STATUS.READY : INVENTORY_BRIDGE_P30W_STATUS.BLOCKED,
    final_architecture_lock_ready: ready,
    phase_30_complete_candidate: ready,
    phase_31_readiness_candidate: ready,
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
    final_lock_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30v_enterprise_deployment_bundle: true,
      inventory_30u_error_recovery_bundle: true,
      inventory_30t_device_governance_bundle: true,
      inventory_30s_runtime_governance_bundle: true,
      inventory_30r_status_visibility_contract: true,
      inventory_30q_bridge_health_status_contract: true,
      inventory_30p_reconnection_policy_contract: true,
      inventory_30o_offline_local_first_contract: true,
      inventory_30n_connection_order_contract: true,
      inventory_30m_client_installation_identity_contract: true,
      inventory_30l_sync_devices_ui_governance_contract: true,
      inventory_30j_receipt_policy_contract: true,
      inventory_30h_envelope_inbox_contract: true,
      scanops_30i_receipt_policy_contract: true,
      scanops_30g_envelope_queue_contract: true,
    }),
    locked_architecture_principles: Object.freeze({
      inventory_is_system_of_record: true,
      scanops_is_execution_layer: true,
      client_network_portable: true,
      desktop_first: true,
      local_network_first: true,
      offline_first: true,
      cloud_optional: true,
      automatic_discovery_preferred_future: true,
      qr_pairing_future: true,
      manual_ip_hostname_fallback_future: true,
      admin_setup_future: true,
    }),
    phase_31_entry_gate_candidate_shape: Object.freeze({
      phase_31_entry_gate_candidate_id_required: true,
      all_phase_30_contracts_reference_required: true,
      guardrail_review_reference_required: true,
      rollback_plan_reference_required: true,
      test_training_environment_reference_required: true,
      passed: false,
      executed: false,
      persisted: false,
    }),
    prohibited_final_lock_operations: Object.freeze({
      enable_runtime: false,
      start_runtime: false,
      enable_transport: false,
      open_listener: false,
      start_polling: false,
      process_queue: false,
      process_inbox: false,
      emit_receipt: false,
      create_device_record: false,
      persist_runtime_state: false,
      create_inventory_write: false,
      create_scanops_write: false,
      mutate_stock: false,
      mutate_workflow: false,
      mutate_item_master: false,
      mutate_price: false,
      mutate_accounting: false,
      mutate_purchase_order: false,
      mutate_forecast: false,
    }),
    phase_31_entry_gate_passed: false,
    all_contracts_runtime_ready: false,
    runtime_enabled: false,
    runtime_started: false,
    transport_enabled: false,
    listener_active: false,
    polling_active: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_emitted: false,
    device_record_created: false,
    runtime_state_persisted: false,
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
