import { getInventoryBridgeRuntimeDiagnostics } from './bridgeRuntimeDiagnostics.js';
import { createInventoryBridgeLifecycleController } from './bridgeRuntimeLifecycleController.js';
import { getInventoryBridgeRuntimeStatus } from './bridgeRuntimeStatusReporter.js';

export function createInventoryBridgeRuntime(options = {}) {
  const lifecycleController = createInventoryBridgeLifecycleController(options);

  return Object.freeze({
    component: 'inventory_bridge_runtime_foundation',
    phase: '4',
    milestone: '4B-4D',
    enabled: false,
    operational: false,
    lifecycle: lifecycleController,
    start: () => startInventoryBridgeRuntime(options),
    stop: () => stopInventoryBridgeRuntime(options),
    requestStart: () => lifecycleController.requestStart(),
    requestStop: () => lifecycleController.requestStop(),
    getStatus: () => getInventoryBridgeRuntimeStatus({
      configuration: options.configuration,
      requested_action: 'status',
    }),
    getDiagnostics: () => getInventoryBridgeRuntimeDiagnostics({
      configuration: options.configuration,
      requested_action: 'diagnostics',
    }),
  });
}

export function startInventoryBridgeRuntime(options = {}) {
  return getInventoryBridgeRuntimeStatus({
    configuration: options.configuration,
    requested_action: 'start',
    lifecycle_state: 'STOPPED_DISABLED',
  });
}

export function stopInventoryBridgeRuntime(options = {}) {
  return getInventoryBridgeRuntimeStatus({
    configuration: options.configuration,
    requested_action: 'stop',
    lifecycle_state: 'STOPPED_DISABLED',
  });
}
