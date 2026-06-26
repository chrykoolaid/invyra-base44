import {
  INVENTORY_PHASE20,
  INVENTORY_PHASE20_COMPONENT,
  INVENTORY_PHASE20_FIXTURES,
  INVENTORY_PHASE20_REQUIRED_FIELDS,
  INVENTORY_PHASE20_STATUS,
} from './phase20Fixtures.js';

const CANDIDATE_ENVS = Object.freeze(['TRAINING', 'TEST']);
const BLOCKED_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function requiredFieldsPresent(descriptor) {
  return INVENTORY_PHASE20_REQUIRED_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildInventoryPhase20Plan(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const fieldsPresent = requiredFieldsPresent(descriptor);
  const planCandidate = CANDIDATE_ENVS.includes(environment) && fieldsPresent;

  return Object.freeze({
    component: INVENTORY_PHASE20_COMPONENT,
    phase: INVENTORY_PHASE20,
    plan_id: descriptor.plan_id || 'inventory-phase20-unidentified',
    environment,
    status: planCandidate ? INVENTORY_PHASE20_STATUS.CANDIDATE : INVENTORY_PHASE20_STATUS.BLOCKED,
    plan_candidate: planCandidate,
    fields_present: fieldsPresent,
    live_blocked: BLOCKED_ENVS.includes(environment),
    plan_candidate_only: true,
    inventory_system_of_record: true,
    live_enabled: false,
    activation_allowed: false,
    activation_attempted: false,
    approval_granted: false,
    sync_executed: false,
    dispatched: false,
    completed: false,
    persisted: false,
    receipt_emitted: false,
    acknowledgement_emitted: false,
    write_attempted: false,
    mutation_attempted: false,
    descriptor,
  });
}

export function projectInventoryPhase20PlanResult(fixture) {
  const plan = buildInventoryPhase20Plan({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', plan.environment === fixture.expected.environment),
    check('status', plan.status === fixture.expected.status),
    check('plan_candidate', plan.plan_candidate === fixture.expected.plan_candidate),
    check('fields_present', plan.fields_present === fixture.expected.fields_present),
    check('live_blocked', plan.live_blocked === fixture.expected.live_blocked),
    check('candidate_only', plan.plan_candidate_only === true),
    check('inventory_system_of_record', plan.inventory_system_of_record === true),
    check('no_live_or_approval', plan.live_enabled === false && plan.activation_allowed === false && plan.approval_granted === false),
    check('no_activation_or_execution', plan.activation_attempted === false && plan.sync_executed === false && plan.dispatched === false),
    check('no_effects', plan.completed === false && plan.persisted === false && plan.write_attempted === false && plan.mutation_attempted === false),
    check('no_receipts_or_acknowledgements', plan.receipt_emitted === false && plan.acknowledgement_emitted === false),
  ]);

  return Object.freeze({ fixture_id: fixture.fixture_id, plan, passed: checks.every((item) => item.passed), checks });
}

export function getInventoryPhase20PlanResults(fixtures = INVENTORY_PHASE20_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryPhase20PlanResult));
}
