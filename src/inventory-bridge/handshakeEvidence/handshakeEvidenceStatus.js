import {
  INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES,
  INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE,
} from './handshakeEvidenceFixtures.js';
import { getInventoryBridgeHandshakeEvidenceResults } from './handshakeEvidenceProjection.js';

function statusCheck(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryBridgeHandshakeEvidenceStatus(fixtures = INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_FIXTURES) {
  const results = getInventoryBridgeHandshakeEvidenceResults(fixtures);
  const readyResults = results.filter((result) => ['TRAINING', 'TEST'].includes(result.evidence.environment) && result.evidence.required_fields_present);
  const blockedResults = results.filter((result) => result.evidence.evidence_status === 'BLOCKED');
  const checks = Object.freeze([
    statusCheck('phase_marker', INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE === '9A/9C'),
    statusCheck('fixtures_present', fixtures.length > 0),
    statusCheck('all_results_passed', results.every((result) => result.passed)),
    statusCheck('ready_results_are_evidence_only', readyResults.every((result) => result.evidence.can_build_evidence === true && result.evidence.evidence_only === true)),
    statusCheck('blocked_results_are_blocked', blockedResults.every((result) => result.evidence.can_build_evidence === false)),
    statusCheck('no_effects', results.every((result) => result.evidence.can_write === false && result.evidence.can_mutate === false)),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_phase_9_evidence_status',
    phase: INVENTORY_BRIDGE_HANDSHAKE_EVIDENCE_PHASE,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    ready_count: readyResults.length,
    blocked_count: blockedResults.length,
    results,
    checks,
  });
}
