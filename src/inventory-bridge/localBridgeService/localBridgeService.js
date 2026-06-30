import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../config/bridgeConfigurationDefaults.js';

export const INVENTORY_DESKTOP_LOCAL_BRIDGE_PHASE = '5';
export const INVENTORY_DESKTOP_LOCAL_BRIDGE_COMPONENT = 'inventory_desktop_local_bridge_service';
export const INVENTORY_DESKTOP_LOCAL_BRIDGE_VERSION = 'inventory-desktop-local-bridge.v0.5.0';
export const INVENTORY_DESKTOP_LOCAL_BRIDGE_SERVICE_NAME = 'Inventory Desktop Local Bridge Service';

export const INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES = Object.freeze({
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  DUPLICATE: 'DUPLICATE',
  UNSUPPORTED: 'UNSUPPORTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
});

export const INVENTORY_DESKTOP_LOCAL_BRIDGE_OPERATION_TYPES = Object.freeze([
  'LOOKUP_REQUEST',
  'COUNT_SUBMISSION',
  'RECEIVING_SUBMISSION',
  'TRANSFER_SUBMISSION',
  'WASTE_SUBMISSION',
  'MARKDOWN_SUBMISSION',
  'EXPIRY_SUBMISSION',
  'MOVEMENT_NOTE',
  'DEVICE_HEALTH_PING',
]);

export const INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES = Object.freeze({
  SERVICE_STARTED: 'BRIDGE_SERVICE_STARTED',
  SERVICE_DISABLED: 'BRIDGE_SERVICE_DISABLED',
  HEALTH_CHECK_RECEIVED: 'HEALTH_CHECK_RECEIVED',
  HANDOFF_RECEIVED: 'HANDOFF_RECEIVED',
  HANDOFF_ACCEPTED: 'HANDOFF_ACCEPTED',
  HANDOFF_REJECTED: 'HANDOFF_REJECTED',
  DUPLICATE_ENVELOPE_DETECTED: 'DUPLICATE_ENVELOPE_DETECTED',
  UNSUPPORTED_OPERATION_REJECTED: 'UNSUPPORTED_OPERATION_REJECTED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
});

const DEFAULT_DESKTOP_ID = 'invyra-inventory-desktop-local';
const DEFAULT_DESKTOP_NAME = 'Invyra Inventory Desktop';
const DEFAULT_ENVIRONMENT = 'LIVE';
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

function nowIso(now) {
  if (typeof now === 'function') return now();
  return new Date().toISOString();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringList(value) {
  return Array.isArray(value) ? value.map(asTrimmedString).filter(Boolean) : [];
}

function freezeIssue(code, message, field = null) {
  return Object.freeze({ code, message, field });
}

function freezeArray(items) {
  return Object.freeze([...items]);
}

function safeOperationType(operationType) {
  return asTrimmedString(operationType).toUpperCase();
}

function safeTimestamp(value) {
  const timestamp = asTrimmedString(value);
  if (!timestamp || !ISO_TIMESTAMP_PATTERN.test(timestamp)) return '';
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? '' : timestamp;
}

function normalizeDesktopIdentity(options = {}, configuration = INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS) {
  const identity = options.desktopIdentity || {};
  return Object.freeze({
    desktopId: asTrimmedString(identity.desktopId) || asTrimmedString(identity.desktop_id) || asTrimmedString(configuration.target_inventory_instance_id) || DEFAULT_DESKTOP_ID,
    desktopName: asTrimmedString(identity.desktopName) || asTrimmedString(identity.desktop_name) || DEFAULT_DESKTOP_NAME,
  });
}

function getEnvelopeTargetDesktopId(envelope = {}) {
  const target = isPlainObject(envelope.target) ? envelope.target : {};
  const payload = isPlainObject(envelope.payload) ? envelope.payload : {};
  return asTrimmedString(envelope.desktopId)
    || asTrimmedString(envelope.desktop_id)
    || asTrimmedString(envelope.targetDesktopId)
    || asTrimmedString(envelope.target_desktop_id)
    || asTrimmedString(target.desktopId)
    || asTrimmedString(target.desktop_id)
    || asTrimmedString(payload.desktopId)
    || asTrimmedString(payload.desktop_id);
}

function getEnvelopeEnvironment(envelope = {}) {
  const target = isPlainObject(envelope.target) ? envelope.target : {};
  const payload = isPlainObject(envelope.payload) ? envelope.payload : {};
  return asTrimmedString(envelope.environment)
    || asTrimmedString(target.environment)
    || asTrimmedString(payload.environment);
}

function normalizeTransportEnvelope(envelope = {}) {
  const source = isPlainObject(envelope.source) ? envelope.source : {};
  const metadata = isPlainObject(envelope.metadata) ? envelope.metadata : {};

  return Object.freeze({
    envelopeId: asTrimmedString(envelope.envelopeId)
      || asTrimmedString(envelope.envelope_id)
      || asTrimmedString(envelope.event_id)
      || asTrimmedString(metadata.envelopeId)
      || asTrimmedString(metadata.envelope_id),
    operationType: safeOperationType(envelope.operationType)
      || safeOperationType(envelope.operation_type)
      || safeOperationType(envelope.event_type)
      || safeOperationType(metadata.operationType)
      || safeOperationType(metadata.operation_type),
    timestamp: safeTimestamp(envelope.timestamp)
      || safeTimestamp(envelope.occurred_at)
      || safeTimestamp(envelope.createdAt)
      || safeTimestamp(envelope.created_at)
      || safeTimestamp(metadata.timestamp),
    sourceDeviceId: asTrimmedString(envelope.sourceDeviceId)
      || asTrimmedString(envelope.source_device_id)
      || asTrimmedString(source.deviceId)
      || asTrimmedString(source.device_id)
      || asTrimmedString(metadata.sourceDeviceId)
      || asTrimmedString(metadata.source_device_id),
    sourceSessionId: asTrimmedString(envelope.sourceSessionId)
      || asTrimmedString(envelope.source_session_id)
      || asTrimmedString(source.sessionId)
      || asTrimmedString(source.session_id)
      || asTrimmedString(metadata.sourceSessionId)
      || asTrimmedString(metadata.source_session_id),
    sourceStoreId: asTrimmedString(envelope.sourceStoreId)
      || asTrimmedString(envelope.source_store_id)
      || asTrimmedString(source.storeId)
      || asTrimmedString(source.store_id)
      || asTrimmedString(metadata.sourceStoreId)
      || asTrimmedString(metadata.source_store_id),
    targetDesktopId: getEnvelopeTargetDesktopId(envelope),
    environment: getEnvelopeEnvironment(envelope),
    payload: isPlainObject(envelope.payload) ? Object.freeze({ ...envelope.payload }) : null,
  });
}

function validateInventoryBridgeHandoffEnvelope(envelope = {}, context = {}) {
  const configuration = context.configuration || INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS;
  const identity = context.identity || normalizeDesktopIdentity({}, configuration);
  const expectedEnvironment = asTrimmedString(context.environment) || DEFAULT_ENVIRONMENT;
  const normalized = normalizeTransportEnvelope(envelope);
  const errors = [];
  const warnings = [];
  const trustedDeviceIds = asStringList(configuration.trusted_device_ids);

  if (!normalized.envelopeId) {
    errors.push(freezeIssue('ENVELOPE_ID_REQUIRED', 'Envelope ID is required.', 'envelopeId'));
  }

  if (!normalized.operationType) {
    errors.push(freezeIssue('OPERATION_TYPE_REQUIRED', 'Operation type is required.', 'operationType'));
  }

  if (!normalized.timestamp) {
    errors.push(freezeIssue('TIMESTAMP_REQUIRED', 'A valid ISO timestamp is required.', 'timestamp'));
  }

  if (!normalized.sourceDeviceId) {
    errors.push(freezeIssue('SOURCE_DEVICE_REQUIRED', 'Source device ID is required.', 'sourceDeviceId'));
  }

  if (!normalized.payload) {
    errors.push(freezeIssue('PAYLOAD_REQUIRED', 'Payload must be a plain object.', 'payload'));
  }

  if (normalized.targetDesktopId && normalized.targetDesktopId !== identity.desktopId) {
    errors.push(freezeIssue('DESKTOP_TARGET_MISMATCH', 'Envelope target desktop does not match this Inventory Desktop.', 'targetDesktopId'));
  }

  if (configuration.target_inventory_instance_id && !normalized.targetDesktopId) {
    errors.push(freezeIssue('DESKTOP_TARGET_REQUIRED', 'Envelope target desktop is required when Inventory Desktop identity is configured.', 'targetDesktopId'));
  }

  if (normalized.environment && normalized.environment !== expectedEnvironment) {
    errors.push(freezeIssue('ENVIRONMENT_MISMATCH', 'Envelope environment does not match this Inventory Desktop environment.', 'environment'));
  }

  if (!normalized.environment) {
    warnings.push(freezeIssue('ENVIRONMENT_NOT_PROVIDED', 'Envelope did not provide an environment; current desktop environment was assumed.', 'environment'));
  }

  if (trustedDeviceIds.length > 0 && !trustedDeviceIds.includes(normalized.sourceDeviceId)) {
    errors.push(freezeIssue('DEVICE_NOT_TRUSTED', 'Source device is not in the trusted device list.', 'sourceDeviceId'));
  }

  const supported = INVENTORY_DESKTOP_LOCAL_BRIDGE_OPERATION_TYPES.includes(normalized.operationType);

  return Object.freeze({
    valid: errors.length === 0,
    supported,
    normalized,
    errors: freezeArray(errors),
    warnings: freezeArray(warnings),
  });
}

function buildReceipt({ status, normalized, identity, environment, message, errors = [], warnings = [], now }) {
  const timestamp = nowIso(now);
  const envelopeId = normalized?.envelopeId || null;
  const operationType = normalized?.operationType || null;

  return Object.freeze({
    receiptId: `receipt:${status.toLowerCase()}:${envelopeId || 'missing'}:${timestamp}`,
    envelopeId,
    status,
    receivedAt: timestamp,
    processedAt: timestamp,
    desktopId: identity.desktopId,
    environment,
    operationType,
    message,
    errors: freezeArray(errors),
    warnings: freezeArray(warnings),
    inventoryMutationAttempted: false,
    ledgerWriteAttempted: false,
    stockMutationAttempted: false,
  });
}

function createInitialMetrics() {
  return {
    acceptedCount: 0,
    rejectedCount: 0,
    duplicateCount: 0,
    unsupportedCount: 0,
    serviceUnavailableCount: 0,
    lastHealthCheckAt: null,
    lastHandoffReceivedAt: null,
  };
}

export function createInventoryDesktopLocalBridgeService(options = {}) {
  const configuration = options.configuration || INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS;
  const identity = normalizeDesktopIdentity(options, configuration);
  const environment = asTrimmedString(options.environment) || DEFAULT_ENVIRONMENT;
  const enabled = configuration.bridge_enabled === true && options.disabled !== true;
  const status = enabled ? 'READY' : 'DISABLED';
  const duplicateEnvelopeIds = new Set();
  const events = [];
  const metrics = createInitialMetrics();

  function pushEvent(type, details = {}) {
    const event = Object.freeze({
      eventId: `bridge-event:${events.length + 1}`,
      type,
      timestamp: nowIso(options.now),
      component: INVENTORY_DESKTOP_LOCAL_BRIDGE_COMPONENT,
      phase: INVENTORY_DESKTOP_LOCAL_BRIDGE_PHASE,
      desktopId: identity.desktopId,
      environment,
      details: Object.freeze({ ...details }),
    });
    events.push(event);
    return event;
  }

  pushEvent(enabled ? INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.SERVICE_STARTED : INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.SERVICE_DISABLED, {
    status,
    acceptsHandoff: enabled,
  });

  function getHealth(request = {}) {
    metrics.lastHealthCheckAt = nowIso(options.now);
    pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.HEALTH_CHECK_RECEIVED, {
      requestId: asTrimmedString(request.requestId) || null,
      acceptsHandoff: enabled,
    });

    return Object.freeze({
      ok: enabled,
      service: INVENTORY_DESKTOP_LOCAL_BRIDGE_SERVICE_NAME,
      environment,
      desktopId: identity.desktopId,
      desktopName: identity.desktopName,
      bridgeVersion: INVENTORY_DESKTOP_LOCAL_BRIDGE_VERSION,
      status,
      timestamp: metrics.lastHealthCheckAt,
      acceptsHandoff: enabled,
      requiresPairing: asStringList(configuration.trusted_device_ids).length > 0,
      message: enabled
        ? 'Inventory Desktop local bridge service is ready for governed handoff validation. Inventory mutations remain disabled in Phase 5.'
        : 'Inventory Desktop local bridge service is disabled by configuration. Handoffs are not accepted.',
    });
  }

  function getStatus() {
    return Object.freeze({
      component: INVENTORY_DESKTOP_LOCAL_BRIDGE_COMPONENT,
      phase: INVENTORY_DESKTOP_LOCAL_BRIDGE_PHASE,
      service: INVENTORY_DESKTOP_LOCAL_BRIDGE_SERVICE_NAME,
      bridgeVersion: INVENTORY_DESKTOP_LOCAL_BRIDGE_VERSION,
      status,
      enabled,
      ready: enabled,
      acceptsHandoff: enabled,
      desktopId: identity.desktopId,
      desktopName: identity.desktopName,
      environment,
      listener: Object.freeze({
        localOnly: true,
        networkSocketOpened: false,
        httpServerStarted: false,
        websocketServerStarted: false,
        endpointFoundationReady: true,
      }),
      metrics: Object.freeze({ ...metrics }),
      guards: Object.freeze({
        inventoryMutationAttempted: false,
        ledgerWriteAttempted: false,
        stockMutationAttempted: false,
        pricingMutationAttempted: false,
        approvalBypassAttempted: false,
      }),
    });
  }

  function handleHandoff(envelope = {}) {
    metrics.lastHandoffReceivedAt = nowIso(options.now);
    const validation = validateInventoryBridgeHandoffEnvelope(envelope, { configuration, identity, environment });
    const { normalized } = validation;

    pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.HANDOFF_RECEIVED, {
      envelopeId: normalized.envelopeId || null,
      operationType: normalized.operationType || null,
    });

    if (!enabled) {
      metrics.serviceUnavailableCount += 1;
      const receipt = buildReceipt({
        status: INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.SERVICE_UNAVAILABLE,
        normalized,
        identity,
        environment,
        message: 'Bridge service is disabled. Envelope was not staged and no inventory mutation was attempted.',
        errors: [freezeIssue('BRIDGE_DISABLED', 'Bridge service is disabled by configuration.', 'bridge_enabled')],
        warnings: validation.warnings,
        now: options.now,
      });
      pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.HANDOFF_REJECTED, { envelopeId: normalized.envelopeId || null, status: receipt.status });
      return receipt;
    }

    if (!validation.valid) {
      metrics.rejectedCount += 1;
      const receipt = buildReceipt({
        status: INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.REJECTED,
        normalized,
        identity,
        environment,
        message: 'Envelope failed bridge validation. No inventory mutation was attempted.',
        errors: validation.errors,
        warnings: validation.warnings,
        now: options.now,
      });
      pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.VALIDATION_ERROR, { envelopeId: normalized.envelopeId || null, errorCount: validation.errors.length });
      pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.HANDOFF_REJECTED, { envelopeId: normalized.envelopeId || null, status: receipt.status });
      return receipt;
    }

    if (!validation.supported) {
      metrics.unsupportedCount += 1;
      const receipt = buildReceipt({
        status: INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.UNSUPPORTED,
        normalized,
        identity,
        environment,
        message: 'Operation type is not supported by the Phase 5 bridge service foundation.',
        errors: [freezeIssue('UNSUPPORTED_OPERATION', `Unsupported operation type: ${normalized.operationType}`, 'operationType')],
        warnings: validation.warnings,
        now: options.now,
      });
      pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.UNSUPPORTED_OPERATION_REJECTED, { envelopeId: normalized.envelopeId, operationType: normalized.operationType });
      return receipt;
    }

    if (duplicateEnvelopeIds.has(normalized.envelopeId)) {
      metrics.duplicateCount += 1;
      const receipt = buildReceipt({
        status: INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.DUPLICATE,
        normalized,
        identity,
        environment,
        message: 'Duplicate envelope detected. Existing envelope was not processed again and no inventory mutation was attempted.',
        warnings: validation.warnings,
        now: options.now,
      });
      pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.DUPLICATE_ENVELOPE_DETECTED, { envelopeId: normalized.envelopeId });
      return receipt;
    }

    duplicateEnvelopeIds.add(normalized.envelopeId);
    metrics.acceptedCount += 1;

    const receipt = buildReceipt({
      status: INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.ACCEPTED,
      normalized,
      identity,
      environment,
      message: 'Envelope accepted into Phase 5 bridge staging. Inventory Desktop validation passed; no stock, ledger, pricing, approval, or inventory mutation was attempted.',
      warnings: validation.warnings,
      now: options.now,
    });

    pushEvent(INVENTORY_DESKTOP_LOCAL_BRIDGE_EVENT_TYPES.HANDOFF_ACCEPTED, { envelopeId: normalized.envelopeId, operationType: normalized.operationType });
    return receipt;
  }

  function getEvents() {
    return freezeArray(events);
  }

  return Object.freeze({
    component: INVENTORY_DESKTOP_LOCAL_BRIDGE_COMPONENT,
    phase: INVENTORY_DESKTOP_LOCAL_BRIDGE_PHASE,
    version: INVENTORY_DESKTOP_LOCAL_BRIDGE_VERSION,
    enabled,
    status,
    getHealth,
    getStatus,
    handleHandoff,
    getEvents,
  });
}

export function getInventoryDesktopLocalBridgeServiceStatus(options = {}) {
  return createInventoryDesktopLocalBridgeService(options).getStatus();
}

export function getInventoryDesktopLocalBridgeHealth(options = {}) {
  return createInventoryDesktopLocalBridgeService(options).getHealth(options.request || {});
}

export function handleInventoryDesktopLocalBridgeHandoff(envelope = {}, options = {}) {
  return createInventoryDesktopLocalBridgeService(options).handleHandoff(envelope);
}

export function getInventoryDesktopLocalBridgeServiceDiagnostics(options = {}) {
  const service = createInventoryDesktopLocalBridgeService({
    ...options,
    configuration: {
      ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
      bridge_enabled: true,
      trusted_device_ids: ['scanops-device-001'],
      target_inventory_instance_id: 'desktop-001',
      ...(options.configuration || {}),
    },
    desktopIdentity: {
      desktopId: 'desktop-001',
      desktopName: 'Invyra Inventory Desktop',
      ...(options.desktopIdentity || {}),
    },
  });

  const validEnvelope = Object.freeze({
    envelopeId: 'env-phase5-valid-001',
    operationType: 'COUNT_SUBMISSION',
    timestamp: '2026-06-30T00:00:00.000Z',
    environment: 'LIVE',
    source: Object.freeze({
      deviceId: 'scanops-device-001',
      sessionId: 'session-001',
      storeId: 'store-001',
    }),
    target: Object.freeze({
      desktopId: 'desktop-001',
      environment: 'LIVE',
    }),
    payload: Object.freeze({
      evidenceOnly: true,
      itemId: 'item-001',
      countedQuantity: 1,
    }),
  });

  const health = service.getHealth({ requestId: 'diagnostic-health' });
  const accepted = service.handleHandoff(validEnvelope);
  const duplicate = service.handleHandoff(validEnvelope);
  const rejected = service.handleHandoff({ ...validEnvelope, envelopeId: '', operationType: 'COUNT_SUBMISSION' });
  const unsupported = service.handleHandoff({ ...validEnvelope, envelopeId: 'env-phase5-unsupported-001', operationType: 'UNSAFE_STOCK_MUTATION' });
  const status = service.getStatus();

  const checks = Object.freeze([
    Object.freeze({ name: 'health_endpoint_ready', passed: health.ok === true && health.acceptsHandoff === true }),
    Object.freeze({ name: 'valid_envelope_accepted', passed: accepted.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.ACCEPTED }),
    Object.freeze({ name: 'duplicate_detected', passed: duplicate.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.DUPLICATE }),
    Object.freeze({ name: 'invalid_envelope_rejected', passed: rejected.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.REJECTED }),
    Object.freeze({ name: 'unsupported_operation_rejected', passed: unsupported.status === INVENTORY_DESKTOP_LOCAL_BRIDGE_RECEIPT_STATUSES.UNSUPPORTED }),
    Object.freeze({ name: 'no_inventory_mutation', passed: [accepted, duplicate, rejected, unsupported].every((receipt) => receipt.inventoryMutationAttempted === false) }),
    Object.freeze({ name: 'no_ledger_write', passed: [accepted, duplicate, rejected, unsupported].every((receipt) => receipt.ledgerWriteAttempted === false) }),
    Object.freeze({ name: 'event_log_populated', passed: service.getEvents().length >= 5 }),
    Object.freeze({ name: 'status_metrics_updated', passed: status.metrics.acceptedCount === 1 && status.metrics.duplicateCount === 1 && status.metrics.rejectedCount === 1 && status.metrics.unsupportedCount === 1 }),
  ]);

  return Object.freeze({
    component: INVENTORY_DESKTOP_LOCAL_BRIDGE_COMPONENT,
    phase: INVENTORY_DESKTOP_LOCAL_BRIDGE_PHASE,
    passed: checks.every((check) => check.passed === true),
    health,
    accepted,
    duplicate,
    rejected,
    unsupported,
    status,
    eventCount: service.getEvents().length,
    checks,
  });
}
