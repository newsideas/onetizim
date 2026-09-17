import Link from "next/link";

export interface PageTab {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

/** Ro'yxat sahifalaridagi "Faol / Bekor qilingan" kabi tablar — holat URL'da. */
export function PageTabs({ tabs }: { tabs: PageTab[] }) {
  return (
    <nav className="flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab.active
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab.active ? "bg-brand-600/10 text-brand-600" : "bg-canvas text-ink-faint"
              }`}
            >
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
