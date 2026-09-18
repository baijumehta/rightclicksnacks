"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/ui.tsx";

/** Copy the list as plain text, for pasting into Teams or a shopping app. */
export function CopyList({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="no-print flex gap-2">
      <button
        type="button"
        className={buttonStyles.secondary}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy as text"}
      </button>
      <button type="button" className={buttonStyles.secondary} onClick={() => window.print()}>
        Print
      </button>
    </div>
  );
}
