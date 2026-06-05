import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';

export default function DataTransformationBuilder() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    sync_type: 'xero_inventory',
    source_entity: 'InventoryItem',
    target_system: 'Xero',
    field_mappings: [],
    validation_rules: [],
    is_active: true,
  });

  const loadRules = async () => {
    setLoading(true);
    const data = await base44.entities.DataTransformation.list('-created_date', 50);
    setRules(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRules(); }, []);

  const addFieldMapping = () => {
    setNewRule({
      ...newRule,
      field_mappings: [...newRule.field_mappings, { source_field: '', target_field: '', transform_type: 'direct' }],
    });
  };

  const addValidation = () => {
    setNewRule({
      ...newRule,
      validation_rules: [...newRule.validation_rules, { field: '', rule_type: 'required', rule_value: '' }],
    });
  };

  const saveRule = async () => {
    if (!newRule.name) return;
    if (editing) {
      await base44.entities.DataTransformation.update(editing.id, newRule);
    } else {
      await base44.entities.DataTransformation.create(newRule);
    }
    setNewRule({ name: '', sync_type: 'xero_inventory', source_entity: 'InventoryItem', target_system: 'Xero', field_mappings: [], validation_rules: [], is_active: true });
    setEditing(null);
    loadRules();
  };

  const deleteRule = async (id) => {
    await base44.entities.DataTransformation.delete(id);
    loadRules();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Field Mapping Rules</h2>
          <p className="text-xs text-muted-foreground mt-1">Define transformations and validations</p>
        </div>
        <button onClick={loadRules} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border hover:bg-muted disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <input type="text" placeholder="Rule name" value={newRule.name} onChange={(e) => setNewRule({...newRule, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />

        <div className="grid grid-cols-3 gap-3">
          <select value={newRule.sync_type} onChange={(e) => setNewRule({...newRule, sync_type: e.target.value})} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="xero_inventory">Xero Inventory</option>
            <option value="webhook_inventory">Webhook Stock</option>
            <option value="webhook_order">Webhook Order</option>
          </select>
          <input type="text" placeholder="Source entity" value={newRule.source_entity} onChange={(e) => setNewRule({...newRule, source_entity: e.target.value})} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          <input type="text" placeholder="Target system" value={newRule.target_system} onChange={(e) => setNewRule({...newRule, target_system: e.target.value})} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </div>

        {/* Field Mappings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Field Mappings</p>
            <button onClick={addFieldMapping} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90">
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {newRule.field_mappings.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" placeholder="Source field" value={m.source_field} onChange={(e) => {
                  const updated = [...newRule.field_mappings];
                  updated[i].source_field = e.target.value;
                  setNewRule({...newRule, field_mappings: updated});
                }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                <input type="text" placeholder="Target field" value={m.target_field} onChange={(e) => {
                  const updated = [...newRule.field_mappings];
                  updated[i].target_field = e.target.value;
                  setNewRule({...newRule, field_mappings: updated});
                }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                <button onClick={() => setNewRule({...newRule, field_mappings: newRule.field_mappings.filter((_, idx) => idx !== i)})} className="text-red-600 hover:opacity-70">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Rules */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Validations</p>
            <button onClick={addValidation} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90">
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {newRule.validation_rules.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" placeholder="Field" value={v.field} onChange={(e) => {
                  const updated = [...newRule.validation_rules];
                  updated[i].field = e.target.value;
                  setNewRule({...newRule, validation_rules: updated});
                }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                <select value={v.rule_type} onChange={(e) => {
                  const updated = [...newRule.validation_rules];
                  updated[i].rule_type = e.target.value;
                  setNewRule({...newRule, validation_rules: updated});
                }} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="required">Required</option>
                  <option value="min_value">Min Value</option>
                  <option value="regex">Regex</option>
                </select>
                <button onClick={() => setNewRule({...newRule, validation_rules: newRule.validation_rules.filter((_, idx) => idx !== i)})} className="text-red-600 hover:opacity-70">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={saveRule} className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium">
          <Save size={14} /> {editing ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading rules…</div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.sync_type} • {rule.field_mappings.length} mappings • {rule.validation_rules.length} validations</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => {setEditing(rule); setNewRule(rule);}} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">Edit</button>
                  <button onClick={() => deleteRule(rule.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}