import { buildInventoryPreactivationBoundary } from '../src/inventory-bridge/preactivationBoundary/index.js';

const training = buildInventoryPreactivationBoundary('TRAINING');
const test = buildInventoryPreactivationBoundary('TEST');
const live = buildInventoryPreactivationBoundary('LIVE');
const production = buildInventoryPreactivationBoundary('PRODUCTION');
const unknown = buildInventoryPreactivationBoundary('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  training.preactivation_boundary_ready === true,
  test.preactivation_boundary_ready === true,
  live.preactivation_boundary_ready === false,
  production.preactivation_boundary_ready === false,
  unknown.preactivation_boundary_ready === false,
  training.inventory_system_of_record === true,
  training.review_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.listener_active === false,
  training.ingestion_engine_active === false,
  training.transport_active === false,
  training.desktop_call_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P29-B validation failed');
}

console.log('P29-B Inventory preactivation boundary passed.');
