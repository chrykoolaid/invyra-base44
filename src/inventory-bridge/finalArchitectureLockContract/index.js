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
      inventory_30j_receipt_policy_contract: true,
    }),
    architecture_locks: Object.freeze({
      inventory_is_system_of_record: true,
      scanops_is_operational_layer: true,
      client_network_portable: true,
      desktop_first: true,
      local_network_first: true,
      offline_capable: true,
      cloud_optional: true,
      no_developer_network_assumptions: true,
      contract_first: true,
      runtime_requires_future_phase: true,
    }),
    phase_31_readiness_candidate_shape: Object.freeze({
      phase_31_readiness_candidate_id_required: true,
      all_contracts_reference_required: true,
      guardrail_reference_required: true,
      rollback_reference_required: true,
      implementation_plan_reference_required: true,
      approved: false,
      executed: false,
      persisted: false,
    }),
    prohibited_final_lock_operations: Object.freeze({
      approve_runtime_activation: false,
      enable_runtime: false,
      open_listener: false,
      call_transport: false,
      process_queue: false,
      process_inbox: false,
      emit_receipt: false,
      persist_runtime_state: false,
      write_inventory: false,
      write_scanops: false,
      mutate_stock: false,
      mutate_workflow: false,
      send_event: false,
      receive_event: false,
    }),
    phase_31_approved: false,
    runtime_activation_approved: false,
    runtime_enabled: false,
    listener_active: false,
    transport_active: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_emitted: false,
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
