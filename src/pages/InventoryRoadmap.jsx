import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Link2,
  Lock,
  MapPin,
  PackageOpen,
  PauseCircle,
  PlugZap,
  Radio,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';

// ─── RFID Scope ───────────────────────────────────────────────────────────────
const rfidScope = {
  title: 'Hybrid RFID + Barcode Integration v1',
  status: 'TO DO / SCOPED',
  source: 'RFID strategy discussion — June 2026',
  reason: 'Invyra will adopt a Hybrid RFID model: UHF RFID for high-volume batch tasks (Stocktakes, Receiving batches, zone-level movements) and Barcode scanning as the reliable fallback for item-level exceptions, adjustments, and environments where RFID signal is unreliable. This must not replace the existing barcode intake infrastructure — it extends it.',
  summary: [
    'Extend ScannerIntakeQueue to support dual scan_type: RFID and BARCODE.',
    'Add debounce and aggregation logic to processScannerIntake so thousands of RFID tag pings collapse into a single validated ledger update.',
    'Add is_rfid_enabled flag to StorageArea so RFID-capable zones are explicitly declared and auditable.',
    'RFID-triggered movements must still produce StockMovement records identical to barcode-triggered ones — the ledger must not know or care about the source.',
    'Barcodes remain the primary method for manual single-item actions: Adjustments, Wastage, Markdown label scans, and POS line items.',
  ],
  plannedFeatures: [
    'scan_type field on ScannerIntakeQueue: RFID | BARCODE',
    'RFID batch session grouping: aggregate reads by session_id, device_id, and location before posting',
    'Debounce window config per StorageArea (e.g. 500ms default, configurable up to 5s)',
    'Ghost read filtering: discard repeated tag reads within debounce window',
    'is_rfid_enabled flag on StorageArea entity',
    'rfid_zone_id reference on StorageArea for portal/antenna mapping',
    'Handheld UI mode toggle: UHF RFID mode vs Barcode mode per session',
    'RFID batch review screen before committing to ledger (mirrors existing Scanner Intake Queue review)',
    'Conflict detection: flag items read in two RFID zones simultaneously',
    'Failover path: if RFID read fails or tag is absent, prompt for barcode scan',
    'Audit trail: every RFID-triggered movement tagged with scan_source: RFID in StockMovement',
  ],
  technicalRequirements: [
    'ScannerIntakeQueue.scan_type must default to BARCODE to preserve backward compatibility',
    'processScannerIntake function must branch on scan_type and apply debounce/aggregation for RFID sessions',
    'RFID aggregated reads must produce a single ScannerIntakeQueue record per item per session, not one per ping',
    'StockMovement ledger entry must be structurally identical regardless of scan source',
    'StorageArea.is_rfid_enabled must be false by default — opt-in per zone only',
    'RFID zone configuration must be Admin/Manager only — Staff cannot enable or disable zones',
    'All RFID session commits must be logged in AuditLog with session_id, device_id, tag_count, and operator_id',
    'Ghost read deduplication must run server-side in processScannerIntake — not client-side only',
    'LIVE/TRAINING/TEST environment separation must apply to RFID sessions identical to barcode sessions',
  ],
  dataModel: [
    'ScannerIntakeQueue: add scan_type (RFID | BARCODE), rfid_session_id, rfid_tag_count, rfid_debounce_ms, aggregated_from_pings',
    'StorageArea: add is_rfid_enabled (boolean, default false), rfid_zone_id (string), rfid_antenna_ref (string)',
    'StockMovement: add scan_source (RFID | BARCODE | MANUAL) — optional denormalized field for reporting',
    'New entity RFIDSession: session_id, device_id, operator_id, location_id, storage_area_id, started_at, committed_at, tag_count, status (OPEN | COMMITTED | ABANDONED | CONFLICT), environment',
  ],
  ownershipRules: [
    'ScannerIntakeQueue owns RFID and Barcode intake processing — both paths flow through the same review and approval workflow',
    'StorageArea owns RFID zone configuration — zones must not be created outside the Locations module',
    'StockMovement remains the source of truth — RFID is a trigger source, not a separate ledger',
    'Markdowns, Wastage, and POS continue to use Barcode scanning only for item-level operations',
    'RFID hardware integration (antennas, portals, tag encoding) is out of Invyra software scope — handled by hardware vendor',
  ],
  outOfScope: [
    'RFID portal/antenna hardware installation or configuration',
    'RFID tag encoding, printing, or physical tagging workflow',
    'Replacing barcodes for single-item Adjustments, Wastage, Markdown label scans, or POS operations',
    'Real-time live location tracking (item-level GPS or continuous zone polling)',
    'AI-powered ghost read filtering or predictive zone mapping',
    'Full recall workflow triggered by RFID zone reads',
    'Customer-facing RFID availability lookup',
  ],
  dependencies: [
    'ScannerIntakeQueue entity and processScannerIntake function',
    'StorageArea entity with is_rfid_enabled flag',
    'StockMovement ledger integrity and LIVE/TRAINING/TEST separation',
    'AuditLog for session-level RFID commit events',
    'Locations and StorageArea modules for zone setup',
    'Role/permission model (Admin/Manager for zone config, Staff for session operation)',
  ],
  priority: [
    'Scope accepted — June 2026',
    'Implement after ScannerIntakeQueue barcode workflow is stable and validated in LIVE',
    'Phase 1: Schema extensions + debounce logic in processScannerIntake',
    'Phase 2: RFID batch review UI in Scanner Intake tab',
    'Phase 3: StorageArea RFID zone configuration in Locations module',
    'Hardware pilot recommended in highest-volume storage area first',
  ],
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const tabs = [
  { key: 'foundation',    label: 'Foundation' },
  { key: 'operations',    label: 'Operations' },
  { key: 'hardware',      label: 'Hardware & Sync' },
  { key: 'purchasing',    label: 'Purchasing & Suppliers' },
  { key: 'intelligence',  label: 'Intelligence & AI' },
  { key: 'platform',      label: 'Platform & Config' },
  { key: 'deferred',      label: 'Deferred & OOS' },
];

// ─── Roadmap data keyed by tab ────────────────────────────────────────────────
const roadmapGroups = {
  foundation: [
    {
      title: 'Locked / Complete',
      description: 'Accepted inventory work and proof points that should not be reopened.',
      tone: 'emerald',
      icon: CheckCircle2,
      items: [
        {
          title: 'Inventory Verification Pass v1',
          status: 'PASSED / LOCKED',
          source: 'Verification thread lock',
          summary: [
            'Code-complete inventory workflows reclassified into operational validation and passed the controlled verification program.',
            'Do not reopen during roadmap or documentation consolidation work.',
          ],
        },
        {
          title: 'LIVE Inventory Seed + Opening Balance Pass v1',
          status: 'PASSED / LOCKED',
          source: 'LIVE seed proof',
          summary: [
            '10 real LIVE seed items created, item masters started at 0 stock',
            'Opening balances posted through Adjustment',
            'Central StockMovement ledger confirmed',
            'Dashboard and Advanced Reports reconciled to ₱24,270',
            'LIVE/TRAINING separation passed, Over-deduction guard passed, Setup gaps cleared to 0',
          ],
        },
        {
          title: 'Inventory UI cleanup locks',
          status: 'LOCKED UI BASELINE',
          source: 'Recent UI polish passes',
          summary: [
            'Inventory Sidebar Operations Sorting v1 accepted',
            'Inventory Page Action Cleanup v1 accepted',
            'Movements Page Readability Polish v1.2 accepted',
            'Inventory Roadmap Page v1 created as Admin-only read-only documentation',
          ],
        },
        {
          title: 'Item Details Transition Part 2B',
          status: 'LOCKED UI + READ-ONLY DRILL-DOWN',
          source: 'Item Details transition lock',
          summary: [
            'Inventory row-level View is now the primary item-level drill-down path into a read-only Item Details workspace.',
            'The old Stock History toolbar button was removed from Inventory UI only; stock-history internals remain preserved.',
            'Item Details includes Item Summary, Usage & Demand, Reorder Intelligence, and lightweight Stock Movement Summary.',
            'Part 2B fixed Audit Trail long-value wrapping so old/new JSON values no longer overlap.',
          ],
          ownershipRules: [
            'Item Details summarizes item-level health and movement activity; must not become a stock-changing workflow.',
            'Movements remains the full transaction ledger and source of truth for every stock change.',
            'Stock History internals remain available for Gap Scan, Reorder Review, Dashboard alerts, Reports, and Audit Trail.',
          ],
        },
        {
          title: 'Existing module baselines',
          status: 'LOCKED CURRENT FORM',
          source: 'Prior inventory module locks',
          summary: [
            'Gap Scan current baseline locked',
            'Suppliers current baseline locked',
            'Reorder Review current baseline locked',
            'Dashboard inventory value proof retained',
          ],
        },
      ],
    },
    {
      title: 'Active / Next',
      description: 'Near-term inventory review queue after the locked LIVE seed and Movements readability passes.',
      tone: 'sky',
      icon: ClipboardList,
      items: [
        {
          title: 'Inventory Roadmap Discovery + Consolidation v1',
          status: 'THIS PASS',
          source: 'Project-wide roadmap scan',
          summary: [
            'Consolidated inventory-related roadmap items from existing module pages into this Admin-only roadmap.',
            'Classified Payroll & Rostering and Time Tracking as non-inventory placeholder modules.',
            'Added Hybrid RFID scope — June 2026.',
          ],
        },
        {
          title: 'Module-by-module polish review queue',
          status: 'NEXT REVIEW QUEUE',
          source: 'Sidebar and module cleanup sequence',
          summary: [
            'Inventory Admin / Unit Pricing review',
            'Advanced Reports polish review',
            'Exports & Integrations classification review',
            'Adjustments, Wastage, Transfers, and Stocktake polish review',
            'Receiving / Delivery Portal workflow review',
            'Orders workflow continuation',
          ],
        },
      ],
    },
  ],

  operations: [
    {
      title: 'Core Stock Operations',
      description: 'Inventory-owned operational pages and stock-control workflows.',
      tone: 'teal',
      icon: PackageOpen,
      items: [
        {
          title: 'Stock operation modules',
          status: 'FOUNDATIONAL INVENTORY SCOPE',
          source: 'Operations sidebar and stock workflow pages',
          summary: [
            'Inventory item master remains the current stock truth surface',
            'Movements ledger remains the read-only audit trail',
            'Adjustments, Transfers, Stocktake, and Wastage stay as dedicated stock-changing modules',
            'Bulk Stock Update remains an inventory-list/admin utility',
          ],
          dependencies: [
            'StockMovement ledger integrity',
            'Role-gated stock-changing actions',
            'Over-deduction protection',
            'LIVE/TRAINING separation',
          ],
        },
        {
          title: 'Wastage operational hardening',
          status: 'ACTIVE / REVIEW LATER',
          source: 'Wastage page future notes',
          summary: [
            'Approved wastage movements should continue to feed reporting and audit views cleanly.',
            'Future action history and acknowledgement write endpoints remain planned until public write contracts exist.',
            'Grouped views can shape future reporting but must not pretend export/compliance output is finished before validation.',
          ],
        },
      ],
    },
    {
      title: 'Locations & Stock Visibility',
      description: 'Location master data and branch stock lookup without duplicating Transfers, Receiving, Stocktake, or Movements.',
      tone: 'teal',
      icon: MapPin,
      items: [
        {
          title: 'Locations v1',
          status: 'SCOPED / PLANNED',
          source: 'Locations v1 scope',
          reason: 'Locations should define where stock can exist and let users look up stock availability across branches and storage areas. It must not become a duplicate transfer, receiving, stocktake, or ledger module.',
          summary: [
            'Create a short, clean Locations module for branches/sites, storage areas, and stock visibility across locations.',
            'Allow users to search an item/SKU and see current stock at the current branch and permitted other branches.',
            'Support branch stock views for managers needing low stock, out-of-stock, recent movements, and stock by storage area.',
          ],
          plannedFeatures: [
            'Branch/site management: name, code, type, address, city, province, country, contact details, active/inactive, default flag',
            'Storage area management: stockrooms, shelves, zones, bins, receiving areas, damaged stock, quarantine, transfer/receiving/stocktake allowed flags',
            'Multi-location stock lookup: search item/SKU and show stock across permitted branches and storage areas',
            'Branch stock view: open one location and see all stock, low stock, out-of-stock, recent movements, stock by area',
            'Location status controls: Active, Inactive, Archived, Transfer/Receiving/Stocktake blocked',
            'is_rfid_enabled flag on StorageArea for Hybrid RFID zone declaration (see Hardware & Sync tab)',
          ],
          dataModel: [
            'Location: id, location_code, name, location_type, address, city, province, country, contact details, active/default/archive flags, notes',
            'StorageArea: id, location_id, storage_area_code, name, storage_type, active/archive flags, receiving/transfer/stocktake allowed, is_rfid_enabled',
            'ItemStockBalance: item_id, SKU, location_id, storage_area_id, on_hand_qty, reserved_qty, available_qty, incoming_qty, outgoing_qty, last_movement_at, balance_status, environment',
          ],
          dependencies: [
            'StockMovement ledger with location context',
            'ItemStockBalance read model',
            'Role/permission model',
            'LIVE/TRAINING/TEST environment separation',
          ],
        },
        {
          title: 'Expiry & Barcode Tracking v1',
          status: 'SCOPED / PLANNED',
          source: 'Expiry & Barcode Tracking v1 scope',
          reason: 'This is the expiry-aware stock foundation. It tracks which item barcode, batch, lot, and quantity expires when, then feeds Markdowns, Wastage, POS, Reports, Alerts, and compliance workflows.',
          summary: [
            'Track expiry dates against item barcodes, batches, lots, stock quantities, locations, and storage areas.',
            'Provide near-expiry and expired-stock visibility before items become markdown or wastage candidates.',
            'Support barcode lookup so staff can scan or search an item and see expiry, batch, lot, quantity, location, and status.',
            'Keep StockMovement as the source of truth and treat expiry balances as derived read models.',
          ],
          plannedFeatures: [
            'Barcode-to-item links: primary, alternate, supplier, pack barcode later; barcode type and status',
            'Expiry date capture during Receiving, Stocktake, barcode scan, batch entry, manual adjustment, Markdown prep, Wastage review',
            'Batch and lot tracking: batch number, lot number, supplier batch number, expiry date, quantity, received date, status',
            'Near-expiry alert windows: 30 days, 14 days, 7 days, expiry today, expired',
            'FIFO and FEFO support data for staff to identify stock to use, sell, transfer, markdown, or remove first',
            'Ready for Markdown and Ready for Wastage views without performing pricing or write-off inside this module',
          ],
          dataModel: [
            'ItemBarcode: id, item_id, SKU, barcode, barcode_type, is_primary, is_active',
            'ItemBatch: id, item_id, SKU, batch_number, lot_number, expiry_date, received_date, supplier_id, status',
            'ItemExpiryBalance: item_id, SKU, batch_id, location_id, storage_area_id, expiry_date, on_hand_qty, expiry_status, environment',
          ],
          dependencies: [
            'Inventory Items and barcode fields',
            'Locations and storage areas',
            'Receiving, Stocktake, Adjustments, Transfers, Markdowns, and Wastage workflow contracts',
            'StockMovement ledger with expiry-aware optional fields',
          ],
        },
      ],
    },
  ],

  hardware: [
    {
      title: 'Hardware & Sync Infrastructure',
      description: 'Scanner device management, RFID integration, and hybrid barcode/RFID data pipelines.',
      tone: 'sky',
      icon: Wifi,
      items: [rfidScope],
    },
  ],

  purchasing: [
    {
      title: 'Purchasing & Receiving',
      description: 'Replenishment workflow from reorder review through purchase orders and receiving evidence.',
      tone: 'indigo',
      icon: ClipboardCheck,
      items: [
        {
          title: 'Reorder Review + Orders + Receiving workflow',
          status: 'ACTIVE PRODUCT LINE',
          source: 'Purchasing sidebar and current module baselines',
          summary: [
            'Reorder Review remains the recommendation and draft-order start point.',
            'Orders continue as the purchase order workflow surface, including manual order and amendment flows.',
            'Receiving and Delivery Portal remain the stock-in and supplier/delivery support surfaces.',
          ],
          plannedFeatures: [
            'Partial receiving review',
            'Receiving evidence and delivery notes',
            'Supplier-linked purchase order outcomes',
            'Backorders automation — deferred',
            'Invoice 3-way matching — deferred',
          ],
        },
      ],
    },
    {
      title: 'Suppliers, Purchasing & Pricing',
      description: 'Supplier seed data, reference pricebooks, MOQ, lead-time, branch overrides, and reorder-readiness.',
      tone: 'amber',
      icon: Users,
      items: [
        {
          title: 'Supplier Seed & Pricing Foundation v1',
          status: 'SCOPED / PLANNED',
          source: 'Supplier Seed & Pricing Subsystem v1 scope',
          reason: 'A legally safe supplier setup foundation, not a live supplier marketplace or supplier recommendation engine.',
          summary: [
            'Add legally safe starter supplier data while keeping the existing Suppliers grid clean.',
            'Support reference pricebooks with MOQ, lead time, pack size, currency, and estimated service cost impact per kg.',
            'Support PH national and Iloilo local seed overlays without overwriting client-created suppliers or client overrides.',
          ],
          plannedFeatures: [
            'Supplier Type column: Starter / Client / Archived',
            'SYSTEM_SEED, CLIENT, and ARCHIVED supplier origins',
            'Supplier pricebook rows for seeded, client, and override pricing',
            'Admin/Owner ability to hide starter suppliers',
            'Supplier onboarding acknowledgement and disclaimer',
            'Branch-level supplier overrides for MOQ, lead time, price, and visibility',
            'Preferred and alternate supplier hooks for future reorder workflows',
          ],
          outOfScope: [
            'Live supplier marketplace or supplier recommendations engine',
            'Automatic supplier verification or online scraping',
            'Direct supplier ordering, payments, or contract management',
            'Full reorder automation engine',
          ],
          dependencies: [
            'Admin — Suppliers module',
            'Item master supplier fields',
            'Audit log',
            'Branch/location model',
            'Reorder Review workflow',
          ],
        },
        {
          title: 'Supplier Intelligence',
          status: 'DEFERRED / DEPENDS ON HISTORY',
          source: 'Reorder threshold discussion, Inventory Admin readiness',
          summary: [
            'Supplier lead time should become a first-class input for reorder point calculations.',
            'Supplier delivery reliability and receipt accuracy measured after Orders and Receiving are trusted.',
            'Supplier scorecards should come after basic operations have real movement, order, and receiving history.',
          ],
          plannedFeatures: [
            'Supplier lead-time field',
            'Purchase price history',
            'Delivery reliability metrics',
            'Receipt variance monitoring',
            'Supplier scorecards — deferred',
            'Supplier reorder suggestions — deferred',
          ],
        },
      ],
    },
  ],

  intelligence: [
    {
      title: 'Costing & Pricing Intelligence',
      description: 'Cost valuation and future pricing suggestions, separated from manual unit pricing.',
      tone: 'violet',
      icon: DollarSign,
      items: [
        {
          title: 'Cost Intelligence + Unit Valuation Suggestions v1',
          status: 'DEFERRED / FUTURE INTELLIGENCE',
          source: 'Inventory Admin Unit Pricing review',
          reason: 'Current unit pricing is manual and is used for inventory valuation. Later the system should suggest valuation costs using supplier purchase history, landed cost, average cost, and supplier price-change history.',
          summary: [
            'Unit Price on Inventory Admin should represent internal cost / landed valuation, not necessarily customer-facing selling price.',
            'Suggestions must be advisory only and require Admin approval before any cost value changes.',
          ],
          plannedFeatures: [
            'Last supplier purchase price',
            'Average landed cost',
            'Bulk-buy price changes and supplier cost-change warnings',
            'Suggested valuation cost with Confidence labels: Low / Medium / High',
            'Manual override remains available — no automatic cost changes',
          ],
          dependencies: [
            'Receiving price history',
            'Supplier records',
            'Inventory Admin audit log',
            'Advanced Reports valuation rules',
          ],
        },
        {
          title: 'Sales Pricing Recommendation Engine v1',
          status: 'INVENTORY-ADJACENT / LATER',
          source: 'Pricing strategy discussion',
          summary: [
            'Customer-facing selling price suggestions belong closer to POS, product catalogue, retail/service pricing, and margin reporting.',
            'Inventory can provide cost, movement, waste, and availability signals only.',
          ],
          plannedFeatures: [
            'Target margin input',
            'Demand / sell-through signals',
            'Slow-moving or overstock alerts',
            'Competitor price signal support — later',
            'Promotion suggestions — later',
            'Manual approval required — no automatic selling price changes',
          ],
        },
      ],
    },
    {
      title: 'Forecasting / AI — Later',
      description: 'Forecasting and AI belong after manual inventory operations have enough trusted history.',
      tone: 'violet',
      icon: BrainCircuit,
      items: [
        {
          title: 'Threshold Intelligence + Reorder Recommendation Engine v1',
          status: 'DEFERRED / IMPORTANT FUTURE ENHANCEMENT',
          source: 'LIVE seed pass follow-up',
          reason: 'During LIVE Inventory Seed + Opening Balance Pass v1, reorder point and reorder quantity were entered manually. Future users should not be expected to know exact reorder thresholds from day one.',
          summary: [
            'The system should eventually help users calculate reorder points and quantities from real movement history, supplier lead time, safety stock, and target stock coverage.',
          ],
          formulas: [
            { label: 'Reorder Point', value: 'average daily usage x supplier lead time days + safety stock' },
            { label: 'Suggested Reorder Quantity', value: 'target stock coverage - current stock' },
          ],
          plannedFeatures: [
            'Manual threshold helper text',
            'Supplier lead time, safety stock, target coverage days fields',
            'Suggested threshold mode with 30-day and 60-day movement usage windows',
            'Confidence labels: Low / Medium / High',
            'Reorder Review integration — no automatic purchasing without user approval',
          ],
          ownershipRules: [
            'Threshold Intelligence owns reorder calculations and suggestion logic.',
            'Item Details may display future threshold outputs but must not become a separate reorder engine.',
            'Reorder Review remains the operational review and draft-order start point.',
          ],
          dependencies: [
            'LIVE movement history',
            'StockMovement ledger',
            'Supplier lead-time records',
            'Reorder Review engine',
          ],
        },
        {
          title: 'AI inventory suggestions posture',
          status: 'OBSERVE-ONLY / LATER',
          source: 'Inventory governance lock',
          summary: [
            'AI reorder suggestions, AI pricing suggestions, and AI supplier risk summaries remain later-stage convenience features only.',
            'AI must not hide incomplete inventory workflows, mutate stock, create purchase orders, or change costs/prices without explicit approval.',
          ],
          plannedFeatures: [
            'Demand forecasting',
            'Waste probability signals',
            'Supplier variance prediction',
            'AI reorder / pricing / supplier risk summaries — later',
          ],
        },
      ],
    },
  ],

  platform: [
    {
      title: 'Configuration & Settings',
      description: 'System defaults, permissions, environment rules, supplier preferences, export safety defaults, and compliance controls.',
      tone: 'slate',
      icon: ShieldCheck,
      items: [
        {
          title: 'Inventory Settings & Configuration Module v1',
          status: 'SCOPED / PLANNED',
          source: 'Settings module scope v1',
          reason: 'Settings should become the configuration control centre for Inventory, not another operations page.',
          summary: [
            'Create a dedicated Admin settings area for business configuration, inventory defaults, reorder behaviour, supplier preferences, environment rules, permissions, notifications, export preferences, and audit/compliance settings.',
            'Settings controls defaults and behaviour only; operational modules continue to perform the work.',
            'Prototype controls must be honest: show Active, Read-only, Planned, Locked, or Admin Only.',
          ],
          plannedFeatures: [
            'Business Settings: name, country, currency, timezone, tax/date/currency formatting',
            'Inventory Defaults: default UOM, low stock threshold, reason lists, stock tracking, negative stock guard',
            'Reorder Settings: coverage days, lead time, MOQ, pack-size rounding, safety stock, manual approval',
            'Environment Settings: LIVE/TRAINING/TEST separation, banners, Admin PIN switching, Training/Test reset controls',
            'User and Role Settings: Owner/Admin control of all workflow permissions',
            'Notification Settings: low stock, out-of-stock, reorder, wastage, receiving discrepancy alerts',
            'Export Preferences: default format/date range/timezone, LIVE export protection, export audit logging',
            'Compliance and Audit Settings: audit retention, required reasons, environment switch logging',
          ],
          outOfScope: [
            'Do not duplicate the movement ledger, unit pricing records, full audit log table, Advanced Reports, or Exports and Integrations workspace',
            'No full billing, subscription, CRM, POS, Payroll, Time Tracking, or AI settings in v1',
            'No fake working controls for backend behaviour that is not persisted or wired yet',
          ],
          dependencies: [
            'Existing Admin sidebar',
            'Role/permission model',
            'Audit logging',
            'LIVE/TRAINING/TEST environment separation',
          ],
        },
      ],
    },
    {
      title: 'Reporting / Audit / Compliance',
      description: 'Read-only reports, ledger proof, valuation history, and audit exports.',
      tone: 'slate',
      icon: BarChart3,
      items: [
        {
          title: 'Inventory Admin reporting roadmap',
          status: 'CONSOLIDATED FROM INVENTORY ADMIN',
          source: 'InventoryAdmin Roadmap tab',
          summary: [
            'Inventory Admin remains the high-trust oversight hub for audit visibility, adjustment reporting, supplier scorecards, and inventory-level admin controls.',
          ],
          plannedFeatures: [
            'Stock value summary',
            'Movement audit trail',
            'Adjustment and wastage reporting',
            'Supplier reporting after Orders + Receiving are complete',
            'Role-gated admin history',
          ],
          dependencies: [
            'Inventory movement ledger coverage',
            'Wastage flow completion',
            'Return / refund inventory effects',
            'Export layer readiness',
          ],
        },
        {
          title: 'Inventory Performance roll-up report',
          status: 'PLANNED / ADVANCED REPORTS EXTENSION',
          source: 'Item Details roadmap consolidation check',
          summary: [
            'Add a business-wide inventory performance view under Advanced Reports, not as a new duplicate module.',
            'Roll up item-level insights across the business while Item Details remains the single-item drill-down view.',
          ],
          plannedFeatures: [
            'Total items, low stock items, slow-moving items, overstocked items, waste value, and inventory value KPIs',
            'Stock health distribution, fast vs slow movers, usage trend, and reorder risk sections',
            'Items Requiring Review table with View Item drill-down back into Item Details',
          ],
          ownershipRules: [
            'Advanced Reports owns business-wide inventory performance roll-ups.',
            'Item Details owns single-item read-only drill-downs.',
            'Movements owns transaction-level ledger history.',
          ],
        },
      ],
    },
    {
      title: 'Exports & Integrations',
      description: 'Inventory-adjacent exchange surfaces for external data sync and accounting connectors.',
      tone: 'indigo',
      icon: PlugZap,
      items: [
        {
          title: 'Controlled inventory exports',
          status: 'VERIFY BEFORE LOCK',
          source: 'Exports and Integrations page release roadmap',
          summary: [
            'Inventory CSV, order history, and adjustment/wastage export surfaces discovered in the project roadmap content.',
            'Treat export availability as requiring separate runtime verification before marking operationally locked.',
          ],
          dependencies: [
            'Stable inventory source data',
            'Orders workflow completion',
            'Receiving outcomes and ledger integrity',
            'Role-gated report/export access',
          ],
        },
        {
          title: 'Accounting sync + API/webhook hardening',
          status: 'DEFERRED / INTEGRATION HARDENING',
          source: 'Exports and Integrations connector roadmap',
          summary: [
            'Accounting connector and webhook surfaces should be governed as separate integration infrastructure work.',
            'External sync must not roll back internal stock movements if outbound sync fails.',
          ],
          plannedFeatures: [
            'OAuth/token handling',
            'Retry queue with backoff',
            'Integration failure boundaries',
            'Sync audit log',
            'Performance monitoring and webhook governance',
          ],
        },
      ],
    },
  ],

  deferred: [
    {
      title: 'Inventory Dependencies',
      description: 'Other module work that can affect inventory, but should not be treated as inventory implementation by default.',
      tone: 'amber',
      icon: Link2,
      items: [
        {
          title: 'POS receipt/refund inventory effects',
          status: 'DEPENDENCY / LATER MODULE',
          source: 'POS future receipt lookup note and Inventory Admin readiness row',
          summary: [
            'Receipt lookup, returns, refunds, and POS deductions may affect inventory later, but should be validated in their own POS/returns scope first.',
            'Inventory reports should only reflect return/refund effects after a trusted movement contract exists.',
          ],
        },
        {
          title: 'Payroll & Rostering / Time Tracking placeholders',
          status: 'RELATED BUT NON-INVENTORY',
          source: 'Payroll.jsx and TimeTracking.jsx',
          summary: [
            'Payroll & Rostering is a workforce planning placeholder module.',
            'Time Tracking is an attendance truth placeholder module.',
            'Neither module should be merged into Inventory Roadmap as active inventory work.',
          ],
        },
      ],
    },
    {
      title: 'Out of Scope / Not Now',
      description: 'Explicit boundaries that protect the locked LIVE inventory proof and keep the roadmap honest.',
      tone: 'rose',
      icon: PauseCircle,
      items: [
        {
          title: 'Do not change locked inventory behaviour during roadmap work',
          status: 'LOCKED OUT OF SCOPE',
          source: 'Roadmap implementation guardrail',
          summary: [
            'Do not change Inventory item creation',
            'Do not change Adjustments, Wastage, Transfers, Receiving, or Reorder Review logic',
            'Do not change StockMovement ledger logic',
            'Do not change Dashboard or Advanced Reports calculations',
            'Do not change Bulk Stock Update',
            'Do not change LIVE seeded inventory data',
          ],
        },
        {
          title: 'No automatic intelligence actions yet',
          status: 'NOT NOW',
          source: 'Forecasting, pricing, and supplier roadmap discussions',
          summary: [
            'Do not automate purchasing',
            'Do not auto-change unit costs or customer selling prices',
            'Do not add supplier scorecards yet',
            'Do not add AI before inventory operations are stable with real history',
            'Do not treat Payroll or Time Tracking placeholders as inventory scope',
          ],
        },
      ],
    },
  ],
};

// ─── Tone config ──────────────────────────────────────────────────────────────
const toneClasses = {
  emerald: { icon: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  sky:     { icon: 'bg-sky-50 text-sky-700 border-sky-200',             badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  teal:    { icon: 'bg-teal-50 text-teal-700 border-teal-200',          badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  indigo:  { icon: 'bg-indigo-50 text-indigo-700 border-indigo-200',    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  amber:   { icon: 'bg-amber-50 text-amber-700 border-amber-200',       badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  violet:  { icon: 'bg-violet-50 text-violet-700 border-violet-200',    badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  slate:   { icon: 'bg-slate-100 text-slate-700 border-slate-200',      badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  rose:    { icon: 'bg-rose-50 text-rose-700 border-rose-200',          badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ children, tone }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${toneClasses[tone]?.badge || toneClasses.slate.badge}`}>
      {children}
    </span>
  );
}

function DetailList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item, index) => (
          <li key={index} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormulaList({ formulas }) {
  if (!formulas?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Core formulas</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {formulas.map((formula) => (
          <div key={formula.label} className="rounded-xl border border-border bg-background px-3 py-3">
            <p className="text-sm font-semibold text-foreground">{formula.label}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{formula.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapCard({ item, tone }) {
  const [open, setOpen] = useState(false);
  const hasDetails = item.plannedFeatures || item.technicalRequirements || item.dataModel || item.ownershipRules || item.outOfScope || item.dependencies || item.priority || item.formulas;

  return (
    <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-4 py-4 flex items-start justify-between gap-3"
        onClick={() => hasDetails && setOpen(o => !o)}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            <StatusBadge tone={tone}>{item.status}</StatusBadge>
          </div>
          {item.source && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source: {item.source}</p>
          )}
          {item.reason && (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
          )}
          {item.summary && (
            <ul className="mt-1 space-y-1">
              {item.summary.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-muted-foreground/40 flex-shrink-0 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasDetails && (
          <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && hasDetails && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <FormulaList formulas={item.formulas} />
          <DetailList title="Planned features" items={item.plannedFeatures} />
          <DetailList title="Technical requirements" items={item.technicalRequirements} />
          <DetailList title="Data model" items={item.dataModel} />
          <DetailList title="Ownership rules" items={item.ownershipRules} />
          <DetailList title="Out of scope" items={item.outOfScope} />
          <DetailList title="Dependencies" items={item.dependencies} />
          <DetailList title="Priority" items={item.priority} />
        </div>
      )}
    </article>
  );
}

function RoadmapGroup({ group }) {
  const [open, setOpen] = useState(true);
  const Icon = group.icon || ClipboardList;
  return (
    <section className="rounded-3xl border border-border bg-muted/15 overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${toneClasses[group.tone].icon}`}>
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {group.items.map((item) => (
            <RoadmapCard key={item.title} item={item} tone={group.tone} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InventoryRoadmap() {
  const [activeTab, setActiveTab] = useState('foundation');
  const groups = roadmapGroups[activeTab] || [];

  return (
    <div className="p-5 lg:p-6 max-w-[1200px] space-y-5">
      {/* Header */}
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Lock className="h-4 w-4" strokeWidth={1.9} />
              Admin-only read-only planning page
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Inventory Roadmap</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Consolidated product-planning reference for inventory-owned work, hardware infrastructure, adjacent dependencies, deferred intelligence, and out-of-scope boundaries. This page does not write inventory records, movement records, dashboard values, reports, reorder settings, or seeded LIVE data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Read-only
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <Lock className="h-3.5 w-3.5" /> Admin access
            </span>
          </div>
        </div>
      </header>

      {/* Lock notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <AlertTriangle className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">Locked inventory passes remain closed.</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              Inventory Verification Pass v1, LIVE Inventory Seed + Opening Balance Pass v1, the accepted Movements readability baseline, and the Item Details Part 2B transition are documented here as accepted proof only. This roadmap must not alter stock, ledger, Dashboard, Advanced Reports, Reorder Review, or seeded LIVE data.
            </p>
          </div>
        </div>
      </div>

      {/* RFID highlight */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white/70">
          <Radio className="h-4 w-4 text-sky-600" strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sky-900">New scope added: Hybrid RFID + Barcode Integration v1</p>
          <p className="text-xs text-sky-700/80 mt-0.5">Scoped June 2026 — see Hardware & Sync tab for the full scope card.</p>
        </div>
        <button
          onClick={() => setActiveTab('hardware')}
          className="flex-shrink-0 h-7 px-3 text-xs font-semibold rounded-lg border border-sky-300 bg-white text-sky-700 hover:bg-sky-100 transition-colors"
        >
          View scope
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`h-9 px-4 rounded-xl border text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <RoadmapGroup key={group.title} group={group} />
        ))}
      </div>
    </div>
  );
}