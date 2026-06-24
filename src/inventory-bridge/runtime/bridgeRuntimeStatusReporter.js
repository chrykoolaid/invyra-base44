import { getInventoryBridgeRuntimeConfigurationSnapshot } from './bridgeRuntimeConfigurationAdapter.js';

export const INVENTORY_BRIDGE_RUNTIME_PHASE = '4';
export const INVENTORY_BRIDGE_RUNTIME_MILESTONE = '4B-4D';
export const INVENTORY_BRIDGE_RUNTIME_COMPONENT = 'inventory_bridge_runtime_foundation';
export const INVENTORY_BRIDGE_RUNTIME_STATE = 'DISABLED';
export const INVENTORY_BRIDGE_RUNTIME_DISABLED_REASON = 'inventory_bridge_phase_4_runtime_foundation_disabled';

export const INVENTORY_BRIDGE_RUNTIME_CAPABILITIES = Object.freeze({
  network: false,
  writes: false,
  sync: false,
  ingestion: false,
  replay: false,
  mutation: false,
});

export function getInventoryBridgeRuntimeStatus(options = {}) {
  const configurationSnapshot = getInventoryBridgeRuntimeConfigurationSnapshot(options.configuration);

  return Object.freeze({
    component: INVENTORY_BRIDGE_RUNTIME_COMPONENT,
    phase: INVENTORY_BRIDGE_RUNTIME_PHASE,
    milestone: INVENTORY_BRIDGE_RUNTIME_MILESTONE,
    state: INVENTORY_BRIDGE_RUNTIME_STATE,
    enabled: false,
    ready: false,
    operational: false,
    reason: INVENTORY_BRIDGE_RUNTIME_DISABLED_REASON,
    requested_action: options.requested_action || null,
    lifecycle_state: options.lifecycle_state || 'STOPPED_DISABLED',
    configuration_snapshot: configurationSnapshot,
    configuration_status: configurationSnapshot.configuration_status,
    capabilities: INVENTORY_BRIDGE_RUNTIME_CAPABILITIES,
  });
}
