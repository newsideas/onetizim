import { PageTabs } from "@/components/ui/PageTabs";

export function StaffTabs({ current }: { current: "list" | "access" }) {
  return (
    <PageTabs
      tabs={[
        { label: "Xodimlar", href: "/staff", active: current === "list" },
        { label: "Kirish va rollar", href: "/staff/access", active: current === "access" },
      ]}
    />
  );
}
