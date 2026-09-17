import { PageTabs } from "@/components/ui/PageTabs";

export function PaymentsTabs({ current }: { current: "payments" | "cashbox" }) {
  return (
    <PageTabs
      tabs={[
        { label: "To'lovlar", href: "/finance/payments", active: current === "payments" },
        { label: "Kassa", href: "/finance/payments/cashbox", active: current === "cashbox" },
      ]}
    />
  );
}
