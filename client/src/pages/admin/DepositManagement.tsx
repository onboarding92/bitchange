import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, XCircle, DollarSign, Copy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function DepositManagement() {
  // Using sonner toast directly
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [creditDialog, setCreditDialog] = useState<{
    open: boolean;
    deposit: any;
    amount: string;
  }>({
    open: false,
    deposit: null,
    amount: "",
  });

  // @ts-ignore - admin procedures exist but TypeScript doesn't recognize them
  const { data: deposits, refetch } = trpc.admin.deposits.useQuery();
  // @ts-ignore
  const updateStatusMutation = trpc.admin.updateDepositStatus.useMutation();
  // @ts-ignore
  const creditBalanceMutation = trpc.admin.creditDepositBalance.useMutation();

  const filteredDeposits = deposits?.filter((d: any) => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      d.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: deposits?.length || 0,
    pending: deposits?.filter((d: any) => d.status === "pending").length || 0,
    completed: deposits?.filter((d: any) => d.status === "completed").length || 0,
    failed: deposits?.filter((d: any) => d.status === "failed").length || 0,
    totalValue: deposits
      ?.filter((d: any) => d.status === "completed")
      .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0)
      .toFixed(2) || "0.00",
  };

  const handleCreditBalance = async () => {
    if (!creditDialog.deposit) return;

    const amount = parseFloat(creditDialog.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid amount",
      });
      return;
    }

    try {
      await creditBalanceMutation.mutateAsync({
        depositId: creditDialog.deposit.id,
        userId: creditDialog.deposit.userId,
        amount: creditDialog.amount,
        asset: creditDialog.deposit.asset,
      });

      toast.success("Balance Credited", {
        description: `Successfully credited ${creditDialog.amount} ${creditDialog.deposit.asset} to user`,
      });

      setCreditDialog({ open: false, deposit: null, amount: "" });
      refetch();
    } catch (error: any) {
      toast.error("Credit Failed", {
        description: error.message || "Failed to credit balance",
      });
    }
  };

  const handleUpdateStatus = async (depositId: number, status: "pending" | "completed" | "failed") => {
    try {
      await updateStatusMutation.mutateAsync({ depositId, status });
      toast.success("Status Updated", {
        description: `Deposit marked as ${status}`,
      });
      refetch();
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Failed to update status",
      });
    }
  };

  const getBlockchainExplorerUrl = (network: string, address?: string, txHash?: string) => {
    const explorers: Record<string, string> = {
      Bitcoin: "https://blockchair.com/bitcoin",
      Ethereum: "https://etherscan.io",
      "BNB Chain": "https://bscscan.com",
      Polygon: "https://polygonscan.com",
      Avalanche: "https://snowtrace.io",
    };

    const baseUrl = explorers[network];
    if (!baseUrl) return null;

    if (txHash) return `${baseUrl}/tx/${txHash}`;
    if (address) return `${baseUrl}/address/${address}`;
    return baseUrl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied", {
      description: "Reference ID copied to clipboard",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deposit Management</h1>
        <p className="text-muted-foreground">Manage user deposits and credit balances</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Deposits</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Value</div>
          <div className="text-2xl font-bold">${stats.totalValue}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "failed" ? "default" : "outline"}
              onClick={() => setStatusFilter("failed")}
              size="sm"
            >
              Failed
            </Button>
          </div>
          <Input
            placeholder="Search by Reference ID, asset, or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-md"
          />
        </div>
      </Card>

      {/* Deposits Table */}
      <Card>
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
            {filteredDeposits?.map((deposit: any) => (
              <TableRow key={deposit.id}>
                <TableCell className="text-sm">
                  {new Date(deposit.createdAt).toLocaleDateString()}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {new Date(deposit.createdAt).toLocaleTimeString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{deposit.userName}</div>
                  <div className="text-xs text-muted-foreground">{deposit.userEmail}</div>
                </TableCell>
                <TableCell className="font-mono font-bold">{deposit.asset}</TableCell>
                <TableCell className="text-sm">{deposit.network}</TableCell>
                <TableCell className="font-mono">{deposit.amount}</TableCell>
                <TableCell>
                  {deposit.referenceId ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{deposit.referenceId.slice(0, 8)}...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(deposit.referenceId!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      deposit.status === "completed"
                        ? "default"
                        : deposit.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {deposit.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {deposit.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setCreditDialog({
                            open: true,
                            deposit,
                            amount: deposit.amount,
                          })
                        }
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Credit
                      </Button>
                    )}
                    {getBlockchainExplorerUrl(deposit.network, deposit.txHash) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = getBlockchainExplorerUrl(deposit.network, deposit.txHash || undefined);
                          if (url) window.open(url, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {deposit.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(deposit.id, "completed")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(deposit.id, "failed")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Credit Balance Dialog */}
      <Dialog open={creditDialog.open} onOpenChange={(open) => setCreditDialog({ ...creditDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit User Balance</DialogTitle>
            <DialogDescription>
              Credit cryptocurrency to user wallet after verifying deposit on blockchain
            </DialogDescription>
          </DialogHeader>

          {creditDialog.deposit && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>User:</strong> {creditDialog.deposit.userName} ({creditDialog.deposit.userEmail})
                    </div>
                    <div>
                      <strong>Asset:</strong> {creditDialog.deposit.asset}
                    </div>
                    <div>
                      <strong>Network:</strong> {creditDialog.deposit.network}
                    </div>
                    {creditDialog.deposit.referenceId && (
                      <div>
                        <strong>Reference ID:</strong> {creditDialog.deposit.referenceId}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium">Amount to Credit</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={creditDialog.amount}
                  onChange={(e) => setCreditDialog({ ...creditDialog, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialog({ open: false, deposit: null, amount: "" })}>
              Cancel
            </Button>
            <Button onClick={handleCreditBalance} disabled={creditBalanceMutation.isPending}>
              {creditBalanceMutation.isPending ? "Processing..." : "Credit Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
