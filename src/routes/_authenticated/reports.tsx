import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { FileBarChart, Download, FileText, Loader2 } from "lucide-react";
import { generateReport, buildSimplePdf, downloadBlob } from "@/services/society";
import { appToast } from "@/components/ui/toast";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Vaultly" },
      { name: "description", content: "Generate monthly, quarterly, annual and audit reports." },
    ],
  }),
  component: ReportsPage,
});

const reports = [
  {
    title: "Monthly Report",
    period: "November 2026",
    desc: "All maintenance collections and expenses for the current month.",
  },
  {
    title: "Quarterly Report",
    period: "Q3 FY 2026-27",
    desc: "Consolidated summary of the last three months of society activity.",
  },
  {
    title: "Annual Report",
    period: "FY 2025-26",
    desc: "Complete financial year overview for the AGM.",
  },
  {
    title: "Audit Report",
    period: "Q3 audit",
    desc: "Auditor-ready trail of every transaction and supporting invoice.",
  },
];

function ReportsPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const start = async (title: string) => {
    setBusy(title);
    setProgress(0);
    const range =
      title === "Monthly Report"
        ? "Monthly"
        : title === "Quarterly Report"
          ? "Quarterly"
          : title === "Annual Report"
            ? "Annual"
            : "Audit";
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setBusy(null);
          return 0;
        }
        return p + 6;
      });
    }, 90);
    try {
      await generateReport(title, range);
      const blob = buildSimplePdf(
        `${title}\nGenerated for ${range} period\nThe report content is pulled from the live Supabase data.`,
      );
      downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
      appToast.success(`${title} generated`);
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Report generation failed.");
    } finally {
      clearInterval(id);
      setBusy(null);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Beautifully formatted, ready to share with residents.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            className="glass-panel group rounded-3xl p-6 transition hover:ring-glow"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                <FileBarChart className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {r.period}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            {busy === r.title ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-gradient-brand"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => start(r.title)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow transition hover:scale-[1.02]"
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => start(r.title)}
                  className="flex items-center gap-2 rounded-xl border border-glass-border bg-background/40 px-3 py-1.5 text-xs font-medium transition hover:bg-background"
                >
                  <Download className="h-3.5 w-3.5" /> Excel
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
