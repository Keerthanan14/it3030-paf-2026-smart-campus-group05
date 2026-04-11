import { Card } from "../../../shared/components/ui/Card";

export type TechnicianPriorityQueueItem = {
  id: string;
  label: string;
  level: string;
  levelClass: string;
};

type TechnicianPriorityQueueProps = {
  queueItems: TechnicianPriorityQueueItem[];
};

export function TechnicianPriorityQueue({ queueItems }: TechnicianPriorityQueueProps) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Priority Queue</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {queueItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-md bg-muted/30 p-3">
            <span>{item.label}</span>
            <span className={item.levelClass}>{item.level}</span>
          </li>
        ))}
        {queueItems.length === 0 ? <li className="rounded-md bg-muted/30 p-3 text-foreground/60">No active tickets in queue.</li> : null}
      </ul>
    </Card>
  );
}

export default TechnicianPriorityQueue;
