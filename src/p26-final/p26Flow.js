import { P26_INV, P26_INV_FIELDS, P26_INV_FIXTURES, P26_INV_STATUS, P26_INV_STEPS } from './p26Fixtures.js';

const OK_ENVS = Object.freeze(['TRAINING', 'TEST']);
const NO_ENVS = Object.freeze(['LIVE', 'PRODUCTION']);

function normalizeEnvironment(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
}

function fieldsPresent(descriptor) {
  return P26_INV_FIELDS.every((field) => {
    const value = descriptor[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

function parseSteps(value) {
  return typeof value === 'string' ? value.split('|').map((item) => item.trim()).filter(Boolean) : [];
}

function expectedOrder(steps) {
  return steps.length === P26_INV_STEPS.length && steps.every((step, index) => step === P26_INV_STEPS[index]);
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function buildP26InventoryFlow(input = {}) {
  const descriptor = Object.freeze({ ...(input.descriptor || input) });
  const environment = normalizeEnvironment(descriptor.environment);
  const hasFields = fieldsPresent(descriptor);
  const readOnly = descriptor.visibility_mode === 'READ_ONLY';
  const steps = Object.freeze(parseSteps(descriptor.step_order));
  const orderOk = expectedOrder(steps);
  const hybridFuture = descriptor.compatibility_mode === 'HYBRID_FUTURE_MODEL';
  const finalCandidate = OK_ENVS.includes(environment) && hasFields && readOnly && orderOk && hybridFuture;

  return Object.freeze({
    phase: P26_INV,
    flow_id: descriptor.flow_id || 'inventory-p26-unidentified',
    environment,
    status: finalCandidate ? P26_INV_STATUS.CANDIDATE : P26_INV_STATUS.BLOCKED,
    final_candidate: finalCandidate,
    fields_present: hasFields,
    read_only: readOnly,
    order_ok: orderOk,
    hybrid_future: hybridFuture,
    steps,
    live_blocked: NO_ENVS.includes(environment),
    final_candidate_only: true,
    inventory_system_of_record: true,
    reorder_review_candidate: finalCandidate,
    forecast_feed_candidate: finalCandidate,
    rfid_compatibility_candidate: finalCandidate,
    stock_mutation_allowed: false,
    workflow_write_allowed: false,
    purchase_order_write_allowed: false,
    forecast_write_allowed: false,
    rfid_write_allowed: false,
    reorder_generated: false,
    forecast_posted: false,
    rfid_activated: false,
    baseline_accepted: finalCandidate,
    completed: false,
    persisted: false,
    write_attempted: false,
    mutation_attempted: false,
    descriptor,
  });
}

export function projectP26InventoryFlowResult(fixture) {
  const flow = buildP26InventoryFlow({ descriptor: fixture.descriptor });
  const checks = Object.freeze([
    check('environment', flow.environment === fixture.expected.environment),
    check('status', flow.status === fixture.expected.status),
    check('final_candidate', flow.final_candidate === fixture.expected.final_candidate),
    check('fields_present', flow.fields_present === fixture.expected.fields_present),
    check('candidate_only', flow.final_candidate_only === true),
    check('read_only', flow.read_only === true || flow.final_candidate === false),
    check('order_ok', flow.order_ok === true || flow.final_candidate === false),
    check('hybrid_future', flow.hybrid_future === true || flow.final_candidate === false),
    check('record_owner', flow.inventory_system_of_record === true),
    check('candidate_flags', flow.reorder_review_candidate === flow.final_candidate && flow.forecast_feed_candidate === flow.final_candidate && flow.rfid_compatibility_candidate === flow.final_candidate),
    check('no_write_permissions', flow.stock_mutation_allowed === false && flow.workflow_write_allowed === false && flow.purchase_order_write_allowed === false && flow.forecast_write_allowed === false && flow.rfid_write_allowed === false),
    check('no_execution', flow.reorder_generated === false && flow.forecast_posted === false && flow.rfid_activated === false),
    check('no_effects', flow.completed === false && flow.persisted === false && flow.write_attempted === false && flow.mutation_attempted === false),
  ]);

  return Object.freeze({ fixture_id: fixture.fixture_id, flow, passed: checks.every((item) => item.passed), checks });
}

export function getP26InventoryFlowResults(fixtures = P26_INV_FIXTURES) {
  return Object.freeze(fixtures.map(projectP26InventoryFlowResult));
}
