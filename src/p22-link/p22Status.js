import { P22_INV, P22_INV_FIXTURES } from './p22Fixtures.js';
import { getP22InventoryLinkResults } from './p22Link.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getP22InventoryStatus(fixtures = P22_INV_FIXTURES) {
  const results = getP22InventoryLinkResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', P22_INV === '22A/22C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'p22_inventory_status',
    phase: P22_INV,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
