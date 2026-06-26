import { INVENTORY_PHASE19, INVENTORY_PHASE19_FIXTURES } from './phase19Fixtures.js';
import { getInventoryPhase19GateResults } from './phase19Gate.js';

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function getInventoryPhase19Summary(fixtures = INVENTORY_PHASE19_FIXTURES) {
  const results = getInventoryPhase19GateResults(fixtures);
  const checks = Object.freeze([
    check('phase_marker', INVENTORY_PHASE19 === '19A/19C'),
    check('fixtures_present', fixtures.length > 0),
    check('all_results_passed', results.every((result) => result.passed)),
  ]);

  return Object.freeze({
    component: 'inventory_phase19_summary',
    phase: INVENTORY_PHASE19,
    passed: checks.every((item) => item.passed),
    fixture_count: fixtures.length,
    results,
    checks,
  });
}
