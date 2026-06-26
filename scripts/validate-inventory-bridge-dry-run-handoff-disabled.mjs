import {
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_COMPONENT,
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES,
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE,
  getInventoryBridgeDryRunHandoffDiagnostics,
  getInventoryBridgeDryRunHandoffResults,
} from '../src/inventory-bridge/dryRunHandoff/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
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

assert(INVENTORY_BRIDGE_DRY_RUN_HANDOFF_COMPONENT === 'inventory_bridge_disabled_dry_run_handoff', 'component marker must remain stable');
assert(INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE === '5D', 'phase marker must remain 5D');
assert(Object.isFrozen(INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES), 'fixtures collection must be frozen');
assert(INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES.length === requiredFixtureIds.length, 'fixture count must match required set');

const fixtureIds = INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES.map((fixture) => fixture.fixture_id);
for (const fixtureId of requiredFixtureIds) {
  assert(fixtureIds.includes(fixtureId), `missing required fixture ${fixtureId}`);
}

for (const fixture of INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES) {
  assert(Object.isFrozen(fixture), `fixture must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.candidate), `fixture candidate must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.configuration), `fixture configuration must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected), `fixture expected outcome must be frozen: ${fixture.fixture_id}`);
}

const results = getInventoryBridgeDryRunHandoffResults();
assert(Object.isFrozen(results), 'results collection must be frozen');
assert(results.length === requiredFixtureIds.length, 'result count must match fixture count');

for (const result of results) {
  const { dry_run: dryRun } = result;
  assert(result.passed === true, `dry-run result must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(dryRun), `dry-run must be frozen: ${result.fixture_id}`);
  assert(dryRun.runtime_enabled === false, `runtime_enabled must remain false: ${result.fixture_id}`);
  assert(dryRun.runtime_ready === false, `runtime_ready must remain false: ${result.fixture_id}`);
  assert(dryRun.runtime_operational === false, `runtime_operational must remain false: ${result.fixture_id}`);
  assert(dryRun.transport_attempted === false, `transport_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.ingestion_attempted === false, `ingestion_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.outbox_processing_attempted === false, `outbox_processing_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.replay_attempted === false, `replay_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.inventory_call_attempted === false, `inventory_call_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.ledger_write_attempted === false, `ledger_write_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.receipt_emitted === false, `receipt_emitted must remain false: ${result.fixture_id}`);
  assert(dryRun.acknowledgement_emitted === false, `acknowledgement_emitted must remain false: ${result.fixture_id}`);
  assert(dryRun.mutation_attempted === false, `mutation_attempted must remain false: ${result.fixture_id}`);
  assert(dryRun.ingestible === false, `ingestible must remain false: ${result.fixture_id}`);
  assert(dryRun.persistable === false, `persistable must remain false: ${result.fixture_id}`);
  assert(dryRun.writable === false, `writable must remain false: ${result.fixture_id}`);
  assert(dryRun.replayable === false, `replayable must remain false: ${result.fixture_id}`);
  assert(dryRun.mutating === false, `mutating must remain false: ${result.fixture_id}`);
  assert(dryRun.inventory_idempotency_key.endsWith(result.expected.evidence_identity_key), `idempotency key must retain evidence identity: ${result.fixture_id}`);

  for (const check of result.checks) {
    assert(check.passed === true, `check failed for ${result.fixture_id}: ${check.name}`);
  }
}

const diagnostics = getInventoryBridgeDryRunHandoffDiagnostics();
assert(diagnostics.passed === true, 'dry-run diagnostics must pass');
assert(diagnostics.fixture_count === requiredFixtureIds.length, 'diagnostics fixture count must match required count');
assert(Object.isFrozen(diagnostics), 'diagnostics result must be frozen');

for (const check of diagnostics.checks) {
  assert(check.passed === true, `diagnostic check failed: ${check.name}`);
}

const unsafeResult = results.find((result) => result.fixture_id === 'unsafe_enabled_configuration_attempt');
assert(Boolean(unsafeResult), 'unsafe enabled configuration fixture must exist');
assert(unsafeResult.dry_run.runtime_enabled === false, 'unsafe fixture must not enable runtime');
assert(unsafeResult.dry_run.transport_attempted === false, 'unsafe fixture must not attempt transport');
assert(unsafeResult.dry_run.ingestion_attempted === false, 'unsafe fixture must not attempt ingestion');
assert(unsafeResult.dry_run.ledger_write_attempted === false, 'unsafe fixture must not attempt ledger write');
assert(unsafeResult.dry_run.receipt_emitted === false, 'unsafe fixture must not emit receipt');
assert(unsafeResult.dry_run.acknowledgement_emitted === false, 'unsafe fixture must not emit acknowledgement');
assert(unsafeResult.dry_run.mutation_attempted === false, 'unsafe fixture must not attempt mutation');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 5D dry-run handoff remains disabled, read-only, non-operational, non-transporting, non-ingestive, non-outbox-processing, non-replayable, non-receipting, non-acknowledging, non-writable, and non-mutating.');
