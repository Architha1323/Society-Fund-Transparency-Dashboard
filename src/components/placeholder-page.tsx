import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel-strong flex flex-col items-center gap-6 rounded-3xl p-12 text-center"
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow">
          <Icon className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold">Coming next</h2>
          <p className="text-sm text-muted-foreground">
            This module is scaffolded and ready to be fleshed out with the same premium polish as
            the rest of the dashboard.
          </p>
        </div>
        <ul className="grid gap-2 text-left text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-muted-foreground">
              <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
              {b}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
