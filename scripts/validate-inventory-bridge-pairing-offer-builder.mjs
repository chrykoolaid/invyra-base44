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

const adminSession = Object.freeze({
  actor: { id: 'admin-001', role: 'Admin' },
  environment: 'LIVE',
  store_id: 'STORE-001',
  inventory_instance_id: 'INV-INSTANCE-001',
  pairing_method: 'QR_CODE',
  pairing_ref: 'PAIR-REF-001',
  challenge_ref: 'CHALLENGE-REF-001',
});

const ownerSession = Object.freeze({
  ...adminSession,
  actor: { id: 'owner-001', role: 'Owner' },
  pairing_ref: 'PAIR-REF-OWNER',
  challenge_ref: 'CHALLENGE-REF-OWNER',
});

const allowedRoles = Object.freeze(['Admin', 'Owner']);

const guardrails = Object.freeze({
  inventory_offer_builder_contract_only: true,
  local_validator_only: true,
  no_live_pairing: true,
  no_pairing_session_entity_writes: true,
  no_device_registry_writes: true,
  no_entity_writes: true,
  no_event_ingestion: true,
  no_relay_enforcement: true,
  no_ui: true,
  no_qr_generation: true,
  no_manual_ip_ui: true,
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
  const ownSource = stripComments(readRequired('scripts/validate-inventory-bridge-pairing-offer-builder.mjs'));
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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-pairing-offer-builder-'));
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
    assert(typeof contracts.buildInventoryBridgePairingOffer === 'function', 'buildInventoryBridgePairingOffer must be exported.');
    assert(typeof contracts.validateInventoryBridgePairingOffer === 'function', 'validateInventoryBridgePairingOffer must be exported.');
    assert(typeof contracts.getInventoryBridgePairingOfferSafeSummary === 'function', 'getInventoryBridgePairingOfferSafeSummary must be exported.');
    return { contracts, cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function normalizeRole(actor = {}) {
  return actor.role || actor.user_role || actor.permission_role || actor.account_role || null;
}

function buildOfferFromAdminSession(contracts, session = {}) {
  const role = normalizeRole(session.actor || {});
  if (!session.actor || !Object.keys(session.actor).length) {
    return { ok: false, code: 'MISSING_ACTOR', offer: null, guardrails };
  }
  if (!allowedRoles.includes(role)) {
    return { ok: false, code: 'ROLE_NOT_ALLOWED', offer: null, guardrails };
  }

  const offer = contracts.buildInventoryBridgePairingOffer({
    environment: session.environment,
    store_id: session.store_id,
    inventory_instance_id: session.inventory_instance_id,
    pairing_method: session.pairing_method,
    pairing_ref: session.pairing_ref,
    challenge_ref: session.challenge_ref,
    transport_mode: session.transport_mode,
    bridge_host: session.bridge_host,
    bridge_port: session.bridge_port,
    bridge_base_url: session.bridge_base_url,
    issued_at: session.issued_at,
    expires_at: session.expires_at,
  });
  const validation = contracts.validateInventoryBridgePairingOffer(offer, {
    environment: session.environment,
  });

  return {
    ok: validation.ok,
    code: validation.ok ? 'PAIRING_OFFER_BUILT' : 'PAIRING_OFFER_BUILD_INVALID',
    offer,
    validation,
    guardrails,
  };
}

function assertTtlWindow(offer, minMinutes, maxMinutes) {
  const issuedMs = Date.parse(offer.issued_at);
  const expiresMs = Date.parse(offer.expires_at);
  assert(!Number.isNaN(issuedMs), 'issued_at must be a valid ISO date.');
  assert(!Number.isNaN(expiresMs), 'expires_at must be a valid ISO date.');
  const ttlMinutes = (expiresMs - issuedMs) / 60000;
  assert(ttlMinutes >= minMinutes && ttlMinutes <= maxMinutes, `TTL must be between ${minMinutes} and ${maxMinutes} minutes.`);
}

function assertValidBuiltOffer(result, session, label) {
  assertSubset(
    result,
    {
      ok: true,
      code: 'PAIRING_OFFER_BUILT',
      validation: {
        ok: true,
        code: 'PAIRING_OFFER_VALID',
      },
      guardrails,
    },
    label
  );
  assertEqual(result.offer.environment, session.environment, `${label}.environment`);
  assertEqual(result.offer.store_id, session.store_id, `${label}.store_id`);
  assertEqual(result.offer.inventory_instance_id, session.inventory_instance_id, `${label}.inventory_instance_id`);
  assertEqual(result.offer.pairing_method, session.pairing_method, `${label}.pairing_method`);
  assertEqual(result.offer.pairing_ref, session.pairing_ref, `${label}.pairing_ref`);
  assertEqual(result.offer.challenge_ref, session.challenge_ref, `${label}.challenge_ref`);
  assertEqual(result.offer.prototype_transport, true, `${label}.prototype_transport`);
  assert(result.offer.transport_note.includes('not a local LAN bridge'), `${label}.transport_note must preserve relay guardrail.`);
}

async function main() {
  assertNoForbiddenOperationalCalls();
  const { contracts, cleanup } = await loadContracts();

  try {
    const adminResult = buildOfferFromAdminSession(contracts, adminSession);
    assertValidBuiltOffer(adminResult, adminSession, 'admin-built offer');
    assertTtlWindow(adminResult.offer, 4.9, 5.1);

    const ownerResult = buildOfferFromAdminSession(contracts, ownerSession);
    assertValidBuiltOffer(ownerResult, ownerSession, 'owner-built offer');

    for (const environment of ['LIVE', 'TRAINING', 'TEST']) {
      const session = { ...adminSession, environment, pairing_ref: `PAIR-${environment}`, challenge_ref: `CHALLENGE-${environment}` };
      assertValidBuiltOffer(buildOfferFromAdminSession(contracts, session), session, `${environment} offer`);
    }

    for (const pairing_method of ['QR_CODE', 'MANUAL_IP', 'ADMIN_PROVISIONED']) {
      const session = { ...adminSession, pairing_method, pairing_ref: `PAIR-${pairing_method}`, challenge_ref: `CHALLENGE-${pairing_method}` };
      assertValidBuiltOffer(buildOfferFromAdminSession(contracts, session), session, `${pairing_method} offer`);
    }

    assertSubset(
      buildOfferFromAdminSession(contracts, {}),
      { ok: false, code: 'MISSING_ACTOR', offer: null, guardrails },
      'missing actor rejected'
    );

    assertSubset(
      buildOfferFromAdminSession(contracts, { ...adminSession, actor: { id: 'staff-001', role: 'Staff' } }),
      { ok: false, code: 'ROLE_NOT_ALLOWED', offer: null, guardrails },
      'non-admin actor rejected'
    );

    assertSubset(
      buildOfferFromAdminSession(contracts, { ...adminSession, store_id: null }),
      {
        ok: false,
        code: 'PAIRING_OFFER_BUILD_INVALID',
        validation: { ok: false, code: 'PAIRING_OFFER_INVALID' },
      },
      'missing store rejected'
    );

    assertSubset(
      buildOfferFromAdminSession(contracts, { ...adminSession, inventory_instance_id: null }),
      {
        ok: false,
        code: 'PAIRING_OFFER_BUILD_INVALID',
        validation: { ok: false, code: 'PAIRING_OFFER_INVALID' },
      },
      'missing inventory instance rejected'
    );

    assertSubset(
      buildOfferFromAdminSession(contracts, {
        ...adminSession,
        issued_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      }),
      {
        ok: false,
        code: 'PAIRING_OFFER_BUILD_INVALID',
        validation: { ok: false, code: 'PAIRING_OFFER_EXPIRED' },
      },
      'expired offer rejected'
    );

    assertSubset(
      buildOfferFromAdminSession(contracts, { ...adminSession, transport_mode: 'PRODUCTION_LAN_SPEC_ONLY' }),
      {
        ok: false,
        code: 'PAIRING_OFFER_BUILD_INVALID',
        validation: { ok: false, code: 'PAIRING_OFFER_INVALID' },
      },
      'LAN offer without host rejected'
    );

    const summary = contracts.getInventoryBridgePairingOfferSafeSummary(adminResult.offer);
    assert(summary.pairing_ref !== adminResult.offer.pairing_ref, 'safe summary must redact pairing_ref.');
    assert(summary.challenge_ref !== adminResult.offer.challenge_ref, 'safe summary must redact challenge_ref.');
  } finally {
    cleanup();
  }

  console.log('Inventory pairing offer builder validation PASS');
}

main().catch((error) => {
  console.error('Inventory pairing offer builder validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
