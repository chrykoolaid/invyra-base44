import {
  INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_COMPONENT,
  INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES,
  INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_PHASE,
} from './candidateAlignmentFixtures.js';
import { getInventoryBridgeCandidateAlignmentResults } from './candidateAlignmentExpectations.js';

function diagnosticCheck(name, passed, detail) {
  return Object.freeze({ name, passed: passed === true, detail });
}

export function getInventoryBridgeCandidateAlignmentDiagnostics(fixtures = INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_FIXTURES) {
  const results = getInventoryBridgeCandidateAlignmentResults(fixtures);
  const allResultsPassed = results.every((result) => result.passed);
  const allPreviewsDisabled = results.every((result) => result.preview.runtime_enabled === false && result.preview.runtime_ready === false && result.preview.runtime_operational === false);
  const allPreviewsNonWritable = results.every((result) => result.preview.writable === false && result.preview.ledger_writable === false && result.preview.contract_writable === false);
  const allPreviewsNonIngestive = results.every((result) => result.preview.ingestible === false && result.preview.contract_ingestible === false);
  const noReceiptsOrAcknowledgements = results.every((result) => result.preview.receipt_emittable === false && result.preview.acknowledgement_emittable === false);
  const noReplayOrMutation = results.every((result) => result.preview.replayable === false && result.preview.mutating === false);

  const checks = Object.freeze([
    diagnosticCheck('component_marker', INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_COMPONENT === 'inventory_bridge_cross_repo_candidate_fixture_alignment', 'Inventory candidate alignment component marker is stable.'),
    diagnosticCheck('phase_marker', INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_PHASE === '5C', 'Inventory candidate alignment phase marker is 5C.'),
    diagnosticCheck('fixtures_present', fixtures.length > 0, 'Inventory candidate alignment fixtures are present.'),
    diagnosticCheck('all_results_passed', allResultsPassed, 'All fixture alignment results pass expected disabled outcomes.'),
    diagnosticCheck('all_previews_disabled', allPreviewsDisabled, 'All previews remain runtime-disabled, not ready, and non-operational.'),
    diagnosticCheck('all_previews_non_writable', allPreviewsNonWritable, 'All previews remain non-writable.'),
    diagnosticCheck('all_previews_non_ingestive', allPreviewsNonIngestive, 'All previews remain non-ingestive.'),
    diagnosticCheck('no_receipts_or_acknowledgements', noReceiptsOrAcknowledgements, 'No fixture emits receipts or acknowledgements.'),
    diagnosticCheck('no_replay_or_mutation', noReplayOrMutation, 'No fixture becomes replayable or mutating.'),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_candidate_alignment_diagnostics',
    phase: INVENTORY_BRIDGE_CANDIDATE_ALIGNMENT_PHASE,
    passed: checks.every((check) => check.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
