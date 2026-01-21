import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Coins, TrendingUp, Lock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";

export function StakingSummaryWidget() {
  const { data: positions, isLoading } = trpc.staking.myPositions.useQuery();
  const { data: plans } = trpc.staking.plans.useQuery();

  const summary = useMemo(() => {
    if (!positions || !plans) {
      return {
        totalStaked: 0,
        activePositions: 0,
        pendingRewards: 0,
        assets: [] as string[],
      };
    }

    const activePositions = positions.filter(p => p.status === "active");
    
    // Calculate total staked and pending rewards
    let totalStakedUSD = 0;
    let pendingRewardsUSD = 0;
    const assetsSet = new Set<string>();

    activePositions.forEach(position => {
      const plan = plans.find(p => p.id === position.planId);
      if (!plan) return;

      const principal = parseFloat(position.amount);
      assetsSet.add(plan.asset);

      // Calculate reward
      const now = new Date();
      const started = new Date(position.startedAt);
      const daysPassed = (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
      const apr = parseFloat(plan.apr);
      const reward = (principal * apr * daysPassed) / (365 * 100);

      // For simplicity, assume 1:1 USD conversion (in real app, use price API)
      totalStakedUSD += principal;
      pendingRewardsUSD += reward;
    });

    return {
      totalStaked: totalStakedUSD,
      activePositions: activePositions.length,
      pendingRewards: pendingRewardsUSD,
      assets: Array.from(assetsSet),
    };
  }, [positions, plans]);

  if (isLoading) {
    return (
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Staking Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Staking Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4">
          {/* Total Staked */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Staked</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {summary.totalStaked.toFixed(4)}
            </span>
          </div>

          {/* Active Positions */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <span className="text-sm text-muted-foreground">Active Positions</span>
            <span className="font-semibold">{summary.activePositions}</span>
          </div>

          {/* Pending Rewards */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Pending Rewards</span>
            </div>
            <span className="text-lg font-bold text-green-500">
              +{summary.pendingRewards.toFixed(6)}
            </span>
          </div>

          {/* Assets */}
          {summary.assets.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <span className="text-sm text-muted-foreground">Staked Assets</span>
              <div className="flex gap-1">
                {summary.assets.map(asset => (
                  <span key={asset} className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded">
                    {asset}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link href="/staking">
          <Button className="w-full gradient-primary group">
            {summary.activePositions > 0 ? "Manage Staking" : "Start Staking"}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Empty State */}
        {summary.activePositions === 0 && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            No active staking positions. Start earning passive income today!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
