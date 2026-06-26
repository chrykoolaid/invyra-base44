import { P21_INV, P21_INV_FIXTURES } from './p21Fixtures.js';
import { getP21InventoryControlResults } from './p21Control.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP21InventoryStatus(fixtures = P21_INV_FIXTURES) {
  const results = getP21InventoryControlResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', P21_INV === '21A/21C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p21_inventory_status',
    phase: P21_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
