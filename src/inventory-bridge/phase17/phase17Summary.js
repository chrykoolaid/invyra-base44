import { INVENTORY_PHASE17, INVENTORY_PHASE17_FIXTURES } from './phase17Fixtures.js';
import { getInventoryPhase17RecoveryResults } from './phase17Recovery.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase17Summary(fixtures = INVENTORY_PHASE17_FIXTURES) {
  const results = getInventoryPhase17RecoveryResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE17 === '17A/17C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase17_summary',
    phase: INVENTORY_PHASE17,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
