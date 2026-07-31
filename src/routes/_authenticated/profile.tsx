import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { motion } from "framer-motion";
import { Mail, Shield, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Vaultly" },
      { name: "description", content: "Your treasurer profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const email = user?.email ?? "";
  const name = user?.user_metadata?.full_name ?? email.split("@")[0] ?? "Treasurer";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account and role in Green Valley Residency.
        </p>
      </motion.div>

      <div className="glass-panel-strong flex flex-wrap items-center gap-6 rounded-3xl p-8">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand text-2xl font-semibold text-primary-foreground shadow-glow">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-semibold">{name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> {email || "—"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/15 px-3 py-0.5 text-xs font-medium text-primary">
              Treasurer
            </span>
            <span className="rounded-full bg-success/15 px-3 py-0.5 text-xs font-medium text-success">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" /> Account
          </div>
          <div className="grid gap-2 text-sm">
            <Row label="Full name" value={name} />
            <Row label="Email" value={email || "—"} />
            <Row label="Society" value="Green Valley Residency" />
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4" /> Security
          </div>
          <div className="grid gap-2 text-sm">
            <Row label="Two-factor" value="Enabled" />
            <Row label="Sessions" value="1 active" />
            <Row label="Last login" value="Just now" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/30 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
