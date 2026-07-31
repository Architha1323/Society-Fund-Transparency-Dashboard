import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments · Vaultly" },
      { name: "description", content: "Accept and reconcile society payments." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      icon={CreditCard}
      title="Payments"
      description="Accept UPI, cards and net banking directly from residents."
      bullets={[
        "UPI QR + intent links",
        "Automatic reconciliation",
        "Failed-payment retries",
        "Split payments across heads",
      ]}
    />
  ),
});
