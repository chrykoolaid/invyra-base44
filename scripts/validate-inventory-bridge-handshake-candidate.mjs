import {
  INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_COMPONENT,
  INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES,
  INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE,
  buildInventoryBridgeHandshakeCandidate,
  getInventoryBridgeHandshakeCandidateResults,
  getInventoryBridgeHandshakeCandidateStatus,
} from '../src/inventory-bridge/handshakeCandidate/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const requiredFixtureIds = Object.freeze([
  'live_candidate_blocked',
  'training_candidate_ready',
  'test_candidate_ready',
  'production_candidate_blocked',
  'unknown_candidate_blocked',
]);

assert(INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_COMPONENT === 'inventory_bridge_test_training_handshake_candidate', 'component marker must remain stable');
assert(INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE === '8A/8C', 'phase marker must remain 8A/8C');
assert(Object.isFrozen(INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES), 'fixtures collection must be frozen');
assert(INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES.length === requiredFixtureIds.length, 'fixture count must match required set');

const fixtureIds = INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES.map((fixture) => fixture.fixture_id);
for (const fixtureId of requiredFixtureIds) {
  assert(fixtureIds.includes(fixtureId), `missing required fixture ${fixtureId}`);
}

for (const fixture of INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES) {
  assert(Object.isFrozen(fixture), `fixture must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.candidate_descriptor), `candidate descriptor must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected), `fixture expected outcome must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected.blocked_reasons), `fixture blocked reasons must be frozen: ${fixture.fixture_id}`);
}

const results = getInventoryBridgeHandshakeCandidateResults();
assert(Object.isFrozen(results), 'candidate results collection must be frozen');
assert(results.length === requiredFixtureIds.length, 'candidate result count must match fixture count');

for (const result of results) {
  const { candidate } = result;
  assert(result.passed === true, `candidate result must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(candidate), `candidate must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(candidate.blocked_reasons), `blocked reasons must be frozen: ${result.fixture_id}`);
  assert(candidate.evidence_only === true, `evidence_only must remain true: ${result.fixture_id}`);
  assert(candidate.inventory_system_of_record === true, `Inventory must remain system of record: ${result.fixture_id}`);
  assert(candidate.can_finalize === false, `can_finalize must remain false: ${result.fixture_id}`);
  assert(candidate.can_exchange === false, `can_exchange must remain false: ${result.fixture_id}`);
  assert(candidate.can_persist === false, `can_persist must remain false: ${result.fixture_id}`);
  assert(candidate.can_write === false, `can_write must remain false: ${result.fixture_id}`);
  assert(candidate.can_mutate === false, `can_mutate must remain false: ${result.fixture_id}`);
  assert(candidate.finalized === false, `finalized must remain false: ${result.fixture_id}`);
  assert(candidate.exchanged === false, `exchanged must remain false: ${result.fixture_id}`);
  assert(candidate.persisted === false, `persisted must remain false: ${result.fixture_id}`);
  assert(candidate.receipt_emitted === false, `receipt_emitted must remain false: ${result.fixture_id}`);
  assert(candidate.acknowledgement_emitted === false, `acknowledgement_emitted must remain false: ${result.fixture_id}`);
  assert(candidate.write_attempted === false, `write_attempted must remain false: ${result.fixture_id}`);
  assert(candidate.mutation_attempted === false, `mutation_attempted must remain false: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(candidate.environment)) {
    assert(candidate.can_generate_candidate === false, `LIVE/PRODUCTION must not generate candidate: ${result.fixture_id}`);
    assert(candidate.candidate_status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(candidate.environment)) {
    assert(candidate.can_generate_candidate === true, `TEST/TRAINING may generate evidence candidate: ${result.fixture_id}`);
    assert(candidate.candidate_status === 'CANDIDATE_READY', `TEST/TRAINING status must be CANDIDATE_READY: ${result.fixture_id}`);
  }

  for (const check of result.checks) {
    assert(check.passed === true, `check failed for ${result.fixture_id}: ${check.name}`);
  }
}

const liveDirect = buildInventoryBridgeHandshakeCandidate({ environment: 'LIVE' });
assert(liveDirect.can_generate_candidate === false, 'direct LIVE candidate must block generation');
assert(liveDirect.can_write === false, 'direct LIVE candidate must not write');
assert(liveDirect.can_mutate === false, 'direct LIVE candidate must not mutate');

const trainingDirect = buildInventoryBridgeHandshakeCandidate({ environment: 'TRAINING' });
assert(trainingDirect.can_generate_candidate === true, 'direct TRAINING candidate may generate evidence');
assert(trainingDirect.can_finalize === false, 'direct TRAINING candidate must not finalize');
assert(trainingDirect.can_persist === false, 'direct TRAINING candidate must not persist');
assert(trainingDirect.can_write === false, 'direct TRAINING candidate must not write');
assert(trainingDirect.can_mutate === false, 'direct TRAINING candidate must not mutate');

const status = getInventoryBridgeHandshakeCandidateStatus();
assert(status.passed === true, 'candidate status must pass');
assert(status.fixture_count === requiredFixtureIds.length, 'status fixture count must match required count');
assert(Object.isFrozen(status), 'status result must be frozen');

for (const check of status.checks) {
  assert(check.passed === true, `status check failed: ${check.name}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 8A/8C handshake candidate remains LIVE-blocked, TEST/TRAINING evidence-only, read-only, not finalized, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
