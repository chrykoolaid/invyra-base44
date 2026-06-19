import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

const modulePaths = Object.freeze([
  'functions/inventoryBridgePairingDiagnostic.js',
  'src/lib/inventory/bridgePairingVerificationDiagnostic.js',
  'src/lib/inventory/bridgePairingVerificationHelpers.js',
  'src/lib/inventory/bridgePairingContracts.js',
  'src/lib/inventory/bridgeDeviceRegistry.js',
]);

const backendModulePath = 'functions/inventoryBridgePairingDiagnostic.js';

const requiredBackendGuardrails = Object.freeze({
  admin_diagnostic_only: true,
  no_live_pairing: true,
  no_device_registry_writes: true,
  no_entity_writes: true,
  no_relay_enforcement: true,
  no_ui: true,
  no_stock_mutation: true,
  no_price_mutation: true,
  no_pos_order_forecast_mutation: true,
  no_item_master_mutation: true,
  ingestion_validation_still_required_per_event: true,
  base44_cloud_relay_not_lan_bridge: true,
});

const requiredRejectedGuardrails = Object.freeze({
  no_verification_run_without_admin: true,
  no_entity_writes: true,
  no_operational_mutation: true,
});

const forbiddenOperationalCalls = Object.freeze([
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
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertObjectSubset(actual, expected, label) {
  assert(actual && typeof actual === 'object', `${label}: expected an object response.`);

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (expectedValue && typeof expectedValue === 'object' && !Array.isArray(expectedValue)) {
      assertObjectSubset(actualValue, expectedValue, `${label}.${key}`);
    } else {
      assertEqual(actualValue, expectedValue, `${label}.${key}`);
    }
  }
}

function assertGuardrails(actual, expected, label) {
  assert(actual && typeof actual === 'object', `${label}: guardrails missing.`);
  assertObjectSubset(actual, expected, label);
}

function assertNoForbiddenOperationalCalls() {
  for (const modulePath of modulePaths) {
    const source = stripComments(readRequired(modulePath));
    for (const forbidden of forbiddenOperationalCalls) {
      assert(
        !forbidden.pattern.test(source),
        `${modulePath} contains forbidden operational call: ${forbidden.label}`
      );
    }
  }
}

function materializeImportableModules() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invyra-bridge-backend-diagnostic-'));

  for (const modulePath of modulePaths) {
    const source = readRequired(modulePath);
    const tempPath = path.join(tempRoot, toTempModulePath(modulePath));
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, rewriteRelativeImports(source), 'utf8');
  }

  return tempRoot;
}

async function loadBackendRunner() {
  const tempRoot = materializeImportableModules();
  const tempBackendPath = path.join(tempRoot, toTempModulePath(backendModulePath));

  try {
    const moduleUrl = pathToFileURL(tempBackendPath).href;
    const backendModule = await import(`${moduleUrl}?validationRun=${Date.now()}`);
    const runner = backendModule.runInventoryBridgePairingDiagnosticBackend;

    assert(
      typeof runner === 'function',
      'functions/inventoryBridgePairingDiagnostic.js must export runInventoryBridgePairingDiagnosticBackend(input).'
    );

    return { runner, cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function assertRejectedAuthResult(result, expected, label) {
  assertObjectSubset(result, expected, label);
  assertGuardrails(result.guardrails, requiredRejectedGuardrails, `${label}.guardrails`);
  assert(!Object.hasOwn(result, 'verification'), `${label}: rejected auth must not include verification output.`);
  assert(!Object.hasOwn(result, 'source_runner_phase'), `${label}: source runner must not run before admin access passes.`);
}

function assertCompletedDiagnosticResult(result, expected, label) {
  assertObjectSubset(result, expected, label);
  assertGuardrails(result.guardrails, requiredBackendGuardrails, `${label}.guardrails`);
  assert(Array.isArray(result.verification.scenarios), `${label}: verification.scenarios must be an array.`);
  assertEqual(result.verification.scenarios.length, 8, `${label}.verification.scenarios.length`);

  const failedScenario = result.verification.scenarios.find((scenario) => scenario?.result?.ok !== true);
  assert(!failedScenario, `${label}: expected all pairing scenarios to pass.`);
}

const cases = Object.freeze([
  {
    label: 'missing actor',
    input: {},
    expected: {
      ok: false,
      status: 'REJECTED_AUTH',
      decision_code: 'MISSING_ACTOR',
    },
    assertResult: assertRejectedAuthResult,
  },
  {
    label: 'non-admin actor',
    input: {
      actor: {
        id: 'staff-001',
        role: 'Staff',
      },
      environment: 'LIVE',
    },
    expected: {
      ok: false,
      status: 'REJECTED_AUTH',
      decision_code: 'ROLE_NOT_ALLOWED',
    },
    assertResult: assertRejectedAuthResult,
  },
  {
    label: 'admin actor',
    input: {
      actor: {
        id: 'admin-001',
        role: 'Admin',
      },
      environment: 'LIVE',
    },
    expected: {
      ok: true,
      phase: '1D-D-F',
      source_runner_phase: '1D-D-E',
      status: 'COMPLETED',
      verification: {
        ok: true,
        total_scenarios: 8,
        passed_scenarios: 8,
        failed_scenarios: 0,
      },
    },
    assertResult: assertCompletedDiagnosticResult,
  },
  {
    label: 'owner actor',
    input: {
      actor: {
        id: 'owner-001',
        role: 'Owner',
      },
      environment: 'LIVE',
    },
    expected: {
      ok: true,
      phase: '1D-D-F',
      source_runner_phase: '1D-D-E',
      status: 'COMPLETED',
      verification: {
        ok: true,
        total_scenarios: 8,
        passed_scenarios: 8,
        failed_scenarios: 0,
      },
    },
    assertResult: assertCompletedDiagnosticResult,
  },
]);

async function main() {
  assertNoForbiddenOperationalCalls();

  const { runner, cleanup } = await loadBackendRunner();
  try {
    for (const testCase of cases) {
      const result = await Promise.resolve(runner(testCase.input));
      testCase.assertResult(result, testCase.expected, testCase.label);
    }
  } finally {
    cleanup();
  }

  console.log('Backend diagnostic contract validation PASS');
}

main().catch((error) => {
  console.error('Backend diagnostic contract validation FAIL');
  console.error(error);
  process.exitCode = 1;
});
