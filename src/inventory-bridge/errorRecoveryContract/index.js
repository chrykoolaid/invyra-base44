export const INVENTORY_BRIDGE_P30U_PHASE = '30U-ERROR-RECOVERY-BUNDLE';

export const INVENTORY_BRIDGE_P30U_STATUS = Object.freeze({
  READY: 'ERROR_RECOVERY_CONTRACT_READY',
  BLOCKED: 'ERROR_RECOVERY_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30U_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30U_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30U_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30U_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildErrorRecoveryContract(environment = INVENTORY_BRIDGE_P30U_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30U_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30U_STATUS.READY : INVENTORY_BRIDGE_P30U_STATUS.BLOCKED,
    error_recovery_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    error_bundle_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      inventory_30t_device_governance_bundle: true,
      inventory_30s_runtime_governance_bundle: true,
      inventory_30p_reconnection_policy_contract: true,
      inventory_30j_receipt_policy_contract: true,
      scanops_30i_receipt_policy_contract: true,
    }),
    error_category_candidate_shape: Object.freeze({
      error_category_candidate_id_required: true,
      severity_reference_required: true,
      source_reference_required: true,
      operator_message_reference_allowed: true,
      recovery_category_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    recovery_category_candidate_shape: Object.freeze({
      recovery_category_candidate_id_required: true,
      retry_classification_reference_allowed: true,
      operator_action_reference_allowed: true,
      escalation_reference_allowed: true,
      rollback_reference_allowed: true,
      executed: false,
      persisted: false,
    }),
    retry_classification_candidate_shape: Object.freeze({
      retry_classification_candidate_id_required: true,
      retry_allowed_reference_required: true,
      retry_window_reference_allowed: true,
      max_attempts_reference_allowed: true,
      backoff_reference_allowed: true,
      executed: false,
      persisted: false,
    }),
    prohibited_error_operations: Object.freeze({
      classify_runtime_error: false,
      persist_error_record: false,
      emit_error_event: false,
      execute_recovery: false,
      schedule_retry: false,
      replay_queue: false,
      rollback_state: false,
      escalate_operator_alert: false,
      open_listener: false,
      call_transport: false,
      send_event: false,
      receive_event: false,
    }),
    runtime_error_classified: false,
    error_record_persisted: false,
    error_event_emitted: false,
    recovery_executed: false,
    retry_scheduled: false,
    queue_replay_active: false,
    rollback_executed: false,
    operator_alert_escalated: false,
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
