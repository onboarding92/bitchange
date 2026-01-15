import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
  asset: string;
  assetName?: string;
}

type Timeframe = "24h" | "7d" | "30d";

export function PriceChart({ asset, assetName }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  
  const { data: currentPrice } = trpc.prices.get.useQuery({ asset });

  // Fetch historical price data from backend
  const { data: priceHistory = [], isLoading } = trpc.prices.history.useQuery({ 
    asset, 
    timeframe 
  });

  // Calculate price change percentage from current price data
  const priceChange = currentPrice?.change24h ? parseFloat(String(currentPrice.change24h)) : 0;
  const isPositive = priceChange >= 0;

  // Format data for chart (placeholder)
  const chartData = priceHistory.map((p: { timestamp: number; price: number }) => ({
    time: new Date(p.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: timeframe === "24h" ? "numeric" : undefined,
      minute: timeframe === "24h" ? "2-digit" : undefined,
    }),
    price: p.price,
  }));

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {assetName || asset} Price Chart
            </h3>
            {currentPrice && (
              <div className="mt-2">
                <div className="text-3xl font-bold">
                  ${parseFloat(String(currentPrice.price)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8,
                  })}
                </div>
                <div className={`flex items-center gap-1 text-sm mt-1 ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{isPositive ? "+" : ""}{priceChange.toFixed(2)}%</span>
                  <span className="text-muted-foreground ml-1">(24h)</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2">
            {(["24h", "7d", "30d"] as Timeframe[]).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="text-muted-foreground">Historical price data will appear here</div>
              <div className="text-sm text-muted-foreground">Data collection in progress...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}`,
                    "Price"
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats */}
        {currentPrice && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-muted-foreground">24h High</div>
              <div className="text-sm font-semibold">
                ${parseFloat(String(currentPrice.high24h || currentPrice.price)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24h Low</div>
              <div className="text-sm font-semibold">
                ${parseFloat(String(currentPrice.low24h || currentPrice.price)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24h Volume</div>
              <div className="text-sm font-semibold">
                ${parseFloat(String(currentPrice.volume24h || 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
