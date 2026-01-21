import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";

interface StakingPlan {
  id: number;
  name: string;
  asset: string;
  apr: string;
  lockDays: number;
  minAmount: string;
}

interface StakingCalculatorProps {
  plans: StakingPlan[];
}

export function StakingCalculator({ plans }: StakingCalculatorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [customDays, setCustomDays] = useState<string>("");

  const selectedPlan = useMemo(() => {
    return plans.find(p => p.id.toString() === selectedPlanId);
  }, [plans, selectedPlanId]);

  const calculations = useMemo(() => {
    if (!selectedPlan || !amount || parseFloat(amount) <= 0) {
      return null;
    }

    const principal = parseFloat(amount);
    const apr = parseFloat(selectedPlan.apr);
    const lockDays = selectedPlan.lockDays;

    // Daily reward (for flexible staking)
    const dailyReward = (principal * apr) / (365 * 100);

    // Total reward for lock period
    const lockPeriodReward = (principal * apr * lockDays) / (365 * 100);

    // Custom period reward (if user specifies days)
    const customPeriodDays = customDays ? parseInt(customDays) : lockDays;
    const customPeriodReward = (principal * apr * customPeriodDays) / (365 * 100);

    // Monthly reward (30 days)
    const monthlyReward = (principal * apr * 30) / (365 * 100);

    // Yearly reward
    const yearlyReward = (principal * apr) / 100;

    return {
      dailyReward,
      lockPeriodReward,
      customPeriodReward,
      customPeriodDays,
      monthlyReward,
      yearlyReward,
      principal,
      apr,
      lockDays,
      asset: selectedPlan.asset,
    };
  }, [selectedPlan, amount, customDays]);

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Staking Calculator</CardTitle>
        </div>
        <CardDescription>
          Estimate your potential rewards before staking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Selection */}
        <div className="space-y-2">
          <Label>Select Plan</Label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a staking plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  {plan.name} ({parseFloat(plan.apr).toFixed(2)}% APR)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount to Stake</Label>
          <Input
            type="number"
            placeholder={selectedPlan ? `Min: ${selectedPlan.minAmount} ${selectedPlan.asset}` : "Enter amount"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.0001"
          />
        </div>

        {/* Custom Days (optional) */}
        {selectedPlan && selectedPlan.lockDays === 0 && (
          <div className="space-y-2">
            <Label>Custom Period (Days) - Optional</Label>
            <Input
              type="number"
              placeholder="Enter number of days"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              min="1"
            />
          </div>
        )}

        {/* Results */}
        {calculations && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">Estimated Rewards</span>
            </div>

            <div className="space-y-3">
              {/* Daily Reward */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <span className="text-sm text-muted-foreground">Daily Reward</span>
                <span className="font-medium text-green-500">
                  +{calculations.dailyReward.toFixed(6)} {calculations.asset}
                </span>
              </div>

              {/* Monthly Reward */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <span className="text-sm text-muted-foreground">Monthly Reward (30 days)</span>
                <span className="font-medium text-green-500">
                  +{calculations.monthlyReward.toFixed(6)} {calculations.asset}
                </span>
              </div>

              {/* Lock Period Reward (if locked) */}
              {calculations.lockDays > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium">
                    {calculations.lockDays} Days Lock Reward
                  </span>
                  <span className="font-bold text-primary">
                    +{calculations.lockPeriodReward.toFixed(6)} {calculations.asset}
                  </span>
                </div>
              )}

              {/* Custom Period Reward */}
              {customDays && parseInt(customDays) > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <span className="text-sm font-medium">
                    {calculations.customPeriodDays} Days Reward
                  </span>
                  <span className="font-bold text-accent">
                    +{calculations.customPeriodReward.toFixed(6)} {calculations.asset}
                  </span>
                </div>
              )}

              {/* Yearly Reward */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <span className="text-sm text-muted-foreground">Yearly Reward (365 days)</span>
                <span className="font-medium text-green-500">
                  +{calculations.yearlyReward.toFixed(6)} {calculations.asset}
                </span>
              </div>

              {/* Total Return */}
              <div className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <span className="font-semibold">Total Return (Principal + Reward)</span>
                <span className="font-bold text-lg">
                  {(calculations.principal + (calculations.lockDays > 0 ? calculations.lockPeriodReward : calculations.yearlyReward)).toFixed(6)} {calculations.asset}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2">
              <p>• APR: {calculations.apr.toFixed(2)}%</p>
              <p>• Lock Period: {calculations.lockDays === 0 ? "Flexible (No Lock)" : `${calculations.lockDays} Days`}</p>
              <p>• Calculation Formula: (Principal × APR × Days) / (365 × 100)</p>
              {calculations.lockDays > 0 && (
                <p className="text-yellow-500">⚠️ Locked staking: Early withdrawal not allowed before maturity</p>
              )}
            </div>
          </div>
        )}

        {!calculations && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Select a plan and enter an amount to see estimated rewards
          </div>
        )}
      </CardContent>
    </Card>
  );
}
