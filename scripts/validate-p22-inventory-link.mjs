import { P22_INV, P22_INV_FIXTURES } from '../src/p22-link/p22Fixtures.js';
import { buildP22InventoryLink, getP22InventoryLinkResults } from '../src/p22-link/p22Link.js';
import { getP22InventoryStatus } from '../src/p22-link/p22Status.js';

const errors = [];
function assert(condition, message) { if (!condition) errors.push(message); }

assert(P22_INV === '22A/22C', 'phase marker must remain 22A/22C');
assert(Object.isFrozen(P22_INV_FIXTURES), 'fixtures must be frozen');
assert(P22_INV_FIXTURES.length === 6, 'expected six fixtures');

const results = getP22InventoryLinkResults();
assert(Object.isFrozen(results), 'results must be frozen');

for (const result of results) {
  const { link } = result;
  assert(result.passed === true, `fixture must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(link), `link must be frozen: ${result.fixture_id}`);
  assert(link.link_candidate_only === true, `candidate only must stay true: ${result.fixture_id}`);
  assert(link.inventory_system_of_record === true, `Inventory must stay record owner: ${result.fixture_id}`);
  assert(link.pairing_established === false, `pairing must not establish: ${result.fixture_id}`);
  assert(link.connection_established === false, `connection must not establish: ${result.fixture_id}`);
  assert(link.network_call_attempted === false, `network call must not occur: ${result.fixture_id}`);
  assert(link.event_sent === false, `event send must not occur: ${result.fixture_id}`);
  assert(link.event_received === false, `event receive must not occur: ${result.fixture_id}`);
  assert(link.ack_emitted === false, `ack must not emit: ${result.fixture_id}`);
  assert(link.retry_attempted === false, `retry must not occur: ${result.fixture_id}`);
  assert(link.duplicate_written === false, `duplicate write must not occur: ${result.fixture_id}`);
  assert(link.completed === false, `completion must not occur: ${result.fixture_id}`);
  assert(link.persisted === false, `persistence must not occur: ${result.fixture_id}`);
  assert(link.write_attempted === false, `write must not occur: ${result.fixture_id}`);
  assert(link.mutation_attempted === false, `mutation must not occur: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(link.environment)) {
    assert(link.link_candidate === false, `LIVE/PRODUCTION must be blocked: ${result.fixture_id}`);
    assert(link.status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(link.environment) && link.fields_present && link.read_only) {
    assert(link.link_candidate === true, `TEST/TRAINING with valid fields may be candidate: ${result.fixture_id}`);
    assert(link.status === 'LINK_TEST_CANDIDATE_ONLY', `TEST/TRAINING status must be LINK_TEST_CANDIDATE_ONLY: ${result.fixture_id}`);
  }
}

const liveDirect = buildP22InventoryLink({ environment: 'LIVE' });
assert(liveDirect.link_candidate === false, 'direct LIVE must be blocked');
assert(liveDirect.connection_established === false, 'direct LIVE must not connect');
assert(liveDirect.write_attempted === false, 'direct LIVE must not write');
assert(liveDirect.mutation_attempted === false, 'direct LIVE must not mutate');

const trainingDirect = buildP22InventoryLink({
  link_id: 'direct-training-link',
  environment: 'TRAINING',
  control_id: 'control',
  pairing_id: 'pairing',
  device_id: 'device',
  source_system: 'INVENTORY',
  source_store_id: 'store',
  target_system: 'SCANOPS',
  visibility_mode: 'READ_ONLY',
  test_scope: 'PAIRING_LINK_CANDIDATE',
});
assert(trainingDirect.link_candidate === true, 'direct TRAINING may be candidate only');
assert(trainingDirect.read_only === true, 'direct TRAINING must be read-only');
assert(trainingDirect.pairing_established === false, 'direct TRAINING must not establish pairing');
assert(trainingDirect.connection_established === false, 'direct TRAINING must not establish connection');
assert(trainingDirect.network_call_attempted === false, 'direct TRAINING must not make network call');
assert(trainingDirect.event_sent === false, 'direct TRAINING must not send event');
assert(trainingDirect.event_received === false, 'direct TRAINING must not receive event');
assert(trainingDirect.persisted === false, 'direct TRAINING must not persist');
assert(trainingDirect.write_attempted === false, 'direct TRAINING must not write');
assert(trainingDirect.mutation_attempted === false, 'direct TRAINING must not mutate');

const writableDirect = buildP22InventoryLink({ ...trainingDirect.descriptor, visibility_mode: 'WRITE' });
assert(writableDirect.link_candidate === false, 'non-read-only mode must block candidate');
assert(writableDirect.read_only === false, 'non-read-only mode must be detected');

const missingDirect = buildP22InventoryLink({ environment: 'TRAINING' });
assert(missingDirect.link_candidate === false, 'missing fields must block candidate');
assert(missingDirect.fields_present === false, 'missing fields must be detected');

const status = getP22InventoryStatus();
assert(status.passed === true, 'status must pass');
assert(status.fixture_count === 6, 'status fixture count must match');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('P22 Inventory link candidate remains LIVE/PRODUCTION-blocked, TEST/TRAINING candidate-only, read-only, no connection, no network call, no events, no ack, no retry, not persisted, non-writable, and non-mutating.');
