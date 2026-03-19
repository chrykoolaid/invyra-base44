import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Download, Printer, Search, FileText } from 'lucide-react';

const documents = [
  { id: 'DOC-001', type: 'Loadsheet',     supplier: 'ChemSupply Co',         po: 'PO-2026-001', uploaded: '2026-03-17', status: 'New',      file: 'loadsheet_PO2026001.pdf' },
  { id: 'DOC-002', type: 'Delivery Note', supplier: 'ChemSupply Co',         po: 'PO-2026-001', uploaded: '2026-03-18', status: 'New',      file: 'delivnote_PO2026001.pdf' },
  { id: 'DOC-003', type: 'Loadsheet',     supplier: 'CleanTex Distributors', po: 'PO-2026-002', uploaded: '2026-03-15', status: 'Reviewed', file: 'loadsheet_PO2026002.pdf' },
  { id: 'DOC-004', type: 'Delivery Note', supplier: 'CleanTex Distributors', po: 'PO-2026-002', uploaded: '2026-03-16', status: 'Printed',  file: 'delivnote_PO2026002.pdf' },
  { id: 'DOC-005', type: 'Loadsheet',     supplier: 'PackPro Solutions',     po: 'PO-2026-003', uploaded: '2026-03-12', status: 'Reviewed', file: 'loadsheet_PO2026003.pdf' },
  { id: 'DOC-006', type: 'Delivery Note', supplier: 'PackPro Solutions',     po: 'PO-2026-003', uploaded: '2026-03-13', status: 'Printed',  file: 'delivnote_PO2026003.pdf' },
  { id: 'DOC-007', type: 'Loadsheet',     supplier: 'LaundryChem Direct',    po: 'PO-2026-004', uploaded: '2026-03-08', status: 'Printed',  file: 'loadsheet_PO2026004.pdf' },
  { id: 'DOC-008', type: 'Delivery Note', supplier: 'SafetyFirst Supplies',  po: 'PO-2026-005', uploaded: '2026-03-06', status: 'Reviewed', file: 'delivnote_PO2026005.pdf' },
];

const statusStyle = {
  New:      'bg-blue-50 text-blue-700 border border-blue-200',
  Reviewed: 'bg-amber-50 text-amber-700 border border-amber-200',
  Printed:  'bg-green-50 text-green-700 border border-green-200',
};

const typeStyle = {
  Loadsheet:     'bg-muted text-muted-foreground border border-border',
  'Delivery Note': 'bg-muted text-muted-foreground border border-border',
};

export default function DeliveryPortal() {
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(new Set());

  const filtered = documents.filter(d =>
    d.file.toLowerCase().includes(query.toLowerCase()) ||
    d.po.toLowerCase().includes(query.toLowerCase()) ||
    d.supplier.toLowerCase().includes(query.toLowerCase()) ||
    d.id.toLowerCase().includes(query.toLowerCase())
  );

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(d => d.id)));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-4">Delivery Portal</h1>

      {/* Search + actions */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by document, PO, or supplier…"
            className="h-8 w-72 border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>

        <button className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <RefreshCw size={13} /> Refresh
        </button>

        <button
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={13} /> Download Selected {selected.size > 0 && `(${selected.size})`}
        </button>

        <button
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={13} /> Print Selected {selected.size > 0 && `(${selected.size})`}
        </button>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              {['Document ID', 'Type', 'Supplier', 'PO #', 'Date Uploaded', 'Status', 'File'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <tr
                key={doc.id}
                onClick={() => toggleRow(doc.id)}
                className={`border-t border-border cursor-pointer transition-all duration-150 ${
                  selected.has(doc.id) 
                    ? 'bg-primary/10 border-l-4 border-l-primary' 
                    : i % 2 === 0 ? 'bg-card' : 'bg-background'
                } hover:bg-primary/5`}
              >
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(doc.id)}
                    onChange={() => toggleRow(doc.id)}
                    onClick={e => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{doc.id}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeStyle[doc.type]}`}>{doc.type}</span>
                </td>
                <td className="px-4 py-2.5 font-medium">{doc.supplier}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{doc.po}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{doc.uploaded}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[doc.status]}`}>{doc.status}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <FileText size={12} />{doc.file}
                    </span>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Print"
                    >
                      <Printer size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No documents found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}