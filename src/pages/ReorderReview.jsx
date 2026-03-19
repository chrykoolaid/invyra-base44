import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send } from 'lucide-react';

const reorderItems = [
  { sku: 'DUV-004', name: 'Duvet Cover - King', supplier: 'LinenPro Wholesale', qty: 60, unitCost: 45.00, total: 2700.00, selected: true },
  { sku: 'ROB-006', name: 'Bathrobe - Large', supplier: 'CleanTex Distributors', qty: 45, unitCost: 32.00, total: 1440.00, selected: true },
  { sku: 'SHT-002', name: 'Flat Sheet - Queen', supplier: 'Hotel Supply Co', qty: 100, unitCost: 18.50, total: 1850.00, selected: false },
  { sku: 'TWL-001', name: 'Bath Towel - White', supplier: 'LinenPro Wholesale', qty: 75, unitCost: 8.00, total: 600.00, selected: false },
];

export default function ReorderReview() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Reorder Review</h1>
        <Button size="sm">
          <Send className="w-4 h-4 mr-2" />
          Create Orders
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm text-muted-foreground">
          {reorderItems.length} items suggested for reorder
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reorderItems.map((item) => (
              <TableRow key={item.sku}>
                <TableCell>
                  <Checkbox defaultChecked={item.selected} />
                </TableCell>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
                <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}