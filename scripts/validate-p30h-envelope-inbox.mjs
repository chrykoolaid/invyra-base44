import { buildInventoryEnvelopeInboxContract } from '../src/inventory-bridge/envelopeInboxContract/index.js';

const training = buildInventoryEnvelopeInboxContract('TRAINING');
const test = buildInventoryEnvelopeInboxContract('TEST');
const live = buildInventoryEnvelopeInboxContract('LIVE');
const production = buildInventoryEnvelopeInboxContract('PRODUCTION');
const unknown = buildInventoryEnvelopeInboxContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.envelope_reference_shape),
  Object.isFrozen(training.inbox_shape),
  Object.isFrozen(training.disabled_inbox_operations),
  training.envelope_inbox_contract_ready === true,
  test.envelope_inbox_contract_ready === true,
  live.envelope_inbox_contract_ready === false,
  production.envelope_inbox_contract_ready === false,
  unknown.envelope_inbox_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.envelope_inbox_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.envelope_reference_shape.source_system === 'SCANOPS',
  training.envelope_reference_shape.target_system === 'INVENTORY',
  training.envelope_reference_shape.received === false,
  training.envelope_reference_shape.persisted === false,
  training.inbox_shape.persisted === false,
  training.inbox_shape.validation_executed === false,
  training.disabled_inbox_operations.open_listener === false,
  training.disabled_inbox_operations.receive_event === false,
  training.disabled_inbox_operations.persist_inbox_record === false,
  training.disabled_inbox_operations.emit_receipt === false,
  training.envelope_received === false,
  training.inbox_record_created === false,
  training.inbox_record_persisted === false,
  training.validation_executed === false,
  training.listener_active === false,
  training.ingestion_engine_active === false,
  training.event_received === false,
  training.receipt_emitted === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
  training.runtime_activation_allowed === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-H validation failed');
}

console.log('P30-H Inventory envelope/inbox contract passed.');
