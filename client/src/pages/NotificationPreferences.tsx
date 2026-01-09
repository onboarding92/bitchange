import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, Check } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function NotificationPreferences() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [depositEnabled, setDepositEnabled] = useState(true);
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true);
  const [tradeEnabled, setTradeEnabled] = useState(true);
  const [kycEnabled, setKycEnabled] = useState(true);
  const [systemEnabled, setSystemEnabled] = useState(true);

  const { data: prefs, isLoading } = trpc.notification.getPreferences.useQuery();

  const updatePrefs = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (prefs) {
      setEmailEnabled(prefs.emailEnabled);
      setInAppEnabled(prefs.inAppEnabled);
      setPushEnabled(prefs.pushEnabled);
      setDepositEnabled(prefs.depositEnabled);
      setWithdrawalEnabled(prefs.withdrawalEnabled);
      setTradeEnabled(prefs.tradeEnabled);
      setKycEnabled(prefs.kycEnabled);
      setSystemEnabled(prefs.systemEnabled);
    }
  }, [prefs]);

  const handleSave = () => {
    updatePrefs.mutate({
      emailEnabled,
      inAppEnabled,
      pushEnabled,
      depositEnabled,
      withdrawalEnabled,
      tradeEnabled,
      kycEnabled,
      systemEnabled,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
          <div className="text-center text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Notification Preferences</h1>
          </div>

          <Card className="bg-slate-800/90 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Notification Channels</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/30 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <Label className="text-white font-semibold">In-App Notifications</Label>
                    <p className="text-slate-400 text-sm">Receive notifications within the platform</p>
                  </div>
                </div>
                <Switch
                  checked={inAppEnabled}
                  onCheckedChange={setInAppEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/30 rounded-lg">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <Label className="text-white font-semibold">Email Notifications</Label>
                    <p className="text-slate-400 text-sm">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/30 rounded-lg">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <Label className="text-white font-semibold">Push Notifications</Label>
                    <p className="text-slate-400 text-sm">Receive push notifications on your device</p>
                  </div>
                </div>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={setPushEnabled}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/90 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Notification Types</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Deposit Notifications</Label>
                  <p className="text-slate-400 text-sm">Get notified when deposits are completed</p>
                </div>
                <Switch
                  checked={depositEnabled}
                  onCheckedChange={setDepositEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Withdrawal Notifications</Label>
                  <p className="text-slate-400 text-sm">Get notified about withdrawal status changes</p>
                </div>
                <Switch
                  checked={withdrawalEnabled}
                  onCheckedChange={setWithdrawalEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Trade Notifications</Label>
                  <p className="text-slate-400 text-sm">Get notified when your orders are filled</p>
                </div>
                <Switch
                  checked={tradeEnabled}
                  onCheckedChange={setTradeEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-white">KYC Notifications</Label>
                  <p className="text-slate-400 text-sm">Get notified about KYC verification updates</p>
                </div>
                <Switch
                  checked={kycEnabled}
                  onCheckedChange={setKycEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-white">System Notifications</Label>
                  <p className="text-slate-400 text-sm">Get notified about system updates and announcements</p>
                </div>
                <Switch
                  checked={systemEnabled}
                  onCheckedChange={setSystemEnabled}
                />
              </div>
            </div>
          </Card>

          <Button
            onClick={handleSave}
            disabled={updatePrefs.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
          >
            <Check className="w-5 h-5 mr-2" />
            {updatePrefs.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
