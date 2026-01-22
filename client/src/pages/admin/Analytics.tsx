import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, Shield, DollarSign, Activity, Calendar, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  
  const { data: stats, isLoading, error } = trpc.admin.dashboardStats.useQuery(
    { timeRange },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center text-red-500">
            <h2 className="text-xl font-bold mb-2">Failed to load analytics data</h2>
            <p className="text-sm">{error.message}</p>
            <pre className="mt-4 text-left bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center text-muted-foreground">
            No analytics data available
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const metricCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      description: "Registered accounts",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Traders",
      value: stats.activeUsers.toLocaleString(),
      description: "Active in last 7 days",
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "24h Volume",
      value: `$${parseFloat(stats.dailyVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Trading volume today",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Pending KYC",
      value: stats.pendingKyc.toLocaleString(),
      description: "Awaiting verification",
      icon: Shield,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const additionalMetrics = [
    {
      title: "Weekly Volume",
      value: `$${parseFloat(stats.weeklyVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-cyan-500",
    },
    {
      title: "Monthly Volume",
      value: `$${parseFloat(stats.monthlyVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-indigo-500",
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals.toLocaleString(),
      icon: Clock,
      color: "text-yellow-500",
    },
  ];

  // Combine deposit and withdrawal data for comparison chart
  const depositWithdrawalData = stats.depositTrends?.map((deposit: any) => {
    const withdrawal = stats.withdrawalTrends?.find((w: any) => w.date === deposit.date);
    return {
      date: deposit.date,
      deposits: parseFloat(deposit.amount),
      withdrawals: withdrawal ? parseFloat(withdrawal.amount) : 0,
      depositCount: deposit.count,
      withdrawalCount: withdrawal?.count || 0,
    };
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform metrics and performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {additionalMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts - Row 1: User Growth and Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              New user registrations ({timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : timeRange === "90d" ? "Last 90 days" : "Last year"})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorUsers)"
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No user growth data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Users Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Active Users Trend</CardTitle>
            <CardDescription>
              Daily active users ({timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : timeRange === "90d" ? "Last 90 days" : "Last year"})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.activeUsersByDay && stats.activeUsersByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.activeUsersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Active Users"
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No active users data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts - Row 2: Deposits vs Withdrawals */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-green-500" />
            Deposits vs
            <ArrowUpCircle className="h-5 w-5 text-red-500" />
            Withdrawals
          </CardTitle>
          <CardDescription>
            Daily completed deposits and withdrawals comparison ({timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : timeRange === "90d" ? "Last 90 days" : "Last year"})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {depositWithdrawalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={depositWithdrawalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Amount (USD)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Count', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  formatter={(value: any, name: string) => {
                    if (name.includes('Count')) {
                      return [value, name];
                    }
                    return [`$${parseFloat(value).toFixed(2)}`, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="deposits" 
                  fill="#10b981" 
                  name="Deposits (USD)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="withdrawals" 
                  fill="#ef4444" 
                  name="Withdrawals (USD)"
                  radius={[8, 8, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="depositCount" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Deposit Count"
                  dot={{ fill: "#059669", r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="withdrawalCount" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Withdrawal Count"
                  dot={{ fill: "#dc2626", r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              No deposit/withdrawal data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts - Row 3: Trading Volume */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Trading Volume</CardTitle>
          <CardDescription>
            Daily trading volume ({timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : timeRange === "90d" ? "Last 90 days" : "Last year"})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.volumeChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.volumeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  formatter={(value: string) => [`$${parseFloat(value).toFixed(2)}`, "Volume"]}
                />
                <Legend />
                <Bar 
                  dataKey="volume" 
                  fill="hsl(var(--primary))" 
                  name="Volume (USD)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No trading volume data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Real-time Updates</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analytics data refreshes automatically every 30 seconds to provide the most current platform metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
