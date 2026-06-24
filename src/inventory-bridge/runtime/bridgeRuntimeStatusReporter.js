import { getInventoryBridgeConfigurationStatus } from '../config/bridgeConfigurationStatus.js';

export const INVENTORY_BRIDGE_RUNTIME_PHASE = '4A';
export const INVENTORY_BRIDGE_RUNTIME_COMPONENT = 'inventory_bridge_runtime_skeleton';
export const INVENTORY_BRIDGE_RUNTIME_STATE = 'DISABLED';
export const INVENTORY_BRIDGE_RUNTIME_DISABLED_REASON = 'inventory_bridge_phase_4a_runtime_skeleton_disabled';

export const INVENTORY_BRIDGE_RUNTIME_CAPABILITIES = Object.freeze({
  network: false,
  writes: false,
  sync: false,
  ingestion: false,
  replay: false,
  mutation: false,
});

export function getInventoryBridgeRuntimeStatus(options = {}) {
  const configurationStatus = getInventoryBridgeConfigurationStatus(options.configuration);

  return Object.freeze({
    component: INVENTORY_BRIDGE_RUNTIME_COMPONENT,
    phase: INVENTORY_BRIDGE_RUNTIME_PHASE,
    state: INVENTORY_BRIDGE_RUNTIME_STATE,
    enabled: false,
    ready: false,
    operational: false,
    reason: INVENTORY_BRIDGE_RUNTIME_DISABLED_REASON,
    requested_action: options.requested_action || null,
    configuration_status: configurationStatus,
    capabilities: INVENTORY_BRIDGE_RUNTIME_CAPABILITIES,
  });
}
