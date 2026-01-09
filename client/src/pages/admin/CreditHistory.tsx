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
import { History, TrendingUp, Users, DollarSign, Package } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function CreditHistory() {
  const [bulkOnly, setBulkOnly] = useState(false);

  const { data, isLoading } = trpc.admin.creditHistory.useQuery({
    limit: 50,
    offset: 0,
    bulkOnly,
  });

  const { data: stats } = trpc.admin.bulkOperationsStats.useQuery();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Credit History</h1>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/30 rounded-lg">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Bulk Operations</p>
                    <p className="text-2xl font-bold text-white">{stats.totalBulkOperations}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600/30 rounded-lg">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Users Credited</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsersAffected}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Amounts by Asset</p>
                    <div className="text-sm text-white space-y-1 mt-1">
                      {Object.entries(stats.totalAmountsByAsset).map(([asset, amount]) => (
                        <div key={asset} className="flex justify-between">
                          <span className="text-slate-300">{asset}:</span>
                          <span className="font-semibold">{(amount as number).toFixed(8)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <Card className="bg-slate-800/90 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setBulkOnly(false)}
                  variant={!bulkOnly ? "default" : "outline"}
                  className={!bulkOnly ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 hover:bg-slate-700"}
                >
                  All Credits
                </Button>
                <Button
                  onClick={() => setBulkOnly(true)}
                  variant={bulkOnly ? "default" : "outline"}
                  className={bulkOnly ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 hover:bg-slate-700"}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Bulk Operations Only
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-slate-400 py-8">Loading...</div>
            ) : !data?.transactions || data.transactions.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No credit history found</div>
            ) : (
              <>
                <div className="text-slate-400 text-sm mb-4">
                  Showing {data.transactions.length} of {data.total} transactions
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">ID</TableHead>
                      <TableHead className="text-slate-300">User ID</TableHead>
                      <TableHead className="text-slate-300">Asset</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Description</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((tx: any) => {
                      const isBulk = tx.bulkOperationId && !tx.bulkOperationId.startsWith('single_');
                      return (
                        <TableRow key={tx.id} className="border-slate-700">
                          <TableCell className="text-white">{tx.id}</TableCell>
                          <TableCell className="text-white">{tx.userId}</TableCell>
                          <TableCell className="text-white">{tx.asset}</TableCell>
                          <TableCell className="text-green-400 font-semibold">
                            +{parseFloat(tx.amount).toFixed(8)}
                          </TableCell>
                          <TableCell>
                            {isBulk ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-900/50 text-purple-300 flex items-center gap-1 w-fit">
                                <Package className="w-3 h-3" />
                                Bulk
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-900/50 text-blue-300">
                                Single
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 max-w-xs truncate">
                            {tx.description || "N/A"}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(tx.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </Card>

          {/* Recent Bulk Operations */}
          {stats && stats.recentBulkOps.length > 0 && (
            <Card className="bg-slate-800/90 border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Recent Bulk Operations
              </h2>
              <div className="space-y-3">
                {stats.recentBulkOps.map((op: any) => (
                  <div
                    key={op.bulkOperationId}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-semibold text-sm">
                          {op.bulkOperationId}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {new Date(op.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">{op.usersCount} users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Object.entries(op.amounts).map(([asset, amount]) => (
                          <span key={asset} className="text-slate-300">
                            {asset}: <span className="text-green-400 font-semibold">{(amount as number).toFixed(8)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
