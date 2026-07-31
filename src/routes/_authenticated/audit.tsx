import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { activitiesQuery } from "@/lib/queries";
import { motion } from "framer-motion";
import { relTime } from "@/lib/format";
import { GitCommit } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs · Vaultly" },
      { name: "description", content: "GitHub-style audit trail of every treasurer action." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(activitiesQuery),
  component: AuditPage,
});

function AuditPage() {
  useRealtime(["activities"], [["activities"]]);
  const { data } = useSuspenseQuery(activitiesQuery);
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A cryptographically ordered trail of every change.
        </p>
      </motion.div>

      <div className="glass-panel rounded-3xl p-6">
        <ol className="relative space-y-4 pl-6">
          <span className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
          {data.map((a, idx) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="relative"
            >
              <span className="absolute -left-6 top-2 grid h-4 w-4 place-items-center rounded-full bg-primary/20 text-primary">
                <GitCommit className="h-2.5 w-2.5" />
              </span>
              <div className="flex items-start justify-between gap-3 rounded-xl bg-background/30 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{a.description}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono uppercase">
                      {a.kind}
                    </span>
                    <span>·</span>
                    <span>by {a.actor}</span>
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {relTime(a.created_at)}
                </span>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
