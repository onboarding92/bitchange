import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Wallet, TrendingUp, Lock, ArrowDownRight } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { ASSET_NAMES } from "@shared/const";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: wallets, isLoading } = trpc.wallet.list.useQuery();

  const totalBalance = wallets?.reduce((sum, w) => sum + parseFloat(w.balance), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || "Trader"}!</h1>
          <p className="text-muted-foreground">Here's your portfolio overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="glass border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="glass border-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">KYC Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user?.kycStatus || "Pending"}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button className="w-full gradient-primary">
                <ArrowDownRight className="mr-2 h-4 w-4" /> Deposit
              </Button>
              <Button variant="outline" className="w-full">Withdraw</Button>
              <Link href="/trading">
                <Button variant="outline" className="w-full">Trade</Button>
              </Link>
              <Link href="/staking">
                <Button variant="outline" className="w-full">Stake</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Your Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : wallets && wallets.length > 0 ? (
              <div className="space-y-4">
                {wallets.filter(w => parseFloat(w.balance) > 0).map((wallet) => (
                  <div key={wallet.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{wallet.asset}</span>
                      </div>
                      <div>
                        <div className="font-medium">{ASSET_NAMES[wallet.asset as keyof typeof ASSET_NAMES] || wallet.asset}</div>
                        <div className="text-sm text-muted-foreground">{wallet.asset}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{parseFloat(wallet.balance).toFixed(8)}</div>
                      <div className="text-sm text-muted-foreground">Available: {(parseFloat(wallet.balance) - parseFloat(wallet.locked)).toFixed(8)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No assets yet. Start by making a deposit!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
