import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const modulePaths = ['src/lib/inventory/bridgePairingContracts.js', 'src/lib/inventory/bridgeDeviceRegistry.js'];
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
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  environment: 'LIVE',
  requested_at: new Date().toISOString(),
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  challenge_ref: 'CHALLENGE-REF-001',
});

const guardrails = Object.freeze({
  inventory_correlation_contract_only: true,
  fixture_only: true,
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

function materializeImportableModules() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-pairing-correlation-'));
  for (const modulePath of modulePaths) {
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(readRequired(modulePath)), 'utf8');
  }
  return tempRoot;
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

async function loadContracts() {
  const tempRoot = materializeImportableModules();
  try {
    const moduleUrl = pathToFileURL(path.join(tempRoot, toTempModulePath(contractModulePath))).href;
    const contracts = await import(`${moduleUrl}?validationRun=${Date.now()}`);
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

  return {
    ok: true,
    code: 'PAIRING_CORRELATION_VALID',
    source_system: requestFixture.source_system,
    source_device_id: requestFixture.source_device_id,
    guardrails,
  };
}

function runCase(contracts, offerFixture, requestFixture, expected, label) {
  const offerValidation = contracts.validateInventoryBridgePairingOffer(offerFixture, { environment: offerFixture.environment });
  const requestValidation = contracts.validateInventoryBridgePairingRequest(requestFixture, { environment: offerFixture.environment });
  const result = correlate(offerValidation, requestValidation, offerFixture, requestFixture);
  assertSubset(result, expected, label);
  return result;
}

async function main() {
  const { contracts, cleanup } = await loadContracts();
  try {
    const valid = runCase(
      contracts,
      offer,
      request,
      {
        ok: true,
        code: 'PAIRING_CORRELATION_VALID',
        source_system: 'scanops',
        guardrails,
      },
      'valid pairing correlation'
    );

    const offerSummary = contracts.getInventoryBridgePairingOfferSafeSummary(offer);
    const requestSummary = contracts.getInventoryBridgePairingRequestSafeSummary(request);
    assert(offerSummary.pairing_ref !== offer.pairing_ref, 'offer summary must redact pairing_ref.');
    assert(requestSummary.pairing_ref !== request.pairing_ref, 'request summary must redact pairing_ref.');
    assert(valid.guardrails.no_live_pairing === true, 'correlation must not perform live pairing.');

    runCase(contracts, offer, { ...request, pairing_ref: 'PAIR-REF-OTHER' }, { ok: false, code: 'PAIRING_REF_MISMATCH' }, 'pairing_ref mismatch');
    runCase(contracts, offer, { ...request, challenge_ref: 'CHALLENGE-OTHER' }, { ok: false, code: 'PAIRING_CHALLENGE_MISMATCH' }, 'challenge_ref mismatch');
    runCase(contracts, offer, { ...request, store_id: 'STORE-OTHER' }, { ok: false, code: 'PAIRING_STORE_MISMATCH' }, 'store_id mismatch');
    runCase(contracts, offer, { ...request, inventory_instance_id: 'INV-OTHER' }, { ok: false, code: 'PAIRING_INSTANCE_MISMATCH' }, 'inventory_instance_id mismatch');
    runCase(contracts, offer, { ...request, pairing_method: 'MANUAL_IP' }, { ok: false, code: 'PAIRING_METHOD_MISMATCH' }, 'pairing_method mismatch');
    runCase(contracts, offer, { ...request, environment: 'TRAINING' }, { ok: false, code: 'PAIRING_REQUEST_INVALID' }, 'environment mismatch');
  } finally {
    cleanup();
  }

  console.log('Inventory pairing offer/request correlation validation PASS');
}

main().catch((error) => {
  console.error('Inventory pairing offer/request correlation validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
