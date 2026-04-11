import { Card } from "../../../shared/components/ui/Card";

export type TechnicianSlaTimelineItem = {
  ticketId: string;
  status: string;
  statusClass: string;
};

type TechnicianSlaTimelineProps = {
  timelineItems: TechnicianSlaTimelineItem[];
};

export function TechnicianSlaTimeline({ timelineItems }: TechnicianSlaTimelineProps) {
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
        {timelineItems.length === 0 ? <li className="rounded-md bg-muted/30 p-3 text-foreground/60">No SLA timeline items yet.</li> : null}
      </ul>
    </Card>
  );
}

export default TechnicianSlaTimeline;
