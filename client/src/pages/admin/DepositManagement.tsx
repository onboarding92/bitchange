import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownRight,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  Wallet,
  TrendingUp,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DepositManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");

  // Fetch all deposits (admin)
  const { data: deposits, refetch } = trpc.admin.deposits.useQuery();

  // Fetch hot wallet balances
  const { data: hotWallets } = trpc.deposit.listHotWallets.useQuery();

  // Credit balance mutation
  const creditBalance = trpc.admin.creditDepositBalance.useMutation({
    onSuccess: () => {
      toast.success("Balance credited successfully!");
      setCreditDialogOpen(false);
      setSelectedDeposit(null);
      setCreditAmount("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to credit balance");
    },
  });

  // Update deposit status mutation
  const updateStatus = trpc.admin.updateDepositStatus.useMutation({
    onSuccess: () => {
      toast.success("Deposit status updated!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleCreditBalance = () => {
    if (!selectedDeposit || !creditAmount) {
      toast.error("Please enter amount");
      return;
    }

    creditBalance.mutate({
      depositId: selectedDeposit.id,
      userId: selectedDeposit.userId,
      amount: creditAmount,
      asset: selectedDeposit.asset,
    });
  };

  const handleMarkCompleted = (depositId: number) => {
    updateStatus.mutate({
      depositId,
      status: "completed",
    });
  };

  const handleMarkFailed = (depositId: number) => {
    updateStatus.mutate({
      depositId,
      status: "failed",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBlockchainExplorerUrl = (asset: string, network: string, address: string, txHash?: string) => {
    if (txHash) {
      // Transaction URL
      if (network.includes("Bitcoin")) return `https://blockchair.com/bitcoin/transaction/${txHash}`;
      if (network.includes("Ethereum")) return `https://etherscan.io/tx/${txHash}`;
      if (network.includes("BNB")) return `https://bscscan.com/tx/${txHash}`;
      if (network.includes("Polygon")) return `https://polygonscan.com/tx/${txHash}`;
      if (network.includes("Avalanche")) return `https://snowtrace.io/tx/${txHash}`;
    } else {
      // Address URL
      if (network.includes("Bitcoin")) return `https://blockchair.com/bitcoin/address/${address}`;
      if (network.includes("Ethereum")) return `https://etherscan.io/address/${address}`;
      if (network.includes("BNB")) return `https://bscscan.com/address/${address}`;
      if (network.includes("Polygon")) return `https://polygonscan.com/address/${address}`;
      if (network.includes("Avalanche")) return `https://snowtrace.io/address/${address}`;
    }
    return null;
  };

  // Filter deposits
  const filteredDeposits = deposits?.filter((deposit: any) => {
    const matchesStatus = statusFilter === "all" || deposit.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      deposit.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: deposits?.length || 0,
    pending: deposits?.filter((d: any) => d.status === "pending").length || 0,
    completed: deposits?.filter((d: any) => d.status === "completed").length || 0,
    failed: deposits?.filter((d: any) => d.status === "failed").length || 0,
    totalValue: deposits
      ?.filter((d: any) => d.status === "completed")
      .reduce((sum: number, d: any) => sum + parseFloat(d.amount || "0"), 0)
      .toFixed(2) || "0.00",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowDownRight className="h-8 w-8" />
            Deposit Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all user deposits with Reference ID tracking
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Hot Wallet Balances */}
        {hotWallets && hotWallets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hot Wallet Balances</CardTitle>
              <CardDescription>Current balances in centralized hot wallets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {hotWallets.map((wallet: any) => (
                  <div key={wallet.id} className="flex flex-col p-3 rounded-lg border bg-card">
                    <span className="text-sm font-semibold">{wallet.symbol}</span>
                    <span className="text-lg font-bold">{wallet.balance || "0.00"}</span>
                    <span className="text-xs text-muted-foreground">{wallet.network}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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

              <div className="md:col-span-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Reference ID, asset, or user email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposits Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Deposits ({filteredDeposits?.length || 0})</CardTitle>
            <CardDescription>
              Manage user deposits with Reference ID tracking and blockchain verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDeposits && filteredDeposits.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeposits.map((deposit: any) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="text-sm">
                          {new Date(deposit.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{deposit.userName || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">{deposit.userEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deposit.asset}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{deposit.network}</TableCell>
                        <TableCell className="font-mono font-semibold">{deposit.amount}</TableCell>
                        <TableCell>
                          {deposit.referenceId ? (
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {deposit.referenceId}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(deposit.referenceId, "Reference ID")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No Reference ID</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Blockchain Explorer */}
                            {getBlockchainExplorerUrl(
                              deposit.asset,
                              deposit.network,
                              deposit.address || "",
                              deposit.txHash
                            ) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    getBlockchainExplorerUrl(
                                      deposit.asset,
                                      deposit.network,
                                      deposit.address || "",
                                      deposit.txHash
                                    )!,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Credit Balance (only for pending) */}
                            {deposit.status === "pending" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedDeposit(deposit);
                                  setCreditAmount(deposit.amount);
                                  setCreditDialogOpen(true);
                                }}
                              >
                                Credit Balance
                              </Button>
                            )}

                            {/* Mark Completed */}
                            {deposit.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkCompleted(deposit.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Mark Failed */}
                            {deposit.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkFailed(deposit.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deposits found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Balance Dialog */}
        <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Credit User Balance</DialogTitle>
              <DialogDescription>
                Manually credit balance for deposit: {selectedDeposit?.referenceId}
              </DialogDescription>
            </DialogHeader>

            {selectedDeposit && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>User:</strong> {selectedDeposit.userName} ({selectedDeposit.userEmail})
                    <br />
                    <strong>Asset:</strong> {selectedDeposit.asset}
                    <br />
                    <strong>Network:</strong> {selectedDeposit.network}
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Amount to Credit</Label>
                  <Input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreditBalance} disabled={creditBalance.isPending}>
                {creditBalance.isPending ? "Processing..." : "Credit Balance"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
