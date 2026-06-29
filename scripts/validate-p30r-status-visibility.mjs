import { buildStatusVisibilityContract } from '../src/inventory-bridge/statusVisibilityContract/index.js';

const training = buildStatusVisibilityContract('TRAINING');
const test = buildStatusVisibilityContract('TEST');
const live = buildStatusVisibilityContract('LIVE');
const production = buildStatusVisibilityContract('PRODUCTION');
const unknown = buildStatusVisibilityContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.visible_summary_candidate_shape),
  Object.isFrozen(training.status_category_candidate_shape),
  Object.isFrozen(training.prohibited_visibility_operations),
  training.status_visibility_contract_ready === true,
  test.status_visibility_contract_ready === true,
  live.status_visibility_contract_ready === false,
  production.status_visibility_contract_ready === false,
  unknown.status_visibility_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.visibility_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.visible_summary_candidate_shape.generated === false,
  training.visible_summary_candidate_shape.emitted === false,
  training.visible_summary_candidate_shape.persisted === false,
  training.status_category_candidate_shape.generated === false,
  training.status_category_candidate_shape.emitted === false,
  training.status_category_candidate_shape.persisted === false,
  training.prohibited_visibility_operations.collect_status === false,
  training.prohibited_visibility_operations.probe_device === false,
  training.prohibited_visibility_operations.probe_bridge === false,
  training.prohibited_visibility_operations.refresh_runtime_state === false,
  training.prohibited_visibility_operations.persist_visible_summary === false,
  training.prohibited_visibility_operations.persist_status_category === false,
  training.prohibited_visibility_operations.open_listener === false,
  training.prohibited_visibility_operations.call_transport === false,
  training.prohibited_visibility_operations.send_event === false,
  training.prohibited_visibility_operations.receive_event === false,
  training.status_collected === false,
  training.device_probe_attempted === false,
  training.bridge_probe_attempted === false,
  training.runtime_state_refreshed === false,
  training.visible_summary_persisted === false,
  training.status_category_persisted === false,
  training.listener_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.event_sent === false,
  training.event_received === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
  training.item_master_mutation_allowed === false,
  training.price_mutation_allowed === false,
  training.accounting_mutation_allowed === false,
  training.purchase_order_write_allowed === false,
  training.forecast_write_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-R validation failed');
}

console.log('P30-R Status visibility contract passed.');
