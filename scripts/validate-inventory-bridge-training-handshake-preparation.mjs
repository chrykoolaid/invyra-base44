import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_COMPONENT,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES,
  INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE,
  buildInventoryBridgeTrainingHandshakeReadiness,
  getInventoryBridgeTrainingHandshakeDiagnostics,
  getInventoryBridgeTrainingHandshakeReadinessResults,
} from '../src/inventory-bridge/trainingHandshake/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const requiredFixtureIds = Object.freeze([
  'live_handshake_blocked',
  'training_handshake_preparation_allowed',
  'test_handshake_preparation_allowed',
  'production_alias_handshake_blocked',
  'unknown_environment_handshake_blocked',
]);

assert(INVENTORY_BRIDGE_TRAINING_HANDSHAKE_COMPONENT === 'inventory_bridge_test_training_handshake_preparation', 'component marker must remain stable');
assert(INVENTORY_BRIDGE_TRAINING_HANDSHAKE_PHASE === '7A/7C', 'phase marker must remain 7A/7C');
assert(Object.isFrozen(INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES), 'fixtures collection must be frozen');
assert(INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES.length === requiredFixtureIds.length, 'fixture count must match required set');

const fixtureIds = INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES.map((fixture) => fixture.fixture_id);
for (const fixtureId of requiredFixtureIds) {
  assert(fixtureIds.includes(fixtureId), `missing required fixture ${fixtureId}`);
}

for (const fixture of INVENTORY_BRIDGE_TRAINING_HANDSHAKE_FIXTURES) {
  assert(Object.isFrozen(fixture), `fixture must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.handshake_descriptor), `handshake descriptor must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected), `fixture expected outcome must be frozen: ${fixture.fixture_id}`);
  assert(Object.isFrozen(fixture.expected.blocked_reasons), `fixture blocked reasons must be frozen: ${fixture.fixture_id}`);
}

const results = getInventoryBridgeTrainingHandshakeReadinessResults();
assert(Object.isFrozen(results), 'readiness results collection must be frozen');
assert(results.length === requiredFixtureIds.length, 'readiness result count must match fixture count');

for (const result of results) {
  const { readiness } = result;
  assert(result.passed === true, `readiness result must pass: ${result.fixture_id}`);
  assert(Object.isFrozen(result), `result must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(readiness), `readiness must be frozen: ${result.fixture_id}`);
  assert(Object.isFrozen(readiness.blocked_reasons), `blocked reasons must be frozen: ${result.fixture_id}`);
  assert(readiness.non_production_only === true, `non_production_only must remain true: ${result.fixture_id}`);
  assert(readiness.can_connect === false, `can_connect must remain false: ${result.fixture_id}`);
  assert(readiness.can_sync === false, `can_sync must remain false: ${result.fixture_id}`);
  assert(readiness.can_ingest === false, `can_ingest must remain false: ${result.fixture_id}`);
  assert(readiness.can_process_outbox === false, `can_process_outbox must remain false: ${result.fixture_id}`);
  assert(readiness.can_replay === false, `can_replay must remain false: ${result.fixture_id}`);
  assert(readiness.can_emit_receipt === false, `can_emit_receipt must remain false: ${result.fixture_id}`);
  assert(readiness.can_emit_acknowledgement === false, `can_emit_acknowledgement must remain false: ${result.fixture_id}`);
  assert(readiness.can_write === false, `can_write must remain false: ${result.fixture_id}`);
  assert(readiness.can_mutate === false, `can_mutate must remain false: ${result.fixture_id}`);
  assert(readiness.connection_attempted === false, `connection_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.network_check_attempted === false, `network_check_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.sync_attempted === false, `sync_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.ingestion_attempted === false, `ingestion_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.outbox_processing_attempted === false, `outbox_processing_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.replay_attempted === false, `replay_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.receipt_emitted === false, `receipt_emitted must remain false: ${result.fixture_id}`);
  assert(readiness.acknowledgement_emitted === false, `acknowledgement_emitted must remain false: ${result.fixture_id}`);
  assert(readiness.write_attempted === false, `write_attempted must remain false: ${result.fixture_id}`);
  assert(readiness.mutation_attempted === false, `mutation_attempted must remain false: ${result.fixture_id}`);

  if (['LIVE', 'PRODUCTION'].includes(readiness.environment)) {
    assert(readiness.can_prepare_handshake === false, `LIVE/PRODUCTION must not prepare handshake: ${result.fixture_id}`);
    assert(readiness.handshake_preparation_status === 'BLOCKED', `LIVE/PRODUCTION status must be BLOCKED: ${result.fixture_id}`);
  }

  if (['TRAINING', 'TEST'].includes(readiness.environment)) {
    assert(readiness.can_prepare_handshake === true, `TEST/TRAINING may prepare only readiness: ${result.fixture_id}`);
    assert(readiness.handshake_preparation_status === 'PREPARATION_ALLOWED', `TEST/TRAINING status must be PREPARATION_ALLOWED: ${result.fixture_id}`);
  }

  for (const check of result.checks) {
    assert(check.passed === true, `check failed for ${result.fixture_id}: ${check.name}`);
  }
}

const liveDirect = buildInventoryBridgeTrainingHandshakeReadiness({ environment: 'LIVE' });
assert(liveDirect.can_prepare_handshake === false, 'direct LIVE readiness must block preparation');
assert(liveDirect.live_blocked === true, 'direct LIVE readiness must mark live_blocked');
assert(liveDirect.can_connect === false, 'direct LIVE readiness must not connect');
assert(liveDirect.can_write === false, 'direct LIVE readiness must not write');
assert(liveDirect.can_mutate === false, 'direct LIVE readiness must not mutate');

const trainingDirect = buildInventoryBridgeTrainingHandshakeReadiness({ environment: 'TRAINING' });
assert(trainingDirect.can_prepare_handshake === true, 'direct TRAINING readiness may allow preparation');
assert(trainingDirect.can_connect === false, 'direct TRAINING readiness must not connect');
assert(trainingDirect.can_ingest === false, 'direct TRAINING readiness must not ingest');
assert(trainingDirect.can_write === false, 'direct TRAINING readiness must not write');
assert(trainingDirect.can_mutate === false, 'direct TRAINING readiness must not mutate');

const diagnostics = getInventoryBridgeTrainingHandshakeDiagnostics();
assert(diagnostics.passed === true, 'training handshake diagnostics must pass');
assert(diagnostics.fixture_count === requiredFixtureIds.length, 'diagnostics fixture count must match required count');
assert(Object.isFrozen(diagnostics), 'diagnostics result must be frozen');

for (const check of diagnostics.checks) {
  assert(check.passed === true, `diagnostic check failed: ${check.name}`);
}

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..');
const scannedFiles = Object.freeze([
  'src/inventory-bridge/trainingHandshake/trainingHandshakeFixtures.js',
  'src/inventory-bridge/trainingHandshake/trainingHandshakeReadiness.js',
  'src/inventory-bridge/trainingHandshake/trainingHandshakeDiagnostics.js',
  'src/inventory-bridge/trainingHandshake/index.js',
]);

const forbiddenRuntimePatterns = Object.freeze([
  { pattern: /\bfetch\s*\(/, label: 'fetch call' },
  { pattern: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest usage' },
  { pattern: /\bWebSocket\b/, label: 'WebSocket usage' },
  { pattern: /\bEventSource\b/, label: 'EventSource usage' },
  { pattern: /\bBroadcastChannel\b/, label: 'BroadcastChannel usage' },
  { pattern: /\bcreateServer\s*\(/, label: 'server creation' },
  { pattern: /\.listen\s*\(/, label: 'port binding' },
  { pattern: /\bconnect\s*\(/, label: 'connection call' },
  { pattern: /\bsend\s*\(/, label: 'send call' },
  { pattern: /\bemit\s*\(/, label: 'event emission call' },
  { pattern: /\bnode:net\b|from ['"]net['"]/, label: 'net module import' },
  { pattern: /\bnode:dgram\b|from ['"]dgram['"]/, label: 'dgram module import' },
  { pattern: /\bwriteFile\s*\(/, label: 'file write' },
  { pattern: /\bappendFile\s*\(/, label: 'file append' },
  { pattern: /\bcreateWriteStream\s*\(/, label: 'write stream' },
  { pattern: /\blocalStorage\./, label: 'localStorage write surface' },
  { pattern: /\bsessionStorage\./, label: 'sessionStorage write surface' },
  { pattern: /\bindexedDB\b/, label: 'indexedDB access' },
  { pattern: /\bInboundEventLedger\b/, label: 'inbound ledger path' },
  { pattern: /\bInventorySyncInboundEvent\b/, label: 'inbound event path' },
  { pattern: /\bInventorySyncReceipt\b/, label: 'receipt path' },
]);

for (const relativePath of scannedFiles) {
  const filePath = path.join(repoRoot, relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  for (const forbidden of forbiddenRuntimePatterns) {
    assert(!forbidden.pattern.test(content), `${relativePath} must not contain ${forbidden.label}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 7A/7C handshake preparation remains LIVE-blocked, TEST/TRAINING preparation-only, read-only, non-operational, non-networking, non-syncing, non-ingestive, non-outbox-processing, non-replayable, non-receipting, non-acknowledging, non-writable, and non-mutating.');
