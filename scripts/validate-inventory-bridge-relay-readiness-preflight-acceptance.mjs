import fs from 'node:fs';
import path from 'node:path';
import {
  acceptInventoryBridgeRelayReadinessPreflightProjection,
  assertNoInventoryBridgeRelayReadinessPreflightAcceptanceOperationalMutation,
  getInventoryBridgeRelayReadinessPreflightAcceptanceSafeSummary,
  validateInventoryBridgeRelayReadinessPreflightProjection,
} from '../src/lib/inventory/bridgeRelayReadinessPreflightAcceptance.js';

const root = process.cwd();
const acceptancePath = 'src/lib/inventory/bridgeRelayReadinessPreflightAcceptance.js';

const scanOpsReadinessPreflight = Object.freeze({
  ok: true,
  schema_version: '1.0.0',
  phase: '1D-D-W',
  contract_version: '1.0.0',
  bridge_protocol_version: '1.0.0',
  code: 'SCANOPS_RELAY_READINESS_PREFLIGHT_PROJECTED',
  status: 'READY_PENDING_RELAY_ENFORCEMENT',
  blockers: [],
  source_system: 'scanops',
  source_device_id: 'SCANOPS-DEVICE-001',
  device_name: 'ScanOps Handheld 001',
  device_type: 'HANDHELD_SCANNER',
  app_instance_id: 'SCANOPS-APP-INSTANCE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  inventory_device_ref: 'InventoryBridgeDevice:SCANOPS-DEVICE-001',
  pairing_receipt_id: 'PAIRING-RECEIPT-APPROVED-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
  local_trusted_state_present: true,
  trusted_receipt_present: true,
  relay_admission_evidence_present: true,
  relay_admission_evidence_accepted: true,
  relay_admission_state: 'RELAY_ADMISSION_EVIDENCE_ACCEPTED_PENDING_ENFORCEMENT',
  local_pairing_state: 'READY_FOR_BRIDGE_TRANSPORT_PENDING_RELAY',
  trusted_for_transport_contract: true,
  can_start_relay_transport: false,
  can_enable_event_transport: false,
  can_sync_events: false,
  can_call_inventory_ingestion: false,
  can_write_event_outbox: false,
  can_write_local_storage: false,
  can_mutate_inventory: false,
  can_mutate_stock: false,
  can_mutate_prices: false,
  can_mutate_pos_orders_forecast: false,
  can_mutate_item_master: false,
  relay_enforcement_still_required: true,
  relay_transport_started: false,
  event_transport_enabled: false,
  event_ingestion_allowed: false,
  ingestion_validation_still_required_per_event: true,
  evidence_projection_only: true,
  projected_at: '2026-06-20T01:00:00.000Z',
});

const expectedScope = Object.freeze({
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
});

const guardrails = Object.freeze({
  inventory_relay_readiness_preflight_acceptance_projection_only: true,
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-relay-readiness-preflight-acceptance.mjs'));
  const acceptanceSource = stripComments(readRequired(acceptancePath));

  for (const forbidden of forbiddenOperationalCalls) {
    assert(!forbidden.pattern.test(ownSource), `validator contains forbidden operational call: ${forbidden.label}`);
    assert(!forbidden.pattern.test(acceptanceSource), `${acceptancePath} contains forbidden operational call: ${forbidden.label}`);
  }
}

function accept(overrides = {}) {
  return acceptInventoryBridgeRelayReadinessPreflightProjection(
    overrides.preflight ?? scanOpsReadinessPreflight,
    overrides.expectedScope ?? expectedScope,
    { accepted_at: '2026-06-20T02:00:00.000Z' }
  );
}

function assertAccepted(result, label) {
  assertSubset(
    result,
    {
      ok: true,
      code: 'INVENTORY_RELAY_READINESS_PREFLIGHT_ACCEPTED',
      validation: { ok: true, code: 'RELAY_READINESS_PREFLIGHT_VALID' },
      enforcement_candidate: {
        status: 'RELAY_ENFORCEMENT_CANDIDATE_PROJECTED_PENDING_ENFORCEMENT',
        source_device_id: expectedScope.source_device_id,
        environment: expectedScope.environment,
        store_id: expectedScope.store_id,
        inventory_instance_id: expectedScope.inventory_instance_id,
        relay_instance_ref: expectedScope.relay_instance_ref,
        scanops_preflight_phase: '1D-D-W',
        relay_readiness_preflight_accepted: true,
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
        accepted_at: '2026-06-20T02:00:00.000Z',
      },
      guardrails,
    },
    label
  );
}

function assertRejected(preflight, expectedCode, label) {
  assertSubset(
    accept({ preflight }),
    {
      ok: false,
      code: expectedCode,
      enforcement_candidate: {
        status: 'RELAY_ENFORCEMENT_CANDIDATE_BLOCKED',
        relay_enforcement_allowed: false,
        relay_transport_allowed: false,
        event_transport_allowed: false,
        event_sync_allowed: false,
        event_ingestion_allowed: false,
        inventory_mutation_allowed: false,
      },
      guardrails,
    },
    label
  );
}

function main() {
  assertNoForbiddenOperationalCalls();

  const validation = validateInventoryBridgeRelayReadinessPreflightProjection(scanOpsReadinessPreflight, expectedScope);
  assertSubset(validation, { ok: true, code: 'RELAY_READINESS_PREFLIGHT_VALID' }, 'preflight validation');

  const accepted = accept();
  assertAccepted(accepted, 'preflight acceptance');

  const summary = getInventoryBridgeRelayReadinessPreflightAcceptanceSafeSummary(accepted);
  assertSubset(
    summary,
    {
      ok: true,
      code: 'INVENTORY_RELAY_READINESS_PREFLIGHT_ACCEPTED',
      candidate_status: 'RELAY_ENFORCEMENT_CANDIDATE_PROJECTED_PENDING_ENFORCEMENT',
      source_device_id: expectedScope.source_device_id,
      environment: expectedScope.environment,
      store_id: expectedScope.store_id,
      inventory_instance_id: expectedScope.inventory_instance_id,
      relay_instance_ref: expectedScope.relay_instance_ref,
      scanops_preflight_phase: '1D-D-W',
      relay_readiness_preflight_accepted: true,
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

  assertRejected({ ...scanOpsReadinessPreflight, source_device_id: 'SCANOPS-OTHER' }, 'RELAY_READINESS_DEVICE_MISMATCH', 'device mismatch rejected');
  assertRejected({ ...scanOpsReadinessPreflight, environment: 'TRAINING' }, 'RELAY_READINESS_ENVIRONMENT_MISMATCH', 'environment mismatch rejected');
  assertRejected({ ...scanOpsReadinessPreflight, store_id: 'STORE-OTHER' }, 'RELAY_READINESS_STORE_MISMATCH', 'store mismatch rejected');
  assertRejected({ ...scanOpsReadinessPreflight, inventory_instance_id: 'INV-OTHER' }, 'RELAY_READINESS_INSTANCE_MISMATCH', 'inventory instance mismatch rejected');
  assertRejected({ ...scanOpsReadinessPreflight, bridge_protocol_version: '9.9.9' }, 'RELAY_READINESS_PROTOCOL_MISMATCH', 'protocol mismatch rejected');
  assertRejected({ ...scanOpsReadinessPreflight, code: 'SCANOPS_RELAY_READINESS_PREFLIGHT_BLOCKED' }, 'RELAY_READINESS_PREFLIGHT_NOT_READY', 'not ready code rejected');
  assertRejected({ ...scanOpsReadinessPreflight, status: 'BLOCKED' }, 'RELAY_READINESS_STATUS_NOT_READY', 'blocked status rejected');
  assertRejected({ ...scanOpsReadinessPreflight, relay_admission_evidence_accepted: false }, 'RELAY_READINESS_PREFLIGHT_NOT_READY', 'unaccepted relay evidence rejected');
  assertRejected({ ...scanOpsReadinessPreflight, relay_enforcement_still_required: false }, 'RELAY_ENFORCEMENT_ALREADY_ENABLED', 'relay enforcement already enabled rejected');
  assertRejected({ ...scanOpsReadinessPreflight, can_start_relay_transport: true }, 'RELAY_TRANSPORT_ALREADY_ENABLED', 'relay transport allowed rejected');
  assertRejected({ ...scanOpsReadinessPreflight, can_enable_event_transport: true }, 'EVENT_TRANSPORT_ALREADY_ENABLED', 'event transport allowed rejected');
  assertRejected({ ...scanOpsReadinessPreflight, can_sync_events: true }, 'EVENT_SYNC_ALREADY_ENABLED', 'event sync allowed rejected');
  assertRejected({ ...scanOpsReadinessPreflight, can_call_inventory_ingestion: true }, 'EVENT_INGESTION_ALREADY_ALLOWED', 'ingestion allowed rejected');
  assertRejected({ ...scanOpsReadinessPreflight, event_ingestion_allowed: true }, 'EVENT_INGESTION_ALREADY_ALLOWED', 'event ingestion allowed rejected');

  const mutationGuardrails = assertNoInventoryBridgeRelayReadinessPreflightAcceptanceOperationalMutation();
  assertSubset(mutationGuardrails, guardrails, 'mutation guardrails');

  console.log('Inventory relay readiness preflight acceptance validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory relay readiness preflight acceptance validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
