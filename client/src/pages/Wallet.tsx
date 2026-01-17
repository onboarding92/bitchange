import { useState } from "react";
import { safeToFixed } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Copy, QrCode, RefreshCw } from "lucide-react";
import { TwoFactorVerifyDialog } from "@/components/TwoFactorVerifyDialog";
import { useAuth } from "@/hooks/useAuth";

const SUPPORTED_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum", network: "Ethereum" },
  { symbol: "USDT", name: "Tether", network: "Ethereum (ERC-20)" },
  { symbol: "BNB", name: "Binance Coin", network: "BNB Chain" },
  { symbol: "USDC", name: "USD Coin", network: "Ethereum (ERC-20)" },
  { symbol: "ADA", name: "Cardano", network: "Cardano" },
  { symbol: "SOL", name: "Solana", network: "Solana" },
  { symbol: "XRP", name: "Ripple", network: "XRP Ledger" },
  { symbol: "DOT", name: "Polkadot", network: "Polkadot" },
  { symbol: "DOGE", name: "Dogecoin", network: "Dogecoin" },
];

export default function Wallet() {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [depositAmount, setDepositAmount] = useState("");
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [pending2FAAction, setPending2FAAction] = useState<(() => void) | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Get user wallets
  const { data: wallets, refetch: refetchWallets } = trpc.wallet.list.useQuery();

  // Get deposit address
  const { data: depositAddress } = trpc.wallet.getDepositAddress.useQuery({
    asset: selectedAsset.symbol,
    network: selectedAsset.network,
  });

  // Get transaction history
  // const { data: transactions } = trpc.wallet.transactions.useQuery({
  //   limit: 50,
  // });
  const transactions: any[] = []; // TODO: Implement transactions endpoint

  // Create deposit mutation
  const createDeposit = trpc.deposit.create.useMutation({
    onSuccess: () => {
      toast.success("Deposit request created successfully");
      setDepositAmount("");
      refetchWallets();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Create withdrawal mutation
  const createWithdrawal = trpc.withdrawal.create.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted for approval");
      setWithdrawAddress("");
      setWithdrawAmount("");
      refetchWallets();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeposit = () => {
    if (!depositAmount) {
      toast.error("Please enter deposit amount");
      return;
    }

    createDeposit.mutate({
      asset: selectedAsset.symbol,
      amount: depositAmount,
      network: selectedAsset.network,
      method: "changenow",
    });
  };

  const handleWithdraw = (twoFactorCode?: string) => {
    if (!withdrawAddress || !withdrawAmount) {
      toast.error("Please enter address and amount");
      return;
    }

    createWithdrawal.mutate({
      asset: selectedAsset.symbol,
      amount: withdrawAmount,
      address: withdrawAddress,
      network: selectedAsset.network,
      twoFactorCode,
    });
  };

  const handleWithdrawClick = () => {
    if (!withdrawAddress || !withdrawAmount) {
      toast.error("Please enter address and amount");
      return;
    }

    // Check if user has 2FA enabled
    if (user?.twoFactorEnabled) {
      setShow2FADialog(true);
    } else {
      handleWithdraw();
    }
  };

  const handle2FAVerify = (code: string) => {
    handleWithdraw(code);
    setShow2FADialog(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const currentBalance = parseFloat(wallets?.find((w) => w.asset === selectedAsset.symbol)?.balance || "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Wallet</h1>
            <p className="text-slate-400">Manage your cryptocurrency assets</p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetchWallets()}
            className="border-slate-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Total Balance Card */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
          <CardHeader>
            <CardTitle className="text-white">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">
              ${safeToFixed(wallets?.reduce((sum, w) => sum + parseFloat(w.balance) * (w.asset === "USDT" ? 1 : 43000), 0), 2)}
            </div>
            <p className="text-purple-100">Estimated value in USD</p>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPPORTED_ASSETS.map((asset) => {
            const wallet = wallets?.find((w) => w.asset === asset.symbol);
            const balance = parseFloat(wallet?.balance || "0");

            return (
              <Card
                key={asset.symbol}
                className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-purple-500 ${
                  selectedAsset.symbol === asset.symbol ? "border-purple-500 ring-2 ring-purple-500/50" : ""
                }`}
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{asset.symbol}</div>
                      <div className="text-sm text-slate-400">{asset.name}</div>
                    </div>
                    <Badge variant="outline" className="text-slate-400">
                      {asset.network}
                    </Badge>
                  </div>
                  <div className="text-xl font-semibold text-white">{safeToFixed(balance, 8)}</div>
                  <div className="text-sm text-slate-400">
                    ≈ ${safeToFixed(parseFloat(wallet?.balance || "0") * (asset.symbol === "USDT" ? 1 : 43000), 2)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Deposit/Withdraw Section */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedAsset.name} ({selectedAsset.symbol})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="withdraw">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Withdraw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4">
                <div className="bg-slate-900 rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-slate-400">Deposit Address</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={depositAddress?.address || "Generating..."}
                        readOnly
                        className="bg-slate-800 border-slate-700 text-white font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(depositAddress?.address || "")}
                        disabled={!depositAddress?.address}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" disabled={!depositAddress?.address}>
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Deposit QR Code</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center p-4 bg-white rounded-lg">
                            <div className="text-center">
                              <div className="text-6xl mb-2">📱</div>
                              <p className="text-sm text-slate-600">QR Code placeholder</p>
                              <p className="text-xs text-slate-500 mt-2">
                                In production, use qrcode library
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3 text-sm text-blue-200">
                    <strong>Important:</strong> Only send {selectedAsset.symbol} to this address on{" "}
                    {selectedAsset.network} network. Sending other assets may result in permanent loss.
                  </div>

                  <div>
                    <Label className="text-slate-400">Amount (optional for tracking)</Label>
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={createDeposit.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {createDeposit.isPending ? "Creating..." : "Create Deposit Request"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                <div className="bg-slate-900 rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-slate-400">Current Balance</Label>
                    <div className="text-2xl font-bold text-white mt-1">
                      {safeToFixed(currentBalance, 8)} {selectedAsset.symbol}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400">Withdrawal Address</Label>
                    <Input
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder={`Enter ${selectedAsset.symbol} address`}
                      className="bg-slate-800 border-slate-700 text-white font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400">Amount</Label>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(safeToFixed(currentBalance * 0.25, 8))}
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(safeToFixed(currentBalance * 0.5, 8))}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(safeToFixed(currentBalance * 0.75, 8))}
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(safeToFixed(currentBalance, 8))}
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3 text-sm text-yellow-200">
                    <strong>Notice:</strong> Withdrawals require admin approval. Processing time: 1-24
                    hours.
                  </div>

                  <Button
                    onClick={handleWithdrawClick}
                    disabled={createWithdrawal.isPending}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {createWithdrawal.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions?.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "deposit"
                          ? "bg-green-900/50 text-green-400"
                          : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {tx.type === "deposit" ? (
                        <ArrowDownCircle className="w-5 h-5" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium capitalize">{tx.type}</div>
                      <div className="text-sm text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {tx.type === "deposit" ? "+" : "-"}
                      {tx.amount} {tx.asset}
                    </div>
                    <Badge
                      variant={tx.status === "completed" ? "default" : "outline"}
                      className={
                        tx.status === "completed"
                          ? "bg-green-600"
                          : tx.status === "pending"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <div className="text-center py-8 text-slate-400">No transactions yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2FA Verification Dialog */}
      <TwoFactorVerifyDialog
        open={show2FADialog}
        onOpenChange={setShow2FADialog}
        onVerify={handle2FAVerify}
        title="Withdrawal Verification Required"
        description="Please enter your 6-digit authentication code to authorize this withdrawal."
        isLoading={createWithdrawal.isPending}
      />
    </div>
  );
}
