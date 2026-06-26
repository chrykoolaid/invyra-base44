import { INVENTORY_PHASE11, INVENTORY_PHASE11_FIXTURES } from './phase11Fixtures.js';
import { getInventoryPhase11HandoffResults } from './phase11Handoff.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase11Status(fixtures = INVENTORY_PHASE11_FIXTURES) {
  const results = getInventoryPhase11HandoffResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE11 === '11A/11C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase11_status',
    phase: INVENTORY_PHASE11,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
