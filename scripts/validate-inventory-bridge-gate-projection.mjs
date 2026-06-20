import fs from 'node:fs';
import path from 'node:path';
import {
  assertNoInventoryBridgeGateOperationalMutation,
  getInventoryBridgeGateSafeSummary,
  projectInventoryBridgeGate,
  validateInventoryBridgeGateInput,
} from '../src/lib/inventory/bridgeGateProjection.js';

const root = process.cwd();
const projectionPath = 'src/lib/inventory/bridgeGateProjection.js';

const handshakeEvidence = Object.freeze({
  ok: true,
  schema_version: '1.0.0',
  phase: '1D-D-Z',
  contract_version: '1.0.0',
  bridge_protocol_version: '1.0.0',
  code: 'INVENTORY_RELAY_HANDSHAKE_EVIDENCE_PROJECTED',
  status: 'RELAY_HANDSHAKE_EVIDENCE_CLOSED_PENDING_FUTURE_ENFORCEMENT',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
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
  projected_at: '2026-06-20T04:00:00.000Z',
});

const expectedScope = Object.freeze({
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
});

const guardrails = Object.freeze({
  inventory_bridge_gate_projection_only: true,
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
  explicit_future_enforcement_phase_required: true,
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-gate-projection.mjs'));
  const projectionSource = stripComments(readRequired(projectionPath));

  for (const forbidden of forbiddenOperationalCalls) {
    assert(!forbidden.pattern.test(ownSource), `validator contains forbidden operational call: ${forbidden.label}`);
    assert(!forbidden.pattern.test(projectionSource), `${projectionPath} contains forbidden operational call: ${forbidden.label}`);
  }
}

function project(overrides = {}) {
  return projectInventoryBridgeGate(
    overrides.handshake ?? handshakeEvidence,
    overrides.expectedScope ?? expectedScope,
    { projected_at: '2026-06-20T06:00:00.000Z' }
  );
}

function assertProjected(result, label) {
  assertSubset(
    result,
    {
      ok: true,
      schema_version: '1.0.0',
      phase: '1D-D-AB',
      contract_version: '1.0.0',
      bridge_protocol_version: '1.0.0',
      code: 'INVENTORY_BRIDGE_GATE_PROJECTED',
      status: 'BRIDGE_GATE_LOCKED_PENDING_EXPLICIT_ENFORCEMENT',
      source_device_id: expectedScope.source_device_id,
      environment: expectedScope.environment,
      store_id: expectedScope.store_id,
      inventory_instance_id: expectedScope.inventory_instance_id,
      relay_instance_ref: expectedScope.relay_instance_ref,
      source_handshake_phase: '1D-D-Z',
      source_handshake_status: 'RELAY_HANDSHAKE_EVIDENCE_CLOSED_PENDING_FUTURE_ENFORCEMENT',
      handshake_evidence_closed: true,
      bridge_gate_locked: true,
      explicit_future_enforcement_phase_required: true,
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
      ingestion_validation_still_required_per_event: true,
      evidence_projection_only: true,
      projected_at: '2026-06-20T06:00:00.000Z',
      validation: { ok: true, code: 'BRIDGE_GATE_INPUT_VALID' },
      guardrails,
    },
    label
  );
}

function assertBlocked(handshake, expectedCode, label) {
  assertSubset(
    project({ handshake }),
    {
      ok: false,
      phase: '1D-D-AB',
      code: expectedCode,
      status: 'BRIDGE_GATE_BLOCKED',
      bridge_gate_locked: true,
      explicit_future_enforcement_phase_required: true,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      guardrails,
    },
    label
  );
}

function main() {
  assertNoForbiddenOperationalCalls();

  const validation = validateInventoryBridgeGateInput(handshakeEvidence, expectedScope);
  assertSubset(validation, { ok: true, code: 'BRIDGE_GATE_INPUT_VALID' }, 'gate input validation');

  const projected = project();
  assertProjected(projected, 'bridge gate projection');

  const summary = getInventoryBridgeGateSafeSummary(projected);
  assertSubset(
    summary,
    {
      ok: true,
      code: 'INVENTORY_BRIDGE_GATE_PROJECTED',
      status: 'BRIDGE_GATE_LOCKED_PENDING_EXPLICIT_ENFORCEMENT',
      phase: '1D-D-AB',
      source_device_id: expectedScope.source_device_id,
      environment: expectedScope.environment,
      store_id: expectedScope.store_id,
      inventory_instance_id: expectedScope.inventory_instance_id,
      bridge_gate_locked: true,
      explicit_future_enforcement_phase_required: true,
      relay_enforcement_allowed: false,
      relay_transport_allowed: false,
      event_transport_allowed: false,
      event_sync_allowed: false,
      event_ingestion_allowed: false,
      inventory_mutation_allowed: false,
      evidence_projection_only: true,
    },
    'safe summary'
  );

  assertBlocked({ ...handshakeEvidence, phase: '1D-D-Y' }, 'BRIDGE_HANDSHAKE_PHASE_MISMATCH', 'phase mismatch blocked');
  assertBlocked({ ...handshakeEvidence, code: 'WRONG' }, 'BRIDGE_HANDSHAKE_NOT_CLOSED', 'wrong code blocked');
  assertBlocked({ ...handshakeEvidence, status: 'RELAY_HANDSHAKE_EVIDENCE_BLOCKED' }, 'BRIDGE_HANDSHAKE_NOT_CLOSED', 'wrong status blocked');
  assertBlocked({ ...handshakeEvidence, handshake_evidence_closed: false }, 'BRIDGE_HANDSHAKE_NOT_CLOSED', 'not closed blocked');
  assertBlocked({ ...handshakeEvidence, source_device_id: 'SCANOPS-OTHER' }, 'BRIDGE_GATE_DEVICE_MISMATCH', 'device mismatch blocked');
  assertBlocked({ ...handshakeEvidence, environment: 'TRAINING' }, 'BRIDGE_GATE_ENVIRONMENT_MISMATCH', 'environment mismatch blocked');
  assertBlocked({ ...handshakeEvidence, store_id: 'STORE-OTHER' }, 'BRIDGE_GATE_STORE_MISMATCH', 'store mismatch blocked');
  assertBlocked({ ...handshakeEvidence, inventory_instance_id: 'INV-OTHER' }, 'BRIDGE_GATE_INSTANCE_MISMATCH', 'instance mismatch blocked');
  assertBlocked({ ...handshakeEvidence, relay_enforcement_allowed: true }, 'RELAY_ENFORCEMENT_ALREADY_ENABLED', 'relay enforcement enabled blocked');
  assertBlocked({ ...handshakeEvidence, relay_enforcement_still_required: false }, 'RELAY_ENFORCEMENT_ALREADY_ENABLED', 'relay enforcement no longer required blocked');
  assertBlocked({ ...handshakeEvidence, relay_transport_allowed: true }, 'RELAY_TRANSPORT_ALREADY_ENABLED', 'relay transport enabled blocked');
  assertBlocked({ ...handshakeEvidence, event_transport_allowed: true }, 'EVENT_TRANSPORT_ALREADY_ENABLED', 'event transport enabled blocked');
  assertBlocked({ ...handshakeEvidence, event_sync_allowed: true }, 'EVENT_SYNC_ALREADY_ENABLED', 'event sync enabled blocked');
  assertBlocked({ ...handshakeEvidence, event_ingestion_allowed: true }, 'EVENT_INGESTION_ALREADY_ENABLED', 'event ingestion enabled blocked');
  assertBlocked({ ...handshakeEvidence, inventory_mutation_allowed: true }, 'INVENTORY_MUTATION_ALREADY_ALLOWED', 'inventory mutation allowed blocked');

  const mutationGuardrails = assertNoInventoryBridgeGateOperationalMutation();
  assertSubset(mutationGuardrails, guardrails, 'mutation guardrails');

  console.log('Inventory bridge gate projection validation PASS');
}

try {
  main();
} catch (error) {
  console.error('Inventory bridge gate projection validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
