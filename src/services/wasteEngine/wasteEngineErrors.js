/**
 * wasteEngineErrors.js
 * Typed error classes for the Waste Engine integration layer.
 * Components catch these to decide whether to fall back to Base44.
 */

export class WasteEngineError extends Error {
  constructor(message, code = 'ENGINE_ERROR', status = 500) {
    super(message);
    this.name = 'WasteEngineError';
    this.code = code;
    this.status = status;
  }
}

/** Thrown when the engine cannot be reached (network, timeout, DNS). */
export class WasteEngineUnavailableError extends WasteEngineError {
  constructor(message = 'Waste Engine is unavailable') {
    super(message, 'ENGINE_UNAVAILABLE', 503);
    this.name = 'WasteEngineUnavailableError';
  }
}

/** Thrown for 401 / 403 responses from the engine. */
export class WasteEngineAuthError extends WasteEngineError {
  constructor(message = 'Waste Engine authentication failed') {
    super(message, 'ENGINE_AUTH_ERROR', 401);
    this.name = 'WasteEngineAuthError';
  }
}

/** Thrown for 400 / 422 validation errors. */
export class WasteEngineValidationError extends WasteEngineError {
  constructor(message, details = null) {
    super(message, 'ENGINE_VALIDATION_ERROR', 400);
    this.name = 'WasteEngineValidationError';
    this.details = details;
  }
}

/**
 * Returns true if the error indicates the engine is simply unavailable
 * and a Base44 fallback is safe.
 */
export function isFallbackSafe(error) {
  return (
    error instanceof WasteEngineUnavailableError ||
    (error instanceof WasteEngineError && error.status >= 500)
  );
}