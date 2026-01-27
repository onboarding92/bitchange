import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowDownRight, CheckCircle2, Clock, XCircle, Copy, AlertTriangle, Info, ArrowLeft } from "lucide-react";

const PAYMENT_GATEWAYS = [
  { id: "bank_transfer", name: "Bank Transfer (EUR)", description: "Instant SEPA transfer via Sunrise" },
  { id: "changenow", name: "ChangeNOW", description: "Fast crypto exchange" },
  { id: "simplex", name: "Simplex", description: "Buy crypto with card" },
  { id: "moonpay", name: "MoonPay", description: "Popular payment gateway" },
  { id: "transak", name: "Transak", description: "Global fiat-to-crypto" },
  { id: "mercuryo", name: "Mercuryo", description: "Instant crypto purchases" },
  { id: "coingate", name: "CoinGate", description: "Multiple payment methods" },
  { id: "changelly", name: "Changelly", description: "Crypto exchange platform" },
  { id: "banxa", name: "Banxa", description: "Regulated payment gateway" },
];

const BANK_DETAILS = {
  accountName: "Sunrise",
  iban: "DE37202208000044326855",
  bankName: "Banking Circle - German Branch",
  bankAddress: "Biedersteiner Str. 6, 80333 München",
  bic: "SXPYDEHHXXX",
};

export default function Deposit() {
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const { data: networks } = trpc.wallet.listNetworks.useQuery(
    { asset },
    { enabled: !!asset }
  );

  // Auto-select first network when networks load
  useEffect(() => {
    if (networks && networks.length > 0 && !network) {
      setNetwork(networks[0].symbol);
    }
  }, [networks, network]);

  const { data: depositAddress, isLoading: loadingAddress } = trpc.wallet.getDepositAddress.useQuery(
    { asset, network },
    { enabled: !!asset && !!network }
  );

  useEffect(() => {
    if (depositAddress?.address) {
      QRCode.toDataURL(depositAddress.address, { width: 256 }).then(setQrCodeUrl);
    }
  }, [depositAddress]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllBankDetails = () => {
    const allDetails = `Account Name: ${BANK_DETAILS.accountName}
IBAN: ${BANK_DETAILS.iban}
Bank Name: ${BANK_DETAILS.bankName}
Bank Address: ${BANK_DETAILS.bankAddress}
BIC: ${BANK_DETAILS.bic}`;
    
    navigator.clipboard.writeText(allDetails);
    toast.success("All bank details copied to clipboard");
  };

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
    if (!selectedGateway || !amount || !network) {
      toast.error("Please select gateway, network and enter amount");
      return;
    }
    createDeposit.mutate({
      asset,
      amount,
      network,
      method: selectedGateway as any,
      txHash: txHash || undefined,
    });
  };

  const selectedNetworkData = networks?.find(n => n.symbol === network);

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

        {/* Crypto Deposit Address */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Deposit via Crypto Transfer</CardTitle>
            <CardDescription>
              Send {asset} directly to our centralized wallet address (like Binance/Coinbase)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Cryptocurrency</Label>
                <Select value={asset} onValueChange={(val) => { setAsset(val); setNetwork(""); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="SOL">Solana (SOL)</SelectItem>
                    <SelectItem value="TRX">Tron (TRX)</SelectItem>
                    <SelectItem value="MATIC">Polygon (MATIC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Select Network</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose network" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks && networks.length > 0 ? (
                      networks.map((net) => (
                        <SelectItem key={net.id} value={net.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span>{net.name}</span>
                            <span className="text-xs text-muted-foreground ml-4">
                              Fee: {net.depositFee} {asset} | Min: {net.minDeposit} {asset}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No networks available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedNetworkData && (
                  <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ <strong>{selectedNetworkData.name}</strong> - 
                      Deposit Fee: {selectedNetworkData.depositFee} {asset} | 
                      Min Deposit: {selectedNetworkData.minDeposit} {asset} | 
                      Confirmations: {selectedNetworkData.confirmations}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {loadingAddress ? (
              <div className="text-center py-8 text-muted-foreground">Generating wallet address...</div>
            ) : depositAddress ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network</span>
                    <span className="text-sm text-muted-foreground">{depositAddress.network}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Deposit Address</span>
                    <div className="flex items-center gap-2">
                      <Input value={depositAddress.address} readOnly className="font-mono text-xs" />
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(depositAddress.address, "Address")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {qrCodeUrl && (
                    <div className="flex justify-center pt-4">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg" loading="lazy" />
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                    ⚠️ <strong>CRITICAL WARNING:</strong> Only send {asset} to this address using the <strong>{depositAddress.network}</strong> network. 
                    Sending via a different network or sending different assets will result in <strong>PERMANENT LOSS</strong> of your funds!
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-2">
                    Double-check the network before sending. We cannot recover funds sent to the wrong network.
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Payment Gateways */}
        {!selectedGateway && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
            <div className="grid gap-4 md:grid-cols-4">
              {PAYMENT_GATEWAYS.map((gateway) => (
                <Card
                  key={gateway.id}
                  className="glass cursor-pointer transition-all border-border/50 hover:border-primary/50"
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
        )}

        {/* Bank Transfer - Kraken Style */}
        {selectedGateway === "bank_transfer" && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bank Transfer (EUR) - Sunrise</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGateway("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change Method
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warning Boxes */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      The name on your bank account must match the name on your BitChange account
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deposits from accounts with different names will be rejected and returned (minus any fees).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      Do not deposit from a business bank account
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Business account deposits are not supported and will be returned (minus any fees).
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Deposit Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your deposit details</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllBankDetails}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy all
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Account Name */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Account name</p>
                      <p className="font-mono font-medium">{BANK_DETAILS.accountName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BANK_DETAILS.accountName, "Account name")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* IBAN */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">IBAN</p>
                      <p className="font-mono font-medium text-sm">{BANK_DETAILS.iban}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BANK_DETAILS.iban, "IBAN")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bank Name */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Bank name</p>
                      <p className="font-mono font-medium text-sm">{BANK_DETAILS.bankName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BANK_DETAILS.bankName, "Bank name")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bank Address */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Bank address</p>
                      <p className="font-mono font-medium text-sm">{BANK_DETAILS.bankAddress}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BANK_DETAILS.bankAddress, "Bank address")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* BIC */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">BIC</p>
                      <p className="font-mono font-medium">{BANK_DETAILS.bic}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BANK_DETAILS.bic, "BIC")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Additional information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Funding provider</p>
                    <p className="font-medium">Sunrise</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Processing time</p>
                    <p className="font-medium">Instant</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Fee</p>
                    <p className="font-medium">0.00€</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Minimum deposit</p>
                    <p className="font-medium">1.00€</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Maximum deposit</p>
                    <p className="font-medium">No limit</p>
                  </div>
                </div>
              </div>

              {/* Info Notice */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Important Notice
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sunrise is our funding provider for Italian accounts. The deposit is totally safe and instant. 
                    After making the transfer, your funds will be credited to your BitChange account automatically.
                  </p>
                </div>
              </div>

              {/* Select Another Method Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedGateway("")}
              >
                Select another deposit method
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Other Payment Gateways Deposit Form */}
        {selectedGateway && selectedGateway !== "bank_transfer" && (
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
