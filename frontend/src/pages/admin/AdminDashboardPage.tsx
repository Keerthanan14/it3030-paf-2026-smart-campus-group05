import { Building2, CalendarClock, Ticket, Users } from 'lucide-react';
import { Card } from '../../shared/components/ui/Card';

const stats = [
  { label: 'Total Resources', value: '48', icon: Building2 },
  { label: 'Pending Bookings', value: '16', icon: CalendarClock },
  { label: 'Open Tickets', value: '23', icon: Ticket },
  { label: 'Active Users', value: '1,284', icon: Users },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-foreground/70">Monitor campus operations, approvals, and support flow in one place.</p>
      </div>

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
          <h2 className="text-lg font-semibold">Recent Booking Requests</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Network Lab A - Wed 10:00 AM</span><span className="text-warning">Pending</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Seminar Hall - Thu 2:00 PM</span><span className="text-success">Approved</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Computer Lab C - Fri 9:00 AM</span><span className="text-warning">Pending</span></li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Ticket SLA Watch</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Projector issue - Engineering Block</span><span className="text-error">Overdue</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>Wi-Fi outage - Library</span><span className="text-warning">Due in 2h</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>AC maintenance - Hall B</span><span className="text-success">On Track</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
