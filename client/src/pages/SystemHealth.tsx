import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AlertCircle, CheckCircle, XCircle, Clock, Activity, Database, Zap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function SystemHealth() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  
  const { data: healthData, isLoading, refetch } = trpc.admin.systemHealth.useQuery({ timeRange });
  const { data: errors } = trpc.admin.recentErrors.useQuery({ limit: 10 });
  const { data: alerts } = trpc.admin.activeAlerts.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { metrics, apiStats, exchangeStats, systemStatus } = healthData || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">Real-time monitoring and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {systemStatus?.isHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div className="text-2xl font-bold">
                {systemStatus?.isHealthy ? "Healthy" : "Degraded"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime: {systemStatus?.uptime || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(metrics?.avgResponseTime ?? 0) < 200 ? "Excellent" : (metrics?.avgResponseTime ?? 0) < 500 ? "Good" : "Slow"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.errorRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.totalErrors || 0} errors in {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {metrics?.dbHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div className="text-2xl font-bold">
                {metrics?.dbHealthy ? "Connected" : "Disconnected"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg query: {metrics?.avgDbQueryTime || 0}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{alert.alertType.replace(/_/g, " ").toUpperCase()}</div>
                    <div className="text-sm text-muted-foreground">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === "critical" ? "bg-red-500 text-white" :
                      alert.severity === "high" ? "bg-orange-500 text-white" :
                      alert.severity === "medium" ? "bg-yellow-500 text-white" :
                      "bg-blue-500 text-white"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>API Response Times</CardTitle>
          <CardDescription>Average response time over {timeRange}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={apiStats?.responseTimeData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: "ms", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgResponseTime" stroke="#8884d8" name="Avg Response Time" />
              <Line type="monotone" dataKey="maxResponseTime" stroke="#ff7300" name="Max Response Time" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* API Request Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Requests</CardTitle>
            <CardDescription>Request volume over {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={apiStats?.requestData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" name="Total Requests" />
                <Bar dataKey="errors" fill="#ff7300" name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exchange API Health</CardTitle>
            <CardDescription>External API call success rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exchangeStats?.map((exchange: any) => (
                <div key={exchange.exchange} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{exchange.exchange}</span>
                    <span className="text-sm text-muted-foreground">
                      {exchange.successRate}% success
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        exchange.successRate >= 95 ? "bg-green-500" :
                        exchange.successRate >= 80 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${exchange.successRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{exchange.totalCalls} calls</span>
                    <span>Avg: {exchange.avgDuration}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Last 10 errors logged in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {errors && errors.length > 0 ? (
            <div className="space-y-2">
              {errors.map((error: any) => (
                <div
                  key={error.id}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{error.errorType}</div>
                      <div className="text-sm text-muted-foreground mt-1">{error.message}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(error.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      error.severity === "critical" ? "bg-red-500 text-white" :
                      error.severity === "high" ? "bg-orange-500 text-white" :
                      error.severity === "medium" ? "bg-yellow-500 text-white" :
                      "bg-blue-500 text-white"
                    }`}>
                      {error.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No errors logged recently
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
