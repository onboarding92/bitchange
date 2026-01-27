import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw, TrendingUp, AlertTriangle, Copy, Check } from "lucide-react";
import { safeToFixed } from "@/lib/utils";

export default function HotWalletManagement() {
  const [copied, setCopied] = useState<string | null>(null);
  
  const { data: balances, isLoading, refetch, error } = trpc.hotWallet.balances.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: totalBalanceUSD } = trpc.hotWallet.totalBalanceUSD.useQuery();

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkColor = (network: string) => {
    const colors: Record<string, string> = {
      ETH: "bg-blue-500",
      BNB: "bg-yellow-500",
      MATIC: "bg-purple-500",
      TRX: "bg-red-500",
      BTC: "bg-orange-500",
      SOL: "bg-green-500",
    };
    return colors[network] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading hot wallet balances: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group balances by network
  const groupedBalances = balances?.reduce((acc, balance) => {
    if (!acc[balance.network]) {
      acc[balance.network] = [];
    }
    acc[balance.network].push(balance);
    return acc;
  }, {} as Record<string, typeof balances>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hot Wallet Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time balances of all hot wallets across networks
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Total Hot Wallet Balance
          </CardTitle>
          <CardDescription>Combined value across all networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            ${safeToFixed(totalBalanceUSD || 0, 2)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Wallet Balances by Network */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groupedBalances && Object.entries(groupedBalances).map(([network, networkBalances]) => {
          const totalNetworkUSD = networkBalances.reduce((sum, b) => sum + b.balanceUSD, 0);
          
          return (
            <Card key={network} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getNetworkColor(network)}`} />
                    <CardTitle>{network} Network</CardTitle>
                  </div>
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  ${safeToFixed(totalNetworkUSD, 2)} total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {networkBalances.map((balance, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{balance.asset}</span>
                      <span className="text-sm text-muted-foreground">
                        ${safeToFixed(balance.balanceUSD, 2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">
                        {safeToFixed(balance.balance, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {balance.asset}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">
                        {formatAddress(balance.address)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyAddress(balance.address)}
                      >
                        {copied === balance.address ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> These are hot wallets connected to the internet. 
          For large amounts, consider moving funds to cold storage. Monitor balances regularly 
          and set up alerts for unusual activity.
        </AlertDescription>
      </Alert>
    </div>
  );
}
