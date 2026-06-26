import { P20_INV, P20_INV_FIXTURES } from './p20Fixtures.js';
import { getP20InventoryPlanResults } from './p20Plan.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP20InventoryStatus(fixtures = P20_INV_FIXTURES) {
  const results = getP20InventoryPlanResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', P20_INV === '20A/20C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p20_inventory_status',
    phase: P20_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
