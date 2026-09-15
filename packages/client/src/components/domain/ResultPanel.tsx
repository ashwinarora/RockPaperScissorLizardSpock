import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { Chain } from "viem";
import { explorerTxUrl } from "../../lib/chains";
import { cn } from "../../lib/cn";
import type { Move } from "../../lib/game";
import { MOVE_META, captionFor } from "../../lib/moves";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";

export type ResultVariant = "won" | "lost" | "draw" | "timeoutWon" | "timeoutLost" | "refunded";

interface ResultPanelProps {
  variant: ResultVariant;
  myMove?: Move;
  theirMove?: Move;
  /** true when we don't know theirMove because the socket contract doesn't carry it (J2 side, non-timeout) — render "hidden" instead of "no move" so we don't imply they never played. */
  theirMoveHidden?: boolean;
  stake: string;
  chain: Chain | undefined;
  solveTx?: string;
  onPlayAgain: () => void;
}

const titleFor: Record<ResultVariant, string> = {
  won: "You won",
  lost: "You lost",
  draw: "Draw",
  timeoutWon: "Won by timeout",
  timeoutLost: "Lost by timeout",
  refunded: "Refunded",
};

const bodyFor: Record<ResultVariant, string> = {
  won: "The full pot is on its way to your wallet.",
  lost: "Close one. The pot went to your opponent.",
  draw: "Same move. Both stakes went straight back to their owners.",
  timeoutWon: "Your opponent stopped responding, so the contract paid you out. Your stake was safe the whole time.",
  timeoutLost:
    "The 5-minute window closed before your reveal landed, so the pot went to your opponent. Sorry — next one's yours.",
  refunded:
    "The game contract that was deployed didn't match the one this site expects, so we ended the match immediately and sent both stakes back. Nothing was played, and nothing was lost.",
};

const potLabelFor: Record<ResultVariant, string> = {
  won: "You take",
  lost: "You staked",
  draw: "Returned to you",
  timeoutWon: "You take",
  timeoutLost: "You staked",
  refunded: "Returned to you",
};

const captionFallback: Record<ResultVariant, string> = {
  won: "You beat them.",
  lost: "They beat you.",
  draw: "Same move, no winner.",
  timeoutWon: "They never revealed a move.",
  timeoutLost: "Your reveal didn't make it in time.",
  refunded: "A safety check stopped this game before it started.",
};

export const ResultPanel = ({
  variant,
  myMove,
  theirMove,
  theirMoveHidden,
  stake,
  chain,
  solveTx,
  onPlayAgain,
}: ResultPanelProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const isGuard = variant === "refunded";
  const showDuel = !isGuard && (myMove !== undefined || theirMove !== undefined);
  const explorer = solveTx ? explorerTxUrl(chain, solveTx) : undefined;

  const caption = (() => {
    if (variant === "won" && myMove && theirMove) return captionFor(myMove, theirMove);
    if (variant === "lost" && myMove && theirMove) return captionFor(theirMove, myMove);
    return captionFallback[variant];
  })();

  return (
    <section className="flex flex-col gap-6 items-center text-center animate-risein">
      {isGuard ? (
        <div className="flex flex-col items-center gap-4">
          <span
            aria-hidden
            className="flex h-[92px] w-[92px] items-center justify-center rounded-full border border-[rgba(232,254,90,0.35)] bg-[rgba(232,254,90,0.08)] text-accent text-[42px]"
          >
            ↺
          </span>
          <Pill tone="accent" size="sm">
            Checked on {chain?.name ?? "chain"}
          </Pill>
        </div>
      ) : showDuel ? (
        <div className="flex items-center justify-center gap-[clamp(14px,5vw,34px)] my-2">
          <div className="flex flex-col items-center gap-2">
            {myMove ? (
              <>
                <span
                  className="animate-slamL"
                  style={{ fontSize: "clamp(52px, 13vw, 76px)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))" }}
                >
                  {MOVE_META[myMove].glyph}
                </span>
                <span className="text-[12px] uppercase tracking-widest text-ink-faint">You · {myMove}</span>
              </>
            ) : (
              <span className="text-[52px] opacity-40">⏳</span>
            )}
          </div>
          <span className="font-display text-[17px] text-ink-deep animate-fadeup" style={{ animationDelay: "0.5s" }}>
            vs
          </span>
          <div className="flex flex-col items-center gap-2">
            {theirMove ? (
              <>
                <span
                  className="animate-slamR"
                  style={{
                    fontSize: "clamp(52px, 13vw, 76px)",
                    filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))",
                    animationDelay: "0.12s",
                  }}
                >
                  {MOVE_META[theirMove].glyph}
                </span>
                <span className="text-[12px] uppercase tracking-widest text-ink-faint">Them · {theirMove}</span>
              </>
            ) : theirMoveHidden ? (
              <>
                <span className="text-[52px] opacity-60">🎭</span>
                <span className="text-[12px] uppercase tracking-widest text-ink-faint">Them · hidden</span>
              </>
            ) : (
              <>
                <span className="text-[52px] opacity-40">⏳</span>
                <span className="text-[12px] uppercase tracking-widest text-ink-faint">Them · no move</span>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="max-w-md space-y-2">
        <p className="text-ink-soft text-[13px] uppercase tracking-widest">{caption}</p>
        <h2
          className={cn(
            "font-display font-extrabold text-[42px] leading-tight",
            variant === "won" && "text-accent",
            variant === "lost" && "text-ink",
            variant === "draw" && "text-ink",
            variant === "timeoutWon" && "text-accent",
            variant === "timeoutLost" && "text-loss-hi",
            variant === "refunded" && "text-accent",
          )}
        >
          {titleFor[variant]}
        </h2>
        <p className="text-ink-soft text-[14.5px] leading-relaxed">{bodyFor[variant]}</p>
      </div>

      <div className="w-full max-w-md rounded-xl4 border border-hairline-soft bg-surface p-4 flex items-center justify-between text-left">
        <div>
          <div className="text-[11.5px] uppercase tracking-widest text-ink-faint">{potLabelFor[variant]}</div>
          <div className="font-mono text-[19px] tabular-nums text-ink mt-0.5">
            {stake} {chain?.nativeCurrency.symbol ?? ""}
          </div>
        </div>
        {explorer && (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-accent"
          >
            View tx <ExternalLink size={13} />
          </a>
        )}
      </div>

      {isGuard && (
        <button
          type="button"
          onClick={() => setShowDetail((v) => !v)}
          className="inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink"
        >
          {showDetail ? "Hide the detail" : "What happened?"}
          {showDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      )}
      {isGuard && showDetail && (
        <p className="max-w-md text-[12.5px] text-ink-faint leading-relaxed animate-fadeup">
          After a host deploys a match, the server reads the deployed contract's bytecode back off-chain and compares it
          byte-for-byte against the known-good compiled build. A mismatch means the contract could behave differently
          from the published rules, so the match is force-settled as a draw and both stakes are refunded on-chain rather
          than risked.
        </p>
      )}

      <div className="w-full max-w-md">
        <Button size="lg" className="w-full" onClick={onPlayAgain}>
          Play again
        </Button>
      </div>
    </section>
  );
};
