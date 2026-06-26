export const INVENTORY_INBOX_MODEL_PHASE = '27C';

export const INBOX_ENVIRONMENTS = Object.freeze({
  TEST: 'TEST',
  TRAINING: 'TRAINING',
  LIVE: 'LIVE',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
});

export const INBOX_STATES = Object.freeze({
  RECEIVED_CANDIDATE: 'RECEIVED_CANDIDATE',
  VALIDATION_CANDIDATE: 'VALIDATION_CANDIDATE',
  RECEIPT_CANDIDATE: 'RECEIPT_CANDIDATE',
  DUPLICATE_BLOCKED: 'DUPLICATE_BLOCKED',
  AUDIT_CANDIDATE: 'AUDIT_CANDIDATE',
  BLOCKED: 'BLOCKED',
});

export const INBOX_MODE = Object.freeze({
  CANDIDATE_ONLY: 'CANDIDATE_ONLY',
  BLOCKED: 'BLOCKED',
});

export const REQUIRED_INBOUND_FIELDS = Object.freeze([
  'inbound_id',
  'environment',
  'event_id',
  'event_key',
  'source_system',
  'source_device_id',
  'source_store_id',
  'source_workflow',
  'target_system',
  'received_at',
]);

export const REQUIRED_VALIDATION_FIELDS = Object.freeze([
  'validation_id',
  'environment',
  'inbound_id',
  'event_id',
  'contract_version',
  'validation_status',
]);

export const REQUIRED_RECEIPT_FIELDS = Object.freeze([
  'receipt_id',
  'environment',
  'inbound_id',
  'event_id',
  'receipt_status',
  'response_profile',
]);

export const REQUIRED_DUPLICATE_FIELDS = Object.freeze([
  'duplicate_key',
  'environment',
  'event_id',
  'source_device_id',
  'source_store_id',
  'source_workflow',
]);

export const REQUIRED_AUDIT_FIELDS = Object.freeze([
  'audit_id',
  'environment',
  'event_id',
  'actor_id',
  'actor_role',
  'action',
  'created_at',
]);

function normalizeEnvironment(value) {
  const environment = typeof value === 'string' ? value.trim().toUpperCase() : INBOX_ENVIRONMENTS.UNKNOWN;
  return Object.values(INBOX_ENVIRONMENTS).includes(environment) ? environment : INBOX_ENVIRONMENTS.UNKNOWN;
}

function hasRequiredFields(input = {}, fields = []) {
  return fields.every((field) => {
    const value = input[field];
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null;
  });
}

function isSafeEnvironment(environment) {
  return [INBOX_ENVIRONMENTS.TEST, INBOX_ENVIRONMENTS.TRAINING].includes(environment);
}

function baseGuard(environment, fieldsPresent) {
  const safe = isSafeEnvironment(environment);
  return Object.freeze({
    phase: INVENTORY_INBOX_MODEL_PHASE,
    environment,
    fields_present: fieldsPresent,
    mode: safe && fieldsPresent ? INBOX_MODE.CANDIDATE_ONLY : INBOX_MODE.BLOCKED,
    candidate_allowed: safe && fieldsPresent,
    live_blocked: [INBOX_ENVIRONMENTS.LIVE, INBOX_ENVIRONMENTS.PRODUCTION].includes(environment),
    inventory_system_of_record: true,
    read_only: true,
    transport_listener_active: false,
    scanner_call_accepted: false,
    inbound_persisted: false,
    receipt_emitted: false,
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

export function buildInventoryInboundEventQueue(input = {}) {
  const environment = normalizeEnvironment(input.environment);
  const fieldsPresent = hasRequiredFields(input, REQUIRED_INBOUND_FIELDS);
  const guard = baseGuard(environment, fieldsPresent);
  const duplicateKey = input.duplicate_key || [input.source_store_id, input.source_device_id, input.source_workflow, input.event_key].filter(Boolean).join('|').toLowerCase();

  return Object.freeze({
    model: 'InventoryInboundEventQueue',
    inbound_id: input.inbound_id || null,
    event_id: input.event_id || null,
    event_key: input.event_key || null,
    duplicate_key: duplicateKey || null,
    source_system: input.source_system || 'SCANOPS',
    source_device_id: input.source_device_id || null,
    source_store_id: input.source_store_id || null,
    source_workflow: input.source_workflow || null,
    target_system: input.target_system || 'INVENTORY',
    status: guard.candidate_allowed ? INBOX_STATES.RECEIVED_CANDIDATE : INBOX_STATES.BLOCKED,
    payload_preview_only: true,
    ...guard,
  });
}

export function buildInventoryInboundValidationResult(input = {}) {
  const environment = normalizeEnvironment(input.environment);
  const fieldsPresent = hasRequiredFields(input, REQUIRED_VALIDATION_FIELDS);
  const guard = baseGuard(environment, fieldsPresent);
  return Object.freeze({
    model: 'InventoryInboundValidationResult',
    validation_id: input.validation_id || null,
    inbound_id: input.inbound_id || null,
    event_id: input.event_id || null,
    contract_version: input.contract_version || null,
    validation_status: input.validation_status || null,
    validation_candidate_only: guard.candidate_allowed,
    event_accepted_for_processing: false,
    status: guard.candidate_allowed ? INBOX_STATES.VALIDATION_CANDIDATE : INBOX_STATES.BLOCKED,
    ...guard,
  });
}

export function buildInventoryHandoffReceipt(input = {}) {
  const environment = normalizeEnvironment(input.environment);
  const fieldsPresent = hasRequiredFields(input, REQUIRED_RECEIPT_FIELDS);
  const guard = baseGuard(environment, fieldsPresent);
  return Object.freeze({
    model: 'InventoryHandoffReceipt',
    receipt_id: input.receipt_id || null,
    inbound_id: input.inbound_id || null,
    event_id: input.event_id || null,
    receipt_status: input.receipt_status || null,
    response_profile: input.response_profile || null,
    receipt_candidate_only: guard.candidate_allowed,
    status: guard.candidate_allowed ? INBOX_STATES.RECEIPT_CANDIDATE : INBOX_STATES.BLOCKED,
    ...guard,
    receipt_emitted: false,
  });
}

export function buildInventoryDuplicateEventKey(input = {}) {
  const environment = normalizeEnvironment(input.environment);
  const fieldsPresent = hasRequiredFields(input, REQUIRED_DUPLICATE_FIELDS);
  const guard = baseGuard(environment, fieldsPresent);
  return Object.freeze({
    model: 'InventoryDuplicateEventKey',
    duplicate_key: input.duplicate_key || null,
    event_id: input.event_id || null,
    source_device_id: input.source_device_id || null,
    source_store_id: input.source_store_id || null,
    source_workflow: input.source_workflow || null,
    duplicate_blocked: guard.candidate_allowed,
    status: guard.candidate_allowed ? INBOX_STATES.DUPLICATE_BLOCKED : INBOX_STATES.BLOCKED,
    ...guard,
  });
}

export function buildInventoryBridgeAuditEvent(input = {}) {
  const environment = normalizeEnvironment(input.environment);
  const fieldsPresent = hasRequiredFields(input, REQUIRED_AUDIT_FIELDS);
  const guard = baseGuard(environment, fieldsPresent);
  return Object.freeze({
    model: 'InventoryBridgeAuditEvent',
    audit_id: input.audit_id || null,
    event_id: input.event_id || null,
    actor_id: input.actor_id || null,
    actor_role: input.actor_role || null,
    action: input.action || null,
    created_at: input.created_at || null,
    audit_candidate_only: guard.candidate_allowed,
    status: guard.candidate_allowed ? INBOX_STATES.AUDIT_CANDIDATE : INBOX_STATES.BLOCKED,
    ...guard,
  });
}

export function buildP27CInboxBundle(environment = INBOX_ENVIRONMENTS.TRAINING) {
  const base = {
    environment,
    event_id: 'evt-p27c-001',
    event_key: 'store-01|scanner-01|p27c|evt-p27c-001',
    source_system: 'SCANOPS',
    source_device_id: 'scanner-01',
    source_store_id: 'store-01',
    source_workflow: 'sync_handoff_foundation',
    target_system: 'INVENTORY',
    received_at: '2026-06-26T00:00:00.000Z',
  };

  return Object.freeze({
    inboundEvent: buildInventoryInboundEventQueue({ ...base, inbound_id: 'inbound-p27c-001' }),
    validationResult: buildInventoryInboundValidationResult({ validation_id: 'validation-p27c-001', environment, inbound_id: 'inbound-p27c-001', event_id: base.event_id, contract_version: 'SCANOPS_HANDOFF_MODEL_P27B', validation_status: 'CANDIDATE_ONLY' }),
    receipt: buildInventoryHandoffReceipt({ receipt_id: 'receipt-p27c-001', environment, inbound_id: 'inbound-p27c-001', event_id: base.event_id, receipt_status: 'CANDIDATE_ONLY', response_profile: 'STATIC_RESPONSE_CANDIDATE' }),
    duplicateKey: buildInventoryDuplicateEventKey({ duplicate_key: base.event_key, environment, event_id: base.event_id, source_device_id: base.source_device_id, source_store_id: base.source_store_id, source_workflow: base.source_workflow }),
    auditEvent: buildInventoryBridgeAuditEvent({ audit_id: 'audit-p27c-001', environment, event_id: base.event_id, actor_id: 'admin-01', actor_role: 'Admin', action: 'P27C_INBOX_MODEL_PREVIEW', created_at: base.received_at }),
  });
}
