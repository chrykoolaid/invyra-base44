import { P26_INV, P26_INV_FIXTURES } from './p26Fixtures.js';
import { getP26InventoryFlowResults } from './p26Flow.js';

function ok(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP26InventoryCheck(fixtures = P26_INV_FIXTURES) {
  const results = getP26InventoryFlowResults(fixtures);
  const checks = Object.freeze([
    ok('phase_marker', P26_INV === '26A/26C'),
    ok('fixtures_present', fixtures.length > 0),
    ok('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p26_inventory_check',
    phase: P26_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
