import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";
import { societiesQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { appToast } from "@/components/ui/toast";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Vaultly" },
      { name: "description", content: "Society preferences, security and roles." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(societiesQuery),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: society } = useSuspenseQuery(societiesQuery);
  const [form, setForm] = useState({
    name: society?.name ?? "",
    registration_number: society?.registration_number ?? "",
    address: society?.address ?? "",
    financial_year: society?.financial_year ?? "FY 2026-27",
    maintenance_amount: String(society?.maintenance_amount ?? 4500),
    reserve_percentage: String(society?.reserve_percentage ?? 35),
    emergency_percentage: String(society?.emergency_percentage ?? 15),
    theme: society?.theme ?? "dark",
  });

  const save = async () => {
    try {
      const { error } = await (supabase as any).from("societies").upsert({
        id: society?.id ?? crypto.randomUUID(),
        ...form,
        maintenance_amount: Number(form.maintenance_amount),
        reserve_percentage: Number(form.reserve_percentage),
        emergency_percentage: Number(form.emergency_percentage),
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["societies"] });
      appToast.success("Society settings updated");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Could not update settings.");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the core society profile and financial assumptions.
        </p>
      </motion.div>

      <div className="glass-panel rounded-3xl p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Society name"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          />
          <input
            value={form.registration_number}
            onChange={(e) => setForm((prev) => ({ ...prev, registration_number: e.target.value }))}
            placeholder="Registration number"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          />
          <input
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Address"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.financial_year}
            onChange={(e) => setForm((prev) => ({ ...prev, financial_year: e.target.value }))}
            placeholder="Financial year"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.maintenance_amount}
            onChange={(e) => setForm((prev) => ({ ...prev, maintenance_amount: e.target.value }))}
            placeholder="Maintenance amount"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.reserve_percentage}
            onChange={(e) => setForm((prev) => ({ ...prev, reserve_percentage: e.target.value }))}
            placeholder="Reserve fund %"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.emergency_percentage}
            onChange={(e) => setForm((prev) => ({ ...prev, emergency_percentage: e.target.value }))}
            placeholder="Emergency fund %"
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          />
          <select
            value={form.theme}
            onChange={(e) => setForm((prev) => ({ ...prev, theme: e.target.value }))}
            className="rounded-xl border border-glass-border bg-background/40 px-3 py-2 text-sm"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
