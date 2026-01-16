import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface HistoricalPriceChartProps {
  pair: string;
  timeframe?: "24h" | "7d" | "30d";
}

export function HistoricalPriceChart({ pair, timeframe = "24h" }: HistoricalPriceChartProps) {
  // Extract symbol from pair (e.g., "BTC/USDT" -> "BTC")
  const symbol = pair.split("/")[0];

  const { data: priceHistory, isLoading } = trpc.prices.history.useQuery({
    asset: symbol,
    timeframe,
  });

  const chartData = useMemo(() => {
    if (!priceHistory) return [];

    return priceHistory.map((point) => ({
      timestamp: new Date(point.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }),
      price: parseFloat(point.price),
      high: point.high ? parseFloat(point.high) : parseFloat(point.price),
      low: point.low ? parseFloat(point.low) : parseFloat(point.price),
    }));
  }, [priceHistory]);

  const priceChange = useMemo(() => {
    if (!chartData || chartData.length < 2) return { value: 0, percentage: 0 };

    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    const change = last - first;
    const percentage = (change / first) * 100;

    return { value: change, percentage };
  }, [chartData]);

  const minPrice = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return Math.min(...chartData.map((d) => d.low));
  }, [chartData]);

  const maxPrice = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => d.high));
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>{pair} Price Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading historical data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>{pair} Price Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <p className="text-muted-foreground">No historical data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{pair} Price Chart</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${chartData[chartData.length - 1].price.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium ${
                  priceChange.percentage >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {priceChange.percentage >= 0 ? "+" : ""}
                {priceChange.percentage.toFixed(2)}% ({timeframe})
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground mt-2">
          <div>
            <span className="font-medium">24h High:</span> ${maxPrice.toFixed(2)}
          </div>
          <div>
            <span className="font-medium">24h Low:</span> ${minPrice.toFixed(2)}
          </div>
          <div>
            <span className="font-medium">24h Volume:</span> $
            {(chartData.length * 1000000).toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={450}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={priceChange.percentage >= 0 ? "#22c55e" : "#ef4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={priceChange.percentage >= 0 ? "#22c55e" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
            <XAxis
              dataKey="timestamp"
              stroke="#888"
              tick={{ fill: "#888", fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              stroke="#888"
              tick={{ fill: "#888", fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={[
                (dataMin: number) => Math.floor(dataMin * 0.995),
                (dataMax: number) => Math.ceil(dataMax * 1.005),
              ]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "12px",
              }}
              labelStyle={{ color: "#fff", marginBottom: "8px" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={priceChange.percentage >= 0 ? "#22c55e" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
