import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const modulePaths = Object.freeze([
  'src/lib/inventory/bridgeDeviceRegistry.js',
  'src/lib/inventory/bridgeRelayAdmissionEvidence.js',
]);
const evidenceModulePath = 'src/lib/inventory/bridgeRelayAdmissionEvidence.js';

const trustedDeviceRecord = Object.freeze({
  schema_version: '1.0.0',
  device_id: 'SCANOPS-DEVICE-001',
  device_name: 'ScanOps Handheld 001',
  device_type: 'HANDHELD_SCANNER',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  status: 'TRUSTED',
  trusted: true,
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  pairing_token_hash: null,
  pairing_token_expires_at: null,
  paired_at: new Date().toISOString(),
  paired_by: 'admin-001',
  last_seen_at: null,
  last_seen_source_ip: null,
  revoked_at: null,
  revoked_by: null,
  revoked_reason: null,
  blocked_at: null,
  blocked_by: null,
  blocked_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const relayContext = Object.freeze({
  source_system: 'scanops',
  source_device_id: 'SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  bridge_protocol_version: '1.0.0',
  pairing_contract_version: '1.0.0',
  relay_instance_ref: 'BASE44-CLOUD-RELAY-PROTOTYPE',
});

const guardrails = Object.freeze({
  relay_admission_evidence_projection_only: true,
  local_validator_only: true,
  no_relay_enforcement: true,
  no_relay_transport: true,
  no_event_transport: true,
  no_event_ingestion: true,
  no_process_inbound_call: true,
  no_entity_writes: true,
  no_device_registry_writes: true,
  no_inventory_sync_inbound_event_writes: true,
  no_inventory_sync_receipt_writes: true,
  no_live_pairing: true,
  no_ui: true,
  no_sync_enablement: true,
  no_stock_mutation: true,
  no_price_mutation: true,
  no_pos_order_forecast_mutation: true,
  no_item_master_mutation: true,
  ingestion_validation_still_required_per_event: true,
  base44_cloud_relay_not_lan_bridge: true,
});

const forbiddenOperationalCalls = Object.freeze([
  { label: 'fetch', pattern: /\bfetch\s*\(/ },
  { label: 'processInboundScanOpsEvent', pattern: /processInboundScanOpsEvent\s*\(/ },
  { label: 'InventorySyncInboundEvent.create', pattern: /InventorySyncInboundEvent\s*\.\s*create\s*\(/ },
  { label: 'InventorySyncReceipt.create', pattern: /InventorySyncReceipt\s*\.\s*create\s*\(/ },
  { label: 'MarkdownSyncReviewQueue.create', pattern: /MarkdownSyncReviewQueue\s*\.\s*create\s*\(/ },
  { label: 'InventoryBridgeDevice.create/update/delete', pattern: /InventoryBridgeDevice\s*\.\s*(create|update|delete)\s*\(/ },
  { label: 'StockMovement.create', pattern: /StockMovement\s*\.\s*create\s*\(/ },
  { label: 'POSLineItem.create', pattern: /POSLineItem\s*\.\s*create\s*\(/ },
]);

function readRequired(relativePathname) {
  const filePath = path.join(root, relativePathname);
  if (!fs.existsSync(filePath)) throw new Error(`Missing required file: ${relativePathname}`);
  return fs.readFileSync(filePath, 'utf8');
}

function toTempModulePath(relativePathname) {
  return relativePathname.replace(/\.js$/, '.mjs');
}

function rewriteRelativeImports(content) {
  return content.replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (_, prefix, specifier, suffix) => {
    if (path.extname(specifier)) return `${prefix}${specifier.replace(/\.js$/, '.mjs')}${suffix}`;
    return `${prefix}${specifier}.mjs${suffix}`;
  });
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-relay-admission-evidence-projection.mjs'));
  for (const forbidden of forbiddenOperationalCalls) {
    assert(!forbidden.pattern.test(ownSource), `validator contains forbidden operational call: ${forbidden.label}`);
  }

  for (const modulePath of modulePaths) {
    const source = stripComments(readRequired(modulePath));
    for (const forbidden of forbiddenOperationalCalls) {
      assert(!forbidden.pattern.test(source), `${modulePath} contains forbidden operational call: ${forbidden.label}`);
    }
  }
}

function materializeImportableModules() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-relay-admission-evidence-'));
  for (const modulePath of modulePaths) {
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(readRequired(modulePath)), 'utf8');
  }
  return tempRoot;
}

async function loadEvidenceModule() {
  const tempRoot = materializeImportableModules();
  try {
    const evidenceUrl = pathToFileURL(path.join(tempRoot, toTempModulePath(evidenceModulePath))).href;
    const evidenceModule = await import(`${evidenceUrl}?validationRun=${Date.now()}`);
    assert(typeof evidenceModule.projectInventoryBridgeRelayAdmissionEvidence === 'function', 'projectInventoryBridgeRelayAdmissionEvidence must be exported.');
    assert(typeof evidenceModule.validateInventoryBridgeRelayAdmissionContext === 'function', 'validateInventoryBridgeRelayAdmissionContext must be exported.');
    assert(typeof evidenceModule.getInventoryBridgeRelayAdmissionEvidenceSafeSummary === 'function', 'getInventoryBridgeRelayAdmissionEvidenceSafeSummary must be exported.');
    assert(typeof evidenceModule.assertNoInventoryBridgeRelayAdmissionEvidenceOperationalMutation === 'function', 'assertNoInventoryBridgeRelayAdmissionEvidenceOperationalMutation must be exported.');
    return { evidenceModule, cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function assertProjected(result, label) {
  assertSubset(
    result,
    {
      ok: true,
      code: 'RELAY_ADMISSION_EVIDENCE_PROJECTED',
      allowed_for_bridge_transport: true,
      context_validation: { ok: true, code: 'RELAY_ADMISSION_CONTEXT_VALID' },
      access: { allowed: true, decision_code: 'DEVICE_TRUSTED' },
      evidence: {
        phase: '1D-D-U',
        source_system: relayContext.source_system,
        source_device_id: relayContext.source_device_id,
        environment: relayContext.environment,
        store_id: relayContext.store_id,
        inventory_instance_id: relayContext.inventory_instance_id,
        relay_instance_ref: relayContext.relay_instance_ref,
        relay_decision_code: 'DEVICE_TRUSTED',
        allowed_for_bridge_transport: true,
        relay_enforcement_applied: false,
        relay_transport_started: false,
        event_transport_enabled: false,
        event_ingestion_allowed: false,
        ingestion_validation_still_required_per_event: true,
        inventory_mutation_allowed: false,
        stock_mutation_allowed: false,
        price_mutation_allowed: false,
        pos_order_forecast_mutation_allowed: false,
        item_master_mutation_allowed: false,
        evidence_projection_only: true,
      },
      guardrails,
    },
    label
  );
  assert(result.evidence.projected_at, `${label}.projected_at required`);
  assertEqual(result.evidence.device_summary.device_id, trustedDeviceRecord.device_id, `${label}.device_summary.device_id`);
}

async function main() {
  assertNoForbiddenOperationalCalls();
  const { evidenceModule, cleanup } = await loadEvidenceModule();

  try {
    const projected = evidenceModule.projectInventoryBridgeRelayAdmissionEvidence(trustedDeviceRecord, relayContext, {
      projected_at: '2026-06-20T00:00:00.000Z',
    });
    assertProjected(projected, 'relay admission evidence projection');

    const summary = evidenceModule.getInventoryBridgeRelayAdmissionEvidenceSafeSummary(projected.evidence);
    assertSubset(
      summary,
      {
        phase: '1D-D-U',
        source_device_id: relayContext.source_device_id,
        relay_decision_code: 'DEVICE_TRUSTED',
        allowed_for_bridge_transport: true,
        relay_enforcement_applied: false,
        relay_transport_started: false,
        event_transport_enabled: false,
        event_ingestion_allowed: false,
        ingestion_validation_still_required_per_event: true,
        evidence_projection_only: true,
      },
      'safe summary'
    );

    assertSubset(
      evidenceModule.projectInventoryBridgeRelayAdmissionEvidence(null, relayContext),
      { ok: false, code: 'DEVICE_UNKNOWN', allowed_for_bridge_transport: false, guardrails },
      'unknown device denied without enforcement'
    );

    assertSubset(
      evidenceModule.projectInventoryBridgeRelayAdmissionEvidence(trustedDeviceRecord, { ...relayContext, source_device_id: null }),
      { ok: false, code: 'RELAY_ADMISSION_CONTEXT_INVALID', allowed_for_bridge_transport: false, evidence: null, guardrails },
      'missing source identity rejected by context validation'
    );

    assertSubset(
      evidenceModule.projectInventoryBridgeRelayAdmissionEvidence({ ...trustedDeviceRecord, status: 'PENDING', trusted: false, paired_at: null }, relayContext),
      { ok: false, code: 'DEVICE_PENDING_APPROVAL', allowed_for_bridge_transport: false, guardrails },
      'pending device denied without enforcement'
    );

    assertSubset(
      evidenceModule.projectInventoryBridgeRelayAdmissionEvidence({ ...trustedDeviceRecord, environment: 'TRAINING' }, relayContext),
      { ok: false, code: 'ENVIRONMENT_MISMATCH', allowed_for_bridge_transport: false, guardrails },
      'environment mismatch denied without enforcement'
    );

    assertSubset(
      evidenceModule.projectInventoryBridgeRelayAdmissionEvidence({ ...trustedDeviceRecord, status: 'REVOKED', trusted: false, revoked_at: new Date().toISOString() }, relayContext),
      { ok: false, code: 'DEVICE_REVOKED', allowed_for_bridge_transport: false, guardrails },
      'revoked device denied without enforcement'
    );

    assertSubset(
      evidenceModule.projectInventoryBridgeRelayAdmissionEvidence(trustedDeviceRecord, { ...relayContext, bridge_protocol_version: '9.9.9' }),
      { ok: false, code: 'RELAY_ADMISSION_CONTEXT_INVALID', allowed_for_bridge_transport: false, evidence: null, guardrails },
      'protocol mismatch rejected by context validation'
    );

    const mutationGuardrails = evidenceModule.assertNoInventoryBridgeRelayAdmissionEvidenceOperationalMutation();
    assertSubset(mutationGuardrails, guardrails, 'mutation guardrails');
  } finally {
    cleanup();
  }

  console.log('Inventory relay admission evidence projection validation PASS');
}

main().catch((error) => {
  console.error('Inventory relay admission evidence projection validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
