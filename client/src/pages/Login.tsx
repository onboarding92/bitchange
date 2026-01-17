import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Shield } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.requires2FA && data.userId) {
        // User has 2FA enabled, show 2FA input
        setRequires2FA(true);
        setPendingUserId(data.userId);
        setIsLoading(false);
        toast.info("Please enter your 2FA code");
      } else if (data.success) {
        // No 2FA, login successful
        toast.success("Logged in successfully");
        setLocation("/");
        window.location.reload(); // Reload to update auth state
      }
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const verify2FAMutation = trpc.auth.verify2FA.useMutation({
    onSuccess: (data) => {
      if (data.usedBackupCode) {
        toast.success("Backup code used! Please generate new backup codes.");
      } else {
        toast.success("2FA verified successfully!");
      }
      setLocation("/");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Invalid 2FA code");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (requires2FA && pendingUserId) {
      // Verify 2FA code
      if (!twoFactorCode || twoFactorCode.length !== 6) {
        toast.error("Please enter a valid 6-digit code");
        setIsLoading(false);
        return;
      }
      verify2FAMutation.mutate({ userId: pendingUserId, token: twoFactorCode });
    } else {
      // Initial login
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">
            {requires2FA ? "Two-Factor Authentication" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {requires2FA 
              ? "Enter the 6-digit code from your authenticator app"
              : "Sign in to your BitChange account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!requires2FA ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-blue-200 text-sm">Your account is protected with 2FA</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-slate-200">Authentication Code</Label>
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    disabled={isLoading}
                    maxLength={6}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 text-center mt-2">
                    You can also use a backup recovery code
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode("");
                    setPendingUserId(null);
                    setIsLoading(false);
                  }}
                  className="w-full text-slate-400 hover:text-white"
                >
                  ← Back to login
                </Button>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : requires2FA ? "Verify Code" : "Sign In"}
            </Button>
          </form>
          {!requires2FA && (
            <>
              <div className="mt-4 text-center text-sm">
                <span className="text-slate-400">Don't have an account? </span>
                <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign up
                </Link>
              </div>
              <div className="mt-2 text-center text-sm">
                <Link href="/forgot-password" className="text-slate-400 hover:text-slate-300">
                  Forgot password?
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
