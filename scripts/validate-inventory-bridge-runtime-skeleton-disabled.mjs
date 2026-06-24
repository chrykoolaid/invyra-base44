import { INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS } from '../src/inventory-bridge/config/bridgeConfigurationDefaults.js';
import {
  createInventoryBridgeRuntime,
  getInventoryBridgeRuntimeStatus,
  startInventoryBridgeRuntime,
  stopInventoryBridgeRuntime,
} from '../src/inventory-bridge/runtime/index.js';

const prohibitedCapabilities = [
  'network',
  'writes',
  'sync',
  'ingestion',
  'replay',
  'mutation',
];

const errors = [];

function assertDisabledStatus(label, status) {
  if (status.enabled !== false) {
    errors.push(`${label} must remain disabled`);
  }

  if (status.ready !== false) {
    errors.push(`${label} must not report ready`);
  }

  if (status.operational !== false) {
    errors.push(`${label} must remain non-operational`);
  }

  if (status.state !== 'DISABLED') {
    errors.push(`${label} must report DISABLED state`);
  }

  if (!status.reason) {
    errors.push(`${label} must provide a disabled reason`);
  }

  for (const capability of prohibitedCapabilities) {
    if (status.capabilities?.[capability] !== false) {
      errors.push(`${label} must not expose ${capability} capability`);
    }
  }
}

const runtime = createInventoryBridgeRuntime();

if (runtime.enabled !== false) {
  errors.push('runtime object must default enabled=false');
}

if (runtime.operational !== false) {
  errors.push('runtime object must default operational=false');
}

for (const method of ['start', 'stop', 'getStatus']) {
  if (typeof runtime[method] !== 'function') {
    errors.push(`runtime object must expose ${method} as a no-op function`);
  }
}

assertDisabledStatus('runtime status reporter', getInventoryBridgeRuntimeStatus());
assertDisabledStatus('runtime start entrypoint', startInventoryBridgeRuntime());
assertDisabledStatus('runtime stop entrypoint', stopInventoryBridgeRuntime());
assertDisabledStatus('runtime object status', runtime.getStatus());
assertDisabledStatus('runtime object start', runtime.start());
assertDisabledStatus('runtime object stop', runtime.stop());

const unsafeConfigAttempt = {
  ...INVENTORY_BRIDGE_CONFIGURATION_DEFAULTS,
  bridge_enabled: true,
  transport_enabled: true,
  ingestion_enabled: true,
  replay_enabled: true,
  accepted_schema_versions: ['attempted-runtime-activation'],
  accepted_event_types: ['attempted-event'],
  allowed_store_ids: ['attempted-store'],
  trusted_device_ids: ['attempted-device'],
};

assertDisabledStatus(
  'runtime status with attempted enabled configuration',
  getInventoryBridgeRuntimeStatus({ configuration: unsafeConfigAttempt })
);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Inventory bridge Phase 4A runtime skeleton remains disabled and non-operational.');
