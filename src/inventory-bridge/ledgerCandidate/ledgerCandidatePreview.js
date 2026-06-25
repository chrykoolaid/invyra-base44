import {
  INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS,
  assessInventoryBridgeEventEnvelopeContract,
} from '../contracts/index.js';

export const INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE = '5B';
export const INVENTORY_BRIDGE_LEDGER_CANDIDATE_COMPONENT = 'inventory_bridge_disabled_ledger_candidate_preview';

export const INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES = Object.freeze({
  PREVIEW_DISABLED: 'PREVIEW_DISABLED',
  CONTRACT_REJECTED: 'CONTRACT_REJECTED',
  RUNTIME_DISABLED: 'RUNTIME_DISABLED',
});

export const INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS = Object.freeze({
  CONTRACT_REJECTED: 'contract_rejected_before_ledger_candidate',
  RUNTIME_DISABLED: 'runtime_disabled_before_ledger_candidate',
  LEDGER_PREVIEW_DISABLED: 'ledger_candidate_preview_disabled_non_persistable',
});

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeSegment(value, fallback = 'none') {
  const normalized = asTrimmedString(value)
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

function freezeIssues(issues = []) {
  return Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
}

export function getInventoryBridgeLedgerCandidateReason(contractAssessment) {
  if (contractAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_RUNTIME_DISABLED) {
    return INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS.RUNTIME_DISABLED;
  }

  if (contractAssessment.classification !== INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE) {
    return INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS.CONTRACT_REJECTED;
  }

  return INVENTORY_BRIDGE_LEDGER_CANDIDATE_REASONS.LEDGER_PREVIEW_DISABLED;
}

export function getInventoryBridgeLedgerCandidateStatus(contractAssessment) {
  if (contractAssessment.classification === INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.REJECTED_RUNTIME_DISABLED) {
    return INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES.RUNTIME_DISABLED;
  }

  if (contractAssessment.classification !== INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS.ACCEPTABLE_SHAPE) {
    return INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES.CONTRACT_REJECTED;
  }

  return INVENTORY_BRIDGE_LEDGER_CANDIDATE_STATUSES.PREVIEW_DISABLED;
}

export function getInventoryBridgeLedgerCandidateIdempotencyKey(contractAssessment) {
  const normalized = contractAssessment.normalized || {};
  const source = normalized.source || {};

  return [
    'inventory-bridge-ledger-candidate',
    safeSegment(normalized.schema_version),
    safeSegment(normalized.event_type),
    safeSegment(normalized.event_id),
    safeSegment(source.system),
    safeSegment(source.device_id),
    safeSegment(source.store_id),
  ].join(':');
}

export function buildInventoryBridgeLedgerCandidatePreview(candidate = {}, options = {}) {
  const contractAssessment = options.contractAssessment || assessInventoryBridgeEventEnvelopeContract(candidate, options);
  const normalized = contractAssessment.normalized || {};
  const source = normalized.source || {};
  const runtimeStatus = contractAssessment.runtime_status || {};
  const idempotencyKey = getInventoryBridgeLedgerCandidateIdempotencyKey(contractAssessment);
  const candidateReason = getInventoryBridgeLedgerCandidateReason(contractAssessment);
  const candidateStatus = getInventoryBridgeLedgerCandidateStatus(contractAssessment);

  return Object.freeze({
    component: INVENTORY_BRIDGE_LEDGER_CANDIDATE_COMPONENT,
    phase: INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE,
    candidate_preview_id: `preview:${idempotencyKey}`,
    candidate_status: candidateStatus,
    candidate_reason: candidateReason,
    schema_version: normalized.schema_version || null,
    event_type: normalized.event_type || null,
    event_id: normalized.event_id || null,
    occurred_at: normalized.occurred_at || null,
    source_system: source.system || null,
    source_device_id: source.device_id || null,
    source_store_id: source.store_id || null,
    source_session_id: source.session_id || null,
    idempotency_key: idempotencyKey,
    runtime_state: runtimeStatus.state || 'DISABLED',
    runtime_enabled: false,
    runtime_ready: false,
    runtime_operational: false,
    contract_classification: contractAssessment.classification,
    contract_accepted: false,
    contract_ingestible: false,
    contract_writable: false,
    contract_issues: freezeIssues(contractAssessment.issues),
    ledger_writable: false,
    ingestible: false,
    persistable: false,
    writable: false,
    replayable: false,
    acknowledgement_emittable: false,
    receipt_emittable: false,
    mutating: false,
  });
}
