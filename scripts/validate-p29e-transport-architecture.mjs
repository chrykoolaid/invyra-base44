import { buildInventoryTransportArchitectureFoundation } from '../src/inventory-bridge/transportArchitectureFoundation/index.js';

const training = buildInventoryTransportArchitectureFoundation('TRAINING');
const test = buildInventoryTransportArchitectureFoundation('TEST');
const live = buildInventoryTransportArchitectureFoundation('LIVE');
const production = buildInventoryTransportArchitectureFoundation('PRODUCTION');
const unknown = buildInventoryTransportArchitectureFoundation('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.architecture_sections),
  Object.isFrozen(training.phase_dependencies),
  Object.isFrozen(training.disallowed_runtime),
  training.foundation_ready === true,
  test.foundation_ready === true,
  live.foundation_ready === false,
  production.foundation_ready === false,
  unknown.foundation_ready === false,
  training.accelerated_milestone === true,
  training.inventory_system_of_record === true,
  training.review_only === true,
  training.design_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.phase_dependencies.scanops_29d_required === true,
  training.disallowed_runtime.listener_active === false,
  training.disallowed_runtime.ingestion_engine_active === false,
  training.disallowed_runtime.transport_active === false,
  training.disallowed_runtime.network_call_attempted === false,
  training.disallowed_runtime.event_received === false,
  training.disallowed_runtime.inbound_persisted === false,
  training.disallowed_runtime.receipt_emitted === false,
  training.disallowed_runtime.inventory_write_allowed === false,
  training.disallowed_runtime.scanops_write_allowed === false,
  training.disallowed_runtime.mutation_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P29-E validation failed');
}

console.log('P29-E Inventory transport architecture foundation passed.');
