import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle, Banknote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function WithdrawalApproval() {

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

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
    <div className="p-8 space-y-6">
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
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">
            Pending Withdrawals ({pendingWithdrawals?.length || 0})
          </h2>
        </div>

        {!pendingWithdrawals || pendingWithdrawals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending withdrawals</p>
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
              {pendingWithdrawals.map((withdrawal: any) => (
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
  );
}
