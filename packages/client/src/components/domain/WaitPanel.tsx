import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface WaitPanelProps {
  title: string;
  body?: string;
  glyph?: string;
  rows?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const WaitPanel = ({ title, body, glyph = "🎲", rows, actions, className }: WaitPanelProps) => (
  <section className={cn("flex flex-col items-center gap-6 text-center animate-risein", className)}>
    <div className="relative flex h-[150px] w-[150px] items-center justify-center">
      <span className="pointer-events-none absolute inset-4 rounded-full border border-[rgba(232,254,90,0.35)] animate-ringpulse" />
      <span
        className="pointer-events-none absolute inset-4 rounded-full border border-[rgba(232,254,90,0.35)] animate-ringpulse"
        style={{ animationDelay: "1.4s" }}
      />
      <span className="relative inline-flex h-[104px] w-[104px] items-center justify-center rounded-full bg-surface-2 border border-hairline-strong">
        <span className="text-[44px] animate-breathe">{glyph}</span>
      </span>
    </div>
    <div className="max-w-md space-y-2">
      <h2 className="font-display font-bold text-[26px] leading-tight">{title}</h2>
      {body && <p className="text-ink-soft text-[14.5px] leading-relaxed">{body}</p>}
    </div>
    {rows && <div className="w-full max-w-md rounded-xl4 bg-surface p-2 flex flex-col gap-1">{rows}</div>}
    {actions && <div className="w-full max-w-md flex flex-col gap-2">{actions}</div>}
  </section>
);
