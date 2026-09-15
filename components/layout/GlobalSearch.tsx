"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useSegment } from "@/components/layout/SegmentProvider";

interface SearchHit {
  id: string;
  name: string;
  hint?: string;
}

interface SearchResults {
  students: SearchHit[];
  groups: SearchHit[];
}

const EMPTY: SearchResults = { students: [], groups: [] };

/**
 * Global qidiruv. Ctrl+K (yoki ⌘K) bilan fokuslanadi, yozilgandan
 * 250 ms keyin serverga so'rov yuboradi va natijalarni pastda ko'rsatadi.
 */
export function GlobalSearch() {
  const router = useRouter();
  const { terms } = useSegment();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sekin kelgan javob yangisining ustiga yozib ketmasligi uchun.
  const requestIdRef = useRef(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  function runSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      setOpen(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    const id = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const data = res.ok ? ((await res.json()) as SearchResults) : EMPTY;
        if (id === requestIdRef.current) setResults(data);
      } catch {
        if (id === requestIdRef.current) setResults(EMPTY);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    }, 250);
  }

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    inputRef.current?.blur();
    router.push(href);
  }

  const hasHits = results.students.length > 0 || results.groups.length > 0;

  return (
    <div className="relative w-full max-w-md" ref={rootRef}>
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
      />
      {/* type="search" brauzerning o'z tozalash tugmasini qo'shadi — o'zimizniki bor. */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => runSearch(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="Qidirish..."
        aria-label="Qidirish"
        className="w-full rounded-lg border border-line bg-canvas py-2 pr-16 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-surface focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      />

      {query ? (
        <button
          type="button"
          onClick={() => runSearch("")}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink"
          aria-label="Tozalash"
        >
          <X size={14} />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
          Ctrl K
        </kbd>
      )}

      {open && (
        <div className="absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          {loading && (
            <div className="px-3 py-3 text-sm text-ink-faint">Qidirilmoqda...</div>
          )}

          {!loading && !hasHits && (
            <div className="px-3 py-3 text-sm text-ink-faint">Hech narsa topilmadi</div>
          )}

          {!loading && results.students.length > 0 && (
            <div className="p-1.5">
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                {terms.studentPlural}
              </div>
              {results.students.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => go(`/students/${hit.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm text-ink hover:bg-canvas"
                >
                  <span className="truncate">{hit.name}</span>
                  {hit.hint && (
                    <span className="shrink-0 text-xs text-ink-faint">{hit.hint}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && results.groups.length > 0 && (
            <div className="border-t border-line p-1.5">
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                {terms.groupPlural}
              </div>
              {results.groups.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => go(`/groups/${hit.id}`)}
                  className="flex w-full items-center rounded-lg px-2 py-2 text-left text-sm text-ink hover:bg-canvas"
                >
                  {hit.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
