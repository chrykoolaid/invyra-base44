import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from './bridgeConfigurationDefaults.js';

export const INVENTORY_BRIDGE_CONFIGURATION_SCHEMA = Object.freeze({
  booleanFields: Object.freeze([
    'bridge_enabled',
    'transport_enabled',
    'ingestion_enabled',
    'replay_enabled',
  ]),
  listFields: Object.freeze([
    'accepted_schema_versions',
    'accepted_event_types',
    'allowed_store_ids',
    'trusted_device_ids',
  ]),
  nullableFields: Object.freeze(['target_inventory_instance_id']),
  defaults: INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
});
