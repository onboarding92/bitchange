import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Calendar } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";

interface AprHistoryChartProps {
  assets: string[];
}

export function AprHistoryChart({ assets }: AprHistoryChartProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0] || "BTC");
  const [days, setDays] = useState<number>(30);

  const { data: aprHistory, isLoading } = trpc.staking.aprHistory.useQuery({
    asset: selectedAsset,
    days,
  });

  const chartData = useMemo(() => {
    if (!aprHistory || aprHistory.length === 0) return [];

    // Group by date and calculate average APR per day
    const grouped = aprHistory.reduce((acc, record) => {
      const date = new Date(record.recordedAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += parseFloat(record.apr);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; total: number; count: number }>);

    // Calculate average and format for chart
    return Object.values(grouped).map(({ date, total, count }) => ({
      date,
      apr: (total / count).toFixed(2),
    }));
  }, [aprHistory]);

  const avgApr = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, d) => acc + parseFloat(d.apr), 0);
    return (sum / chartData.length).toFixed(2);
  }, [chartData]);

  const minApr = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return Math.min(...chartData.map(d => parseFloat(d.apr))).toFixed(2);
  }, [chartData]);

  const maxApr = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => parseFloat(d.apr))).toFixed(2);
  }, [chartData]);

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>APR History</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Track APR changes over time to identify optimal staking opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <p>No historical data available yet</p>
            <p className="text-sm mt-2">APR tracking started recently. Check back in a few hours.</p>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <div className="text-xs text-muted-foreground mb-1">Average APR</div>
                <div className="text-lg font-bold text-primary">{avgApr}%</div>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <div className="text-xs text-muted-foreground mb-1">Minimum APR</div>
                <div className="text-lg font-bold text-red-500">{minApr}%</div>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <div className="text-xs text-muted-foreground mb-1">Maximum APR</div>
                <div className="text-lg font-bold text-green-500">{maxApr}%</div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: any) => [`${value}%`, "APR"]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="apr" 
                  name="APR (%)"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Info */}
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>• Data points represent daily average APR for {selectedAsset}</p>
              <p>• APR is recorded every 6 hours and aggregated by day</p>
              <p>• Use this chart to identify trends and time your staking decisions</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
