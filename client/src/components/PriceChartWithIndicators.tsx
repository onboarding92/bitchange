import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateRSI, calculateMACD, calculateSMA, type PriceData } from '@/lib/technicalIndicators';

interface PriceChartWithIndicatorsProps {
  symbol: string;
  priceData: PriceData[];
}

export default function PriceChartWithIndicators({ symbol, priceData }: PriceChartWithIndicatorsProps) {
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);

  // Calculate indicators
  const rsiData = useMemo(() => calculateRSI(priceData, 14), [priceData]);
  const macdData = useMemo(() => calculateMACD(priceData, 12, 26, 9), [priceData]);
  const sma20Data = useMemo(() => calculateSMA(priceData, 20), [priceData]);
  const sma50Data = useMemo(() => calculateSMA(priceData, 50), [priceData]);

  // Merge all data for main chart
  const chartData = useMemo(() => {
    return priceData.map((price) => {
      const dataPoint: any = {
        timestamp: price.timestamp,
        date: new Date(price.timestamp).toLocaleDateString(),
        price: price.close,
      };

      if (showSMA20) {
        const sma20Point = sma20Data.find((d) => d.timestamp === price.timestamp);
        if (sma20Point) dataPoint.sma20 = sma20Point.value;
      }

      if (showSMA50) {
        const sma50Point = sma50Data.find((d) => d.timestamp === price.timestamp);
        if (sma50Point) dataPoint.sma50 = sma50Point.value;
      }

      return dataPoint;
    });
  }, [priceData, showSMA20, showSMA50, sma20Data, sma50Data]);

  // Prepare RSI chart data
  const rsiChartData = useMemo(() => {
    return rsiData.map((rsi) => ({
      date: new Date(rsi.timestamp).toLocaleDateString(),
      rsi: rsi.value,
    }));
  }, [rsiData]);

  // Prepare MACD chart data
  const macdChartData = useMemo(() => {
    return macdData.map((macd) => ({
      date: new Date(macd.timestamp).toLocaleDateString(),
      macd: macd.macd,
      signal: macd.signal,
      histogram: macd.histogram,
    }));
  }, [macdData]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Indicator Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{symbol} Price Chart</span>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={showSMA20 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSMA20(!showSMA20)}
              >
                SMA 20
              </Button>
              <Button
                variant={showSMA50 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSMA50(!showSMA50)}
              >
                SMA 50
              </Button>
              <Button
                variant={showRSI ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRSI(!showRSI)}
              >
                RSI
              </Button>
              <Button
                variant={showMACD ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMACD(!showMACD)}
              >
                MACD
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priceData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No price data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} name="Price" />
                {showSMA20 && (
                  <Line type="monotone" dataKey="sma20" stroke="#06b6d4" strokeWidth={1.5} name="SMA 20" />
                )}
                {showSMA50 && (
                  <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} name="SMA 50" />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* RSI Chart */}
      {showRSI && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              RSI (Relative Strength Index)
              <Badge variant="outline">Period: 14</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rsiChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Insufficient data for RSI calculation
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={rsiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Overbought" />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Oversold" />
                  <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} name="RSI" />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 text-sm text-muted-foreground">
              <p>• RSI &gt; 70: Overbought (potential sell signal)</p>
              <p>• RSI &lt; 30: Oversold (potential buy signal)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MACD Chart */}
      {showMACD && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              MACD (Moving Average Convergence Divergence)
              <Badge variant="outline">12, 26, 9</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {macdChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Insufficient data for MACD calculation
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={macdChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" />
                  <Line type="monotone" dataKey="macd" stroke="#06b6d4" strokeWidth={2} name="MACD" />
                  <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={2} name="Signal" />
                  <Line type="monotone" dataKey="histogram" stroke="#10b981" strokeWidth={1} name="Histogram" />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 text-sm text-muted-foreground">
              <p>• MACD crosses above Signal: Bullish signal</p>
              <p>• MACD crosses below Signal: Bearish signal</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
