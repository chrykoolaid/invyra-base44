import {
  INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_COMPONENT,
  INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES,
  INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_PHASE,
  getInventoryBridgeCandidateAlignmentDiagnostics,
  getInventoryBridgeCandidateAlignmentResults,
} from '../src/inventory-bridge/fixtures/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const requiredFixtureIds = Object.freeze([
  'valid_evidence_runtime_disabled',
  'schema_mismatch',
  'event_type_mismatch',
  'store_mismatch',
  'device_mismatch',
  'malformed_payload',
  'unsafe_enabled_configuration_attempt',
]);

assert(INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_COMPONENT === 'inventory_bridge_cross_repo_candidate_fixture_alignment', 'component marker must remain stable');
assert(INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_PHASE === '5C', 'phase marker must remain 5C');
assert(Object.isFrozen(INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES), 'fixtures collection must be frozen');
assert(INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES.length === requiredFixtureIds.length, 'fixture count must match required fixture set');

const fixtureIds = INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES.map((fixture) => fixture.fixture_id);
for (const fixtureId of requiredFixtureIds) {
  assert(fixtureIds.includes(fixtureId), `missing required fixture ${fixtureId}`);
}

for (const fixture of INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES) {
  assert(Object.isFrozen(fixture), `fixture ${fixture.fixture_id} must be frozen`);
  assert(Object.isFrozen(fixture.candidate), `fixture ${fixture.fixture_id} candidate must be frozen`);
  assert(Object.isFrozen(fixture.configuration), `fixture ${fixture.fixture_id} configuration must be frozen`);
  assert(Object.isFrozen(fixture.expected), `fixture ${fixture.fixture_id} expected outcome must be frozen`);
}

const results = getInventoryBridgeCandidateAlignmentResults();
assert(Object.isFrozen(results), 'alignment results collection must be frozen');
assert(results.length === requiredFixtureIds.length, 'alignment result count must match fixture count');

for (const result of results) {
  const { preview } = result;

  assert(result.passed === true, `fixture result must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `fixture result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(preview), `preview must be frozen: ${result.fixture_id}`);
  assert(preview.runtime_enabled === false, `runtime_enabled must remain false: ${result.fixture_id}`);
  assert(preview.runtime_ready === false, `runtime_ready must remain false: ${result.fixture_id}`);
  assert(preview.runtime_operational === false, `runtime_operational must remain false: ${result.fixture_id}`);
  assert(preview.contract_accepted === false, `contract_accepted must remain false: ${result.fixture_id}`);
  assert(preview.contract_ingestible === false, `contract_ingestible must remain false: ${result.fixture_id}`);
  assert(preview.contract_writable === false, `contract_writable must remain false: ${result.fixture_id}`);
  assert(preview.ledger_writable === false, `ledger_writable must remain false: ${result.fixture_id}`);
  assert(preview.ingestible === false, `ingestible must remain false: ${result.fixture_id}`);
  assert(preview.persistable === false, `persistable must remain false: ${result.fixture_id}`);
  assert(preview.writable === false, `writable must remain false: ${result.fixture_id}`);
  assert(preview.replayable === false, `replayable must remain false: ${result.fixture_id}`);
  assert(preview.acknowledgement_emittable === false, `acknowledgement_emittable must remain false: ${result.fixture_id}`);
  assert(preview.receipt_emittable === false, `receipt_emittable must remain false: ${result.fixture_id}`);
  assert(preview.mutating === false, `mutating must remain false: ${result.fixture_id}`);
  assert(preview.idempotency_key.endsWith(result.expected.evidence_identity_key), `idempotency key must retain shared evidence identity suffix: ${result.fixture_id}`);

  for (const check of result.checks) {
    assert(check.passed === true, `fixture check failed for ${result.fixture_id}: ${check.name}`);
  }
}

const diagnostics = getInventoryBridgeCandidateAlignmentDiagnostics();
assert(diagnostics.passed === true, 'candidate alignment diagnostics must pass');
assert(diagnostics.fixture_count === requiredFixtureIds.length, 'diagnostics fixture count must match required fixture count');
assert(Object.isFrozen(diagnostics), 'diagnostics result must be frozen');

for (const check of diagnostics.checks) {
  assert(check.passed === true, `diagnostic check failed: ${check.name}`);
}

const unsafeResult = results.find((result) => result.fixture_id === 'unsafe_enabled_configuration_attempt');
assert(Boolean(unsafeResult), 'unsafe enabled configuration fixture result must exist');
assert(unsafeResult.preview.runtime_enabled === false, 'unsafe enabled configuration must not enable runtime');
assert(unsafeResult.preview.ingestible === false, 'unsafe enabled configuration must not become ingestible');
assert(unsafeResult.preview.ledger_writable === false, 'unsafe enabled configuration must not become ledger-writable');
assert(unsafeResult.preview.writable === false, 'unsafe enabled configuration must not become writable');
assert(unsafeResult.preview.receipt_emittable === false, 'unsafe enabled configuration must not emit receipt');
assert(unsafeResult.preview.acknowledgement_emittable === false, 'unsafe enabled configuration must not emit acknowledgement');
assert(unsafeResult.preview.mutating === false, 'unsafe enabled configuration must not mutate');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 5C candidate fixture alignment remains static, disabled, read-only, non-ingestive, non-writable, non-replayable, non-receipting, non-acknowledging, and non-mutating.');
