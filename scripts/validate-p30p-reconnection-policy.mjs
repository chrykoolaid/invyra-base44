import { buildReconnectionPolicyContract } from '../src/inventory-bridge/reconnectionPolicyContract/index.js';

const training = buildReconnectionPolicyContract('TRAINING');
const test = buildReconnectionPolicyContract('TEST');
const live = buildReconnectionPolicyContract('LIVE');
const production = buildReconnectionPolicyContract('PRODUCTION');
const unknown = buildReconnectionPolicyContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.recovery_policy_candidate_shape),
  Object.isFrozen(training.health_reference_candidate_shape),
  Object.isFrozen(training.prohibited_recovery_operations),
  training.reconnection_policy_contract_ready === true,
  test.reconnection_policy_contract_ready === true,
  live.reconnection_policy_contract_ready === false,
  production.reconnection_policy_contract_ready === false,
  unknown.reconnection_policy_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.recovery_policy_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.recovery_policy_candidate_shape.executed === false,
  training.recovery_policy_candidate_shape.persisted === false,
  training.health_reference_candidate_shape.generated === false,
  training.health_reference_candidate_shape.emitted === false,
  training.health_reference_candidate_shape.persisted === false,
  training.prohibited_recovery_operations.start_recovery_loop === false,
  training.prohibited_recovery_operations.schedule_recovery === false,
  training.prohibited_recovery_operations.attempt_recovery === false,
  training.prohibited_recovery_operations.send_status_ping === false,
  training.prohibited_recovery_operations.receive_status_ping === false,
  training.prohibited_recovery_operations.update_last_seen === false,
  training.prohibited_recovery_operations.replay_queue === false,
  training.prohibited_recovery_operations.open_listener === false,
  training.prohibited_recovery_operations.call_transport === false,
  training.prohibited_recovery_operations.send_event === false,
  training.prohibited_recovery_operations.receive_event === false,
  training.prohibited_recovery_operations.persist_health === false,
  training.prohibited_recovery_operations.persist_recovery_state === false,
  training.recovery_loop_active === false,
  training.recovery_scheduled === false,
  training.recovery_attempted === false,
  training.status_ping_sent === false,
  training.status_ping_received === false,
  training.last_seen_updated === false,
  training.queue_replay_active === false,
  training.listener_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.event_sent === false,
  training.event_received === false,
  training.health_persisted === false,
  training.recovery_state_persisted === false,
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
  throw new Error('P30-P validation failed');
}

console.log('P30-P Reconnection policy contract passed.');
