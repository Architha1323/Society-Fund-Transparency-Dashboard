import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Percent,
  PiggyBank,
  Gauge,
  Activity as ActivityIcon,
  Receipt,
  FileCheck,
  UserCog,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  activitiesQuery,
  expensesQuery,
  incomesQuery,
  residentsQuery,
  societiesQuery,
} from "@/lib/queries";
import { AnimatedCounter } from "@/components/animated-counter";
import { inrCompact, relTime } from "@/lib/format";
import { useRealtime } from "@/hooks/use-realtime";
import { useAuthContext } from "@/contexts/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Vaultly" },
      {
        name: "description",
        content: "Overview of society funds, income, expenses and live activity.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(residentsQuery),
      context.queryClient.ensureQueryData(incomesQuery),
      context.queryClient.ensureQueryData(expensesQuery),
      context.queryClient.ensureQueryData(activitiesQuery),
      context.queryClient.ensureQueryData(societiesQuery),
    ]);
  },
  component: Dashboard,
});

function Dashboard() {
  useRealtime(
    ["incomes", "expenses", "activities", "residents"],
    [["incomes"], ["expenses"], ["activities"], ["residents"]],
  );
  const { data: residents } = useSuspenseQuery(residentsQuery);
  const { data: incomes } = useSuspenseQuery(incomesQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: activities } = useSuspenseQuery(activitiesQuery);
  const { data: society } = useSuspenseQuery(societiesQuery);
  const { role } = useAuthContext();

  const stats = useMemo(() => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthIncome = incomes
      .filter((i) => new Date(i.paid_at) >= startMonth && i.status === "Paid")
      .reduce((s, i) => s + Number(i.amount), 0);
    const monthExpense = expenses
      .filter((e) => new Date(e.spent_at) >= startMonth)
      .reduce((s, e) => s + Number(e.amount), 0);
    const totalIn = incomes
      .filter((i) => i.status === "Paid")
      .reduce((s, i) => s + Number(i.amount), 0);
    const totalOut = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const baseReserve = Number(society?.maintenance_amount ?? 0) * residents.length * 2;
    const totalFunds = totalIn - totalOut + baseReserve;
    const pending = incomes
      .filter((i) => i.status !== "Paid")
      .reduce((s, i) => s + Number(i.amount), 0);
    const paidCount = incomes.filter(
      (i) => new Date(i.paid_at) >= startMonth && i.status === "Paid",
    ).length;
    const dueCount = residents.length;
    const collectionRate = dueCount ? (paidCount / dueCount) * 100 : 0;
    const monthBudget = expenses
      .filter((e) => new Date(e.spent_at) >= startMonth)
      .reduce((s, e) => s + Number(e.budgeted ?? e.amount), 0);
    const budgetUtil = monthBudget ? (monthExpense / monthBudget) * 100 : 0;
    return {
      totalFunds,
      monthIncome,
      monthExpense,
      reserve: Math.max((totalFunds * Number(society?.reserve_percentage ?? 35)) / 100, 300000),
      emergency: Math.max((totalFunds * Number(society?.emergency_percentage ?? 15)) / 100, 150000),
      pending,
      collectionRate,
      budgetUtil,
    };
  }, [incomes, expenses, residents, society]);

  const trend = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; ts: number }>();
    const label = (d: Date) => d.toLocaleDateString("en-IN", { month: "short" });
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, { month: label(d), income: 0, expense: 0, ts: d.getTime() });
    }
    incomes.forEach((i) => {
      const d = new Date(i.paid_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const row = map.get(key);
      if (row && i.status === "Paid") row.income += Number(i.amount);
    });
    expenses.forEach((e) => {
      const d = new Date(e.spent_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const row = map.get(key);
      if (row) row.expense += Number(e.amount);
    });
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [incomes, expenses]);

  const categoryData = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const map = new Map<string, number>();
    expenses
      .filter((e) => new Date(e.spent_at) >= start)
      .forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenses]);

  const pieColors = [
    "oklch(0.58 0.22 264)",
    "oklch(0.55 0.24 295)",
    "oklch(0.72 0.13 185)",
    "oklch(0.78 0.16 75)",
    "oklch(0.68 0.16 155)",
    "oklch(0.62 0.24 27)",
  ];

  const greeting = greetingText();

  const kpis = [
    {
      label: "Total Society Funds",
      value: stats.totalFunds,
      format: "inr-compact" as const,
      icon: Wallet,
      trend: 8.4,
      hue: "primary",
    },
    {
      label: "Monthly Income",
      value: stats.monthIncome,
      format: "inr-compact" as const,
      icon: TrendingUp,
      trend: 4.1,
      hue: "success",
    },
    {
      label: "Monthly Expenses",
      value: stats.monthExpense,
      format: "inr-compact" as const,
      icon: TrendingDown,
      trend: -2.3,
      hue: "danger",
    },
    {
      label: "Reserve Fund",
      value: stats.reserve,
      format: "inr-compact" as const,
      icon: ShieldCheck,
      trend: 1.2,
      hue: "secondary",
    },
    {
      label: "Emergency Fund",
      value: stats.emergency,
      format: "inr-compact" as const,
      icon: PiggyBank,
      trend: 0.6,
      hue: "accent",
    },
    {
      label: "Pending Dues",
      value: stats.pending,
      format: "inr-compact" as const,
      icon: AlertTriangle,
      trend: -12,
      hue: "warning",
    },
    {
      label: "Collection Rate",
      value: stats.collectionRate,
      format: "percent" as const,
      icon: Percent,
      trend: 3.5,
      hue: "success",
    },
    {
      label: "Budget Utilization",
      value: stats.budgetUtil,
      format: "percent" as const,
      icon: Gauge,
      trend: -1.8,
      hue: "primary",
    },
  ];

  // If member, render the member dashboard
  if (role !== "admin" && role !== "treasurer") {
    return <MemberDashboard society={society} residents={residents} incomes={incomes} />;
  }

  return (
    <div className="space-y-6">
      {/* Premium Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.5rem] glass-panel-strong border border-glass-border shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-brand opacity-5"></div>
        <div className="flex flex-col md:flex-row items-center justify-between p-8 lg:p-12 gap-8 relative z-10">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              Live Dashboard
            </p>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl leading-tight">
              {greeting}, <span className="text-gradient">Treasurer</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
              Here's a real-time overview of {society?.name ?? "your society"}'s finances today.
              Track collections, monitor cash flow, and ensure transparency.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="glass-panel rounded-2xl px-5 py-3 border border-glass-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Flats
                </div>
                <div className="text-2xl font-bold">
                  {residents.length}
                  <span className="text-sm text-muted-foreground font-medium"> / 120</span>
                </div>
              </div>
              <div className="glass-panel rounded-2xl px-5 py-3 border border-glass-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Financial Year
                </div>
                <div className="text-2xl font-bold">{society?.financial_year ?? "FY 2026-27"}</div>
              </div>
              <div className="glass-panel rounded-2xl px-5 py-3 border border-glass-border bg-success/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-success">
                  Net Cash Flow
                </div>
                <div className="text-2xl font-bold text-success">
                  {inrCompact(stats.monthIncome - stats.monthExpense)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-sm hidden md:block">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative aspect-square w-full"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full"></div>
              <img
                src="/hero_finance_dash.png"
                alt="Finance Dashboard"
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* KPI grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, idx) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group glass-panel relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:ring-glow hover:shadow-glass"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">
                  <AnimatedCounter value={k.value} format={k.format} />
                </div>
              </div>
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl bg-${k.hue}/15 text-${k.hue} shadow-inner`}
              >
                <k.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                  k.trend >= 0 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}
              >
                {k.trend >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(k.trend).toFixed(1)}%
              </span>
              <span className="text-muted-foreground font-medium">vs last month</span>
            </div>
            <Sparkline seed={idx} hue={k.hue} />
          </motion.div>
        ))}
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel-strong rounded-[2rem] p-6 lg:p-8 lg:col-span-2 border border-glass-border shadow-glass"
        >
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Cash flow overview</h3>
              <p className="text-sm text-muted-foreground">Income vs Expenses — last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium bg-background/50 px-3 py-1.5 rounded-full border border-glass-border">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />{" "}
                Income
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />{" "}
                Expense
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="incomeG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.58 0.22 264)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="oklch(0.58 0.22 264)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  opacity={0.6}
                  tickMargin={10}
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  opacity={0.6}
                  tickFormatter={(v) => inrCompact(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 500,
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                  }}
                  formatter={(v: number) => inrCompact(v)}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="oklch(0.58 0.22 264)"
                  strokeWidth={3}
                  fill="url(#incomeG)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="oklch(0.55 0.24 295)"
                  strokeWidth={3}
                  fill="url(#expenseG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-panel-strong rounded-[2rem] p-6 lg:p-8 border border-glass-border shadow-glass"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold">Expense distribution</h3>
            <p className="text-sm text-muted-foreground">Last 3 months</p>
          </div>
          <div className="h-[260px] relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  stroke="none"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => inrCompact(v)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="h-16 w-16 rounded-full bg-background/50 border border-glass-border shadow-inner backdrop-blur flex items-center justify-center">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Activity + Collection */}
      <section className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel rounded-[2rem] p-6 lg:p-8 lg:col-span-2 border border-glass-border shadow-glass"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Live Activity Feed</h3>
              <p className="text-sm text-muted-foreground">Realtime updates from your society</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1.5 text-xs font-semibold text-success shadow-[0_0_15px_var(--success)_inset]">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Streaming
            </div>
          </div>
          <ol className="relative space-y-4 pl-6">
            <span className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
            {activities.slice(0, 8).map((a, idx) => {
              const Icon =
                a.kind === "payment"
                  ? Receipt
                  : a.kind === "expense"
                    ? Wallet
                    : a.kind === "report"
                      ? FileCheck
                      : a.kind === "invoice"
                        ? Receipt
                        : UserCog;
              const hue =
                a.kind === "payment"
                  ? "success"
                  : a.kind === "expense"
                    ? "accent"
                    : a.kind === "report"
                      ? "primary"
                      : "secondary";
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="relative group"
                >
                  <span
                    className={`absolute -left-6 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-${hue}/20 text-${hue} ring-2 ring-background`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full bg-${hue}`} />
                  </span>
                  <div className="flex items-start justify-between gap-4 rounded-2xl px-4 py-3 transition-colors group-hover:bg-background/50 border border-transparent group-hover:border-glass-border">
                    <div className="flex items-start gap-4">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-${hue}/10 text-${hue} shadow-inner`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{a.description}</div>
                        <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                          by {a.actor}
                        </div>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground bg-background/50 px-2 py-1 rounded-md">
                      {relTime(a.created_at)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
            {activities.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
                  <ActivityIcon className="h-8 w-8" />
                </div>
                <p className="text-base font-medium">No activity yet</p>
                <p className="text-sm">When actions occur, they will appear here live.</p>
              </div>
            )}
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="glass-panel rounded-[2rem] p-6 lg:p-8 border border-glass-border shadow-glass flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold">Collection health</h3>
            <p className="text-sm text-muted-foreground">Current month status</p>
          </div>
          <div className="mt-4 flex-1 grid place-items-center">
            <RadialGauge value={stats.collectionRate} />
          </div>
          <div className="mt-8 space-y-3">
            {[
              {
                label: "Paid",
                val: incomes.filter((i) => i.status === "Paid").length,
                hue: "success",
              },
              {
                label: "Pending",
                val: incomes.filter((i) => i.status === "Pending").length,
                hue: "warning",
              },
              {
                label: "Overdue",
                val: incomes.filter((i) => i.status === "Overdue").length,
                hue: "danger",
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-3 text-sm border border-glass-border transition hover:bg-background/60"
              >
                <span className="flex items-center gap-3 font-medium">
                  <span
                    className={`h-2.5 w-2.5 rounded-full bg-${r.hue} shadow-[0_0_8px_var(--${r.hue})]`}
                  />
                  {r.label}
                </span>
                <span className="font-bold">{r.val}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// MEMBER DASHBOARD
function MemberDashboard({
  society,
  residents,
  incomes,
}: {
  society: any;
  residents: any[];
  incomes: any[];
}) {
  const greeting = greetingText();
  // Find current user's flat (in demo mode, let's just pick the first resident or a random one for demonstration)
  // In a real app, this would match user email to resident email.
  const myResident = residents[0];
  const myDues = incomes
    .filter((i) => i.resident_id === myResident?.id && i.status !== "Paid")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.5rem] glass-panel-strong border border-glass-border shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-brand opacity-5"></div>
        <div className="flex flex-col md:flex-row items-center justify-between p-8 lg:p-12 gap-8 relative z-10">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" />
              {society?.name ?? "Your Society"}
            </p>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl leading-tight">
              {greeting}, <span className="text-gradient">Member</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
              Welcome to your resident portal. Here you can view society updates and manage your
              maintenance dues securely.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="glass-panel rounded-2xl px-6 py-4 border border-glass-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  My Flat
                </div>
                <div className="text-2xl font-bold">{myResident?.flat_number ?? "A-101"}</div>
              </div>
              <div className="glass-panel rounded-2xl px-6 py-4 border border-glass-border bg-danger/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-danger">
                  Pending Dues
                </div>
                <div className="text-2xl font-bold text-danger">{inrCompact(myDues)}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-sm hidden md:block">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative aspect-square w-full"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full"></div>
              <img
                src="/hero_finance_dash.png"
                alt="Welcome"
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel rounded-[2rem] p-8 border border-glass-border shadow-glass"
        >
          <h3 className="text-xl font-bold mb-2">Notice Board</h3>
          <p className="text-sm text-muted-foreground mb-6">Recent announcements</p>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="font-medium">No new announcements.</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-panel rounded-[2rem] p-8 border border-glass-border shadow-glass"
        >
          <h3 className="text-xl font-bold mb-2">My Payments</h3>
          <p className="text-sm text-muted-foreground mb-6">Recent history</p>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="font-medium">Up to date!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Sparkline({ seed, hue }: { seed: number; hue: string }) {
  const points = Array.from({ length: 20 }).map((_, i) => {
    const y = 20 + Math.sin(i / 2 + seed) * 8 + ((i * (seed + 1)) % 5);
    return `${(i / 19) * 100},${y}`;
  });
  return (
    <svg viewBox="0 0 100 40" className={`mt-3 h-10 w-full text-${hue}/70`}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function RadialGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 70;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative">
      <svg width={180} height={180} className="-rotate-90">
        <circle cx={90} cy={90} r={r} strokeWidth={14} className="fill-none stroke-background/50" />
        <motion.circle
          cx={90}
          cy={90}
          r={r}
          strokeWidth={14}
          strokeLinecap="round"
          className="fill-none drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          stroke="url(#gaugeG)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="gaugeG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.58 0.22 264)" />
            <stop offset="100%" stopColor="oklch(0.55 0.24 295)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-4xl font-bold tracking-tight">
            <AnimatedCounter value={pct} format="percent" />
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">
            Collected
          </div>
        </div>
      </div>
    </div>
  );
}
