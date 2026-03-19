import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';

const sampleItems = [
  { sku: 'TWL-001', name: 'Bath Towel - White', category: 'Towels', onHand: 450, parLevel: 500, location: 'A-1' },
  { sku: 'SHT-002', name: 'Flat Sheet - Queen', category: 'Sheets', onHand: 320, parLevel: 400, location: 'B-2' },
  { sku: 'PIL-003', name: 'Pillow Case - Standard', category: 'Pillows', onHand: 280, parLevel: 300, location: 'B-3' },
  { sku: 'DUV-004', name: 'Duvet Cover - King', category: 'Bedding', onHand: 95, parLevel: 150, location: 'C-1' },
  { sku: 'MAT-005', name: 'Bath Mat - White', category: 'Mats', onHand: 180, parLevel: 200, location: 'A-2' },
  { sku: 'ROB-006', name: 'Bathrobe - Large', category: 'Robes', onHand: 60, parLevel: 100, location: 'D-1' },
];

export default function Inventory() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Par Level</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleItems.map((item) => (
              <TableRow key={item.sku}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">{item.onHand}</TableCell>
                <TableCell className="text-right">{item.parLevel}</TableCell>
                <TableCell>{item.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}