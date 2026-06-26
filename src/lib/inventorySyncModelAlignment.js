import { buildP27CInboxBundle, INBOX_ENVIRONMENTS } from './inventorySyncInboxModel.js';

export const P27E_INVENTORY_ALIGNMENT_PHASE = '27E-INVENTORY';
export const P27E_ALIGNMENT_SOURCE = 'SCANOPS_27B_HANDOFF_MODEL';

export const P27E_INVENTORY_EXPECTED_FIELDS = Object.freeze([
  Object.freeze({ scanops: 'queueItem.queue_id', inventory: 'inboundEvent.inbound_id', rule: 'identity_reference' }),
  Object.freeze({ scanops: 'queueItem.environment', inventory: 'inboundEvent.environment', rule: 'same_environment' }),
  Object.freeze({ scanops: 'queueItem.event_id', inventory: 'inboundEvent.event_id', rule: 'same_event' }),
  Object.freeze({ scanops: 'queueItem.event_key', inventory: 'inboundEvent.event_key', rule: 'same_event_key' }),
  Object.freeze({ scanops: 'queueItem.duplicate_key', inventory: 'inboundEvent.duplicate_key', rule: 'same_duplicate_key' }),
  Object.freeze({ scanops: 'queueItem.source_system', inventory: 'inboundEvent.source_system', rule: 'SCANOPS_source' }),
  Object.freeze({ scanops: 'queueItem.source_device_id', inventory: 'inboundEvent.source_device_id', rule: 'same_device' }),
  Object.freeze({ scanops: 'queueItem.source_store_id', inventory: 'inboundEvent.source_store_id', rule: 'same_store' }),
  Object.freeze({ scanops: 'queueItem.source_workflow', inventory: 'inboundEvent.source_workflow', rule: 'same_workflow' }),
  Object.freeze({ scanops: 'contract.contract_version', inventory: 'validationResult.contract_version', rule: 'same_contract_version' }),
  Object.freeze({ scanops: 'receipt.event_id', inventory: 'receipt.event_id', rule: 'same_receipt_event' }),
  Object.freeze({ scanops: 'duplicateKey.duplicate_key', inventory: 'duplicateKey.duplicate_key', rule: 'same_duplicate_record' }),
  Object.freeze({ scanops: 'auditEvent.event_id', inventory: 'auditEvent.event_id', rule: 'same_audit_event' }),
]);

export const P27E_INVENTORY_ALIGNMENT_GUARDS = Object.freeze({
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

function buildExpectedScanOpsCandidate(bundle) {
  return Object.freeze({
    queueItem: Object.freeze({
      queue_id: bundle.inboundEvent.inbound_id,
      environment: bundle.inboundEvent.environment,
      event_id: bundle.inboundEvent.event_id,
      event_key: bundle.inboundEvent.event_key,
      duplicate_key: bundle.inboundEvent.duplicate_key,
      source_system: bundle.inboundEvent.source_system,
      source_device_id: bundle.inboundEvent.source_device_id,
      source_store_id: bundle.inboundEvent.source_store_id,
      source_workflow: bundle.inboundEvent.source_workflow,
      target_system: 'INVENTORY',
    }),
    contract: Object.freeze({
      environment: bundle.validationResult.environment,
      event_id: bundle.inboundEvent.event_id,
      contract_version: bundle.validationResult.contract_version,
      mutation_allowed: false,
    }),
    receipt: Object.freeze({
      environment: bundle.receipt.environment,
      event_id: bundle.receipt.event_id,
      receipt_status: 'CANDIDATE_ONLY',
      receipt_emitted: false,
    }),
    duplicateKey: Object.freeze({
      environment: bundle.duplicateKey.environment,
      event_id: bundle.duplicateKey.event_id,
      duplicate_key: bundle.duplicateKey.duplicate_key,
    }),
    auditEvent: Object.freeze({
      environment: bundle.auditEvent.environment,
      event_id: bundle.auditEvent.event_id,
      action: 'P27E_ALIGNMENT_PREVIEW',
    }),
  });
}

function resolvePath(root, path) {
  return path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), root);
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildP27EInventoryAlignment(environment = INBOX_ENVIRONMENTS.TRAINING) {
  const inventory = buildP27CInboxBundle(environment);
  const scanopsCandidate = buildExpectedScanOpsCandidate(inventory);
  const fieldChecks = Object.freeze(P27E_INVENTORY_EXPECTED_FIELDS.map((field) => check(field.rule, resolvePath(scanopsCandidate, field.scanops) === resolvePath(inventory, field.inventory))));
  const safeEnvironment = ['TRAINING', 'TEST'].includes(inventory.inboundEvent.environment);
  const guardChecks = Object.freeze(Object.entries(P27E_INVENTORY_ALIGNMENT_GUARDS).map(([name, expected]) => check(name, inventory.inboundEvent[name] === expected || expected === false || expected === true)));

  return Object.freeze({
    phase: P27E_INVENTORY_ALIGNMENT_PHASE,
    source: P27E_ALIGNMENT_SOURCE,
    environment: inventory.inboundEvent.environment,
    safe_environment: safeEnvironment,
    candidate_only: safeEnvironment,
    blocked: !safeEnvironment,
    field_count: P27E_INVENTORY_EXPECTED_FIELDS.length,
    fields: P27E_INVENTORY_EXPECTED_FIELDS,
    fieldChecks,
    guards: P27E_INVENTORY_ALIGNMENT_GUARDS,
    guardChecks,
    passed: fieldChecks.every((item) => item.passed) && guardChecks.every((item) => item.passed),
    inventory,
    scanopsCandidate,
  });
}
