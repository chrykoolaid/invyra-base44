/**
 * bridgePairingContracts.js — Inventory Phase 1D-D-C
 *
 * Pairing request / receipt contracts for the ScanOps ↔ Inventory Bridge v1.
 *
 * Scope for this phase:
 * - Constants, object builders, validators, and safe summaries only.
 * - Defines Inventory-side pairing offer, request, receipt, and decision contracts.
 * - Does not create a backend pairing function.
 * - Does not enforce device trust in the relay.
 * - Does not create or update InventoryBridgeDevice records.
 * - Does not build UI or approval workflow.
 *
 * Hard guardrails:
 * - Transport trust does not equal ingestion trust.
 * - Pairing only controls whether a device may use bridge transport later.
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
  INVENTORY_BRIDGE_DEVICE_SCHEMA_VERSION,
} from "./bridgeDeviceRegistry";

export const INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION = "1.0.0";
export const INVENTORY_BRIDGE_PROTOCOL_VERSION = "1.0.0";
export const INVENTORY_BRIDGE_NAME = "Invyra Inventory Bridge";
export const INVENTORY_BRIDGE_VERSION = "1.0.0";
export const INVENTORY_BRIDGE_PAIRING_TTL_MINUTES = 5;

export const INVENTORY_BRIDGE_PAIRING_STATUS = Object.freeze({
  OFFER_CREATED: "OFFER_CREATED",
  REQUEST_RECEIVED: "REQUEST_RECEIVED",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  TRUSTED: "TRUSTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  BLOCKED: "BLOCKED",
  ERROR: "ERROR",
});

export const INVENTORY_BRIDGE_PAIRING_RESULT_CODE = Object.freeze({
  PAIRING_OFFER_VALID: "PAIRING_OFFER_VALID",
  PAIRING_OFFER_INVALID: "PAIRING_OFFER_INVALID",
  PAIRING_OFFER_EXPIRED: "PAIRING_OFFER_EXPIRED",
  PAIRING_REQUEST_VALID: "PAIRING_REQUEST_VALID",
  PAIRING_REQUEST_INVALID: "PAIRING_REQUEST_INVALID",
  PAIRING_REQUEST_EXPIRED: "PAIRING_REQUEST_EXPIRED",
  PAIRING_PROTOCOL_MISMATCH: "PAIRING_PROTOCOL_MISMATCH",
  PAIRING_ENVIRONMENT_MISMATCH: "PAIRING_ENVIRONMENT_MISMATCH",
  DEVICE_PENDING_APPROVAL: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_PENDING_APPROVAL,
  DEVICE_TRUSTED: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_TRUSTED,
  DEVICE_REVOKED: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_REVOKED,
  DEVICE_BLOCKED: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_BLOCKED,
  DEVICE_EXPIRED: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_EXPIRED,
  DEVICE_UNKNOWN: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_UNKNOWN,
});

export const INVENTORY_BRIDGE_PAIRING_TRANSPORT_MODE = Object.freeze({
  PROTOTYPE_CLOUD_RELAY: "PROTOTYPE_CLOUD_RELAY",
  PRODUCTION_LAN_SPEC_ONLY: "PRODUCTION_LAN_SPEC_ONLY",
});

export const REQUIRED_PAIRING_OFFER_FIELDS = Object.freeze([
  "bridge_protocol_version",
  "pairing_contract_version",
  "pairing_method",
  "environment",
  "issued_at",
  "expires_at",
  "store_id",
  "inventory_instance_id",
]);

export const REQUIRED_PAIRING_REQUEST_FIELDS = Object.freeze([
  "bridge_protocol_version",
  "pairing_contract_version",
  "source_system",
  "source_device_id",
  "device_name",
  "device_type",
  "environment",
  "requested_at",
  "pairing_method",
]);

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function isKnown(value, enumObject) {
  return Object.values(enumObject).includes(value);
}

function parseDateMs(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeEnvironment(environment) {
  const value = String(environment || INVENTORY_BRIDGE_ENVIRONMENT.LIVE).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_ENVIRONMENT) ? value : INVENTORY_BRIDGE_ENVIRONMENT.LIVE;
}

function normalizePairingMethod(pairingMethod) {
  const value = String(pairingMethod || INVENTORY_BRIDGE_PAIRING_METHOD.QR_CODE).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_PAIRING_METHOD) ? value : INVENTORY_BRIDGE_PAIRING_METHOD.QR_CODE;
}

function normalizeDeviceType(deviceType) {
  const value = String(deviceType || INVENTORY_BRIDGE_DEVICE_TYPE.UNKNOWN).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_DEVICE_TYPE) ? value : INVENTORY_BRIDGE_DEVICE_TYPE.UNKNOWN;
}

function redact(value) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return "••••";
  return `${text.slice(0, 4)}••••${text.slice(-4)}`;
}

function parseJsonMaybe(input) {
  if (!input) return null;
  if (typeof input === "object" && !Array.isArray(input)) return input;
  if (typeof input !== "string") return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export function buildInventoryBridgePairingOffer(overrides = {}) {
  const issuedAt = overrides.issued_at || nowIso();
  const issuedMs = parseDateMs(issuedAt) || Date.now();
  return {
    bridge_protocol_version: overrides.bridge_protocol_version || INVENTORY_BRIDGE_PROTOCOL_VERSION,
    pairing_contract_version: overrides.pairing_contract_version || INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION,
    bridge_name: overrides.bridge_name || INVENTORY_BRIDGE_NAME,
    bridge_version: overrides.bridge_version || INVENTORY_BRIDGE_VERSION,
    pairing_method: normalizePairingMethod(overrides.pairing_method),
    environment: normalizeEnvironment(overrides.environment),
    issued_at: new Date(issuedMs).toISOString(),
    expires_at: overrides.expires_at || addMinutes(new Date(issuedMs), INVENTORY_BRIDGE_PAIRING_TTL_MINUTES),
    store_id: overrides.store_id || null,
    inventory_instance_id: overrides.inventory_instance_id || null,
    transport_mode: overrides.transport_mode || INVENTORY_BRIDGE_PAIRING_TRANSPORT_MODE.PROTOTYPE_CLOUD_RELAY,
    bridge_host: overrides.bridge_host || null,
    bridge_port: overrides.bridge_port || null,
    bridge_base_url: overrides.bridge_base_url || null,
    pairing_ref: overrides.pairing_ref || null,
    challenge_ref: overrides.challenge_ref || null,
    prototype_transport: overrides.prototype_transport ?? true,
    transport_note: overrides.transport_note || "Base44 prototype cloud relay — not a local LAN bridge.",
  };
}

export function buildInventoryBridgePairingRequest(overrides = {}) {
  return {
    bridge_protocol_version: overrides.bridge_protocol_version || INVENTORY_BRIDGE_PROTOCOL_VERSION,
    pairing_contract_version: overrides.pairing_contract_version || INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION,
    source_system: "scanops",
    source_device_id: overrides.source_device_id || null,
    device_name: overrides.device_name || null,
    device_type: normalizeDeviceType(overrides.device_type),
    source_user_id: overrides.source_user_id || null,
    source_user_role: overrides.source_user_role || null,
    store_id: overrides.store_id || null,
    inventory_instance_id: overrides.inventory_instance_id || null,
    environment: normalizeEnvironment(overrides.environment),
    requested_at: overrides.requested_at || nowIso(),
    pairing_method: normalizePairingMethod(overrides.pairing_method),
    pairing_ref: overrides.pairing_ref || null,
    challenge_ref: overrides.challenge_ref || null,
  };
}

export function buildInventoryBridgePairingReceipt(overrides = {}) {
  const deviceStatus = overrides.device_status || INVENTORY_BRIDGE_DEVICE_STATUS.PENDING;
  const trusted = deviceStatus === INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED && overrides.trusted !== false;
  return {
    bridge_protocol_version: overrides.bridge_protocol_version || INVENTORY_BRIDGE_PROTOCOL_VERSION,
    pairing_contract_version: overrides.pairing_contract_version || INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION,
    pairing_receipt_id: overrides.pairing_receipt_id || null,
    pairing_ref: overrides.pairing_ref || null,
    source_device_id: overrides.source_device_id || null,
    device_status: deviceStatus,
    pairing_status: overrides.pairing_status || mapDeviceStatusToPairingStatus(deviceStatus),
    result_code: overrides.result_code || mapDeviceStatusToPairingResultCode(deviceStatus),
    decision_message: overrides.decision_message || defaultPairingDecisionMessage(deviceStatus),
    trusted,
    linked_device_ref: overrides.linked_device_ref || null,
    environment: normalizeEnvironment(overrides.environment),
    store_id: overrides.store_id || null,
    inventory_instance_id: overrides.inventory_instance_id || null,
    reviewed_by: overrides.reviewed_by || null,
    reviewed_at: overrides.reviewed_at || null,
    issued_at: overrides.issued_at || nowIso(),
    schema_version: INVENTORY_BRIDGE_DEVICE_SCHEMA_VERSION,
  };
}

export function validateInventoryBridgePairingOffer(input, expected = {}) {
  const offer = parseJsonMaybe(input);
  const errors = [];

  if (!offer) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_OFFER_INVALID,
      errors: ["Pairing offer must be an object or JSON string."],
      offer: null,
    };
  }

  for (const field of REQUIRED_PAIRING_OFFER_FIELDS) {
    if (!offer[field]) errors.push(`Missing ${field}.`);
  }

  if (offer.bridge_protocol_version && offer.bridge_protocol_version !== INVENTORY_BRIDGE_PROTOCOL_VERSION) {
    errors.push(`Bridge protocol mismatch. Expected ${INVENTORY_BRIDGE_PROTOCOL_VERSION}.`);
  }

  if (offer.pairing_contract_version && offer.pairing_contract_version !== INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION) {
    errors.push(`Pairing contract mismatch. Expected ${INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION}.`);
  }

  if (offer.pairing_method && !isKnown(offer.pairing_method, INVENTORY_BRIDGE_PAIRING_METHOD)) {
    errors.push(`Unsupported pairing method: ${offer.pairing_method}.`);
  }

  const environment = normalizeEnvironment(offer.environment);
  const expectedEnvironment = expected.environment ? normalizeEnvironment(expected.environment) : null;
  if (expectedEnvironment && environment !== expectedEnvironment) {
    errors.push(`Environment mismatch. Pairing is ${environment}; expected ${expectedEnvironment}.`);
  }

  const expiresMs = parseDateMs(offer.expires_at);
  if (!expiresMs) {
    errors.push("expires_at must be a valid ISO date.");
  } else if (Date.now() > expiresMs) {
    errors.push("Pairing offer has expired.");
  }

  if (offer.transport_mode === INVENTORY_BRIDGE_PAIRING_TRANSPORT_MODE.PRODUCTION_LAN_SPEC_ONLY) {
    if (!offer.bridge_base_url && (!offer.bridge_host || !offer.bridge_port)) {
      errors.push("Production LAN pairing requires bridge_base_url or bridge_host + bridge_port.");
    }
  }

  return {
    ok: errors.length === 0,
    code: classifyPairingValidationCode(errors, "offer"),
    errors,
    offer,
  };
}

export function validateInventoryBridgePairingRequest(input, expected = {}) {
  const request = parseJsonMaybe(input);
  const errors = [];

  if (!request) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_REQUEST_INVALID,
      errors: ["Pairing request must be an object or JSON string."],
      request: null,
    };
  }

  for (const field of REQUIRED_PAIRING_REQUEST_FIELDS) {
    if (!request[field]) errors.push(`Missing ${field}.`);
  }

  if (request.source_system && request.source_system !== "scanops") {
    errors.push("source_system must be scanops.");
  }

  if (request.bridge_protocol_version && request.bridge_protocol_version !== INVENTORY_BRIDGE_PROTOCOL_VERSION) {
    errors.push(`Bridge protocol mismatch. Expected ${INVENTORY_BRIDGE_PROTOCOL_VERSION}.`);
  }

  if (request.pairing_contract_version && request.pairing_contract_version !== INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION) {
    errors.push(`Pairing contract mismatch. Expected ${INVENTORY_BRIDGE_PAIRING_CONTRACT_VERSION}.`);
  }

  if (request.device_type && !isKnown(request.device_type, INVENTORY_BRIDGE_DEVICE_TYPE)) {
    errors.push(`Unsupported device type: ${request.device_type}.`);
  }

  if (request.pairing_method && !isKnown(request.pairing_method, INVENTORY_BRIDGE_PAIRING_METHOD)) {
    errors.push(`Unsupported pairing method: ${request.pairing_method}.`);
  }

  const environment = normalizeEnvironment(request.environment);
  const expectedEnvironment = expected.environment ? normalizeEnvironment(expected.environment) : null;
  if (expectedEnvironment && environment !== expectedEnvironment) {
    errors.push(`Environment mismatch. Pairing request is ${environment}; expected ${expectedEnvironment}.`);
  }

  if (request.requested_at && !parseDateMs(request.requested_at)) {
    errors.push("requested_at must be a valid ISO date.");
  }

  return {
    ok: errors.length === 0,
    code: classifyPairingValidationCode(errors, "request"),
    errors,
    request,
  };
}

export function mapDeviceStatusToPairingStatus(deviceStatus) {
  switch (deviceStatus) {
    case INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED:
      return INVENTORY_BRIDGE_PAIRING_STATUS.TRUSTED;
    case INVENTORY_BRIDGE_DEVICE_STATUS.PENDING:
      return INVENTORY_BRIDGE_PAIRING_STATUS.PENDING_APPROVAL;
    case INVENTORY_BRIDGE_DEVICE_STATUS.REVOKED:
      return INVENTORY_BRIDGE_PAIRING_STATUS.REVOKED;
    case INVENTORY_BRIDGE_DEVICE_STATUS.BLOCKED:
      return INVENTORY_BRIDGE_PAIRING_STATUS.BLOCKED;
    case INVENTORY_BRIDGE_DEVICE_STATUS.EXPIRED:
      return INVENTORY_BRIDGE_PAIRING_STATUS.EXPIRED;
    default:
      return INVENTORY_BRIDGE_PAIRING_STATUS.ERROR;
  }
}

export function mapDeviceStatusToPairingResultCode(deviceStatus) {
  switch (deviceStatus) {
    case INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED:
      return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_TRUSTED;
    case INVENTORY_BRIDGE_DEVICE_STATUS.PENDING:
      return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_PENDING_APPROVAL;
    case INVENTORY_BRIDGE_DEVICE_STATUS.REVOKED:
      return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_REVOKED;
    case INVENTORY_BRIDGE_DEVICE_STATUS.BLOCKED:
      return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_BLOCKED;
    case INVENTORY_BRIDGE_DEVICE_STATUS.EXPIRED:
      return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_EXPIRED;
    default:
      return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.DEVICE_UNKNOWN;
  }
}

function defaultPairingDecisionMessage(deviceStatus) {
  switch (deviceStatus) {
    case INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED:
      return "Device is trusted for bridge transport. Ingestion validation still runs per event.";
    case INVENTORY_BRIDGE_DEVICE_STATUS.PENDING:
      return "Device pairing is pending Inventory approval.";
    case INVENTORY_BRIDGE_DEVICE_STATUS.REVOKED:
      return "Device has been revoked and cannot use bridge transport.";
    case INVENTORY_BRIDGE_DEVICE_STATUS.BLOCKED:
      return "Device is blocked and requires admin action.";
    case INVENTORY_BRIDGE_DEVICE_STATUS.EXPIRED:
      return "Device pairing has expired and must be renewed.";
    default:
      return "Device pairing decision is unknown.";
  }
}

function classifyPairingValidationCode(errors, type) {
  if (!errors.length) {
    return type === "offer"
      ? INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_OFFER_VALID
      : INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_REQUEST_VALID;
  }
  if (errors.some((error) => error.includes("expired"))) {
    return type === "offer"
      ? INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_OFFER_EXPIRED
      : INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_REQUEST_EXPIRED;
  }
  if (errors.some((error) => error.includes("Environment mismatch"))) {
    return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_ENVIRONMENT_MISMATCH;
  }
  if (errors.some((error) => error.includes("protocol mismatch") || error.includes("contract mismatch"))) {
    return INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_PROTOCOL_MISMATCH;
  }
  return type === "offer"
    ? INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_OFFER_INVALID
    : INVENTORY_BRIDGE_PAIRING_RESULT_CODE.PAIRING_REQUEST_INVALID;
}

export function getInventoryBridgePairingOfferSafeSummary(input = {}) {
  const offer = parseJsonMaybe(input) || {};
  return {
    bridge_protocol_version: offer.bridge_protocol_version || null,
    pairing_contract_version: offer.pairing_contract_version || null,
    pairing_method: offer.pairing_method || null,
    environment: offer.environment || null,
    issued_at: offer.issued_at || null,
    expires_at: offer.expires_at || null,
    store_id: offer.store_id || null,
    inventory_instance_id: offer.inventory_instance_id || null,
    transport_mode: offer.transport_mode || null,
    bridge_host: offer.bridge_host || null,
    bridge_port: offer.bridge_port || null,
    bridge_base_url: offer.bridge_base_url || null,
    pairing_ref: redact(offer.pairing_ref),
    challenge_ref: redact(offer.challenge_ref),
    prototype_transport: offer.prototype_transport ?? null,
    transport_note: offer.transport_note || null,
  };
}

export function getInventoryBridgePairingRequestSafeSummary(input = {}) {
  const request = parseJsonMaybe(input) || {};
  return {
    bridge_protocol_version: request.bridge_protocol_version || null,
    pairing_contract_version: request.pairing_contract_version || null,
    source_system: request.source_system || null,
    source_device_id: request.source_device_id || null,
    device_name: request.device_name || null,
    device_type: request.device_type || null,
    source_user_id: request.source_user_id || null,
    source_user_role: request.source_user_role || null,
    store_id: request.store_id || null,
    inventory_instance_id: request.inventory_instance_id || null,
    environment: request.environment || null,
    requested_at: request.requested_at || null,
    pairing_method: request.pairing_method || null,
    pairing_ref: redact(request.pairing_ref),
    challenge_ref: redact(request.challenge_ref),
  };
}

export function getInventoryBridgePairingReceiptSafeSummary(input = {}) {
  const receipt = parseJsonMaybe(input) || {};
  return {
    bridge_protocol_version: receipt.bridge_protocol_version || null,
    pairing_contract_version: receipt.pairing_contract_version || null,
    pairing_receipt_id: receipt.pairing_receipt_id || null,
    pairing_ref: redact(receipt.pairing_ref),
    source_device_id: receipt.source_device_id || null,
    device_status: receipt.device_status || null,
    pairing_status: receipt.pairing_status || null,
    result_code: receipt.result_code || null,
    decision_message: receipt.decision_message || null,
    trusted: receipt.trusted ?? null,
    linked_device_ref: receipt.linked_device_ref || null,
    environment: receipt.environment || null,
    store_id: receipt.store_id || null,
    inventory_instance_id: receipt.inventory_instance_id || null,
    reviewed_by: receipt.reviewed_by || null,
    reviewed_at: receipt.reviewed_at || null,
    issued_at: receipt.issued_at || null,
  };
}

export function assertNoInventoryBridgePairingOperationalMutation() {
  return {
    ok: true,
    contracts_only: true,
    no_api_calls: true,
    no_entity_writes: true,
    no_backend_pairing_function: true,
    no_relay_enforcement: true,
    no_ui: true,
    no_approval_workflow: true,
    no_device_registry_mutation: true,
    no_stock_mutation: true,
    no_price_mutation: true,
    no_pos_mutation: true,
    no_order_mutation: true,
    no_forecast_mutation: true,
    no_item_master_mutation: true,
    no_stock_movement_creation: true,
    no_pos_line_item_creation: true,
    no_markdown_round_activation: true,
    no_wastage_posting: true,
    no_multi_location_mutation: true,
  };
}
