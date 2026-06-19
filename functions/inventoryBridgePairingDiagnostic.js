/**
 * inventoryBridgePairingDiagnostic.js — Inventory Phase 1D-D-F
 *
 * Admin-only backend diagnostic wrapper for the ScanOps ↔ Inventory Bridge v1
 * pairing verification runner.
 *
 * Scope for this phase:
 * - Backend diagnostic function only.
 * - Requires authenticated Admin/Owner actor context.
 * - Calls the locked source diagnostic runner from Phase 1D-D-E.
 * - Returns a structured diagnostic report.
 * - Does not perform live device pairing, registry writes, relay enforcement,
 *   UI work, or operational Inventory mutation.
 *
 * Architecture rule:
 * - Transport trust does not equal ingestion trust.
 * - Future paired transport must still leave every captured event subject to
 *   per-event ingestion validation before Inventory state can change.
 */

import {
  INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION,
  INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_NAME,
  INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS,
  INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_VERSION,
  runInventoryBridgePairingVerificationDiagnostic,
  verifyPairingDiagnosticAccess,
} from "../src/lib/inventory/bridgePairingVerificationDiagnostic";

export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_BACKEND_PHASE = "1D-D-F";
export const INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_SOURCE_RUNNER_PHASE = "1D-D-E";

function nowIso() {
  return new Date().toISOString();
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (typeof body !== "string") return {};

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function normalizePayload(input = {}) {
  const body = parseBody(input.body);
  return {
    ...input,
    body,
  };
}

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "owner") return "Owner";
  return role || null;
}

function normalizeActor(actor = {}) {
  if (!actor || typeof actor !== "object" || !Object.keys(actor).length) {
    return {};
  }

  return {
    ...actor,
    role: normalizeRole(actor.role || actor.user_role || actor.permission_role || actor.account_role),
  };
}

function extractActor(payload = {}) {
  const actor =
    payload.actor ||
    payload.authenticated_actor ||
    payload.user ||
    payload.auth?.user ||
    payload.context?.actor ||
    payload.context?.user ||
    payload.requestContext?.authorizer?.actor ||
    payload.requestContext?.authorizer?.user ||
    payload.body?.actor ||
    payload.body?.user ||
    {};

  return normalizeActor(actor);
}

function extractEnvironment(payload = {}) {
  return String(
    payload.environment ||
      payload.body?.environment ||
      payload.context?.environment ||
      payload.requestContext?.stage ||
      "LIVE"
  ).toUpperCase();
}

function buildRejectedAuthResponse(access, context = {}) {
  return {
    ok: false,
    diagnostic_name: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_NAME,
    diagnostic_version: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_VERSION,
    phase: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_BACKEND_PHASE,
    status: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS.REJECTED_AUTH,
    decision_code: access?.decision_code || INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_DECISION.MISSING_ACTOR,
    decision_message: access?.decision_message || "Admin diagnostic requires an authenticated actor.",
    ran_at: context.ran_at || nowIso(),
    actor: access?.actor || null,
    environment: context.environment || "LIVE",
    guardrails: {
      no_verification_run_without_admin: true,
      no_entity_writes: true,
      no_operational_mutation: true,
    },
  };
}

function buildBackendDiagnosticReport(sourceReport, context = {}) {
  const verification = sourceReport?.verification || {};

  return {
    ok: sourceReport?.ok === true,
    diagnostic_name: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_NAME,
    diagnostic_version: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_VERSION,
    phase: INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_BACKEND_PHASE,
    status: sourceReport?.status || INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_STATUS.FAILED,
    source_runner_phase: sourceReport?.phase || INVENTORY_BRIDGE_PAIRING_DIAGNOSTIC_SOURCE_RUNNER_PHASE,
    source_runner_status: sourceReport?.status || null,
    ran_at: sourceReport?.ran_at || context.ran_at || nowIso(),
    ran_by: sourceReport?.ran_by || context.actor || null,
    environment: sourceReport?.environment || context.environment || "LIVE",
    verification: {
      ok: verification.ok === true,
      total_scenarios: verification.total_scenarios || 0,
      passed_scenarios: verification.passed_scenarios || 0,
      failed_scenarios: verification.failed_scenarios || 0,
      scenarios: verification.scenarios || [],
    },
    guardrails: {
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
    },
  };
}

export function runInventoryBridgePairingDiagnosticBackend(input = {}) {
  const payload = normalizePayload(input);
  const actor = extractActor(payload);
  const environment = extractEnvironment(payload);
  const ranAt = nowIso();
  const access = verifyPairingDiagnosticAccess(actor);

  if (!access.ok) {
    return buildRejectedAuthResponse(access, {
      environment,
      ran_at: ranAt,
    });
  }

  const sourceReport = runInventoryBridgePairingVerificationDiagnostic({
    actor,
    environment,
  });

  return buildBackendDiagnosticReport(sourceReport, {
    actor: access.actor,
    environment,
    ran_at: ranAt,
  });
}

export async function handler(event = {}) {
  return runInventoryBridgePairingDiagnosticBackend(event);
}

export default handler;
