import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowDownRight, CheckCircle2, Clock, XCircle } from "lucide-react";

const PAYMENT_GATEWAYS = [
  { id: "changenow", name: "ChangeNOW", description: "Fast crypto exchange" },
  { id: "simplex", name: "Simplex", description: "Buy crypto with card" },
  { id: "moonpay", name: "MoonPay", description: "Popular payment gateway" },
  { id: "transak", name: "Transak", description: "Global fiat-to-crypto" },
  { id: "mercuryo", name: "Mercuryo", description: "Instant crypto purchases" },
  { id: "coingate", name: "CoinGate", description: "Multiple payment methods" },
  { id: "changelly", name: "Changelly", description: "Crypto exchange platform" },
  { id: "banxa", name: "Banxa", description: "Regulated payment gateway" },
];

export default function Deposit() {
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [asset, setAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");

  const { data: deposits, refetch } = trpc.deposit.list.useQuery();

  const createDeposit = trpc.deposit.create.useMutation({
    onSuccess: () => {
      toast.success("Deposit request created!");
      setAmount("");
      setTxHash("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeposit = () => {
    if (!selectedGateway || !amount) {
      toast.error("Please select gateway and enter amount");
      return;
    }
    createDeposit.mutate({
      asset,
      amount,
      method: selectedGateway as any,
      txHash: txHash || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Deposit</h1>
          <p className="text-muted-foreground">Add funds to your account</p>
        </div>

        {/* Payment Gateways */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {PAYMENT_GATEWAYS.map((gateway) => (
              <Card
                key={gateway.id}
                className={`glass cursor-pointer transition-all ${
                  selectedGateway === gateway.id
                    ? "border-primary ring-2 ring-primary"
                    : "border-border/50 hover:border-primary/50"
                }`}
                onClick={() => setSelectedGateway(gateway.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{gateway.name}</CardTitle>
                  <CardDescription className="text-xs">{gateway.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Deposit Form */}
        {selectedGateway && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Deposit Details</CardTitle>
              <CardDescription>
                Complete your deposit using {PAYMENT_GATEWAYS.find(g => g.id === selectedGateway)?.name}
              </CardDescription>
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
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Transaction Hash (Optional)</Label>
                <Input
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If you've already sent the transaction, paste the hash here
                </p>
              </div>

              <Button
                className="w-full gradient-primary"
                onClick={handleDeposit}
                disabled={createDeposit.isPending}
              >
                <ArrowDownRight className="mr-2 h-4 w-4" />
                {createDeposit.isPending ? "Processing..." : "Create Deposit Request"}
              </Button>

              <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Click "Create Deposit Request" to generate your deposit</li>
                  <li>You'll be redirected to {PAYMENT_GATEWAYS.find(g => g.id === selectedGateway)?.name}</li>
                  <li>Complete the payment process</li>
                  <li>Funds will be credited after confirmation</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deposit History */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Deposit History</CardTitle>
          </CardHeader>
          <CardContent>
            {!deposits || deposits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No deposits yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Asset</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Method</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b border-border/50">
                        <td className="py-3 px-4">{deposit.asset}</td>
                        <td className="text-right py-3 px-4">{parseFloat(deposit.amount).toFixed(8)}</td>
                        <td className="py-3 px-4 capitalize">{deposit.provider || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deposit.status)}
                            <span className="capitalize">{deposit.status}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                          {new Date(deposit.createdAt).toLocaleDateString()}
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
