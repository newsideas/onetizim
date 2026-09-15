"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function TelegramLinkRow({
  studentName,
  link,
  connected,
}: {
  studentName: string;
  link: string;
  connected: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <tr className="hover:bg-canvas">
      <td className="px-4 py-3 text-ink">{studentName}</td>
      <td className="px-4 py-3">
        {connected ? (
          <span className="text-green-400">Ulangan</span>
        ) : (
          <span className="text-ink-faint">Ulanmagan</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-line hover:text-ink"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Nusxalandi" : "Havolani nusxalash"}
        </button>
      </td>
    </tr>
  );
}
