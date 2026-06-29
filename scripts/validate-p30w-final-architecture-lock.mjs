import { buildFinalArchitectureLockContract } from '../src/inventory-bridge/finalArchitectureLockContract/index.js';

const training = buildFinalArchitectureLockContract('TRAINING');
const test = buildFinalArchitectureLockContract('TEST');
const live = buildFinalArchitectureLockContract('LIVE');
const production = buildFinalArchitectureLockContract('PRODUCTION');
const unknown = buildFinalArchitectureLockContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.architecture_locks),
  Object.isFrozen(training.phase_31_readiness_candidate_shape),
  Object.isFrozen(training.prohibited_final_lock_operations),
  training.final_architecture_lock_ready === true,
  test.final_architecture_lock_ready === true,
  live.final_architecture_lock_ready === false,
  production.final_architecture_lock_ready === false,
  unknown.final_architecture_lock_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.cloud_optional === true,
  training.final_lock_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.architecture_locks.inventory_is_system_of_record === true,
  training.architecture_locks.scanops_is_operational_layer === true,
  training.architecture_locks.client_network_portable === true,
  training.architecture_locks.no_developer_network_assumptions === true,
  training.architecture_locks.contract_first === true,
  training.architecture_locks.runtime_requires_future_phase === true,
  training.phase_31_readiness_candidate_shape.approved === false,
  training.phase_31_readiness_candidate_shape.executed === false,
  training.phase_31_readiness_candidate_shape.persisted === false,
  training.phase_31_approved === false,
  training.runtime_activation_approved === false,
  training.runtime_enabled === false,
  training.listener_active === false,
  training.transport_active === false,
  training.queue_processed === false,
  training.inbox_processed === false,
  training.receipt_emitted === false,
  training.runtime_state_persisted === false,
  training.network_call_attempted === false,
  training.event_sent === false,
  training.event_received === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-W validation failed');
}

console.log('P30-W Final architecture lock passed.');
