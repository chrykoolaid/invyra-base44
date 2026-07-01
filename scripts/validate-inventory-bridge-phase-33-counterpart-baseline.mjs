import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const errors = [];
const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertIncludes(content, expected, message) {
  if (!content.includes(expected)) {
    errors.push(message);
  }
}

function assertNotIncludes(content, forbidden, message) {
  if (content.includes(forbidden)) {
    errors.push(message);
  }
}

const baselineTypes = read('src/inventory-bridge/phase33/inventoryCounterpartBaselineTypes.js');
const baseline = read('src/inventory-bridge/phase33/inventoryCounterpartBaseline.js');

assertIncludes(baselineTypes, 'INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_PHASE = "33.INVENTORY.A1"', 'baseline constants must identify Inventory Phase 33 counterpart baseline');
assertIncludes(baselineTypes, 'inventory-counterparts-confirmed-read-only', 'baseline status must remain read-only');
assertIncludes(baselineTypes, 'inventory-counterparts-confirmed-no-activation', 'baseline confirmation must remain no-activation');
assertIncludes(baselineTypes, 'INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT = 8', 'baseline constants must require eight counterparts');
assertIncludes(baselineTypes, 'INVENTORY_BRIDGE_PHASE_33_ACTIVATION_STEPS_ALLOWED = 0', 'baseline constants must allow zero activation steps');

assertIncludes(baseline, 'createInventoryBridgePhase33CounterpartBaseline', 'baseline factory must exist');
assertIncludes(baseline, 'phase: INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_PHASE', 'baseline must return phase constant');
assertIncludes(baseline, 'status: INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_STATUS', 'baseline must return status constant');
assertIncludes(baseline, 'confirmationStatus: INVENTORY_BRIDGE_PHASE_33_COUNTERPART_CONFIRMATION_STATUS', 'baseline must return confirmation status constant');
assertIncludes(baseline, 'systemOfRecord: "Inventory Desktop"', 'baseline must keep Inventory Desktop as system of record');
assertIncludes(baseline, 'operationalLayer: "ScanOps"', 'baseline must identify ScanOps as operational layer');
assertIncludes(baseline, 'requiredCounterparts: INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPARTS', 'baseline must expose required counterparts');
assertIncludes(baseline, 'requiredCounterparts: INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT', 'baseline totals must return required counterpart count');
assertIncludes(baseline, 'confirmedInInventoryRepo: INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT', 'baseline totals must confirm Inventory repo counterparts');
assertIncludes(baseline, 'activationStepsAllowed: INVENTORY_BRIDGE_PHASE_33_ACTIVATION_STEPS_ALLOWED', 'baseline totals must allow zero activation steps');
assertIncludes(baseline, 'inventoryCounterpartsConfirmed: true', 'baseline must confirm Inventory-side counterparts');
assertIncludes(baseline, 'scanOpsCounterpartBaselineRequired: true', 'baseline must require ScanOps counterpart baseline');
assertIncludes(baseline, 'crossRepoValidationRequired: true', 'baseline must require cross-repo validation');
assertIncludes(baseline, 'crossRepoValidationConfirmed: false', 'baseline must keep cross-repo validation unconfirmed');
assertIncludes(baseline, 'bridgeActivationAllowed: false', 'baseline must keep bridge activation disallowed');
assertIncludes(baseline, 'safeToRunOperationalBridge: false', 'baseline must keep operational bridge unsafe');
assertIncludes(baseline, 'executionAllowed: false', 'baseline must keep execution disallowed');
assertIncludes(baseline, 'persistenceAllowed: false', 'baseline must keep persistence disallowed');
assertIncludes(baseline, 'inventoryMutationAllowed: false', 'baseline must keep Inventory mutation disallowed');
assertIncludes(baseline, 'scanOpsMutationAllowed: false', 'baseline must keep ScanOps mutation disallowed');
assertIncludes(baseline, 'nextAllowedStep: "cross-repo-counterpart-alignment-review"', 'baseline must route to cross-repo alignment review');

for (const expected of [
  'Inventory Desktop bridge availability descriptor',
  'Inventory Desktop pairing offer and approval policy',
  'Inventory Desktop device trust registry',
  'Inventory Desktop bridge receive endpoint',
  'Inventory Desktop bridge inbox admission policy',
  'Inventory Desktop receipt review and application boundary',
  'Inventory Desktop acknowledgement contract',
  'Inventory Desktop recovery and audit policy',
]) {
  assertIncludes(baseline, expected, `baseline must include ${expected}`);
}

for (const forbidden of [
  'scanOpsMutationAllowed: true',
  'crossRepoValidationConfirmed: true',
  'bridgeActivationAllowed: true',
  'safeToRunOperationalBridge: true',
  'executionAllowed: true',
  'persistenceAllowed: true',
  'inventoryMutationAllowed: true',
  'activationStepsAllowed: 1',
  'fetch(',
  'WebSocket',
  'localStorage.',
  'sessionStorage.',
  'indexedDB',
]) {
  assertNotIncludes(baselineTypes, forbidden, `baseline constants must not contain ${forbidden}`);
  assertNotIncludes(baseline, forbidden, `baseline implementation must not contain ${forbidden}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 33 counterpart baseline validates Inventory-side counterparts are confirmed while activation remains blocked.');
