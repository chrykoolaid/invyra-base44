import { INVENTORY_PHASE12, INVENTORY_PHASE12_FIXTURES } from './phase12Fixtures.js';
import { getInventoryPhase12RunnerResults } from './phase12Runner.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase12Status(fixtures = INVENTORY_PHASE12_FIXTURES) {
  const results = getInventoryPhase12RunnerResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE12 === '12A/12C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase12_status',
    phase: INVENTORY_PHASE12,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
