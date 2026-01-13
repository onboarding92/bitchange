import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users, FileText, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Search, Eye } from "lucide-react";

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedKYC, setSelectedKYC] = useState<any>(null);

  // Get admin stats
  const { data: stats } = trpc.admin.stats.useQuery();

  // Get users list
  const { data: users, refetch: refetchUsers } = trpc.admin.users.useQuery({
    search: searchQuery,
    limit: 50,
  });

  // Get KYC submissions
  const { data: kycSubmissions, refetch: refetchKYC } = trpc.admin.kycSubmissions.useQuery({
    status: "pending",
  });

  // Get pending withdrawals
  const { data: pendingWithdrawals, refetch: refetchWithdrawals } = trpc.admin.pendingWithdrawals.useQuery();

  // Get recent transactions
  const { data: recentTransactions } = trpc.admin.recentTransactions.useQuery({
    limit: 20,
  });

  // Update user status
  const updateUserStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Approve/Reject KYC
  const reviewKYC = trpc.admin.reviewKYC.useMutation({
    onSuccess: () => {
      toast.success("KYC review submitted");
      refetchKYC();
      setSelectedKYC(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Approve/Reject withdrawal
  const reviewWithdrawal = trpc.admin.reviewWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal review submitted");
      refetchWithdrawals();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Manage users, transactions, and platform operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Volume (24h)</p>
                  <p className="text-3xl font-bold text-white">${stats?.totalVolume24h?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Pending KYC</p>
                  <p className="text-3xl font-bold text-white">{stats?.pendingKYC || 0}</p>
                </div>
                <FileText className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Active Trades</p>
                  <p className="text-3xl font-bold text-white">{stats?.activeTrades || 0}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="kyc">
              KYC Review
              {stats?.pendingKYC ? (
                <Badge className="ml-2 bg-red-600">{stats.pendingKYC}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              Withdrawals
              {pendingWithdrawals?.length ? (
                <Badge className="ml-2 bg-yellow-600">{pendingWithdrawals.length}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users by name, email, or ID..."
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button variant="outline" className="border-slate-700 text-white">
                    Export CSV
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users?.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name || "Unknown"}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={user.kycStatus === "approved" ? "default" : "outline"}
                          className={
                            user.kycStatus === "approved"
                              ? "bg-green-600"
                              : user.kycStatus === "pending"
                              ? "text-yellow-400"
                              : "text-slate-400"
                          }
                        >
                          KYC: {user.kycStatus || "none"}
                        </Badge>
                        <Badge
                          variant={user.status === "active" ? "default" : "outline"}
                          className={user.status === "active" ? "bg-green-600" : "text-red-400"}
                        >
                          {user.status}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-white">User Details</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-slate-400 text-sm">User ID</p>
                                    <p className="text-white">{selectedUser.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-sm">Email</p>
                                    <p className="text-white">{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-sm">Name</p>
                                    <p className="text-white">{selectedUser.name || "N/A"}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-sm">Joined</p>
                                    <p className="text-white">
                                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-sm">KYC Status</p>
                                    <p className="text-white">{selectedUser.kycStatus || "none"}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 text-sm">2FA Enabled</p>
                                    <p className="text-white">{selectedUser.twoFactorEnabled ? "Yes" : "No"}</p>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Select
                                    defaultValue={selectedUser.status}
                                    onValueChange={(value) =>
                                      updateUserStatus.mutate({
                                        userId: selectedUser.id,
                                        status: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      <SelectItem value="banned">Banned</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button variant="outline" className="border-slate-700 text-white">
                                    View Activity
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Review Tab */}
          <TabsContent value="kyc" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">KYC Submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {kycSubmissions?.map((kyc: any) => (
                  <div
                    key={kyc.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{kyc.user.name || kyc.user.email}</p>
                      <p className="text-sm text-slate-400">
                        Submitted: {new Date(kyc.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-400">
                        Document: {kyc.documentType} • {kyc.country}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedKYC(kyc)}
                        >
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">KYC Review</DialogTitle>
                        </DialogHeader>
                        {selectedKYC && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-slate-400 text-sm">Full Name</p>
                                <p className="text-white">
                                  {selectedKYC.firstName} {selectedKYC.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-sm">Date of Birth</p>
                                <p className="text-white">{selectedKYC.dateOfBirth}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-sm">Nationality</p>
                                <p className="text-white">{selectedKYC.nationality}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-sm">Document Type</p>
                                <p className="text-white">{selectedKYC.documentType}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-slate-400 text-sm">Address</p>
                                <p className="text-white">
                                  {selectedKYC.address}, {selectedKYC.city}, {selectedKYC.postalCode},{" "}
                                  {selectedKYC.country}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-white font-semibold">Documents</p>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                                  <p className="text-slate-400 text-sm">Document Front</p>
                                </div>
                                {selectedKYC.documentBackUrl && (
                                  <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                                    <p className="text-slate-400 text-sm">Document Back</p>
                                  </div>
                                )}
                                <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                                  <p className="text-slate-400 text-sm">Selfie</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  reviewKYC.mutate({
                                    kycId: selectedKYC.id,
                                    status: "approved",
                                  })
                                }
                                disabled={reviewKYC.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() =>
                                  reviewKYC.mutate({
                                    kycId: selectedKYC.id,
                                    status: "rejected",
                                    reason: "Document quality insufficient",
                                  })
                                }
                                disabled={reviewKYC.isPending}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
                {(!kycSubmissions || kycSubmissions.length === 0) && (
                  <div className="text-center py-8 text-slate-400">No pending KYC submissions</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {pendingWithdrawals?.map((withdrawal: any) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {withdrawal.amount} {withdrawal.asset}
                      </p>
                      <p className="text-sm text-slate-400">User: {withdrawal.user.email}</p>
                      <p className="text-sm text-slate-400 font-mono">To: {withdrawal.address}</p>
                      <p className="text-sm text-slate-400">
                        Requested: {new Date(withdrawal.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          reviewWithdrawal.mutate({
                            withdrawalId: withdrawal.id,
                            status: "approved",
                          })
                        }
                        disabled={reviewWithdrawal.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          reviewWithdrawal.mutate({
                            withdrawalId: withdrawal.id,
                            status: "rejected",
                          })
                        }
                        disabled={reviewWithdrawal.isPending}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {(!pendingWithdrawals || pendingWithdrawals.length === 0) && (
                  <div className="text-center py-8 text-slate-400">No pending withdrawals</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {recentTransactions?.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {tx.type.toUpperCase()} - {tx.amount} {tx.asset}
                      </p>
                      <p className="text-sm text-slate-400">User: {tx.user.email}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={tx.status === "completed" ? "default" : "outline"}
                      className={
                        tx.status === "completed"
                          ? "bg-green-600"
                          : tx.status === "pending"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                ))}
                {(!recentTransactions || recentTransactions.length === 0) && (
                  <div className="text-center py-8 text-slate-400">No recent transactions</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
