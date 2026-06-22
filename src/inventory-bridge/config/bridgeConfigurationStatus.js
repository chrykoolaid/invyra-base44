import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from './bridgeConfigurationDefaults.js';

export function getInventoryBridgeConfigurationStatus(config = INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS) {
  const effectiveConfig = config || INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS;

  return Object.freeze({
    enabled: false,
    ready: false,
    reason: 'inventory_bridge_configuration_scaffold_disabled',
    bridge_enabled: effectiveConfig.bridge_enabled === true,
    transport_enabled: effectiveConfig.transport_enabled === true,
    ingestion_enabled: effectiveConfig.ingestion_enabled === true,
    replay_enabled: effectiveConfig.replay_enabled === true,
  });
}
