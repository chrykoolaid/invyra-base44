import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RecipeEditor({ service, recipes, inventoryItems, onRecipeChange }) {
  const [adding, setAdding] = useState(false);
  const [newItemId, setNewItemId] = useState('');
  const [newQty, setNewQty] = useState('');
  const [saving, setSaving] = useState(false);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FlaskConical size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Select a service to configure its recipe</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Each recipe defines which inventory items are consumed per service run</p>
      </div>
    );
  }

  const handleAdd = async () => {
    if (!newItemId || !newQty || isNaN(Number(newQty)) || Number(newQty) <= 0) return;
    setSaving(true);
    const item = inventoryItems.find(i => i.id === newItemId);
    await base44.entities.ServiceRecipe.create({
      service_id: service.id,
      service_name: service.name,
      item_id: newItemId,
      item_name: item?.name || '',
      sku: item?.sku || '',
      qty_consumed: Number(newQty),
      unit: item?.unit || 'pcs',
    });
    setNewItemId('');
    setNewQty('');
    setAdding(false);
    setSaving(false);
    onRecipeChange();
  };

  const handleDelete = async (recipeId) => {
    await base44.entities.ServiceRecipe.delete(recipeId);
    onRecipeChange();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{service.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">₱{(service.base_price || 0).toFixed(2)} · {service.category}</p>
      </div>

      {/* Recipe Lines */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Consumables per service run</p>

        {recipes.length === 0 && !adding && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No consumables mapped yet. Add ingredients below.
          </div>
        )}

        {recipes.map(r => {
          const item = inventoryItems.find(i => i.id === r.item_id);
          const stock = item?.stock ?? 0;
          const runsPossible = r.qty_consumed > 0 ? Math.floor(stock / r.qty_consumed) : '∞';
          const isLow = typeof runsPossible === 'number' && runsPossible < 10;

          return (
            <div key={r.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{r.item_name}</p>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{r.sku}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{r.qty_consumed}</span> {r.unit} / run
                  </span>
                  <span className={`text-xs flex items-center gap-1 ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                    {isLow ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                    {runsPossible} runs left
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {/* Add form */}
        {adding && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
            <select
              value={newItemId}
              onChange={e => setNewItemId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select inventory item…</option>
              {inventoryItems.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.sku}) — {i.stock ?? 0} {i.unit}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                placeholder="Qty consumed per run"
                className="flex-1 h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleAdd}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setAdding(false)}
                className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!adding && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 font-medium w-full justify-center"
          >
            <Plus size={14} /> Add Consumable
          </button>
        </div>
      )}
    </div>
  );
}