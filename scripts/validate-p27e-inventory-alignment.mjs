import { INBOX_ENVIRONMENTS } from '../src/lib/inventorySyncInboxModel.js';
import { P27E_INVENTORY_EXPECTED_FIELDS, buildP27EInventoryAlignment } from '../src/lib/inventorySyncModelAlignment.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

const guardNames = [
  'inventory_system_of_record',
  'read_only',
  'transport_listener_active',
  'scanner_call_accepted',
  'inbound_persisted',
  'receipt_emitted',
  'stock_mutation_allowed',
  'workflow_mutation_allowed',
  'price_mutation_allowed',
  'accounting_mutation_allowed',
  'purchase_order_write_allowed',
  'forecast_write_allowed',
  'persisted',
  'write_attempted',
  'mutation_attempted',
];

function models(bundle) {
  return [bundle.inboundEvent, bundle.validationResult, bundle.receipt, bundle.duplicateKey, bundle.auditEvent];
}

function assertGuards(result, label) {
  for (const model of models(result.inventory)) {
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
  }
}

assert(Object.isFrozen(P27E_INVENTORY_EXPECTED_FIELDS), 'field map frozen');
assert(P27E_INVENTORY_EXPECTED_FIELDS.length >= 10, 'core fields covered');
assert(guardNames.length === 15, 'guard set stable');

for (const env of [INBOX_ENVIRONMENTS.TRAINING, INBOX_ENVIRONMENTS.TEST]) {
  const result = buildP27EInventoryAlignment(env);
  assert(Object.isFrozen(result), `${env} result frozen`);
  assert(result.passed === true, `${env} alignment passed`);
  assert(result.safe_environment === true, `${env} safe env`);
  assert(result.candidate_only === true, `${env} candidate only`);
  assert(result.blocked === false, `${env} not blocked`);
  assert(result.inventory.inboundEvent.candidate_allowed === true, `${env} inbound candidate`);
  assert(result.scanopsCandidate.queueItem.target_system === 'INVENTORY', `${env} target`);
  assert(result.inventory.validationResult.event_accepted_for_processing === false, `${env} no processing`);
  assert(result.inventory.receipt.receipt_emitted === false, `${env} no receipt output`);
  assertGuards(result, env);
}

for (const env of [INBOX_ENVIRONMENTS.LIVE, INBOX_ENVIRONMENTS.PRODUCTION, INBOX_ENVIRONMENTS.UNKNOWN]) {
  const result = buildP27EInventoryAlignment(env);
  assert(result.passed === true, `${env} structural alignment passed`);
  assert(result.safe_environment === false, `${env} unsafe env`);
  assert(result.candidate_only === false, `${env} not candidate`);
  assert(result.blocked === true, `${env} blocked`);
  assert(result.inventory.inboundEvent.candidate_allowed === false, `${env} inbound blocked`);
  assertGuards(result, env);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P27E Inventory alignment passed: Inventory 27C inbox expects the ScanOps 27B handoff fields, TEST/TRAINING candidate-only, LIVE/PRODUCTION blocked, no listener, no inbound save, no receipt output, no writes, no mutation.');
