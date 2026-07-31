import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";
import { notificationsQuery } from "@/lib/queries";
import { useRealtime } from "@/hooks/use-realtime";
import { markNotificationRead } from "@/services/society";
import { relTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Vaultly" },
      { name: "description", content: "Manage resident and treasurer notifications." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(notificationsQuery),
  component: NotificationsPage,
});

function NotificationsPage() {
  useRealtime(["notifications"], [["notifications"]]);
  const { data } = useSuspenseQuery(notificationsQuery);
  const unread = data.filter((item) => !item.read).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unread} unread updates from the society operations.
        </p>
      </motion.div>

      <div className="glass-panel rounded-3xl p-6">
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between rounded-2xl border border-glass-border bg-background/40 p-4"
            >
              <div className="flex gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.message}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {relTime(item.created_at)}
                  </div>
                </div>
              </div>
              {!item.read && (
                <button
                  onClick={() => markNotificationRead(item.id)}
                  className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
