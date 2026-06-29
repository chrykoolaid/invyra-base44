import { buildEnterpriseDeploymentContract } from '../src/inventory-bridge/enterpriseDeploymentContract/index.js';

const training = buildEnterpriseDeploymentContract('TRAINING');
const test = buildEnterpriseDeploymentContract('TEST');
const live = buildEnterpriseDeploymentContract('LIVE');
const production = buildEnterpriseDeploymentContract('PRODUCTION');
const unknown = buildEnterpriseDeploymentContract('UNKNOWN');

const checks = [
  Object.isFrozen(training),
  Object.isFrozen(training.dependencies_required),
  Object.isFrozen(training.enterprise_site_candidate_shape),
  Object.isFrozen(training.bridge_host_candidate_shape),
  Object.isFrozen(training.management_visibility_candidate_shape),
  Object.isFrozen(training.prohibited_enterprise_operations),
  training.enterprise_deployment_contract_ready === true,
  test.enterprise_deployment_contract_ready === true,
  live.enterprise_deployment_contract_ready === false,
  production.enterprise_deployment_contract_ready === false,
  unknown.enterprise_deployment_contract_ready === false,
  training.inactive_contract_only === true,
  training.hard_disabled === true,
  training.inventory_system_of_record === true,
  training.scanops_operational_layer_only === true,
  training.client_network_portable_bridge === true,
  training.desktop_first === true,
  training.local_network_first === true,
  training.offline_capable === true,
  training.cloud_optional === true,
  training.enterprise_bundle_only === true,
  training.candidate_only === true,
  training.preview_only === true,
  training.enterprise_site_candidate_shape.created === false,
  training.enterprise_site_candidate_shape.persisted === false,
  training.bridge_host_candidate_shape.active === false,
  training.bridge_host_candidate_shape.persisted === false,
  training.management_visibility_candidate_shape.generated === false,
  training.management_visibility_candidate_shape.emitted === false,
  training.management_visibility_candidate_shape.persisted === false,
  training.prohibited_enterprise_operations.create_enterprise_site === false,
  training.prohibited_enterprise_operations.persist_enterprise_site === false,
  training.prohibited_enterprise_operations.create_bridge_host === false,
  training.prohibited_enterprise_operations.persist_bridge_host === false,
  training.prohibited_enterprise_operations.enable_failover === false,
  training.prohibited_enterprise_operations.enable_central_management === false,
  training.prohibited_enterprise_operations.enable_remote_visibility === false,
  training.prohibited_enterprise_operations.require_cloud_for_scanning === false,
  training.prohibited_enterprise_operations.open_listener === false,
  training.prohibited_enterprise_operations.call_transport === false,
  training.prohibited_enterprise_operations.send_event === false,
  training.prohibited_enterprise_operations.receive_event === false,
  training.enterprise_site_created === false,
  training.enterprise_site_persisted === false,
  training.bridge_host_created === false,
  training.bridge_host_persisted === false,
  training.failover_enabled === false,
  training.central_management_enabled === false,
  training.remote_visibility_enabled === false,
  training.cloud_required_for_scanning === false,
  training.listener_active === false,
  training.transport_active === false,
  training.network_call_attempted === false,
  training.event_sent === false,
  training.event_received === false,
  training.inventory_write_allowed === false,
  training.scanops_write_allowed === false,
  training.stock_mutation_allowed === false,
  training.workflow_mutation_allowed === false,
  training.item_master_mutation_allowed === false,
  training.price_mutation_allowed === false,
  training.accounting_mutation_allowed === false,
  training.purchase_order_write_allowed === false,
  training.forecast_write_allowed === false,
  training.runtime_activation_allowed === false,
  training.persisted === false,
  training.write_attempted === false,
  training.mutation_attempted === false,
];

if (!checks.every(Boolean)) {
  throw new Error('P30-V validation failed');
}

console.log('P30-V Enterprise deployment bundle passed.');
