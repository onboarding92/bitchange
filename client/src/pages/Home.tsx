import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Wallet, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-7xl">
              Trade, Stake, and Grow
              <span className="block text-gradient mt-2">Your Crypto Portfolio</span>
            </h1>
            <p className="mb-10 text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional cryptocurrency exchange with advanced features
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gradient-primary text-lg px-8 py-6">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gradient-primary text-lg px-8 py-6">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-24 bg-card/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass border-primary/20">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure</h3>
                <p className="text-muted-foreground">Bank-level security for your assets</p>
              </CardContent>
            </Card>
            <Card className="glass border-accent/20">
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Advanced Trading</h3>
                <p className="text-muted-foreground">Professional trading tools</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/20">
              <CardContent className="pt-6">
                <Wallet className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Multi-Currency</h3>
                <p className="text-muted-foreground">15+ cryptocurrencies supported</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
