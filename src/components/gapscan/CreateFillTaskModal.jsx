import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import {
  buildGapScanFillTaskPayload,
  hasOpenGapScanFillTaskForRow,
  isActiveFillTask,
  isFillTaskEligible,
} from '@/lib/gapScanFillTasks';
import { X } from 'lucide-react';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function CreateFillTaskModal({ scanRow, onClose, onCreated }) {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [form, setForm] = useState({
    qty_requested: scanRow.suggested > 0 ? scanRow.suggested : '',
    shelf_location_id: '',
    backroom_storage_area_id: '',
    notes: '',
    priority: scanRow.risk === 'Critical' ? 'Critical' : scanRow.risk === 'High' ? 'High' : 'Medium',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Location.filter({ ...envFilter(), is_active: true }, 'name', 100),
      base44.entities.StorageArea.filter({ ...envFilter(), is_active: true }, 'name', 200),
    ]).then(([locs, areas]) => {
      setLocations(locs || []);
      setStorageAreas(areas || []);
    });
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filteredAreas = storageAreas.filter(sa =>
    !form.shelf_location_id || sa.location_id === form.shelf_location_id
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!isFillTaskEligible(scanRow)) {
        setError('This row does not meet Gap Scan fill-task rules. No task was created.');
        return;
      }

      const user = await base44.auth.me();
      const shelfLocation = locations.find(l => l.id === form.shelf_location_id);
      const backroomArea = storageAreas.find(sa => sa.id === form.backroom_storage_area_id);

      const activeTasks = await base44.entities.FillTask.filter(envFilter(), '-created_date', 500);
      const duplicateCheckRow = {
        ...scanRow,
        location_id: form.shelf_location_id || scanRow.location_id || null,
        shelf_location_id: form.shelf_location_id || scanRow.shelf_location_id || null,
      };
      if (hasOpenGapScanFillTaskForRow(duplicateCheckRow, (activeTasks || []).filter(isActiveFillTask))) {
        setError('An open Fill Task already exists for this SKU/location from Gap Scan. Duplicate task was skipped.');
        return;
      }

      // Resolve item_id from InventoryItem. Do not fall back to SKU as item_id.
      const items = await base44.entities.InventoryItem.filter({ ...envFilter(), sku: scanRow.sku }, 'name', 1);
      const item = items?.[0] || null;
      if (!item?.id) {
        setError(`Cannot create Fill Task: inventory item not found for SKU ${scanRow.sku}.`);
        return;
      }

      const taskRow = {
        ...scanRow,
        item_id: item.id,
        location_id: form.shelf_location_id || scanRow.location_id || null,
        location_name: shelfLocation?.name || scanRow.location_name || null,
        shelf_location_id: form.shelf_location_id || null,
        shelf_location_name: shelfLocation?.name || null,
      };

      const created = await base44.entities.FillTask.create(buildGapScanFillTaskPayload({
        row: taskRow,
        user,
        overrides: {
          qty_requested: form.qty_requested ? Number(form.qty_requested) : null,
          shelf_location_id: form.shelf_location_id || null,
          shelf_location_name: shelfLocation?.name || null,
          backroom_storage_area_id: form.backroom_storage_area_id || null,
          backroom_storage_area_name: backroomArea?.name || null,
          priority: form.priority,
          notes: form.notes || 'Created from Gap Scan manual promotion. No StockMovement posted.',
        },
      }));

      await base44.entities.AuditLog.create({
        ...envFilter(),
        item_id: item.id,
        sku: item.sku || scanRow.sku,
        item_name: item.name || scanRow.name,
        change_type: 'ITEM_UPDATE',
        action_type: 'FILL_TASK_CREATED',
        field_name: 'FillTask.status',
        old_value: '',
        new_value: 'OPEN',
        changed_by: user?.email || user?.full_name || '',
        actor_role: user?.role || '',
        source_module: 'GapScan',
        source_record_id: created?.id || '',
        linked_source_record: created?.id || '',
        notes: 'Evidentiary shelf replenishment task only. No StockMovement created.',
      });

      onCreated(created);
    } catch (err) {
      console.error('Failed to create Fill Task:', err);
      setError('Failed to create Fill Task. No stock movement was posted.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Create Fill Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{scanRow.sku} — {scanRow.name}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Qty to Move</span>
              <input type="number" min={0} value={form.qty_requested} onChange={e => set('qty_requested', e.target.value)}
                placeholder="e.g. 10"
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Priority</span>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Shelf / Floor Location</span>
            <select value={form.shelf_location_id} onChange={e => set('shelf_location_id', e.target.value)}
              className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">— Select location —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Fetch from (Backroom / Storage Area)</span>
            <select value={form.backroom_storage_area_id} onChange={e => set('backroom_storage_area_id', e.target.value)}
              className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">— Select area —</option>
              {filteredAreas.map(sa => <option key={sa.id} value={sa.id}>{sa.name} ({sa.storage_area_code})</option>)}
            </select>
          </label>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Notes (optional)</span>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Any context for the staff member…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This creates an evidentiary task only. No stock movement will be posted.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
            <button type="button" onClick={onClose}
              className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium">
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}