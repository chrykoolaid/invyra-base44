export const INVENTORY_BRIDGE_P31D_PHASE = '31D-QUEUE-ENVELOPE-BUNDLE';

export const INVENTORY_BRIDGE_P31D_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31D_FLOW_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31D_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31D_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31D_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildQueueEnvelopeFoundation(environment = INVENTORY_BRIDGE_P31D_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31D_PHASE,
    environment: normalizedEnvironment,
    queue_envelope_foundation_ready: safeEnvironment,
    flow_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31D_FLOW_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31D_FLOW_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    queue_reader_shape: Object.freeze({
      queue_reader_reference_required: true,
      envelope_reference_required: true,
      ordering_reference_required: true,
      created: false,
      read: false,
      persisted: false,
    }),
    envelope_dispatcher_shape: Object.freeze({
      dispatcher_reference_required: true,
      envelope_reference_required: true,
      destination_reference_required: true,
      created: false,
      dispatched: false,
      persisted: false,
    }),
    inbox_router_shape: Object.freeze({
      router_reference_required: true,
      inbox_reference_required: true,
      receipt_reference_allowed: true,
      created: false,
      routed: false,
      persisted: false,
    }),
    receipt_flow_shape: Object.freeze({
      receipt_flow_reference_required: true,
      acknowledgement_reference_allowed: true,
      validation_reference_allowed: true,
      created: false,
      emitted: false,
      persisted: false,
    }),
    feature_flags: Object.freeze({
      queue_reader_enabled: false,
      envelope_dispatcher_enabled: false,
      inbox_router_enabled: false,
      receipt_flow_enabled: false,
      business_processing_enabled: false,
    }),
    disabled_operations: Object.freeze({
      read_queue: false,
      dispatch_envelope: false,
      route_inbox: false,
      emit_receipt: false,
      validate_payload: false,
      persist_flow_state: false,
      call_transport: false,
      write_inventory: false,
      write_scanops: false,
    }),
    queue_read_attempted: false,
    envelope_dispatch_attempted: false,
    inbox_route_attempted: false,
    receipt_emit_attempted: false,
    payload_validation_attempted: false,
    flow_state_persisted: false,
    transport_called: false,
    inventory_write_allowed: false,
    scanops_write_allowed: false,
    stock_mutation_allowed: false,
    workflow_mutation_allowed: false,
    runtime_activation_allowed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
  });
}
