import {
  assertNoInventoryBridgeStackEvidenceOperationalMutation,
  getInventoryBridgeStackEvidenceSafeSummary,
  projectInventoryBridgeStackEvidenceManifest,
  validateInventoryBridgeStackEvidenceInput,
} from '../src/lib/inventory/bridgeStackEvidenceManifest.js';

const releasePlanDraft = Object.freeze({
  ok: true,
  schema_version: '1.0.0',
  phase: '1D-D-AH',
  bridge_protocol_version: '1.0.0',
  code: 'INVENTORY_BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED',
  status: 'BRIDGE_RELEASE_PLAN_DRAFT_PROJECTED_LOCKED_NON_EXECUTABLE',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  bridge_gate_locked: true,
  executable: false,
  release_allowed: false,
  release_pr_required: true,
  plan_steps: ['confirm_stacked_prs_verified_in_order', 'confirm_future_release_requires_new_explicit_pr'],
  plan_step_count: 2,
  relay_enforcement_allowed: false,
  relay_transport_allowed: false,
  event_transport_allowed: false,
  event_sync_allowed: false,
  event_ingestion_allowed: false,
  inventory_mutation_allowed: false,
  evidence_projection_only: true,
  projected_at: '2026-06-20T12:00:00.000Z',
});

const scanOpsAcceptance = Object.freeze({
  ok: true,
  code: 'SCANOPS_RELEASE_PLAN_DRAFT_ACCEPTED',
  local_state: {
    status: 'RELEASE_PLAN_DRAFT_ACCEPTED_LOCKED_NON_EXECUTABLE',
    source_device_id: 'SCANOPS-DEVICE-001',
    environment: 'LIVE',
    store_id: 'STORE-001',
    inventory_instance_id: 'INV-INSTANCE-001',
    inventory_release_plan_draft_phase: '1D-D-AH',
    bridge_gate_locked: true,
    executable: false,
    release_allowed: false,
    release_pr_required: true,
    plan_step_count: 2,
    capabilities_enabled: false,
    evidence_projection_only: true,
    accepted_at: '2026-06-20T13:00:00.000Z',
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

function reject(plan, acceptance, expectedCode, label) {
  const result = projectInventoryBridgeStackEvidenceManifest(plan, acceptance, scope, {
    projected_at: '2026-06-20T14:00:00.000Z',
  });
  assertEqual(result.ok, false, `${label}.ok`);
  assertEqual(result.code, expectedCode, `${label}.code`);
  assertEqual(result.operationally_enabled, false, `${label}.operationally_enabled`);
  assertEqual(result.event_sync_allowed, false, `${label}.event_sync_allowed`);
  assertEqual(result.inventory_mutation_allowed, false, `${label}.inventory_mutation_allowed`);
}

function main() {
  const validation = validateInventoryBridgeStackEvidenceInput(releasePlanDraft, scanOpsAcceptance, scope);
  assertEqual(validation.ok, true, 'validation.ok');
  assertEqual(validation.code, 'BRIDGE_STACK_EVIDENCE_INPUT_VALID', 'validation.code');

  const projected = projectInventoryBridgeStackEvidenceManifest(releasePlanDraft, scanOpsAcceptance, scope, {
    projected_at: '2026-06-20T14:00:00.000Z',
  });
  assertEqual(projected.ok, true, 'projected.ok');
  assertEqual(projected.code, 'INVENTORY_BRIDGE_STACK_EVIDENCE_PROJECTED', 'projected.code');
  assertEqual(projected.status, 'BRIDGE_STACK_EVIDENCE_PROJECTED_LOCKED_NON_OPERATIONAL', 'projected.status');
  assertEqual(projected.phase, '1D-D-AJ', 'projected.phase');
  assertEqual(projected.source_release_plan_draft_phase, '1D-D-AH', 'projected.source_release_plan_draft_phase');
  assertEqual(projected.scanops_release_plan_acceptance_phase, '1D-D-AI', 'projected.scanops_release_plan_acceptance_phase');
  assertEqual(projected.bridge_gate_locked, true, 'projected.bridge_gate_locked');
  assertEqual(projected.operationally_enabled, false, 'projected.operationally_enabled');
  assertEqual(projected.required_phase_count, 15, 'projected.required_phase_count');
  assertEqual(projected.event_sync_allowed, false, 'projected.event_sync_allowed');
  assertEqual(projected.event_ingestion_allowed, false, 'projected.event_ingestion_allowed');
  assertEqual(projected.inventory_mutation_allowed, false, 'projected.inventory_mutation_allowed');
  assertEqual(projected.evidence_projection_only, true, 'projected.evidence_projection_only');

  const summary = getInventoryBridgeStackEvidenceSafeSummary(projected);
  assertEqual(summary.status, 'BRIDGE_STACK_EVIDENCE_PROJECTED_LOCKED_NON_OPERATIONAL', 'summary.status');
  assertEqual(summary.operationally_enabled, false, 'summary.operationally_enabled');
  assertEqual(summary.required_phase_count, 15, 'summary.required_phase_count');

  reject({ ...releasePlanDraft, phase: '1D-D-AF' }, scanOpsAcceptance, 'BRIDGE_STACK_EVIDENCE_PLAN_PHASE_MISMATCH', 'plan phase mismatch blocked');
  reject({ ...releasePlanDraft, status: 'BRIDGE_RELEASE_PLAN_DRAFT_OPEN' }, scanOpsAcceptance, 'BRIDGE_STACK_EVIDENCE_PLAN_STATUS_MISMATCH', 'plan status mismatch blocked');
  reject({ ...releasePlanDraft, executable: true }, scanOpsAcceptance, 'BRIDGE_STACK_EVIDENCE_PLAN_STATUS_MISMATCH', 'executable blocked');
  reject({ ...releasePlanDraft, plan_steps: [], plan_step_count: 0 }, scanOpsAcceptance, 'BRIDGE_STACK_EVIDENCE_PLAN_STEPS_MISSING', 'plan steps missing blocked');
  reject(releasePlanDraft, null, 'BRIDGE_STACK_EVIDENCE_ACCEPTANCE_MISSING', 'acceptance missing blocked');
  reject(releasePlanDraft, { ...scanOpsAcceptance, code: 'SCANOPS_RELEASE_PLAN_DRAFT_REJECTED' }, 'BRIDGE_STACK_EVIDENCE_ACCEPTANCE_STATUS_MISMATCH', 'acceptance status mismatch blocked');
  reject(releasePlanDraft, { ...scanOpsAcceptance, local_state: { ...scanOpsAcceptance.local_state, inventory_release_plan_draft_phase: '1D-D-AF' } }, 'BRIDGE_STACK_EVIDENCE_ACCEPTANCE_PHASE_MISMATCH', 'acceptance phase mismatch blocked');
  reject({ ...releasePlanDraft, source_device_id: 'SCANOPS-OTHER' }, scanOpsAcceptance, 'BRIDGE_STACK_EVIDENCE_SCOPE_MISMATCH', 'scope mismatch blocked');
  reject({ ...releasePlanDraft, event_sync_allowed: true }, scanOpsAcceptance, 'BRIDGE_STACK_EVIDENCE_UNSAFE_CAPABILITY_ENABLED', 'capability enabled blocked');

  const guardrails = assertNoInventoryBridgeStackEvidenceOperationalMutation();
  assertEqual(guardrails.projection_only, true, 'guardrails.projection_only');
  assertEqual(guardrails.local_validator_only, true, 'guardrails.local_validator_only');
  assertEqual(guardrails.stack_evidence_only, true, 'guardrails.stack_evidence_only');
  assertEqual(guardrails.non_operational, true, 'guardrails.non_operational');
  assertEqual(guardrails.no_relay_enforcement, true, 'guardrails.no_relay_enforcement');
  assertEqual(guardrails.no_event_sync, true, 'guardrails.no_event_sync');
  assertEqual(guardrails.no_event_ingestion, true, 'guardrails.no_event_ingestion');
  assertEqual(guardrails.no_entity_writes, true, 'guardrails.no_entity_writes');

  console.log('Inventory bridge stack evidence manifest validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory bridge stack evidence manifest validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
