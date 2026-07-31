import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2, Eye, EyeOff, Loader2, Mail, Moon, Sun, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedBackground } from "@/components/animated-background";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Vaultly Society Dashboard" },
      {
        name: "description",
        content: "Sign in to manage your society's finances with a premium, transparent dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

const SLIDES = [
  {
    image: "/illus_finance.png",
    title: "Financial Clarity",
    description: "Every rupee tracked, categorized, and made transparent for all residents.",
  },
  {
    image: "/illus_community.png",
    title: "Smart Community",
    description:
      "Bring your entire society online. Manage flats, owners, and digital payments effortlessly.",
  },
  {
    image: "/illus_security.png",
    title: "Audit-Ready Security",
    description: "Bank-grade security and comprehensive audit logs for absolute peace of mind.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("demo_mode")) {
      navigate({ to: "/dashboard" });
      return;
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/dashboard" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    return () => subscription?.unsubscribe();
  }, [navigate]);

  const google = async () => {
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      toast.success("Redirecting to Google...");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Google sign-in failed", { description: msg });
    } finally {
      setBusy(false);
    }
  };

  const emailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success("Password reset link sent");
        setMode("signin");
      } else {
        if (email === "admin@society.in" || email === "member@society.in") {
          localStorage.setItem("demo_mode", email);
          toast.success("Welcome back (Demo)");
          navigate({ to: "/dashboard" });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <AnimatedBackground />

      <div className="relative mx-auto grid min-h-dvh max-w-[1400px] gap-8 px-6 py-8 lg:grid-cols-2">
        {/* LEFT — Auto-Sliding Illustrations */}
        <div className="relative hidden overflow-hidden rounded-[2.5rem] glass-panel-strong lg:flex flex-col border border-glass-border shadow-2xl">
          <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Vaultly</span>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12"
              >
                <img
                  src={SLIDES[slideIndex].image}
                  alt={SLIDES[slideIndex].title}
                  className="w-[80%] max-w-md object-contain drop-shadow-2xl"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-20 p-12 pt-0 h-48">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold tracking-tight">{SLIDES[slideIndex].title}</h2>
                <p className="mt-3 text-lg text-muted-foreground max-w-md leading-relaxed">
                  {SLIDES[slideIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute bottom-8 left-12 flex gap-2">
              {SLIDES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === slideIndex ? "w-8 bg-primary" : "w-2 bg-border"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Glass Form */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-panel-strong w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 shadow-glass border border-glass-border relative overflow-hidden"
          >
            {/* Subtle glow behind form */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 lg:hidden">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="font-bold tracking-tight">Vaultly</span>
                </Link>
                <button
                  onClick={toggle}
                  aria-label="Toggle theme"
                  className="grid h-10 w-10 place-items-center rounded-full glass-panel transition hover:ring-glow ml-auto lg:ml-0"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                {mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Reset password"
                    : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Start managing your society's finances."
                  : mode === "forgot"
                    ? "We'll email you a secure reset link."
                    : "Sign in to your treasurer dashboard."}
              </p>

              {mode !== "forgot" && (
                <>
                  <button
                    onClick={google}
                    disabled={busy}
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-glass-border bg-background/50 px-4 py-3.5 text-sm font-semibold backdrop-blur transition hover:bg-background hover:shadow-glow disabled:opacity-60"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  {mode === "signin" && (
                    <div className="mt-5 space-y-3">
                      <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Demo Accounts
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail("admin@society.in");
                            setPassword("VaultlyDemo$2026");
                          }}
                          className="rounded-2xl border border-glass-border bg-background/50 px-3 py-2.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail("member@society.in");
                            setPassword("VaultlyDemo$2026");
                          }}
                          className="rounded-2xl border border-glass-border bg-background/50 px-3 py-2.5 text-xs font-semibold transition hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          Member
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="uppercase tracking-widest">Or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={emailSubmit} className="space-y-4">
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@society.in"
                    className="w-full rounded-2xl border border-glass-border bg-background/50 py-4 pl-12 pr-4 text-sm outline-none backdrop-blur transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                {mode !== "forgot" && (
                  <div className="relative group">
                    <input
                      required
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-glass-border bg-background/50 py-4 pl-4 pr-12 text-sm outline-none backdrop-blur transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label="Toggle password visibility"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                )}

                {mode === "signin" && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-4 py-4 text-sm font-bold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "signup"
                        ? "Create Account"
                        : mode === "forgot"
                          ? "Send Reset Link"
                          : "Sign In Securely"}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    New to Vaultly?{" "}
                    <button
                      className="font-semibold text-primary hover:underline"
                      onClick={() => setMode("signup")}
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="font-semibold text-primary hover:underline"
                      onClick={() => setMode("signin")}
                    >
                      ← Back to sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.7l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.9 35.2 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
