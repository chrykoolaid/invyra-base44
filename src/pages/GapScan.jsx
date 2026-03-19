import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

const gapItems = [
  { sku: 'DUV-004', name: 'Duvet Cover - King', onHand: 95, parLevel: 150, gap: -55, priority: 'High' },
  { sku: 'ROB-006', name: 'Bathrobe - Large', onHand: 60, parLevel: 100, gap: -40, priority: 'High' },
  { sku: 'TWL-001', name: 'Bath Towel - White', onHand: 450, parLevel: 500, gap: -50, priority: 'Medium' },
  { sku: 'SHT-002', name: 'Flat Sheet - Queen', onHand: 320, parLevel: 400, gap: -80, priority: 'Medium' },
  { sku: 'PIL-003', name: 'Pillow Case - Standard', onHand: 280, parLevel: 300, gap: -20, priority: 'Low' },
];

export default function GapScan() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Gap Scan</h1>
        <Button size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm text-muted-foreground">
          Showing {gapItems.length} items below par level
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Par Level</TableHead>
              <TableHead className="text-right">Gap</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gapItems.map((item) => (
              <TableRow key={item.sku}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">{item.onHand}</TableCell>
                <TableCell className="text-right">{item.parLevel}</TableCell>
                <TableCell className="text-right text-destructive font-medium">{item.gap}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.priority === 'High' ? 'bg-destructive/10 text-destructive' :
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {item.priority}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}