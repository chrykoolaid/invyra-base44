import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../src/inventory-bridge/config/bridgeConfigurationDefaults.js';
import {
  INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS,
  assessInventoryBridgeEventEnvelopeContract,
} from '../src/inventory-bridge/contracts/index.js';
import {
  INVENTORY_BRIDGE_LEDGER_CANDIDATE_COMPONENT,
  INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE,
  INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS,
  INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES,
  buildInventoryBridgeLedgerCandidatePreview,
  getInventoryBridgeLedgerCandidatePreviewDiagnostics,
} from '../src/inventory-bridge/ledgerCandidate/index.js';

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const validCandidate = Object.freeze({
  schema_version: 'inventory-bridge.v1',
  event_type: 'scanops.capture.recorded',
  event_id: 'evt_phase5b_candidate_001',
  occurred_at: '2026-06-25T00:00:00.000Z',
  source: Object.freeze({
    system: 'scanops',
    device_id: 'device-001',
    store_id: 'store-001',
    session_id: 'session-001',
  }),
  payload: Object.freeze({
    evidence_only: true,
  }),
});

const defaultPreview = buildInventoryBridgeLedgerCandidatePreview(validCandidate);
const repeatedPreview = buildInventoryBridgeLedgerCandidatePreview(validCandidate);

assert(Object.isFrozen(defaultPreview), 'ledger candidate preview must be frozen');
assert(defaultPreview.component === INVENTORY_BRIDGE_LEDGER_CANDIDATE_COMPONENT, 'preview component marker must match');
assert(defaultPreview.phase === INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE, 'preview phase marker must match');
assert(defaultPreview.candidate_status === INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES.RUNTIME_DISABLED, 'valid candidate must still be runtime-disabled');
assert(defaultPreview.candidate_reason === INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS.RUNTIME_DISABLED, 'valid candidate reason must remain runtime disabled');
assert(defaultPreview.contract_classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_RUNTIME_DISABLED, 'contract classification must remain runtime disabled');
assert(defaultPreview.candidate_preview_id === repeatedPreview.candidate_preview_id, 'preview id must be deterministic');
assert(defaultPreview.idempotency_key === repeatedPreview.idempotency_key, 'idempotency key must be deterministic');
assert(JSON.stringify(defaultPreview) === JSON.stringify(repeatedPreview), 'preview output must be deterministic');

assert(defaultPreview.runtime_enabled === false, 'runtime_enabled must remain false');
assert(defaultPreview.runtime_ready === false, 'runtime_ready must remain false');
assert(defaultPreview.runtime_operational === false, 'runtime_operational must remain false');
assert(defaultPreview.contract_accepted === false, 'contract_accepted must remain false');
assert(defaultPreview.contract_ingestible === false, 'contract_ingestible must remain false');
assert(defaultPreview.contract_writable === false, 'contract_writable must remain false');
assert(defaultPreview.ledger_writable === false, 'ledger_writable must remain false');
assert(defaultPreview.ingestible === false, 'ingestible must remain false');
assert(defaultPreview.persistable === false, 'persistable must remain false');
assert(defaultPreview.writable === false, 'writable must remain false');
assert(defaultPreview.replayable === false, 'replayable must remain false');
assert(defaultPreview.acknowledgement_emittable === false, 'acknowledgement_emittable must remain false');
assert(defaultPreview.receipt_emittable === false, 'receipt_emittable must remain false');
assert(defaultPreview.mutating === false, 'mutating must remain false');

const unsafeConfiguration = Object.freeze({
  ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
  bridge_enabled: true,
  transport_enabled: true,
  ingestion_enabled: true,
  replay_enabled: true,
  target_inventory_instance_id: 'inventory-instance-001',
  accepted_schema_versions: Object.freeze(['inventory-bridge.v1']),
  accepted_event_types: Object.freeze(['scanops.capture.recorded']),
  allowed_store_ids: Object.freeze(['store-001']),
  trusted_device_ids: Object.freeze(['device-001']),
});

const unsafePreview = buildInventoryBridgeLedgerCandidatePreview(validCandidate, {
  configuration: unsafeConfiguration,
});

assert(unsafePreview.runtime_enabled === false, 'unsafe configuration must not enable runtime');
assert(unsafePreview.ledger_writable === false, 'unsafe configuration must not make preview ledger-writable');
assert(unsafePreview.ingestible === false, 'unsafe configuration must not make preview ingestible');
assert(unsafePreview.persistable === false, 'unsafe configuration must not make preview persistable');
assert(unsafePreview.writable === false, 'unsafe configuration must not make preview writable');
assert(unsafePreview.acknowledgement_emittable === false, 'unsafe configuration must not emit acknowledgements');
assert(unsafePreview.receipt_emittable === false, 'unsafe configuration must not emit receipts');
assert(unsafePreview.mutating === false, 'unsafe configuration must not mutate');

const rejectedSchemaPreview = buildInventoryBridgeLedgerCandidatePreview(validCandidate, {
  configuration: Object.freeze({
    ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
    accepted_schema_versions: Object.freeze(['other-schema']),
  }),
});

assert(rejectedSchemaPreview.candidate_status === INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES.CONTRACT_REJECTED, 'schema mismatch must produce contract-rejected preview');
assert(rejectedSchemaPreview.candidate_reason === INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS.CONTRACT_REJECTED, 'schema mismatch reason must be contract rejected');
assert(rejectedSchemaPreview.ledger_writable === false, 'schema mismatch preview must not be ledger-writable');

const malformedPreview = buildInventoryBridgeLedgerCandidatePreview({
  schema_version: '',
  event_type: '',
  payload: null,
});

assert(malformedPreview.candidate_status === INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES.CONTRACT_REJECTED, 'malformed candidate must produce contract-rejected preview');
assert(malformedPreview.ledger_writable === false, 'malformed preview must not be ledger-writable');
assert(malformedPreview.ingestible === false, 'malformed preview must not be ingestible');
assert(malformedPreview.persistable === false, 'malformed preview must not be persistable');
assert(malformedPreview.writable === false, 'malformed preview must not be writable');

const contractAssessment = assessInventoryBridgeEventEnvelopeContract(validCandidate, {
  configuration: unsafeConfiguration,
});
const previewFromAssessment = buildInventoryBridgeLedgerCandidatePreview(validCandidate, {
  contractAssessment,
});

assert(previewFromAssessment.contract_classification === contractAssessment.classification, 'preview must preserve supplied contract assessment classification');
assert(previewFromAssessment.ledger_writable === false, 'preview from supplied assessment must not be ledger-writable');

const diagnostics = getInventoryBridgeLedgerCandidatePreviewDiagnostics(validCandidate, {
  configuration: unsafeConfiguration,
});

assert(diagnostics.passed === true, 'diagnostics must pass disabled preview checks');
assert(Array.isArray(diagnostics.checks), 'diagnostics must expose checks');
assert(diagnostics.preview.ledger_writable === false, 'diagnostics preview must remain non-ledger-writable');

assert(validCandidate.payload.evidence_only === true, 'preview must not mutate caller-provided payload');
assert(unsafeConfiguration.bridge_enabled === true, 'preview must not mutate caller-provided configuration');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 5B ledger candidate preview remains disabled, read-only, non-ingestive, non-persistable, non-writable, and non-mutating.');
