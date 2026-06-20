import {
  assertNoInventoryBridgeStackReadinessReviewOperationalMutation,
  getInventoryBridgeStackReadinessReviewSafeSummary,
  projectInventoryBridgeStackReadinessReviewManifest,
  validateInventoryBridgeStackReadinessReviewInput,
} from '../src/lib/inventory/bridgeStackReadinessReviewManifest.js';

const inventoryStackEvidence = Object.freeze({
  ok: true,
  schema_version: '1.0.0',
  phase: '1D-D-AJ',
  bridge_protocol_version: '1.0.0',
  code: 'INVENTORY_BRIDGE_STACK_EVIDENCE_PROJECTED',
  status: 'BRIDGE_STACK_EVIDENCE_PROJECTED_LOCKED_NON_OPERATIONAL',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  source_release_plan_draft_phase: '1D-D-AH',
  scanops_release_plan_acceptance_phase: '1D-D-AI',
  bridge_gate_locked: true,
  operationally_enabled: false,
  required_phases: [
    '1D-D-U',
    '1D-D-V',
    '1D-D-W',
    '1D-D-X',
    '1D-D-Y',
    '1D-D-Z',
    '1D-D-AA',
    '1D-D-AB',
    '1D-D-AC',
    '1D-D-AD',
    '1D-D-AE',
    '1D-D-AF',
    '1D-D-AG',
    '1D-D-AH',
    '1D-D-AI',
  ],
  required_phase_count: 15,
  relay_enforcement_allowed: false,
  relay_transport_allowed: false,
  event_transport_allowed: false,
  event_sync_allowed: false,
  event_ingestion_allowed: false,
  inventory_mutation_allowed: false,
  evidence_projection_only: true,
  projected_at: '2026-06-20T14:00:00.000Z',
});

const scanOpsStackAcceptance = Object.freeze({
  ok: true,
  code: 'SCANOPS_STACK_EVIDENCE_ACCEPTED',
  local_state: {
    status: 'STACK_EVIDENCE_ACCEPTED_LOCKED_NON_OPERATIONAL',
    source_device_id: 'SCANOPS-DEVICE-001',
    environment: 'LIVE',
    store_id: 'STORE-001',
    inventory_instance_id: 'INV-INSTANCE-001',
    inventory_stack_evidence_phase: '1D-D-AJ',
    bridge_gate_locked: true,
    operationally_enabled: false,
    required_phase_count: 15,
    capabilities_enabled: false,
    evidence_projection_only: true,
    accepted_at: '2026-06-20T15:00:00.000Z',
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

function reject(inventoryStack, scanOpsAcceptance, expectedCode, label) {
  const result = projectInventoryBridgeStackReadinessReviewManifest(inventoryStack, scanOpsAcceptance, scope, {
    projected_at: '2026-06-20T16:00:00.000Z',
  });
  assertEqual(result.ok, false, `${label}.ok`);
  assertEqual(result.code, expectedCode, `${label}.code`);
  assertEqual(result.ready_for_ordered_review, false, `${label}.ready_for_ordered_review`);
  assertEqual(result.merge_allowed, false, `${label}.merge_allowed`);
  assertEqual(result.runtime_activation_allowed, false, `${label}.runtime_activation_allowed`);
  assertEqual(result.operationally_enabled, false, `${label}.operationally_enabled`);
}

function main() {
  const validation = validateInventoryBridgeStackReadinessReviewInput(inventoryStackEvidence, scanOpsStackAcceptance, scope);
  assertEqual(validation.ok, true, 'validation.ok');
  assertEqual(validation.code, 'BRIDGE_STACK_READINESS_REVIEW_INPUT_VALID', 'validation.code');

  const projected = projectInventoryBridgeStackReadinessReviewManifest(inventoryStackEvidence, scanOpsStackAcceptance, scope, {
    projected_at: '2026-06-20T16:00:00.000Z',
  });
  assertEqual(projected.ok, true, 'projected.ok');
  assertEqual(projected.code, 'INVENTORY_BRIDGE_STACK_READINESS_REVIEW_PROJECTED', 'projected.code');
  assertEqual(projected.status, 'BRIDGE_STACK_READINESS_REVIEW_PROJECTED_LOCKED_NON_OPERATIONAL', 'projected.status');
  assertEqual(projected.phase, '1D-D-AL', 'projected.phase');
  assertEqual(projected.inventory_stack_evidence_phase, '1D-D-AJ', 'projected.inventory_stack_evidence_phase');
  assertEqual(projected.scanops_stack_acceptance_phase, '1D-D-AK', 'projected.scanops_stack_acceptance_phase');
  assertEqual(projected.bridge_gate_locked, true, 'projected.bridge_gate_locked');
  assertEqual(projected.ready_for_ordered_review, true, 'projected.ready_for_ordered_review');
  assertEqual(projected.merge_allowed, false, 'projected.merge_allowed');
  assertEqual(projected.release_allowed, false, 'projected.release_allowed');
  assertEqual(projected.runtime_activation_allowed, false, 'projected.runtime_activation_allowed');
  assertEqual(projected.operationally_enabled, false, 'projected.operationally_enabled');
  assertEqual(projected.review_order_count, 18, 'projected.review_order_count');
  assertEqual(projected.event_sync_allowed, false, 'projected.event_sync_allowed');
  assertEqual(projected.event_ingestion_allowed, false, 'projected.event_ingestion_allowed');
  assertEqual(projected.inventory_mutation_allowed, false, 'projected.inventory_mutation_allowed');

  const summary = getInventoryBridgeStackReadinessReviewSafeSummary(projected);
  assertEqual(summary.ready_for_ordered_review, true, 'summary.ready_for_ordered_review');
  assertEqual(summary.merge_allowed, false, 'summary.merge_allowed');
  assertEqual(summary.runtime_activation_allowed, false, 'summary.runtime_activation_allowed');
  assertEqual(summary.review_order_count, 18, 'summary.review_order_count');

  reject({ ...inventoryStackEvidence, phase: '1D-D-AH' }, scanOpsStackAcceptance, 'BRIDGE_STACK_READINESS_REVIEW_INVENTORY_STACK_PHASE_MISMATCH', 'inventory phase mismatch blocked');
  reject({ ...inventoryStackEvidence, status: 'BRIDGE_STACK_EVIDENCE_OPEN' }, scanOpsStackAcceptance, 'BRIDGE_STACK_READINESS_REVIEW_INVENTORY_STACK_STATUS_MISMATCH', 'inventory status mismatch blocked');
  reject({ ...inventoryStackEvidence, operationally_enabled: true }, scanOpsStackAcceptance, 'BRIDGE_STACK_READINESS_REVIEW_INVENTORY_STACK_STATUS_MISMATCH', 'inventory operational enabled blocked');
  reject({ ...inventoryStackEvidence, event_sync_allowed: true }, scanOpsStackAcceptance, 'BRIDGE_STACK_READINESS_REVIEW_UNSAFE_CAPABILITY_ENABLED', 'inventory unsafe capability blocked');
  reject({ ...inventoryStackEvidence, required_phases: [], required_phase_count: 0 }, scanOpsStackAcceptance, 'BRIDGE_STACK_READINESS_REVIEW_ORDER_MISSING', 'review order missing blocked');
  reject(inventoryStackEvidence, null, 'BRIDGE_STACK_READINESS_REVIEW_SCANOPS_ACCEPTANCE_MISSING', 'scanops acceptance missing blocked');
  reject(inventoryStackEvidence, { ...scanOpsStackAcceptance, code: 'SCANOPS_STACK_EVIDENCE_REJECTED' }, 'BRIDGE_STACK_READINESS_REVIEW_SCANOPS_ACCEPTANCE_STATUS_MISMATCH', 'scanops status mismatch blocked');
  reject(inventoryStackEvidence, { ...scanOpsStackAcceptance, local_state: { ...scanOpsStackAcceptance.local_state, inventory_stack_evidence_phase: '1D-D-AH' } }, 'BRIDGE_STACK_READINESS_REVIEW_SCANOPS_ACCEPTANCE_PHASE_MISMATCH', 'scanops phase mismatch blocked');
  reject({ ...inventoryStackEvidence, source_device_id: 'SCANOPS-OTHER' }, scanOpsStackAcceptance, 'BRIDGE_STACK_READINESS_REVIEW_SCOPE_MISMATCH', 'scope mismatch blocked');

  const guardrails = assertNoInventoryBridgeStackReadinessReviewOperationalMutation();
  assertEqual(guardrails.projection_only, true, 'guardrails.projection_only');
  assertEqual(guardrails.local_validator_only, true, 'guardrails.local_validator_only');
  assertEqual(guardrails.review_readiness_only, true, 'guardrails.review_readiness_only');
  assertEqual(guardrails.non_operational, true, 'guardrails.non_operational');
  assertEqual(guardrails.merge_allowed, false, 'guardrails.merge_allowed');
  assertEqual(guardrails.release_allowed, false, 'guardrails.release_allowed');
  assertEqual(guardrails.runtime_activation_allowed, false, 'guardrails.runtime_activation_allowed');
  assertEqual(guardrails.no_event_sync, true, 'guardrails.no_event_sync');
  assertEqual(guardrails.no_event_ingestion, true, 'guardrails.no_event_ingestion');
  assertEqual(guardrails.no_entity_writes, true, 'guardrails.no_entity_writes');

  console.log('Inventory bridge stack readiness review manifest validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory bridge stack readiness review manifest validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
