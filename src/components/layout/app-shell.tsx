import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  CreditCard,
  FileBarChart,
  BarChart3,
  ScrollText,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  ChevronsLeft,
  Search,
  Moon,
  Sun,
  Command,
  Building2,
  Circle,
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { CommandPalette } from "@/components/command-palette";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: ArrowDownCircle },
  { to: "/expenses", label: "Expenses", icon: ArrowUpCircle },
  { to: "/residents", label: "Residents", icon: Users },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: UserCircle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useSession();
  const { role } = useAuthContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const signOut = async () => {
    localStorage.removeItem("demo_mode");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const current = nav.find((n) => pathname.startsWith(n.to));
  const canManage = role === "admin" || role === "treasurer";
  const visibleNav = nav.filter((item) => item.to !== "/settings" || canManage);

  return (
    <div className="relative min-h-dvh">
      <AnimatedBackground />

      {/* Sidebar (desktop) */}
      <aside
        className={`fixed inset-y-4 left-4 z-40 hidden flex-col transition-[width] duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-[248px]"}`}
      >
        <div className="flex h-full flex-col glass-panel rounded-3xl p-3">
          <div className="mb-4 flex items-center justify-between px-2 pt-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                <Building2 className="h-5 w-5" />
              </div>
              {!collapsed && <span className="font-semibold tracking-tight">Vaultly</span>}
            </Link>
            {!collapsed && (
              <button
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent/40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="mx-auto mb-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent/40"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none px-1">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-4.5 w-4.5 shrink-0 transition ${active ? "" : "group-hover:scale-110"}`}
                  />
                  {!collapsed && <span className="relative z-10">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={signOut}
            className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4.5 w-4.5" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] p-3 lg:hidden"
            >
              <div className="flex h-full flex-col glass-panel-strong rounded-3xl p-3">
                <div className="mb-4 flex items-center gap-2 px-2 pt-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="font-semibold tracking-tight">Vaultly</span>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none px-1">
                  {visibleNav.map((item) => {
                    const active = pathname === item.to || pathname.startsWith(item.to + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-gradient-brand text-primary-foreground shadow-glow"
                            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <button
                  onClick={signOut}
                  className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div
        className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-[100px]" : "lg:pl-[272px]"}`}
      >
        {/* Topbar */}
        <header className="sticky top-2 z-30 px-3 lg:px-6 lg:top-4">
          <div className="glass-panel-strong flex items-center gap-3 rounded-2xl px-3 py-2.5 lg:px-4">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent/40 lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <span>{user?.user_metadata?.society_name ?? "Society Dashboard"}</span>
              <span className="opacity-40">/</span>
              <span className="text-foreground">{current?.label ?? "Dashboard"}</span>
            </div>

            <button
              onClick={() => setPaletteOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-xl border border-glass-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-background/60"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search or run command…</span>
              <span className="hidden items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] sm:flex">
                <Command className="h-2.5 w-2.5" />K
              </span>
            </button>

            <LiveClock />

            <div className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
              <Circle className="h-1.5 w-1.5 fill-current" />
              Live
            </div>

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent/40"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent/40"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>

            <button
              aria-label="Profile"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent/40"
            >
              <UserCircle className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        <main className="px-3 py-6 lg:px-6 lg:py-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden items-center rounded-lg bg-background/40 px-3 py-1.5 font-mono text-xs text-muted-foreground md:flex">
      {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
}
