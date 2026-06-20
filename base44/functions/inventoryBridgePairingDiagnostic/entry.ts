/**
 * inventoryBridgePairingDiagnostic.js — Inventory Phase 1D-D-F
 *
 * Backend diagnostic function wrapper for ScanOps ↔ Inventory Bridge v1
 * pairing verification.
 *
 * Scope:
 * - Admin/Owner-only backend function wrapper.
 * - Calls the locked Phase 1D-D-E source diagnostic only after access passes.
 * - Returns a backend-shaped diagnostic report for local contract validation.
 * - Does not perform live pairing, write device registry records, enforce relay
 *   trust, call ingestion, build UI, or mutate operational Inventory state.
 */

import { runInventoryBridgePairingVerificationDiagnostic } from '../src/lib/inventory/bridgePairingVerificationDiagnostic.js';

export const INVENTORY_BRIDGE_PAIRING_BACKEND_DIAGNOSTIC_PHASE = '1D-D-F';
export const INVENTORY_BRIDGE_PAIRING_BACKEND_SOURCE_RUNNER_PHASE = '1D-D-E';

const rejectedGuardrails = Object.freeze({
  no_verification_run_without_admin: true,
  no_entity_writes: true,
  no_operational_mutation: true,
});

const backendGuardrails = Object.freeze({
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

function normalizeBackendStatus(sourceReport = {}) {
  if (sourceReport.status === 'REJECTED_AUTH') return 'REJECTED_AUTH';
  if (sourceReport.ok === true) return 'COMPLETED';
  return sourceReport.status || 'FAILED';
}

export async function runInventoryBridgePairingDiagnosticBackend(input = {}) {
  const sourceReport = runInventoryBridgePairingVerificationDiagnostic({
    actor: input.actor || {},
    environment: input.environment || 'LIVE',
  });

  if (!sourceReport.ok && sourceReport.status === 'REJECTED_AUTH') {
    return {
      ok: false,
      phase: INVENTORY_BRIDGE_PAIRING_BACKEND_DIAGNOSTIC_PHASE,
      status: 'REJECTED_AUTH',
      decision_code: sourceReport.decision_code,
      decision_message: sourceReport.decision_message,
      actor: sourceReport.actor,
      environment: input.environment || 'LIVE',
      guardrails: rejectedGuardrails,
    };
  }

  return {
    ok: sourceReport.ok === true,
    phase: INVENTORY_BRIDGE_PAIRING_BACKEND_DIAGNOSTIC_PHASE,
    source_runner_phase: INVENTORY_BRIDGE_PAIRING_BACKEND_SOURCE_RUNNER_PHASE,
    status: normalizeBackendStatus(sourceReport),
    decision_code: sourceReport.decision_code,
    diagnostic_name: sourceReport.diagnostic_name,
    diagnostic_version: sourceReport.diagnostic_version,
    ran_at: sourceReport.ran_at,
    ran_by: sourceReport.ran_by,
    environment: sourceReport.environment || input.environment || 'LIVE',
    verification: sourceReport.verification,
    guardrails: backendGuardrails,
  };
}

export function assertNoInventoryBridgePairingBackendOperationalMutation() {
  return {
    ok: true,
    phase: INVENTORY_BRIDGE_PAIRING_BACKEND_DIAGNOSTIC_PHASE,
    ...backendGuardrails,
  };
}
