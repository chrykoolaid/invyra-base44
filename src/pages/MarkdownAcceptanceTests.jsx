import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronDown, ChevronUp, AlertTriangle, Info, ArrowLeft } from 'lucide-react';

const TESTS = [
  {
    id: 'T01',
    group: 'Lifecycle',
    name: 'Create Markdown Batch',
    steps: [
      'Navigate to Markdown → Active Batches → New Batch.',
      'Select an inventory item with stock > 0.',
      'Enter a valid allocated_qty ≤ available stock.',
      'Submit as Staff role.',
    ],
    expected: 'Batch created in Pending_Approval status. MARKDOWN_CREATED event written to MarkdownEventLog. AuditLog entry created.',
    guardrails: ['Batch must NOT be Active until Supervisor/Manager approves.', 'No StockMovement posted on creation.'],
  },
  {
    id: 'T02',
    group: 'Lifecycle',
    name: 'Approve Markdown Batch',
    steps: [
      'As Supervisor or Manager, open the created batch from T01.',
      'Click Approve on the batch card.',
    ],
    expected: 'Batch status transitions to Active. MARKDOWN_APPROVED event created. AuditLog records old→new status.',
    guardrails: ['Staff must receive 403 if they attempt to call approveMarkdownBatch directly.'],
  },
  {
    id: 'T03',
    group: 'Labels',
    name: 'Print Label (Initial)',
    steps: [
      'With an Active batch (from T02), create a MarkdownRound record for Round 1.',
      'Invoke requestLabelReprint with print_type=Initial.',
      'Verify MarkdownPrintEvent created with print_type=Initial, print_status=Pending.',
    ],
    expected: 'MarkdownPrintEvent record created. LABEL_PRINTED event in MarkdownEventLog.',
    guardrails: ['MarkdownRound.print_count increments only on Success status.'],
  },
  {
    id: 'T04',
    group: 'Labels',
    name: 'Reprint Label with Reason (within limit)',
    steps: [
      'Invoke requestLabelReprint with print_type=Reprint, reason_code set.',
      'Confirm reprint count is within max_reprints (default: 2).',
    ],
    expected: 'Reprint event created. is_escalated=false. LABEL_REPRINTED in MarkdownEventLog.',
    guardrails: ['No escalation if within limit.'],
  },
  {
    id: 'T05',
    group: 'Labels',
    name: 'Reprint Label — Escalated (exceeds max_reprints)',
    steps: [
      'Submit reprint request when print_count >= max_reprints as Staff.',
      'Verify 403 returned to Staff.',
      'Retry as Manager → confirm approval path.',
    ],
    expected: 'Staff blocked with 403. Manager can call approveLabelReprint to unblock. is_escalated=true on the event.',
    guardrails: ['Staff cannot bypass the max_reprints cap via direct API call.'],
  },
  {
    id: 'T06',
    group: 'POS',
    name: 'POS Sale Allowed Before Expiry',
    steps: [
      'Call validateMarkdownPOSSale with valid batch_id, round_id, and a non-expired expiry_date.',
      'Confirm Sale_Allowed returned.',
      'Call postMarkdownSale with same params.',
    ],
    expected: 'All 8 checks pass. POSLineItem created with markdown_batch_id and markdown_round_id. MarkdownBatch.sold_qty+, current_remaining_qty−. SALE_POSTED event. StockMovement SALE/OUT posted.',
    guardrails: ['No direct InventoryItem.stock mutation — StockMovement only.'],
  },
  {
    id: 'T07',
    group: 'POS',
    name: 'POS Sale Blocked After Expiry',
    steps: [
      'Set MarkdownRound.expiry_date to a past date.',
      'Call validateMarkdownPOSSale.',
    ],
    expected: 'Sale_Blocked returned. expiry_date check fails. postMarkdownSale must not proceed.',
    guardrails: ['Validation re-run inside postMarkdownSale as fail-closed check.'],
  },
  {
    id: 'T08',
    group: 'POS',
    name: 'POS Sale Blocked — Voided Barcode',
    steps: [
      'Set MarkdownRound.barcode_status = Voided.',
      'Call validateMarkdownPOSSale.',
    ],
    expected: 'Sale_Blocked. barcode_status check fails.',
    guardrails: [],
  },
  {
    id: 'T09',
    group: 'Floor',
    name: 'Remove from Display',
    steps: [
      'Call removeMarkdownFromFloor with batch_id and actual_floor_count.',
      'Use a count that produces <5% variance.',
    ],
    expected: 'Batch transitions to Review_Queue. MarkdownReviewQueue entry created with SLA deadlines (warning/escalation/critical). REMOVED_FROM_DISPLAY and VARIANCE_RECORDED events logged.',
    guardrails: ['No StockMovement posted on removal.'],
  },
  {
    id: 'T10',
    group: 'Variance',
    name: 'Variance Below Supervisor Threshold (0–5%)',
    steps: [
      'Submit floor count producing <5% variance.',
      'Check ReviewQueue initial status.',
    ],
    expected: 'ReviewQueue.status = Supervisor_Ack (auto-advanced). variance_percent populated correctly.',
    guardrails: [],
  },
  {
    id: 'T11',
    group: 'Variance',
    name: 'Variance Above Manager Threshold (>10%)',
    steps: [
      'Submit floor count producing >10% variance.',
      'Check ReviewQueue initial status.',
    ],
    expected: 'ReviewQueue.status = Pending_Investigation. requires_manager_auth = true in response.',
    guardrails: ['Disposition cannot proceed without Manager acknowledgement.'],
  },
  {
    id: 'T12',
    group: 'Disposition',
    name: 'Single Disposition (Full)',
    steps: [
      'As Manager, call processMarkdownDisposition with outcome_type=Waste, qty = actual_floor_count.',
    ],
    expected: 'MarkdownDisposition confirmed. StockMovement WASTE/OUT created. MarkdownBatch → Disposition_Complete. ReviewQueue → Disposition_Complete. DISPOSITION_CONFIRMED event.',
    guardrails: ['No direct InventoryItem.stock mutation.'],
  },
  {
    id: 'T13',
    group: 'Disposition',
    name: 'Split Disposition',
    steps: [
      'Call processMarkdownDisposition twice for the same review_queue_id with partial qtys that sum to actual_floor_count.',
      'e.g. Waste 5 + Donate 3 for a floor count of 8.',
    ],
    expected: 'First call: is_fully_disposed=false. Batch stays in Review_Queue. Second call: is_fully_disposed=true. Batch → Disposition_Complete.',
    guardrails: ['Batch must NOT close after first partial disposition.'],
  },
  {
    id: 'T14',
    group: 'Disposition',
    name: 'Recovery Workflow',
    steps: [
      'Call processMarkdownDisposition with outcome_type=Recover.',
    ],
    expected: 'No StockMovement WASTE posted. MarkdownBatch.recovered_qty incremented. Batch → Recovered. RECOVERY_COMPLETED event in MarkdownEventLog.',
    guardrails: ['Recover must never post a waste movement.'],
  },
  {
    id: 'T15',
    group: 'POS',
    name: 'POS Sale Reversal',
    steps: [
      'After T06, call reverseMarkdownSale with the line_item_id and a reversal_reason.',
      'Confirm as Supervisor.',
    ],
    expected: 'Original POSLineItem.is_reversed=true. Reversal POSLineItem created (qty negative, reversal_of set). StockMovement REVERSAL/IN posted. MarkdownBatch.sold_qty−, current_remaining_qty+. SALE_REVERSED event. Quantity moved to MarkdownReviewQueue.',
    guardrails: ['Staff must receive 403. Reversal cannot be applied twice to same line item.'],
  },
  {
    id: 'T16',
    group: 'Sync',
    name: 'Offline Scanner Sync Conflict',
    steps: [
      'Create a MarkdownSyncQueue entry with sync_status=Queued.',
      'Simulate a conflict by setting conflict_reason and sync_status=Conflict.',
      'Verify the entry is flagged for Manual_Review.',
    ],
    expected: 'No automatic resolution. Entry remains in Conflict state for operator review. No ledger changes until manually resolved.',
    guardrails: ['System must not auto-resolve conflicts.'],
  },
  {
    id: 'T17',
    group: 'Integrity',
    name: 'StockMovement Failure Rollback',
    steps: [
      'Simulate a StockMovement create failure during processMarkdownDisposition.',
      'Verify MarkdownDisposition remains in Pending state.',
      'Verify MarkdownBatch does not transition to Disposition_Complete.',
    ],
    expected: 'Disposition stays Pending. Batch stays in Review_Queue. No partial ledger update. Re-try is safe.',
    guardrails: ['Function uses linear write order — if StockMovement fails, subsequent updates do not execute.'],
  },
  {
    id: 'T18',
    group: 'Audit',
    name: 'AuditLog Created on Every State Transition',
    steps: [
      'Run T01 through T15.',
      'Query AuditLog filtered by source_module=Markdown.',
    ],
    expected: 'AuditLog entry for every transition: MARKDOWN_CREATED, MARKDOWN_APPROVED, ROUND_PROGRESS, LABEL_PRINTED, SALE_POSTED, SALE_REVERSED, REMOVED_FROM_DISPLAY, DISPOSITION_CONFIRMED, RECOVERY_COMPLETED.',
    guardrails: ['Each entry must include item_id, sku, old_value, new_value, changed_by, actor_role, action_type.'],
  },
  {
    id: 'T19',
    group: 'Audit',
    name: 'MarkdownEventLog Created on Every Transition',
    steps: [
      'Run full lifecycle (T01–T15).',
      'Query MarkdownEventLog for the test batch.',
    ],
    expected: 'Full immutable event chain present: MARKDOWN_CREATED → MARKDOWN_APPROVED → LABEL_PRINTED → SALE_POSTED → REMOVED_FROM_DISPLAY → VARIANCE_RECORDED → DISPOSITION_CONFIRMED.',
    guardrails: ['MarkdownEventLog must be append-only. No updates or deletes.'],
  },
  {
    id: 'T20',
    group: 'Reporting',
    name: 'Printable Monitor Sheet Output',
    steps: [
      'Navigate to Markdown → Monitor Sheet.',
      'Confirm all Active batches appear with: batch_ref, item_name, status, round, allocated qty, remaining qty, sold qty, sell-through %, price, expiry, barcode.',
      'Click Print / Export.',
    ],
    expected: 'Browser print dialog opens. Print-only header visible. .print:hidden elements hidden. Totals row correct.',
    guardrails: ['Monitor Sheet must not require an internet connection to render (client-side data only).'],
  },
];

const GROUP_COLORS = {
  Lifecycle:   'bg-blue-50 text-blue-700 border-blue-200',
  Labels:      'bg-purple-50 text-purple-700 border-purple-200',
  POS:         'bg-green-50 text-green-700 border-green-200',
  Floor:       'bg-amber-50 text-amber-700 border-amber-200',
  Variance:    'bg-orange-50 text-orange-700 border-orange-200',
  Disposition: 'bg-red-50 text-red-700 border-red-200',
  Sync:        'bg-slate-50 text-slate-700 border-slate-200',
  Integrity:   'bg-rose-50 text-rose-700 border-rose-200',
  Audit:       'bg-indigo-50 text-indigo-700 border-indigo-200',
  Reporting:   'bg-teal-50 text-teal-700 border-teal-200',
};

export default function MarkdownAcceptanceTests() {
  const [statuses, setStatuses] = useState({});
  const [expanded, setExpanded] = useState({});
  const [groupFilter, setGroupFilter] = useState('All');

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const setStatus = (id, status) => setStatuses(s => ({ ...s, [id]: status }));

  const groups = ['All', ...new Set(TESTS.map(t => t.group))];
  const filtered = groupFilter === 'All' ? TESTS : TESTS.filter(t => t.group === groupFilter);

  const passed = Object.values(statuses).filter(s => s === 'pass').length;
  const failed = Object.values(statuses).filter(s => s === 'fail').length;
  const total = TESTS.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Phase 1 Acceptance Tests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manual verification checklist for all locked Phase 1 workflows</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link to="/Markdown" className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
            <ArrowLeft size={13} /> Back to Markdown
          </Link>
          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">{passed} Passed</span>
          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">{failed} Failed</span>
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border font-semibold">{total - passed - failed} Pending</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${total > 0 ? ((passed / total) * 100) : 0}%` }}
        />
      </div>

      {/* Group filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`h-7 px-3 text-xs rounded-full border font-medium transition-all ${
              groupFilter === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(test => {
          const status = statuses[test.id];
          const isOpen = expanded[test.id];
          const gc = GROUP_COLORS[test.group] || 'bg-slate-50 text-slate-700 border-slate-200';

          return (
            <div key={test.id} className={`border rounded-lg overflow-hidden ${status === 'pass' ? 'border-green-200' : status === 'fail' ? 'border-red-200' : 'border-border'}`}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggle(test.id)}
              >
                <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">{test.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${gc}`}>{test.group}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{test.name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setStatus(test.id, 'pass'); }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${status === 'pass' ? 'bg-green-500 text-white' : 'border border-border text-muted-foreground hover:border-green-500 hover:text-green-600'}`}
                  >
                    <CheckCircle size={13} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setStatus(test.id, 'fail'); }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${status === 'fail' ? 'bg-red-500 text-white' : 'border border-border text-muted-foreground hover:border-red-500 hover:text-red-600'}`}
                  >
                    <AlertTriangle size={12} />
                  </button>
                </div>
                {isOpen ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
              </div>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border space-y-3 bg-muted/10">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Steps</p>
                    <ol className="space-y-1">
                      {test.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-xs text-foreground">
                          <span className="flex-shrink-0 font-mono text-muted-foreground">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Expected Result</p>
                    <p className="text-xs text-foreground bg-green-50 border border-green-200 rounded p-2">{test.expected}</p>
                  </div>
                  {test.guardrails.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Guardrails</p>
                      <ul className="space-y-1">
                        {test.guardrails.map((g, i) => (
                          <li key={i} className="flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-1.5">
                            <Info size={11} className="flex-shrink-0 mt-0.5" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}