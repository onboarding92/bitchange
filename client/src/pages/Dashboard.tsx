import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Wallet, TrendingUp, Lock, ArrowDownRight } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { ASSET_NAMES } from "@shared/const";
import { StakingSummaryWidget } from "@/components/StakingSummaryWidget";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: wallets, isLoading } = trpc.wallet.list.useQuery();

  // Calculate total balance in USD using the usdValue from backend
  const totalBalance = wallets?.reduce((sum, w) => sum + parseFloat((w as any).usdValue || '0'), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || "Trader"}!</h1>
          <p className="text-muted-foreground">Here's your portfolio overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-500">
          <Card className="glass border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold animate-in slide-in-from-bottom-2 duration-300">
                  ${totalBalance.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="glass border-accent/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">KYC Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user?.kycStatus || "Pending"}</div>
            </CardContent>
          </Card>
          
          {/* Staking Summary Widget */}
          <div className="md:col-span-2">
            <StakingSummaryWidget />
          </div>
        </div>

        <Card className="glass hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/deposit">
                <Button className="w-full gradient-primary hover:scale-105 active:scale-95 transition-transform duration-200">
                  <ArrowDownRight className="mr-2 h-4 w-4" /> Deposit
                </Button>
              </Link>
              <Link href="/withdrawal">
                <Button variant="outline" className="w-full hover:scale-105 active:scale-95 transition-transform duration-200">Withdraw</Button>
              </Link>
              <Link href="/trading">
                <Button variant="outline" className="w-full hover:scale-105 active:scale-95 transition-transform duration-200">Trade</Button>
              </Link>
              <Link href="/staking">
                <Button variant="outline" className="w-full hover:scale-105 active:scale-95 transition-transform duration-200">Stake</Button>
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
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted rounded ml-auto" />
                      <div className="h-3 w-16 bg-muted rounded ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : wallets && wallets.length > 0 ? (
              <div className="space-y-4">
                {wallets.filter(w => parseFloat(w.balance) > 0).map((wallet, index) => (
                  <div 
                    key={wallet.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
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
                      <div className="text-sm text-muted-foreground">
                        ${parseFloat((wallet as any).usdValue || '0').toFixed(2)} USD
                      </div>
                      <div className="text-xs text-muted-foreground">Available: {(parseFloat(wallet.balance) - parseFloat(wallet.locked)).toFixed(8)}</div>
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
