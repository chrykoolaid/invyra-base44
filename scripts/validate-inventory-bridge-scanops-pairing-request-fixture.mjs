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

const scanOpsPairingRequestFixture = Object.freeze({
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
  requested_at: '2026-06-19T00:00:00.000Z',
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  challenge_ref: 'CHALLENGE-REF-001',
  prototype_transport: true,
  transport_note: 'Base44 prototype cloud relay — not a local LAN bridge.',
});

const expectedFixtureFields = Object.freeze([
  'bridge_protocol_version',
  'pairing_contract_version',
  'source_system',
  'source_device_id',
  'device_name',
  'device_type',
  'environment',
  'requested_at',
  'pairing_method',
]);

const requiredGuardrails = Object.freeze({
  fixture_only: true,
  inventory_acceptance_contract_only: true,
  no_live_pairing: true,
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
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePathname}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function toTempModulePath(relativePathname) {
  return relativePathname.replace(/\.js$/, '.mjs');
}

function rewriteRelativeImports(content) {
  return content.replace(
    /(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,
    (_, prefix, specifier, suffix) => {
      if (path.extname(specifier)) {
        return `${prefix}${specifier.replace(/\.js$/, '.mjs')}${suffix}`;
      }
      return `${prefix}${specifier}.mjs${suffix}`;
    }
  );
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

function assertObjectSubset(actual, expected, label) {
  assert(actual && typeof actual === 'object', `${label}: expected object.`);

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (expectedValue && typeof expectedValue === 'object' && !Array.isArray(expectedValue)) {
      assertObjectSubset(actualValue, expectedValue, `${label}.${key}`);
    } else {
      assertEqual(actualValue, expectedValue, `${label}.${key}`);
    }
  }
}

function assertNoForbiddenOperationalCalls() {
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-scanops-pairing-request-fixture.mjs'));
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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-scanops-pairing-fixture-'));

  for (const modulePath of modulePaths) {
    const source = readRequired(modulePath);
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(source), 'utf8');
  }

  return tempRoot;
}

async function loadInventoryPairingContracts() {
  const tempRoot = materializeImportableModules();
  const tempContractPath = path.join(tempRoot, toTempModulePath(contractModulePath));

  try {
    const moduleUrl = pathToFileURL(tempContractPath).href;
    const contractModule = await import(`${moduleUrl}?validationRun=${Date.now()}`);

    assert(
      typeof contractModule.validateInventoryBridgePairingRequest === 'function',
      'Inventory bridge pairing contracts must export validateInventoryBridgePairingRequest(input).'
    );
    assert(
      typeof contractModule.getInventoryBridgePairingRequestSafeSummary === 'function',
      'Inventory bridge pairing contracts must export getInventoryBridgePairingRequestSafeSummary(input).'
    );

    return {
      contracts: contractModule,
      cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }),
    };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function assertFixtureShape() {
  for (const field of expectedFixtureFields) {
    assert(scanOpsPairingRequestFixture[field], `ScanOps pairing request fixture missing required field: ${field}`);
  }

  assertEqual(scanOpsPairingRequestFixture.source_system, 'scanops', 'fixture.source_system');
  assertEqual(scanOpsPairingRequestFixture.bridge_protocol_version, '1.0.0', 'fixture.bridge_protocol_version');
  assertEqual(scanOpsPairingRequestFixture.pairing_contract_version, '1.0.0', 'fixture.pairing_contract_version');
  assertEqual(scanOpsPairingRequestFixture.environment, 'LIVE', 'fixture.environment');
  assertEqual(scanOpsPairingRequestFixture.pairing_method, 'QR_CODE', 'fixture.pairing_method');
  assertEqual(scanOpsPairingRequestFixture.prototype_transport, true, 'fixture.prototype_transport');
  assert(
    scanOpsPairingRequestFixture.transport_note.includes('not a local LAN bridge'),
    'ScanOps fixture must preserve Base44 cloud relay guardrail.'
  );
}

async function main() {
  assertNoForbiddenOperationalCalls();
  assertFixtureShape();

  const { contracts, cleanup } = await loadInventoryPairingContracts();
  try {
    const validation = contracts.validateInventoryBridgePairingRequest(scanOpsPairingRequestFixture, {
      environment: 'LIVE',
    });

    assertObjectSubset(
      validation,
      {
        ok: true,
        code: 'PAIRING_REQUEST_VALID',
      },
      'Inventory validation of ScanOps pairing request fixture'
    );

    const summary = contracts.getInventoryBridgePairingRequestSafeSummary(scanOpsPairingRequestFixture);
    assert(summary.pairing_ref !== scanOpsPairingRequestFixture.pairing_ref, 'safe summary must redact pairing_ref.');
    assert(summary.challenge_ref !== scanOpsPairingRequestFixture.challenge_ref, 'safe summary must redact challenge_ref.');

    const mismatchValidation = contracts.validateInventoryBridgePairingRequest(
      {
        ...scanOpsPairingRequestFixture,
        environment: 'TRAINING',
      },
      { environment: 'LIVE' }
    );

    assertObjectSubset(
      mismatchValidation,
      {
        ok: false,
        code: 'PAIRING_ENVIRONMENT_MISMATCH',
      },
      'Inventory rejects ScanOps fixture environment mismatch'
    );

    assertObjectSubset(
      requiredGuardrails,
      {
        fixture_only: true,
        inventory_acceptance_contract_only: true,
        no_live_pairing: true,
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
      },
      'fixture guardrails'
    );
  } finally {
    cleanup();
  }

  console.log('Inventory acceptance of ScanOps pairing request fixture PASS');
}

main().catch((error) => {
  console.error('Inventory acceptance of ScanOps pairing request fixture FAIL');
  console.error(error);
  process.exitCode = 1;
});
