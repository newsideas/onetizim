import { PageTabs } from "@/components/ui/PageTabs";

export function StaffTabs({ current }: { current: "list" | "access" | "roles" | "accounts" }) {
  return (
    <PageTabs
      tabs={[
        { label: "Xodimlar", href: "/staff", active: current === "list" },
        { label: "Login va parollar", href: "/staff/accounts", active: current === "accounts" },
        { label: "Rollar", href: "/staff/roles", active: current === "roles" },
        { label: "A'zolar", href: "/staff/access", active: current === "access" },
      ]}
    />
  );
}
