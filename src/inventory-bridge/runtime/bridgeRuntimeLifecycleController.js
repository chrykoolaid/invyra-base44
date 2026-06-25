import { getInventoryBridgeRuntimeStatus } from './bridgeRuntimeStatusReporter.js';

export const INVENTORY_BRIDGE_LIFECYCLE_STATE = 'STOPPED_DISABLED';
export const INVENTORY_BRIDGE_LIFECYCLE_REASON = 'inventory_bridge_phase_4b_lifecycle_controller_disabled';

function disabledLifecycleResult(action, options = {}) {
  return Object.freeze({
    action,
    accepted: false,
    state: INVENTORY_BRIDGE_LIFECYCLE_STATE,
    enabled: false,
    operational: false,
    reason: INVENTORY_BRIDGE_LIFECYCLE_REASON,
    runtime_status: getInventoryBridgeRuntimeStatus({
      configuration: options.configuration,
      requested_action: action,
      lifecycle_state: INVENTORY_BRIDGE_LIFECYCLE_STATE,
    }),
  });
}

export function createInventoryBridgeLifecycleController(options = {}) {
  return Object.freeze({
    component: 'inventory_bridge_lifecycle_controller',
    phase: '4B',
    state: INVENTORY_BRIDGE_LIFECYCLE_STATE,
    enabled: false,
    operational: false,
    requestStart: () => disabledLifecycleResult('start', options),
    requestStop: () => disabledLifecycleResult('stop', options),
    getState: () => disabledLifecycleResult('status', options),
  });
}

export function requestInventoryBridgeRuntimeStart(options = {}) {
  return disabledLifecycleResult('start', options);
}

export function requestInventoryBridgeRuntimeStop(options = {}) {
  return disabledLifecycleResult('stop', options);
}
