/**
 * wasteEngineConfig.js
 * Reads environment variables and exposes mode/URL helpers.
 * Default mode is 'base44' so the prototype never breaks.
 */

export const WASTE_ENGINE_MODE = import.meta.env.VITE_WASTE_ENGINE_MODE || 'base44';
export const WASTE_ENGINE_BASE_URL = import.meta.env.VITE_WASTE_ENGINE_BASE_URL || 'http://localhost:8000';
export const ENGINE_TIMEOUT_MS = 10_000;

/** True when running against Base44 entities only */
export const isBase44Mode = () => WASTE_ENGINE_MODE === 'base44';

/** True when running against Invyra Waste Engine only */
export const isEngineMode = () => WASTE_ENGINE_MODE === 'engine';

/**
 * True when the engine is tried first with automatic fallback to Base44.
 * Use this for gradual migration.
 */
export const isHybridMode = () => WASTE_ENGINE_MODE === 'hybrid';

/** Convenience: any mode that includes engine calls */
export const usesEngine = () => isEngineMode() || isHybridMode();