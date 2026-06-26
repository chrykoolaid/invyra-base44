import { P23_INV, P23_INV_FIELDS, P23_INV_FIXTURES, P23_INV_STATUS } from './p23Fixtures.js';

const OK_ENVS = Object.freeze(['TRAINING', 'TEST']);
const NO_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function fieldsPresent(descriptor) {
  return P23_INV_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildP23InventoryEvent(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const hasFields = fieldsPresent(descriptor);
  const readOnly = descriptor.visibility_mode === 'READ_ONLY';
  const eventCandidate = OK_ENVS.includes(environment) && hasFields && readOnly;

  return Object.freeze({
    phase: P23_INV,
    event_test_id: descriptor.event_test_id || 'inventory-p23-unidentified',
    environment,
    status: eventCandidate ? P23_INV_STATUS.CANDIDATE : P23_INV_STATUS.BLOCKED,
    event_candidate: eventCandidate,
    fields_present: hasFields,
    read_only: readOnly,
    live_blocked: NO_ENVS.includes(environment),
    event_candidate_only: true,
    inventory_system_of_record: true,
    transmission_candidate: eventCandidate,
    ack_candidate: eventCandidate,
    retry_candidate: eventCandidate,
    duplicate_check_candidate: eventCandidate,
    audit_check_candidate: eventCandidate,
    stock_mutation_allowed: false,
    workflow_write_allowed: false,
    event_sent: false,
    ack_emitted: false,
    retry_executed: false,
    replay_executed: false,
    duplicate_written: false,
    audit_written: false,
    completed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
    descriptor,
  });
}

export function projectP23InventoryEventResult(fixture) {
  const event = buildP23InventoryEvent({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', event.environment === fixture.expected.environment),
    check('status', event.status === fixture.expected.status),
    check('event_candidate', event.event_candidate === fixture.expected.event_candidate),
    check('fields_present', event.fields_present === fixture.expected.fields_present),
    check('candidate_only', event.event_candidate_only === true),
    check('read_only', event.read_only === true || event.event_candidate === false),
    check('record_owner', event.inventory_system_of_record === true),
    check('candidate_flags', event.transmission_candidate === event.event_candidate && event.ack_candidate === event.event_candidate && event.retry_candidate === event.event_candidate && event.duplicate_check_candidate === event.event_candidate && event.audit_check_candidate === event.event_candidate),
    check('no_operational_writes', event.stock_mutation_allowed === false && event.workflow_write_allowed === false),
    check('no_execution', event.event_sent === false && event.ack_emitted === false && event.retry_executed === false && event.replay_executed === false),
    check('no_effects', event.duplicate_written === false && event.audit_written === false && event.completed === false && event.persisted === false && event.write_attempted === false && event.mutation_attempted === false),
  ]);

  return Object.freeze({ fixture_id: fixture.fixture_id, event, passed: checks.every((item) => item.passed), checks });
}

export function getP23InventoryEventResults(fixtures = P23_INV_FIXTURES) {
  return Object.freeze(fixtures.map(projectP23InventoryEventResult));
}
