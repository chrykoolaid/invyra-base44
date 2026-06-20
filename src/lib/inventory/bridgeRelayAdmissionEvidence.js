/**
 * bridgeRelayAdmissionEvidence.js — Inventory Phase 1D-D-U
 *
 * Relay admission evidence projection for the ScanOps ↔ Inventory Bridge v1.
 *
 * Scope for this phase:
 * - Projection-only helper for the future relay enforcement layer.
 * - Converts an Inventory relay trust decision into a non-authoritative evidence
 *   envelope that can be validated locally.
 * - Does not enforce relay trust, start relay transport, sync events, ingest
 *   events, write entities, or mutate Inventory state.
 *
 * Hard guardrails:
 * - Transport admission evidence is not relay enforcement.
 * - Transport trust does not equal ingestion trust.
 * - Event ingestion validation remains required per future event.
 * - No stock, price, POS, order, forecast, Item Master, StockMovement,
 *   POSLineItem, PurchaseOrder, Wastage, or multi-location mutation.
 */

import {
  decideInventoryBridgeDeviceAccess,
  getInventoryBridgeDeviceSafeSummary,
} from "./bridgeDeviceRegistry";

export const INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_PHASE = "1D-D-U";
export const INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_SCHEMA_VERSION = "1.0.0";
export const INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CONTRACT_VERSION = "1.0.0";
export const INVENTORY_BRIDGE_RELAY_ADMISSION_PROTOCOL_VERSION = "1.0.0";

export const INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE = Object.freeze({
  PROJECTED: "RELAY_ADMISSION_EVIDENCE_PROJECTED",
  CONTEXT_INVALID: "RELAY_ADMISSION_CONTEXT_INVALID",
  DEVICE_ID_MISMATCH: "DEVICE_ID_MISMATCH",
  STORE_SCOPE_MISMATCH: "STORE_SCOPE_MISMATCH",
  INVENTORY_INSTANCE_SCOPE_MISMATCH: "INVENTORY_INSTANCE_SCOPE_MISMATCH",
});

export const INVENTORY_BRIDGE_RELAY_ADMISSION_REQUIRED_CONTEXT_FIELDS = Object.freeze([
  "source_system",
  "source_device_id",
  "environment",
  "store_id",
  "inventory_instance_id",
  "bridge_protocol_version",
  "pairing_contract_version",
]);

export const INVENTORY_BRIDGE_RELAY_ADMISSION_GUARDRAILS = Object.freeze({
  relay_admission_evidence_projection_only: true,
  local_validator_only: true,
  no_relay_enforcement: true,
  no_relay_transport: true,
  no_event_transport: true,
  no_event_ingestion: true,
  no_process_inbound_call: true,
  no_entity_writes: true,
  no_device_registry_writes: true,
  no_inventory_sync_inbound_event_writes: true,
  no_inventory_sync_receipt_writes: true,
  no_live_pairing: true,
  no_ui: true,
  no_sync_enablement: true,
  no_stock_mutation: true,
  no_price_mutation: true,
  no_pos_order_forecast_mutation: true,
  no_item_master_mutation: true,
  ingestion_validation_still_required_per_event: true,
  base44_cloud_relay_not_lan_bridge: true,
});

function nowIso() {
  return new Date().toISOString();
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

function normalizeContext(input = {}) {
  const context = parseJsonMaybe(input) || {};
  return {
    source_system: context.source_system || null,
    source_device_id: context.source_device_id || null,
    environment: context.environment || null,
    store_id: context.store_id || null,
    inventory_instance_id: context.inventory_instance_id || null,
    bridge_protocol_version: context.bridge_protocol_version || null,
    pairing_contract_version: context.pairing_contract_version || null,
    relay_instance_ref: context.relay_instance_ref || null,
    projected_at: context.projected_at || null,
  };
}

function buildDeniedAccess(code, message) {
  return {
    allowed: false,
    decision_code: code,
    decision_message: message,
  };
}

function validateDeviceRecordScope(record, context) {
  if (!record) return { ok: true, code: "DEVICE_SCOPE_NOT_APPLICABLE" };
  if (record.device_id !== context.source_device_id) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE.DEVICE_ID_MISMATCH,
      message: "Device record id does not match relay source_device_id.",
    };
  }
  if (record.store_id !== context.store_id) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE.STORE_SCOPE_MISMATCH,
      message: "Device record store_id does not match relay context store_id.",
    };
  }
  if (record.inventory_instance_id !== context.inventory_instance_id) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE.INVENTORY_INSTANCE_SCOPE_MISMATCH,
      message: "Device record inventory_instance_id does not match relay context inventory_instance_id.",
    };
  }
  return { ok: true, code: "DEVICE_SCOPE_MATCHED" };
}

function buildEvidence({ context, access, allowedForBridgeTransport, projectedAt, record }) {
  return {
    schema_version: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_SCHEMA_VERSION,
    phase: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_PHASE,
    bridge_protocol_version: INVENTORY_BRIDGE_RELAY_ADMISSION_PROTOCOL_VERSION,
    pairing_contract_version: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CONTRACT_VERSION,
    source_system: context.source_system,
    source_device_id: context.source_device_id,
    environment: context.environment,
    store_id: context.store_id,
    inventory_instance_id: context.inventory_instance_id,
    relay_instance_ref: context.relay_instance_ref,
    relay_decision_code: access.decision_code,
    relay_decision_message: access.decision_message,
    allowed_for_bridge_transport: allowedForBridgeTransport,
    relay_enforcement_applied: false,
    relay_transport_started: false,
    event_transport_enabled: false,
    event_ingestion_allowed: false,
    ingestion_validation_still_required_per_event: true,
    inventory_mutation_allowed: false,
    stock_mutation_allowed: false,
    price_mutation_allowed: false,
    pos_order_forecast_mutation_allowed: false,
    item_master_mutation_allowed: false,
    evidence_projection_only: true,
    projected_at: projectedAt,
    device_summary: record ? getInventoryBridgeDeviceSafeSummary(record) : null,
  };
}

export function validateInventoryBridgeRelayAdmissionContext(input = {}) {
  const context = normalizeContext(input);
  const errors = [];

  for (const field of INVENTORY_BRIDGE_RELAY_ADMISSION_REQUIRED_CONTEXT_FIELDS) {
    if (!context[field]) errors.push(`Missing ${field}.`);
  }

  if (context.source_system && context.source_system !== "scanops") {
    errors.push("source_system must be scanops.");
  }

  if (
    context.bridge_protocol_version &&
    context.bridge_protocol_version !== INVENTORY_BRIDGE_RELAY_ADMISSION_PROTOCOL_VERSION
  ) {
    errors.push(`Bridge protocol mismatch. Expected ${INVENTORY_BRIDGE_RELAY_ADMISSION_PROTOCOL_VERSION}.`);
  }

  if (
    context.pairing_contract_version &&
    context.pairing_contract_version !== INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CONTRACT_VERSION
  ) {
    errors.push(`Pairing contract mismatch. Expected ${INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CONTRACT_VERSION}.`);
  }

  return {
    ok: errors.length === 0,
    code: errors.length === 0
      ? "RELAY_ADMISSION_CONTEXT_VALID"
      : INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE.CONTEXT_INVALID,
    errors,
    context,
  };
}

export function projectInventoryBridgeRelayAdmissionEvidence(record = null, contextInput = {}, options = {}) {
  const contextValidation = validateInventoryBridgeRelayAdmissionContext(contextInput);
  if (!contextValidation.ok) {
    return {
      ok: false,
      code: INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE.CONTEXT_INVALID,
      allowed_for_bridge_transport: false,
      evidence: null,
      context_validation: contextValidation,
      scope_validation: null,
      guardrails: INVENTORY_BRIDGE_RELAY_ADMISSION_GUARDRAILS,
    };
  }

  const context = contextValidation.context;
  const projectedAt = options.projected_at || context.projected_at || nowIso();
  const scopeValidation = validateDeviceRecordScope(record, context);

  if (!scopeValidation.ok) {
    const access = buildDeniedAccess(scopeValidation.code, scopeValidation.message);
    const evidence = buildEvidence({
      context,
      access,
      allowedForBridgeTransport: false,
      projectedAt,
      record,
    });

    return {
      ok: false,
      code: scopeValidation.code,
      allowed_for_bridge_transport: false,
      evidence,
      access,
      context_validation: contextValidation,
      scope_validation: scopeValidation,
      guardrails: INVENTORY_BRIDGE_RELAY_ADMISSION_GUARDRAILS,
    };
  }

  const access = decideInventoryBridgeDeviceAccess(record, context);
  const allowedForBridgeTransport = access.allowed === true;
  const evidence = buildEvidence({
    context,
    access,
    allowedForBridgeTransport,
    projectedAt,
    record,
  });

  return {
    ok: allowedForBridgeTransport,
    code: allowedForBridgeTransport
      ? INVENTORY_BRIDGE_RELAY_ADMISSION_EVIDENCE_CODE.PROJECTED
      : access.decision_code,
    allowed_for_bridge_transport: allowedForBridgeTransport,
    evidence,
    access,
    context_validation: contextValidation,
    scope_validation: scopeValidation,
    guardrails: INVENTORY_BRIDGE_RELAY_ADMISSION_GUARDRAILS,
  };
}

export function getInventoryBridgeRelayAdmissionEvidenceSafeSummary(input = {}) {
  const evidence = parseJsonMaybe(input) || {};
  return {
    schema_version: evidence.schema_version || null,
    phase: evidence.phase || null,
    bridge_protocol_version: evidence.bridge_protocol_version || null,
    pairing_contract_version: evidence.pairing_contract_version || null,
    source_system: evidence.source_system || null,
    source_device_id: evidence.source_device_id || null,
    environment: evidence.environment || null,
    store_id: evidence.store_id || null,
    inventory_instance_id: evidence.inventory_instance_id || null,
    relay_instance_ref: evidence.relay_instance_ref || null,
    relay_decision_code: evidence.relay_decision_code || null,
    allowed_for_bridge_transport: evidence.allowed_for_bridge_transport ?? null,
    relay_enforcement_applied: evidence.relay_enforcement_applied ?? null,
    relay_transport_started: evidence.relay_transport_started ?? null,
    event_transport_enabled: evidence.event_transport_enabled ?? null,
    event_ingestion_allowed: evidence.event_ingestion_allowed ?? null,
    ingestion_validation_still_required_per_event: evidence.ingestion_validation_still_required_per_event ?? null,
    evidence_projection_only: evidence.evidence_projection_only ?? null,
    projected_at: evidence.projected_at || null,
  };
}

export function assertNoInventoryBridgeRelayAdmissionEvidenceOperationalMutation() {
  return INVENTORY_BRIDGE_RELAY_ADMISSION_GUARDRAILS;
}
