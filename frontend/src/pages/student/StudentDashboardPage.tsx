import { CalendarCheck, Clock3, Ticket, CheckCircle2 } from 'lucide-react';
import { Card } from '../../shared/components/ui/Card';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';

const stats = [
  { label: 'Upcoming Bookings', value: '3', icon: CalendarCheck },
  { label: 'Pending Requests', value: '2', icon: Clock3 },
  { label: 'Open Tickets', value: '1', icon: Ticket },
  { label: 'Resolved Tickets', value: '7', icon: CheckCircle2 },
];

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Student Dashboard"
        description="Track your bookings and support requests from one clean workspace."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/70">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">My Upcoming Bookings</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Computer Lab C - Thu 11:00 AM</span><span className="text-primary">Confirmed</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Seminar Hall 2 - Fri 3:00 PM</span><span className="text-primary">Confirmed</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Media Room - Mon 9:00 AM</span><span className="text-warning">Pending</span></li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">My Ticket Status</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>ID #TK-1042 - Lab PC issue</span><span className="text-warning">In Progress</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>ID #TK-1029 - Wi-Fi complaint</span><span className="text-success">Resolved</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>ID #TK-1011 - Projector request</span><span className="text-success">Resolved</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
