import { buildInventoryDeviceSessionContract } from '../src/inventory-bridge/deviceSessionContract/index.js';

const training = buildInventoryDeviceSessionContract('TRAINING');
const test = buildInventoryDeviceSessionContract('TEST');
const live = buildInventoryDeviceSessionContract('LIVE');
const production = buildInventoryDeviceSessionContract('PRODUCTION');
const unknown = buildInventoryDeviceSessionContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.device_reference_shape),
  Object.isFrozen(training.session_reference_shape),
  Object.isFrozen(training.disabled_device_session_operations),
  training.device_session_contract_ready === true,
  test.device_session_contract_ready === true,
  live.device_session_contract_ready === false,
  production.device_session_contract_ready === false,
  unknown.device_session_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.device_session_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.device_reference_shape.registered_in_inventory === false,
  training.device_reference_shape.persisted === false,
  training.session_reference_shape.active === false,
  training.session_reference_shape.persisted === false,
  training.disabled_device_session_operations.register_device === false,
  training.disabled_device_session_operations.open_listener === false,
  training.disabled_device_session_operations.ingest_candidate === false,
  training.device_registered === false,
  training.session_started === false,
  training.listener_active === false,
  training.ingestion_engine_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.event_received === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
  training.runtime_activation_allowed === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-F validation failed');
}

console.log('P30-F Inventory device/session contract passed.');
