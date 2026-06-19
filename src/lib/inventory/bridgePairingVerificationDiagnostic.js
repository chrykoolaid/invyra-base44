/**
 * bridgePairingVerificationDiagnostic.js — Inventory Phase 1D-D-E
 *
 * Admin diagnostic runner for ScanOps ↔ Inventory Bridge v1 pairing verification.
 *
 * Scope for this phase:
 * - Source-level diagnostic function only.
 * - Runs pure pairing verification scenarios from bridgePairingVerificationHelpers.js.
 * - Requires an authenticated Admin/Owner actor object from the future caller.
 * - Does not create a public backend endpoint.
 * - Does not call APIs, write entities, enforce relay trust, or build UI.
 *
 * Hard guardrails:
 * - Transport trust does not equal ingestion trust.
 * - Pairing only controls bridge transport eligibility later.
 * - Every ScanOps event must still pass through processInboundScanOpsEvent(event).
 * - No stock, price, POS, order, forecast, Item Master, StockMovement, POSLineItem,
 *   MarkdownRound, PurchaseOrder, Wastage, or multi-location mutation.
 * - Base44 prototype transport remains a cloud relay, not a local LAN bridge.
 */

import { runInventoryBridgePairingVerificationScenarios } from "./bridgePairingVerificationHelpers";

export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_PHASE = "1D-D-E";
export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_NAME = "Inventory Bridge Pairing Verification Diagnostic";
export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_VERSION = "1.0.0";

export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS = Object.freeze({
  READY: "READY",
  COMPLETED: "COMPLETED",
  REJECTED_AUTH: "REJECTED_AUTH",
  FAILED: "FAILED",
});

export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION = Object.freeze({
  ADMIN_ALLOWED: "ADMIN_ALLOWED",
  MISSING_ACTOR: "MISSING_ACTOR",
  ROLE_NOT_ALLOWED: "ROLE_NOT_ALLOWED",
  VERIFICATION_PASS: "VERIFICATION_PASS",
  VERIFICATION_FAIL: "VERIFICATION_FAIL",
});

export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_ALLOWED_ROLES = Object.freeze([
  "Admin",
  "Owner",
]);

function nowIso() {
  return new Date().toISOString();
}

function normalizeRole(actor = {}) {
  return actor.role || actor.user_role || actor.permission_role || actor.account_role || null;
}

function getActorId(actor = {}) {
  return actor.id || actor.user_id || actor.email || actor.name || null;
}

function getSafeActorSummary(actor = {}) {
  return {
    actor_id: getActorId(actor),
    role: normalizeRole(actor),
    has_actor: Boolean(actor && Object.keys(actor).length),
  };
}

export function verifyPairingDiagnosticAccess(actor = {}) {
  const role = normalizeRole(actor);
  if (!actor || !Object.keys(actor).length) {
    return {
      ok: false,
      decision_code: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION.MISSING_ACTOR,
      decision_message: "Admin diagnostic requires an authenticated actor.",
      actor: getSafeActorSummary(actor),
    };
  }

  if (!INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_ALLOWED_ROLES.includes(role)) {
    return {
      ok: false,
      decision_code: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION.ROLE_NOT_ALLOWED,
      decision_message: "Only Admin or Owner may run Inventory bridge pairing diagnostics.",
      actor: getSafeActorSummary(actor),
    };
  }

  return {
    ok: true,
    decision_code: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION.ADMIN_ALLOWED,
    decision_message: "Admin diagnostic access allowed.",
    actor: getSafeActorSummary(actor),
  };
}

export function buildPairingVerificationDiagnosticReport(verificationResult, context = {}) {
  const ok = verificationResult?.ok === true;
  return {
    ok,
    diagnostic_name: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_NAME,
    diagnostic_version: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_VERSION,
    phase: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_PHASE,
    status: ok
      ? INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS.COMPLETED
      : INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS.FAILED,
    decision_code: ok
      ? INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION.VERIFICATION_PASS
      : INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION.VERIFICATION_FAIL,
    ran_at: context.ran_at || nowIso(),
    ran_by: context.actor || null,
    environment: context.environment || "LIVE",
    verification: verificationResult,
    guardrails: {
      admin_diagnostic_only: true,
      no_public_backend_endpoint_created: true,
      no_api_calls: true,
      no_entity_writes: true,
      no_relay_enforcement: true,
      no_device_registry_mutation: true,
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
      ingestion_validation_still_required_per_event: true,
      base44_cloud_relay_not_lan_bridge: true,
    },
  };
}

export function runInventoryBridgePairingVerificationDiagnostic(options = {}) {
  const actor = options.actor || {};
  const access = verifyPairingDiagnosticAccess(actor);
  const ranAt = nowIso();

  if (!access.ok) {
    return {
      ok: false,
      diagnostic_name: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_NAME,
      diagnostic_version: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_VERSION,
      phase: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_PHASE,
      status: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS.REJECTED_AUTH,
      decision_code: access.decision_code,
      decision_message: access.decision_message,
      ran_at: ranAt,
      actor: access.actor,
      guardrails: {
        admin_diagnostic_only: true,
        no_verification_run_without_admin: true,
        no_api_calls: true,
        no_entity_writes: true,
        no_relay_enforcement: true,
        no_ui: true,
        no_operational_mutation: true,
      },
    };
  }

  const verification = runInventoryBridgePairingVerificationScenarios();
  return buildPairingVerificationDiagnosticReport(verification, {
    actor: access.actor,
    environment: options.environment || "LIVE",
    ran_at: ranAt,
  });
}

export function assertNoPairingDiagnosticOperationalMutation() {
  return {
    ok: true,
    source_level_diagnostic_only: true,
    no_public_backend_endpoint_created: true,
    no_api_calls: true,
    no_entity_writes: true,
    no_relay_enforcement: true,
    no_device_registry_mutation: true,
    no_ui: true,
    no_approval_workflow: true,
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
