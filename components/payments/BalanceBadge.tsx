import { formatSom } from "@/lib/utils/currency";

/** Balans manfiy bo'lsa qizil, aks holda oddiy ko'rinishda. */
export function BalanceBadge({ balance }: { balance: number }) {
  const isDebt = balance < 0;
  return (
    <span className={isDebt ? "text-red-500 font-medium" : "text-inherit"}>
      {formatSom(balance)}
      {isDebt ? " — Qarzdor" : ""}
    </span>
  );
}
