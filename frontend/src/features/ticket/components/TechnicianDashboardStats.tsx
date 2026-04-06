import { Wrench, TicketCheck, AlertTriangle, Timer } from "lucide-react";
import { Card } from "../../../shared/components/ui/Card";

const stats = [
  { label: "Assigned Tickets", value: "14", icon: Wrench },
  { label: "Open Now", value: "6", icon: AlertTriangle },
  { label: "Resolved Today", value: "4", icon: TicketCheck },
  { label: "Avg. Response Time", value: "42m", icon: Timer },
];

export function TechnicianDashboardStats() {
  return (
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
  );
}

export default TechnicianDashboardStats;
