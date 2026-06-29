export const INVENTORY_BRIDGE_P30S_PHASE = '30S-RUNTIME-GOVERNANCE-BUNDLE';

export const INVENTORY_BRIDGE_P30S_STATUS = Object.freeze({
  READY: 'RUNTIME_GOVERNANCE_CONTRACT_READY',
  BLOCKED: 'RUNTIME_GOVERNANCE_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30S_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30S_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30S_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30S_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildRuntimeGovernanceContract(environment = INVENTORY_BRIDGE_P30S_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30S_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30S_STATUS.READY : INVENTORY_BRIDGE_P30S_STATUS.BLOCKED,
    runtime_governance_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    governance_bundle_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30r_status_visibility_contract: true,
      inventory_30q_bridge_health_status_contract: true,
      inventory_30p_reconnection_policy_contract: true,
      inventory_30o_offline_local_first_contract: true,
      inventory_30n_connection_order_contract: true,
    }),
    activation_gate_candidate_shape: Object.freeze({
      activation_gate_candidate_id_required: true,
      environment_reference_required: true,
      contract_readiness_reference_required: true,
      admin_approval_reference_required: true,
      rollback_reference_required: true,
      passed: false,
      executed: false,
      persisted: false,
    }),
    runtime_prerequisite_candidate_shape: Object.freeze({
      prerequisite_candidate_id_required: true,
      transport_policy_reference_required: true,
      listener_policy_reference_required: true,
      queue_policy_reference_required: true,
      inbox_policy_reference_required: true,
      receipt_policy_reference_required: true,
      passed: false,
      executed: false,
      persisted: false,
    }),
    prohibited_runtime_operations: Object.freeze({
      enable_runtime: false,
      start_runtime: false,
      enable_transport: false,
      open_listener: false,
      start_polling: false,
      process_queue: false,
      process_inbox: false,
      emit_receipt: false,
      persist_runtime_state: false,
      create_runtime_config: false,
      send_event: false,
      receive_event: false,
    }),
    activation_gate_passed: false,
    runtime_prerequisites_passed: false,
    runtime_enabled: false,
    runtime_started: false,
    transport_enabled: false,
    listener_active: false,
    polling_active: false,
    queue_processed: false,
    inbox_processed: false,
    receipt_emitted: false,
    runtime_state_persisted: false,
    runtime_config_created: false,
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
