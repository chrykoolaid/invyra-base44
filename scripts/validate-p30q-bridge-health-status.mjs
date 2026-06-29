import { buildBridgeHealthStatusContract } from '../src/inventory-bridge/bridgeHealthStatusContract/index.js';

const training = buildBridgeHealthStatusContract('TRAINING');
const test = buildBridgeHealthStatusContract('TEST');
const live = buildBridgeHealthStatusContract('LIVE');
const production = buildBridgeHealthStatusContract('PRODUCTION');
const unknown = buildBridgeHealthStatusContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.bridge_status_candidate_shape),
  Object.isFrozen(training.readiness_summary_candidate_shape),
  Object.isFrozen(training.prohibited_health_operations),
  training.bridge_health_status_contract_ready === true,
  test.bridge_health_status_contract_ready === true,
  live.bridge_health_status_contract_ready === false,
  production.bridge_health_status_contract_ready === false,
  unknown.bridge_health_status_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.health_status_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.bridge_status_candidate_shape.generated === false,
  training.bridge_status_candidate_shape.emitted === false,
  training.bridge_status_candidate_shape.persisted === false,
  training.readiness_summary_candidate_shape.generated === false,
  training.readiness_summary_candidate_shape.emitted === false,
  training.readiness_summary_candidate_shape.persisted === false,
  training.prohibited_health_operations.collect_diagnostics === false,
  training.prohibited_health_operations.ping_device === false,
  training.prohibited_health_operations.ping_bridge === false,
  training.prohibited_health_operations.update_status === false,
  training.prohibited_health_operations.update_readiness === false,
  training.prohibited_health_operations.persist_health_status === false,
  training.prohibited_health_operations.persist_readiness_summary === false,
  training.prohibited_health_operations.open_listener === false,
  training.prohibited_health_operations.call_transport === false,
  training.prohibited_health_operations.send_event === false,
  training.prohibited_health_operations.receive_event === false,
  training.diagnostics_collected === false,
  training.device_ping_attempted === false,
  training.bridge_ping_attempted === false,
  training.status_updated === false,
  training.readiness_updated === false,
  training.health_status_persisted === false,
  training.readiness_summary_persisted === false,
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
  throw new Error('P30-Q validation failed');
}

console.log('P30-Q Bridge health status contract passed.');
