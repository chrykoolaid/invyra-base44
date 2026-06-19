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

const offer = Object.freeze({
  bridge_protocol_version: '1.0.0',
  pairing_contract_version: '1.0.0',
  bridge_name: 'Invyra Inventory Bridge',
  bridge_version: '1.0.0',
  pairing_method: 'QR_CODE',
  environment: 'LIVE',
  issued_at: new Date(Date.now() - 60 * 1000).toISOString(),
  expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  transport_mode: 'PROTOTYPE_CLOUD_RELAY',
  pairing_ref: 'PAIR-REF-001',
  challenge_ref: 'CHALLENGE-REF-001',
  prototype_transport: true,
  transport_note: 'Base44 prototype cloud relay — not a local LAN bridge.',
});

const request = Object.freeze({
  bridge_protocol_version: '1.0.0',
  pairing_contract_version: '1.0.0',
  source_system: 'scanops',
  source_device_id: 'SCANOPS-DEVICE-001',
  device_name: 'ScanOps Handheld 001',
  device_type: 'HANDHELD_SCANNER',
  source_user_id: 'staff-001',
  source_user_role: 'Staff',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  environment: 'LIVE',
  requested_at: new Date().toISOString(),
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  challenge_ref: 'CHALLENGE-REF-001',
});

const guardrails = Object.freeze({
  pending_receipt_contract_only: true,
  local_validator_only: true,
  no_live_pairing: true,
  no_trusted_device_approval: true,
  no_device_registry_writes: true,
  no_entity_writes: true,
  no_event_ingestion: true,
  no_relay_enforcement: true,
  no_ui: true,
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-pairing-pending-receipt-builder.mjs'));
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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-pairing-pending-receipt-'));
  for (const modulePath of modulePaths) {
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(readRequired(modulePath)), 'utf8');
  }
  return tempRoot;
}

async function loadContracts() {
  const tempRoot = materializeImportableModules();
  try {
    const moduleUrl = pathToFileURL(path.join(tempRoot, toTempModulePath(contractModulePath))).href;
    const contracts = await import(`${moduleUrl}?validationRun=${Date.now()}`);
    assert(typeof contracts.validateInventoryBridgePairingOffer === 'function', 'validateInventoryBridgePairingOffer must be exported.');
    assert(typeof contracts.validateInventoryBridgePairingRequest === 'function', 'validateInventoryBridgePairingRequest must be exported.');
    assert(typeof contracts.buildInventoryBridgePairingReceipt === 'function', 'buildInventoryBridgePairingReceipt must be exported.');
    assert(typeof contracts.getInventoryBridgePairingReceiptSafeSummary === 'function', 'getInventoryBridgePairingReceiptSafeSummary must be exported.');
    return { contracts, cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function correlate(offerValidation, requestValidation, offerFixture, requestFixture) {
  if (!offerValidation.ok) return { ok: false, code: 'PAIRING_OFFER_INVALID' };
  if (!requestValidation.ok) return { ok: false, code: 'PAIRING_REQUEST_INVALID' };

  const checks = [
    ['bridge_protocol_version', 'PAIRING_PROTOCOL_MISMATCH'],
    ['pairing_contract_version', 'PAIRING_PROTOCOL_MISMATCH'],
    ['environment', 'PAIRING_ENVIRONMENT_MISMATCH'],
    ['store_id', 'PAIRING_STORE_MISMATCH'],
    ['inventory_instance_id', 'PAIRING_INSTANCE_MISMATCH'],
    ['pairing_method', 'PAIRING_METHOD_MISMATCH'],
    ['pairing_ref', 'PAIRING_REF_MISMATCH'],
    ['challenge_ref', 'PAIRING_CHALLENGE_MISMATCH'],
  ];

  for (const [field, code] of checks) {
    if (offerFixture[field] !== requestFixture[field]) return { ok: false, code, field };
  }

  return { ok: true, code: 'PAIRING_CORRELATION_VALID' };
}

function buildPendingReceipt(contracts, offerFixture, requestFixture) {
  const offerValidation = contracts.validateInventoryBridgePairingOffer(offerFixture, {
    environment: offerFixture.environment,
  });
  const requestValidation = contracts.validateInventoryBridgePairingRequest(requestFixture, {
    environment: offerFixture.environment,
  });
  const correlation = correlate(offerValidation, requestValidation, offerFixture, requestFixture);

  if (!correlation.ok) {
    return {
      ok: false,
      code: correlation.code,
      offer_validation: offerValidation,
      request_validation: requestValidation,
      correlation,
      receipt: null,
      guardrails,
    };
  }

  const receipt = contracts.buildInventoryBridgePairingReceipt({
    pairing_receipt_id: 'PAIRING-RECEIPT-001',
    pairing_ref: requestFixture.pairing_ref,
    source_device_id: requestFixture.source_device_id,
    device_status: 'PENDING',
    environment: requestFixture.environment,
    store_id: requestFixture.store_id,
    inventory_instance_id: requestFixture.inventory_instance_id,
    reviewed_by: null,
    reviewed_at: null,
  });

  return {
    ok: true,
    code: 'PENDING_PAIRING_RECEIPT_BUILT',
    offer_validation: offerValidation,
    request_validation: requestValidation,
    correlation,
    receipt,
    guardrails,
  };
}

function assertPendingReceipt(result, label) {
  assertSubset(
    result,
    {
      ok: true,
      code: 'PENDING_PAIRING_RECEIPT_BUILT',
      offer_validation: { ok: true, code: 'PAIRING_OFFER_VALID' },
      request_validation: { ok: true, code: 'PAIRING_REQUEST_VALID' },
      correlation: { ok: true, code: 'PAIRING_CORRELATION_VALID' },
      guardrails,
    },
    label
  );

  assertEqual(result.receipt.pairing_ref, request.pairing_ref, `${label}.pairing_ref`);
  assertEqual(result.receipt.source_device_id, request.source_device_id, `${label}.source_device_id`);
  assertEqual(result.receipt.device_status, 'PENDING', `${label}.device_status`);
  assertEqual(result.receipt.pairing_status, 'PENDING_APPROVAL', `${label}.pairing_status`);
  assertEqual(result.receipt.result_code, 'DEVICE_PENDING_APPROVAL', `${label}.result_code`);
  assertEqual(result.receipt.trusted, false, `${label}.trusted`);
  assertEqual(result.receipt.linked_device_ref, null, `${label}.linked_device_ref`);
  assertEqual(result.receipt.reviewed_by, null, `${label}.reviewed_by`);
  assertEqual(result.receipt.reviewed_at, null, `${label}.reviewed_at`);
  assertEqual(result.receipt.environment, request.environment, `${label}.environment`);
  assertEqual(result.receipt.store_id, request.store_id, `${label}.store_id`);
  assertEqual(result.receipt.inventory_instance_id, request.inventory_instance_id, `${label}.inventory_instance_id`);
}

async function main() {
  assertNoForbiddenOperationalCalls();
  const { contracts, cleanup } = await loadContracts();

  try {
    const result = buildPendingReceipt(contracts, offer, request);
    assertPendingReceipt(result, 'pending receipt');

    const summary = contracts.getInventoryBridgePairingReceiptSafeSummary(result.receipt);
    assert(summary.pairing_ref !== result.receipt.pairing_ref, 'safe summary must redact pairing_ref.');
    assertEqual(summary.trusted, false, 'safe summary trusted');
    assertEqual(summary.linked_device_ref, null, 'safe summary linked_device_ref');

    assertSubset(
      buildPendingReceipt(contracts, offer, { ...request, pairing_ref: 'PAIR-OTHER' }),
      { ok: false, code: 'PAIRING_REF_MISMATCH', receipt: null, guardrails },
      'pairing ref mismatch does not build receipt'
    );

    assertSubset(
      buildPendingReceipt(contracts, offer, { ...request, challenge_ref: 'CHALLENGE-OTHER' }),
      { ok: false, code: 'PAIRING_CHALLENGE_MISMATCH', receipt: null, guardrails },
      'challenge mismatch does not build receipt'
    );

    assertSubset(
      buildPendingReceipt(contracts, offer, { ...request, store_id: 'STORE-OTHER' }),
      { ok: false, code: 'PAIRING_STORE_MISMATCH', receipt: null, guardrails },
      'store mismatch does not build receipt'
    );

    assertSubset(
      buildPendingReceipt(contracts, offer, { ...request, environment: 'TRAINING' }),
      { ok: false, code: 'PAIRING_REQUEST_INVALID', receipt: null, guardrails },
      'environment mismatch does not build receipt'
    );

    assertSubset(
      buildPendingReceipt(
        contracts,
        {
          ...offer,
          issued_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        request
      ),
      { ok: false, code: 'PAIRING_OFFER_INVALID', receipt: null, guardrails },
      'expired offer does not build receipt'
    );
  } finally {
    cleanup();
  }

  console.log('Inventory pending pairing receipt builder validation PASS');
}

main().catch((error) => {
  console.error('Inventory pending pairing receipt builder validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
