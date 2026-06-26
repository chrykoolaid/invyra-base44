import {
  INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_COMPONENT,
  INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES,
  INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE,
} from '../src/inventory-bridge/handshakeEvidence/handshakeEvidenceFixtures.js';
import {
  buildInventoryBridgeHandshakeEvidence,
  getInventoryBridgeHandshakeEvidenceResults,
} from '../src/inventory-bridge/handshakeEvidence/handshakeEvidenceProjection.js';
import { getInventoryBridgeHandshakeEvidenceStatus } from '../src/inventory-bridge/handshakeEvidence/handshakeEvidenceStatus.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const requiredFixtureIds = Object.freeze([
  'live_evidence_blocked',
  'training_evidence_ready',
  'test_evidence_ready',
  'production_evidence_blocked',
  'missing_required_field_blocked',
]);

assert(INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_COMPONENT === 'inventory_bridge_test_training_handshake_evidence', 'component marker must remain stable');
assert(INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE === '9A/9C', 'phase marker must remain 9A/9C');
assert(Object.isFrozen(INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES), 'fixtures collection must be frozen');
assert(INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES.length === requiredFixtureIds.length, 'fixture count must match required set');

const fixtureIds = INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES.map((fixture) => fixture.fixture_id);
for (const fixtureId of requiredFixtureIds) {
  assert(fixtureIds.includes(fixtureId), `missing required fixture ${fixtureId}`);
}

for (const fixture of INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES) {
  assert(Object.isFrozen(fixture), `fixture must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.evidence_descriptor), `evidence descriptor must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected), `fixture expected outcome must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected.blocked_reasons), `fixture blocked reasons must be frozen: ${fixture.fixture_id}`);
}

const results = getInventoryBridgeHandshakeEvidenceResults();
assert(Object.isFrozen(results), 'evidence results collection must be frozen');
assert(results.length === requiredFixtureIds.length, 'evidence result count must match fixture count');

for (const result of results) {
  const { evidence } = result;
  assert(result.passed === true, `evidence result must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(evidence), `evidence must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(evidence.blocked_reasons), `blocked reasons must be frozen: ${result.fixture_id}`);
  assert(evidence.evidence_only === true, `evidence_only must remain true: ${result.fixture_id}`);
  assert(evidence.inventory_system_of_record === true, `Inventory must remain system of record: ${result.fixture_id}`);
  assert(evidence.can_accept_peer === false, `can_accept_peer must remain false: ${result.fixture_id}`);
  assert(evidence.can_complete_handshake === false, `can_complete_handshake must remain false: ${result.fixture_id}`);
  assert(evidence.can_persist === false, `can_persist must remain false: ${result.fixture_id}`);
  assert(evidence.can_write === false, `can_write must remain false: ${result.fixture_id}`);
  assert(evidence.can_mutate === false, `can_mutate must remain false: ${result.fixture_id}`);
  assert(evidence.peer_accepted === false, `peer_accepted must remain false: ${result.fixture_id}`);
  assert(evidence.handshake_completed === false, `handshake_completed must remain false: ${result.fixture_id}`);
  assert(evidence.persisted === false, `persisted must remain false: ${result.fixture_id}`);
  assert(evidence.receipt_emitted === false, `receipt_emitted must remain false: ${result.fixture_id}`);
  assert(evidence.acknowledgement_emitted === false, `acknowledgement_emitted must remain false: ${result.fixture_id}`);
  assert(evidence.write_attempted === false, `write_attempted must remain false: ${result.fixture_id}`);
  assert(evidence.mutation_attempted === false, `mutation_attempted must remain false: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(evidence.environment)) {
    assert(evidence.can_build_evidence === false, `LIVE/PRODUCTION must not build evidence: ${result.fixture_id}`);
    assert(evidence.evidence_status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(evidence.environment) && evidence.required_fields_present) {
    assert(evidence.can_build_evidence === true, `TEST/TRAINING may build evidence: ${result.fixture_id}`);
    assert(evidence.evidence_status === 'EVIDENCE_READY', `TEST/TRAINING status must be EVIDENCE_READY: ${result.fixture_id}`);
  }

  for (const check of result.checks) {
    assert(check.passed === true, `check failed for ${result.fixture_id}: ${check.name}`);
  }
}

const liveDirect = buildInventoryBridgeHandshakeEvidence({ environment: 'LIVE' });
assert(liveDirect.can_build_evidence === false, 'direct LIVE evidence must block build');
assert(liveDirect.can_write === false, 'direct LIVE evidence must not write');
assert(liveDirect.can_mutate === false, 'direct LIVE evidence must not mutate');

const trainingDirect = buildInventoryBridgeHandshakeEvidence({
  evidence_id: 'direct-training',
  environment: 'TRAINING',
  source_system: 'SCANOPS',
  source_device_id: 'device',
  source_store_id: 'store',
  target_system: 'INVENTORY',
  training_gate: 'REQUIRED',
  evidence_profile: 'STRICT_STATIC_EVIDENCE',
  candidate_id: 'candidate',
  candidate_key: 'key',
});
assert(trainingDirect.can_build_evidence === true, 'direct TRAINING evidence may build evidence');
assert(trainingDirect.can_complete_handshake === false, 'direct TRAINING evidence must not complete handshake');
assert(trainingDirect.can_persist === false, 'direct TRAINING evidence must not persist');
assert(trainingDirect.can_write === false, 'direct TRAINING evidence must not write');
assert(trainingDirect.can_mutate === false, 'direct TRAINING evidence must not mutate');

const missingDirect = buildInventoryBridgeHandshakeEvidence({ environment: 'TRAINING' });
assert(missingDirect.can_build_evidence === false, 'missing required fields must block evidence');
assert(missingDirect.required_fields_present === false, 'missing required fields must be detected');

const status = getInventoryBridgeHandshakeEvidenceStatus();
assert(status.passed === true, 'evidence status must pass');
assert(status.fixture_count === requiredFixtureIds.length, 'status fixture count must match required count');
assert(Object.isFrozen(status), 'status result must be frozen');

for (const check of status.checks) {
  assert(check.passed === true, `status check failed: ${check.name}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 9A/9C evidence check remains LIVE-blocked, TEST/TRAINING evidence-only, read-only, not completed, not persisted, non-receipting, non-acknowledging, non-writable, and non-mutating.');
