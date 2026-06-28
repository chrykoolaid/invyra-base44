export const INVENTORY_BRIDGE_P30D_PHASE = '30D-INVENTORY-RUNTIME-CONFIG-CONTRACT';

export const INVENTORY_BRIDGE_P30D_STATUS = Object.freeze({
  READY: 'RUNTIME_CONFIG_CONTRACT_READY',
  BLOCKED: 'RUNTIME_CONFIG_CONTRACT_BLOCKED',
});

export const INVENTORY_BRIDGE_P30D_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30D_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30D_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30D_ENVIRONMENTS.UNKNOWN;
}

function canExposeContract(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildInventoryRuntimeConfigContract(environment = INVENTORY_BRIDGE_P30D_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canExposeContract(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30D_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P30D_STATUS.READY : INVENTORY_BRIDGE_P30D_STATUS.BLOCKED,
    config_contract_ready: ready,
    inactive_contract_only: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    review_only: true,
    config_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      scanops_30c_runtime_config_contract: true,
      inventory_30b_runtime_scaffold: true,
    }),
    config_shape: Object.freeze({
      environment_required: true,
      listener_boundary_required: true,
      candidate_inbox_required: true,
      validation_policy_candidate_allowed: true,
      receipt_policy_candidate_allowed: true,
      device_identity_reference_allowed: true,
      session_reference_allowed: true,
    }),
    disabled_config_operations: Object.freeze({
      save_config: false,
      load_persisted_config: false,
      open_listener: false,
      validate_endpoint_live: false,
      ingest_candidate: false,
      start_runtime: false,
    }),
    config_persisted: false,
    config_loaded_from_storage: false,
    endpoint_validated: false,
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
