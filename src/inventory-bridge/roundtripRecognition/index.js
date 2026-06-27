export const INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_PHASE = '28H-INVENTORY-ROUNDTRIP-RECOGNITION';

export const INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_STATUS = Object.freeze({
  RECOGNIZED: 'CANDIDATE_ROUNDTRIP_RECOGNIZED',
  BLOCKED: 'CANDIDATE_ROUNDTRIP_BLOCKED',
});

export const INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_ENVIRONMENTS.UNKNOWN;
}

function canRecognize(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

function buildRecognizedSequence(environment, recognized) {
  return Object.freeze({
    environment,
    scanops_queue_candidate: recognized,
    inventory_inbox_candidate: recognized,
    inventory_alignment_acceptance: recognized,
    scanops_acknowledgement_preview: recognized,
    inventory_acknowledgement_acceptance: recognized,
    scanops_roundtrip_closure: recognized,
    sequence_preview_only: true,
    sequence_persisted: false,
    sequence_event_emitted: false,
    sequence_write_attempted: false,
    sequence_mutation_attempted: false,
  });
}

function buildInventoryRecognitionGate(environment, recognized) {
  return Object.freeze({
    environment,
    roundtrip_recognized: recognized,
    inventory_system_of_record: true,
    recognition_preview_only: true,
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

export function buildInventoryRoundtripRecognition(environment = INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const recognized = canRecognize(normalizedEnvironment);
  const recognizedSequence = buildRecognizedSequence(normalizedEnvironment, recognized);
  const recognitionGate = buildInventoryRecognitionGate(normalizedEnvironment, recognized);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_PHASE,
    environment: normalizedEnvironment,
    status: recognized
      ? INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_STATUS.RECOGNIZED
      : INVENTORY_BRIDGE_ROUNDTRIP_RECOGNITION_STATUS.BLOCKED,
    roundtrip_recognized: recognized,
    candidate_only: true,
    preview_only: true,
    recognizedSequence,
    recognitionGate,
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
