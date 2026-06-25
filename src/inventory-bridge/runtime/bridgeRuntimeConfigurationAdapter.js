import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../config/bridgeConfigurationDefaults.js';
import { INVENTORY_BRIDGE_CONFIGURATION_SCHEMA } from '../config/bridgeConfigurationSchema.js';
import { getInventoryBridgeConfigurationStatus } from '../config/bridgeConfigurationStatus.js';

export const INVENTORY_BRIDGE_CONFIGURATION_ADAPTER_MODE = 'READ_ONLY';
export const INVENTORY_BRIDGE_CONFIGURATION_ADAPTER_REASON = 'inventory_bridge_phase_4d_configuration_adapter_read_only';

function freezeList(value) {
  return Object.freeze(Array.isArray(value) ? [...value] : []);
}

export function getInventoryBridgeRuntimeConfigurationSnapshot(config = INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS) {
  const requestedConfig = config || INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS;

  const snapshot = Object.freeze({
    mode: INVENTORY_BRIDGE_CONFIGURATION_ADAPTER_MODE,
    writable: false,
    reason: INVENTORY_BRIDGE_CONFIGURATION_ADAPTER_REASON,
    schema_fields: Object.freeze({
      boolean_fields: INVENTORY_BRIDGE_CONFIGURATION_SCHEMA.booleanFields,
      list_fields: INVENTORY_BRIDGE_CONFIGURATION_SCHEMA.listFields,
      nullable_fields: INVENTORY_BRIDGE_CONFIGURATION_SCHEMA.nullableFields,
    }),
    requested_flags: Object.freeze({
      bridge_enabled: requestedConfig.bridge_enabled === true,
      transport_enabled: requestedConfig.transport_enabled === true,
      ingestion_enabled: requestedConfig.ingestion_enabled === true,
      replay_enabled: requestedConfig.replay_enabled === true,
    }),
    requested_lists: Object.freeze({
      accepted_schema_versions: freezeList(requestedConfig.accepted_schema_versions),
      accepted_event_types: freezeList(requestedConfig.accepted_event_types),
      allowed_store_ids: freezeList(requestedConfig.allowed_store_ids),
      trusted_device_ids: freezeList(requestedConfig.trusted_device_ids),
    }),
    target_inventory_instance_id: requestedConfig.target_inventory_instance_id ?? null,
    configuration_status: getInventoryBridgeConfigurationStatus(requestedConfig),
  });

  return snapshot;
}
