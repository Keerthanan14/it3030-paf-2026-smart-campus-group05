import { Card } from "../../../shared/components/ui/Card";

const queueItems = [
  { id: "#TK-1050 Network outage - Block A", level: "High", levelClass: "text-error" },
  { id: "#TK-1048 Printer fault - Library", level: "Medium", levelClass: "text-warning" },
  { id: "#TK-1043 Lab AC issue - Room 205", level: "Medium", levelClass: "text-warning" },
];

export function TechnicianPriorityQueue() {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Priority Queue</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {queueItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-md bg-muted/30 p-3">
            <span>{item.id}</span>
            <span className={item.levelClass}>{item.level}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default TechnicianPriorityQueue;
