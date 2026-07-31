import { useEffect, useRef, useState } from "react";
import { inr, inrCompact } from "@/lib/format";

interface Props {
  value: number;
  format?: "inr" | "inr-compact" | "number" | "percent";
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, format = "number", duration = 1200, className }: Props) {
  const [display, setDisplay] = useState(0);
  const start = useRef<number>(0);
  const from = useRef<number>(0);

  useEffect(() => {
    from.current = display;
    start.current = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from.current + (value - from.current) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted =
    format === "inr"
      ? inr(Math.round(display))
      : format === "inr-compact"
        ? inrCompact(Math.round(display))
        : format === "percent"
          ? `${display.toFixed(1)}%`
          : Math.round(display).toLocaleString("en-IN");

  return <span className={className}>{formatted}</span>;
}
