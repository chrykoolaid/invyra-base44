import { INVENTORY_PHASE18, INVENTORY_PHASE18_FIXTURES } from './phase18Fixtures.js';
import { getInventoryPhase18AcceptanceResults } from './phase18Acceptance.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase18Summary(fixtures = INVENTORY_PHASE18_FIXTURES) {
  const results = getInventoryPhase18AcceptanceResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE18 === '18A/18C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase18_summary',
    phase: INVENTORY_PHASE18,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
