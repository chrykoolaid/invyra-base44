import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScanLine, Search } from 'lucide-react';

const pendingReceipts = [
  { id: 'PO-2024-001', supplier: 'LinenPro Wholesale', expected: '2024-03-18', items: 3, status: 'In Transit' },
  { id: 'PO-2024-002', supplier: 'CleanTex Distributors', expected: '2024-03-19', items: 2, status: 'In Transit' },
];

const recentReceipts = [
  { id: 'RCV-001', order: 'PO-2024-003', supplier: 'Hotel Supply Co', received: '2024-03-15', items: 5, status: 'Complete' },
  { id: 'RCV-002', order: 'PO-2024-004', supplier: 'Premium Linens Ltd', received: '2024-03-12', items: 4, status: 'Complete' },
  { id: 'RCV-003', order: 'PO-2024-006', supplier: 'LinenPro Wholesale', received: '2024-03-10', items: 2, status: 'Partial' },
];

export default function Receiving() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Receiving</h1>
        <Button size="sm">
          <ScanLine className="w-4 h-4 mr-2" />
          Scan Receipt
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by order or supplier..." className="pl-9" />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3">Pending Arrivals</h2>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReceipts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.expected}</TableCell>
                  <TableCell className="text-right">{item.items}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Recent Receipts</h2>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReceipts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell className="font-mono text-sm">{item.order}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.received}</TableCell>
                  <TableCell className="text-right">{item.items}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}