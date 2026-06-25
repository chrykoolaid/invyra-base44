import {
  INVENTORY_BRIDGE_CONTRACT_ADAPTER_COMPONENT,
  INVENTORY_BRIDGE_CONTRACT_ADAPTER_PHASE,
  INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS,
  assessInventoryBridgeEventEnvelopeContract,
} from './eventEnvelopeContract.js';

function diagnosticCheck(name, passed, detail) {
  return Object.freeze({ name, passed: passed === true, detail });
}

export function getInventoryBridgeEventEnvelopeContractDiagnostics(candidate = {}, options = {}) {
  const assessment = assessInventoryBridgeEventEnvelopeContract(candidate, options);

  const checks = Object.freeze([
    diagnosticCheck('contract_adapter_component', assessment.component === INVENTORY_BRIDGE_CONTRACT_ADAPTER_COMPONENT, 'Contract adapter component marker is present.'),
    diagnosticCheck('contract_adapter_phase', assessment.phase === INVENTORY_BRIDGE_CONTRACT_ADAPTER_PHASE, 'Contract adapter phase marker is present.'),
    diagnosticCheck('never_accepted', assessment.accepted === false, 'Phase 5A adapter never accepts runtime ingestion.'),
    diagnosticCheck('never_ingestible', assessment.ingestible === false, 'Phase 5A adapter never returns ingestible candidates.'),
    diagnosticCheck('never_writable', assessment.writable === false, 'Phase 5A adapter never returns writable candidates.'),
    diagnosticCheck('runtime_disabled', assessment.runtime_status.enabled === false, 'Runtime remains disabled.'),
    diagnosticCheck('runtime_not_ready', assessment.runtime_status.ready === false, 'Runtime remains not ready.'),
    diagnosticCheck('runtime_non_operational', assessment.runtime_status.operational === false, 'Runtime remains non-operational.'),
    diagnosticCheck('known_classification', Object.values(INVENTORY_BRIDGE_EVENT_ENVELOPE_CLASSIFICATIONS).includes(assessment.classification), 'Assessment returns a known read-only classification.'),
  ]);

  return Object.freeze({
    component: 'inventory_bridge_contract_diagnostics',
    phase: INVENTORY_BRIDGE_CONTRACT_ADAPTER_PHASE,
    passed: checks.every((check) => check.passed),
    assessment,
    checks,
  });
}
