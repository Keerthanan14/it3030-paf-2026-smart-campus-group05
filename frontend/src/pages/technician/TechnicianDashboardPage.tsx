import TechnicianDashboardStats from "../../features/ticket/components/TechnicianDashboardStats";
import TechnicianPriorityQueue from "../../features/ticket/components/TechnicianPriorityQueue";
import TechnicianSlaTimeline from "../../features/ticket/components/TechnicianSlaTimeline";
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';

export default function TechnicianDashboardPage() {
  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Technician Dashboard"
        description="Prioritize assigned incidents and monitor SLA progress in real time."
      />

      <TechnicianDashboardStats />

      <div className="grid gap-4 xl:grid-cols-2">
        <TechnicianPriorityQueue />
        <TechnicianSlaTimeline />
      </div>
    </div>
  );
}
