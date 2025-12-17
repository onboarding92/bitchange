import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";

export default function Withdrawal() {
  const [asset, setAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  const { data: withdrawals, refetch } = trpc.withdrawal.list.useQuery();
  const { data: wallets } = trpc.wallet.list.useQuery();

  const createWithdrawal = trpc.withdrawal.create.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request created! Awaiting admin approval.");
      setAmount("");
      setAddress("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleWithdraw = () => {
    if (!amount || !address) {
      toast.error("Please enter amount and address");
      return;
    }
    createWithdrawal.mutate({
      asset,
      amount,
      address,
    });
  };

  const selectedWallet = wallets?.find(w => w.asset === asset);
  const available = selectedWallet 
    ? parseFloat(selectedWallet.balance) - parseFloat(selectedWallet.locked)
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Withdrawal</h1>
          <p className="text-muted-foreground">Withdraw funds from your account</p>
        </div>

        {/* Withdrawal Form */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>New Withdrawal</CardTitle>
            <CardDescription>All withdrawals require admin approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Asset</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {available.toFixed(8)} {asset}
                </p>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs mt-1"
                  onClick={() => setAmount(available.toString())}
                >
                  Use max
                </Button>
              </div>
            </div>

            <div>
              <Label>Withdrawal Address</Label>
              <Input
                placeholder="Enter wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the address is correct. Transactions cannot be reversed.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Important Notice</p>
                <p className="text-muted-foreground">
                  Withdrawals are manually reviewed by our admin team for security. 
                  Your funds will be locked until the request is processed (approved or rejected).
                </p>
              </div>
            </div>

            <Button
              className="w-full gradient-primary"
              onClick={handleWithdraw}
              disabled={createWithdrawal.isPending || available <= 0}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {createWithdrawal.isPending ? "Processing..." : "Request Withdrawal"}
            </Button>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {!withdrawals || withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No withdrawals yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Asset</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Address</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b border-border/50">
                        <td className="py-3 px-4">{withdrawal.asset}</td>
                        <td className="text-right py-3 px-4">{parseFloat(withdrawal.amount).toFixed(8)}</td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {withdrawal.address.slice(0, 10)}...{withdrawal.address.slice(-8)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(withdrawal.status)}
                            <span className="capitalize">{withdrawal.status}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
