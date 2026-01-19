import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Command } from "cmdk";
import {
  Search,
  Home,
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Bell,
  Briefcase,
  LifeBuoy,
  History,
  Users,
  Shield,
  BarChart3,
  Activity,
  Ticket,
  Settings,
  FileText,
  Gift,
  CreditCard,
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "main" | "admin" | "settings";
}

const searchItems: SearchItem[] = [
  // Main pages
  { id: "dashboard", title: "Dashboard", description: "Overview and quick actions", path: "/dashboard", icon: Home, category: "main" },
  { id: "convert", title: "Convert", description: "Exchange cryptocurrencies", path: "/convert", icon: TrendingUp, category: "main" },
  { id: "trading", title: "Trading", description: "Trade with advanced charts", path: "/trading", icon: BarChart3, category: "main" },
  { id: "deposit", title: "Deposit", description: "Add funds to your account", path: "/deposit", icon: ArrowDownToLine, category: "main" },
  { id: "withdrawal", title: "Withdrawal", description: "Withdraw funds", path: "/withdrawal", icon: ArrowUpFromLine, category: "main" },
  { id: "staking", title: "Staking", description: "Earn rewards by staking", path: "/staking", icon: Coins, category: "main" },
  { id: "alerts", title: "Price Alerts", description: "Set price notifications", path: "/alerts", icon: Bell, category: "main" },
  { id: "portfolio", title: "Portfolio", description: "View your assets", path: "/portfolio", icon: Briefcase, category: "main" },
  { id: "support", title: "Support", description: "Get help and support", path: "/support", icon: LifeBuoy, category: "main" },
  { id: "history", title: "Transaction History", description: "View all transactions", path: "/history", icon: History, category: "main" },
  { id: "kyc", title: "KYC Verification", description: "Verify your identity", path: "/kyc", icon: Shield, category: "main" },
  { id: "referrals", title: "Referral Program", description: "Invite friends and earn", path: "/referrals", icon: Gift, category: "main" },
  { id: "settings", title: "Account Settings", description: "Manage your account", path: "/settings", icon: Settings, category: "settings" },
  
  // Admin pages
  { id: "admin", title: "Admin Panel", description: "Manage staking plans", path: "/admin/panel", icon: Shield, category: "admin" },
  { id: "users", title: "Users Management", description: "Manage user accounts", path: "/admin/users", icon: Users, category: "admin" },
  { id: "deposits", title: "Deposit Management", description: "Review deposits", path: "/admin/deposits", icon: CreditCard, category: "admin" },
  { id: "staking-mgmt", title: "Staking Management", description: "Manage staking positions", path: "/admin/staking", icon: Coins, category: "admin" },
  { id: "kyc-review", title: "KYC Review", description: "Review KYC submissions", path: "/admin/kyc-review", icon: FileText, category: "admin" },
  { id: "logs", title: "Transaction Logs", description: "System transaction logs", path: "/admin/logs", icon: History, category: "admin" },
  { id: "analytics", title: "Analytics", description: "Platform analytics", path: "/admin/analytics", icon: BarChart3, category: "admin" },
  { id: "health", title: "System Health", description: "Monitor system status", path: "/admin/health", icon: Activity, category: "admin" },
  { id: "tickets", title: "Support Tickets", description: "Manage support tickets", path: "/admin/support-tickets", icon: Ticket, category: "admin" },
];

interface SearchCommandProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchCommand({ open: controlledOpen, onOpenChange }: SearchCommandProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Listen for Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch("");
    setLocation(path);
  };

  const filteredItems = search
    ? searchItems.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      )
    : searchItems;

  const mainItems = filteredItems.filter((item) => item.category === "main");
  const adminItems = filteredItems.filter((item) => item.category === "admin");
  const settingsItems = filteredItems.filter((item) => item.category === "settings");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-4">
        <Command className="rounded-lg border border-border bg-background shadow-2xl">
          <div className="flex items-center border-b border-border px-4">
            <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages and features..."
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none ml-auto hidden h-6 select-none items-center gap-1 rounded border border-border bg-muted px-2 font-mono text-xs font-medium opacity-100 sm:flex">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {mainItems.length > 0 && (
              <Command.Group heading="Main" className="mb-2">
                {mainItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.path)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {adminItems.length > 0 && (
              <Command.Group heading="Admin" className="mb-2">
                {adminItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.path)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {settingsItems.length > 0 && (
              <Command.Group heading="Settings">
                {settingsItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.path)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono font-medium">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono font-medium">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono font-medium">
                ⌘K
              </kbd>
              <span>Toggle</span>
            </div>
          </div>
        </Command>
      </div>

      {/* Click outside to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => setOpen(false)}
      />
    </div>
  );
}
