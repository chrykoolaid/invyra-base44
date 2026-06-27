export const INVENTORY_BRIDGE_PHASE28_CLOSURE_PHASE = '28J-INVENTORY-PHASE28-CLOSURE';

export const INVENTORY_BRIDGE_PHASE28_CLOSURE_STATUS = Object.freeze({
  CLOSED: 'PHASE28_CANDIDATE_CHAIN_CLOSED',
  BLOCKED: 'PHASE28_CANDIDATE_CHAIN_BLOCKED',
});

export const INVENTORY_BRIDGE_PHASE28_CLOSURE_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_PHASE28_CLOSURE_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_PHASE28_CLOSURE_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_PHASE28_CLOSURE_ENVIRONMENTS.UNKNOWN;
}

function canClose(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

function buildClosedPhaseList(closed) {
  return Object.freeze({
    phase_28a_scanops_candidate: closed,
    phase_28b_inventory_inbox_candidate: closed,
    phase_28c_scanops_alignment: closed,
    phase_28d_inventory_acceptance: closed,
    phase_28e_scanops_acknowledgement: closed,
    phase_28f_inventory_ack_acceptance: closed,
    phase_28g_scanops_roundtrip_closure: closed,
    phase_28h_inventory_roundtrip_recognition: closed,
    phase_28i_scanops_phase28_closure: closed,
  });
}

export function buildInventoryPhase28Closure(environment = INVENTORY_BRIDGE_PHASE28_CLOSURE_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const closed = canClose(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_PHASE28_CLOSURE_PHASE,
    environment: normalizedEnvironment,
    status: closed
      ? INVENTORY_BRIDGE_PHASE28_CLOSURE_STATUS.CLOSED
      : INVENTORY_BRIDGE_PHASE28_CLOSURE_STATUS.BLOCKED,
    phase_28_candidate_chain_closed: closed,
    inventory_system_of_record: true,
    candidate_only: true,
    preview_only: true,
    closedPhases: buildClosedPhaseList(closed),
    listener_active: false,
    ingestion_engine_active: false,
    transport_active: false,
    desktop_call_allowed: false,
    inbound_persistence_allowed: false,
    inbound_persisted: false,
    receipt_emission_allowed: false,
    receipt_emitted: false,
    receipt_persistence_allowed: false,
    receipt_persisted: false,
    acknowledgement_emission_allowed: false,
    acknowledgement_emitted: false,
    acknowledgement_persistence_allowed: false,
    acknowledgement_persisted: false,
    inventory_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
    price_mutation_allowed: false,
    accounting_mutation_allowed: false,
    purchase_order_write_allowed: false,
    forecast_write_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
