import { Wrench, TicketCheck, AlertTriangle, Timer } from "lucide-react";
import { Card } from "../../../shared/components/ui/Card";

type TechnicianDashboardStatsProps = {
  assignedTickets: number;
  openNow: number;
  resolvedToday: number;
  avgResponseTimeLabel: string;
};

export function TechnicianDashboardStats({
  assignedTickets,
  openNow,
  resolvedToday,
  avgResponseTimeLabel,
}: TechnicianDashboardStatsProps) {
  const stats = [
    { label: "Assigned Tickets", value: String(assignedTickets), icon: Wrench },
    { label: "Open Now", value: String(openNow), icon: AlertTriangle },
    { label: "Resolved Today", value: String(resolvedToday), icon: TicketCheck },
    { label: "Avg. Response Time", value: avgResponseTimeLabel, icon: Timer },
  ];

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
