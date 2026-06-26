import { INVENTORY_PHASE16, INVENTORY_PHASE16_FIXTURES } from './phase16Fixtures.js';
import { getInventoryPhase16ResponseResults } from './phase16Response.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase16Summary(fixtures = INVENTORY_PHASE16_FIXTURES) {
  const results = getInventoryPhase16ResponseResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE16 === '16A/16C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase16_summary',
    phase: INVENTORY_PHASE16,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
