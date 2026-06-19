/**
 * bridgePairingVerificationHelpers.js — Inventory Phase 1D-D-D
 *
 * Verification helpers for the ScanOps ↔ Inventory Bridge v1 pairing contracts.
 *
 * Scope for this phase:
 * - Pure helper assertions only.
 * - Exercises pairing offer/request/receipt contracts and device-registry decisions.
 * - Does not call APIs, write entities, enforce relay trust, or build UI.
 *
 * Hard guardrails:
 * - Transport trust does not equal ingestion trust.
 * - Every ScanOps event must still pass through processInboundScanOpsEvent(event).
 * - No stock, price, POS, order, forecast, Item Master, StockMovement, POSLineItem,
 *   MarkdownRound, PurchaseOrder, Wastage, or multi-location mutation.
 * - Base44 prototype transport remains a cloud relay, not a local LAN bridge.
 */

import {
  INVENTORY_BRIDGE_DEVICE_DECISION,
  INVENTORY_BRIDGE_DEVICE_STATUS,
  INVENTORY_BRIDGE_DEVICE_TYPE,
  INVENTORY_BRIDGE_ENVIRONMENT,
  INVENTORY_BRIDGE_PAIRING_METHOD,
  assertNoInventoryBridgeDeviceOperationalMutation,
  buildInventoryBridgeDeviceRecord,
  decideInventoryBridgeDeviceAccess,
  getInventoryBridgeDeviceSafeSummary,
  isInventoryBridgeDeviceTrusted,
  validateInventoryBridgeDeviceRecord,
} from "./bridgeDeviceRegistry";
import {
  INVENTORY_BRIDGE_PAIRING_RESULT_CODE,
  INVENTORY_BRIDGE_PAIRING_STATUS,
  INVENTORY_BRIDGE_PAIRING_TRANSPORT_MODE,
  assertNoInventoryBridgePairingOperationalMutation,
  buildInventoryBridgePairingOffer,
  buildInventoryBridgePairingReceipt,
  buildInventoryBridgePairingRequest,
  getInventoryBridgePairingOfferSafeSummary,
  getInventoryBridgePairingReceiptSafeSummary,
  getInventoryBridgePairingRequestSafeSummary,
  validateInventoryBridgePairingOffer,
  validateInventoryBridgePairingRequest,
} from "./bridgePairingContracts";

function futureIso(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function pastIso(minutes = 5) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function pass(name, details = {}) {
  return { name, passed: true, details };
}

function fail(name, reason, details = {}) {
  return { name, passed: false, reason, details };
}

function expect(name, condition, details = {}, reason = "Expectation failed.") {
  return condition ? pass(name, details) : fail(name, reason, details);
}

function summarizeAssertions(assertions = []) {
  const failed = assertions.filter((assertion) => !assertion.passed);
  return {
    ok: failed.length === 0,
    total: assertions.length,
    passed: assertions.length - failed.length,
    failed: failed.length,
    assertions,
  };
}

export function buildValidPairingScenario(overrides = {}) {
  const common = {
    environment: overrides.environment || INVENTORY_BRIDGE_ENVIRONMENT.LIVE,
    store_id: overrides.store_id || "STORE-001",
    inventory_instance_id: overrides.inventory_instance_id || "INV-INSTANCE-001",
    pairing_method: overrides.pairing_method || INVENTORY_BRIDGE_PAIRING_METHOD.QR_CODE,
    pairing_ref: overrides.pairing_ref || "PAIR-REF-001",
    challenge_ref: overrides.challenge_ref || "CHALLENGE-REF-001",
  };

  const offer = buildInventoryBridgePairingOffer({
    ...common,
    expires_at: overrides.offer_expires_at || futureIso(5),
    transport_mode: overrides.transport_mode || INVENTORY_BRIDGE_PAIRING_TRANSPORT_MODE.PROTOTYPE_CLOUD_RELAY,
  });

  const request = buildInventoryBridgePairingRequest({
    ...common,
    source_device_id: overrides.source_device_id || "SCANOPS-DEVICE-001",
    device_name: overrides.device_name || "ScanOps Handheld 001",
    device_type: overrides.device_type || INVENTORY_BRIDGE_DEVICE_TYPE.HANDHELD_SCANNER,
    source_user_id: overrides.source_user_id || "staff-001",
    source_user_role: overrides.source_user_role || "Staff",
  });

  const pendingDevice = buildInventoryBridgeDeviceRecord({
    ...common,
    device_id: request.source_device_id,
    device_name: request.device_name,
    device_type: request.device_type,
    status: INVENTORY_BRIDGE_DEVICE_STATUS.PENDING,
    trusted: false,
    pairing_ref: common.pairing_ref,
  });

  const trustedDevice = buildInventoryBridgeDeviceRecord({
    ...pendingDevice,
    status: INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED,
    trusted: true,
    paired_at: overrides.paired_at || new Date().toISOString(),
    paired_by: overrides.paired_by || "manager-001",
  });

  const receipt = buildInventoryBridgePairingReceipt({
    ...common,
    source_device_id: request.source_device_id,
    device_status: trustedDevice.status,
    trusted: true,
    linked_device_ref: trustedDevice.device_id,
    reviewed_by: trustedDevice.paired_by,
    reviewed_at: trustedDevice.paired_at,
  });

  return { offer, request, pendingDevice, trustedDevice, receipt };
}

export function verifyValidPairingOfferScenario() {
  const { offer } = buildValidPairingScenario();
  const validation = validateInventoryBridgePairingOffer(offer, { environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE });
  const summary = getInventoryBridgePairingOfferSafeSummary(offer);

  return summarizeAssertions([
    expect("valid offer passes validation", validation.ok === true, { validation }),
    expect("valid offer result code is PAIRING_OFFER_VALID", validation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_OFFER_VALID, { code: validation.code }),
    expect("safe offer summary includes redaction target", summary.pairing_ref !== offer.pairing_ref, { summary }),
    expect("offer is clearly prototype cloud relay by default", offer.prototype_transport === true && offer.transport_note?.includes("not a local LAN bridge"), { offer }),
  ]);
}

export function verifyExpiredPairingOfferScenario() {
  const offer = buildInventoryBridgePairingOffer({
    environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE,
    store_id: "STORE-001",
    inventory_instance_id: "INV-INSTANCE-001",
    issued_at: pastIso(10),
    expires_at: pastIso(5),
  });
  const validation = validateInventoryBridgePairingOffer(offer, { environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE });

  return summarizeAssertions([
    expect("expired offer fails validation", validation.ok === false, { validation }),
    expect("expired offer result code is PAIRING_OFFER_EXPIRED", validation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_OFFER_EXPIRED, { code: validation.code }),
  ]);
}

export function verifyEnvironmentMismatchScenario() {
  const { offer, request } = buildValidPairingScenario({ environment: INVENTORY_BRIDGE_ENVIRONMENT.TRAINING });
  const offerValidation = validateInventoryBridgePairingOffer(offer, { environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE });
  const requestValidation = validateInventoryBridgePairingRequest(request, { environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE });

  return summarizeAssertions([
    expect("environment mismatch rejects offer", offerValidation.ok === false, { offerValidation }),
    expect("environment mismatch rejects request", requestValidation.ok === false, { requestValidation }),
    expect("offer mismatch code is PAIRING_ENVIRONMENT_MISMATCH", offerValidation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_ENVIRONMENT_MISMATCH, { code: offerValidation.code }),
    expect("request mismatch code is PAIRING_ENVIRONMENT_MISMATCH", requestValidation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_ENVIRONMENT_MISMATCH, { code: requestValidation.code }),
  ]);
}

export function verifyProtocolMismatchScenario() {
  const offer = buildInventoryBridgePairingOffer({
    bridge_protocol_version: "0.9.0",
    store_id: "STORE-001",
    inventory_instance_id: "INV-INSTANCE-001",
  });
  const request = buildInventoryBridgePairingRequest({
    bridge_protocol_version: "0.9.0",
    source_device_id: "SCANOPS-DEVICE-001",
    device_name: "ScanOps Handheld 001",
  });
  const offerValidation = validateInventoryBridgePairingOffer(offer);
  const requestValidation = validateInventoryBridgePairingRequest(request);

  return summarizeAssertions([
    expect("protocol mismatch rejects offer", offerValidation.ok === false, { offerValidation }),
    expect("protocol mismatch rejects request", requestValidation.ok === false, { requestValidation }),
    expect("offer mismatch code is PAIRING_PROTOCOL_MISMATCH", offerValidation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_PROTOCOL_MISMATCH, { code: offerValidation.code }),
    expect("request mismatch code is PAIRING_PROTOCOL_MISMATCH", requestValidation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_PROTOCOL_MISMATCH, { code: requestValidation.code }),
  ]);
}

export function verifyValidPairingRequestScenario() {
  const { request } = buildValidPairingScenario();
  const validation = validateInventoryBridgePairingRequest(request, { environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE });
  const summary = getInventoryBridgePairingRequestSafeSummary(request);

  return summarizeAssertions([
    expect("valid request passes validation", validation.ok === true, { validation }),
    expect("valid request result code is PAIRING_REQUEST_VALID", validation.code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_REQUEST_VALID, { code: validation.code }),
    expect("request source_system is scanops", request.source_system === "scanops", { source_system: request.source_system }),
    expect("safe request summary redacts pairing ref", summary.pairing_ref !== request.pairing_ref, { summary }),
  ]);
}

export function verifyDeviceRegistryDecisionScenario() {
  const { request, pendingDevice, trustedDevice } = buildValidPairingScenario();
  const pendingDecision = decideInventoryBridgeDeviceAccess(pendingDevice, {
    source_device_id: request.source_device_id,
    environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE,
  });
  const trustedDecision = decideInventoryBridgeDeviceAccess(trustedDevice, {
    source_device_id: request.source_device_id,
    environment: INVENTORY_BRIDGE_ENVIRONMENT.LIVE,
  });
  const trustedValidation = validateInventoryBridgeDeviceRecord(trustedDevice);
  const trustedSummary = getInventoryBridgeDeviceSafeSummary(trustedDevice);

  return summarizeAssertions([
    expect("pending device is not allowed", pendingDecision.allowed === false, { pendingDecision }),
    expect("pending device decision is DEVICE_PENDING_APPROVAL", pendingDecision.decision_code === INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_PENDING_APPROVAL, { code: pendingDecision.decision_code }),
    expect("trusted device validates", trustedValidation.ok === true, { trustedValidation }),
    expect("trusted device is trusted", isInventoryBridgeDeviceTrusted(trustedDevice, INVENTORY_BRIDGE_ENVIRONMENT.LIVE) === true, { trustedDevice }),
    expect("trusted device is allowed for transport", trustedDecision.allowed === true, { trustedDecision }),
    expect("safe device summary redacts pairing ref", trustedSummary.pairing_ref !== trustedDevice.pairing_ref, { trustedSummary }),
  ]);
}

export function verifyPairingReceiptScenario() {
  const { receipt, trustedDevice } = buildValidPairingScenario();
  const summary = getInventoryBridgePairingReceiptSafeSummary(receipt);

  return summarizeAssertions([
    expect("trusted receipt has TRUSTED pairing status", receipt.pairing_status === INVENTORY_BRIDGE_PAIRING_STATUS.TRUSTED, { receipt }),
    expect("trusted receipt result code is DEVICE_TRUSTED", receipt.result_code === INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_TRUSTED, { result_code: receipt.result_code }),
    expect("receipt links back to device ref", receipt.linked_device_ref === trustedDevice.device_id, { receipt, trustedDevice }),
    expect("safe receipt summary redacts pairing ref", summary.pairing_ref !== receipt.pairing_ref, { summary }),
    expect("receipt decision warns ingestion still validates", receipt.decision_message.includes("Ingestion validation still runs"), { message: receipt.decision_message }),
  ]);
}

export function verifyNoPairingOperationalMutationScenario() {
  const deviceMutation = assertNoInventoryBridgeDeviceOperationalMutation();
  const pairingMutation = assertNoInventoryBridgePairingOperationalMutation();

  return summarizeAssertions([
    expect("device registry helper remains schema-only", deviceMutation.schema_only === true, { deviceMutation }),
    expect("pairing helper remains contracts-only", pairingMutation.contracts_only === true, { pairingMutation }),
    expect("no API calls", deviceMutation.no_api_calls === true && pairingMutation.no_api_calls === true, { deviceMutation, pairingMutation }),
    expect("no entity writes", deviceMutation.no_entity_writes === true && pairingMutation.no_entity_writes === true, { deviceMutation, pairingMutation }),
    expect("no relay enforcement", deviceMutation.no_relay_enforcement === true && pairingMutation.no_relay_enforcement === true, { deviceMutation, pairingMutation }),
    expect("no UI", deviceMutation.no_ui === true && pairingMutation.no_ui === true, { deviceMutation, pairingMutation }),
    expect("no operational mutations", deviceMutation.no_stock_mutation === true && pairingMutation.no_stock_mutation === true && pairingMutation.no_price_mutation === true && pairingMutation.no_pos_mutation === true, { deviceMutation, pairingMutation }),
  ]);
}

export function runInventoryBridgePairingVerificationScenarios() {
  const scenarios = [
    { key: "valid_offer", result: verifyValidPairingOfferScenario() },
    { key: "expired_offer", result: verifyExpiredPairingOfferScenario() },
    { key: "environment_mismatch", result: verifyEnvironmentMismatchScenario() },
    { key: "protocol_mismatch", result: verifyProtocolMismatchScenario() },
    { key: "valid_request", result: verifyValidPairingRequestScenario() },
    { key: "device_registry_decision", result: verifyDeviceRegistryDecisionScenario() },
    { key: "pairing_receipt", result: verifyPairingReceiptScenario() },
    { key: "no_operational_mutation", result: verifyNoPairingOperationalMutationScenario() },
  ];

  const failed = scenarios.filter((scenario) => !scenario.result.ok);
  return {
    ok: failed.length === 0,
    phase: "1D-D-D",
    description: "Inventory bridge pairing verification helpers — pure contract tests only.",
    total_scenarios: scenarios.length,
    passed_scenarios: scenarios.length - failed.length,
    failed_scenarios: failed.length,
    scenarios,
    guardrails: {
      no_backend_pairing_function: true,
      no_relay_enforcement: true,
      no_entity_writes: true,
      no_ui: true,
      no_stock_mutation: true,
      no_price_mutation: true,
      no_pos_order_forecast_mutation: true,
      no_item_master_mutation: true,
      ingestion_validation_still_required_per_event: true,
      base44_cloud_relay_not_lan_bridge: true,
    },
  };
}
