export const INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_PHASE = '28F-INVENTORY-SCANOPS-ACK-ACCEPTANCE';

export const INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_STATUS = Object.freeze({
  ACCEPTED: 'SCANOPS_ACK_ACCEPTED',
  BLOCKED: 'SCANOPS_ACK_BLOCKED',
});

export const INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.UNKNOWN;
}

function canAccept(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

function buildScanOpsAckReference(environment, accepted) {
  return Object.freeze({
    referenced_phase: '28E-SCANOPS-ACK',
    environment,
    inventory_acceptance_acknowledged: accepted,
    acknowledgement_preview_only: true,
    acknowledgement_emitted: false,
    acknowledgement_persisted: false,
    desktop_call_attempted: false,
    transport_active: false,
    event_sent: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}

function buildInventoryAckAcceptance(environment, accepted) {
  return Object.freeze({
    acceptance_phase: INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_PHASE,
    environment,
    scanops_acknowledgement_accepted: accepted,
    inventory_system_of_record: true,
    acceptance_preview_only: true,
    listener_active: false,
    ingestion_engine_active: false,
    inbound_persisted: false,
    receipt_emitted: false,
    receipt_persisted: false,
    inventory_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
  });
}

export function buildInventoryScanOpsAckAcceptance(environment = INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const accepted = canAccept(normalizedEnvironment);
  const scanOpsAckReference = buildScanOpsAckReference(normalizedEnvironment, accepted);
  const inventoryAckAcceptance = buildInventoryAckAcceptance(normalizedEnvironment, accepted);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_PHASE,
    environment: normalizedEnvironment,
    status: accepted
      ? INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_STATUS.ACCEPTED
      : INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_STATUS.BLOCKED,
    scanops_acknowledgement_accepted: accepted,
    candidate_only: true,
    preview_only: true,
    scanOpsAckReference,
    inventoryAckAcceptance,
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
