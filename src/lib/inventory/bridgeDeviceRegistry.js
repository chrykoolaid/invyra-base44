/**
 * bridgeDeviceRegistry.js — Inventory Phase 1D-D-B
 *
 * Inventory-side trusted device registry contract for the ScanOps ↔ Inventory Bridge v1.
 *
 * Scope for this phase:
 * - Constants, schema shape, validators, and non-mutating helper functions only.
 * - Defines how Inventory will represent ScanOps devices later.
 * - Does not enforce device trust in the relay yet.
 * - Does not create approval UI or device-pairing workflows.
 *
 * Hard guardrails:
 * - Transport trust does not equal ingestion trust.
 * - The relay must still pass every event through processInboundScanOpsEvent(event).
 * - No stock, price, POS, order, forecast, Item Master, StockMovement, POSLineItem,
 *   MarkdownRound, PurchaseOrder, Wastage, or multi-location mutation.
 * - Base44 prototype transport remains a cloud relay, not a local LAN bridge.
 */

export const INVENTORY_BRIDGE_DEVICE_SCHEMA_VERSION = "1.0.0";

export const INVENTORY_BRIDGE_DEVICE_STATUS = Object.freeze({
  PENDING: "PENDING",
  TRUSTED: "TRUSTED",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
  BLOCKED: "BLOCKED",
});

export const INVENTORY_BRIDGE_DEVICE_TYPE = Object.freeze({
  HANDHELD_SCANNER: "HANDHELD_SCANNER",
  TABLET: "TABLET",
  DESKTOP: "DESKTOP",
  UNKNOWN: "UNKNOWN",
});

export const INVENTORY_BRIDGE_PAIRING_METHOD = Object.freeze({
  MANUAL_IP: "MANUAL_IP",
  QR_CODE: "QR_CODE",
  ADMIN_PROVISIONED: "ADMIN_PROVISIONED",
});

export const INVENTORY_BRIDGE_ENVIRONMENT = Object.freeze({
  LIVE: "LIVE",
  TRAINING: "TRAINING",
  TEST: "TEST",
});

export const INVENTORY_BRIDGE_DEVICE_DECISION = Object.freeze({
  DEVICE_TRUSTED: "DEVICE_TRUSTED",
  DEVICE_PENDING_APPROVAL: "DEVICE_PENDING_APPROVAL",
  DEVICE_REVOKED: "DEVICE_REVOKED",
  DEVICE_BLOCKED: "DEVICE_BLOCKED",
  DEVICE_EXPIRED: "DEVICE_EXPIRED",
  DEVICE_UNKNOWN: "DEVICE_UNKNOWN",
  ENVIRONMENT_MISMATCH: "ENVIRONMENT_MISMATCH",
  SOURCE_IDENTITY_MISSING: "SOURCE_IDENTITY_MISSING",
});

export const ACTIVE_INVENTORY_BRIDGE_DEVICE_STATUSES = new Set([
  INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED,
]);

export const TERMINAL_INVENTORY_BRIDGE_DEVICE_STATUSES = new Set([
  INVENTORY_BRIDGE_DEVICE_STATUS.REVOKED,
  INVENTORY_BRIDGE_DEVICE_STATUS.BLOCKED,
]);

export const INVENTORY_BRIDGE_DEVICE_REQUIRED_FIELDS = Object.freeze([
  "device_id",
  "device_name",
  "device_type",
  "environment",
  "status",
  "trusted",
]);

export const INVENTORY_BRIDGE_DEVICE_SCHEMA = Object.freeze({
  name: "InventoryBridgeDevice",
  schema_version: INVENTORY_BRIDGE_DEVICE_SCHEMA_VERSION,
  description: "Inventory-side registry of ScanOps devices allowed to use the bridge transport. Registry trust is only a transport gate; ingestion validation still runs per event.",
  fields: {
    device_id: "string: stable ScanOps device identifier",
    device_name: "string: operator-visible device label",
    device_type: "enum: HANDHELD_SCANNER | TABLET | DESKTOP | UNKNOWN",
    environment: "enum: LIVE | TRAINING | TEST",
    store_id: "string: store/location scope",
    inventory_instance_id: "string: Inventory instance this device paired against",
    status: "enum: PENDING | TRUSTED | REVOKED | EXPIRED | BLOCKED",
    trusted: "boolean: true only when status is TRUSTED",
    pairing_method: "enum: MANUAL_IP | QR_CODE | ADMIN_PROVISIONED",
    pairing_ref: "string: non-secret pairing reference",
    pairing_token_hash: "string: hash/fingerprint only; never store raw pairing token",
    pairing_token_expires_at: "ISO date: pairing-token expiry",
    paired_at: "ISO date: first pairing time",
    paired_by: "string: user id/name who approved or provisioned pairing",
    last_seen_at: "ISO date: last bridge health/submission seen",
    last_seen_source_ip: "string: optional observed source IP for diagnostics",
    revoked_at: "ISO date: revocation time",
    revoked_by: "string: revoking user id/name",
    revoked_reason: "string: operator reason for revocation",
    blocked_at: "ISO date: security block time",
    blocked_by: "string: blocking user id/name",
    blocked_reason: "string: operator/security reason for block",
    created_at: "ISO date",
    updated_at: "ISO date",
  },
});

function nowIso() {
  return new Date().toISOString();
}

function isKnown(value, enumObject) {
  return Object.values(enumObject).includes(value);
}

function normalizeEnvironment(environment) {
  const value = String(environment || INVENTORY_BRIDGE_ENVIRONMENT.LIVE).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_ENVIRONMENT) ? value : INVENTORY_BRIDGE_ENVIRONMENT.LIVE;
}

function normalizeStatus(status) {
  const value = String(status || INVENTORY_BRIDGE_DEVICE_STATUS.PENDING).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_DEVICE_STATUS) ? value : INVENTORY_BRIDGE_DEVICE_STATUS.PENDING;
}

function normalizeDeviceType(deviceType) {
  const value = String(deviceType || INVENTORY_BRIDGE_DEVICE_TYPE.UNKNOWN).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_DEVICE_TYPE) ? value : INVENTORY_BRIDGE_DEVICE_TYPE.UNKNOWN;
}

function normalizePairingMethod(pairingMethod) {
  const value = String(pairingMethod || INVENTORY_BRIDGE_PAIRING_METHOD.MANUAL_IP).toUpperCase();
  return isKnown(value, INVENTORY_BRIDGE_PAIRING_METHOD) ? value : INVENTORY_BRIDGE_PAIRING_METHOD.MANUAL_IP;
}

function parseDateMs(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function redact(value) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return "••••";
  return `${text.slice(0, 4)}••••${text.slice(-4)}`;
}

export function buildInventoryBridgeDeviceRecord(overrides = {}) {
  const status = normalizeStatus(overrides.status);
  const createdAt = overrides.created_at || nowIso();
  return {
    schema_version: INVENTORY_BRIDGE_DEVICE_SCHEMA_VERSION,
    device_id: overrides.device_id || null,
    device_name: overrides.device_name || "Unnamed ScanOps Device",
    device_type: normalizeDeviceType(overrides.device_type),
    environment: normalizeEnvironment(overrides.environment),
    store_id: overrides.store_id || null,
    inventory_instance_id: overrides.inventory_instance_id || null,
    status,
    trusted: status === INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED && overrides.trusted !== false,
    pairing_method: normalizePairingMethod(overrides.pairing_method),
    pairing_ref: overrides.pairing_ref || null,
    pairing_token_hash: overrides.pairing_token_hash || null,
    pairing_token_expires_at: overrides.pairing_token_expires_at || null,
    paired_at: overrides.paired_at || null,
    paired_by: overrides.paired_by || null,
    last_seen_at: overrides.last_seen_at || null,
    last_seen_source_ip: overrides.last_seen_source_ip || null,
    revoked_at: overrides.revoked_at || null,
    revoked_by: overrides.revoked_by || null,
    revoked_reason: overrides.revoked_reason || null,
    blocked_at: overrides.blocked_at || null,
    blocked_by: overrides.blocked_by || null,
    blocked_reason: overrides.blocked_reason || null,
    created_at: createdAt,
    updated_at: overrides.updated_at || createdAt,
  };
}

export function validateInventoryBridgeDeviceRecord(record = {}) {
  const normalized = buildInventoryBridgeDeviceRecord(record);
  const errors = [];

  for (const field of INVENTORY_BRIDGE_DEVICE_REQUIRED_FIELDS) {
    if (normalized[field] === null || normalized[field] === undefined || normalized[field] === "") {
      errors.push(`Missing ${field}.`);
    }
  }

  if (!isKnown(normalized.status, INVENTORY_BRIDGE_DEVICE_STATUS)) {
    errors.push(`Unsupported device status: ${normalized.status}.`);
  }

  if (!isKnown(normalized.device_type, INVENTORY_BRIDGE_DEVICE_TYPE)) {
    errors.push(`Unsupported device type: ${normalized.device_type}.`);
  }

  if (!isKnown(normalized.environment, INVENTORY_BRIDGE_ENVIRONMENT)) {
    errors.push(`Unsupported bridge environment: ${normalized.environment}.`);
  }

  if (normalized.trusted && normalized.status !== INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED) {
    errors.push("trusted can only be true when status is TRUSTED.");
  }

  if (normalized.status === INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED && !normalized.paired_at) {
    errors.push("TRUSTED devices require paired_at.");
  }

  if (normalized.status === INVENTORY_BRIDGE_DEVICE_STATUS.REVOKED && !normalized.revoked_at) {
    errors.push("REVOKED devices require revoked_at.");
  }

  if (normalized.status === INVENTORY_BRIDGE_DEVICE_STATUS.BLOCKED && !normalized.blocked_at) {
    errors.push("BLOCKED devices require blocked_at.");
  }

  if (normalized.pairing_token_expires_at && !parseDateMs(normalized.pairing_token_expires_at)) {
    errors.push("pairing_token_expires_at must be a valid ISO date.");
  }

  return { ok: errors.length === 0, errors, record: normalized };
}

export function isInventoryBridgeDeviceTrusted(record = {}, expectedEnvironment = null) {
  const normalized = buildInventoryBridgeDeviceRecord(record);
  if (!normalized.device_id) return false;
  if (!ACTIVE_INVENTORY_BRIDGE_DEVICE_STATUSES.has(normalized.status)) return false;
  if (normalized.trusted !== true) return false;
  if (expectedEnvironment && normalizeEnvironment(expectedEnvironment) !== normalized.environment) return false;
  return true;
}

export function isInventoryBridgeDeviceTerminal(record = {}) {
  return TERMINAL_INVENTORY_BRIDGE_DEVICE_STATUSES.has(buildInventoryBridgeDeviceRecord(record).status);
}

export function decideInventoryBridgeDeviceAccess(record = null, context = {}) {
  const environment = normalizeEnvironment(context.environment);
  if (!context.source_device_id) {
    return {
      allowed: false,
      decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.SOURCE_IDENTITY_MISSING,
      decision_message: "source_device_id is required before Inventory can evaluate bridge device trust.",
    };
  }

  if (!record) {
    return {
      allowed: false,
      decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_UNKNOWN,
      decision_message: "Device is not registered in InventoryBridgeDevice.",
    };
  }

  const normalized = buildInventoryBridgeDeviceRecord(record);
  if (normalized.environment !== environment) {
    return {
      allowed: false,
      decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.ENVIRONMENT_MISMATCH,
      decision_message: `Device is registered for ${normalized.environment}; request is for ${environment}.`,
    };
  }

  switch (normalized.status) {
    case INVENTORY_BRIDGE_DEVICE_STATUS.TRUSTED:
      return {
        allowed: normalized.trusted === true,
        decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_TRUSTED,
        decision_message: normalized.trusted === true ? "Device is trusted for transport." : "Device status is TRUSTED but trusted flag is false.",
      };
    case INVENTORY_BRIDGE_DEVICE_STATUS.PENDING:
      return {
        allowed: false,
        decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_PENDING_APPROVAL,
        decision_message: "Device pairing is pending Inventory approval.",
      };
    case INVENTORY_BRIDGE_DEVICE_STATUS.REVOKED:
      return {
        allowed: false,
        decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_REVOKED,
        decision_message: "Device has been revoked and cannot use bridge transport.",
      };
    case INVENTORY_BRIDGE_DEVICE_STATUS.BLOCKED:
      return {
        allowed: false,
        decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_BLOCKED,
        decision_message: "Device is blocked and requires admin action.",
      };
    case INVENTORY_BRIDGE_DEVICE_STATUS.EXPIRED:
      return {
        allowed: false,
        decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_EXPIRED,
        decision_message: "Device pairing has expired and must be renewed.",
      };
    default:
      return {
        allowed: false,
        decision_code: INVENTORY_BRIDGE_DEVICE_DECISION.DEVICE_UNKNOWN,
        decision_message: "Device status is unknown.",
      };
  }
}

export function getInventoryBridgeDeviceSafeSummary(record = {}) {
  const normalized = buildInventoryBridgeDeviceRecord(record);
  return {
    device_id: normalized.device_id,
    device_name: normalized.device_name,
    device_type: normalized.device_type,
    environment: normalized.environment,
    store_id: normalized.store_id,
    inventory_instance_id: normalized.inventory_instance_id,
    status: normalized.status,
    trusted: normalized.trusted,
    pairing_method: normalized.pairing_method,
    pairing_ref: redact(normalized.pairing_ref),
    pairing_token_hash: redact(normalized.pairing_token_hash),
    paired_at: normalized.paired_at,
    paired_by: normalized.paired_by,
    last_seen_at: normalized.last_seen_at,
    revoked_at: normalized.revoked_at,
    blocked_at: normalized.blocked_at,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

export function assertNoInventoryBridgeDeviceOperationalMutation() {
  return {
    ok: true,
    schema_only: true,
    no_api_calls: true,
    no_entity_writes: true,
    no_relay_enforcement: true,
    no_ui: true,
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
