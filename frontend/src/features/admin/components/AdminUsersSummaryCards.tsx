import { Card } from '../../../shared/components/ui/Card';

type AdminUsersSummaryCardsProps = {
  counts: {
    all: number;
    student: number;
    admin: number;
    technician: number;
  };
};

export function AdminUsersSummaryCards({ counts }: AdminUsersSummaryCardsProps) {
  const items = [
    { label: 'All Users', value: counts.all },
    { label: 'Students', value: counts.student },
    { label: 'Admins', value: counts.admin },
    { label: 'Technicians', value: counts.technician },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs uppercase tracking-wide text-foreground/60">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

export default AdminUsersSummaryCards;
