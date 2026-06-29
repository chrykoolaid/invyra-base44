import { buildOfflineLocalFirstContract } from '../src/inventory-bridge/offlineLocalFirstContract/index.js';

const training = buildOfflineLocalFirstContract('TRAINING');
const test = buildOfflineLocalFirstContract('TEST');
const live = buildOfflineLocalFirstContract('LIVE');
const production = buildOfflineLocalFirstContract('PRODUCTION');
const unknown = buildOfflineLocalFirstContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  training.offline_local_first_contract_ready === true,
  test.offline_local_first_contract_ready === true,
  live.offline_local_first_contract_ready === false,
  production.offline_local_first_contract_ready === false,
  unknown.offline_local_first_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.cloud_optional === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.listener_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
  training.item_master_mutation_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-O validation failed');
}

console.log('P30-O Offline local-first contract passed.');
