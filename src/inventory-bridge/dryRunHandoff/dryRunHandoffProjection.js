import { buildInventoryBridgeLedgerCandidatePreview } from '../ledgerCandidate/index.js';
import {
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_COMPONENT,
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES,
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE,
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_REASONS,
  INVENTORY_BRIDGE_DRY_RUN_HANDOFF_STATUSES,
} from './dryRunHandoffFixtures.js';

function safeSegment(value, fallback = 'none') {
  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '')
    : '';
  return normalized || fallback;
}

function evidenceKey(preview) {
  return [
    preview.schema_version || 'none',
    preview.event_type || 'none',
    preview.event_id || 'none',
    preview.source_system || 'none',
    preview.source_device_id || 'none',
    preview.source_store_id || 'none',
  ].join(':').toLowerCase();
}

function dryRunStatus(ledgerPreview) {
  if (ledgerPreview.candidate_status === 'RUNTIME_DISABLED') return INVENTORY_BRIDGE_DRY_RUN_HANDOFF_STATUSES.RUNTIME_DISABLED;
  if (ledgerPreview.candidate_status === 'CONTRACT_REJECTED') return INVENTORY_BRIDGE_DRY_RUN_HANDOFF_STATUSES.CONTRACT_REJECTED;
  return INVENTORY_BRIDGE_DRY_RUN_HANDOFF_STATUSES.DRY_RUN_DISABLED;
}

function dryRunReason(ledgerPreview) {
  if (ledgerPreview.candidate_reason === 'runtime_disabled_before_ledger_candidate') return INVENTORY_BRIDGE_DRY_RUN_HANDOFF_REASONS.RUNTIME_DISABLED;
  if (ledgerPreview.candidate_reason === 'contract_rejected_before_ledger_candidate') return INVENTORY_BRIDGE_DRY_RUN_HANDOFF_REASONS.CONTRACT_REJECTED;
  return INVENTORY_BRIDGE_DRY_RUN_HANDOFF_REASONS.HANDOFF_DISABLED;
}

export function buildInventoryBridgeDryRunHandoffProjection(candidate = {}, options = {}) {
  const ledgerPreview = options.ledgerPreview || buildInventoryBridgeLedgerCandidatePreview(candidate, options);
  const sharedEvidenceIdentityKey = evidenceKey(ledgerPreview);
  const dryRunId = [
    'inventory-bridge-dry-run-handoff',
    safeSegment(ledgerPreview.schema_version),
    safeSegment(ledgerPreview.event_type),
    safeSegment(ledgerPreview.event_id),
    safeSegment(ledgerPreview.source_system),
    safeSegment(ledgerPreview.source_device_id),
    safeSegment(ledgerPreview.source_store_id),
  ].join(':');

  return Object.freeze({
    component: INVENTORY_BRIDGE_DRY_RUN_HANDOFF_COMPONENT,
    phase: INVENTORY_BRIDGE_DRY_RUN_HANDOFF_PHASE,
    dry_run_id: dryRunId,
    dry_run_status: dryRunStatus(ledgerPreview),
    dry_run_reason: dryRunReason(ledgerPreview),
    schema_version: ledgerPreview.schema_version,
    event_type: ledgerPreview.event_type,
    event_id: ledgerPreview.event_id,
    source_system: ledgerPreview.source_system,
    source_device_id: ledgerPreview.source_device_id,
    source_store_id: ledgerPreview.source_store_id,
    source_session_id: ledgerPreview.source_session_id,
    shared_evidence_identity_key: sharedEvidenceIdentityKey,
    inventory_idempotency_key: ledgerPreview.idempotency_key,
    outbound_candidate_status: null,
    ledger_candidate_status: ledgerPreview.candidate_status,
    contract_classification: ledgerPreview.contract_classification,
    runtime_state: ledgerPreview.runtime_state,
    runtime_enabled: false,
    runtime_ready: false,
    runtime_operational: false,
    transport_attempted: false,
    ingestion_attempted: false,
    outbox_processing_attempted: false,
    replay_attempted: false,
    inventory_call_attempted: false,
    ledger_write_attempted: false,
    receipt_emitted: false,
    acknowledgement_emitted: false,
    mutation_attempted: false,
    ingestible: false,
    persistable: false,
    writable: false,
    replayable: false,
    mutating: false,
    ledger_preview: ledgerPreview,
  });
}

function check(name, passed) {
  return Object.freeze({ name, passed: passed === true });
}

export function projectInventoryBridgeDryRunHandoffResult(fixture) {
  const dryRun = buildInventoryBridgeDryRunHandoffProjection(fixture.candidate, { configuration: fixture.configuration });
  const checks = Object.freeze([
    check('dry_run_status', dryRun.dry_run_status === fixture.expected.dry_run_status),
    check('dry_run_reason', dryRun.dry_run_reason === fixture.expected.dry_run_reason),
    check('ledger_candidate_status', dryRun.ledger_candidate_status === fixture.expected.candidate_status),
    check('contract_classification', dryRun.contract_classification === fixture.expected.contract_classification),
    check('shared_evidence_identity_key', dryRun.shared_evidence_identity_key === fixture.expected.evidence_identity_key),
    check('inventory_idempotency_key_shape', dryRun.inventory_idempotency_key.endsWith(fixture.expected.evidence_identity_key)),
    check('runtime_disabled', dryRun.runtime_enabled === false && dryRun.runtime_ready === false && dryRun.runtime_operational === false),
    check('no_transport', dryRun.transport_attempted === false),
    check('no_ingestion', dryRun.ingestion_attempted === false),
    check('no_outbox_processing', dryRun.outbox_processing_attempted === false),
    check('no_replay', dryRun.replay_attempted === false),
    check('no_inventory_call', dryRun.inventory_call_attempted === false),
    check('no_ledger_write', dryRun.ledger_write_attempted === false),
    check('no_receipt', dryRun.receipt_emitted === false),
    check('no_acknowledgement', dryRun.acknowledgement_emitted === false),
    check('no_mutation', dryRun.mutation_attempted === false && dryRun.mutating === false),
    check('not_ingestible', dryRun.ingestible === false),
    check('not_persistable', dryRun.persistable === false),
    check('not_writable', dryRun.writable === false),
    check('not_replayable', dryRun.replayable === false),
  ]);

  return Object.freeze({
    fixture_id: fixture.fixture_id,
    description: fixture.description,
    expected: fixture.expected,
    dry_run: dryRun,
    passed: checks.every((item) => item.passed),
    checks,
  });
}

export function getInventoryBridgeDryRunHandoffResults(fixtures = INVENTORY_BRIDGE_DRY_RUN_HANDOFF_FIXTURES) {
  return Object.freeze(fixtures.map(projectInventoryBridgeDryRunHandoffResult));
}
