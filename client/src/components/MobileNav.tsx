import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, X, Home, TrendingUp, Repeat, CreditCard, ArrowUpCircle, ArrowDownCircle, Bell, User, LifeBuoy, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

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
    { href: '/support', label: 'Support', icon: LifeBuoy },
  ];

  const adminNavItems = [
    { href: '/admin/support-tickets', label: 'Support Tickets', icon: LifeBuoy },
    { href: '/admin/panel', label: 'Admin Panel', icon: Shield },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border hover:bg-accent"
        aria-label="Toggle navigation menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-background border-r border-border z-40 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-4 p-6 mt-16 overflow-y-auto h-full">
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

            {user?.role === 'admin' && (
              <>
                <div className="my-2 border-t border-border" />
                <p className="px-2 text-xs font-semibold text-muted-foreground">ADMIN</p>
                {adminNavItems.map((item) => (
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
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
