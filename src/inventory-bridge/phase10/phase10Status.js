import { INVENTORY_PHASE10, INVENTORY_PHASE10_FIXTURES } from './phase10Fixtures.js';
import { getInventoryPhase10ReviewResults } from './phase10Review.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase10Status(fixtures = INVENTORY_PHASE10_FIXTURES) {
  const results = getInventoryPhase10ReviewResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE10 === '10A/10C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase10_status',
    phase: INVENTORY_PHASE10,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
