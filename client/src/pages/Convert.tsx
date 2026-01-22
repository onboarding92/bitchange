import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowDownUp, TrendingUp, Clock, AlertCircle, CheckCircle, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import MobileNav from '../components/MobileNav';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

const SUPPORTED_ASSETS = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'MATIC'];
const MINIMUM_USDT_EQUIVALENT = 10; // Minimum conversion amount in USDT

export default function Convert() {
  const [fromAsset, setFromAsset] = useState('BTC');
  const [toAsset, setToAsset] = useState('USDT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: wallets } = trpc.wallet.list.useQuery();
  const { data: rateData, refetch: refetchRate } = trpc.conversion.getRate.useQuery(
    { fromAsset, toAsset },
    { enabled: fromAsset !== toAsset }
  );
  const utils = trpc.useUtils();
  const { data: conversions } = trpc.conversion.myConversions.useQuery();
  const convertMutation = trpc.conversion.convert.useMutation({
    onSuccess: (data) => {
      toast.success(`Converted ${data.fromAmount} ${fromAsset} to ${data.toAmount} ${toAsset}`);
      setFromAmount('');
      setToAmount('');
      // Invalidate queries to refresh data
      utils.conversion.myConversions.invalidate();
      utils.wallet.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Calculate toAmount when fromAmount or rate changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromAmount && rateData) {
        const amount = parseFloat(fromAmount);
        if (!isNaN(amount) && amount > 0) {
          const fee = amount * (rateData.feePercentage / 100);
          const amountAfterFee = amount - fee;
          const result = amountAfterFee * rateData.rate;
          setToAmount(result.toFixed(8));
        } else {
          setToAmount('');
        }
      } else {
        setToAmount('');
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fromAmount, rateData]);

  // Refresh rate every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (fromAsset !== toAsset) {
        refetchRate();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fromAsset, toAsset, refetchRate]);

  const handleSwapAssets = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount('');
    setToAmount('');
  };

  const handleConvert = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check minimum amount (10 USDT equivalent)
    if (rateData) {
      const amount = parseFloat(fromAmount);
      let usdtEquivalent = 0;
      
      // Calculate USDT equivalent of fromAmount
      if (fromAsset === 'USDT') {
        usdtEquivalent = amount;
      } else {
        // Get price of fromAsset in USDT
        // Approximate: use the rate to calculate USDT value
        // If converting TO USDT, the rate is already in USDT
        if (toAsset === 'USDT') {
          usdtEquivalent = amount * rateData.rate;
        } else {
          // For other pairs, estimate based on typical crypto prices
          // This is a simplified check - ideally we'd fetch USDT rates for all assets
          const estimatedUsdtValue = amount * rateData.rate * 0.1; // Rough estimate
          usdtEquivalent = estimatedUsdtValue;
        }
      }

      if (usdtEquivalent < MINIMUM_USDT_EQUIVALENT) {
        toast.error(`Minimum conversion amount is ${MINIMUM_USDT_EQUIVALENT} USDT equivalent`);
        return;
      }
    }

    // Show confirmation dialog instead of immediate conversion
    setShowConfirmDialog(true);
  };

  const handleConfirmConvert = () => {
    setShowConfirmDialog(false);
    convertMutation.mutate({ fromAsset, toAsset, fromAmount });
  };

  const getWalletBalance = (asset: string) => {
    const wallet = wallets?.find((w) => w.asset === asset);
    return wallet ? parseFloat(wallet.balance) : 0;
  };

  const fee = fromAmount && rateData
    ? (parseFloat(fromAmount) * (rateData.feePercentage / 100)).toFixed(8)
    : '0';

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Repeat className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Convert Crypto</h1>
              <p className="text-muted-foreground mt-1">Instantly convert between cryptocurrencies</p>
            </div>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Conversion Form */}
        <Card>
          <CardHeader>
            <CardTitle>Convert</CardTitle>
            <CardDescription>Exchange one cryptocurrency for another</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <div className="flex gap-2">
                <Select value={fromAsset} onValueChange={setFromAsset}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_ASSETS.filter((a) => a !== toAsset).map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFromAmount(getWalletBalance(fromAsset).toString())}
                    className="px-3"
                  >
                    MAX
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {getWalletBalance(fromAsset).toFixed(8)} {fromAsset}
              </p>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapAssets}
                className="rounded-full"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <div className="flex gap-2">
                <Select value={toAsset} onValueChange={setToAsset}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_ASSETS.filter((a) => a !== fromAsset).map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="flex-1 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {getWalletBalance(toAsset).toFixed(8)} {toAsset}
              </p>
            </div>

            {/* Rate Info */}
            {rateData && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium">
                    1 {fromAsset} = {rateData.rate.toFixed(8)} {toAsset}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee ({rateData.feePercentage}%)</span>
                  <span className="font-medium">
                    {fee} {fromAsset}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending || !fromAmount || !toAmount}
              className="w-full"
            >
              {convertMutation.isPending ? 'Converting...' : 'Convert'}
            </Button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Rates update every 10 seconds</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Minimum conversion: {MINIMUM_USDT_EQUIVALENT} USDT equivalent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>Your conversion history</CardDescription>
          </CardHeader>
          <CardContent>
            {!conversions || conversions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No conversions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversions.slice(0, 10).map((conversion) => (
                  <div
                    key={conversion.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <ArrowDownUp className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {parseFloat(conversion.fromAmount).toFixed(4)} {conversion.fromAsset} →{' '}
                          {parseFloat(conversion.toAmount).toFixed(4)} {conversion.toAsset}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(conversion.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="text-sm font-medium">
                        {parseFloat(conversion.rate).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Confirm Conversion
            </DialogTitle>
            <DialogDescription>
              Please review the conversion details before confirming
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="font-semibold">{fromAmount} {fromAsset}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="font-semibold">{toAmount} {toAsset}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Exchange Rate</span>
                <span className="font-medium">1 {fromAsset} = {rateData?.rate.toFixed(8)} {toAsset}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Fee ({rateData?.feePercentage}%)</span>
                <span className="font-medium">{fee} {fromAsset}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-semibold">You will receive</span>
                <span className="font-bold text-primary">{toAmount} {toAsset}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmConvert} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Converting...' : 'Confirm Conversion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
