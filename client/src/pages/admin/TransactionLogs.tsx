import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FileText, RefreshCw, Download, Search, X, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TransactionLogs() {
  const [logType, setLogType] = useState<"all" | "deposits" | "withdrawals" | "trades" | "logins">("all");
  const [userId, setUserId] = useState("");
  const [limit, setLimit] = useState(100);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: logs, isLoading, refetch } = trpc.admin.transactionLogs.useQuery({
    type: logType,
    userId: userId ? parseInt(userId) : undefined,
    limit,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    amountMin: amountMin ? parseFloat(amountMin) : undefined,
    amountMax: amountMax ? parseFloat(amountMax) : undefined,
    asset: selectedAsset !== "all" ? selectedAsset : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  });

  const clearFilters = () => {
    setUserId("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setSelectedAsset("all");
    setSelectedStatus("all");
  };

  const hasActiveFilters = userId || dateFrom || dateTo || amountMin || amountMax || selectedAsset !== "all" || selectedStatus !== "all";

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

  const filterData = (data: any[]) => {
    if (!data) return [];
    
    return data.filter((item: any) => {
      // Date filter
      if (dateFrom && new Date(item.createdAt || item.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(item.createdAt || item.timestamp) > new Date(dateTo)) return false;
      
      // Amount filter (only for deposits/withdrawals)
      if (item.amount) {
        const amount = parseFloat(item.amount);
        if (amountMin && amount < parseFloat(amountMin)) return false;
        if (amountMax && amount > parseFloat(amountMax)) return false;
      }
      
      // Asset filter
      if (selectedAsset !== "all" && item.asset && item.asset !== selectedAsset) return false;
      
      // Status filter
      if (selectedStatus !== "all" && item.status && item.status !== selectedStatus) return false;
      
      return true;
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "default" : "outline"}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="p-6 bg-muted/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Advanced Filters
                </h3>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>User ID</Label>
                  <Input
                    type="number"
                    placeholder="Filter by User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                      <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                      <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Min Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    step="0.00000001"
                  />
                </div>
                
                <div>
                  <Label>Max Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    step="0.00000001"
                  />
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Results Limit</Label>
                  <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                      <SelectItem value="500">500 rows</SelectItem>
                      <SelectItem value="1000">1000 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => refetch()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
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
                  {logs?.deposits && filterData(logs.deposits).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          Recent Deposits ({filterData(logs.deposits).length})
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToCSV(filterData(logs.deposits), "deposits")}
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
                          {filterData(logs.deposits).slice(0, limit).map((deposit: any) => (
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

                  {logs?.withdrawals && filterData(logs.withdrawals).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          Recent Withdrawals ({filterData(logs.withdrawals).length})
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToCSV(filterData(logs.withdrawals), "withdrawals")}
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
                          {filterData(logs.withdrawals).slice(0, limit).map((withdrawal: any) => (
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

                  {logs?.logins && filterData(logs.logins).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          Recent Logins ({filterData(logs.logins).length})
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToCSV(filterData(logs.logins), "logins")}
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
                          {filterData(logs.logins).slice(0, limit).map((login: any) => (
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
    </DashboardLayout>
  );
}
