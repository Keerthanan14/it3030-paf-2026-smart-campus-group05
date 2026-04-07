import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card } from '../../../shared/components/ui/Card';
import type { UserGrowthPoint } from '../../../types/user';

type AdminUsersGrowthChartProps = {
  data: UserGrowthPoint[];
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
};

export function AdminUsersGrowthChart({ data, selectedYear, availableYears, onYearChange }: AdminUsersGrowthChartProps) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">User Growth (Line Chart)</h2>
          <p className="text-sm text-foreground/70">Monthly user growth for Student and Technician.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Year</label>
          <select
            className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm"
            value={selectedYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="student" name="Student" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            <Line
              type="monotone"
              dataKey="technician"
              name="Technician"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default AdminUsersGrowthChart;
