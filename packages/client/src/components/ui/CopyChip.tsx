import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/cn";

interface CopyChipProps {
  value: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export const CopyChip = ({ value, label, className, size = "md" }: CopyChipProps) => {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // clipboard may be blocked in some contexts; ignore
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl2 border border-hairline-strong bg-surface-2 font-mono text-ink transition-colors duration-150 hover:border-[rgba(232,254,90,0.45)] hover:bg-surface-hover",
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]",
        className,
      )}
      aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
    >
      <span className="truncate">{copied ? "Copied ✓" : (label ?? value)}</span>
      {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} className="text-ink-faint" />}
    </button>
  );
};
