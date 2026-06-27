import {
  INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS,
  INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_STATUS,
  buildInventoryScanOpsAckAcceptance,
} from '../src/inventory-bridge/scanOpsAckAcceptance/index.js';

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

function check(result, label, accepted) {
  assert(Object.isFrozen(result), `${label} result frozen`);
  assert(Object.isFrozen(result.scanOpsAckReference), `${label} ScanOps ack reference frozen`);
  assert(Object.isFrozen(result.inventoryAckAcceptance), `${label} Inventory ack acceptance frozen`);
  assert(result.scanops_acknowledgement_accepted === accepted, `${label} accepted state`);
  assert(result.status === (accepted ? INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_STATUS.ACCEPTED : INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_STATUS.BLOCKED), `${label} status`);
  assert(result.candidate_only === true, `${label} candidate only`);
  assert(result.preview_only === true, `${label} preview only`);
  assert(result.scanOpsAckReference.referenced_phase === '28E-SCANOPS-ACK', `${label} referenced phase`);
  assert(result.scanOpsAckReference.inventory_acceptance_acknowledged === accepted, `${label} ScanOps acknowledgement state`);
  assert(result.scanOpsAckReference.acknowledgement_preview_only === true, `${label} acknowledgement preview only`);
  assert(result.scanOpsAckReference.acknowledgement_emitted === false, `${label} acknowledgement not emitted`);
  assert(result.scanOpsAckReference.acknowledgement_persisted === false, `${label} acknowledgement not persisted`);
  assert(result.inventoryAckAcceptance.scanops_acknowledgement_accepted === accepted, `${label} Inventory acceptance state`);
  assert(result.inventoryAckAcceptance.inventory_system_of_record === true, `${label} Inventory system of record`);
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

for (const env of [INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.TRAINING, INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.TEST]) {
  check(buildInventoryScanOpsAckAcceptance(env), env, true);
}

for (const env of [INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.LIVE, INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.PRODUCTION, INVENTORY_BRIDGE_SCANOPS_ACK_ACCEPTANCE_ENVIRONMENTS.UNKNOWN]) {
  check(buildInventoryScanOpsAckAcceptance(env), env, false);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P28-F Inventory acceptance of ScanOps acknowledgement remains preview-only, non-persistent, non-receipting, non-writable, and non-mutating.');
