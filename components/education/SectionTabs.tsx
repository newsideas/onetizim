import { PageTabs } from "@/components/ui/PageTabs";

type StudentsView = "list" | "base" | "reports";
type GroupsView = "list" | "assign";

export function StudentsTabs({ current }: { current: StudentsView }) {
  return (
    <PageTabs
      tabs={[
        { label: "Ro'yxat", href: "/education/students", active: current === "list" },
        { label: "To'liq baza", href: "/education/students/base", active: current === "base" },
        { label: "Hisobot", href: "/education/students/reports", active: current === "reports" },
      ]}
    />
  );
}

export function GroupsTabs({ current }: { current: GroupsView }) {
  return (
    <PageTabs
      tabs={[
        { label: "Ro'yxat", href: "/education/groups", active: current === "list" },
        { label: "Biriktirish", href: "/education/groups/assign", active: current === "assign" },
      ]}
    />
  );
}
