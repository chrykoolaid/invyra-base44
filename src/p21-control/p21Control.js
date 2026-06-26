import { P21_INV, P21_INV_FIELDS, P21_INV_FIXTURES, P21_INV_ROLES, P21_INV_STATUS } from './p21Fixtures.js';

const OK_ENVS = Object.freeze(['TRAINING', 'TEST']);
const NO_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function normalizeRole(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function fieldsPresent(descriptor) {
  return P21_INV_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildP21InventoryControl(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const role = normalizeRole(descriptor.approver_role);
  const hasFields = fieldsPresent(descriptor);
  const roleAllowed = P21_INV_ROLES.includes(role);
  const controlCandidate = OK_ENVS.includes(environment) && hasFields && roleAllowed;

  return Object.freeze({
    phase: P21_INV,
    control_id: descriptor.control_id || 'inventory-p21-unidentified',
    environment,
    status: controlCandidate ? P21_INV_STATUS.CANDIDATE : P21_INV_STATUS.BLOCKED,
    control_candidate: controlCandidate,
    fields_present: hasFields,
    role_allowed: roleAllowed,
    live_blocked: NO_ENVS.includes(environment),
    control_candidate_only: true,
    inventory_system_of_record: true,
    approval_granted: false,
    run_allowed: false,
    run_attempted: false,
    completed: false,
    persisted: false,
    receipt_emitted: false,
    acknowledgement_emitted: false,
    write_attempted: false,
    mutation_attempted: false,
    descriptor,
  });
}

export function projectP21InventoryControlResult(fixture) {
  const control = buildP21InventoryControl({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', control.environment === fixture.expected.environment),
    check('status', control.status === fixture.expected.status),
    check('control_candidate', control.control_candidate === fixture.expected.control_candidate),
    check('fields_present', control.fields_present === fixture.expected.fields_present),
    check('role_allowed', control.role_allowed === fixture.expected.role_allowed),
    check('candidate_only', control.control_candidate_only === true),
    check('record_owner', control.inventory_system_of_record === true),
    check('not_approved', control.approval_granted === false),
    check('not_run', control.run_allowed === false && control.run_attempted === false),
    check('no_effects', control.completed === false && control.persisted === false && control.write_attempted === false && control.mutation_attempted === false),
    check('no_response_output', control.receipt_emitted === false && control.acknowledgement_emitted === false),
  ]);

  return Object.freeze({ fixture_id: fixture.fixture_id, control, passed: checks.every((item) => item.passed), checks });
}

export function getP21InventoryControlResults(fixtures = P21_INV_FIXTURES) {
  return Object.freeze(fixtures.map(projectP21InventoryControlResult));
}
