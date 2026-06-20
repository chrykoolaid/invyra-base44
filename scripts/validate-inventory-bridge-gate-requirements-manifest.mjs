import {
  assertNoInventoryBridgeGateRequirementsOperationalMutation,
  getInventoryBridgeGateRequirementsSafeSummary,
  projectInventoryBridgeGateRequirementsManifest,
  validateInventoryBridgeGateRequirementsInput,
} from '../src/lib/inventory/bridgeGateRequirementsManifest.js';

const lockedGate = Object.freeze({
  ok: true,
  schema_version: '1.0.0',
  phase: '1D-D-AB',
  bridge_protocol_version: '1.0.0',
  code: 'INVENTORY_BRIDGE_GATE_PROJECTED',
  status: 'BRIDGE_GATE_LOCKED_PENDING_EXPLICIT_ENFORCEMENT',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
  bridge_gate_locked: true,
  explicit_future_enforcement_phase_required: true,
  relay_enforcement_allowed: false,
  relay_transport_allowed: false,
  event_transport_allowed: false,
  event_sync_allowed: false,
  event_ingestion_allowed: false,
  inventory_mutation_allowed: false,
  projected_at: '2026-06-20T06:00:00.000Z',
});

const expectedScope = Object.freeze({
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
});

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertRejected(gate, expectedCode, label) {
  const result = projectInventoryBridgeGateRequirementsManifest(gate, expectedScope, {
    projected_at: '2026-06-20T08:00:00.000Z',
  });
  assertEqual(result.ok, false, `${label}.ok`);
  assertEqual(result.code, expectedCode, `${label}.code`);
  assertEqual(result.event_sync_allowed, false, `${label}.event_sync_allowed`);
  assertEqual(result.event_ingestion_allowed, false, `${label}.event_ingestion_allowed`);
  assertEqual(result.inventory_mutation_allowed, false, `${label}.inventory_mutation_allowed`);
}

function main() {
  const validation = validateInventoryBridgeGateRequirementsInput(lockedGate, expectedScope);
  assertEqual(validation.ok, true, 'validation.ok');
  assertEqual(validation.code, 'BRIDGE_GATE_REQUIREMENTS_INPUT_VALID', 'validation.code');

  const projected = projectInventoryBridgeGateRequirementsManifest(lockedGate, expectedScope, {
    projected_at: '2026-06-20T08:00:00.000Z',
  });
  assertEqual(projected.ok, true, 'projected.ok');
  assertEqual(projected.code, 'INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROJECTED', 'projected.code');
  assertEqual(projected.status, 'BRIDGE_GATE_REQUIREMENTS_PROJECTED_LOCKED', 'projected.status');
  assertEqual(projected.phase, '1D-D-AD', 'projected.phase');
  assertEqual(projected.bridge_gate_locked, true, 'projected.bridge_gate_locked');
  assertEqual(projected.later_release_phase_required, true, 'projected.later_release_phase_required');
  assertEqual(projected.requirement_count, 10, 'projected.requirement_count');
  assertEqual(projected.relay_transport_allowed, false, 'projected.relay_transport_allowed');
  assertEqual(projected.event_transport_allowed, false, 'projected.event_transport_allowed');
  assertEqual(projected.event_sync_allowed, false, 'projected.event_sync_allowed');
  assertEqual(projected.event_ingestion_allowed, false, 'projected.event_ingestion_allowed');
  assertEqual(projected.inventory_mutation_allowed, false, 'projected.inventory_mutation_allowed');
  assertEqual(projected.evidence_projection_only, true, 'projected.evidence_projection_only');

  const summary = getInventoryBridgeGateRequirementsSafeSummary(projected);
  assertEqual(summary.status, 'BRIDGE_GATE_REQUIREMENTS_PROJECTED_LOCKED', 'summary.status');
  assertEqual(summary.requirement_count, 10, 'summary.requirement_count');
  assertEqual(summary.event_sync_allowed, false, 'summary.event_sync_allowed');
  assertEqual(summary.event_ingestion_allowed, false, 'summary.event_ingestion_allowed');
  assertEqual(summary.inventory_mutation_allowed, false, 'summary.inventory_mutation_allowed');

  assertRejected({ ...lockedGate, phase: '1D-D-Z' }, 'BRIDGE_GATE_SOURCE_PHASE_MISMATCH', 'phase mismatch blocked');
  assertRejected({ ...lockedGate, status: 'BRIDGE_GATE_BLOCKED' }, 'BRIDGE_GATE_SOURCE_NOT_LOCKED', 'unlocked status blocked');
  assertRejected({ ...lockedGate, bridge_gate_locked: false }, 'BRIDGE_GATE_SOURCE_NOT_LOCKED', 'unlocked gate blocked');
  assertRejected({ ...lockedGate, source_device_id: 'SCANOPS-OTHER' }, 'BRIDGE_GATE_REQUIREMENTS_DEVICE_MISMATCH', 'device mismatch blocked');
  assertRejected({ ...lockedGate, event_sync_allowed: true }, 'BRIDGE_GATE_UNSAFE_CAPABILITY_ENABLED', 'event sync enabled blocked');
  assertRejected({ ...lockedGate, event_ingestion_allowed: true }, 'BRIDGE_GATE_UNSAFE_CAPABILITY_ENABLED', 'event ingestion enabled blocked');
  assertRejected({ ...lockedGate, inventory_mutation_allowed: true }, 'BRIDGE_GATE_UNSAFE_CAPABILITY_ENABLED', 'inventory mutation enabled blocked');

  const guardrails = assertNoInventoryBridgeGateRequirementsOperationalMutation();
  assertEqual(guardrails.projection_only, true, 'guardrails.projection_only');
  assertEqual(guardrails.local_validator_only, true, 'guardrails.local_validator_only');
  assertEqual(guardrails.no_event_sync, true, 'guardrails.no_event_sync');
  assertEqual(guardrails.no_event_transport, true, 'guardrails.no_event_transport');
  assertEqual(guardrails.no_event_ingestion, true, 'guardrails.no_event_ingestion');
  assertEqual(guardrails.no_entity_writes, true, 'guardrails.no_entity_writes');

  console.log('Inventory bridge gate requirements manifest validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory bridge gate requirements manifest validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
