import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react";

const SUPPORTED_ASSETS = ["BTC", "ETH", "BNB", "ADA", "SOL", "XRP", "DOT", "DOGE", "AVAX", "SHIB", "MATIC", "LTC", "LINK", "XLM"];

export default function Alerts() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    asset: "BTC",
    targetPrice: "",
    condition: "above" as "above" | "below",
  });

  const { data: alerts, refetch } = trpc.alerts.list.useQuery();
  const { data: prices } = trpc.prices.getAll.useQuery();

  const createAlert = trpc.alerts.create.useMutation({
    onSuccess: () => {
      toast.success("Price alert created!");
      setShowCreateForm(false);
      setFormData({ asset: "BTC", targetPrice: "", condition: "above" });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteAlert = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success("Alert deleted!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleAlert = trpc.alerts.toggle.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleCreateAlert = () => {
    if (!formData.targetPrice || parseFloat(formData.targetPrice) <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }

    createAlert.mutate({
      asset: formData.asset,
      targetPrice: parseFloat(formData.targetPrice),
      condition: formData.condition,
    });
  };

  const getCurrentPrice = (asset: string) => {
    const price = prices?.find(p => p.asset === asset);
    return price ? parseFloat(String(price.price)) : 0;
  };

  const activeAlerts = alerts?.filter((a: any) => a.isActive && !a.triggeredAt) || [];
  const triggeredAlerts = alerts?.filter((a: any) => a.triggeredAt) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Price Alerts</h1>
            <p className="text-muted-foreground">Get notified when crypto prices reach your target</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Create Alert Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Price Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Asset</Label>
                  <Select
                    value={formData.asset}
                    onValueChange={(value) => setFormData({ ...formData, asset: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_ASSETS.map(asset => (
                        <SelectItem key={asset} value={asset}>
                          {asset}
                          {prices && (
                            <span className="text-muted-foreground ml-2">
                              ${getCurrentPrice(asset).toLocaleString()}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: "above" | "below") => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Above
                        </div>
                      </SelectItem>
                      <SelectItem value="below">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Below
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Price (USD)</Label>
                  <Input
                    type="number"
                    placeholder="Enter target price"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateAlert} disabled={createAlert.isPending}>
                  {createAlert.isPending ? "Creating..." : "Create Alert"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>

              {formData.targetPrice && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    You'll be notified when <strong>{formData.asset}</strong> price goes{" "}
                    <strong>{formData.condition}</strong> <strong>${parseFloat(formData.targetPrice).toLocaleString()}</strong>
                    {prices && (
                      <span className="text-muted-foreground ml-2">
                        (Current: ${getCurrentPrice(formData.asset).toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts ({activeAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active alerts. Create one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert: any) => {
                  const currentPrice = getCurrentPrice(alert.asset);
                  const targetPrice = parseFloat(String(alert.targetPrice));
                  const percentDiff = currentPrice ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${alert.condition === "above" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          {alert.condition === "above" ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {alert.asset} {alert.condition === "above" ? "≥" : "≤"} ${targetPrice.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current: ${currentPrice.toLocaleString()} 
                            <span className={percentDiff >= 0 ? "text-green-500" : "text-red-500"}>
                              {" "}({percentDiff >= 0 ? "+" : ""}{percentDiff.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert.mutate({ id: alert.id, isActive: false })}
                        >
                          <BellOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert.mutate({ id: alert.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triggered Alerts History */}
        {triggeredAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Triggered Alerts History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {triggeredAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {alert.asset} {alert.condition === "above" ? "≥" : "≤"} ${parseFloat(String(alert.targetPrice)).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Triggered: {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAlert.mutate({ id: alert.id, isActive: true })}
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Reactivate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert.mutate({ id: alert.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
