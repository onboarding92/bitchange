import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { TRADING_PAIRS } from "@shared/const";

export default function Trading() {
  const { user } = useAuth();
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");

  const { data: orderBook, refetch: refetchOrderBook } = trpc.trading.orderBook.useQuery(
    { pair: selectedPair },
    { refetchInterval: 5000 }
  );

  const { data: myOrders, refetch: refetchMyOrders } = trpc.trading.myOrders.useQuery();
  const { data: myTrades } = trpc.trading.myTrades.useQuery();

  const placeOrder = trpc.trading.placeLimitOrder.useMutation({
    onSuccess: () => {
      toast.success("Order placed successfully!");
      setPrice("");
      setAmount("");
      refetchOrderBook();
      refetchMyOrders();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelOrder = trpc.trading.cancelOrder.useMutation({
    onSuccess: () => {
      toast.success("Order cancelled!");
      refetchOrderBook();
      refetchMyOrders();
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
      pair: selectedPair,
      side: orderSide,
      price,
      amount,
    });
  };

  const openOrders = myOrders?.filter(o => o.status === "open") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trading</h1>
            <p className="text-muted-foreground">Trade cryptocurrencies with limit orders</p>
          </div>
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADING_PAIRS.map(pair => (
                <SelectItem key={pair} value={pair}>{pair}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Book */}
          <Card className="glass lg:col-span-1">
            <CardHeader>
              <CardTitle>Order Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Asks (Sell Orders) */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Asks</div>
                  <div className="space-y-1">
                    {orderBook?.asks.slice(0, 10).reverse().map((ask, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-red-500">{ask.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{ask.amount.toFixed(8)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spread */}
                <div className="border-t border-b border-border py-2 text-center">
                  <span className="text-lg font-bold">
                    {orderBook?.bids[0] ? orderBook.bids[0].price.toFixed(2) : "---"}
                  </span>
                </div>

                {/* Bids (Buy Orders) */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Bids</div>
                  <div className="space-y-1">
                    {orderBook?.bids.slice(0, 10).map((bid, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-green-500">{bid.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{bid.amount.toFixed(8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Place Order */}
          <Card className="glass lg:col-span-2">
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={orderSide} onValueChange={(v) => setOrderSide(v as "buy" | "sell")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20">
                    <TrendingUp className="mr-2 h-4 w-4" /> Buy
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20">
                    <TrendingDown className="mr-2 h-4 w-4" /> Sell
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4 mt-6">
                  <div>
                    <Label>Price (USDT)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Amount ({selectedPair.split("/")[0]})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Total: {price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00"} USDT
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handlePlaceOrder}
                      disabled={placeOrder.isPending}
                    >
                      {placeOrder.isPending ? "Placing..." : "Buy " + selectedPair.split("/")[0]}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4 mt-6">
                  <div>
                    <Label>Price (USDT)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Amount ({selectedPair.split("/")[0]})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Total: {price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : "0.00"} USDT
                    </div>
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={handlePlaceOrder}
                      disabled={placeOrder.isPending}
                    >
                      {placeOrder.isPending ? "Placing..." : "Sell " + selectedPair.split("/")[0]}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Open Orders */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Open Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {openOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No open orders</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Pair</th>
                      <th className="text-left py-3 px-4">Side</th>
                      <th className="text-right py-3 px-4">Price</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-right py-3 px-4">Filled</th>
                      <th className="text-right py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50">
                        <td className="py-3 px-4">{order.pair}</td>
                        <td className="py-3 px-4">
                          <span className={order.side === "buy" ? "text-green-500" : "text-red-500"}>
                            {order.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">{parseFloat(order.price).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{parseFloat(order.amount).toFixed(8)}</td>
                        <td className="text-right py-3 px-4">{parseFloat(order.filled).toFixed(8)}</td>
                        <td className="text-right py-3 px-4 capitalize">{order.status}</td>
                        <td className="text-right py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelOrder.mutate({ id: order.id })}
                            disabled={cancelOrder.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade History */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>My Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {!myTrades || myTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No trades yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Pair</th>
                      <th className="text-right py-3 px-4">Price</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-right py-3 px-4">Total</th>
                      <th className="text-right py-3 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50">
                        <td className="py-3 px-4">{trade.pair}</td>
                        <td className="text-right py-3 px-4">{parseFloat(trade.price).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{parseFloat(trade.amount).toFixed(8)}</td>
                        <td className="text-right py-3 px-4">
                          {(parseFloat(trade.price) * parseFloat(trade.amount)).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                          {new Date(trade.createdAt).toLocaleString()}
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
