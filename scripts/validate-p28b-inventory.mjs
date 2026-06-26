import {
  INVENTORY_BRIDGE_INBOX_CANDIDATE_STATUSES,
  INVENTORY_BRIDGE_INBOX_ENVIRONMENTS,
  buildInventoryInboxCandidate,
} from '../src/inventory-bridge/inboxCandidate/index.js';

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

function check(result, label, ok) {
  assert(Object.isFrozen(result), `${label} result frozen`);
  assert(Object.isFrozen(result.inboundCandidate), `${label} inbound candidate frozen`);
  assert(Object.isFrozen(result.validationCandidate), `${label} validation candidate frozen`);
  assert(Object.isFrozen(result.receiptCandidate), `${label} receipt candidate frozen`);
  assert(result.candidate === ok, `${label} candidate state`);
  assert(result.candidate_only === true, `${label} candidate-only`);
  assert(result.status === (ok ? INVENTORY_BRIDGE_INBOX_CANDIDATE_STATUSES.CANDIDATE : INVENTORY_BRIDGE_INBOX_CANDIDATE_STATUSES.BLOCKED), `${label} status`);
  assert(result.inboundCandidate.source_system === 'SCANOPS', `${label} source system`);
  assert(result.inboundCandidate.target_system === 'INVENTORY', `${label} target system`);
  assert(result.inboundCandidate.payload_preview_only === true, `${label} payload preview only`);
  assert(result.validationCandidate.validation_candidate_only === true, `${label} validation candidate only`);
  assert(result.receiptCandidate.receipt_candidate_only === true, `${label} receipt candidate only`);
  assert(result.listener_active === false, `${label} listener off`);
  assert(result.ingestion_engine_active === false, `${label} ingestion off`);
  assert(result.inbound_persistence_allowed === false, `${label} inbound persistence blocked`);
  assert(result.inbound_persisted === false, `${label} inbound not persisted`);
  assert(result.receipt_emission_allowed === false, `${label} receipt emission blocked`);
  assert(result.receipt_emitted === false, `${label} receipt not emitted`);
  assert(result.receipt_persistence_allowed === false, `${label} receipt persistence blocked`);
  assert(result.receipt_persisted === false, `${label} receipt not persisted`);
  assert(result.inventory_write_allowed === false, `${label} inventory write blocked`);
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

for (const env of [INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.TRAINING, INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.TEST]) {
  const result = buildInventoryInboxCandidate(env);
  check(result, env, true);
  assert(result.validationCandidate.validation_preview_ready === true, `${env} validation preview ready`);
  assert(result.receiptCandidate.receipt_preview_ready === true, `${env} receipt preview ready`);
}

for (const env of [INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.LIVE, INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.PRODUCTION, INVENTORY_BRIDGE_INBOX_ENVIRONMENTS.UNKNOWN]) {
  const result = buildInventoryInboxCandidate(env);
  check(result, env, false);
  assert(result.validationCandidate.validation_preview_ready === false, `${env} validation preview blocked`);
  assert(result.receiptCandidate.receipt_preview_ready === false, `${env} receipt preview blocked`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P28-B Inventory inbox candidate preview passed.');
