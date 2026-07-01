import {
  INVENTORY_BRIDGE_PHASE_33_ACTIVATION_STEPS_ALLOWED,
  INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_PHASE,
  INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_STATUS,
  INVENTORY_BRIDGE_PHASE_33_COUNTERPART_CONFIRMATION_STATUS,
  INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT,
} from "./inventoryCounterpartBaselineTypes";

export const INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPARTS = Object.freeze([
  {
    name: "Inventory Desktop bridge availability descriptor",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop pairing offer and approval policy",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop device trust registry",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop bridge receive endpoint",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop bridge inbox admission policy",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop receipt review and application boundary",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop acknowledgement contract",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
  {
    name: "Inventory Desktop recovery and audit policy",
    requiredForScanOpsActivation: true,
    confirmedInInventoryRepo: true,
    inventoryDesktopSystemOfRecord: true,
    scanOpsMutationAllowed: false,
  },
]);

export function createInventoryBridgePhase33CounterpartBaseline() {
  const confirmedCounterparts = INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPARTS.filter(
    (counterpart) => counterpart.confirmedInInventoryRepo === true
  );

  if (
    INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPARTS.length !==
      INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT ||
    confirmedCounterparts.length !== INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT ||
    INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPARTS.some(
      (counterpart) =>
        counterpart.requiredForScanOpsActivation !== true ||
        counterpart.inventoryDesktopSystemOfRecord !== true ||
        counterpart.scanOpsMutationAllowed !== false
    )
  ) {
    throw new Error(
      "Inventory bridge Phase 33 counterpart baseline detected counterpart drift."
    );
  }

  return Object.freeze({
    phase: INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_PHASE,
    status: INVENTORY_BRIDGE_PHASE_33_COUNTERPART_BASELINE_STATUS,
    confirmationStatus: INVENTORY_BRIDGE_PHASE_33_COUNTERPART_CONFIRMATION_STATUS,
    systemOfRecord: "Inventory Desktop",
    operationalLayer: "ScanOps",
    requiredCounterparts: INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPARTS,
    totals: Object.freeze({
      requiredCounterparts: INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT,
      confirmedInInventoryRepo: INVENTORY_BRIDGE_PHASE_33_REQUIRED_COUNTERPART_COUNT,
      activationStepsAllowed: INVENTORY_BRIDGE_PHASE_33_ACTIVATION_STEPS_ALLOWED,
    }),
    inventoryCounterpartsConfirmed: true,
    scanOpsCounterpartBaselineRequired: true,
    crossRepoValidationRequired: true,
    crossRepoValidationConfirmed: false,
    bridgeActivationAllowed: false,
    safeToRunOperationalBridge: false,
    executionAllowed: false,
    persistenceAllowed: false,
    inventoryMutationAllowed: false,
    scanOpsMutationAllowed: false,
    nextAllowedStep: "cross-repo-counterpart-alignment-review",
    reason:
      "Inventory bridge Phase 33 counterpart baseline confirms the Inventory-side counterpart map only. Cross-repo validation and explicit activation gates remain required before operational bridge work.",
  });
}
