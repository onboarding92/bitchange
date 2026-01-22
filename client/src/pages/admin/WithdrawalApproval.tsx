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
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle, Banknote, Filter, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function WithdrawalApproval() {

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");

  const { data: pendingWithdrawals, isLoading, refetch } = trpc.admin.getPendingWithdrawals.useQuery();
  
  const approveMutation = trpc.admin.approveWithdrawalRequest.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal approved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve withdrawal");
    },
  });

  const rejectMutation = trpc.admin.rejectWithdrawalRequest.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal rejected successfully");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedWithdrawal(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject withdrawal");
    },
  });

  const handleApprove = (withdrawal: any) => {
    if (confirm(`Approve withdrawal of ${withdrawal.amount} ${withdrawal.asset} for user ${withdrawal.userEmail}?`)) {
      approveMutation.mutate({ withdrawalId: withdrawal.id });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      reason: rejectionReason,
    });
  };

  const clearFilters = () => {
    setUserSearch("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setSelectedAsset("all");
    setSelectedStatus("pending");
  };

  const hasActiveFilters = userSearch || dateFrom || dateTo || amountMin || amountMax || selectedAsset !== "all" || selectedStatus !== "pending";

  const filteredWithdrawals = pendingWithdrawals?.filter((withdrawal: any) => {
    // User search filter
    if (userSearch && !withdrawal.userEmail?.toLowerCase().includes(userSearch.toLowerCase()) && 
        !withdrawal.userName?.toLowerCase().includes(userSearch.toLowerCase()) &&
        !withdrawal.id?.toString().includes(userSearch)) {
      return false;
    }
    
    // Date filter
    if (dateFrom && new Date(withdrawal.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(withdrawal.createdAt) > new Date(dateTo)) return false;
    
    // Amount filter
    const amount = parseFloat(withdrawal.amount);
    if (amountMin && amount < parseFloat(amountMin)) return false;
    if (amountMax && amount > parseFloat(amountMax)) return false;
    
    // Asset filter
    if (selectedAsset !== "all" && withdrawal.asset !== selectedAsset) return false;
    
    // Status filter (for future use when we have different statuses)
    if (selectedStatus !== "all" && withdrawal.status !== selectedStatus) return false;
    
    return true;
  });

  const exportToCSV = () => {
    if (!filteredWithdrawals || filteredWithdrawals.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ["ID", "User Name", "User Email", "Asset", "Amount", "Address", "Date"].join(",");
    const rows = filteredWithdrawals.map((w: any) => 
      [w.id, w.userName, w.userEmail, w.asset, w.amount, w.reference, new Date(w.createdAt).toLocaleString()].join(",")
    );
    
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawal-approvals-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Withdrawal Approval</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve pending withdrawal requests
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={!filteredWithdrawals || filteredWithdrawals.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
                <Label>Search User (Email/Name/ID)</Label>
                <Input
                  placeholder="Search..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
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
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">
            {showFilters && hasActiveFilters ? `Filtered Results (${filteredWithdrawals?.length || 0})` : `Pending Withdrawals (${pendingWithdrawals?.length || 0})`}
          </h2>
        </div>

        {!filteredWithdrawals || filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{hasActiveFilters ? "No withdrawals match your filters" : "No pending withdrawals"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal: any) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="font-mono">#{withdrawal.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{withdrawal.userName}</div>
                      <div className="text-sm text-muted-foreground">{withdrawal.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{withdrawal.asset}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {parseFloat(withdrawal.amount).toFixed(8)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {withdrawal.reference?.substring(0, 20)}...
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(withdrawal.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(withdrawal)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowRejectDialog(true);
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
    </DashboardLayout>
  );
}
