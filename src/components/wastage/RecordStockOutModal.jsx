import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Search, X } from 'lucide-react';

export default function RecordStockOutModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('class'); // 'class', 'details'
  const [stockOutClass, setStockOutClass] = useState('WASTAGE');
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const [form, setForm] = useState({
    item_id: '',
    item_name: '',
    sku: '',
    available_stock: 0,
    quantity: '',
    reason_category: '',
    reason_notes: '',
    location: '',
    department: '',
    cost_centre: '',
    site_id: '',
  });

  useEffect(() => {
    base44.entities.InventoryItem.filter({ is_active: true }, '', 100).then(data => {
      setItems(data || []);
    });
    base44.entities.Site.filter({ is_active: true }, 'name', 100)
      .then(data => setSites(data || []))
      .catch(() => setSites([]));
  }, []);

  const selectedItem = useMemo(
    () => items.find(item => item.id === form.item_id),
    [items, form.item_id]
  );

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter(item => {
      const searchText = [
        item.name,
        item.sku,
        item.barcode,
        item.item_barcode,
        item.upc,
        item.category,
        item.category_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [items, itemSearch]);

  const selectedAvailableStock = Number(form.available_stock ?? selectedItem?.stock ?? 0);
  const quantityNumber = Number(form.quantity);
  const hasQuantity = form.quantity !== '';
  const quantityInvalid = hasQuantity && (
    Number.isNaN(quantityNumber) ||
    quantityNumber <= 0 ||
    (selectedAvailableStock > 0 && quantityNumber > selectedAvailableStock)
  );
  const canCreateDraft = Boolean(
    form.item_id &&
    hasQuantity &&
    !quantityInvalid &&
    form.reason_category &&
    !loading
  );

  const handleSelectItem = (item) => {
    setForm(prev => ({
      ...prev,
      item_id: item.id,
      item_name: item.name,
      sku: item.sku,
      available_stock: Number(item.stock || 0),
    }));
  };

  const handleChangeItem = () => {
    setForm(prev => ({
      ...prev,
      item_id: '',
      item_name: '',
      sku: '',
      available_stock: 0,
      quantity: '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity || !form.reason_category) {
      alert('Please fill in required fields');
      return;
    }

    if (quantityInvalid) {
      alert('Please enter a valid quantity that does not exceed available stock');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createStockOutRecord', {
        item_id: form.item_id,
        item_name: form.item_name,
        sku: form.sku,
        stock_out_class: stockOutClass,
        quantity: Number(form.quantity),
        reason_category: form.reason_category,
        reason_notes: form.reason_notes,
        location: form.location,
        department: form.department,
        cost_centre: form.cost_centre,
        site_id: form.site_id,
        source: 'MANUAL',
        environment: 'LIVE',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'class') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-2xl border border-border max-w-sm w-full shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Record Stock-Out</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">What type of stock-out is this?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setStockOutClass('WASTAGE');
                  setStep('details');
                }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <p className="font-semibold text-sm text-foreground">Wastage</p>
                <p className="text-xs text-muted-foreground mt-1">True loss due to damage, expiry, or spoilage</p>
              </button>
              <button
                onClick={() => {
                  setStockOutClass('STORE_USE');
                  setStep('details');
                }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <p className="font-semibold text-sm text-foreground">Store Use</p>
                <p className="text-xs text-muted-foreground mt-1">Legitimate internal consumption or operations</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card z-10">
          <div>
            <h2 className="text-base font-semibold text-foreground">Record {stockOutClass === 'WASTAGE' ? 'Wastage' : 'Store Use'}</h2>
            <p className="text-xs text-muted-foreground mt-1">Create a draft stock-out record</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Item selection */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-xs font-medium text-muted-foreground block">Item</label>
              {form.item_id && (
                <button
                  type="button"
                  onClick={handleChangeItem}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Change item
                </button>
              )}
            </div>

            {form.item_id ? (
              <div className="p-3 rounded-xl border border-primary bg-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{form.item_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.sku || 'No SKU'} · Stock: {selectedAvailableStock}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                    <CheckCircle2 size={13} />
                    Selected
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search by item name, SKU, or barcode..."
                    className="pl-9"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found</span>
                  {itemSearch && (
                    <button
                      type="button"
                      onClick={() => setItemSearch('')}
                      className="font-medium text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {filteredItems.length > 0 ? (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {filteredItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.sku || 'No SKU'} · Stock: {item.stock ?? 0}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <p className="text-sm font-medium text-foreground">No items found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching by item name, SKU, or barcode.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {form.item_id && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedAvailableStock || undefined}
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    className={quantityInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {quantityInvalid && (
                    <p className="text-[11px] text-destructive mt-1">
                      Quantity must be 1{selectedAvailableStock > 0 ? `–${selectedAvailableStock}` : ' or more'}.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason</label>
                  <select
                    value={form.reason_category}
                    onChange={(e) => setForm(prev => ({ ...prev, reason_category: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {stockOutClass === 'WASTAGE' ? (
                      <>
                        <option value="DAMAGED">Damaged</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="SPOILED">Spoiled</option>
                        <option value="CONTAMINATED">Contaminated</option>
                        <option value="BREAKAGE">Breakage</option>
                      </>
                    ) : (
                      <>
                        <option value="STAFF_REFRESHMENT">Staff Refreshments</option>
                        <option value="CLEANING_USE">Cleaning Use</option>
                        <option value="BREAKROOM">Breakroom Supplies</option>
                        <option value="TOILETRIES">Toiletries / Amenities</option>
                        <option value="OFFICE_USE">Office Use</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Site / Branch</label>
                  <select
                    value={form.site_id}
                    onChange={(e) => {
                      const selectedSite = sites.find(site => site.id === e.target.value);
                      setForm(prev => ({
                        ...prev,
                        site_id: e.target.value,
                        location: selectedSite?.name || prev.location,
                      }));
                    }}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No site selected</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">Selecting a site enables site-level stock guards.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location / Zone</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Floor 2, Storage A"
                  />
                </div>
              </div>

              {stockOutClass === 'STORE_USE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department</label>
                    <Input
                      value={form.department}
                      onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Facility Ops"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Cost Centre</label>
                    <Input
                      value={form.cost_centre}
                      onChange={(e) => setForm(prev => ({ ...prev, cost_centre: e.target.value }))}
                      placeholder="e.g., CC-101"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Additional Notes</label>
                <textarea
                  value={form.reason_notes}
                  onChange={(e) => setForm(prev => ({ ...prev, reason_notes: e.target.value }))}
                  placeholder="Optional context..."
                  className="w-full p-3 rounded-xl border border-input bg-background text-sm resize-none"
                  rows="3"
                />
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 p-4 border-t border-border bg-card">
          <button
            onClick={() => form.item_id ? handleChangeItem() : onClose()}
            className="px-4 h-9 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {form.item_id ? 'Change Item' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canCreateDraft}
            className="px-4 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Creating...' : 'Create Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
