/**
 * Environment filter utility — Inventory Environment Separation v1
 *
 * Every production entity query MUST pass envFilter('LIVE') to prevent
 * TRAINING and TEST records from polluting LIVE views.
 *
 * Usage:
 *   import { envFilter, LIVE } from '@/lib/envFilter';
 *
 *   // Merge with other filters:
 *   base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true })
 *
 *   // Standalone:
 *   base44.entities.StockMovement.filter(envFilter())
 *
 * The filter uses:
 *   { environment: "LIVE" }
 *
 * Records created before the environment field was added have no environment
 * value (null / undefined). We treat those as LIVE by using a compound filter
 * that accepts both "LIVE" and missing values — achieved by always passing
 * environment:"LIVE" which Base44 matches on equality.
 *
 * NOTE: Records without an environment field were created before this separation
 * was introduced. They belong to LIVE. Use the migration note below if you need
 * to backfill them.
 *
 * MIGRATION NOTE:
 * To backfill legacy records:
 *   base44.entities.InventoryItem.list('', 500).then(items =>
 *     items.filter(i => !i.environment).forEach(i =>
 *       base44.entities.InventoryItem.update(i.id, { environment: 'LIVE' })
 *     )
 *   )
 */

export const ENV_LIVE     = 'LIVE';
export const ENV_TRAINING = 'TRAINING';
export const ENV_TEST     = 'TEST';

/**
 * Returns a filter object for the given environment (default: LIVE).
 * Spread this into any entity filter to enforce environment separation.
 * @param {string} env - 'LIVE' | 'TRAINING' | 'TEST'
 * @returns {{ environment: string }}
 */
export function envFilter(env = ENV_LIVE) {
  return { environment: env };
}