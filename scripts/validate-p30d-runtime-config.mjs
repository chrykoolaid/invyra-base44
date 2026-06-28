import { buildInventoryRuntimeConfigContract } from '../src/inventory-bridge/runtimeConfigContract/index.js';

const training = buildInventoryRuntimeConfigContract('TRAINING');
const test = buildInventoryRuntimeConfigContract('TEST');
const live = buildInventoryRuntimeConfigContract('LIVE');
const production = buildInventoryRuntimeConfigContract('PRODUCTION');
const unknown = buildInventoryRuntimeConfigContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.config_shape),
  Object.isFrozen(training.disabled_config_operations),
  training.config_contract_ready === true,
  test.config_contract_ready === true,
  live.config_contract_ready === false,
  production.config_contract_ready === false,
  unknown.config_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.config_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.disabled_config_operations.save_config === false,
  training.disabled_config_operations.load_persisted_config === false,
  training.disabled_config_operations.open_listener === false,
  training.disabled_config_operations.ingest_candidate === false,
  training.config_persisted === false,
  training.config_loaded_from_storage === false,
  training.endpoint_validated === false,
  training.listener_active === false,
  training.ingestion_engine_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.event_received === false,
  training.inbound_persisted === false,
  training.receipt_emitted === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
  training.runtime_activation_allowed === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-D validation failed');
}

console.log('P30-D Inventory runtime config contract passed.');
