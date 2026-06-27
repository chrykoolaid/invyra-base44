import {
  INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS,
  INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_STATUS,
  buildInventoryAlignmentAcceptance,
} from '../src/inventory-bridge/alignmentAcceptance/index.js';

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

function check(result, label, accepted) {
  assert(Object.isFrozen(result), `${label} result frozen`);
  assert(Object.isFrozen(result.acceptedSequence), `${label} accepted sequence frozen`);
  assert(Object.isFrozen(result.acceptanceGate), `${label} acceptance gate frozen`);
  assert(result.candidate_alignment_accepted === accepted, `${label} accepted state`);
  assert(result.status === (accepted ? INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_STATUS.ACCEPTED : INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_STATUS.BLOCKED), `${label} status`);
  assert(result.candidate_only === true, `${label} candidate only`);
  assert(result.preview_only === true, `${label} preview only`);
  assert(result.acceptedSequence.scanops_local_queue_candidate === accepted, `${label} ScanOps queue state`);
  assert(result.acceptedSequence.inventory_inbox_candidate === accepted, `${label} Inventory inbox state`);
  assert(result.acceptedSequence.inventory_validation_candidate === accepted, `${label} Inventory validation state`);
  assert(result.acceptedSequence.inventory_receipt_candidate === accepted, `${label} Inventory receipt state`);
  assert(result.acceptedSequence.scanops_receipt_candidate_preview === accepted, `${label} ScanOps receipt preview state`);
  assert(result.acceptedSequence.sequence_preview_only === true, `${label} sequence preview only`);
  assert(result.acceptanceGate.inventory_system_of_record === true, `${label} Inventory system of record`);
  assert(result.acceptanceGate.acceptance_preview_only === true, `${label} acceptance preview only`);
  assert(result.listener_active === false, `${label} listener off`);
  assert(result.ingestion_engine_active === false, `${label} ingestion off`);
  assert(result.transport_active === false, `${label} transport off`);
  assert(result.desktop_call_allowed === false, `${label} desktop call blocked`);
  assert(result.inbound_persistence_allowed === false, `${label} inbound persistence blocked`);
  assert(result.inbound_persisted === false, `${label} inbound not persisted`);
  assert(result.receipt_emission_allowed === false, `${label} receipt emission blocked`);
  assert(result.receipt_emitted === false, `${label} receipt not emitted`);
  assert(result.receipt_persistence_allowed === false, `${label} receipt persistence blocked`);
  assert(result.receipt_persisted === false, `${label} receipt not persisted`);
  assert(result.inventory_write_allowed === false, `${label} Inventory write blocked`);
  assert(result.stock_mutation_allowed === false, `${label} stock mutation blocked`);
  assert(result.workflow_mutation_allowed === false, `${label} workflow mutation blocked`);
  assert(result.price_mutation_allowed === false, `${label} price mutation blocked`);
  assert(result.accounting_mutation_allowed === false, `${label} accounting mutation blocked`);
  assert(result.purchase_order_write_allowed === false, `${label} PO write blocked`);
  assert(result.forecast_write_allowed === false, `${label} forecast write blocked`);
  assert(result.persisted === false, `${label} not persisted`);
  assert(result.write_attempted === false, `${label} no write attempted`);
  assert(result.mutation_attempted === false, `${label} no mutation attempted`);
}

for (const env of [INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.TRAINING, INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.TEST]) {
  check(buildInventoryAlignmentAcceptance(env), env, true);
}

for (const env of [INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.LIVE, INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.PRODUCTION, INVENTORY_BRIDGE_ALIGNMENT_ACCEPTANCE_ENVIRONMENTS.UNKNOWN]) {
  check(buildInventoryAlignmentAcceptance(env), env, false);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P28-D Inventory candidate alignment acceptance remains preview-only, non-persistent, non-receipting, non-writable, and non-mutating.');
