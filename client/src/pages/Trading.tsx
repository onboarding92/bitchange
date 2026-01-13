import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PriceChartWithIndicators from "@/components/PriceChartWithIndicators";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TRADING_PAIRS = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", name: "Ethereum" },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", name: "Binance Coin" },
  { symbol: "ADAUSDT", base: "ADA", quote: "USDT", name: "Cardano" },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", name: "Solana" },
];

export default function Trading() {
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");

  // Get user wallets
  const { data: wallets } = trpc.wallet.list.useQuery();
  
  // Get order book (placeholder - you'll need to implement this endpoint)
  const { data: orderBook } = trpc.trading.orderBook.useQuery(
    { symbol: selectedPair.symbol },
    { refetchInterval: 5000 }
  );

  // Get recent trades
  const { data: recentTrades } = trpc.trading.recentTrades.useQuery(
    { symbol: selectedPair.symbol, limit: 20 },
    { refetchInterval: 3000 }
  );

  // Place order mutation
  const placeOrder = trpc.trading.placeOrder.useMutation({
    onSuccess: () => {
      toast.success("Order placed successfully");
      setPrice("");
      setAmount("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePlaceOrder = () => {
    if (!price || !amount) {
      toast.error("Please enter price and amount");
      return;
    }

    placeOrder.mutate({
      symbol: selectedPair.symbol,
      side,
      type: orderType,
      price: parseFloat(price),
      amount: parseFloat(amount),
    });
  };

  const baseBalance = wallets?.find((w) => w.asset === selectedPair.base)?.balance || 0;
  const quoteBalance = wallets?.find((w) => w.asset === selectedPair.quote)?.balance || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Trading</h1>
            <p className="text-slate-400">Professional cryptocurrency trading</p>
          </div>
          <Select
            value={selectedPair.symbol}
            onValueChange={(value) => {
              const pair = TRADING_PAIRS.find((p) => p.symbol === value);
              if (pair) setSelectedPair(pair);
            }}
          >
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADING_PAIRS.map((pair) => (
                <SelectItem key={pair.symbol} value={pair.symbol}>
                  {pair.base}/{pair.quote}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedPair.name} ({selectedPair.base}/{selectedPair.quote})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mock price data - in production, fetch from API */}
                <PriceChartWithIndicators 
                  symbol={selectedPair.symbol}
                  priceData={useMemo(() => {
                    // Generate mock data for demonstration
                    const now = Date.now();
                    return Array.from({ length: 100 }, (_, i) => ({
                      timestamp: now - (100 - i) * 3600000,
                      open: 43000 + Math.random() * 1000,
                      high: 43500 + Math.random() * 1000,
                      low: 42500 + Math.random() * 1000,
                      close: 43000 + Math.random() * 1000,
                      volume: Math.random() * 1000000
                    }));
                  }, [])}
                />
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="mt-6 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentTrades?.map((trade: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={trade.side === "buy" ? "text-green-400" : "text-red-400"}>
                        {trade.price.toFixed(2)}
                      </span>
                      <span className="text-slate-400">{trade.amount.toFixed(4)}</span>
                      <span className="text-slate-500">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Panel */}
          <div className="space-y-6">
            {/* Balances */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{selectedPair.base}:</span>
                  <span className="text-white font-medium">{baseBalance.toFixed(8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{selectedPair.quote}:</span>
                  <span className="text-white font-medium">{quoteBalance.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Form */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Place Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-green-600">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-red-600">
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div>
                  <Label className="text-slate-400">Order Type</Label>
                  <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderType === "limit" && (
                  <div>
                    <Label className="text-slate-400">Price ({selectedPair.quote})</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-slate-400">Amount ({selectedPair.base})</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex justify-between text-sm text-slate-400">
                  <span>Total:</span>
                  <span className="text-white">
                    {(parseFloat(price || "0") * parseFloat(amount || "0")).toFixed(2)}{" "}
                    {selectedPair.quote}
                  </span>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={placeOrder.isPending}
                  className={`w-full ${
                    side === "buy"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {placeOrder.isPending ? "Placing..." : `${side.toUpperCase()} ${selectedPair.base}`}
                </Button>
              </CardContent>
            </Card>

            {/* Order Book */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Order Book</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Asks (Sell orders) */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2">ASKS</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {orderBook?.asks?.slice(0, 10).map((order: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-red-400">{order.price.toFixed(2)}</span>
                          <span className="text-slate-400">{order.amount.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Spread */}
                  <div className="text-center py-2 border-y border-slate-700">
                    <Badge variant="outline" className="text-slate-400">
                      Spread: {orderBook?.spread?.toFixed(2) || "0.00"}
                    </Badge>
                  </div>

                  {/* Bids (Buy orders) */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2">BIDS</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {orderBook?.bids?.slice(0, 10).map((order: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-green-400">{order.price.toFixed(2)}</span>
                          <span className="text-slate-400">{order.amount.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
