import {
  assertNoInventoryBridgeReleaseBlockerOperationalMutation,
  getInventoryBridgeReleaseBlockerSafeSummary,
  projectInventoryBridgeReleaseBlocker,
  validateInventoryBridgeReleaseBlockerInput,
} from '../src/lib/inventory/bridgeReleaseBlockerProjection.js';

const requirementsManifest = Object.freeze({
  schema_version: '1.0.0',
  phase: '1D-D-AD',
  bridge_protocol_version: '1.0.0',
  code: 'INVENTORY_BRIDGE_GATE_REQUIREMENTS_PROJECTED',
  status: 'BRIDGE_GATE_REQUIREMENTS_PROJECTED_LOCKED',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  bridge_gate_locked: true,
  later_release_phase_required: true,
  requirements: ['separate_release_phase_required', 'scope_recheck_required'],
  requirement_count: 2,
  relay_transport_allowed: false,
  event_transport_allowed: false,
  event_sync_allowed: false,
  event_ingestion_allowed: false,
  inventory_mutation_allowed: false,
  evidence_projection_only: true,
  projected_at: '2026-06-20T08:00:00.000Z',
});

const scanOpsAck = Object.freeze({
  ok: true,
  code: 'SCANOPS_GATE_REQUIREMENTS_ACCEPTED',
  local_state: {
    status: 'GATE_REQUIREMENTS_ACCEPTED_LOCKED_PENDING_RELEASE',
    source_device_id: 'SCANOPS-DEVICE-001',
    environment: 'LIVE',
    store_id: 'STORE-001',
    inventory_instance_id: 'INV-INSTANCE-001',
    inventory_manifest_phase: '1D-D-AD',
    bridge_gate_locked: true,
    later_release_required: true,
    requirement_count: 2,
    capabilities_enabled: false,
    evidence_projection_only: true,
    accepted_at: '2026-06-20T09:00:00.000Z',
  },
});

const scope = Object.freeze({
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

function reject(requirements, ack, expectedCode, label) {
  const result = projectInventoryBridgeReleaseBlocker(requirements, ack, scope, {
    projected_at: '2026-06-20T10:00:00.000Z',
  });
  assertEqual(result.ok, false, `${label}.ok`);
  assertEqual(result.code, expectedCode, `${label}.code`);
  assertEqual(result.release_allowed, false, `${label}.release_allowed`);
  assertEqual(result.event_sync_allowed, false, `${label}.event_sync_allowed`);
  assertEqual(result.event_ingestion_allowed, false, `${label}.event_ingestion_allowed`);
  assertEqual(result.inventory_mutation_allowed, false, `${label}.inventory_mutation_allowed`);
}

function main() {
  const validation = validateInventoryBridgeReleaseBlockerInput(requirementsManifest, scanOpsAck, scope);
  assertEqual(validation.ok, true, 'validation.ok');
  assertEqual(validation.code, 'BRIDGE_RELEASE_BLOCKER_INPUT_VALID', 'validation.code');

  const projected = projectInventoryBridgeReleaseBlocker(requirementsManifest, scanOpsAck, scope, {
    projected_at: '2026-06-20T10:00:00.000Z',
  });
  assertEqual(projected.ok, true, 'projected.ok');
  assertEqual(projected.code, 'INVENTORY_BRIDGE_RELEASE_BLOCKER_PROJECTED', 'projected.code');
  assertEqual(projected.status, 'BRIDGE_RELEASE_BLOCKED_PENDING_EXPLICIT_RELEASE_PLAN', 'projected.status');
  assertEqual(projected.phase, '1D-D-AF', 'projected.phase');
  assertEqual(projected.source_requirements_phase, '1D-D-AD', 'projected.source_requirements_phase');
  assertEqual(projected.source_ack_phase, '1D-D-AE', 'projected.source_ack_phase');
  assertEqual(projected.bridge_gate_locked, true, 'projected.bridge_gate_locked');
  assertEqual(projected.release_allowed, false, 'projected.release_allowed');
  assertEqual(projected.release_plan_required, true, 'projected.release_plan_required');
  assertEqual(projected.blocker_count, 8, 'projected.blocker_count');
  assertEqual(projected.relay_enforcement_allowed, false, 'projected.relay_enforcement_allowed');
  assertEqual(projected.relay_transport_allowed, false, 'projected.relay_transport_allowed');
  assertEqual(projected.event_transport_allowed, false, 'projected.event_transport_allowed');
  assertEqual(projected.event_sync_allowed, false, 'projected.event_sync_allowed');
  assertEqual(projected.event_ingestion_allowed, false, 'projected.event_ingestion_allowed');
  assertEqual(projected.inventory_mutation_allowed, false, 'projected.inventory_mutation_allowed');
  assertEqual(projected.evidence_projection_only, true, 'projected.evidence_projection_only');

  const summary = getInventoryBridgeReleaseBlockerSafeSummary(projected);
  assertEqual(summary.status, 'BRIDGE_RELEASE_BLOCKED_PENDING_EXPLICIT_RELEASE_PLAN', 'summary.status');
  assertEqual(summary.release_allowed, false, 'summary.release_allowed');
  assertEqual(summary.release_plan_required, true, 'summary.release_plan_required');
  assertEqual(summary.blocker_count, 8, 'summary.blocker_count');

  reject({ ...requirementsManifest, phase: '1D-D-AB' }, scanOpsAck, 'BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_PHASE_MISMATCH', 'requirements phase mismatch blocked');
  reject({ ...requirementsManifest, status: 'BRIDGE_GATE_REQUIREMENTS_BLOCKED' }, scanOpsAck, 'BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_STATUS_MISMATCH', 'requirements status mismatch blocked');
  reject({ ...requirementsManifest, requirements: [], requirement_count: 0 }, scanOpsAck, 'BRIDGE_RELEASE_BLOCKER_REQUIREMENTS_LIST_MISSING', 'requirements list missing blocked');
  reject(requirementsManifest, null, 'BRIDGE_RELEASE_BLOCKER_ACK_MISSING', 'ack missing blocked');
  reject(requirementsManifest, { ...scanOpsAck, code: 'SCANOPS_GATE_REQUIREMENTS_REJECTED' }, 'BRIDGE_RELEASE_BLOCKER_ACK_STATUS_MISMATCH', 'ack status mismatch blocked');
  reject(requirementsManifest, { ...scanOpsAck, local_state: { ...scanOpsAck.local_state, inventory_manifest_phase: '1D-D-AC' } }, 'BRIDGE_RELEASE_BLOCKER_ACK_PHASE_MISMATCH', 'ack phase mismatch blocked');
  reject({ ...requirementsManifest, source_device_id: 'SCANOPS-OTHER' }, scanOpsAck, 'BRIDGE_RELEASE_BLOCKER_SCOPE_MISMATCH', 'scope mismatch blocked');
  reject({ ...requirementsManifest, event_sync_allowed: true }, scanOpsAck, 'BRIDGE_RELEASE_BLOCKER_UNSAFE_CAPABILITY_ENABLED', 'capability enabled blocked');

  const guardrails = assertNoInventoryBridgeReleaseBlockerOperationalMutation();
  assertEqual(guardrails.projection_only, true, 'guardrails.projection_only');
  assertEqual(guardrails.local_validator_only, true, 'guardrails.local_validator_only');
  assertEqual(guardrails.release_blocker_only, true, 'guardrails.release_blocker_only');
  assertEqual(guardrails.no_relay_enforcement, true, 'guardrails.no_relay_enforcement');
  assertEqual(guardrails.no_relay_transport, true, 'guardrails.no_relay_transport');
  assertEqual(guardrails.no_event_transport, true, 'guardrails.no_event_transport');
  assertEqual(guardrails.no_event_sync, true, 'guardrails.no_event_sync');
  assertEqual(guardrails.no_event_ingestion, true, 'guardrails.no_event_ingestion');
  assertEqual(guardrails.no_entity_writes, true, 'guardrails.no_entity_writes');

  console.log('Inventory bridge release blocker projection validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory bridge release blocker projection validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
