import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Lock, DollarSign } from "lucide-react";
import { PortfolioChart } from "@/components/PortfolioChart";

export default function Portfolio() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery();
  const { data: profitLoss, isLoading: plLoading } = trpc.portfolio.profitLoss.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.portfolio.history.useQuery();

  if (summaryLoading || plLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const isProfit = (profitLoss?.unrealizedPL || 0) >= 0;

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Track your crypto portfolio performance and P&L</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.totalValue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Current portfolio value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.availableValue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.lockedValue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              In orders & staking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {isProfit ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? "text-green-500" : "text-red-500"}`}>
              {isProfit ? "+" : ""}${profitLoss?.unrealizedPL.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {profitLoss?.plPercentage.toFixed(2) || "0.00"}% return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value (30 Days)</CardTitle>
          <CardDescription>Track your portfolio performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : history && history.length > 0 ? (
            <PortfolioChart data={history} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No historical data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Assets Breakdown</CardTitle>
          <CardDescription>Your crypto holdings by asset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary?.assets && summary.assets.length > 0 ? (
              summary.assets.map(asset => {
                const percentage = summary.totalValue > 0 
                  ? (asset.value / summary.totalValue) * 100 
                  : 0;
                
                return (
                  <div key={asset.asset} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-lg">{asset.asset}</div>
                      <div className="text-sm text-muted-foreground">
                        {parseFloat(asset.balance).toFixed(8)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${asset.value.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No assets in portfolio. Start by making a deposit.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* P&L Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Details</CardTitle>
          <CardDescription>Detailed breakdown of your trading performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Deposits</span>
              <span className="font-semibold">${parseFloat(profitLoss?.totalDeposits || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Withdrawals</span>
              <span className="font-semibold">${parseFloat(profitLoss?.totalWithdrawals || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Value</span>
              <span className="font-semibold">${profitLoss?.currentValue.toFixed(2) || "0.00"}</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-semibold">Unrealized P&L</span>
              <span className={`font-bold text-lg ${isProfit ? "text-green-500" : "text-red-500"}`}>
                {isProfit ? "+" : ""}${profitLoss?.unrealizedPL.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Return on Investment</span>
              <span className={`font-bold ${isProfit ? "text-green-500" : "text-red-500"}`}>
                {isProfit ? "+" : ""}{profitLoss?.plPercentage.toFixed(2) || "0.00"}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
