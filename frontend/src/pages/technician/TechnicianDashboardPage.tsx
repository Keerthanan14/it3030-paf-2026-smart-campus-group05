import { Wrench, TicketCheck, AlertTriangle, Timer } from 'lucide-react';
import { Card } from '../../shared/components/ui/Card';

const stats = [
  { label: 'Assigned Tickets', value: '14', icon: Wrench },
  { label: 'Open Now', value: '6', icon: AlertTriangle },
  { label: 'Resolved Today', value: '4', icon: TicketCheck },
  { label: 'Avg. Response Time', value: '42m', icon: Timer },
];

export default function TechnicianDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Technician Dashboard</h1>
        <p className="mt-1 text-sm text-foreground/70">Prioritize assigned incidents and monitor SLA progress in real time.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
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
          <h2 className="text-lg font-semibold">Priority Queue</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>#TK-1050 Network outage - Block A</span><span className="text-error">High</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>#TK-1048 Printer fault - Library</span><span className="text-warning">Medium</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>#TK-1043 Lab AC issue - Room 205</span><span className="text-warning">Medium</span></li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">SLA Timeline</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>#TK-1042</span><span className="text-success">Within SLA</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>#TK-1039</span><span className="text-warning">Due in 40m</span></li>
            <li className="flex items-center justify-between rounded-md bg-muted/30 p-3"><span>#TK-1031</span><span className="text-error">Over SLA</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
