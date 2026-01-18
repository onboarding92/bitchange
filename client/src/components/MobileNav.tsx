import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, X, Home, TrendingUp, Repeat, CreditCard, ArrowUpCircle, ArrowDownCircle, Bell, User } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: TrendingUp },
    { href: '/convert', label: 'Convert', icon: Repeat },
    { href: '/trading', label: 'Trading', icon: TrendingUp },
    { href: '/deposit', label: 'Deposit', icon: ArrowDownCircle },
    { href: '/withdrawal', label: 'Withdrawal', icon: ArrowUpCircle },
    { href: '/staking', label: 'Staking', icon: CreditCard },
    { href: '/price-alerts', label: 'Price Alerts', icon: Bell },
    { href: '/portfolio', label: 'Portfolio', icon: User },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border hover:bg-accent"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[350px]">
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex items-center gap-2 px-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">BC</span>
            </div>
            <div>
              <p className="font-semibold">BitChange Pro</p>
              <p className="text-xs text-muted-foreground">Professional Exchange</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
