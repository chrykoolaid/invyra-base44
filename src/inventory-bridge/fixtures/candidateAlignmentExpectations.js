import { buildInventoryBridgeLedgerCandidatePreview } from '../ledgerCandidate/index.js';
import { INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES } from './candidateAlignmentFixtures.js';

function check(name, passed, detail) {
  return Object.freeze({ name, passed: passed === true, detail });
}

function getPreviewEvidenceIdentityKey(preview) {
  return [
    preview.schema_version || 'none',
    preview.event_type || 'none',
    preview.event_id || 'none',
    preview.source_system || 'none',
    preview.source_device_id || 'none',
    preview.source_store_id || 'none',
  ].join(':').toLowerCase();
}

export function projectInventoryBridgeCandidateAlignmentResult(fixture) {
  const preview = buildInventoryBridgeLedgerCandidatePreview(fixture.candidate, {
    configuration: fixture.configuration,
  });

  const checks = Object.freeze([
    check('contract_classification', preview.contract_classification === fixture.expected.contract_classification, `Expected contract classification ${fixture.expected.contract_classification}.`),
    check('candidate_status', preview.candidate_status === fixture.expected.candidate_status, `Expected candidate status ${fixture.expected.candidate_status}.`),
    check('candidate_reason', preview.candidate_reason === fixture.expected.candidate_reason, `Expected candidate reason ${fixture.expected.candidate_reason}.`),
    check('evidence_identity_key', getPreviewEvidenceIdentityKey(preview) === fixture.expected.evidence_identity_key, 'Expected shared evidence identity key to remain stable.'),
    check('idempotency_key_shape', preview.idempotency_key.endsWith(fixture.expected.evidence_identity_key), 'Expected Inventory idempotency key to end with shared evidence identity key.'),
    check('runtime_disabled', preview.runtime_enabled === false, 'Runtime must remain disabled.'),
    check('runtime_not_ready', preview.runtime_ready === false, 'Runtime must remain not ready.'),
    check('runtime_non_operational', preview.runtime_operational === false, 'Runtime must remain non-operational.'),
    check('contract_not_accepted', preview.contract_accepted === false, 'Contract must remain non-accepted for runtime use.'),
    check('contract_non_ingestible', preview.contract_ingestible === false, 'Contract must remain non-ingestible.'),
    check('contract_non_writable', preview.contract_writable === false, 'Contract must remain non-writable.'),
    check('ledger_non_writable', preview.ledger_writable === false, 'Ledger candidate preview must remain non-writable.'),
    check('preview_non_ingestible', preview.ingestible === false, 'Preview must remain non-ingestive.'),
    check('preview_non_persistable', preview.persistable === false, 'Preview must remain non-persistable.'),
    check('preview_non_writable', preview.writable === false, 'Preview must remain non-writable.'),
    check('preview_non_replayable', preview.replayable === false, 'Preview must remain non-replayable.'),
    check('no_acknowledgement', preview.acknowledgement_emittable === false, 'Preview must not emit acknowledgement.'),
    check('no_receipt', preview.receipt_emittable === false, 'Preview must not emit receipt.'),
    check('no_mutation', preview.mutating === false, 'Preview must not mutate.'),
  ]);

  return Object.freeze({
    fixture_id: fixture.fixture_id,
    description: fixture.description,
    expected: fixture.expected,
    preview,
    passed: checks.every((item) => item.passed),
    checks,
  });
}

export function getInventoryBridgeCandidateAlignmentResults(fixtures = INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryBridgeCandidateAlignmentResult));
}
