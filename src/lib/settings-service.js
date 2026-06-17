/**
 * settings-service.js
 *
 * Configuration-only service for SystemConfiguration entity.
 *
 * STRICT DECOUPLING RULES — DO NOT import or call:
 *   - inventoryMovement
 *   - postInventoryMovement
 *   - stocktake execution
 *   - receiving execution
 *   - transfer execution
 *   - wastage execution
 *   - PO approval logic
 *
 * This service may only interact with:
 *   - base44.entities.SystemConfiguration
 *   - base44.entities.AuditLog
 *   - base44.auth
 */

import { base44 } from '@/api/base44Client';

const ENV_LIVE = 'LIVE';

/**
 * Fetches the active SystemConfiguration record for the given environment.
 * If none exists, returns null — the caller should seed defaults via initConfiguration().
 */
export async function getConfiguration(environment = ENV_LIVE) {
  const results = await base44.entities.SystemConfiguration.filter({ environment }, '-updated_date', 1);
  return results?.[0] ?? null;
}

/**
 * Seeds a default SystemConfiguration record if none exists for the environment.
 * Should be called on Settings page mount when no config is found.
 */
export async function initConfiguration(environment = ENV_LIVE) {
  const existing = await getConfiguration(environment);
  if (existing) return existing;

  const user = await base44.auth.me();
  if (!user) throw new Error('Not authenticated.');

  return await base44.entities.SystemConfiguration.create({
    environment,
    business_defaults: {
      currency_code: 'PHP',
      timezone: 'Asia/Manila',
      date_format: 'YYYY-MM-DD',
      default_uom: 'pcs',
    },
    inventory_rules: {
      allow_negative_stock: false,
      require_reason_for_adjustments: true,
      track_stock_by_default: true,
    },
    reorder_behavior: {
      coverage_days_default: 14,
    },
    compliance: {
      audit_retention_days: 365,
      locked_supplier_disclaimer_version: 'v1.0',
    },
    notifications: {
      low_stock_enabled: true,
      wastage_enabled: true,
      discrepancy_enabled: true,
    },
    hardware_readiness: {
      handheld_sync_enabled: false,
    },
    config_version: 1,
    last_saved_by: user.email || user.full_name,
    last_saved_at: new Date().toISOString(),
  });
}

/**
 * Saves a specific section of SystemConfiguration with per-field AuditLog entries.
 *
 * @param {string} configId       - SystemConfiguration record ID
 * @param {string} sectionKey     - Top-level key e.g. "business_defaults"
 * @param {object} currentSection - Current saved values for this section
 * @param {object} newSection     - Updated values from the form
 * @param {object} user           - Authenticated user object from base44.auth.me()
 * @param {string} environment    - "LIVE" | "TRAINING" | "TEST"
 * @param {string} [note]         - Optional admin note
 */
export async function saveConfigurationSection(
  configId,
  sectionKey,
  currentSection,
  newSection,
  user,
  environment = ENV_LIVE,
  note = ''
) {
  if (!user) throw new Error('Not authenticated.');
  if (!['admin', 'owner'].includes((user.role || '').toLowerCase())) {
    throw new Error('Settings changes require Admin or Owner role.');
  }

  // Compute per-field diffs
  const diffs = computeDiffs(sectionKey, currentSection ?? {}, newSection);

  if (diffs.length === 0) return { unchanged: true };

  // Apply section update to SystemConfiguration
  await base44.entities.SystemConfiguration.update(configId, {
    [sectionKey]: newSection,
    last_saved_by: user.email || user.full_name,
    last_saved_at: new Date().toISOString(),
  });

  // Create one AuditLog entry per changed field
  for (const diff of diffs) {
    await base44.entities.AuditLog.create({
      item_id: configId,
      sku: 'SYSTEM_CONFIG',
      item_name: 'System Configuration',
      change_type: 'SETTINGS_UPDATE',
      field_name: diff.path,
      old_value: String(diff.oldVal ?? ''),
      new_value: String(diff.newVal ?? ''),
      changed_by: user.email || user.full_name,
      actor_role: user.role || 'admin',
      source_module: 'SystemSettings',
      action_type: 'SETTINGS_UPDATE',
      linked_source_record: configId,
      source_record_id: configId,
      notes: note
        ? `${note} [${diff.path}]`
        : `Settings updated: ${diff.path}`,
      environment,
    });
  }

  return { saved: true, changedFields: diffs.map(d => d.path) };
}

/**
 * Computes field-level diffs between two flat or one-level-deep objects.
 * Returns an array of { path, oldVal, newVal } for changed fields only.
 */
function computeDiffs(sectionKey, current, next) {
  const diffs = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(next)]);

  for (const key of allKeys) {
    const oldVal = current[key];
    const newVal = next[key];
    // Strict equality check — objects at this level are flat scalars
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        path: `${sectionKey}.${key}`,
        oldVal,
        newVal,
      });
    }
  }

  return diffs;
}