import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeToFixed } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function Portfolio() {
  const { data: summary } = trpc.portfolio.summary.useQuery();
  const { data: profitLoss } = trpc.portfolio.profitLoss.useQuery();
  const { data: assets } = trpc.portfolio.assets.useQuery();

  const isProfit = (profitLoss?.unrealizedPL || 0) >= 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portfolio</h1>
          <p className="text-slate-600">Track your cryptocurrency portfolio performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${safeToFixed(summary?.totalValue, 2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${safeToFixed(summary?.availableValue, 2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Locked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${safeToFixed(summary?.lockedValue, 2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* P&L Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Unrealized P&L</span>
                <span className={`text-xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  {isProfit ? "+" : ""}${safeToFixed(profitLoss?.unrealizedPL, 2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Return</span>
                <span className={`font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  {isProfit ? "+" : ""}{safeToFixed(profitLoss?.plPercentage, 2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Deposits</span>
                <span className="font-semibold">${safeToFixed(parseFloat(profitLoss?.totalDeposits || "0"), 2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Withdrawals</span>
                <span className="font-semibold">${safeToFixed(parseFloat(profitLoss?.totalWithdrawals || "0"), 2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Current Value</span>
                <span className="font-semibold">${safeToFixed(profitLoss?.currentValue, 2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets?.map((asset: any) => {
                const percentage = (asset.value / (summary?.totalValue || 1)) * 100;
                return (
                  <div key={asset.asset} className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900">{asset.asset}</div>
                      <div className="text-sm text-slate-600">
                        {safeToFixed(parseFloat(asset.balance), 8)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${safeToFixed(asset.value, 2)}</div>
                      <div className="text-sm text-slate-600">
                        {safeToFixed(percentage, 2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
