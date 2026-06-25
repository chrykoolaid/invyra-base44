import {
  INVENTORY_BRIDGE_LEDGER_CANDIDATE_COMPONENT,
  INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE,
  buildInventoryBridgeLedgerCandidatePreview,
} from './ledgerCandidatePreview.js';

function diagnosticCheck(name, passed, detail) {
  return Object.freeze({ name, passed: passed === true, detail });
}

export function getInventoryBridgeLedgerCandidatePreviewDiagnostics(candidate = {}, options = {}) {
  const preview = buildInventoryBridgeLedgerCandidatePreview(candidate, options);

  const checks = Object.freeze([
    diagnosticCheck('ledger_candidate_component', preview.component === INVENTORY_BRIDGE_LEDGER_CANDIDATE_COMPONENT, 'Ledger candidate preview component marker is present.'),
    diagnosticCheck('ledger_candidate_phase', preview.phase === INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE, 'Ledger candidate preview phase marker is present.'),
    diagnosticCheck('runtime_disabled', preview.runtime_enabled === false, 'Runtime remains disabled.'),
    diagnosticCheck('runtime_not_ready', preview.runtime_ready === false, 'Runtime remains not ready.'),
    diagnosticCheck('runtime_non_operational', preview.runtime_operational === false, 'Runtime remains non-operational.'),
    diagnosticCheck('contract_not_accepted', preview.contract_accepted === false, 'Contract remains non-accepted for runtime use.'),
    diagnosticCheck('contract_non_ingestible', preview.contract_ingestible === false, 'Contract remains non-ingestible.'),
    diagnosticCheck('contract_non_writable', preview.contract_writable === false, 'Contract remains non-writable.'),
    diagnosticCheck('ledger_non_writable', preview.ledger_writable === false, 'Ledger candidate preview never returns ledger_writable=true.'),
    diagnosticCheck('preview_non_ingestible', preview.ingestible === false, 'Ledger candidate preview never returns ingestible=true.'),
    diagnosticCheck('preview_non_persistable', preview.persistable === false, 'Ledger candidate preview never returns persistable=true.'),
    diagnosticCheck('preview_non_writable', preview.writable === false, 'Ledger candidate preview never returns writable=true.'),
    diagnosticCheck('preview_non_replayable', preview.replayable === false, 'Ledger candidate preview never returns replayable=true.'),
    diagnosticCheck('no_acknowledgement', preview.acknowledgement_emittable === false, 'Ledger candidate preview never emits acknowledgements.'),
    diagnosticCheck('no_receipt', preview.receipt_emittable === false, 'Ledger candidate preview never emits receipts.'),
    diagnosticCheck('no_mutation', preview.mutating === false, 'Ledger candidate preview never mutates Inventory state.'),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_ledger_candidate_preview_diagnostics',
    phase: INVENTORY_BRIDGE_LEDGER_CANDIDATE_PHASE,
    passed: checks.every((check) => check.passed),
    preview,
    checks,
  });
}
