import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "loss" | "warn" | "offchain";
  size?: "sm" | "md";
  children: ReactNode;
}

const toneClasses = {
  neutral: "bg-surface-2 border border-hairline-strong text-ink-soft",
  accent: "bg-[rgba(232,254,90,0.09)] border border-[rgba(232,254,90,0.35)] text-accent",
  loss: "bg-[rgba(255,138,122,0.1)] border border-[rgba(255,138,122,0.35)] text-loss-hi",
  warn: "bg-[rgba(255,196,107,0.09)] border border-[rgba(255,196,107,0.35)] text-warn-hi",
  offchain: "border border-hairline-strong text-ink-deep",
} as const;

export const Pill = ({ tone = "neutral", size = "md", className, children, ...rest }: PillProps) => (
  <span
    {...rest}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-wide",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      toneClasses[tone],
      className,
    )}
  >
    {children}
  </span>
);

export const ChainDot = ({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) => (
  <span
    aria-hidden
    className={cn(
      "inline-block h-2 w-2 rounded-full",
      active ? "bg-accent shadow-[0_0_0_2px_rgba(232,254,90,0.14)]" : "bg-offchain",
      className,
    )}
  />
);
