export const INVENTORY_BRIDGE_INBOX_CANDIDATE_PHASE = '28B-INVENTORY';

export const INVENTORY_BRIDGE_INBOX_CANDIDATE_STATUSES = Object.freeze({
  CANDIDATE: 'INBOX_CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const INVENTORY_BRIDGE_INBOX_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

function buildInboundCandidate(environment) {
  return Object.freeze({
    candidate_id: `inventory-inbox-${environment.toLowerCase()}-candidate-v1`,
    environment,
    source_system: 'SCANOPS',
    target_system: 'INVENTORY',
    contract_version: 'candidate-preview-v1',
    inbox_candidate_only: true,
    payload_preview_only: true,
    listener_active: false,
    inbound_persistence_allowed: false,
    inbound_persisted: false,
    inbound_write_attempted: false,
  });
}

function buildValidationCandidate(environment, candidate) {
  return Object.freeze({
    validation_id: `inventory-validation-${environment.toLowerCase()}-candidate-v1`,
    environment,
    candidate,
    validation_candidate_only: true,
    validation_preview_ready: candidate,
    validation_executed: false,
    validation_persisted: false,
    validation_write_attempted: false,
    inventory_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
    price_mutation_allowed: false,
    accounting_mutation_allowed: false,
    purchase_order_write_allowed: false,
    forecast_write_allowed: false,
  });
}

function buildReceiptCandidate(environment, candidate) {
  return Object.freeze({
    receipt_id: `inventory-receipt-${environment.toLowerCase()}-candidate-v1`,
    environment,
    candidate,
    receipt_candidate_only: true,
    receipt_preview_ready: candidate,
    receipt_emission_allowed: false,
    receipt_emitted: false,
    receipt_persistence_allowed: false,
    receipt_persisted: false,
    receipt_write_attempted: false,
  });
}

export function buildInventoryInboxCandidate(environment = INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const candidate = isSafeEnvironment(normalizedEnvironment);
  const inboundCandidate = buildInboundCandidate(normalizedEnvironment);
  const validationCandidate = buildValidationCandidate(normalizedEnvironment, candidate);
  const receiptCandidate = buildReceiptCandidate(normalizedEnvironment, candidate);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_INBOX_CANDIDATE_PHASE,
    environment: normalizedEnvironment,
    status: candidate
      ? INVENTORY_BRIDGE_INBOX_CANDIDATE_STATUSES.CANDIDATE
      : INVENTORY_BRIDGE_INBOX_CANDIDATE_STATUSES.BLOCKED,
    candidate,
    candidate_only: true,
    inboundCandidate,
    validationCandidate,
    receiptCandidate,
    listener_active: false,
    ingestion_engine_active: false,
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
