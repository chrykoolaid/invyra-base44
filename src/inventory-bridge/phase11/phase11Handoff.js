import {
  INVENTORY_PHASE11,
  INVENTORY_PHASE11_COMPONENT,
  INVENTORY_PHASE11_FIXTURES,
  INVENTORY_PHASE11_REQUIRED_FIELDS,
  INVENTORY_PHASE11_STATUS,
} from './phase11Fixtures.js';

const CANDIDATE_ENVS = Object.freeze(['TRAINING', 'TEST']);
const LIVE_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function requiredFieldsPresent(descriptor) {
  return INVENTORY_PHASE11_REQUIRED_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildInventoryPhase11Handoff(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const fieldsPresent = requiredFieldsPresent(descriptor);
  const handoffCandidate = CANDIDATE_ENVS.includes(environment) && fieldsPresent;

  return Object.freeze({
    component: INVENTORY_PHASE11_COMPONENT,
    phase: INVENTORY_PHASE11,
    handoff_id: descriptor.handoff_id || 'inventory-phase11-unidentified',
    review_id: descriptor.review_id || 'inventory-phase10-unidentified',
    environment,
    status: handoffCandidate ? INVENTORY_PHASE11_STATUS.CANDIDATE : INVENTORY_PHASE11_STATUS.BLOCKED,
    handoff_candidate: handoffCandidate,
    fields_present: fieldsPresent,
    live_blocked: LIVE_ENVS.includes(environment),
    review_only: true,
    handoff_candidate_only: true,
    inventory_system_of_record: true,
    approved: false,
    completed: false,
    persisted: false,
    receipt_emitted: false,
    acknowledgement_emitted: false,
    write_attempted: false,
    mutation_attempted: false,
    descriptor,
  });
}

export function projectInventoryPhase11HandoffResult(fixture) {
  const handoff = buildInventoryPhase11Handoff({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', handoff.environment === fixture.expected.environment),
    check('status', handoff.status === fixture.expected.status),
    check('handoff_candidate', handoff.handoff_candidate === fixture.expected.handoff_candidate),
    check('fields_present', handoff.fields_present === fixture.expected.fields_present),
    check('live_blocked', handoff.live_blocked === fixture.expected.live_blocked),
    check('review_only', handoff.review_only === true),
    check('handoff_candidate_only', handoff.handoff_candidate_only === true),
    check('inventory_system_of_record', handoff.inventory_system_of_record === true),
    check('no_effects', handoff.approved === false && handoff.completed === false && handoff.persisted === false && handoff.write_attempted === false && handoff.mutation_attempted === false),
    check('no_receipts_or_acknowledgements', handoff.receipt_emitted === false && handoff.acknowledgement_emitted === false),
  ]);

  return Object.freeze({
    fixture_id: fixture.fixture_id,
    handoff,
    passed: checks.every((item) => item.passed),
    checks,
  });
}

export function getInventoryPhase11HandoffResults(fixtures = INVENTORY_PHASE11_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryPhase11HandoffResult));
}
