import { P25_INV, P25_INV_FIXTURES } from './p25Fixtures.js';
import { getP25InventoryFlowResults } from './p25Flow.js';

function ok(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP25InventoryCheck(fixtures = P25_INV_FIXTURES) {
  const results = getP25InventoryFlowResults(fixtures);
  const checks = Object.freeze([
    ok('phase_marker', P25_INV === '25A/25C'),
    ok('fixtures_present', fixtures.length > 0),
    ok('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p25_inventory_check',
    phase: P25_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
