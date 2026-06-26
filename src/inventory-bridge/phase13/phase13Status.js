import { INVENTORY_PHASE13, INVENTORY_PHASE13_FIXTURES } from './phase13Fixtures.js';
import { getInventoryPhase13HandshakeResults } from './phase13Handshake.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase13Status(fixtures = INVENTORY_PHASE13_FIXTURES) {
  const results = getInventoryPhase13HandshakeResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE13 === '13A/13C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase13_status',
    phase: INVENTORY_PHASE13,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
