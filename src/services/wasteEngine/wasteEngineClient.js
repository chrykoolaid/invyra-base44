/**
 * wasteEngineClient.js
 * Raw HTTP client for the Invyra Waste Engine API.
 * No UI imports. No Base44 imports.
 * All errors are normalised into WasteEngineError subclasses.
 */

import { WASTE_ENGINE_BASE_URL, ENGINE_TIMEOUT_MS } from './wasteEngineConfig.js';
import {
  WasteEngineError,
  WasteEngineUnavailableError,
  WasteEngineAuthError,
  WasteEngineValidationError,
} from './wasteEngineErrors.js';

/**
 * Serialise a plain object into a URL query string.
 * Skips keys with null / undefined / '' / 'ALL' values.
 */
function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

async function request(method, path, { body, params, headers: extraHeaders = {} } = {}) {
  const url = `${WASTE_ENGINE_BASE_URL}${path}${buildQueryString(params)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) {
      throw new WasteEngineAuthError(`Engine returned ${res.status}`);
    }

    if (res.status === 400 || res.status === 422) {
      let detail = null;
      try { detail = await res.json(); } catch (_) {}
      throw new WasteEngineValidationError(
        detail?.detail || detail?.message || `Engine validation error (${res.status})`,
        detail,
      );
    }

    if (!res.ok) {
      let detail = null;
      try { detail = await res.json(); } catch (_) {}
      throw new WasteEngineError(
        detail?.detail || detail?.message || `Engine error: ${res.status}`,
        'ENGINE_HTTP_ERROR',
        res.status,
      );
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new WasteEngineUnavailableError('Waste Engine request timed out');
    }
    if (err instanceof WasteEngineError) throw err;
    throw new WasteEngineUnavailableError(`Waste Engine unreachable: ${err.message}`);
  }
}

export const wasteEngineClient = {
  get:   (path, params)        => request('GET',   path, { params }),
  post:  (path, body, params)  => request('POST',  path, { body, params }),
  patch: (path, body)          => request('PATCH', path, { body }),
  del:   (path)                => request('DELETE', path),
};