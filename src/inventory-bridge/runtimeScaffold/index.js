export const INVENTORY_BRIDGE_P30B_PHASE = '30B-INVENTORY-RUNTIME-SCAFFOLD-INACTIVE';

export const INVENTORY_BRIDGE_P30B_STATUS = Object.freeze({
  INACTIVE: 'RUNTIME_SCAFFOLD_INACTIVE',
  BLOCKED: 'RUNTIME_SCAFFOLD_BLOCKED',
});

export const INVENTORY_BRIDGE_P30B_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P30B_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P30B_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P30B_ENVIRONMENTS.UNKNOWN;
}

function canExposeScaffold(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function createInventoryBridgeRuntimeScaffold(environment = INVENTORY_BRIDGE_P30B_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safe = canExposeScaffold(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P30B_PHASE,
    environment: normalizedEnvironment,
    status: safe ? INVENTORY_BRIDGE_P30B_STATUS.INACTIVE : INVENTORY_BRIDGE_P30B_STATUS.BLOCKED,
    scaffold_available: safe,
    inactive_runtime_scaffold: true,
    hard_disabled: true,
    inventory_system_of_record: true,
    review_only: true,
    scaffold_only: true,
    candidate_only: true,
    preview_only: true,
    dependencies_required: Object.freeze({
      scanops_30a_runtime_scaffold: true,
      inventory_29e_architecture_foundation: true,
      scanops_29d_architecture_foundation: true,
      phase_28_candidate_chain_closed: true,
    }),
    runtime_slots: Object.freeze({
      config_slot_defined: true,
      listener_boundary_slot_defined: true,
      candidate_inbox_slot_defined: true,
      validation_candidate_slot_defined: true,
      receipt_candidate_slot_defined: true,
      activation_slot_defined: false,
    }),
    disabled_operations: Object.freeze({
      start_runtime: false,
      stop_runtime: false,
      open_listener: false,
      ingest_candidate: false,
      emit_receipt: false,
      persist_inbox: false,
      persist_receipt: false,
      mutate_inventory: false,
      mutate_scanops: false,
    }),
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
