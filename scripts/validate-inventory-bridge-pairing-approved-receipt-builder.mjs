import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const modulePaths = Object.freeze([
  'src/lib/inventory/bridgePairingContracts.js',
  'src/lib/inventory/bridgeDeviceRegistry.js',
]);
const contractModulePath = 'src/lib/inventory/bridgePairingContracts.js';

const pendingReceipt = Object.freeze({
  bridge_protocol_version: '1.0.0',
  pairing_contract_version: '1.0.0',
  pairing_receipt_id: 'PAIRING-RECEIPT-001',
  pairing_ref: 'PAIR-REF-001',
  source_device_id: 'SCANOPS-DEVICE-001',
  device_status: 'PENDING',
  pairing_status: 'PENDING_APPROVAL',
  result_code: 'DEVICE_PENDING_APPROVAL',
  decision_message: 'Device pairing is pending Inventory approval.',
  trusted: false,
  linked_device_ref: null,
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  reviewed_by: null,
  reviewed_at: null,
  issued_at: new Date(Date.now() - 60 * 1000).toISOString(),
  schema_version: '1.0.0',
});

const request = Object.freeze({
  source_device_id: 'SCANOPS-DEVICE-001',
  device_name: 'ScanOps Handheld 001',
  device_type: 'HANDHELD_SCANNER',
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
});

const adminReviewer = Object.freeze({ id: 'admin-001', role: 'Admin' });
const ownerReviewer = Object.freeze({ id: 'owner-001', role: 'Owner' });
const allowedRoles = Object.freeze(['Admin', 'Owner']);

const guardrails = Object.freeze({
  approved_receipt_contract_only: true,
  local_validator_only: true,
  no_live_pairing: true,
  no_device_registry_writes: true,
  no_entity_writes: true,
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
  if (actual !== expected) throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-pairing-approved-receipt-builder.mjs'));
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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-approved-receipt-'));
  for (const modulePath of modulePaths) {
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(readRequired(modulePath)), 'utf8');
  }
  return tempRoot;
}

async function loadModules() {
  const tempRoot = materializeImportableModules();
  try {
    const contractsUrl = pathToFileURL(path.join(tempRoot, toTempModulePath(contractModulePath))).href;
    const contracts = await import(`${contractsUrl}?validationRun=${Date.now()}`);
    assert(typeof contracts.buildInventoryBridgePairingReceipt === 'function', 'buildInventoryBridgePairingReceipt must be exported.');
    assert(typeof contracts.getInventoryBridgePairingReceiptSafeSummary === 'function', 'getInventoryBridgePairingReceiptSafeSummary must be exported.');
    return { contracts, cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function roleOf(actor = {}) {
  return actor.role || actor.user_role || actor.permission_role || actor.account_role || null;
}

function validatePendingReceiptForApproval(receipt, sourceRequest) {
  if (!receipt || typeof receipt !== 'object') return { ok: false, code: 'PENDING_RECEIPT_MISSING' };
  if (receipt.device_status !== 'PENDING') return { ok: false, code: 'PENDING_RECEIPT_NOT_PENDING' };
  if (receipt.pairing_status !== 'PENDING_APPROVAL') return { ok: false, code: 'PENDING_RECEIPT_NOT_PENDING' };
  if (receipt.trusted !== false) return { ok: false, code: 'PENDING_RECEIPT_ALREADY_TRUSTED' };
  if (receipt.linked_device_ref !== null) return { ok: false, code: 'PENDING_RECEIPT_ALREADY_LINKED' };
  if (receipt.source_device_id !== sourceRequest.source_device_id) return { ok: false, code: 'PAIRING_DEVICE_MISMATCH' };
  if (receipt.pairing_ref !== sourceRequest.pairing_ref) return { ok: false, code: 'PAIRING_REF_MISMATCH' };
  if (receipt.environment !== sourceRequest.environment) return { ok: false, code: 'PAIRING_ENVIRONMENT_MISMATCH' };
  if (receipt.store_id !== sourceRequest.store_id) return { ok: false, code: 'PAIRING_STORE_MISMATCH' };
  if (receipt.inventory_instance_id !== sourceRequest.inventory_instance_id) return { ok: false, code: 'PAIRING_INSTANCE_MISMATCH' };
  return { ok: true, code: 'PENDING_RECEIPT_APPROVABLE' };
}

function buildApprovedReceipt(contracts, receipt, sourceRequest, reviewer = {}) {
  const reviewRole = roleOf(reviewer);
  if (!reviewer || !Object.keys(reviewer).length) {
    return { ok: false, code: 'MISSING_REVIEWER', receipt: null, guardrails };
  }
  if (!allowedRoles.includes(reviewRole)) {
    return { ok: false, code: 'ROLE_NOT_ALLOWED', receipt: null, guardrails };
  }

  const pendingValidation = validatePendingReceiptForApproval(receipt, sourceRequest);
  if (!pendingValidation.ok) {
    return { ok: false, code: pendingValidation.code, pending_validation: pendingValidation, receipt: null, guardrails };
  }

  const reviewedAt = new Date().toISOString();
  const approvedReceipt = contracts.buildInventoryBridgePairingReceipt({
    pairing_receipt_id: 'PAIRING-RECEIPT-APPROVED-001',
    pairing_ref: sourceRequest.pairing_ref,
    source_device_id: sourceRequest.source_device_id,
    device_status: 'TRUSTED',
    environment: sourceRequest.environment,
    store_id: sourceRequest.store_id,
    inventory_instance_id: sourceRequest.inventory_instance_id,
    reviewed_by: reviewer.id,
    reviewed_at: reviewedAt,
    linked_device_ref: `InventoryBridgeDevice:${sourceRequest.source_device_id}`,
  });

  return {
    ok: true,
    code: 'APPROVED_PAIRING_RECEIPT_BUILT',
    pending_validation: pendingValidation,
    receipt: approvedReceipt,
    reviewer: { id: reviewer.id, role: reviewRole },
    guardrails,
  };
}

function assertApprovedReceipt(result, reviewer, label) {
  assertSubset(
    result,
    {
      ok: true,
      code: 'APPROVED_PAIRING_RECEIPT_BUILT',
      pending_validation: { ok: true, code: 'PENDING_RECEIPT_APPROVABLE' },
      reviewer: { id: reviewer.id, role: reviewer.role },
      guardrails,
    },
    label
  );
  assertEqual(result.receipt.device_status, 'TRUSTED', `${label}.device_status`);
  assertEqual(result.receipt.pairing_status, 'TRUSTED', `${label}.pairing_status`);
  assertEqual(result.receipt.result_code, 'DEVICE_TRUSTED', `${label}.result_code`);
  assertEqual(result.receipt.trusted, true, `${label}.trusted`);
  assertEqual(result.receipt.linked_device_ref, `InventoryBridgeDevice:${request.source_device_id}`, `${label}.linked_device_ref`);
  assertEqual(result.receipt.reviewed_by, reviewer.id, `${label}.reviewed_by`);
  assert(result.receipt.reviewed_at, `${label}.reviewed_at required`);
  assertEqual(result.receipt.environment, request.environment, `${label}.environment`);
  assertEqual(result.receipt.store_id, request.store_id, `${label}.store_id`);
  assertEqual(result.receipt.inventory_instance_id, request.inventory_instance_id, `${label}.inventory_instance_id`);
}

async function main() {
  assertNoForbiddenOperationalCalls();
  const { contracts, cleanup } = await loadModules();

  try {
    const adminResult = buildApprovedReceipt(contracts, pendingReceipt, request, adminReviewer);
    assertApprovedReceipt(adminResult, adminReviewer, 'admin approved receipt');

    const ownerResult = buildApprovedReceipt(contracts, pendingReceipt, request, ownerReviewer);
    assertApprovedReceipt(ownerResult, ownerReviewer, 'owner approved receipt');

    const summary = contracts.getInventoryBridgePairingReceiptSafeSummary(adminResult.receipt);
    assert(summary.pairing_ref !== adminResult.receipt.pairing_ref, 'safe summary must redact pairing_ref.');
    assertEqual(summary.trusted, true, 'safe summary trusted');
    assertEqual(summary.linked_device_ref, `InventoryBridgeDevice:${request.source_device_id}`, 'safe summary linked_device_ref');

    assertSubset(buildApprovedReceipt(contracts, pendingReceipt, request, {}), { ok: false, code: 'MISSING_REVIEWER', receipt: null, guardrails }, 'missing reviewer rejected');
    assertSubset(buildApprovedReceipt(contracts, pendingReceipt, request, { id: 'staff-001', role: 'Staff' }), { ok: false, code: 'ROLE_NOT_ALLOWED', receipt: null, guardrails }, 'staff reviewer rejected');
    assertSubset(buildApprovedReceipt(contracts, { ...pendingReceipt, trusted: true }, request, adminReviewer), { ok: false, code: 'PENDING_RECEIPT_ALREADY_TRUSTED', receipt: null, guardrails }, 'already trusted pending rejected');
    assertSubset(buildApprovedReceipt(contracts, { ...pendingReceipt, linked_device_ref: 'InventoryBridgeDevice:OLD' }, request, adminReviewer), { ok: false, code: 'PENDING_RECEIPT_ALREADY_LINKED', receipt: null, guardrails }, 'already linked pending rejected');
    assertSubset(buildApprovedReceipt(contracts, { ...pendingReceipt, pairing_ref: 'PAIR-OTHER' }, request, adminReviewer), { ok: false, code: 'PAIRING_REF_MISMATCH', receipt: null, guardrails }, 'pairing ref mismatch rejected');
    assertSubset(buildApprovedReceipt(contracts, { ...pendingReceipt, environment: 'TRAINING' }, request, adminReviewer), { ok: false, code: 'PAIRING_ENVIRONMENT_MISMATCH', receipt: null, guardrails }, 'environment mismatch rejected');
    assertSubset(buildApprovedReceipt(contracts, { ...pendingReceipt, device_status: 'TRUSTED', pairing_status: 'TRUSTED' }, request, adminReviewer), { ok: false, code: 'PENDING_RECEIPT_NOT_PENDING', receipt: null, guardrails }, 'non-pending status rejected');
  } finally {
    cleanup();
  }

  console.log('Inventory approved pairing receipt builder validation PASS');
}

main().catch((error) => {
  console.error('Inventory approved pairing receipt builder validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
