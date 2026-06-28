export const INVENTORY_BRIDGE_P30H_PHASE = '30H-INVENTORY-ENVELOPE-INBOX-CONTRACT';

export const INVENTORY_BRIDGE_P30H_STATUS = Object.freeze({
  READY: 'ENVELOPE_INBOX_CONTRACT_READY',
  BLOCKED: 'ENVELOPE_INBOX_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30H_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30H_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30H_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30H_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildInventoryEnvelopeInboxContract(environment = INVENTORY_BRIDGE_P30H_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30H_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30H_STATUS.READY : INVENTORY_BRIDGE_P30H_STATUS.BLOCKED,
    envelope_inbox_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    review_only: true,
    envelope_inbox_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      scanops_30g_envelope_queue_contract: true,
      inventory_30f_device_session_contract: true,
      inventory_30d_runtime_config_contract: true,
    }),
    envelope_reference_shape: Object.freeze({
      envelope_version_required: true,
      candidate_id_required: true,
      environment_required: true,
      source_system: 'SCANOPS',
      target_system: 'INVENTORY',
      device_id_reference_required: true,
      session_id_reference_required: true,
      payload_preview_allowed: true,
      received: false,
      persisted: false,
    }),
    inbox_shape: Object.freeze({
      inbox_candidate_id_required: true,
      deterministic_order_required: true,
      duplicate_guard_required: true,
      validation_policy_reference_required: true,
      persisted: false,
      validation_executed: false,
    }),
    disabled_inbox_operations: Object.freeze({
      open_listener: false,
      receive_event: false,
      create_inbox_record: false,
      persist_inbox_record: false,
      run_validation: false,
      emit_receipt: false,
    }),
    envelope_received: false,
    envelope_persisted: false,
    inbox_record_created: false,
    inbox_record_persisted: false,
    duplicate_guard_executed: false,
    validation_executed: false,
    listener_active: false,
    ingestion_engine_active: false,
    transport_active: false,
    network_call_attempted: false,
    event_received: false,
    inbound_persisted: false,
    receipt_emitted: false,
    receipt_persisted: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
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
