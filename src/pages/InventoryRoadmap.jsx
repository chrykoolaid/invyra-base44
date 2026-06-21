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
  title: 'Hybrid RFID Visibility Layer v1',
  status: 'LATER / ENTERPRISE SCOPED',
  source: 'RFID hybrid model discussion — June 2026',
  reason: 'Invyra should remain barcode-first and ledger-first for core operations. RFID becomes an optional accelerated capture and visibility layer for selected clients, storage zones, and workflows. RFID evidence must never bypass Stocktake, Receiving, Transfers, Adjustments, Wastage, or other approved inventory workflows.',
  summary: [
    'Adopt a hybrid model: barcodes remain the default operational capture method; RFID is an optional enterprise layer for high-volume visibility and validation.',
    'Use RFID to detect presence, zone/location evidence, receiving counts, transfer verification, and stocktake acceleration — not to directly change on-hand stock.',
    'Route RFID reads into controlled evidence/review queues before any inventory workflow creates StockMovement records.',
    'Keep StockMovement as the source of truth; RFID sessions are capture evidence, not a separate inventory ledger.',
    'Configure RFID only per device and per storage area so clients can enable it selectively without making RFID mandatory for all inventory users.',
  ],
  plannedFeatures: [
    'RFID Visibility Layer under Hardware & Sync, with device assignment managed from Inventory Settings / Sync & Devices.',
    'RFID-capable device type support for handheld RFID readers, fixed readers, and portal readers.',
    'StorageArea RFID zone declaration: is_rfid_enabled, rfid_zone_id, and reader/antenna references.',
    'RFID session capture: device_id, operator_id, location_id, storage_area_id, session purpose, tag count, started_at, completed_at, and environment.',
    'RFID evidence queue for review before routing to Stocktake, Receiving, Transfers, or exception investigation.',
    'RFID-assisted stocktake mode where tag reads pre-fill count evidence but supervisor reconciliation still controls posting.',
    'RFID-assisted receiving and transfer verification where tag reads compare expected vs detected items before existing workflow confirmation.',
    'Unknown/default location detection when RFID evidence conflicts with known ItemStockBalance location data.',
    'Barcode fallback prompt for untagged items, damaged RFID tags, signal gaps, and single-item exception handling.',
    'Conflict detection for duplicate tag reads, ghost reads, reads from two zones, or reads from inactive locations.',
  ],
  technicalRequirements: [
    'RFID must be feature-flagged off by default and enabled only by Admin/Owner configuration.',
    'StorageArea.is_rfid_enabled must default to false; RFID zones must be opt-in and auditable.',
    'RFID reads must write only to an RFID evidence/session model or intake queue until an approved inventory workflow accepts them.',
    'No RFID read may directly create, approve, reverse, or amend StockMovement records.',
    'Debounce, deduplication, and ghost-read filtering must run server-side or bridge-side, not client-side only.',
    'RFID session commits must preserve LIVE/TRAINING/TEST environment separation exactly like barcode/scanner workflows.',
    'All RFID configuration changes and session routing actions must be AuditLog-visible with actor, device, location, storage area, and timestamp.',
    'RFID reader identity must be trusted through Inventory-owned device registration; IP address or reader self-reporting alone is not enough.',
    'Barcode workflows must remain fully functional when RFID is unavailable, disabled, or not licensed for a client.',
  ],
  dataModel: [
    'StorageArea: add is_rfid_enabled (boolean, default false), rfid_zone_id (string), rfid_reader_ref / rfid_antenna_ref (string), rfid_notes (optional)',
    'DeviceRegistry / scanner registry: support device_type values such as BARCODE_HANDHELD, RFID_HANDHELD, RFID_FIXED_READER, RFID_PORTAL, and assigned location/storage area',
    'New RFIDSession: session_id, device_id, operator_id, location_id, storage_area_id, session_purpose, started_at, completed_at, tag_count, status, environment',
    'New RFIDReadEvidence or ScannerIntakeQueue extension: session_id, epc/tag_id, item_id/SKU if resolved, read_count, first_seen_at, last_seen_at, confidence, conflict_flags',
    'Optional StockMovement.scan_source for reporting only after an approved workflow posts the movement; values may include MANUAL, BARCODE, SCANNER_BRIDGE, RFID_ASSISTED',
  ],
  ownershipRules: [
    'Inventory ledger owns stock truth; RFID owns capture evidence only.',
    'Inventory Settings / Sync & Devices owns RFID reader registration, trust, environment tagging, and device assignment.',
    'Locations / Storage Areas owns RFID zone metadata and whether a zone is RFID-enabled.',
    'Stocktake owns reconciliation and stock-count posting, even when RFID pre-fills count evidence.',
    'Receiving owns supplier delivery confirmation, even when RFID validates expected items.',
    'Transfers owns dispatch/receive confirmation, even when RFID validates source/destination presence.',
    'Adjustments and Wastage remain governed workflows; RFID may raise evidence but must not auto-adjust or auto-write-off.',
    'Barcode scanning remains the fallback and normal method for POS, markdown label validation, wastage exceptions, and single-item operations.',
  ],
  outOfScope: [
    'RFID as a required dependency for core inventory operation',
    'Automatic stock changes from passive RFID reads',
    'Automatic transfers, adjustments, write-offs, markdowns, or receiving confirmation from RFID alone',
    'Replacing barcode scanning for POS, Markdown label scans, Wastage, or single-item exception workflows',
    'RFID hardware installation, cabling, antenna tuning, tag selection, or tag encoding service',
    'Real-time customer-facing item tracking or public stock visibility based on RFID reads',
    'AI-driven ghost-read prediction or continuous item-level surveillance in the first RFID phase',
  ],
  dependencies: [
    'Inventory Settings / Sync & Devices device registry and trust model',
    'Locations and Storage Areas module for RFID zone setup',
    'StockMovement ledger integrity and approved workflow posting rules',
    'Stocktake, Receiving, and Transfers workflows for routing accepted RFID evidence',
    'AuditLog and LIVE/TRAINING/TEST environment separation',
    'Barcode scanner workflows and fallback capture path',
  ],
  priority: [
    'Keep RFID deferred until barcode, Locations, Stocktake, Transfers, Receiving, and scanner bridge workflows are stable.',
    'Phase 1: Roadmap and data-model scope only — no runtime activation.',
    'Phase 2: Device registry and StorageArea RFID-zone metadata design.',
    'Phase 3: RFID evidence/session intake design with debounce and conflict rules.',
    'Phase 4: Pilot RFID-assisted Stocktake in one controlled storage area.',
    'Phase 5: Expand to receiving/transfer validation only after stocktake evidence pilot passes.',
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
            'Added Hybrid RFID Visibility Layer scope — June 2026.',
          ],
        },
        {
          title: 'Module Progression Review — June 2026',
          status: 'UPDATED / THIS PASS',
          source: 'Uploaded inventory build module scan and no-duplication review',
          reason: 'The current build now covers most core inventory surfaces. The next roadmap risk is not missing major modules — it is adding duplicate sidebar modules when the correct shape is a sub-workflow inside an existing module.',
          summary: [
            'Confirmed active inventory coverage: Dashboard, POS Mode, Markdown, Locations, Inventory, Movements, Adjustments, Transfers, Stocktake, Stock-Out Exceptions/Wastage, Expiry & Batches, Suppliers, Reorder Review, Orders, Receiving, Delivery Portal, Gap Scan, Exceptions, Reports, Inventory Settings, Roadmap, Training, and forecasting verification/UI wiring. Exports & Integrations is now treated as Inventory Settings → Data Exchange, not a standalone sidebar module.',
            'Recommended posture: stabilize current modules before adding more top-level sidebar items.',
            'Remaining gaps should be implemented as governed sub-workflows: Item Master governance, Holds/Quarantine/Recall, Supplier Returns/Claims, Fill Tasks, Cycle Count Planner, and Device/Label Administration.',
            'Do not create standalone duplicate modules for Store Use, Scanner Intake, Markdown Reports, Floor Scan, Forecasting, Branch Lookup, or Expiry Reports.',
          ],
          ownershipRules: [
            'Inventory owns item-level detail and future Item Master governance.',
            'Exceptions owns cross-module alert and hold/release triage.',
            'Receiving/Suppliers own supplier returns and claims.',
            'Gap Scan owns shelf evidence and replenishment/fill tasks.',
            'Stocktake owns cycle-count planning and reconciliation.',
            'Inventory Settings owns device, scanner, label, role, and configuration controls.',
          ],
          priority: [
            'Do not add new top-level modules until the active hardening queue is verified.',
            'Patch route permission gaps for InventorySettings, Locations, ExpiryTracking, and SupplierPortal before commercial lock.',
            'Fix Owner role normalization so Owner is not treated as Staff by dev role fallback logic.',
            'Fix Inventory Bridge diagnostic validator path drift before bridge stack is marked clean.',
            'Runtime-test Stock-Out Exceptions and Markdown end-to-end before locking either module.',
          ],
        },
        {
          title: 'Module-by-module polish review queue',
          status: 'NEXT REVIEW QUEUE',
          source: 'Sidebar and module cleanup sequence',
          summary: [
            'Inventory Settings / Unit Pricing governance review',
            'Reports polish review',
            'Data Exchange classification review',
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
          status: 'FOUNDATION BUILT / NEEDS REVIEW',
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
          status: 'FOUNDATION BUILT / NEEDS REVIEW',
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
    {
      title: 'No-Duplication Module Gap Recommendations',
      description: 'Genuine gaps found in the current build and where they should live without bloating the sidebar.',
      tone: 'amber',
      icon: ClipboardList,
      items: [
        {
          title: 'Item Master / Product Catalogue Governance',
          status: 'GAP / ADD AS INVENTORY SUB-WORKFLOW',
          source: 'Module progression review — June 2026',
          reason: 'Inventory has item records and Item Details, but the roadmap needs a formal governance path for product identity and controlled catalogue fields. This should not duplicate the Inventory module.',
          summary: [
            'Start inside Inventory → Item Details as an Item Master / Governance section.',
            'Govern SKU identity, product name, barcode aliases, pack size, UOM, category, preferred supplier, tax group, active/inactive status, expiry/batch flags, markdown eligibility, and wastage eligibility.',
            'Keep stock-changing actions out of Item Master governance; it controls product identity and rules only.',
          ],
          ownershipRules: [
            'Inventory owns the item master and read-only item details workspace.',
            'Movements remains the stock transaction source of truth.',
            'Suppliers may provide preferred supplier references but must not own item identity.',
          ],
        },
        {
          title: 'Holds / Quarantine / Recall Control',
          status: 'HIGH-VALUE GAP / ADD UNDER EXCEPTIONS',
          source: 'Module progression review — June 2026',
          reason: 'The system needs a way to block unsafe or disputed stock without immediately writing it off as wastage, adjusting it, or changing the Item Master.',
          summary: [
            'Use cases include supplier recall, contamination concern, damaged stock awaiting decision, expired stock blocked from sale, batch under investigation, and do-not-sell manager holds.',
            'Place under Exceptions as Holds / Quarantine rather than a new sidebar module.',
            'A hold should reserve/block stock visibility and sale/use eligibility without posting stock out until a governed decision is made.',
          ],
          ownershipRules: [
            'Exceptions owns hold lifecycle triage and release/escalation workflow.',
            'Expiry & Batches supplies batch/expiry context for batch-level holds.',
            'Wastage only takes ownership after a disposal/write-off decision is approved.',
            'POS later consumes hold status as a sale-blocking signal; it does not own the hold.',
          ],
        },
        {
          title: 'Return to Supplier / Supplier Claims',
          status: 'GAP / ADD UNDER RECEIVING OR SUPPLIERS',
          source: 'Module progression review — June 2026',
          reason: 'Supplier claims are different from wastage because the business may recover credit, replacement stock, or corrected deliveries. They should not be hidden inside Wastage.',
          summary: [
            'Use cases include damaged-on-delivery, wrong item supplied, expired/short-dated stock received, supplier credit request, and return authorization tracking.',
            'Best placement: Receiving → Supplier Returns / Claims, with supplier-level summary inside Suppliers.',
            'Claims may reference ReceivingRecord, PurchaseOrder, StockMovement, Supplier, and AuditLog records without duplicating them.',
          ],
          ownershipRules: [
            'Receiving owns evidence captured at delivery/receipt time.',
            'Suppliers owns supplier-level claim visibility and performance context.',
            'StockMovement owns any actual stock-in or stock-out posting.',
            'Wastage does not own recoverable supplier claims unless the stock is finally disposed.',
          ],
        },
        {
          title: 'Replenishment / Fill Tasks',
          status: 'GAP / ADD UNDER GAP SCAN',
          source: 'Module progression review — June 2026',
          reason: 'Gap Scan can identify an empty shelf even when backroom stock exists. That should create a fill/replenishment task, not a supplier reorder or a stocktake variance.',
          summary: [
            'Use case: shelf is empty or low, backroom has stock, staff need to refill shelf, no purchase order required.',
            'Place under Gap Scan as Fill Tasks / Replenishment Tasks.',
            'Keep it evidentiary and task-based; do not post ledger movements unless a governed transfer/location movement contract exists.',
          ],
          ownershipRules: [
            'Gap Scan owns shelf observation and fill task creation.',
            'Locations/StorageArea supplies backroom/shelf stock context.',
            'Reorder Review only takes over when supplier replenishment is actually needed.',
            'Stocktake owns variance/reconciliation, not routine shelf-fill work.',
          ],
        },
        {
          title: 'Cycle Count Planner',
          status: 'GAP / ADD UNDER STOCKTAKE',
          source: 'Module progression review — June 2026',
          reason: 'Full Stocktake exists, but later operations need smaller scheduled counts for high-risk or high-value items without creating a second reconciliation module.',
          summary: [
            'Use cases include daily high-risk item count, weekly category count, expiry-sensitive count, high-shrink item count, and manager-assigned count task.',
            'Place as Stocktake → Cycle Count Planner.',
            'Cycle counts may create variances and sign-off flows through the existing Stocktake/StockMovement governance path.',
          ],
          ownershipRules: [
            'Stocktake owns all count planning, count evidence, variance review, and reconciliation posting.',
            'Dashboard and Exceptions may surface cycle count tasks or alerts but do not own them.',
          ],
        },
        {
          title: 'Device & Label Administration',
          status: 'GAP / ADD UNDER INVENTORY SETTINGS',
          source: 'Module progression review — June 2026',
          reason: 'Scanner pairing, portable printers, and label templates are admin configuration tasks. They should not become day-to-day operation modules.',
          summary: [
            'Use Inventory Settings → Sync & Devices for paired scanners, device health, last seen, approved device list, and environment tagging.',
            'Use Inventory Settings → Labels & Printers for markdown label templates, barcode rules, portable printer setup, and print fallback rules.',
            'Scanner Intake stays inside Stock-Out Exceptions; Markdown print/report workflows stay inside Markdown.',
          ],
          ownershipRules: [
            'Inventory Settings owns devices, label templates, printers, pairing, and environment controls.',
            'Scanner Intake owns intake review only.',
            'Markdown owns markdown labels and take-off/holiday reports only.',
          ],
        },
      ],
    },
  ],

  hardware: [
    {
      title: 'Hardware & Sync Infrastructure',
      description: 'Scanner device management, optional RFID visibility, and hybrid barcode/RFID evidence pipelines.',
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
          source: 'Reorder threshold discussion, Inventory Settings readiness',
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
          source: 'Inventory Settings Unit Pricing review',
          reason: 'Current unit pricing is manual and is used for inventory valuation. Later the system should suggest valuation costs using supplier purchase history, landed cost, average cost, and supplier price-change history.',
          summary: [
            'Unit Price in Inventory Settings / Item governance should represent internal cost / landed valuation, not necessarily customer-facing selling price.',
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
            'Inventory Settings audit log',
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
          status: 'FOUNDATION BUILT / NEEDS ALIGNMENT',
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
            'Scanner Device Registry sub-module: device registration, pairing, environment tagging, and connectivity status — Admin/Owner only (see Scanner Device Registry card below)',
          ],
          outOfScope: [
            'Do not duplicate the movement ledger, unit pricing records, full audit log table, Advanced Reports, or Exports and Integrations workspace',
            'No full billing, subscription, CRM, POS, Payroll, Time Tracking, or AI settings in v1',
            'No fake working controls for backend behaviour that is not persisted or wired yet',
            'Scanner Device Registry must not include scanner intake processing or exception review — those remain in the Scanner Intake tab under Stock-Out Exceptions',
          ],
          dependencies: [
            'Existing Admin sidebar',
            'Role/permission model',
            'Audit logging',
            'LIVE/TRAINING/TEST environment separation',
          ],
        },
        {
          title: 'Scanner Device Registry (sub-module of Admin Settings)',
          status: 'TO DO / SCOPED',
          source: 'Hardware & Sync strategy discussion — June 2026',
          reason: 'Scanner device registration and pairing are Admin configuration tasks, not day-to-day operational workflows. Housing the device registry inside Admin Settings avoids creating a standalone module that would invite scope creep into operational scanning workflows. The inventoryBridgePairingDiagnostic backend function already provides pairing health data that this UI should surface.',
          summary: [
            'A sub-section within Admin Settings for registering, pairing, and monitoring scanner/terminal devices.',
            'Admin/Owner only — Staff and Supervisors should never access device configuration.',
            'Surfaces pairing health from the existing inventoryBridgePairingDiagnostic function.',
            'Does not process scan data — that remains in processScannerIntake and the Scanner Intake review tab.',
          ],
          plannedFeatures: [
            'Device registration: device_id, device_name, device_type (handheld | fixed terminal | RFID portal), serial number, assigned location, assigned storage area',
            'Pairing status: paired, pending, failed, offline — sourced from inventoryBridgePairingDiagnostic',
            'Environment tagging: LIVE, TRAINING, or TEST — prevents cross-environment data contamination',
            'Last seen timestamp and last successful sync timestamp per device',
            'Deactivate, re-pair, and archive device actions — Admin only',
            'RFID-capable flag per device linking to StorageArea.is_rfid_enabled (see Hardware & Sync tab)',
            'Audit log: every registration, re-pair, deactivation, and environment change logged with actor and timestamp',
          ],
          ownershipRules: [
            'Admin Settings owns device registration, identity, pairing, and environment tagging',
            'Scanner Intake tab (Stock-Out Exceptions) owns the intake queue review, exception triage, and duplicate management',
            'processScannerIntake function owns the server-side intake processing pipeline',
            'inventoryBridgePairingDiagnostic function owns pairing health checks — the registry UI reads from it, never duplicates it',
            'Locations/StorageArea owns RFID zone configuration — the device registry links to zones but does not manage zone rules',
          ],
          outOfScope: [
            'Scan intake processing, exception review, or duplicate marking — those stay in Scanner Intake tab',
            'RFID zone rules or debounce configuration — those belong in StorageArea settings under Locations',
            'Firmware update delivery, remote device management, or device MDM integration',
            'Real-time device telemetry, usage analytics, or per-device scan volume reporting',
          ],
          dependencies: [
            'inventoryBridgePairingDiagnostic backend function',
            'ScannerIntakeQueue entity (device_id and session_id fields)',
            'StorageArea entity (is_rfid_enabled flag)',
            'Locations module for location and storage area assignment',
            'Admin Settings module structure',
            'AuditLog for all device lifecycle events',
            'LIVE/TRAINING/TEST environment separation',
          ],
        },
        {
          title: 'Inventory RBAC Console (sub-module of Admin Settings)',
          status: 'TO DO / SCOPED',
          source: 'Role/permission management gap — June 2026',
          reason: 'Inventory role permissions are currently hardcoded in lib/rolePermissions.js. As the system grows, Admins need a visual console to understand what each role can and cannot do, without editing source code. This must be a read/configure surface only — it does not rewrite the permission model itself.',
          summary: [
            'A visual role and permission overview panel within Admin Settings, showing what each inventory role (Staff, Supervisor, Manager, Admin, Owner) can access and perform.',
            'Initially read-only — displays the current permission map from rolePermissions.js as a structured UI.',
            'Later phases may allow Admins to toggle specific permission flags within governed boundaries.',
            'Must not duplicate or replace the underlying role model — it surfaces and optionally configures it.',
          ],
          plannedFeatures: [
            'Role matrix view: rows = roles (Staff, Supervisor, Manager, Admin, Owner), columns = modules (Inventory, Adjustments, Wastage, Transfers, Stocktake, Receiving, Orders, Reports, Exports, Settings)',
            'Permission cell indicators: Full Access, Read Only, Approval Only, No Access, Planned',
            'Module-level drill-down: click a role/module cell to see specific action-level permissions',
            'Phase 2: Admin-configurable permission flags within governed boundaries (e.g. allow Supervisors to post Adjustments)',
            'All permission changes must be audit logged with old value, new value, changed by, role, and timestamp',
            'Environment-aware: LIVE permission config should not be editable from TRAINING or TEST context',
          ],
          ownershipRules: [
            'Admin Settings owns the visual RBAC console and any configurable permission flags',
            'lib/rolePermissions.js remains the source of truth for the current hardcoded permission model',
            'RoleGuard component owns route-level access enforcement — the console does not replace it',
            'Individual module pages own their own role-gated UI rendering — the console does not override them',
          ],
          outOfScope: [
            'Do not replace lib/rolePermissions.js or RoleGuard with a fully dynamic DB-backed permission engine in v1',
            'No user invitation, user deactivation, or user profile management — those belong in a separate User Management section',
            'No external SSO, SAML, or OAuth role mapping in v1',
          ],
          dependencies: [
            'lib/rolePermissions.js and lib/permissions.js',
            'RoleGuard component',
            'Admin Settings module structure',
            'AuditLog for permission change events',
            'LIVE/TRAINING/TEST environment awareness',
          ],
        },
      ],
    },
    {
      title: 'Reporting / Audit / Compliance',
      description: 'Read-only reports, ledger proof, valuation history, audit exports, and unified alert management.',
      tone: 'slate',
      icon: BarChart3,
      items: [
        {
          title: 'Unified Alert & Notification Center v1',
          status: 'TO DO / SCOPED',
          source: 'Alert management gap — June 2026',
          reason: 'Inventory alerts (StockOutAlert, reorder alerts, wastage discrepancy, receiving discrepancy, markdown SLA warnings) are currently scattered across page-level widgets. A unified Alert Center provides a single triage surface where managers can see, acknowledge, and resolve all inventory alerts across modules — without duplicating the records those alerts reference.',
          summary: [
            'A dedicated alert management view within Inventory Settings or a top-level Exceptions surface, listing all open, acknowledged, and resolved inventory alerts in one place.',
            'Does not store the source events — StockMovement, StockOutRecord, MarkdownReviewQueue, and ReceivingRecord remain the source of truth.',
            'Provides lifecycle management: Open, Acknowledged, Resolved, Deduped — matching the existing StockOutAlert status model.',
            'Role-gated: Staff see their own alerts, Supervisors see branch alerts, Managers and Admins see all.',
          ],
          plannedFeatures: [
            'Unified alert list: filter by severity (LOW, MEDIUM, HIGH, CRITICAL), alert type, module, location, and status',
            'Alert types: HIGH_VALUE_WASTAGE, REPEATED_SKU_WASTAGE, UNKNOWN_BARCODE, DUPLICATE_SCAN, AMENDMENT_AFTER_POST, REVERSAL_AFTER_POST, LOW_STOCK, REORDER_TRIGGERED, RECEIVING_DISCREPANCY, MARKDOWN_SLA_WARNING',
            'Acknowledge, resolve, and dedupe actions with mandatory reason capture',
            'Alert detail panel: linked record drill-down to StockOutRecord, MarkdownReviewQueue, ReceivingRecord, or StockMovement without leaving the alert center',
            'Alert age indicators: time since opened, SLA thresholds for escalation',
            'Dashboard widget showing open critical and high alert counts (feeds existing Dashboard Priority Issues)',
            'Notification dispatch log: which alerts triggered email/in-app notifications and to whom',
          ],
          ownershipRules: [
            'Alert Center owns alert triage, lifecycle management, and the unified alert view',
            'StockOutAlert entity owns the alert records themselves — Alert Center reads and updates status only',
            'StockOutRecord, MarkdownReviewQueue, ReceivingRecord, and StockMovement remain source-of-truth records — Alert Center links to them, never duplicates them',
            'Individual module pages (Wastage, Markdown, Receiving) may still show contextual alert banners for their own workflows',
            'Dashboard Priority Issues section remains a summary widget — Alert Center is the full management surface',
            'checkReorderAlerts and acknowledgeStockOutAlert backend functions remain the alert creation and acknowledgement engines',
          ],
          outOfScope: [
            'Do not create a second alert storage layer — use the existing StockOutAlert entity',
            'Do not duplicate StockOutRecord, MarkdownReviewQueue, or ReceivingRecord data inside the Alert Center',
            'No external push notification delivery (SMS, WhatsApp, email routing) in v1 — notification dispatch is a future phase',
            'No alert suppression rules engine or dynamic escalation policies in v1',
          ],
          dependencies: [
            'StockOutAlert entity',
            'acknowledgeStockOutAlert, resolveStockOutAlert, dedupeStockOutAlert backend functions',
            'checkReorderAlerts backend function',
            'StockOutRecord, MarkdownReviewQueue, ReceivingRecord, StockMovement entities for drill-down links',
            'Role/permission model for visibility scoping',
            'Dashboard Priority Issues widget for summary integration',
          ],
        },
        {
          title: 'Inventory Settings reporting governance roadmap',
          status: 'CONSOLIDATED FROM INVENTORY ADMIN',
          source: 'InventoryAdmin Roadmap tab',
          summary: [
            'Inventory Settings remains the high-trust oversight hub for audit visibility, adjustment reporting, supplier scorecards, and inventory-level admin controls.',
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
          source: 'POS future receipt lookup note and Inventory Settings readiness row',
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
          title: 'Do not create duplicate sidebar modules',
          status: 'LOCKED ROADMAP BOUNDARY',
          source: 'Module progression review — June 2026',
          summary: [
            'Do not create Store Use as a standalone module — keep it inside Stock-Out Exceptions.',
            'Do not create Scanner Intake as a standalone module — keep review inside Stock-Out Exceptions and configuration inside Inventory Settings.',
            'Do not create Markdown Reports as a standalone module — keep take-off, holiday, and closure reporting inside Markdown.',
            'Do not create Floor Scan as a standalone module — keep shelf observation under Gap Scan / ScanOps bridge.',
            'Do not create Forecasting as a large operational module yet — keep outputs advisory inside Item Details, Reorder Review, Dashboard, and Reports.',
            'Do not create Branch Lookup or Expiry Reports as standalone modules — keep them under Locations, Item Details, Expiry & Batches, and Reports.',
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
          <p className="text-sm font-semibold text-sky-900">New scope added: Hybrid RFID Visibility Layer v1</p>
          <p className="text-xs text-sky-700/80 mt-0.5">Scoped June 2026 as a later enterprise capability — see Hardware & Sync tab for the full scope card.</p>
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