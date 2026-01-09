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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users as UsersIcon, Search, Edit, DollarSign, Activity, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function UsersManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"admin" | "user" | undefined>();
  const [kycFilter, setKycFilter] = useState<"pending" | "approved" | "rejected" | undefined>();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showLimitsDialog, setShowLimitsDialog] = useState(false);

  // Edit user state
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [editKycStatus, setEditKycStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [editAccountStatus, setEditAccountStatus] = useState<"active" | "suspended">("active");

  // Balance credit state
  const [balanceAsset, setBalanceAsset] = useState("BTC");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  // Withdrawal limits state
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const { data, isLoading, refetch } = trpc.admin.users.useQuery({
    search,
    role: roleFilter,
    kycStatus: kycFilter,
    limit: 50,
    offset: 0,
  });

  const { data: activity } = trpc.admin.userActivity.useQuery(
    { userId: selectedUser?.id },
    { enabled: !!selectedUser && showActivityDialog }
  );

  const { data: limitsData } = trpc.admin.getWithdrawalLimit.useQuery(
    { userId: selectedUser?.id || 0 },
    { enabled: !!selectedUser && showLimitsDialog }
  );

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setShowEditDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const creditBalance = trpc.admin.creditUserBalance.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Balance credited successfully");
      setShowBalanceDialog(false);
      setBalanceAmount("");
      setBalanceReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setWithdrawalLimit = trpc.admin.setWithdrawalLimit.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal limits updated successfully");
      setShowLimitsDialog(false);
      setDailyLimit("");
      setMonthlyLimit("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEditUser = () => {
    if (!selectedUser) return;
    updateUser.mutate({
      userId: selectedUser.id,
      role: editRole,
      kycStatus: editKycStatus,
      accountStatus: editAccountStatus,
    });
  };

  const handleCreditBalance = () => {
    if (!selectedUser || !balanceAmount) {
      toast.error("Amount is required");
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (amount <= 0) {
      toast.error("Amount must be positive");
      return;
    }

    creditBalance.mutate({
      userId: selectedUser.id,
      asset: balanceAsset,
      amount: balanceAmount,
      note: balanceReason || undefined,
    });
  };

  const handleSetLimits = () => {
    if (!selectedUser) return;

    const daily = parseFloat(dailyLimit);
    const monthly = parseFloat(monthlyLimit);

    if (isNaN(daily) || daily <= 0) {
      toast.error("Daily limit must be a positive number");
      return;
    }

    if (isNaN(monthly) || monthly <= 0) {
      toast.error("Monthly limit must be a positive number");
      return;
    }

    if (daily > monthly) {
      toast.error("Daily limit cannot exceed monthly limit");
      return;
    }

    setWithdrawalLimit.mutate({
      userId: selectedUser.id,
      dailyLimit: dailyLimit,
      monthlyLimit: monthlyLimit,
    });
  };

  // Load current limits when dialog opens
  React.useEffect(() => {
    if (limitsData) {
      setDailyLimit(limitsData.dailyLimit?.toString() || "10000");
      setMonthlyLimit(limitsData.monthlyLimit?.toString() || "100000");
    }
  }, [limitsData]);

  const exportToCSV = () => {
    if (!data?.users || data.users.length === 0) return;
    
    const headers = ["ID", "Email", "Name", "Role", "KYC Status", "Account Status", "Created At"].join(",");
    const rows = data.users.map(user => 
      [user.id, user.email, user.name || "", user.role, user.kycStatus, user.accountStatus || "active", new Date(user.createdAt).toISOString()].join(",")
    );
    
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">User Management</h1>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-slate-600 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="bg-slate-800/90 border-slate-700 p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kycFilter} onValueChange={(v: any) => setKycFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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

          {isLoading ? (
            <div className="text-center text-slate-400 py-8">Loading...</div>
          ) : !data?.users || data.users.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No users found</div>
          ) : (
            <>
              <div className="text-slate-400 text-sm mb-4">
                Showing {data.users.length} of {data.total} users
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Role</TableHead>
                    <TableHead className="text-slate-300">KYC</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user: any) => (
                    <TableRow key={user.id} className="border-slate-700">
                      <TableCell className="text-white">{user.id}</TableCell>
                      <TableCell className="text-white">{user.email}</TableCell>
                      <TableCell className="text-slate-300">{user.name || "N/A"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === "admin" 
                            ? "bg-purple-900/50 text-purple-300"
                            : "bg-blue-900/50 text-blue-300"
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.kycStatus === "approved" 
                            ? "bg-green-900/50 text-green-300"
                            : user.kycStatus === "pending"
                            ? "bg-yellow-900/50 text-yellow-300"
                            : "bg-red-900/50 text-red-300"
                        }`}>
                          {user.kycStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.accountStatus === "suspended"
                            ? "bg-red-900/50 text-red-300"
                            : "bg-green-900/50 text-green-300"
                        }`}>
                          {user.accountStatus || "active"}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditRole(user.role);
                              setEditKycStatus(user.kycStatus);
                              setEditAccountStatus(user.accountStatus || "active");
                              setShowEditDialog(true);
                            }}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBalanceDialog(true);
                            }}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowActivityDialog(true);
                            }}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowLimitsDialog(true);
                            }}
                            className="border-slate-600 hover:bg-slate-700"
                            title="Set Withdrawal Limits"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User: {selectedUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Role</Label>
                <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">KYC Status</Label>
                <Select value={editKycStatus} onValueChange={(v: any) => setEditKycStatus(v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Account Status</Label>
                <Select value={editAccountStatus} onValueChange={(v: any) => setEditAccountStatus(v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleEditUser}
                disabled={updateUser.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {updateUser.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Credit Balance Dialog */}
        <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Credit Balance: {selectedUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                <p className="text-sm text-blue-300">
                  Add cryptocurrency to user's wallet. This action will be logged in the transaction history.
                </p>
              </div>
              <div>
                <Label className="text-slate-300">Cryptocurrency</Label>
                <Select value={balanceAsset} onValueChange={setBalanceAsset}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                    <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
                    <SelectItem value="DOGE">Dogecoin (DOGE)</SelectItem>
                    <SelectItem value="AVAX">Avalanche (AVAX)</SelectItem>
                    <SelectItem value="MATIC">Polygon (MATIC)</SelectItem>
                    <SelectItem value="LINK">Chainlink (LINK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Amount</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter the amount to credit (must be positive)
                </p>
              </div>
              <div>
                <Label className="text-slate-300">Note (Optional)</Label>
                <Input
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="e.g., Promotional bonus, Compensation, etc."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handleCreditBalance}
                disabled={creditBalance.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {creditBalance.isPending ? "Crediting..." : `Credit ${balanceAmount || "0"} ${balanceAsset}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Activity Dialog */}
        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">User Activity: {selectedUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {activity?.deposits && activity.deposits.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Recent Deposits</h4>
                  <div className="space-y-2">
                    {activity.deposits.slice(0, 5).map((d: any) => (
                      <div key={d.id} className="bg-slate-700 p-3 rounded text-sm">
                        <div className="flex justify-between text-white">
                          <span>{d.asset}</span>
                          <span className="text-green-400">+{parseFloat(d.amount).toFixed(8)}</span>
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {new Date(d.createdAt).toLocaleString()} • {d.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activity?.withdrawals && activity.withdrawals.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Recent Withdrawals</h4>
                  <div className="space-y-2">
                    {activity.withdrawals.slice(0, 5).map((w: any) => (
                      <div key={w.id} className="bg-slate-700 p-3 rounded text-sm">
                        <div className="flex justify-between text-white">
                          <span>{w.asset}</span>
                          <span className="text-red-400">-{parseFloat(w.amount).toFixed(8)}</span>
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {new Date(w.createdAt).toLocaleString()} • {w.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activity?.logins && activity.logins.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Recent Logins</h4>
                  <div className="space-y-2">
                    {activity.logins.slice(0, 5).map((l: any) => (
                      <div key={l.id} className="bg-slate-700 p-3 rounded text-sm">
                        <div className="flex justify-between text-white">
                          <span>{l.ipAddress}</span>
                          <span className={l.success ? "text-green-400" : "text-red-400"}>
                            {l.success ? "Success" : "Failed"}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {new Date(l.createdAt).toLocaleString()} • {l.method}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Set Withdrawal Limits Dialog */}
        <Dialog open={showLimitsDialog} onOpenChange={setShowLimitsDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-400" />
                Set Withdrawal Limits: {selectedUser?.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-sm text-blue-200">
                <p className="font-semibold mb-1">Current Limits:</p>
                <p>Daily: ${limitsData?.dailyLimit?.toLocaleString() || "10,000"} USDT</p>
                <p>Monthly: ${limitsData?.monthlyLimit?.toLocaleString() || "100,000"} USDT</p>
                <p className="text-xs text-blue-300 mt-2">Used Today: ${limitsData?.dailyUsed?.toLocaleString() || "0"}</p>
                <p className="text-xs text-blue-300">Used This Month: ${limitsData?.monthlyUsed?.toLocaleString() || "0"}</p>
              </div>

              <div>
                <Label className="text-slate-300">Daily Limit (USDT)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">Maximum amount user can withdraw per day</p>
              </div>

              <div>
                <Label className="text-slate-300">Monthly Limit (USDT)</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">Maximum amount user can withdraw per month</p>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-200">
                <p className="font-semibold mb-1">⚠️ Important:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Daily limit cannot exceed monthly limit</li>
                  <li>Limits are enforced in USDT equivalent</li>
                  <li>Limits reset automatically (daily: 24h, monthly: 30d)</li>
                  <li>User will see error if limit exceeded</li>
                </ul>
              </div>

              <Button
                onClick={handleSetLimits}
                disabled={setWithdrawalLimit.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {setWithdrawalLimit.isPending ? "Updating..." : "Set Limits"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
