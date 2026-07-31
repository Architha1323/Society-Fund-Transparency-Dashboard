import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Download, Filter, Plus, Search, ArrowUpRight, Trash2, PencilLine } from "lucide-react";
import { incomesQuery, residentsQuery } from "@/lib/queries";
import { inr, relTime } from "@/lib/format";
import { useRealtime } from "@/hooks/use-realtime";
import { createIncome, deleteIncome, updateIncome } from "@/services/society";
import { appToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/income")({
  head: () => ({
    meta: [
      { title: "Income · Vaultly" },
      {
        name: "description",
        content: "All maintenance and society income, searchable and filterable.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(incomesQuery),
      context.queryClient.ensureQueryData(residentsQuery),
    ]);
  },
  component: IncomePage,
});

const modes = ["All", "UPI", "Bank Transfer", "Cash", "Cheque"];
const statuses = ["All", "Paid", "Pending", "Overdue"];

function IncomePage() {
  useRealtime(["incomes"], [["incomes"]]);
  const qc = useQueryClient();
  const { data: incomes } = useSuspenseQuery(incomesQuery);
  const { data: residents } = useSuspenseQuery(residentsQuery);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("All");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | {
    id: string;
    resident_name: string;
    flat_number: string;
    amount: number;
    mode: string;
    status: string;
    txn_id: string | null;
    note: string | null;
    paid_at: string;
  }>(null);
  const [form, setForm] = useState({
    resident_name: "",
    flat_number: "",
    amount: "",
    mode: "UPI",
    status: "Paid",
    txn_id: "",
    note: "",
    paid_at: new Date().toISOString(),
  });

  const filtered = useMemo(
    () =>
      incomes.filter((i) => {
        if (mode !== "All" && i.mode !== mode) return false;
        if (status !== "All" && i.status !== status) return false;
        if (!q) return true;
        const s = q.toLowerCase();
        return (
          i.resident_name.toLowerCase().includes(s) ||
          i.flat_number.toLowerCase().includes(s) ||
          (i.txn_id ?? "").toLowerCase().includes(s)
        );
      }),
    [incomes, q, mode, status],
  );

  const total = filtered
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + Number(i.amount), 0);

  const resetForm = () => {
    setForm({
      resident_name: "",
      flat_number: "",
      amount: "",
      mode: "UPI",
      status: "Paid",
      txn_id: "",
      note: "",
      paid_at: new Date().toISOString(),
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      resident_name: item.resident_name,
      flat_number: item.flat_number,
      amount: String(item.amount),
      mode: item.mode,
      status: item.status,
      txn_id: item.txn_id ?? "",
      note: item.note ?? "",
      paid_at: item.paid_at,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.resident_name || !form.flat_number || !form.amount) {
      appToast.error("Please fill the resident, flat number, and amount.");
      return;
    }
    try {
      const payload = {
        resident_name: form.resident_name,
        flat_number: form.flat_number,
        amount: Number(form.amount),
        mode: form.mode,
        status: form.status,
        txn_id: form.txn_id || null,
        note: form.note || null,
        paid_at: form.paid_at,
        resident_id:
          residents.find((resident) => resident.flat_number === form.flat_number)?.id ?? null,
      };
      if (editing) {
        await updateIncome(editing.id, payload as never);
        appToast.success("Income updated");
      } else {
        await createIncome(payload as never);
        appToast.success("Income added");
      }
      qc.invalidateQueries({ queryKey: ["incomes"] });
      setOpen(false);
      resetForm();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not save income.");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this income entry?")) return;
    try {
      await deleteIncome(id);
      qc.invalidateQueries({ queryKey: ["incomes"] });
      appToast.success("Income deleted");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not delete income.");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} transactions · {inr(total)} collected
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="glass-panel flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition hover:ring-glow">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Add income
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search resident, flat or txn ID"
            className="w-full rounded-xl border border-glass-border bg-background/40 py-2 pl-10 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <Select value={mode} onChange={setMode} options={modes} label="Mode" />
        <Select value={status} onChange={setStatus} options={statuses} label="Status" />
        <button className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> More filters
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background/50 backdrop-blur">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Resident</th>
                <th className="px-4 py-3 font-medium">Flat</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Txn ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.slice(0, 60).map((i, idx) => (
                <motion.tr
                  key={i.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.015, 0.6) }}
                  className="group transition hover:bg-accent/30"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{i.resident_name}</div>
                        <div className="text-xs text-muted-foreground">{i.note}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{i.flat_number}</td>
                  <td className="px-4 py-3 font-semibold">{inr(Number(i.amount))}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted/60 px-2 py-1 text-xs">{i.mode}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {i.txn_id ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={i.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{relTime(i.paid_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(i)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(i.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
              <img
                src="/empty_income.png"
                alt="No income"
                className="relative z-10 w-full max-w-[280px] rounded-[2rem] border border-glass-border shadow-glass"
              />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">No income records found</h3>
            <p className="mt-2 text-muted-foreground max-w-sm">
              There are no transactions matching your current filters. Adjust your search or add a
              new record.
            </p>
            <button
              onClick={openCreate}
              className="mt-8 flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition"
            >
              <Plus className="h-4 w-4" /> Add Income
            </button>
          </motion.div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl border border-glass-border bg-background/95">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit income" : "Add income"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.resident_name}
              onChange={(e) => setForm((prev) => ({ ...prev, resident_name: e.target.value }))}
              placeholder="Resident name"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              value={form.flat_number}
              onChange={(e) => setForm((prev) => ({ ...prev, flat_number: e.target.value }))}
              placeholder="Flat number"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <select
              value={form.mode}
              onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            >
              {modes
                .filter((m) => m !== "All")
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            >
              {statuses
                .filter((s) => s !== "All")
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
            <input
              value={form.txn_id}
              onChange={(e) => setForm((prev) => ({ ...prev, txn_id: e.target.value }))}
              placeholder="Transaction ID"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={form.paid_at.slice(0, 16)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, paid_at: new Date(e.target.value).toISOString() }))
              }
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Note"
              className="md:col-span-2 rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-glass-border px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-xl bg-gradient-brand px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-background text-foreground">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-success/15 text-success",
    Pending: "bg-warning/15 text-warning",
    Overdue: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {status}
    </span>
  );
}
