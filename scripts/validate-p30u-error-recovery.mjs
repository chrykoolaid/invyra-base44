import { buildErrorRecoveryContract } from '../src/inventory-bridge/errorRecoveryContract/index.js';

const training = buildErrorRecoveryContract('TRAINING');
const test = buildErrorRecoveryContract('TEST');
const live = buildErrorRecoveryContract('LIVE');
const production = buildErrorRecoveryContract('PRODUCTION');
const unknown = buildErrorRecoveryContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.error_category_candidate_shape),
  Object.isFrozen(training.recovery_category_candidate_shape),
  Object.isFrozen(training.retry_classification_candidate_shape),
  Object.isFrozen(training.prohibited_error_operations),
  training.error_recovery_contract_ready === true,
  test.error_recovery_contract_ready === true,
  live.error_recovery_contract_ready === false,
  production.error_recovery_contract_ready === false,
  unknown.error_recovery_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.error_bundle_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.error_category_candidate_shape.generated === false,
  training.error_category_candidate_shape.emitted === false,
  training.error_category_candidate_shape.persisted === false,
  training.recovery_category_candidate_shape.executed === false,
  training.recovery_category_candidate_shape.persisted === false,
  training.retry_classification_candidate_shape.executed === false,
  training.retry_classification_candidate_shape.persisted === false,
  training.prohibited_error_operations.classify_runtime_error === false,
  training.prohibited_error_operations.persist_error_record === false,
  training.prohibited_error_operations.emit_error_event === false,
  training.prohibited_error_operations.execute_recovery === false,
  training.prohibited_error_operations.schedule_retry === false,
  training.prohibited_error_operations.replay_queue === false,
  training.prohibited_error_operations.rollback_state === false,
  training.prohibited_error_operations.escalate_operator_alert === false,
  training.prohibited_error_operations.open_listener === false,
  training.prohibited_error_operations.call_transport === false,
  training.prohibited_error_operations.send_event === false,
  training.prohibited_error_operations.receive_event === false,
  training.runtime_error_classified === false,
  training.error_record_persisted === false,
  training.error_event_emitted === false,
  training.recovery_executed === false,
  training.retry_scheduled === false,
  training.queue_replay_active === false,
  training.rollback_executed === false,
  training.operator_alert_escalated === false,
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
  throw new Error('P30-U validation failed');
}

console.log('P30-U Error recovery bundle passed.');
