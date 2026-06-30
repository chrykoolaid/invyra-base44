export const INVENTORY_BRIDGE_P31G_PHASE = '31G-OBSERVABILITY-BUNDLE';

export const INVENTORY_BRIDGE_P31G_ENVIRONMENTS = Object.freeze({
  TRAINING: 'TRAINING',
  TEST: 'TEST',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INVENTORY_BRIDGE_P31G_VISIBILITY_STATES = Object.freeze({
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  PREVIEW_ONLY: 'PREVIEW_ONLY',
  READY_DISABLED: 'READY_DISABLED',
  BLOCKED: 'BLOCKED',
});

const SAFE_ENVIRONMENTS = Object.freeze([
  INVENTORY_BRIDGE_P31G_ENVIRONMENTS.TRAINING,
  INVENTORY_BRIDGE_P31G_ENVIRONMENTS.TEST,
]);

function normalizeEnvironment(environment) {
  return typeof environment === 'string'
    ? environment.trim().toUpperCase()
    : INVENTORY_BRIDGE_P31G_ENVIRONMENTS.UNKNOWN;
}

function isSafeEnvironment(environment) {
  return SAFE_ENVIRONMENTS.includes(environment);
}

export function buildObservabilityFoundation(environment = INVENTORY_BRIDGE_P31G_ENVIRONMENTS.TRAINING) {
  const normalizedEnvironment = normalizeEnvironment(environment);
  const safeEnvironment = isSafeEnvironment(normalizedEnvironment);

  return Object.freeze({
    phase: INVENTORY_BRIDGE_P31G_PHASE,
    environment: normalizedEnvironment,
    observability_foundation_ready: safeEnvironment,
    visibility_state: safeEnvironment
      ? INVENTORY_BRIDGE_P31G_VISIBILITY_STATES.READY_DISABLED
      : INVENTORY_BRIDGE_P31G_VISIBILITY_STATES.BLOCKED,
    inventory_system_of_record: true,
    scanops_operational_layer_only: true,
    client_network_portable_bridge: true,
    desktop_first: true,
    local_first: true,
    offline_capable: true,
    foundation_only: true,
    hard_disabled: true,
    execution_disabled: true,
    health_summary_shape: Object.freeze({
      health_summary_reference_required: true,
      bridge_status_reference_allowed: true,
      device_status_reference_allowed: true,
      queue_status_reference_allowed: true,
      created: false,
      collected: false,
      persisted: false,
    }),
    metrics_snapshot_shape: Object.freeze({
      metrics_snapshot_reference_required: true,
      queue_count_reference_allowed: true,
      latency_reference_allowed: true,
      error_count_reference_allowed: true,
      created: false,
      collected: false,
      persisted: false,
    }),
    diagnostic_note_shape: Object.freeze({
      diagnostic_note_reference_required: true,
      operator_message_reference_allowed: true,
      severity_reference_allowed: true,
      created: false,
      collected: false,
      persisted: false,
    }),
    log_reference_shape: Object.freeze({
      log_reference_required: true,
      category_reference_allowed: true,
      source_reference_allowed: true,
      created: false,
      written: false,
      persisted: false,
    }),
    feature_flags: Object.freeze({
      health_summary_enabled: false,
      metrics_snapshot_enabled: false,
      diagnostic_notes_enabled: false,
      log_capture_enabled: false,
      operator_visibility_enabled: false,
    }),
    disabled_operations: Object.freeze({
      collect_health: false,
      collect_metrics: false,
      collect_diagnostics: false,
      write_log: false,
      refresh_operator_view: false,
      persist_observability_state: false,
      call_transport: false,
      write_inventory: false,
      write_scanops: false,
    }),
    health_collection_attempted: false,
    metrics_collection_attempted: false,
    diagnostics_collection_attempted: false,
    log_write_attempted: false,
    operator_view_refreshed: false,
    observability_state_persisted: false,
    transport_called: false,
    network_call_attempted: false,
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
