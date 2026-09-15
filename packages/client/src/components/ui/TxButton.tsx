import { type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";

type Status = "ready" | "loading" | "pending" | "success" | "error";

interface TxButtonProps {
  asyncTask: () => Promise<boolean | undefined>;
  children: ReactNode;
  hint?: string;
  errorHint?: string;
  disabled?: boolean;
  className?: string;
}

const stateClasses: Record<Status, string> = {
  ready: "bg-accent text-bg hover:bg-accent-hi shadow-accentPop",
  loading: "bg-accent text-bg opacity-80 cursor-wait",
  pending: "bg-[rgba(232,254,90,0.09)] text-accent border border-[rgba(232,254,90,0.35)] cursor-wait",
  success: "bg-[rgba(232,254,90,0.09)] text-accent border border-[rgba(232,254,90,0.35)]",
  error: "bg-[rgba(255,138,122,0.1)] text-loss-hi border border-[rgba(255,138,122,0.45)]",
};

const stateLabelFallback: Record<Status, string> = {
  ready: "",
  loading: "Confirm in wallet…",
  pending: "Waiting for confirmation…",
  success: "✓ Confirmed",
  error: "Try again",
};

const stateHint: Record<Status, string> = {
  ready: "Your wallet will open — review the amount before signing.",
  loading: "Your wallet will open — review the amount before signing.",
  pending: "Waiting on the network. This can take a moment.",
  success: "Done — moving on.",
  error: "You rejected the request in your wallet. Nothing was staked.",
};

const Spinner = () => (
  <span
    aria-hidden
    className="inline-block h-4 w-4 rounded-full border-[2.5px] border-current border-t-transparent animate-spin"
  />
);

export const TxButton = ({ asyncTask, children, hint, errorHint, disabled, className }: TxButtonProps) => {
  const [status, setStatus] = useState<Status>("ready");

  const label =
    status === "ready" ? children : status === "success" ? stateLabelFallback.success : stateLabelFallback[status];

  const displayHint = status === "error" ? (errorHint ?? stateHint.error) : (hint ?? stateHint[status]);

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <button
        type="button"
        disabled={disabled || status === "loading" || status === "pending"}
        onClick={async () => {
          setStatus("loading");
          try {
            const start = performance.now();
            const result = await asyncTask();
            // If the async task took longer than 250ms treat it as pending → success flash
            if (performance.now() - start > 250) setStatus("pending");
            if (result === false) {
              setStatus("error");
              return;
            }
            setStatus("success");
            setTimeout(() => setStatus("ready"), 1600);
          } catch {
            setStatus("error");
          }
        }}
        className={cn(
          "inline-flex w-full items-center justify-center gap-3 rounded-xl3 px-5 py-4 text-[15px] font-semibold transition-all duration-150 disabled:cursor-not-allowed",
          stateClasses[status],
        )}
      >
        {(status === "loading" || status === "pending") && <Spinner />}
        <span>{label}</span>
      </button>
      {displayHint && (
        <p className={cn("px-1 text-[12.5px]", status === "error" ? "text-loss-mute" : "text-ink-faint")}>
          {displayHint}
        </p>
      )}
    </div>
  );
};
