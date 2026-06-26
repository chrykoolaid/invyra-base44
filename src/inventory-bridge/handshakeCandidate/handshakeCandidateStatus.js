import {
  INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES,
  INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE,
} from './handshakeCandidateFixtures.js';
import { getInventoryBridgeHandshakeCandidateResults } from './handshakeCandidateProjection.js';

function statusCheck(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryBridgeHandshakeCandidateStatus(fixtures = INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_FIXTURES) {
  const results = getInventoryBridgeHandshakeCandidateResults(fixtures);
  const readyResults = results.filter((result) => ['TRAINING', 'TEST'].includes(result.candidate.environment));
  const blockedResults = results.filter((result) => ['LIVE', 'PRODUCTION', 'UNKNOWN'].includes(result.candidate.environment));
  const checks = Object.freeze([
    statusCheck('phase_marker', INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE === '8A/8C'),
    statusCheck('fixtures_present', fixtures.length > 0),
    statusCheck('all_results_passed', results.every((result) => result.passed)),
    statusCheck('ready_results_are_evidence_only', readyResults.every((result) => result.candidate.can_generate_candidate === true && result.candidate.evidence_only === true)),
    statusCheck('blocked_results_are_blocked', blockedResults.every((result) => result.candidate.can_generate_candidate === false)),
    statusCheck('no_effects', results.every((result) => result.candidate.can_write === false && result.candidate.can_mutate === false)),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_phase_8_candidate_status',
    phase: INVENTORY_BRIDGE_HANDSHAKE_CANDIDATE_PHASE,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    ready_count: readyResults.length,
    blocked_count: blockedResults.length,
    results,
    checks,
  });
}
