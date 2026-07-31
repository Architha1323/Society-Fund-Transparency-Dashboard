import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  FileUp,
  Filter,
  Plus,
  Search,
  Building2,
  Calendar,
  Receipt,
  Trash2,
  PencilLine,
  Eye,
} from "lucide-react";
import { expensesQuery } from "@/lib/queries";
import { inr, relTime } from "@/lib/format";
import { useRealtime } from "@/hooks/use-realtime";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  uploadExpenseInvoice,
} from "@/services/society";
import { appToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Vaultly" },
      { name: "description", content: "Society expenses tracked by category, vendor and budget." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(expensesQuery),
  component: ExpensesPage,
});

function ExpensesPage() {
  useRealtime(["expenses"], [["expenses"]]);
  const qc = useQueryClient();
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | {
    id: string;
    category: string;
    vendor: string;
    invoice_no: string | null;
    amount: number;
    budgeted: number | null;
    note: string | null;
    spent_at: string;
  }>(null);
  const [form, setForm] = useState({
    category: "Security",
    vendor: "",
    invoice_no: "",
    amount: "",
    budgeted: "",
    note: "",
    spent_at: new Date().toISOString(),
  });
  const [uploading, setUploading] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(expenses.map((e) => e.category)))],
    [expenses],
  );

  const filtered = useMemo(
    () =>
      expenses.filter((e) => {
        if (cat !== "All" && e.category !== cat) return false;
        if (!q) return true;
        const s = q.toLowerCase();
        return (
          e.vendor.toLowerCase().includes(s) ||
          e.category.toLowerCase().includes(s) ||
          (e.note ?? "").toLowerCase().includes(s)
        );
      }),
    [expenses, q, cat],
  );

  const totalMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    return expenses
      .filter((e) => new Date(e.spent_at) >= start)
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [expenses]);

  const budgetMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    return expenses
      .filter((e) => new Date(e.spent_at) >= start)
      .reduce((s, e) => s + Number(e.budgeted ?? e.amount), 0);
  }, [expenses]);

  const budgetPct = budgetMonth ? (totalMonth / budgetMonth) * 100 : 0;

  const resetForm = () => {
    setForm({
      category: "Security",
      vendor: "",
      invoice_no: "",
      amount: "",
      budgeted: "",
      note: "",
      spent_at: new Date().toISOString(),
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
      category: item.category,
      vendor: item.vendor,
      invoice_no: item.invoice_no ?? "",
      amount: String(item.amount),
      budgeted: String(item.budgeted ?? item.amount),
      note: item.note ?? "",
      spent_at: item.spent_at,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.vendor || !form.category || !form.amount) {
      appToast.error("Please fill the vendor, category, and amount.");
      return;
    }
    try {
      const payload = {
        category: form.category,
        vendor: form.vendor,
        invoice_no: form.invoice_no || null,
        amount: Number(form.amount),
        budgeted: Number(form.budgeted || form.amount),
        note: form.note || null,
        spent_at: form.spent_at,
      };
      if (editing) {
        await updateExpense(editing.id, payload as never);
        appToast.success("Expense updated");
      } else {
        await createExpense(payload as never);
        appToast.success("Expense added");
      }
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setOpen(false);
      resetForm();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not save expense.");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this expense entry?")) return;
    try {
      await deleteExpense(id);
      qc.invalidateQueries({ queryKey: ["expenses"] });
      appToast.success("Expense deleted");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not delete expense.");
    }
  };

  const uploadInvoice = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const id = editing?.id ?? crypto.randomUUID();
      const url = await uploadExpenseInvoice(file, id);
      appToast.success("Invoice uploaded");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Invoice upload failed.");
    } finally {
      setUploading(false);
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
          <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inr(totalMonth)} spent this month across{" "}
            {new Set(filtered.map((e) => e.category)).size} categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <UploadDrop />
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> New expense
          </button>
        </div>
      </motion.div>

      {/* Budget bar */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Monthly budget</span>
          <span className="text-muted-foreground">
            {inr(totalMonth)} <span className="opacity-60">of</span> {inr(budgetMonth)}
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, budgetPct)}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full rounded-full ${budgetPct > 90 ? "bg-danger" : budgetPct > 70 ? "bg-warning" : "bg-gradient-brand"}`}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor, category or note"
            className="w-full rounded-xl border border-glass-border bg-background/40 py-2 pl-10 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 8).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                cat === c
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
      </div>

      {/* Expense cards */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e, idx) => {
            const budget = Number(e.budgeted ?? e.amount);
            const pct = budget ? (Number(e.amount) / budget) * 100 : 0;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.02, 0.4) }}
                whileHover={{ y: -3 }}
                className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition hover:ring-glow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {e.category}
                    </div>
                    <div className="mt-1 text-base font-semibold">{e.vendor}</div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight">
                    {inr(Number(e.amount))}
                  </span>
                  <span className="text-xs text-muted-foreground">of {inr(budget)}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${pct > 100 ? "bg-danger" : pct > 80 ? "bg-warning" : "bg-gradient-brand"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="mt-3 line-clamp-1 text-xs text-muted-foreground">{e.note}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> {relTime(e.spent_at)}
                  </span>
                  {e.invoice_no && (
                    <span className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 font-mono">
                      <Receipt className="h-3 w-3" /> {e.invoice_no}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEdit(e)}
                    className="rounded-lg border border-glass-border bg-background/40 px-2.5 py-1.5 text-xs"
                  >
                    <PencilLine className="mr-1 inline h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className="rounded-lg border border-glass-border bg-background/40 px-2.5 py-1.5 text-xs"
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                    Delete
                  </button>
                  {e.invoice_url && (
                    <a
                      href={e.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-glass-border bg-background/40 px-2.5 py-1.5 text-xs"
                    >
                      <Eye className="mr-1 inline h-3.5 w-3.5" />
                      Preview
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
            <img
              src="/empty_expenses.png"
              alt="No expenses"
              className="relative z-10 w-full max-w-[280px] rounded-[2rem] border border-glass-border shadow-glass"
            />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">No expenses logged</h3>
          <p className="mt-2 text-muted-foreground max-w-sm">
            You haven't recorded any expenses matching these filters. Keep your society accounts up
            to date.
          </p>
          <button
            onClick={openCreate}
            className="mt-8 flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </motion.div>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl border border-glass-border bg-background/95">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit expense" : "Add expense"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              value={form.vendor}
              onChange={(e) => setForm((prev) => ({ ...prev, vendor: e.target.value }))}
              placeholder="Vendor name"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              value={form.invoice_no}
              onChange={(e) => setForm((prev) => ({ ...prev, invoice_no: e.target.value }))}
              placeholder="Invoice number"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.budgeted}
              onChange={(e) => setForm((prev) => ({ ...prev, budgeted: e.target.value }))}
              placeholder="Budget"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={form.spent_at.slice(0, 16)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, spent_at: new Date(e.target.value).toISOString() }))
              }
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm text-muted-foreground md:col-span-2">
              <FileUp className="h-4 w-4" />
              <span>{uploading ? "Uploading..." : "Upload invoice"}</span>
              <input type="file" className="sr-only" onChange={uploadInvoice} />
            </label>
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

function UploadDrop() {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      className={`glass-panel flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${drag ? "ring-glow border-primary" : ""}`}
    >
      <FileUp className="h-4 w-4" />
      Upload invoice
      <input type="file" className="sr-only" />
    </label>
  );
}
