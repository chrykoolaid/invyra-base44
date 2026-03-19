import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';

const sampleSuppliers = [
  { id: 'SUP-001', name: 'LinenPro Wholesale', contact: 'John Smith', phone: '(555) 123-4567', items: 24, status: 'Active' },
  { id: 'SUP-002', name: 'CleanTex Distributors', contact: 'Maria Garcia', phone: '(555) 234-5678', items: 18, status: 'Active' },
  { id: 'SUP-003', name: 'Hotel Supply Co', contact: 'David Lee', phone: '(555) 345-6789', items: 32, status: 'Active' },
  { id: 'SUP-004', name: 'Fabric Solutions Inc', contact: 'Sarah Wilson', phone: '(555) 456-7890', items: 15, status: 'Inactive' },
  { id: 'SUP-005', name: 'Premium Linens Ltd', contact: 'Mike Brown', phone: '(555) 567-8901', items: 21, status: 'Active' },
];

export default function Suppliers() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Suppliers</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-mono text-sm">{supplier.id}</TableCell>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell className="text-right">{supplier.items}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded ${
                    supplier.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {supplier.status}
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