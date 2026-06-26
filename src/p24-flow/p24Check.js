import { P24_INV, P24_INV_FIXTURES } from './p24Fixtures.js';
import { getP24InventoryFlowResults } from './p24Flow.js';

function ok(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP24InventoryCheck(fixtures = P24_INV_FIXTURES) {
  const results = getP24InventoryFlowResults(fixtures);
  const checks = Object.freeze([
    ok('phase_marker', P24_INV === '24A/24C'),
    ok('fixtures_present', fixtures.length > 0),
    ok('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p24_inventory_check',
    phase: P24_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
