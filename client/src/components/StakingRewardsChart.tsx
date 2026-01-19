import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";

interface StakingRewardsChartProps {
  positionId: number;
  asset: string;
}

export function StakingRewardsChart({ positionId, asset }: StakingRewardsChartProps) {
  const { data: history, isLoading } = trpc.staking.rewardsHistory.useQuery(
    { positionId },
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rewards History</h3>
        <p className="text-muted-foreground text-sm">
          No rewards distributed yet. Rewards are distributed daily at midnight.
        </p>
      </Card>
    );
  }

  // Transform data for chart: calculate cumulative rewards
  let cumulative = 0;
  const chartData = history.map((entry) => {
    cumulative += parseFloat(entry.amount);
    return {
      date: new Date(entry.distributedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: new Date(entry.distributedAt).toLocaleString(),
      daily: parseFloat(entry.amount),
      cumulative: cumulative,
    };
  });

  const totalRewards = cumulative.toFixed(8);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Rewards History</h3>
        <p className="text-sm text-muted-foreground">
          Total earned: <span className="font-semibold text-foreground">{totalRewards} {asset}</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toFixed(6)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(8)} ${asset}`,
              name === "cumulative" ? "Total Rewards" : "Daily Reward",
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate;
              }
              return label;
            }}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-muted-foreground">
        <p>• Rewards are distributed automatically every 24 hours</p>
        <p>• Chart shows cumulative rewards over time</p>
      </div>
    </Card>
  );
}
