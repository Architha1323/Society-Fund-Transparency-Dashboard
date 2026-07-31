import { useEffect, useState } from "react";

/**
 * Animated premium background: gradient mesh, floating blobs, grid, particles,
 * mouse parallax. Lightweight — no external libs, pure CSS animations.
 */
export function AnimatedBackground() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMouse({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const px = (mouse.x - 0.5) * 40;
  const py = (mouse.y - 0.5) * 40;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top left, oklch(0.92 0.06 265) 0%, transparent 55%), radial-gradient(ellipse at bottom right, oklch(0.9 0.08 295) 0%, transparent 55%), linear-gradient(180deg, oklch(0.985 0.005 250), oklch(0.96 0.01 260))",
      }}
    >
      {/* Dark mode override */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, oklch(0.28 0.15 265) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, oklch(0.28 0.18 295) 0%, transparent 55%), linear-gradient(180deg, oklch(0.15 0.04 265), oklch(0.13 0.05 275))",
        }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-[0.4] dark:opacity-[0.25]" />

      {/* Floating blobs with parallax */}
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-60 animate-blob blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.2 264 / 0.55), transparent 70%)",
          transform: `translate(${px}px, ${py}px)`,
          transition: "transform 400ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full opacity-50 animate-blob blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.24 295 / 0.55), transparent 70%)",
          animationDelay: "-6s",
          transform: `translate(${-px}px, ${py}px)`,
          transition: "transform 400ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full opacity-50 animate-blob blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.14 185 / 0.55), transparent 70%)",
          animationDelay: "-12s",
          transform: `translate(${px}px, ${-py}px)`,
          transition: "transform 400ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      />

      {/* Light wave */}
      <div
        className="absolute inset-x-0 top-1/2 h-64 opacity-30 animate-wave blur-2xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.72 0.2 264 / 0.4), oklch(0.72 0.22 295 / 0.4), transparent)",
        }}
      />

      {/* Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 47) % 100;
          const top = (i * 83) % 100;
          const delay = (i % 8) * 0.7;
          const size = 2 + (i % 4);
          return (
            <span
              key={i}
              className="absolute rounded-full bg-primary/60 animate-particle"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                animationDelay: `-${delay}s`,
                boxShadow: "0 0 12px currentColor",
              }}
            />
          );
        })}
      </div>

      {/* Noise texture */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
