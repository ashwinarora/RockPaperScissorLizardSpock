import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

export type StepState = "done" | "now" | "next" | "late";

export type Step = {
  key: string;
  title: string;
  sub?: string;
  state: StepState;
};

const dotClasses: Record<StepState, string> = {
  done: "bg-[rgba(232,254,90,0.15)] border-[rgba(232,254,90,0.45)] text-accent",
  now: "border-accent text-accent bg-transparent animate-breathe",
  next: "border-hairline-strong text-ink-deep bg-transparent",
  late: "border-[rgba(255,138,122,0.45)] text-loss bg-[rgba(255,138,122,0.1)]",
};

const lineClasses: Record<StepState, string> = {
  done: "bg-[rgba(232,254,90,0.35)]",
  now: "bg-[rgba(232,254,90,0.15)]",
  next: "bg-hairline",
  late: "bg-[rgba(255,138,122,0.3)]",
};

const dotContent = (state: StepState) => {
  if (state === "done") return <Check size={13} strokeWidth={3} />;
  if (state === "late") return <span className="text-[13px] font-bold">!</span>;
  return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
};

export const Stepper = ({ steps }: { steps: Step[] }) => (
  <ol className="flex flex-col">
    {steps.map((step, idx) => {
      const isLast = idx === steps.length - 1;
      return (
        <li key={step.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border transition-all",
                dotClasses[step.state],
              )}
            >
              {dotContent(step.state)}
            </span>
            {!isLast && <span className={cn("w-px flex-1 min-h-[26px] my-1", lineClasses[step.state])} />}
          </div>
          <div className="pb-4">
            <div className={cn("text-[14.5px] font-medium", step.state === "next" ? "text-ink-deep" : "text-ink")}>
              {step.title}
            </div>
            {step.sub && <div className="text-[13px] text-ink-faint mt-0.5">{step.sub}</div>}
          </div>
        </li>
      );
    })}
  </ol>
);
