import { buildInventoryPhase28Closure } from '../src/inventory-bridge/phase28Closure/index.js';

const training = buildInventoryPhase28Closure('TRAINING');
const test = buildInventoryPhase28Closure('TEST');
const live = buildInventoryPhase28Closure('LIVE');
const production = buildInventoryPhase28Closure('PRODUCTION');
const unknown = buildInventoryPhase28Closure('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.closedPhases),
  training.phase_28_candidate_chain_closed === true,
  test.phase_28_candidate_chain_closed === true,
  live.phase_28_candidate_chain_closed === false,
  production.phase_28_candidate_chain_closed === false,
  unknown.phase_28_candidate_chain_closed === false,
  training.closedPhases.phase_28a_scanops_candidate === true,
  training.closedPhases.phase_28i_scanops_phase28_closure === true,
  training.inventory_system_of_record === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.listener_active === false,
  training.ingestion_engine_active === false,
  training.transport_active === false,
  training.desktop_call_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
  training.inventory_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P28-J validation failed');
}

console.log('P28-J Inventory Phase 28 closure passed.');
