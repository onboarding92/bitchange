import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, RefreshCw, Download, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TransactionLogs() {
  const [logType, setLogType] = useState<"all" | "deposits" | "withdrawals" | "trades" | "logins">("all");
  const [userId, setUserId] = useState("");
  const [limit, setLimit] = useState(100);

  const { data: logs, isLoading, refetch } = trpc.admin.transactionLogs.useQuery({
    type: logType,
    userId: userId ? parseInt(userId) : undefined,
    limit,
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === "string" && val.includes(",") ? `"${val}"` : val
      ).join(",")
    );
    
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transaction Logs</h1>
              <p className="text-muted-foreground mt-1">Monitor and audit all platform transactions</p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Filter by User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className=""
              />
            </div>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
                <SelectItem value="500">500 rows</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          <Tabs value={logType} onValueChange={(v: any) => setLogType(v)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="logins">Logins</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : (
                <>
                  {logs?.deposits && logs.deposits.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">Recent Deposits</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToCSV(logs.deposits, "deposits")}
                          className="border-border hover:bg-secondary"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">ID</TableHead>
                            <TableHead className="text-muted-foreground">User ID</TableHead>
                            <TableHead className="text-muted-foreground">Asset</TableHead>
                            <TableHead className="text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-muted-foreground">Network</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.deposits.slice(0, 10).map((deposit: any) => (
                            <TableRow key={deposit.id} className="border-border">
                              <TableCell className="text-foreground">{deposit.id}</TableCell>
                              <TableCell className="text-foreground">{deposit.userId}</TableCell>
                              <TableCell className="text-foreground font-semibold">{deposit.asset}</TableCell>
                              <TableCell className="text-green-600 font-semibold">
                                +{parseFloat(deposit.amount).toFixed(8)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{deposit.network || "N/A"}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  deposit.status === "completed" 
                                    ? "bg-green-900/50 text-green-300"
                                    : deposit.status === "pending"
                                    ? "bg-yellow-900/50 text-yellow-300"
                                    : "bg-red-900/50 text-red-300"
                                }`}>
                                  {deposit.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(deposit.createdAt).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {logs?.withdrawals && logs.withdrawals.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">Recent Withdrawals</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToCSV(logs.withdrawals, "withdrawals")}
                          className="border-border hover:bg-secondary"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">ID</TableHead>
                            <TableHead className="text-muted-foreground">User ID</TableHead>
                            <TableHead className="text-muted-foreground">Asset</TableHead>
                            <TableHead className="text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-muted-foreground">Network</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.withdrawals.slice(0, 10).map((withdrawal: any) => (
                            <TableRow key={withdrawal.id} className="border-border">
                              <TableCell className="text-foreground">{withdrawal.id}</TableCell>
                              <TableCell className="text-foreground">{withdrawal.userId}</TableCell>
                              <TableCell className="text-foreground font-semibold">{withdrawal.asset}</TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                -{parseFloat(withdrawal.amount).toFixed(8)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{withdrawal.network || "N/A"}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  withdrawal.status === "completed" 
                                    ? "bg-green-900/50 text-green-300"
                                    : withdrawal.status === "pending"
                                    ? "bg-yellow-900/50 text-yellow-300"
                                    : "bg-red-900/50 text-red-300"
                                }`}>
                                  {withdrawal.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(withdrawal.createdAt).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {logs?.logins && logs.logins.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">Recent Logins</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToCSV(logs.logins, "logins")}
                          className="border-border hover:bg-secondary"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">ID</TableHead>
                            <TableHead className="text-muted-foreground">User ID</TableHead>
                            <TableHead className="text-muted-foreground">Email</TableHead>
                            <TableHead className="text-muted-foreground">IP Address</TableHead>
                            <TableHead className="text-muted-foreground">Method</TableHead>
                            <TableHead className="text-muted-foreground">Success</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.logins.slice(0, 10).map((login: any) => (
                            <TableRow key={login.id} className="border-border">
                              <TableCell className="text-foreground">{login.id}</TableCell>
                              <TableCell className="text-foreground">{login.userId || "N/A"}</TableCell>
                              <TableCell className="text-muted-foreground">{login.email}</TableCell>
                              <TableCell className="text-muted-foreground font-mono text-sm">{login.ipAddress}</TableCell>
                              <TableCell className="text-muted-foreground">{login.method}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  login.success 
                                    ? "bg-green-900/50 text-green-300"
                                    : "bg-red-900/50 text-red-300"
                                }`}>
                                  {login.success ? "Success" : "Failed"}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(login.timestamp).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="deposits">
              {/* Similar table for deposits only */}
              <div className="text-center text-muted-foreground py-8">
                Use "All" tab to view deposits
              </div>
            </TabsContent>

            <TabsContent value="withdrawals">
              {/* Similar table for withdrawals only */}
              <div className="text-center text-muted-foreground py-8">
                Use "All" tab to view withdrawals
              </div>
            </TabsContent>

            <TabsContent value="trades">
              {/* Similar table for trades only */}
              <div className="text-center text-muted-foreground py-8">
                Trades log coming soon
              </div>
            </TabsContent>

            <TabsContent value="logins">
              {/* Similar table for logins only */}
              <div className="text-center text-muted-foreground py-8">
                Use "All" tab to view logins
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
