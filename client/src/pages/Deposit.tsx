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
import { ArrowDownRight, CheckCircle2, Clock, XCircle, Copy, ExternalLink, AlertCircle } from "lucide-react";
import { TrustSignals, TrustBanner } from "@/components/TrustSignals";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Active wallets only (11 wallets - unimplemented ones hidden)
const ACTIVE_CRYPTO_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum", network: "Ethereum" },
  { symbol: "USDT", name: "Tether", network: "Ethereum (ERC-20)" },
  { symbol: "USDT", name: "Tether", network: "BNB Chain (BEP-20)" },
  { symbol: "USDC", name: "USD Coin", network: "Ethereum (ERC-20)" },
  { symbol: "BNB", name: "Binance Coin", network: "BNB Chain" },
  { symbol: "LTC", name: "Litecoin", network: "Litecoin" },
  { symbol: "DOGE", name: "Dogecoin", network: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche", network: "Avalanche C-Chain" },
  { symbol: "MATIC", name: "Polygon", network: "Polygon" },
  { symbol: "LINK", name: "Chainlink", network: "Ethereum (ERC-20)" },
];

export default function Deposit() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [selectedNetwork, setSelectedNetwork] = useState("Bitcoin");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [amount, setAmount] = useState("");

  // Get hot wallet address for selected asset/network
  const { data: walletInfo, isLoading: loadingWallet } = trpc.deposit.getHotWalletAddress.useQuery(
    { asset: selectedAsset, network: selectedNetwork },
    { enabled: !!selectedAsset && !!selectedNetwork }
  );

  // Get payment gateways
  const { data: paymentGateways } = trpc.deposit.getPaymentGateways.useQuery();

  // Get deposit history
  const { data: deposits, refetch } = trpc.deposit.list.useQuery();

  // Generate QR code when wallet address changes
  useEffect(() => {
    if (walletInfo?.address) {
      QRCode.toDataURL(walletInfo.address, { width: 256, margin: 2 }).then(setQrCodeUrl);
    }
  }, [walletInfo]);

  // Auto-update network when asset changes
  useEffect(() => {
    const defaultNetwork = ACTIVE_CRYPTO_ASSETS.find(a => a.symbol === selectedAsset)?.network;
    if (defaultNetwork) {
      setSelectedNetwork(defaultNetwork);
    }
  }, [selectedAsset]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handlePaymentGateway = async (gatewayName: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const linkData = await trpc.deposit.getPaymentLink.query({
        gateway: gatewayName,
        asset: selectedAsset,
        amount,
        walletAddress: walletInfo?.address || "",
      });

      if (linkData?.url) {
        window.open(linkData.url, "_blank");
        toast.success(`Redirecting to ${gatewayName}...`);
      } else {
        toast.error("Payment gateway not configured");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate payment link");
    }
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
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Get unique assets for dropdown
  const uniqueAssets = Array.from(
    new Map(ACTIVE_CRYPTO_ASSETS.map(item => [item.symbol, item])).values()
  );

  // Get networks for selected asset
  const availableNetworks = ACTIVE_CRYPTO_ASSETS.filter(a => a.symbol === selectedAsset);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Trust Banner */}
        <TrustBanner />

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposit Funds</h1>
          <p className="text-muted-foreground mt-2">
            Deposit cryptocurrency to your BitChange account using our secure hot wallet system
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Deposit Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5" />
                  Crypto Deposit
                </CardTitle>
                <CardDescription>
                  Select cryptocurrency and network to get your deposit address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Asset Selection */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Select Cryptocurrency</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueAssets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            {asset.name} ({asset.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Select Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableNetworks.map((item, idx) => (
                          <SelectItem key={`${item.symbol}-${item.network}-${idx}`} value={item.network}>
                            {item.network}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Wallet Address Display */}
                {loadingWallet ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : walletInfo ? (
                  <div className="space-y-4">
                    {/* Reference ID Alert */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Important:</strong> Save your Reference ID below. Include it when contacting support about this deposit.
                      </AlertDescription>
                    </Alert>

                    {/* Reference ID */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                      <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                        🔑 Your Reference ID
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white rounded border font-mono text-sm">
                          {walletInfo.referenceId}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(walletInfo.referenceId, "Reference ID")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        This unique ID identifies your deposit. Save it for tracking purposes.
                      </p>
                    </div>

                    {/* Wallet Address */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Deposit Address</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={walletInfo.address}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(walletInfo.address, "Address")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* QR Code */}
                    {qrCodeUrl && (
                      <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg border">
                        <img src={qrCodeUrl} alt="Deposit QR Code" className="w-64 h-64" />
                        <p className="text-sm text-muted-foreground text-center">
                          Scan this QR code with your wallet app
                        </p>
                      </div>
                    )}

                    {/* Instructions */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Instructions:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                          <li>Copy the deposit address or scan the QR code</li>
                          <li>Send {selectedAsset} from your external wallet</li>
                          <li>Make sure you're using the correct network: <strong>{selectedNetwork}</strong></li>
                          <li>Save your Reference ID for tracking</li>
                          <li>Wait for blockchain confirmations (10-60 minutes)</li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    {/* Blockchain Explorer Links */}
                    <div className="flex flex-wrap gap-2">
                      {selectedNetwork.includes("Bitcoin") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://blockchair.com/bitcoin/address/${walletInfo.address}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Blockchair
                        </Button>
                      )}
                      {selectedNetwork.includes("Ethereum") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/address/${walletInfo.address}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Etherscan
                        </Button>
                      )}
                      {selectedNetwork.includes("BNB") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://bscscan.com/address/${walletInfo.address}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on BSCScan
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load wallet address. Please try again or contact support.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Payment Gateways */}
            {paymentGateways && paymentGateways.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Buy Crypto with Card</CardTitle>
                  <CardDescription>
                    Purchase cryptocurrency directly using credit/debit card or other payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Amount (USD)</Label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {paymentGateways.map((gateway: any) => (
                      <Button
                        key={gateway.id}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => handlePaymentGateway(gateway.name)}
                      >
                        <span className="font-semibold capitalize">{gateway.name}</span>
                        <span className="text-xs text-muted-foreground">Buy Now</span>
                      </Button>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Payment gateways charge their own fees (typically 3-5%). You'll be redirected to complete the purchase.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust Signals */}
            <TrustSignals />

            {/* Recent Deposits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deposits</CardTitle>
                <CardDescription>Your latest deposit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {deposits && deposits.length > 0 ? (
                  <div className="space-y-3">
                    {deposits.slice(0, 5).map((deposit: any) => (
                      <div
                        key={deposit.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(deposit.status)}
                          <div>
                            <p className="font-medium text-sm">
                              {deposit.amount} {deposit.asset}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deposit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(deposit.status)}`}>
                          {deposit.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No deposits yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If your deposit doesn't arrive within 2 hours:
                </p>
                <ol className="list-decimal list-inside text-sm space-y-2">
                  <li>Check the blockchain explorer</li>
                  <li>Verify you used the correct network</li>
                  <li>Contact support with your Reference ID</li>
                </ol>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/support"}>
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
