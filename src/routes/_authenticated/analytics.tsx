import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Vaultly" },
      { name: "description", content: "Deep analytics for society finances." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      icon={BarChart3}
      title="Analytics"
      description="Deep insight into every trend, cohort and comparison."
      bullets={[
        "Year-over-year income vs. expense",
        "Per-tower collection heatmap",
        "Vendor spend cohorts",
        "Reserve fund growth projection",
      ]}
    />
  ),
});
