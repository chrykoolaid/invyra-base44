import { buildInventoryRoundtripRecognition } from '../src/inventory-bridge/roundtripRecognition/index.js';

const training = buildInventoryRoundtripRecognition('TRAINING');
const test = buildInventoryRoundtripRecognition('TEST');
const live = buildInventoryRoundtripRecognition('LIVE');
const production = buildInventoryRoundtripRecognition('PRODUCTION');
const unknown = buildInventoryRoundtripRecognition('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  training.roundtrip_recognized === true,
  test.roundtrip_recognized === true,
  live.roundtrip_recognized === false,
  production.roundtrip_recognized === false,
  unknown.roundtrip_recognized === false,
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
  throw new Error('P28-H validation failed');
}

console.log('P28-H Inventory candidate roundtrip recognition passed.');
