export const INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_PHASE = '28D-INVENTORY-ACCEPTANCE';

export const INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_STATUS = Object.freeze({
  ACCEPTED: 'CANDIDATE_ALIGNMENT_ACCEPTED',
  BLOCKED: 'CANDIDATE_ALIGNMENT_BLOCKED',
});

export const INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.UNKNOWN;
}

function canAcceptCandidateAlignment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

function buildAcceptedSequence(environment, accepted) {
  return Object.freeze({
    environment,
    scanops_local_queue_candidate: accepted,
    inventory_inbox_candidate: accepted,
    inventory_validation_candidate: accepted,
    inventory_receipt_candidate: accepted,
    scanops_receipt_candidate_preview: accepted,
    sequence_preview_only: true,
    sequence_persisted: false,
    sequence_write_attempted: false,
    sequence_mutation_attempted: false,
  });
}

function buildInventoryAcceptanceGate(environment, accepted) {
  return Object.freeze({
    environment,
    candidate_alignment_accepted: accepted,
    inventory_system_of_record: true,
    acceptance_preview_only: true,
    listener_active: false,
    ingestion_engine_active: false,
    inbound_persistence_allowed: false,
    receipt_emission_allowed: false,
    inventory_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
  });
}

export function buildInventoryAlignmentAcceptance(environment = INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const accepted = canAcceptCandidateAlignment(normalizedEnvironment);
  const acceptedSequence = buildAcceptedSequence(normalizedEnvironment, accepted);
  const acceptanceGate = buildInventoryAcceptanceGate(normalizedEnvironment, accepted);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_PHASE,
    environment: normalizedEnvironment,
    status: accepted
      ? INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_STATUS.ACCEPTED
      : INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_STATUS.BLOCKED,
    candidate_alignment_accepted: accepted,
    candidate_only: true,
    preview_only: true,
    acceptedSequence,
    acceptanceGate,
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
