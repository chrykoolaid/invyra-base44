import { getInventoryBridgeRuntimeStatus } from './bridgeRuntimeStatusReporter.js';

export function createInventoryBridgeRuntime(options = {}) {
  return Object.freeze({
    component: 'inventory_bridge_runtime_skeleton',
    phase: '4A',
    enabled: false,
    operational: false,
    start: () => startInventoryBridgeRuntime(options),
    stop: () => stopInventoryBridgeRuntime(options),
    getStatus: () => getInventoryBridgeRuntimeStatus({
      configuration: options.configuration,
      requested_action: 'status',
    }),
  });
}

export function startInventoryBridgeRuntime(options = {}) {
  return getInventoryBridgeRuntimeStatus({
    configuration: options.configuration,
    requested_action: 'start',
  });
}

export function stopInventoryBridgeRuntime(options = {}) {
  return getInventoryBridgeRuntimeStatus({
    configuration: options.configuration,
    requested_action: 'stop',
  });
}
