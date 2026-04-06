import TechnicianDashboardStats from "../../features/ticket/components/TechnicianDashboardStats";
import TechnicianPriorityQueue from "../../features/ticket/components/TechnicianPriorityQueue";
import TechnicianSlaTimeline from "../../features/ticket/components/TechnicianSlaTimeline";

export default function TechnicianDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Technician Dashboard</h1>
        <p className="mt-1 text-sm text-foreground/70">Prioritize assigned incidents and monitor SLA progress in real time.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <TechnicianDashboardStats />

      <div className="grid gap-4 xl:grid-cols-2">
        <TechnicianPriorityQueue />
        <TechnicianSlaTimeline />
      </div>
    </div>
  );
}
