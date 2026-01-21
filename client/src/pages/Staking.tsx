import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Lock, TrendingUp, Clock, Coins, Filter } from "lucide-react";
import { StakingRewardsChart } from "@/components/StakingRewardsChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StakingCalculator } from "@/components/StakingCalculator";

export default function Staking() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [autoCompound, setAutoCompound] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [filterLockPeriod, setFilterLockPeriod] = useState<string>("all");

  const { data: plans } = trpc.staking.plans.useQuery();
  const { data: positions, refetch: refetchPositions } = trpc.staking.myPositions.useQuery();

  const stakeMutation = trpc.staking.stake.useMutation({
    onSuccess: () => {
      toast.success("Staking position created!");
      setDialogOpen(false);
      setStakeAmount("");
      refetchPositions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unstakeMutation = trpc.staking.unstake.useMutation({
    onSuccess: (data) => {
      toast.success(`Unstaked! Reward: ${data.reward}`);
      refetchPositions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStake = () => {
    if (!selectedPlan || !stakeAmount) {
      toast.error("Please enter amount");
      return;
    }
    stakeMutation.mutate({
      planId: selectedPlan.id,
      amount: stakeAmount,
      autoCompound,
    });
  };

  const activePositions = positions?.filter(p => p.status === "active") || [];
  const completedPositions = positions?.filter(p => p.status === "withdrawn") || [];

  // Extract unique assets and lock periods from plans
  const availableAssets = useMemo(() => {
    if (!plans) return [];
    const assets = [...new Set(plans.map(p => p.asset))];
    return assets.sort();
  }, [plans]);

  const availableLockPeriods = useMemo(() => {
    if (!plans) return [];
    const periods = [...new Set(plans.map(p => p.lockDays))];
    return periods.sort((a, b) => a - b);
  }, [plans]);

  // Filter plans based on selected filters
  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(plan => {
      const assetMatch = filterAsset === "all" || plan.asset === filterAsset;
      const lockMatch = filterLockPeriod === "all" || plan.lockDays.toString() === filterLockPeriod;
      return assetMatch && lockMatch;
    });
  }, [plans, filterAsset, filterLockPeriod]);

  const calculateReward = (position: any, plan: any) => {
    const now = new Date();
    const started = new Date(position.startedAt);
    const daysPassed = (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
    const principal = parseFloat(position.amount);
    const apr = parseFloat(plan?.apr || "0");
    return (principal * apr * daysPassed) / (365 * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staking</h1>
          <p className="text-muted-foreground">Earn passive income by staking your crypto</p>
        </div>

        {/* Staking Calculator */}
        {plans && plans.length > 0 && (
          <StakingCalculator plans={plans} />
        )}

        {/* Available Plans */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Available Plans</h2>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterAsset} onValueChange={setFilterAsset}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {availableAssets.map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLockPeriod} onValueChange={setFilterLockPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Lock Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {availableLockPeriods.map(days => (
                    <SelectItem key={days} value={days.toString()}>
                      {days === 0 ? "Flexible" : `${days} Days`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filterAsset !== "all" || filterLockPeriod !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterAsset("all");
                    setFilterLockPeriod("all");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filteredPlans.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No staking plans match your filters. Try adjusting your selection.
              </div>
            ) : filteredPlans.map((plan) => (
              <Card key={plan.id} className="glass border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-2xl font-bold text-primary">
                    {parseFloat(plan.apr).toFixed(2)}% APR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asset:</span>
                      <span className="font-medium">{plan.asset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lock Period:</span>
                      <span className="font-medium">{plan.lockDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Amount:</span>
                      <span className="font-medium">{parseFloat(plan.minAmount).toFixed(2)} {plan.asset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participants:</span>
                      <span className="font-medium">{plan.participantsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Staked:</span>
                      <span className="font-medium">{plan.totalStaked ? parseFloat(plan.totalStaked).toFixed(4) : '0.0000'} {plan.asset}</span>
                    </div>
                  </div>

                  <Dialog open={dialogOpen && selectedPlan?.id === plan.id} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (open) setSelectedPlan(plan);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full gradient-primary">
                        <Lock className="mr-2 h-4 w-4" /> Stake Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Stake {plan.asset}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            placeholder={`Min: ${plan.minAmount}`}
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-compound">Auto-Compound Rewards</Label>
                          <input
                            id="auto-compound"
                            type="checkbox"
                            checked={autoCompound}
                            onChange={(e) => setAutoCompound(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>APR: {parseFloat(plan.apr).toFixed(2)}%</div>
                          <div>Lock Period: {plan.lockDays} days</div>
                          <div>
                            Estimated Reward: {stakeAmount ? (
                              plan.lockDays === 0 
                                ? `${((parseFloat(stakeAmount) * parseFloat(plan.apr)) / (365 * 100)).toFixed(4)} ${plan.asset}/day`
                                : `${((parseFloat(stakeAmount) * parseFloat(plan.apr) * plan.lockDays) / (365 * 100)).toFixed(4)} ${plan.asset}`
                            ) : "0"}
                          </div>
                          {autoCompound && <div className="text-primary">✓ Rewards will be automatically reinvested</div>}
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleStake}
                          disabled={stakeMutation.isPending}
                        >
                          {stakeMutation.isPending ? "Staking..." : "Confirm Stake"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredPlans.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing {filteredPlans.length} of {plans?.length || 0} plans
            </p>
          )}
        </div>

        {/* Active Positions */}
        {activePositions.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Active Positions</h2>
            <div className="space-y-8">
              {activePositions.map((position) => {
                const plan = plans?.find(p => p.id === position.planId);
                const reward = plan ? calculateReward(position, plan) : 0;
                const maturesAt = position.maturesAt ? new Date(position.maturesAt) : null;
                const isLocked = maturesAt ? new Date() < maturesAt : false;

                return (
                  <div key={position.id} className="space-y-4">
                    <Card className="glass border-accent/20">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{plan?.name || "Staking"}</span>
                          <span className="text-sm font-normal text-muted-foreground">{plan?.asset}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Staked Amount:</span>
                            <span className="font-medium">{parseFloat(position.amount).toFixed(4)} {plan?.asset}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Reward:</span>
                            <span className="font-medium text-green-500">+{reward.toFixed(4)} {plan?.asset}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">APR:</span>
                            <span className="font-medium">{plan ? parseFloat(plan.apr).toFixed(2) : "0"}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Started:</span>
                            <span className="font-medium">{new Date(position.startedAt).toLocaleDateString()}</span>
                          </div>
                          {maturesAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Matures:</span>
                              <span className="font-medium">{maturesAt.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full"
                          variant={isLocked ? "outline" : "default"}
                          onClick={() => unstakeMutation.mutate({ positionId: position.id })}
                          disabled={isLocked || unstakeMutation.isPending}
                        >
                          {isLocked ? (
                            <>
                              <Clock className="mr-2 h-4 w-4" /> Locked
                            </>
                          ) : (
                            <>
                              <TrendingUp className="mr-2 h-4 w-4" /> Unstake & Claim
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    {/* Rewards History Chart */}
                    <StakingRewardsChart positionId={position.id} asset={plan?.asset || ""} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Positions */}
        {completedPositions.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Completed Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Plan</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-right py-3 px-4">Reward</th>
                      <th className="text-right py-3 px-4">Withdrawn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedPositions.map((position) => {
                      const plan = plans?.find(p => p.id === position.planId);
                      return (
                        <tr key={position.id} className="border-b border-border/50">
                          <td className="py-3 px-4">{plan?.name || "Staking"}</td>
                          <td className="text-right py-3 px-4">{parseFloat(position.amount).toFixed(4)} {plan?.asset}</td>
                          <td className="text-right py-3 px-4 text-green-500">+{parseFloat(position.rewards).toFixed(4)} {plan?.asset}</td>
                          <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                            {position.withdrawnAt ? new Date(position.withdrawnAt).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activePositions.length === 0 && completedPositions.length === 0 && (
          <Card className="glass">
            <CardContent className="text-center py-12">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No staking positions yet. Choose a plan above to start earning!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
