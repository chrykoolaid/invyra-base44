import { INVENTORY_PHASE20, INVENTORY_PHASE20_FIXTURES } from './phase20Fixtures.js';
import { getInventoryPhase20PlanResults } from './phase20Plan.js';

function ok(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase20Status(fixtures = INVENTORY_PHASE20_FIXTURES) {
  const results = getInventoryPhase20PlanResults(fixtures);
  const checks = Object.freeze([
    ok('phase_marker', INVENTORY_PHASE20 === '20A/20C'),
    ok('fixtures_present', fixtures.length > 0),
    ok('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase20_status',
    phase: INVENTORY_PHASE20,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
