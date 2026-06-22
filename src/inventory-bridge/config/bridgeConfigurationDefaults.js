export const INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS = Object.freeze({
  bridge_enabled: false,
  transport_enabled: false,
  ingestion_enabled: false,
  replay_enabled: false,
  target_inventory_instance_id: null,
  accepted_schema_versions: [],
  accepted_event_types: [],
  allowed_store_ids: [],
  trusted_device_ids: [],
});

export const INVENTORY_BRIDGE_DISABLED_REASON = 'inventory_bridge_configuration_defaults_disabled';
