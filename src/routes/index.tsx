import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vaultly — Smart Society Management" },
      {
        name: "description",
        content:
          "Real-time visibility into society funds. Track income, expenses, residents and reports.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

const BACKGROUNDS = ["/bg_slide_1.png", "/bg_slide_2.png", "/bg_slide_3.png"];

function Landing() {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Auto-Sliding Background Images */}
      <div className="fixed inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={bgIndex}
            src={BACKGROUNDS[bgIndex]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover object-center"
            alt="Background"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      {/* Floating Gradient Shapes */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -100, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] h-[40vw] w-[40vw] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 100, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] h-[30vw] w-[30vw] rounded-full bg-accent/20 blur-[100px]"
        />
      </div>

      <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Vaultly</span>
        </div>
        <Link
          to="/auth"
          className="glass-panel-strong rounded-full px-6 py-2.5 text-sm font-semibold transition hover:ring-glow"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-32">
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center max-w-3xl"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full glass-panel-strong px-5 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              The Next Generation of Society Management
            </div>
            <h1 className="text-balance text-6xl font-bold leading-[1.1] tracking-tight sm:text-7xl md:text-8xl">
              Smart Society. <br />
              <span className="text-gradient">Transparent Funds.</span>
            </h1>
            <p className="mt-8 text-pretty text-xl text-muted-foreground sm:text-2xl font-light">
              A premium, real-time treasurer dashboard for residential societies. Experience
              absolute transparency and security.
            </p>
            <div className="mt-12 flex flex-wrap gap-4 justify-center">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-brand px-8 py-4 text-base font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.02]"
              >
                Get Started
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ILLUSTRATED FEATURES */}
        <section className="mt-40 space-y-32">
          {/* Feature 1: Digital Payments & Finance */}
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1 lg:max-w-xl"
            >
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl glass-panel-strong text-primary shadow-glow">
                <LayoutDashboard className="h-7 w-7" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Seamless Finance Management
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Watch maintenance flow in with real-time charts, automated digital payments, and
                animated KPIs that keep your finger on the pulse of society finances.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/illus_finance.png"
                  alt="Finance Illustration"
                  className="w-full rounded-[2.5rem] shadow-2xl border border-glass-border"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Feature 2: Smart Community (Reversed) */}
          <div className="flex flex-col-reverse items-center justify-between gap-12 lg:flex-row">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/illus_community.png"
                  alt="Community Illustration"
                  className="w-full rounded-[2.5rem] shadow-2xl border border-glass-border"
                />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1 lg:max-w-xl lg:ml-auto"
            >
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl glass-panel-strong text-accent shadow-glow">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Connected Apartment Community
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Bring your entire society online. Manage residents, track dues per flat, and foster
                a transparent, digitally connected neighborhood.
              </p>
            </motion.div>
          </div>

          {/* Feature 3: Security & Audit */}
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1 lg:max-w-xl"
            >
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl glass-panel-strong text-warning shadow-glow">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Military-Grade Security & Audit
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Every financial transaction and administrative action is securely logged. Residents
                can trust that funds are handled with absolute transparency.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <img
                  src="/illus_security.png"
                  alt="Security Illustration"
                  className="w-full rounded-[2.5rem] shadow-2xl border border-glass-border"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-40 mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel-strong relative overflow-hidden rounded-[3rem] px-6 py-24 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-brand opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Ready to transform your society?
              </h2>
              <p className="mt-6 text-xl text-muted-foreground">
                Join hundreds of modern communities experiencing absolute financial clarity.
              </p>
              <div className="mt-10">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-10 py-5 text-lg font-bold text-primary-foreground shadow-glow transition hover:scale-105"
                >
                  Start Demo Now <ArrowRight className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
