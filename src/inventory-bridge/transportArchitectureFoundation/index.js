export const INVENTORY_BRIDGE_P29E_PHASE = '29E-INVENTORY-TRANSPORT-ARCHITECTURE-FOUNDATION';

export const INVENTORY_BRIDGE_P29E_STATUS = Object.freeze({
  READY: 'TRANSPORT_ARCHITECTURE_FOUNDATION_READY',
  BLOCKED: 'TRANSPORT_ARCHITECTURE_FOUNDATION_BLOCKED',
});

export const INVENTORY_BRIDGE_P29E_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P29E_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P29E_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P29E_ENVIRONMENTS.UNKNOWN;
}

function canReview(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildInventoryTransportArchitectureFoundation(environment = INVENTORY_BRIDGE_P29E_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const ready = canReview(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P29E_PHASE,
    environment: normalizedEnvironment,
    status: ready ? INVENTORY_BRIDGE_P29E_STATUS.READY : INVENTORY_BRIDGE_P29E_STATUS.BLOCKED,
    foundation_ready: ready,
    accelerated_milestone: true,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    review_only: true,
    design_only: true,
    candidate_only: true,
    preview_only: true,
    architecture_sections: Object.freeze([
      'inventory_listener_boundary',
      'candidate_inbox_contract',
      'device_identity_reference',
      'session_reference_contract',
      'offline_queue_visibility',
      'retry_visibility',
      'receipt_candidate_contract',
      'error_taxonomy',
      'security_boundary',
      'validation_rules',
    ]),
    phase_dependencies: Object.freeze({
      inventory_29b_required: true,
      scanops_29c_required: true,
      scanops_29d_required: true,
      phase_28_closed_required: true,
    }),
    disallowed_runtime: Object.freeze({
      listener_active: false,
      ingestion_engine_active: false,
      transport_active: false,
      network_call_attempted: false,
      desktop_call_allowed: false,
      event_received: false,
      inbound_persisted: false,
      receipt_emitted: false,
      receipt_persisted: false,
      inventory_write_allowed: false,
      scanops_write_allowed: false,
      mutation_allowed: false,
    }),
    runtime_activation_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
