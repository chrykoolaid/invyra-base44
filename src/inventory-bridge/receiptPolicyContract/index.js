export const INVENTORY_BRIDGE_P30J_PHASE = '30J-INVENTORY-RECEIPT-POLICY-CONTRACT';

export const INVENTORY_BRIDGE_P30J_STATUS = Object.freeze({
  READY: 'RECEIPT_POLICY_CONTRACT_READY',
  BLOCKED: 'RECEIPT_POLICY_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30J_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30J_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30J_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30J_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildInventoryReceiptPolicyContract(environment = INVENTORY_BRIDGE_P30J_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30J_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30J_STATUS.READY : INVENTORY_BRIDGE_P30J_STATUS.BLOCKED,
    receipt_policy_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_network_first: true,
    offline_capable: true,
    review_only: true,
    receipt_policy_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      scanops_30i_receipt_policy_contract: true,
      inventory_30h_envelope_inbox_contract: true,
      inventory_30f_device_session_contract: true,
      inventory_30d_runtime_config_contract: true,
    }),
    receipt_reference_shape: Object.freeze({
      receipt_reference_candidate_id_required: true,
      envelope_candidate_id_reference_required: true,
      inbox_candidate_id_reference_required: true,
      environment_required: true,
      source_system: 'INVENTORY',
      target_system: 'SCANOPS',
      device_id_reference_required: true,
      session_id_reference_required: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    acknowledgement_candidate_shape: Object.freeze({
      acknowledgement_candidate_id_required: true,
      receipt_reference_candidate_id_required: true,
      acknowledgement_status_candidate_required: true,
      deterministic_order_required: true,
      retry_policy_reference_allowed: true,
      generated: false,
      emitted: false,
      persisted: false,
    }),
    validation_outcome_candidate_shape: Object.freeze({
      validation_outcome_candidate_id_required: true,
      validation_policy_reference_required: true,
      accepted_candidate_allowed: true,
      rejected_candidate_allowed: true,
      blocked_candidate_allowed: true,
      reason_code_required: true,
      executed: false,
      persisted: false,
      inventory_write_allowed: false,
    }),
    disabled_receipt_operations: Object.freeze({
      process_receipt: false,
      generate_acknowledgement: false,
      emit_acknowledgement: false,
      persist_receipt: false,
      persist_acknowledgement: false,
      persist_validation_outcome: false,
      open_listener: false,
      send_event: false,
      receive_event: false,
      call_transport: false,
      create_inventory_write: false,
    }),
    portable_network_guardrails: Object.freeze({
      automatic_local_discovery_preferred: true,
      qr_pairing_preferred_fallback: true,
      manual_ip_hostname_advanced_fallback_only: true,
      it_admin_setup_final_fallback: true,
      hardcoded_ip_allowed: false,
      hardcoded_router_allowed: false,
      hardcoded_ssid_allowed: false,
      hardcoded_gateway_allowed: false,
      hardcoded_machine_name_allowed: false,
      developer_network_assumption_allowed: false,
    }),
    receipt_processed: false,
    receipt_reference_created: false,
    receipt_reference_persisted: false,
    acknowledgement_generated: false,
    acknowledgement_emitted: false,
    acknowledgement_persisted: false,
    validation_outcome_created: false,
    validation_outcome_persisted: false,
    receipt_persisted: false,
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
