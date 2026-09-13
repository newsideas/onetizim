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
    <tr className="hover:bg-white/5">
      <td className="px-4 py-3 text-white">{studentName}</td>
      <td className="px-4 py-3">
        {connected ? (
          <span className="text-green-400">Ulangan</span>
        ) : (
          <span className="text-white/50">Ulanmagan</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Nusxalandi" : "Havolani nusxalash"}
        </button>
      </td>
    </tr>
  );
}
