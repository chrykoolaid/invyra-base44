export const INVENTORY_BRIDGE_P29B_PHASE = '29B-INVENTORY-PREACTIVATION-BOUNDARY';

export const INVENTORY_BRIDGE_P29B_STATUS = Object.freeze({
  READY: 'PREACTIVATION_BOUNDARY_READY',
  BLOCKED: 'PREACTIVATION_BOUNDARY_BLOCKED',
});

export const INVENTORY_BRIDGE_P29B_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P29B_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P29B_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P29B_ENVIRONMENTS.UNKNOWN;
}

function canReview(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildInventoryPreactivationBoundary(environment = INVENTORY_BRIDGE_P29B_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canReview(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P29B_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P29B_STATUS.READY : INVENTORY_BRIDGE_P29B_STATUS.BLOCKED,
    preactivation_boundary_ready: ready,
    inventory_system_of_record: true,
    phase_28_candidate_chain_closed_required: true,
    phase_28_candidate_chain_closed_assumed: ready,
    scanops_phase_29a_boundary_required: true,
    scanops_phase_29a_boundary_assumed: ready,
    review_only: true,
    candidate_only: true,
    preview_only: true,
    transport_may_be_designed_later: true,
    listener_may_be_designed_later: true,
    listener_active: false,
    ingestion_engine_active: false,
    transport_active: false,
    desktop_call_allowed: false,
    inbound_persistence_allowed: false,
    inbound_persisted: false,
    outbound_queue_persisted: false,
    receipt_emission_allowed: false,
    receipt_emitted: false,
    receipt_persistence_allowed: false,
    receipt_persisted: false,
    acknowledgement_emission_allowed: false,
    acknowledgement_emitted: false,
    acknowledgement_persistence_allowed: false,
    acknowledgement_persisted: false,
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
