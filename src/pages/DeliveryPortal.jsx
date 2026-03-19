import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Upload } from 'lucide-react';

const deliveries = [
  { id: 'DEL-001', order: 'PO-2024-001', driver: 'ABC Logistics', scheduled: '2024-03-18 10:00', status: 'Scheduled' },
  { id: 'DEL-002', order: 'PO-2024-002', driver: 'FastFreight Inc', scheduled: '2024-03-19 14:00', status: 'Scheduled' },
  { id: 'DEL-003', order: 'PO-2024-003', driver: 'ABC Logistics', scheduled: '2024-03-15 09:30', status: 'Completed' },
  { id: 'DEL-004', order: 'PO-2024-004', driver: 'QuickShip Co', scheduled: '2024-03-12 11:00', status: 'Completed' },
];

export default function DeliveryPortal() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Delivery Portal</h1>
        <Button size="sm" variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Upload POD
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search deliveries..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Driver/Carrier</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-mono text-sm">{delivery.id}</TableCell>
                <TableCell className="font-mono text-sm">{delivery.order}</TableCell>
                <TableCell>{delivery.driver}</TableCell>
                <TableCell>{delivery.scheduled}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded ${
                    delivery.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {delivery.status}
                  </span>
                </TableCell>
                <TableCell>
                  {delivery.status === 'Scheduled' && (
                    <Button size="sm" variant="ghost">Check In</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}