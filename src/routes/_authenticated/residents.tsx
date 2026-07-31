import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Phone, Search, MapPin, ArrowUpRight, Trash2, PencilLine, Plus } from "lucide-react";
import { incomesQuery, residentsQuery } from "@/lib/queries";
import { inr } from "@/lib/format";
import { useRealtime } from "@/hooks/use-realtime";
import { createResident, deleteResident, updateResident } from "@/services/society";
import { appToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/residents")({
  head: () => ({
    meta: [
      { title: "Residents · Vaultly" },
      {
        name: "description",
        content: "Every flat and resident of Green Valley Residency with payment status.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(residentsQuery),
      context.queryClient.ensureQueryData(incomesQuery),
    ]);
  },
  component: ResidentsPage,
});

function ResidentsPage() {
  useRealtime(["residents", "incomes"], [["residents"], ["incomes"]]);
  const qc = useQueryClient();
  const { data: residents } = useSuspenseQuery(residentsQuery);
  const { data: incomes } = useSuspenseQuery(incomesQuery);
  const [q, setQ] = useState("");
  const [tower, setTower] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | {
    id: string;
    name: string;
    flat_number: string;
    tower: string;
    contact: string | null;
    monthly_maintenance: number;
  }>(null);
  const [form, setForm] = useState({
    name: "",
    flat_number: "",
    tower: "Tower A",
    contact: "",
    monthly_maintenance: "4500",
  });

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const withStatus = useMemo(
    () =>
      residents.map((r) => {
        const monthly = incomes.find(
          (i) => i.resident_id === r.id && new Date(i.paid_at) >= startMonth,
        );
        const outstanding = incomes
          .filter((i) => i.resident_id === r.id && i.status !== "Paid")
          .reduce((s, i) => s + Number(i.amount), 0);
        const status: "Paid" | "Pending" | "Overdue" =
          monthly?.status === "Paid"
            ? "Paid"
            : outstanding > Number(r.monthly_maintenance)
              ? "Overdue"
              : "Pending";
        return { ...r, status, outstanding };
      }),
    [residents, incomes, startMonth],
  );

  const towers = useMemo(
    () => ["All", ...Array.from(new Set(residents.map((r) => r.tower)))],
    [residents],
  );

  const filtered = withStatus.filter((r) => {
    if (tower !== "All" && r.tower !== tower) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return r.name.toLowerCase().includes(s) || r.flat_number.toLowerCase().includes(s);
  });

  const resetForm = () => {
    setForm({
      name: "",
      flat_number: "",
      tower: "Tower A",
      contact: "",
      monthly_maintenance: "4500",
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item: (typeof residents)[number]) => {
    setEditing(item as any);
    setForm({
      name: item.name,
      flat_number: item.flat_number,
      tower: item.tower,
      contact: item.contact ?? "",
      monthly_maintenance: String(item.monthly_maintenance),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.flat_number) {
      appToast.error("Please fill the resident name and flat number.");
      return;
    }
    try {
      const payload = {
        name: form.name,
        flat_number: form.flat_number,
        tower: form.tower,
        contact: form.contact || null,
        monthly_maintenance: Number(form.monthly_maintenance || 0),
        ...(editing
          ? {}
          : {
              owner_type: "Owner",
              avatar_hue: Math.floor(Math.random() * 360),
              join_date: new Date().toISOString(),
            }),
      };
      if (editing) {
        await updateResident(editing.id, payload as never);
        appToast.success("Resident updated");
      } else {
        await createResident(payload as never);
        appToast.success("Resident added");
      }
      qc.invalidateQueries({ queryKey: ["residents"] });
      setOpen(false);
      resetForm();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not save resident.");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this resident?")) return;
    try {
      await deleteResident(id);
      qc.invalidateQueries({ queryKey: ["residents"] });
      appToast.success("Resident deleted");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not delete resident.");
    }
  };

  const stats = {
    paid: withStatus.filter((r) => r.status === "Paid").length,
    pending: withStatus.filter((r) => r.status === "Pending").length,
    overdue: withStatus.filter((r) => r.status === "Overdue").length,
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Residents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {residents.length} residents across {towers.length - 1} towers
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-brand px-3 py-2 text-xs font-medium text-primary-foreground shadow-glow"
          >
            <Plus className="h-3.5 w-3.5" /> Add resident
          </button>
          <MiniStat label="Paid" value={stats.paid} hue="success" />
          <MiniStat label="Pending" value={stats.pending} hue="warning" />
          <MiniStat label="Overdue" value={stats.overdue} hue="danger" />
        </div>
      </motion.div>

      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or flat"
            className="w-full rounded-xl border border-glass-border bg-background/40 py-2 pl-10 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {towers.map((t) => (
            <button
              key={t}
              onClick={() => setTower(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tower === t
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.02, 0.4) }}
              whileHover={{ y: -3 }}
              className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition hover:ring-glow"
            >
              <div className="relative flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{r.name}</div>
                    <StatusChip status={r.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.flat_number} · {r.tower}
                  </div>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-background/40 px-3 py-2">
                  <div className="text-muted-foreground">Monthly</div>
                  <div className="font-semibold">{inr(Number(r.monthly_maintenance))}</div>
                </div>
                <div className="rounded-xl bg-background/40 px-3 py-2">
                  <div className="text-muted-foreground">Outstanding</div>
                  <div className={`font-semibold ${r.outstanding > 0 ? "text-danger" : ""}`}>
                    {inr(r.outstanding)}
                  </div>
                </div>
              </div>
              <div className="relative mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> {r.contact ?? "—"}
                </span>
                <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-lg border border-glass-border bg-background/40 px-2 py-1"
                  >
                    <PencilLine className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-lg border border-glass-border bg-background/40 px-2 py-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 flex flex-col items-center justify-center text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
            <img
              src="/empty_residents.png"
              alt="No residents"
              className="relative z-10 w-full max-w-sm rounded-[2.5rem] border border-glass-border shadow-glass"
            />
          </div>
          <h3 className="mt-10 text-3xl font-bold tracking-tight">No residents found</h3>
          <p className="mt-3 text-lg text-muted-foreground max-w-md">
            Get started by adding your first flat owner or tenant to the society network.
          </p>
          <button
            onClick={openCreate}
            className="mt-8 flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition"
          >
            <Plus className="h-5 w-5" /> Add Resident
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
            <DialogTitle>{editing ? "Edit resident" : "Add resident"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
              value={form.tower}
              onChange={(e) => setForm((prev) => ({ ...prev, tower: e.target.value }))}
              placeholder="Tower"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              value={form.contact}
              onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
              placeholder="Contact number"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.monthly_maintenance}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, monthly_maintenance: e.target.value }))
              }
              placeholder="Maintenance amount"
              className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
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

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-success/15 text-success",
    Pending: "bg-warning/15 text-warning",
    Overdue: "bg-danger/15 text-danger",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function MiniStat({ label, value, hue }: { label: string; value: number; hue: string }) {
  return (
    <div className={`glass-panel rounded-xl px-3 py-2 text-xs`}>
      <div className="text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold text-${hue}`}>{value}</div>
    </div>
  );
}
