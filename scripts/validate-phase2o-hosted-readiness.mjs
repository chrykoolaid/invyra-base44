const apiBaseUrl = (process.env.VITE_INVYRA_FORECASTING_API_BASE_URL || '').trim();
const mode = (process.env.INVYRA_PHASE2O_MODE || 'hosted').trim().toLowerCase();

function fail(message) {
  console.error(`Phase 2O hosted readiness validation failed: ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`Phase 2O warning: ${message}`);
}

if (!apiBaseUrl) {
  fail('VITE_INVYRA_FORECASTING_API_BASE_URL is required for hosted runtime readiness.');
}

let parsed;
try {
  parsed = new URL(apiBaseUrl);
} catch {
  fail('VITE_INVYRA_FORECASTING_API_BASE_URL must be a valid absolute URL.');
}

if (mode === 'hosted') {
  if (parsed.protocol !== 'https:') {
    fail('Hosted runtime requires an HTTPS forecasting API URL.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  if (localHosts.has(hostname)) {
    fail('Hosted runtime must not point to localhost or loopback.');
  }
}

if (apiBaseUrl.endsWith('/')) {
  warn('Trailing slash is accepted by the UI but should be avoided in hosted configuration.');
}

console.log('Phase 2O hosted readiness validation passed.');
