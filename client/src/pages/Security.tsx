import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, Smartphone, Key, CheckCircle, XCircle, Lock, Mail } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Security() {
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Get 2FA status
  const { data: twoFactorStatus, refetch } = trpc.auth.twoFactorStatus.useQuery();

  // Setup 2FA mutation
  const setup2FA = trpc.auth.setup2FA.useMutation({
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      toast.success("2FA setup initiated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Enable 2FA mutation
  const enable2FA = trpc.auth.enable2FA.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      toast.success("2FA enabled successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Disable 2FA mutation
  const disable2FA = trpc.auth.disable2FA.useMutation({
    onSuccess: () => {
      toast.success("2FA disabled successfully");
      setVerificationCode("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Change password mutation
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEnable2FA = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    enable2FA.mutate({ token: verificationCode });
  };

  const handleDisable2FA = () => {
    if (!verificationCode) {
      toast.error("Please enter verification code");
      return;
    }

    disable2FA.mutate({ password: currentPassword, twoFactorCode: verificationCode });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    changePassword.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Security Settings</h1>
          <p className="text-slate-400">Manage your account security and authentication</p>
        </div>

        {/* Security Overview */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12 text-white" />
              <div className="text-white">
                <h3 className="text-xl font-bold">Security Score</h3>
                <p className="text-blue-100">
                  {twoFactorStatus?.enabled ? "Strong" : "Medium"} - {twoFactorStatus?.enabled ? "2FA enabled" : "Enable 2FA for better security"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <span>Two-Factor Authentication (2FA)</span>
              </div>
              {twoFactorStatus?.enabled ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-400">
                  <XCircle className="w-4 h-4 mr-1" />
                  Disabled
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400">
              Add an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>

            {showBackupCodes ? (
              <div className="space-y-4">
                <Alert className="bg-green-900/20 border-green-500/50">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    <strong>2FA Enabled Successfully!</strong> Save these backup codes in a secure location.
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Backup Recovery Codes
                  </h4>
                  <p className="text-slate-400 text-sm">
                    Each code can be used once if you lose access to your authenticator app.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-slate-800 p-3 rounded border border-slate-700">
                        <code className="text-green-400 font-mono text-sm">{code}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowBackupCodes(false);
                    setVerificationCode("");
                    setQrCodeUrl("");
                    setSecret("");
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  I've Saved My Backup Codes
                </Button>
              </div>
            ) : !twoFactorStatus?.enabled ? (
              <div className="space-y-4">
                <Alert className="bg-blue-900/20 border-blue-500/50">
                  <AlertDescription className="text-blue-200">
                    <strong>Recommended:</strong> Enable 2FA to protect your account from unauthorized access.
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold">How to enable 2FA:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-400">
                    <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Click "Enable 2FA" to generate a QR code</li>
                    <li>Scan the QR code with your authenticator app</li>
                    <li>Enter the 6-digit code to verify</li>
                  </ol>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setup2FA.mutate()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Setup Two-Factor Authentication</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg flex justify-center">
                        {qrCodeUrl ? (
                          <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                        ) : (
                          <div className="text-center">
                            <div className="text-6xl mb-2">📱</div>
                            <p className="text-sm text-slate-600">Loading QR Code...</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-400">Manual Entry Code</Label>
                        <Input
                          value={secret || "Loading..."}
                          readOnly
                          className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
                        />
                        <p className="text-xs text-slate-500 mt-1">Use this code if you can't scan the QR code</p>
                      </div>

                      <div>
                        <Label className="text-slate-400">Verification Code</Label>
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="bg-slate-700 border-slate-600 text-white"
                          maxLength={6}
                        />
                      </div>

                      <Button
                        onClick={handleEnable2FA}
                        disabled={enable2FA.isPending || verificationCode.length !== 6}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {enable2FA.isPending ? "Verifying..." : "Verify and Enable"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-900/20 border-green-500/50">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    2FA is active. Your account is protected with two-factor authentication.
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                  <Label className="text-slate-400">Enter verification code to disable 2FA</Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="bg-slate-700 border-slate-600 text-white"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleDisable2FA}
                  disabled={disable2FA.isPending || verificationCode.length !== 6}
                  variant="destructive"
                  className="w-full"
                >
                  {disable2FA.isPending ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400">
              Update your password regularly to keep your account secure.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-400">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-400">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-400">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-400">
                <p className="font-semibold text-white mb-2">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changePassword.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {changePassword.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span>Security Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Use a strong, unique password</p>
                  <p className="text-sm">Never reuse passwords from other websites</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Enable 2FA</p>
                  <p className="text-sm">Add an extra layer of protection to your account</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Be cautious of phishing</p>
                  <p className="text-sm">Never share your password or 2FA codes with anyone</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Keep your email secure</p>
                  <p className="text-sm">Your email is the key to account recovery</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span>Active Sessions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div>
                  <p className="text-white font-medium">Current Session</p>
                  <p className="text-sm text-slate-400">Chrome on Windows • Last active: Now</p>
                </div>
                <Badge className="bg-green-600">Active</Badge>
              </div>
              <Button variant="outline" className="w-full border-slate-700 text-white">
                Logout All Other Sessions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
