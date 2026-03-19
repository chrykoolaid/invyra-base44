import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';

const sampleOrders = [
  { id: 'PO-2024-001', supplier: 'LinenPro Wholesale', date: '2024-03-15', items: 3, total: 3300.00, status: 'Pending' },
  { id: 'PO-2024-002', supplier: 'CleanTex Distributors', date: '2024-03-14', items: 2, total: 1440.00, status: 'Shipped' },
  { id: 'PO-2024-003', supplier: 'Hotel Supply Co', date: '2024-03-12', items: 5, total: 4250.00, status: 'Delivered' },
  { id: 'PO-2024-004', supplier: 'Premium Linens Ltd', date: '2024-03-10', items: 4, total: 2100.00, status: 'Delivered' },
  { id: 'PO-2024-005', supplier: 'Fabric Solutions Inc', date: '2024-03-08', items: 2, total: 890.00, status: 'Cancelled' },
];

export default function Orders() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search orders..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.id}</TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell className="text-right">{order.items}</TableCell>
                <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
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