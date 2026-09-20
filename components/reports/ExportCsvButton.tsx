"use client";

import { Download } from "lucide-react";

/** Jadvalni CSV faylga eksport qiladi (Excel'da ochiladi; UTF-8 BOM bilan). */
export function ExportCsvButton({
  filename,
  header,
  rows,
}: {
  filename: string;
  header: string[];
  rows: (string | number)[][];
}) {
  function download() {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(escape).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
    >
      <Download size={15} aria-hidden="true" />
      Eksport
    </button>
  );
}
