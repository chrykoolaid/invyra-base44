import { INVENTORY_PHASE15, INVENTORY_PHASE15_FIXTURES } from './phase15Fixtures.js';
import { getInventoryPhase15ReviewResults } from './phase15Review.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase15Summary(fixtures = INVENTORY_PHASE15_FIXTURES) {
  const results = getInventoryPhase15ReviewResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE15 === '15A/15C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase15_summary',
    phase: INVENTORY_PHASE15,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
