import { useState } from "react";
import { Icon } from "../Icon";

/** A code sample with a copy button (hidden where the browser has no clipboard). */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const canCopy = typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the user can still select the text */
    }
  }
  return (
    <div className="codeblock">
      <pre aria-label={label}>{code}</pre>
      {canCopy && (
        <button type="button" className="btn copy" onClick={copy} aria-label={`Copy ${label}`}>
          <Icon name={copied ? "check" : "table"} size={13} />
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      )}
    </div>
  );
}
