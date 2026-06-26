import {
  INBOX_ENVIRONMENTS,
  INBOX_MODE,
  INVENTORY_INBOX_MODEL_PHASE,
  buildInventoryBridgeAuditEvent,
  buildInventoryDuplicateEventKey,
  buildInventoryHandoffReceipt,
  buildInventoryInboundEventQueue,
  buildInventoryInboundValidationResult,
  buildP27CInboxBundle,
} from '../src/lib/inventorySyncInboxModel.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

function guard(model, label, candidate) {
  assert(Object.isFrozen(model), `${label} frozen`);
  assert(model.phase === INVENTORY_INBOX_MODEL_PHASE, `${label} phase`);
  assert(model.inventory_system_of_record === true, `${label} record owner`);
  assert(model.read_only === true, `${label} read only`);
  assert(model.transport_listener_active === false, `${label} no listener`);
  assert(model.scanner_call_accepted === false, `${label} no inbound call`);
  assert(model.inbound_persisted === false, `${label} no inbound save`);
  assert(model.receipt_emitted === false, `${label} no receipt out`);
  assert(model.stock_mutation_allowed === false, `${label} no stock change`);
  assert(model.workflow_mutation_allowed === false, `${label} no workflow change`);
  assert(model.price_mutation_allowed === false, `${label} no price change`);
  assert(model.accounting_mutation_allowed === false, `${label} no accounting change`);
  assert(model.purchase_order_write_allowed === false, `${label} no PO write`);
  assert(model.forecast_write_allowed === false, `${label} no forecast write`);
  assert(model.persisted === false, `${label} no save`);
  assert(model.write_attempted === false, `${label} no write`);
  assert(model.mutation_attempted === false, `${label} no mutate`);
  assert(model.mode === (candidate ? INBOX_MODE.CANDIDATE_ONLY : INBOX_MODE.BLOCKED), `${label} mode`);
  assert(model.candidate_allowed === candidate, `${label} candidate flag`);
}

assert(INVENTORY_INBOX_MODEL_PHASE === '27C', 'phase marker');

for (const env of [INBOX_ENVIRONMENTS.TRAINING, INBOX_ENVIRONMENTS.TEST]) {
  const bundle = buildP27CInboxBundle(env);
  assert(Object.isFrozen(bundle), `${env} bundle frozen`);
  guard(bundle.inboundEvent, `${env} inbound`, true);
  guard(bundle.validationResult, `${env} validation`, true);
  guard(bundle.receipt, `${env} receipt`, true);
  guard(bundle.duplicateKey, `${env} duplicate`, true);
  guard(bundle.auditEvent, `${env} audit`, true);
  assert(bundle.validationResult.event_accepted_for_processing === false, `${env} no processing`);
  assert(bundle.receipt.receipt_candidate_only === true, `${env} receipt candidate`);
  assert(bundle.duplicateKey.duplicate_blocked === true, `${env} duplicate candidate`);
  assert(bundle.auditEvent.audit_candidate_only === true, `${env} audit candidate`);
}

for (const env of [INBOX_ENVIRONMENTS.LIVE, INBOX_ENVIRONMENTS.PRODUCTION, INBOX_ENVIRONMENTS.UNKNOWN]) {
  const bundle = buildP27CInboxBundle(env);
  guard(bundle.inboundEvent, `${env} inbound`, false);
  guard(bundle.validationResult, `${env} validation`, false);
  guard(bundle.receipt, `${env} receipt`, false);
  guard(bundle.duplicateKey, `${env} duplicate`, false);
  guard(bundle.auditEvent, `${env} audit`, false);
}

guard(buildInventoryInboundEventQueue({ environment: 'TRAINING' }), 'missing inbound', false);
guard(buildInventoryInboundValidationResult({ environment: 'TRAINING' }), 'missing validation', false);
guard(buildInventoryHandoffReceipt({ environment: 'TRAINING' }), 'missing receipt', false);
guard(buildInventoryDuplicateEventKey({ environment: 'TRAINING' }), 'missing duplicate', false);
guard(buildInventoryBridgeAuditEvent({ environment: 'TRAINING' }), 'missing audit', false);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P27C Inventory inbox model passed: TEST/TRAINING candidate-only, LIVE/PRODUCTION blocked, read-only, no listener, no inbound save, no receipt output, no stock/workflow/price/accounting/PO/forecast change, no write, no mutation.');
