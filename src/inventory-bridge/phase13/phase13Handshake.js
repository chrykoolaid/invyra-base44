import {
  INVENTORY_PHASE13,
  INVENTORY_PHASE13_COMPONENT,
  INVENTORY_PHASE13_FIXTURES,
  INVENTORY_PHASE13_REQUIRED_FIELDS,
  INVENTORY_PHASE13_STATUS,
} from './phase13Fixtures.js';

const CANDIDATE_ENVS = Object.freeze(['TRAINING', 'TEST']);
const LIVE_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function requiredFieldsPresent(descriptor) {
  return INVENTORY_PHASE13_REQUIRED_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildInventoryPhase13Handshake(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const fieldsPresent = requiredFieldsPresent(descriptor);
  const handshakeCandidate = CANDIDATE_ENVS.includes(environment) && fieldsPresent;

  return Object.freeze({
    component: INVENTORY_PHASE13_COMPONENT,
    phase: INVENTORY_PHASE13,
    handshake_id: descriptor.handshake_id || 'inventory-phase13-unidentified',
    runner_id: descriptor.runner_id || 'inventory-phase12-unidentified',
    environment,
    status: handshakeCandidate ? INVENTORY_PHASE13_STATUS.CANDIDATE : INVENTORY_PHASE13_STATUS.BLOCKED,
    handshake_candidate: handshakeCandidate,
    fields_present: fieldsPresent,
    live_blocked: LIVE_ENVS.includes(environment),
    local_handshake_candidate_only: true,
    inventory_system_of_record: true,
    local_attempted: false,
    peer_called: false,
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

export function projectInventoryPhase13HandshakeResult(fixture) {
  const handshake = buildInventoryPhase13Handshake({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', handshake.environment === fixture.expected.environment),
    check('status', handshake.status === fixture.expected.status),
    check('handshake_candidate', handshake.handshake_candidate === fixture.expected.handshake_candidate),
    check('fields_present', handshake.fields_present === fixture.expected.fields_present),
    check('live_blocked', handshake.live_blocked === fixture.expected.live_blocked),
    check('candidate_only', handshake.local_handshake_candidate_only === true),
    check('inventory_system_of_record', handshake.inventory_system_of_record === true),
    check('no_local_attempt', handshake.local_attempted === false && handshake.peer_called === false),
    check('no_execution', handshake.executed === false),
    check('no_effects', handshake.completed === false && handshake.persisted === false && handshake.write_attempted === false && handshake.mutation_attempted === false),
    check('no_receipts_or_acknowledgements', handshake.receipt_emitted === false && handshake.acknowledgement_emitted === false),
  ]);

  return Object.freeze({
    fixture_id: fixture.fixture_id,
    handshake,
    passed: checks.every((item) => item.passed),
    checks,
  });
}

export function getInventoryPhase13HandshakeResults(fixtures = INVENTORY_PHASE13_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryPhase13HandshakeResult));
}
