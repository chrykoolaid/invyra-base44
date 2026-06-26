import { INVENTORY_PHASE14, INVENTORY_PHASE14_FIXTURES } from './phase14Fixtures.js';
import { getInventoryPhase14EventResults } from './phase14Event.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase14Summary(fixtures = INVENTORY_PHASE14_FIXTURES) {
  const results = getInventoryPhase14EventResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE14 === '14A/14C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase14_summary',
    phase: INVENTORY_PHASE14,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
