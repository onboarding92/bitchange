import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar } from 'lucide-react';

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');

  const { data: distribution, isLoading: loadingDistribution } = trpc.analytics.portfolioDistribution.useQuery();
  const { data: pnl, isLoading: loadingPnL } = trpc.analytics.profitLoss.useQuery();
  const { data: performers, isLoading: loadingPerformers } = trpc.analytics.bestWorstPerformers.useQuery();
  const { data: trend, isLoading: loadingTrend } = trpc.analytics.portfolioValueTrend.useQuery({ timeframe });

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          <p className="text-muted-foreground">Track your portfolio performance and insights</p>
        </div>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPnL ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(pnl?.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(pnl?.totalPnL || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Since inception
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPnL ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(pnl?.roi || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(pnl?.roi || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Return on investment
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPnL ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(pnl?.totalDeposits || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total deposits
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Distribution</CardTitle>
            <CardDescription>Asset allocation by value</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDistribution ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : distribution && distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ asset, percentage }) => `${asset} ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No portfolio data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Value Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value Trend</CardTitle>
            <CardDescription>Historical portfolio value</CardDescription>
            <div className="flex gap-2 mt-2">
              <Button
                variant={timeframe === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeframe === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('30d')}
              >
                30 Days
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers (24h)</CardTitle>
          <CardDescription>Best and worst performing assets</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPerformers ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : performers && (performers.best.length > 0 || performers.worst.length > 0) ? (
            <Tabs defaultValue="best">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="best">Best Performers</TabsTrigger>
                <TabsTrigger value="worst">Worst Performers</TabsTrigger>
              </TabsList>
              <TabsContent value="best" className="space-y-4">
                {performers.best.length > 0 ? (
                  performers.best.map((asset) => (
                    <div key={asset.asset} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.asset}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(asset.value)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">{formatPercent(asset.change24h)}</p>
                        <p className="text-sm text-muted-foreground">24h change</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </TabsContent>
              <TabsContent value="worst" className="space-y-4">
                {performers.worst.length > 0 ? (
                  performers.worst.map((asset) => (
                    <div key={asset.asset} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.asset}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(asset.value)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-500">{formatPercent(asset.change24h)}</p>
                        <p className="text-sm text-muted-foreground">24h change</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No performance data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
