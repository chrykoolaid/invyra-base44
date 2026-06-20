import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const modulePaths = Object.freeze([
  'src/lib/inventory/bridgeDeviceRegistry.js',
]);
const registryModulePath = 'src/lib/inventory/bridgeDeviceRegistry.js';

const approvedReceipt = Object.freeze({
  bridge_protocol_version: '1.0.0',
  pairing_contract_version: '1.0.0',
  pairing_receipt_id: 'PAIRING-RECEIPT-APPROVED-001',
  pairing_ref: 'PAIR-REF-001',
  source_device_id: 'SCANOPS-DEVICE-001',
  device_status: 'TRUSTED',
  pairing_status: 'TRUSTED',
  result_code: 'DEVICE_TRUSTED',
  trusted: true,
  linked_device_ref: 'InventoryBridgeDevice:SCANOPS-DEVICE-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  reviewed_by: 'admin-001',
  reviewed_at: new Date().toISOString(),
  issued_at: new Date().toISOString(),
  schema_version: '1.0.0',
});

const sourceRequest = Object.freeze({
  source_device_id: 'SCANOPS-DEVICE-001',
  device_name: 'ScanOps Handheld 001',
  device_type: 'HANDHELD_SCANNER',
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
});

const guardrails = Object.freeze({
  approved_device_record_projection_only: true,
  local_validator_only: true,
  no_device_registry_writes: true,
  no_entity_writes: true,
  no_live_pairing: true,
  no_event_ingestion: true,
  no_relay_enforcement: true,
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-approved-device-record-projection.mjs'));
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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-device-projection-'));
  for (const modulePath of modulePaths) {
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(readRequired(modulePath)), 'utf8');
  }
  return tempRoot;
}

async function loadRegistry() {
  const tempRoot = materializeImportableModules();
  try {
    const registryUrl = pathToFileURL(path.join(tempRoot, toTempModulePath(registryModulePath))).href;
    const registry = await import(`${registryUrl}?validationRun=${Date.now()}`);
    assert(typeof registry.buildInventoryBridgeDeviceRecord === 'function', 'buildInventoryBridgeDeviceRecord must be exported.');
    assert(typeof registry.validateInventoryBridgeDeviceRecord === 'function', 'validateInventoryBridgeDeviceRecord must be exported.');
    assert(typeof registry.isInventoryBridgeDeviceTrusted === 'function', 'isInventoryBridgeDeviceTrusted must be exported.');
    return { registry, cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function validateApprovedReceiptForProjection(receipt, request) {
  if (!receipt || typeof receipt !== 'object') return { ok: false, code: 'APPROVED_RECEIPT_MISSING' };
  if (receipt.device_status !== 'TRUSTED') return { ok: false, code: 'APPROVED_RECEIPT_NOT_TRUSTED' };
  if (receipt.pairing_status !== 'TRUSTED') return { ok: false, code: 'APPROVED_RECEIPT_NOT_TRUSTED' };
  if (receipt.result_code !== 'DEVICE_TRUSTED') return { ok: false, code: 'APPROVED_RECEIPT_RESULT_MISMATCH' };
  if (receipt.trusted !== true) return { ok: false, code: 'APPROVED_RECEIPT_MUST_BE_TRUSTED' };
  if (!receipt.linked_device_ref) return { ok: false, code: 'APPROVED_RECEIPT_LINK_REQUIRED' };
  if (!receipt.reviewed_by || !receipt.reviewed_at) return { ok: false, code: 'APPROVED_RECEIPT_REVIEW_MISSING' };
  if (receipt.source_device_id !== request.source_device_id) return { ok: false, code: 'PAIRING_DEVICE_MISMATCH' };
  if (receipt.pairing_ref !== request.pairing_ref) return { ok: false, code: 'PAIRING_REF_MISMATCH' };
  if (receipt.environment !== request.environment) return { ok: false, code: 'PAIRING_ENVIRONMENT_MISMATCH' };
  if (receipt.store_id !== request.store_id) return { ok: false, code: 'PAIRING_STORE_MISMATCH' };
  if (receipt.inventory_instance_id !== request.inventory_instance_id) return { ok: false, code: 'PAIRING_INSTANCE_MISMATCH' };
  return { ok: true, code: 'APPROVED_RECEIPT_PROJECTABLE' };
}

function projectApprovedDeviceRecord(registry, receipt, request) {
  const receiptValidation = validateApprovedReceiptForProjection(receipt, request);
  if (!receiptValidation.ok) {
    return {
      ok: false,
      code: receiptValidation.code,
      receipt_validation: receiptValidation,
      record: null,
      guardrails,
    };
  }

  const record = registry.buildInventoryBridgeDeviceRecord({
    device_id: request.source_device_id,
    device_name: request.device_name,
    device_type: request.device_type,
    environment: request.environment,
    store_id: request.store_id,
    inventory_instance_id: request.inventory_instance_id,
    status: 'TRUSTED',
    trusted: true,
    pairing_method: request.pairing_method,
    pairing_ref: request.pairing_ref,
    paired_at: receipt.reviewed_at,
    paired_by: receipt.reviewed_by,
    created_at: receipt.reviewed_at,
    updated_at: receipt.reviewed_at,
  });

  const validation = registry.validateInventoryBridgeDeviceRecord(record);
  return {
    ok: validation.ok,
    code: validation.ok ? 'APPROVED_DEVICE_RECORD_PROJECTED' : 'APPROVED_DEVICE_RECORD_INVALID',
    receipt_validation: receiptValidation,
    record_validation: validation,
    record,
    trusted_check: registry.isInventoryBridgeDeviceTrusted(record, request.environment),
    guardrails,
  };
}

function assertProjected(result, label) {
  assertSubset(
    result,
    {
      ok: true,
      code: 'APPROVED_DEVICE_RECORD_PROJECTED',
      receipt_validation: { ok: true, code: 'APPROVED_RECEIPT_PROJECTABLE' },
      record_validation: { ok: true },
      trusted_check: true,
      guardrails,
    },
    label
  );
  assertEqual(result.record.device_id, sourceRequest.source_device_id, `${label}.device_id`);
  assertEqual(result.record.device_name, sourceRequest.device_name, `${label}.device_name`);
  assertEqual(result.record.device_type, sourceRequest.device_type, `${label}.device_type`);
  assertEqual(result.record.status, 'TRUSTED', `${label}.status`);
  assertEqual(result.record.trusted, true, `${label}.trusted`);
  assertEqual(result.record.environment, sourceRequest.environment, `${label}.environment`);
  assertEqual(result.record.store_id, sourceRequest.store_id, `${label}.store_id`);
  assertEqual(result.record.inventory_instance_id, sourceRequest.inventory_instance_id, `${label}.inventory_instance_id`);
  assertEqual(result.record.pairing_method, sourceRequest.pairing_method, `${label}.pairing_method`);
  assertEqual(result.record.pairing_ref, sourceRequest.pairing_ref, `${label}.pairing_ref`);
  assertEqual(result.record.paired_by, approvedReceipt.reviewed_by, `${label}.paired_by`);
  assertEqual(result.record.paired_at, approvedReceipt.reviewed_at, `${label}.paired_at`);
}

async function main() {
  assertNoForbiddenOperationalCalls();
  const { registry, cleanup } = await loadRegistry();

  try {
    const projected = projectApprovedDeviceRecord(registry, approvedReceipt, sourceRequest);
    assertProjected(projected, 'approved device record projection');

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, trusted: false }, sourceRequest),
      { ok: false, code: 'APPROVED_RECEIPT_MUST_BE_TRUSTED', record: null, guardrails },
      'untrusted receipt rejected'
    );

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, device_status: 'PENDING', pairing_status: 'PENDING_APPROVAL' }, sourceRequest),
      { ok: false, code: 'APPROVED_RECEIPT_NOT_TRUSTED', record: null, guardrails },
      'pending receipt rejected'
    );

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, linked_device_ref: null }, sourceRequest),
      { ok: false, code: 'APPROVED_RECEIPT_LINK_REQUIRED', record: null, guardrails },
      'missing linked device ref rejected'
    );

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, reviewed_by: null }, sourceRequest),
      { ok: false, code: 'APPROVED_RECEIPT_REVIEW_MISSING', record: null, guardrails },
      'missing reviewer rejected'
    );

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, pairing_ref: 'PAIR-OTHER' }, sourceRequest),
      { ok: false, code: 'PAIRING_REF_MISMATCH', record: null, guardrails },
      'pairing ref mismatch rejected'
    );

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, source_device_id: 'SCANOPS-OTHER' }, sourceRequest),
      { ok: false, code: 'PAIRING_DEVICE_MISMATCH', record: null, guardrails },
      'device mismatch rejected'
    );

    assertSubset(
      projectApprovedDeviceRecord(registry, { ...approvedReceipt, environment: 'TRAINING' }, sourceRequest),
      { ok: false, code: 'PAIRING_ENVIRONMENT_MISMATCH', record: null, guardrails },
      'environment mismatch rejected'
    );
  } finally {
    cleanup();
  }

  console.log('Inventory approved device record projection validation PASS');
}

main().catch((error) => {
  console.error('Inventory approved device record projection validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
