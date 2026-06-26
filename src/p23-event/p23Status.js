import { P23_INV, P23_INV_FIXTURES } from './p23Fixtures.js';
import { getP23InventoryEventResults } from './p23Event.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP23InventoryStatus(fixtures = P23_INV_FIXTURES) {
  const results = getP23InventoryEventResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', P23_INV === '23A/23C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p23_inventory_status',
    phase: P23_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
