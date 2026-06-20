import {
  assertNoInventoryBridgeReleasePlanDraftOperationalMutation,
  getInventoryBridgeReleasePlanDraftSafeSummary,
  projectInventoryBridgeReleasePlanDraft,
  validateInventoryBridgeReleasePlanDraftInput,
} from '../src/lib/inventory/bridgeReleasePlanDraftProjection.js';

const releaseBlocker = Object.freeze({
  ok: true,
  schema_version: '1.0.0',
  phase: '1D-D-AF',
  bridge_protocol_version: '1.0.0',
  code: 'INVENTORY_BRIDGE_RELEASE_BLOCKER_PROJECTED',
  status: 'BRIDGE_RELEASE_BLOCKED_PENDING_EXPLICIT_RELEASE_PLAN',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  bridge_gate_locked: true,
  release_allowed: false,
  release_plan_required: true,
  blockers: ['explicit_release_plan_missing', 'event_transport_not_released'],
  blocker_count: 2,
  relay_enforcement_allowed: false,
  relay_transport_allowed: false,
  event_transport_allowed: false,
  event_sync_allowed: false,
  event_ingestion_allowed: false,
  inventory_mutation_allowed: false,
  evidence_projection_only: true,
  projected_at: '2026-06-20T10:00:00.000Z',
});

const scanOpsAcceptance = Object.freeze({
  ok: true,
  code: 'SCANOPS_RELEASE_BLOCKER_ACCEPTED',
  local_state: {
    status: 'RELEASE_BLOCKER_ACCEPTED_LOCKED_PENDING_RELEASE_PLAN',
    source_device_id: 'SCANOPS-DEVICE-001',
    environment: 'LIVE',
    store_id: 'STORE-001',
    inventory_instance_id: 'INV-INSTANCE-001',
    inventory_release_blocker_phase: '1D-D-AF',
    bridge_gate_locked: true,
    release_allowed: false,
    release_plan_required: true,
    blocker_count: 2,
    capabilities_enabled: false,
    evidence_projection_only: true,
    accepted_at: '2026-06-20T11:00:00.000Z',
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

function reject(blocker, acceptance, expectedCode, label) {
  const result = projectInventoryBridgeReleasePlanDraft(blocker, acceptance, scope, {
    projected_at: '2026-06-20T12:00:00.000Z',
  });
  assertEqual(result.ok, false, `${label}.ok`);
  assertEqual(result.code, expectedCode, `${label}.code`);
  assertEqual(result.executable, false, `${label}.executable`);
  assertEqual(result.release_allowed, false, `${label}.release_allowed`);
  assertEqual(result.event_sync_allowed, false, `${label}.event_sync_allowed`);
  assertEqual(result.inventory_mutation_allowed, false, `${label}.inventory_mutation_allowed`);
}

function main() {
  const validation = validateInventoryBridgeReleasePlanDraftInput(releaseBlocker, scanOpsAcceptance, scope);
  assertEqual(validation.ok, true, 'validation.ok');
  assertEqual(validation.code, 'BRIDGE_RELEASE_PLAN_DRAFT_INPUT_VALID', 'validation.code');

  const projected = projectInventoryBridgeReleasePlanDraft(releaseBlocker, scanOpsAcceptance, scope, {
    projected_at: '2026-06-20T12:00:00.000Z',
  });
  assertEqual(projected.ok, true, 'projected.ok');
  assertEqual(projected.code, 'INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED', 'projected.code');
  assertEqual(projected.status, 'BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED_LOCKED_NON_EXECUTABLE', 'projected.status');
  assertEqual(projected.phase, '1D-D-AH', 'projected.phase');
  assertEqual(projected.source_release_blocker_phase, '1D-D-AF', 'projected.source_release_blocker_phase');
  assertEqual(projected.scanops_release_blocker_acceptance_phase, '1D-D-AG', 'projected.scanops_release_blocker_acceptance_phase');
  assertEqual(projected.bridge_gate_locked, true, 'projected.bridge_gate_locked');
  assertEqual(projected.executable, false, 'projected.executable');
  assertEqual(projected.release_allowed, false, 'projected.release_allowed');
  assertEqual(projected.release_pr_required, true, 'projected.release_pr_required');
  assertEqual(projected.plan_step_count, 9, 'projected.plan_step_count');
  assertEqual(projected.relay_enforcement_allowed, false, 'projected.relay_enforcement_allowed');
  assertEqual(projected.relay_transport_allowed, false, 'projected.relay_transport_allowed');
  assertEqual(projected.event_transport_allowed, false, 'projected.event_transport_allowed');
  assertEqual(projected.event_sync_allowed, false, 'projected.event_sync_allowed');
  assertEqual(projected.event_ingestion_allowed, false, 'projected.event_ingestion_allowed');
  assertEqual(projected.inventory_mutation_allowed, false, 'projected.inventory_mutation_allowed');
  assertEqual(projected.evidence_projection_only, true, 'projected.evidence_projection_only');

  const summary = getInventoryBridgeReleasePlanDraftSafeSummary(projected);
  assertEqual(summary.status, 'BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED_LOCKED_NON_EXECUTABLE', 'summary.status');
  assertEqual(summary.executable, false, 'summary.executable');
  assertEqual(summary.release_allowed, false, 'summary.release_allowed');
  assertEqual(summary.release_pr_required, true, 'summary.release_pr_required');
  assertEqual(summary.plan_step_count, 9, 'summary.plan_step_count');

  reject({ ...releaseBlocker, phase: '1D-D-AD' }, scanOpsAcceptance, 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_PHASE_MISMATCH', 'blocker phase mismatch blocked');
  reject({ ...releaseBlocker, status: 'BRIDGE_RELEASE_ALLOWED' }, scanOpsAcceptance, 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_STATUS_MISMATCH', 'blocker status mismatch blocked');
  reject({ ...releaseBlocker, release_allowed: true }, scanOpsAcceptance, 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_STATUS_MISMATCH', 'release allowed blocked');
  reject({ ...releaseBlocker, blockers: [], blocker_count: 0 }, scanOpsAcceptance, 'BRIDGE_RELEASE_PLAN_DRAFT_BLOCKER_LIST_MISSING', 'blocker list missing blocked');
  reject(releaseBlocker, null, 'BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_ACCEPTANCE_MISSING', 'acceptance missing blocked');
  reject(releaseBlocker, { ...scanOpsAcceptance, code: 'SCANOPS_RELEASE_BLOCKER_REJECTED' }, 'BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_STATUS_MISMATCH', 'acceptance status mismatch blocked');
  reject(releaseBlocker, { ...scanOpsAcceptance, local_state: { ...scanOpsAcceptance.local_state, inventory_release_blocker_phase: '1D-D-AD' } }, 'BRIDGE_RELEASE_PLAN_DRAFT_SCANOPS_PHASE_MISMATCH', 'acceptance phase mismatch blocked');
  reject({ ...releaseBlocker, source_device_id: 'SCANOPS-OTHER' }, scanOpsAcceptance, 'BRIDGE_RELEASE_PLAN_DRAFT_SCOPE_MISMATCH', 'scope mismatch blocked');
  reject({ ...releaseBlocker, event_sync_allowed: true }, scanOpsAcceptance, 'BRIDGE_RELEASE_PLAN_DRAFT_UNSAFE_CAPABILITY_ENABLED', 'capability enabled blocked');

  const guardrails = assertNoInventoryBridgeReleasePlanDraftOperationalMutation();
  assertEqual(guardrails.projection_only, true, 'guardrails.projection_only');
  assertEqual(guardrails.local_validator_only, true, 'guardrails.local_validator_only');
  assertEqual(guardrails.draft_plan_only, true, 'guardrails.draft_plan_only');
  assertEqual(guardrails.non_executable, true, 'guardrails.non_executable');
  assertEqual(guardrails.no_relay_enforcement, true, 'guardrails.no_relay_enforcement');
  assertEqual(guardrails.no_relay_transport, true, 'guardrails.no_relay_transport');
  assertEqual(guardrails.no_event_transport, true, 'guardrails.no_event_transport');
  assertEqual(guardrails.no_event_sync, true, 'guardrails.no_event_sync');
  assertEqual(guardrails.no_event_ingestion, true, 'guardrails.no_event_ingestion');
  assertEqual(guardrails.no_entity_writes, true, 'guardrails.no_entity_writes');

  console.log('Inventory bridge release plan draft projection validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory bridge release plan draft projection validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
