import {
  INVENTORY_PHASE12,
  INVENTORY_PHASE12_COMPONENT,
  INVENTORY_PHASE12_FIXTURES,
  INVENTORY_PHASE12_REQUIRED_FIELDS,
  INVENTORY_PHASE12_STATUS,
} from './phase12Fixtures.js';

const CANDIDATE_ENVS = Object.freeze(['TRAINING', 'TEST']);
const LIVE_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function requiredFieldsPresent(descriptor) {
  return INVENTORY_PHASE12_REQUIRED_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildInventoryPhase12Runner(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const fieldsPresent = requiredFieldsPresent(descriptor);
  const runnerCandidate = CANDIDATE_ENVS.includes(environment) && fieldsPresent;

  return Object.freeze({
    component: INVENTORY_PHASE12_COMPONENT,
    phase: INVENTORY_PHASE12,
    runner_id: descriptor.runner_id || 'inventory-phase12-unidentified',
    handoff_id: descriptor.handoff_id || 'inventory-phase11-unidentified',
    environment,
    status: runnerCandidate ? INVENTORY_PHASE12_STATUS.CANDIDATE : INVENTORY_PHASE12_STATUS.BLOCKED,
    runner_candidate: runnerCandidate,
    fields_present: fieldsPresent,
    live_blocked: LIVE_ENVS.includes(environment),
    runner_candidate_only: true,
    inventory_system_of_record: true,
    executed: false,
    completed: false,
    persisted: false,
    receipt_emitted: false,
    acknowledgement_emitted: false,
    write_attempted: false,
    mutation_attempted: false,
    descriptor,
  });
}

export function projectInventoryPhase12RunnerResult(fixture) {
  const runner = buildInventoryPhase12Runner({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', runner.environment === fixture.expected.environment),
    check('status', runner.status === fixture.expected.status),
    check('runner_candidate', runner.runner_candidate === fixture.expected.runner_candidate),
    check('fields_present', runner.fields_present === fixture.expected.fields_present),
    check('live_blocked', runner.live_blocked === fixture.expected.live_blocked),
    check('runner_candidate_only', runner.runner_candidate_only === true),
    check('inventory_system_of_record', runner.inventory_system_of_record === true),
    check('no_execution', runner.executed === false),
    check('no_effects', runner.completed === false && runner.persisted === false && runner.write_attempted === false && runner.mutation_attempted === false),
    check('no_receipts_or_acknowledgements', runner.receipt_emitted === false && runner.acknowledgement_emitted === false),
  ]);

  return Object.freeze({
    fixture_id: fixture.fixture_id,
    runner,
    passed: checks.every((item) => item.passed),
    checks,
  });
}

export function getInventoryPhase12RunnerResults(fixtures = INVENTORY_PHASE12_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryPhase12RunnerResult));
}
