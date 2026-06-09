import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { FlaskConical, Monitor, Receipt, RefreshCw } from 'lucide-react';
import ServiceList from '@/components/pos/ServiceList';
import RecipeEditor from '@/components/pos/RecipeEditor';
import SimulationPreview from '@/components/pos/SimulationPreview';
import AddServiceModal from '@/components/pos/AddServiceModal';
import POSRegister from '@/components/pos/POSRegister';

const TABS = [
  { id: 'recipes', label: 'Recipe Configurator', icon: FlaskConical },
  { id: 'register', label: 'Register', icon: Monitor },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
];

export default function POSMode() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [svcs, items] = await Promise.all([
      base44.entities.LaundryService.filter({ is_active: true }, 'name', 200),
      base44.entities.InventoryItem.filter({ is_active: true }, 'name', 200),
    ]);
    setServices(svcs || []);
    setInventoryItems(items || []);
    setLoading(false);
  }, []);

  const loadRecipes = useCallback(async (serviceId) => {
    if (!serviceId) return;
    const data = await base44.entities.ServiceRecipe.filter({ service_id: serviceId }, '', 100);
    setRecipes(data || []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSelectService = (svc) => {
    setSelectedService(svc);
    loadRecipes(svc.id);
  };

  const handleRecipeChange = () => {
    if (selectedService) loadRecipes(selectedService.id);
  };

  const handleServiceAdded = () => {
    setShowAddModal(false);
    loadAll();
  };

  const selectedRecipes = recipes.filter(r => r.service_id === selectedService?.id);

  return (
    <div className="p-5 lg:p-6 max-w-[1200px] space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">POS Mode</h1>
          <p className="text-sm text-muted-foreground">Service catalogue, recipe configurator, and register workspace.</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-3 text-sm rounded-xl border border-border hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Recipe Configurator Tab */}
      {activeTab === 'recipes' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ height: '620px' }}>
          <div className="grid grid-cols-[280px_1fr] h-full divide-x divide-border">
            <ServiceList
              services={services}
              selectedId={selectedService?.id}
              onSelect={handleSelectService}
              onAdd={() => setShowAddModal(true)}
            />
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <RecipeEditor
                  service={selectedService}
                  recipes={selectedRecipes}
                  inventoryItems={inventoryItems}
                  onRecipeChange={handleRecipeChange}
                />
              </div>
              {selectedService && selectedRecipes.length > 0 && (
                <SimulationPreview
                  recipes={selectedRecipes}
                  inventoryItems={inventoryItems}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Tab */}
      {activeTab === 'register' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ height: '620px' }}>
          <POSRegister services={services} inventoryItems={inventoryItems} />
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Receipt size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Receipt lookup coming in a future phase</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Search and retrieve past transaction receipts by order or customer reference.</p>
        </div>
      )}

      {showAddModal && (
        <AddServiceModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleServiceAdded}
        />
      )}
    </div>
  );
}