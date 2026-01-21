import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calculator, TrendingUp, Repeat } from "lucide-react";

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
  const [autoCompound, setAutoCompound] = useState<boolean>(false);
  const [compoundFrequency, setCompoundFrequency] = useState<string>("daily");

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

    // Yearly reward (simple interest)
    const yearlyReward = (principal * apr) / 100;

    // Compound interest calculations
    const getCompoundPeriods = (frequency: string, days: number) => {
      switch (frequency) {
        case "daily": return days;
        case "weekly": return days / 7;
        case "monthly": return days / 30;
        default: return days;
      }
    };

    const calculateCompound = (days: number) => {
      const periods = getCompoundPeriods(compoundFrequency, days);
      const ratePerPeriod = (apr / 100) / (365 / (days / periods));
      return principal * Math.pow(1 + ratePerPeriod, periods) - principal;
    };

    const dailyCompound = autoCompound ? calculateCompound(1) : dailyReward;
    const monthlyCompound = autoCompound ? calculateCompound(30) : monthlyReward;
    const yearlyCompound = autoCompound ? calculateCompound(365) : yearlyReward;
    const lockPeriodCompound = autoCompound && lockDays > 0 ? calculateCompound(lockDays) : lockPeriodReward;
    const customPeriodCompound = autoCompound && customPeriodDays > 0 ? calculateCompound(customPeriodDays) : customPeriodReward;

    return {
      dailyReward,
      lockPeriodReward,
      customPeriodReward,
      customPeriodDays,
      monthlyReward,
      yearlyReward,
      dailyCompound,
      monthlyCompound,
      yearlyCompound,
      lockPeriodCompound,
      customPeriodCompound,
      principal,
      apr,
      lockDays,
      asset: selectedPlan.asset,
    };
  }, [selectedPlan, amount, customDays, autoCompound, compoundFrequency]);

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

        {/* Auto-Compound Toggle */}
        <div className="space-y-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-accent" />
              <Label htmlFor="auto-compound" className="cursor-pointer">Auto-Compound Rewards</Label>
            </div>
            <Switch
              id="auto-compound"
              checked={autoCompound}
              onCheckedChange={setAutoCompound}
            />
          </div>
          
          {autoCompound && (
            <div className="space-y-2">
              <Label>Compound Frequency</Label>
              <Select value={compoundFrequency} onValueChange={setCompoundFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Compound interest reinvests rewards automatically, earning interest on interest
              </p>
            </div>
          )}
        </div>

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
                <div className="text-right">
                  <span className="font-medium text-green-500">
                    +{(autoCompound ? calculations.dailyCompound : calculations.dailyReward).toFixed(6)} {calculations.asset}
                  </span>
                  {autoCompound && calculations.dailyReward !== calculations.dailyCompound && (
                    <div className="text-xs text-muted-foreground">
                      Simple: +{calculations.dailyReward.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Reward */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <span className="text-sm text-muted-foreground">Monthly Reward (30 days)</span>
                <div className="text-right">
                  <span className="font-medium text-green-500">
                    +{(autoCompound ? calculations.monthlyCompound : calculations.monthlyReward).toFixed(6)} {calculations.asset}
                  </span>
                  {autoCompound && calculations.monthlyReward !== calculations.monthlyCompound && (
                    <div className="text-xs text-muted-foreground">
                      Simple: +{calculations.monthlyReward.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              {/* Lock Period Reward (if locked) */}
              {calculations.lockDays > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium">
                    {calculations.lockDays} Days Lock Reward
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-primary">
                      +{(autoCompound ? calculations.lockPeriodCompound : calculations.lockPeriodReward).toFixed(6)} {calculations.asset}
                    </span>
                    {autoCompound && calculations.lockPeriodReward !== calculations.lockPeriodCompound && (
                      <div className="text-xs text-muted-foreground">
                        Simple: +{calculations.lockPeriodReward.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Period Reward */}
              {customDays && parseInt(customDays) > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <span className="text-sm font-medium">
                    {calculations.customPeriodDays} Days Reward
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-accent">
                      +{(autoCompound ? calculations.customPeriodCompound : calculations.customPeriodReward).toFixed(6)} {calculations.asset}
                    </span>
                    {autoCompound && calculations.customPeriodReward !== calculations.customPeriodCompound && (
                      <div className="text-xs text-muted-foreground">
                        Simple: +{calculations.customPeriodReward.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Yearly Reward */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                <span className="text-sm text-muted-foreground">Yearly Reward (365 days)</span>
                <div className="text-right">
                  <span className="font-medium text-green-500">
                    +{(autoCompound ? calculations.yearlyCompound : calculations.yearlyReward).toFixed(6)} {calculations.asset}
                  </span>
                  {autoCompound && calculations.yearlyReward !== calculations.yearlyCompound && (
                    <div className="text-xs text-muted-foreground">
                      Simple: +{calculations.yearlyReward.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Return */}
              <div className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <span className="font-semibold">Total Return (Principal + Reward)</span>
                <span className="font-bold text-lg">
                  {(calculations.principal + (autoCompound ? (calculations.lockDays > 0 ? calculations.lockPeriodCompound : calculations.yearlyCompound) : (calculations.lockDays > 0 ? calculations.lockPeriodReward : calculations.yearlyReward))).toFixed(6)} {calculations.asset}
                </span>
              </div>
              
              {/* Compound Benefit Highlight */}
              {autoCompound && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat className="h-3 w-3 text-accent" />
                    <span className="text-xs font-medium text-accent">Compound Interest Benefit</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Extra earnings: +{(
                      (autoCompound ? (calculations.lockDays > 0 ? calculations.lockPeriodCompound : calculations.yearlyCompound) : 0) -
                      (calculations.lockDays > 0 ? calculations.lockPeriodReward : calculations.yearlyReward)
                    ).toFixed(6)} {calculations.asset} compared to simple interest
                  </p>
                </div>
              )}
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
