import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Wallet, 
  Shield, 
  FileText, 
  BarChart3, 
  Settings,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  const features = [
    {
      icon: TrendingUp,
      title: "Trading",
      description: "Advanced charts with technical indicators (RSI, MACD, SMA)",
      link: "/trading",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: Wallet,
      title: "Wallet",
      description: "Manage deposits, withdrawals, and 10+ crypto assets",
      link: "/wallet",
      color: "from-green-600 to-green-700"
    },
    {
      icon: FileText,
      title: "KYC Verification",
      description: "Complete identity verification for higher limits",
      link: "/kyc",
      color: "from-purple-600 to-purple-700"
    },
    {
      icon: Shield,
      title: "Security",
      description: "2FA authentication and password management",
      link: "/security",
      color: "from-orange-600 to-orange-700"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track your portfolio performance and statistics",
      link: "/analytics",
      color: "from-pink-600 to-pink-700"
    },
    {
      icon: Settings,
      title: "Admin Dashboard",
      description: "Manage users, KYC reviews, and withdrawals",
      link: "/admin",
      color: "from-red-600 to-red-700"
    }
  ];

  const benefits = [
    "10+ supported cryptocurrencies",
    "Advanced trading charts with indicators",
    "Secure wallet management",
    "Two-factor authentication",
    "KYC verification system",
    "Professional admin dashboard"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">₿</div>
            <div>
              <h1 className="text-xl font-bold text-white">BitChange Pro</h1>
              <p className="text-xs text-slate-400">Professional Crypto Exchange</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-slate-400">Welcome, {user?.name || user?.email}</span>
                <Button variant="outline" onClick={logout} className="border-slate-700 text-white">
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <a href={getLoginUrl()}>Login</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Professional Cryptocurrency Exchange
        </h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Trade, manage, and secure your crypto assets with advanced tools and enterprise-grade security
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/trading">
              Start Trading <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-slate-700 text-white">
            <Link href="/wallet">View Wallet</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Platform Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.link}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Why Choose BitChange Pro?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-white">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">10+</div>
              <div className="text-slate-400">Cryptocurrencies</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-slate-400">Trading Available</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">100+</div>
              <div className="text-slate-400">Daily Users</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">2FA</div>
              <div className="text-slate-400">Security Enabled</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-slate-400">
          <p>&copy; 2024 BitChange Pro. Professional Cryptocurrency Exchange Platform.</p>
        </div>
      </footer>
    </div>
  );
}
