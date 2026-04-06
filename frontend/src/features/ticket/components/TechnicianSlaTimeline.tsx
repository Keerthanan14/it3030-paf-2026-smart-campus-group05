import { Card } from "../../../shared/components/ui/Card";

const timelineItems = [
  { ticketId: "#TK-1042", status: "Within SLA", statusClass: "text-success" },
  { ticketId: "#TK-1039", status: "Due in 40m", statusClass: "text-warning" },
  { ticketId: "#TK-1031", status: "Over SLA", statusClass: "text-error" },
];

export function TechnicianSlaTimeline() {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">SLA Timeline</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {timelineItems.map((item) => (
          <li key={item.ticketId} className="flex items-center justify-between rounded-md bg-muted/30 p-3">
            <span>{item.ticketId}</span>
            <span className={item.statusClass}>{item.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default TechnicianSlaTimeline;
