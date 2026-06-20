import fs from 'node:fs';
import path from 'node:path';
import {
  assertNoInventoryBridgeRelayHandshakeEvidenceOperationalMutation,
  getInventoryBridgeRelayHandshakeEvidenceSafeSummary,
  projectInventoryBridgeRelayHandshakeEvidence,
  validateInventoryBridgeRelayHandshakeEvidence,
} from '../src/lib/inventory/bridgeRelayHandshakeEvidence.js';

const root = process.cwd();
const projectionPath = 'src/lib/inventory/bridgeRelayHandshakeEvidence.js';

const scanOpsCandidateAcceptance = Object.freeze({
  status: 'RELAY_ENFORCEMENT_CANDIDATE_ACCEPTED_PENDING_FUTURE_RELAY_ENFORCEMENT',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
  inventory_candidate_status: 'RELAY_ENFORCEMENT_CANDIDATE_PROJECTED_PENDING_ENFORCEMENT',
  scanops_preflight_phase: '1D-D-W',
  relay_readiness_preflight_accepted: true,
  relay_enforcement_candidate_accepted: true,
  relay_enforcement_allowed: false,
  relay_transport_allowed: false,
  event_transport_allowed: false,
  event_sync_allowed: false,
  event_ingestion_allowed: false,
  can_sync_events: false,
  can_start_relay_transport: false,
  can_enable_event_transport: false,
  can_call_inventory_ingestion: false,
  can_write_event_outbox: false,
  can_write_local_storage: false,
  relay_enforcement_still_required: true,
  ingestion_validation_still_required_per_event: true,
  evidence_projection_only: true,
  accepted_at: '2026-06-20T03:00:00.000Z',
});

const expectedScope = Object.freeze({
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
});

const guardrails = Object.freeze({
  inventory_relay_handshake_evidence_projection_only: true,
  local_validator_only: true,
  no_relay_enforcement: true,
  no_relay_transport: true,
  no_event_transport: true,
  no_event_sync: true,
  no_event_ingestion: true,
  no_process_inbound_call: true,
  no_entity_writes: true,
  no_device_registry_writes: true,
  no_inventory_sync_inbound_event_writes: true,
  no_inventory_sync_receipt_writes: true,
  no_inventory_bridge_device_writes: true,
  no_live_pairing: true,
  no_ui: true,
  no_sync_enablement: true,
  no_stock_mutation: true,
  no_price_mutation: true,
  no_pos_order_forecast_mutation: true,
  no_item_master_mutation: true,
  relay_enforcement_still_required: true,
  ingestion_validation_still_required_per_event: true,
  base44_cloud_relay_not_lan_bridge: true,
});

const forbiddenOperationalCalls = Object.freeze([
  { label: 'fetch', pattern: /\bfetch\s*\(/ },
  { label: 'processInboundScanOpsEvent', pattern: /processInboundScanOpsEvent\s*\(/ },
  { label: 'InventorySyncInboundEvent.create', pattern: /InventorySyncInboundEvent\s*\.\s*create\s*\(/ },
  { label: 'InventorySyncReceipt.create', pattern: /InventorySyncReceipt\s*\.\s*create\s*\(/ },
  { label: 'InventoryBridgeDevice.create/update/delete', pattern: /InventoryBridgeDevice\s*\.\s*(create|update|delete)\s*\(/ },
  { label: 'StockMovement.create', pattern: /StockMovement\s*\.\s*create\s*\(/ },
  { label: 'POSLineItem.create', pattern: /POSLineItem\s*\.\s*create\s*\(/ },
  { label: 'PurchaseOrder.create/update', pattern: /PurchaseOrder\s*\.\s*(create|update)\s*\(/ },
  { label: 'Wastage.create/update', pattern: /Wastage\s*\.\s*(create|update)\s*\(/ },
]);

function readRequired(relativePathname) {
  const filePath = path.join(root, relativePathname);
  if (!fs.existsSync(filePath)) throw new Error(`Missing required file: ${relativePathname}`);
  return fs.readFileSync(filePath, 'utf8');
}

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertSubset(actual, expected, label) {
  assert(actual && typeof actual === 'object', `${label}: expected object.`);
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (expectedValue && typeof expectedValue === 'object' && !Array.isArray(expectedValue)) {
      assertSubset(actualValue, expectedValue, `${label}.${key}`);
    } else {
      assertEqual(actualValue, expectedValue, `${label}.${key}`);
    }
  }
}

function assertNoForbiddenOperationalCalls() {
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-relay-handshake-evidence.mjs'));
  const projectionSource = stripComments(readRequired(projectionPath));

  for (const forbidden of forbiddenOperationalCalls) {
    assert(!forbidden.pattern.test(ownSource), `validator contains forbidden operational call: ${forbidden.label}`);
    assert(!forbidden.pattern.test(projectionSource), `${projectionPath} contains forbidden operational call: ${forbidden.label}`);
  }
}

function project(overrides = {}) {
  return projectInventoryBridgeRelayHandshakeEvidence(
    overrides.evidence ?? scanOpsCandidateAcceptance,
    overrides.expectedScope ?? expectedScope,
    { projected_at: '2026-06-20T04:00:00.000Z' }
  );
}

function assertProjected(result, label) {
  assertSubset(
    result,
    {
      ok: true,
      schema_version: '1.0.0',
      phase: '1D-D-Z',
      contract_version: '1.0.0',
      bridge_protocol_version: '1.0.0',
      code: 'INVENTORY_RELAY_HANDSHAKE_EVIDENCE_PROJECTED',
      status: 'RELAY_HANDSHAKE_EVIDENCE_CLOSED_PENDING_FUTURE_ENFORCEMENT',
      source_device_id: expectedScope.source_device_id,
      environment: expectedScope.environment,
      store_id: expectedScope.store_id,
      inventory_instance_id: expectedScope.inventory_instance_id,
      relay_instance_ref: expectedScope.relay_instance_ref,
      inventory_candidate_status: 'RELAY_ENFORCEMENT_CANDIDATE_PROJECTED_PENDING_ENFORCEMENT',
      scanops_preflight_phase: '1D-D-W',
      scanops_candidate_acceptance_status: 'RELAY_ENFORCEMENT_CANDIDATE_ACCEPTED_PENDING_FUTURE_RELAY_ENFORCEMENT',
      relay_readiness_preflight_accepted: true,
      relay_enforcement_candidate_accepted: true,
      handshake_evidence_closed: true,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      stock_mutation_allowed: false,
      price_mutation_allowed: false,
      pos_order_forecast_mutation_allowed: false,
      item_master_mutation_allowed: false,
      relay_enforcement_still_required: true,
      ingestion_validation_still_required_per_event: true,
      evidence_projection_only: true,
      scanops_candidate_accepted_at: '2026-06-20T03:00:00.000Z',
      projected_at: '2026-06-20T04:00:00.000Z',
      validation: { ok: true, code: 'RELAY_HANDSHAKE_EVIDENCE_VALID' },
      guardrails,
    },
    label
  );
}

function assertBlocked(evidence, expectedCode, label) {
  assertSubset(
    project({ evidence }),
    {
      ok: false,
      phase: '1D-D-Z',
      code: expectedCode,
      status: 'RELAY_HANDSHAKE_EVIDENCE_BLOCKED',
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      relay_enforcement_still_required: true,
      ingestion_validation_still_required_per_event: true,
      evidence_projection_only: true,
      guardrails,
    },
    label
  );
}

function main() {
  assertNoForbiddenOperationalCalls();

  const validation = validateInventoryBridgeRelayHandshakeEvidence(scanOpsCandidateAcceptance, expectedScope);
  assertSubset(validation, { ok: true, code: 'RELAY_HANDSHAKE_EVIDENCE_VALID' }, 'handshake evidence validation');

  const projected = project();
  assertProjected(projected, 'handshake evidence projection');

  const summary = getInventoryBridgeRelayHandshakeEvidenceSafeSummary(projected);
  assertSubset(
    summary,
    {
      ok: true,
      code: 'INVENTORY_RELAY_HANDSHAKE_EVIDENCE_PROJECTED',
      status: 'RELAY_HANDSHAKE_EVIDENCE_CLOSED_PENDING_FUTURE_ENFORCEMENT',
      phase: '1D-D-Z',
      source_device_id: expectedScope.source_device_id,
      environment: expectedScope.environment,
      store_id: expectedScope.store_id,
      inventory_instance_id: expectedScope.inventory_instance_id,
      relay_instance_ref: expectedScope.relay_instance_ref,
      handshake_evidence_closed: true,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      relay_enforcement_still_required: true,
      ingestion_validation_still_required_per_event: true,
      evidence_projection_only: true,
    },
    'safe summary'
  );

  assertBlocked({ ...scanOpsCandidateAcceptance, status: 'RELAY_ENFORCEMENT_CANDIDATE_REJECTED' }, 'RELAY_HANDSHAKE_STATUS_INVALID', 'invalid status blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, inventory_candidate_status: 'RELAY_ENFORCEMENT_CANDIDATE_BLOCKED' }, 'RELAY_HANDSHAKE_STATUS_INVALID', 'invalid inventory candidate status blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, source_device_id: 'SCANOPS-OTHER' }, 'RELAY_HANDSHAKE_DEVICE_MISMATCH', 'device mismatch blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, environment: 'TRAINING' }, 'RELAY_HANDSHAKE_ENVIRONMENT_MISMATCH', 'environment mismatch blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, store_id: 'STORE-OTHER' }, 'RELAY_HANDSHAKE_STORE_MISMATCH', 'store mismatch blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, inventory_instance_id: 'INV-OTHER' }, 'RELAY_HANDSHAKE_INSTANCE_MISMATCH', 'inventory instance mismatch blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, scanops_preflight_phase: '1D-D-V' }, 'RELAY_HANDSHAKE_PHASE_MISMATCH', 'phase mismatch blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, relay_enforcement_candidate_accepted: false }, 'RELAY_ENFORCEMENT_CANDIDATE_NOT_ACCEPTED', 'candidate not accepted blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, relay_enforcement_allowed: true }, 'RELAY_ENFORCEMENT_ALREADY_ALLOWED', 'relay enforcement allowed blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, relay_enforcement_still_required: false }, 'RELAY_ENFORCEMENT_ALREADY_ALLOWED', 'relay enforcement no longer required blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, relay_transport_allowed: true }, 'RELAY_TRANSPORT_ALREADY_ALLOWED', 'relay transport allowed blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, can_start_relay_transport: true }, 'RELAY_TRANSPORT_ALREADY_ALLOWED', 'can start relay transport blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, event_transport_allowed: true }, 'EVENT_TRANSPORT_ALREADY_ALLOWED', 'event transport allowed blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, event_sync_allowed: true }, 'EVENT_SYNC_ALREADY_ALLOWED', 'event sync allowed blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, can_sync_events: true }, 'EVENT_SYNC_ALREADY_ALLOWED', 'can sync events blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, event_ingestion_allowed: true }, 'EVENT_INGESTION_ALREADY_ALLOWED', 'event ingestion allowed blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, can_call_inventory_ingestion: true }, 'EVENT_INGESTION_ALREADY_ALLOWED', 'can call ingestion blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, can_write_event_outbox: true }, 'LOCAL_WRITE_ALREADY_ALLOWED', 'event outbox write allowed blocked');
  assertBlocked({ ...scanOpsCandidateAcceptance, can_write_local_storage: true }, 'LOCAL_WRITE_ALREADY_ALLOWED', 'local storage write allowed blocked');

  const mutationGuardrails = assertNoInventoryBridgeRelayHandshakeEvidenceOperationalMutation();
  assertSubset(mutationGuardrails, guardrails, 'mutation guardrails');

  console.log('Inventory relay handshake evidence validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory relay handshake evidence validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
