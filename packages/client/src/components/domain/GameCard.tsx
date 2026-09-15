import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { Chain } from "viem";
import { chainById, isSupported } from "../../lib/chains";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { ChainDot, Pill } from "../ui/Pill";

type Variant = "joinable" | "wrongChain" | "unsupported";

interface GameCardProps {
  gameId: string | number;
  chainId: string;
  stake: string;
  updatedAt: string | Date;
  currentChain: Chain | undefined;
  onJoin: () => void;
  onSwitchChain?: (targetId: number) => void;
  dimmed?: boolean;
}

export const GameCard = ({
  gameId,
  chainId,
  stake,
  updatedAt,
  currentChain,
  onJoin,
  onSwitchChain,
  dimmed,
}: GameCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const gameChain = chainById(chainId);
  const gameChainName = gameChain?.name ?? `Chain ${chainId}`;
  const chainMatches = currentChain?.id === Number(chainId);
  const chainRegistered = isSupported(Number(chainId));

  let variant: Variant;
  if (!chainRegistered) variant = "unsupported";
  else if (chainMatches) variant = "joinable";
  else variant = "wrongChain";

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl4 border border-hairline-soft bg-surface-3 transition-opacity duration-200",
        dimmed && "opacity-[0.42]",
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <div
            className={cn("font-mono text-[18px] tabular-nums", variant === "joinable" ? "text-ink" : "text-ink-soft")}
          >
            {stake} {gameChain?.nativeCurrency.symbol ?? ""}
          </div>
          <div className="text-[12px] text-ink-faint font-mono mt-0.5">#{gameId}</div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-ink-soft">
          <ChainDot active={variant === "joinable"} />
          <span className="font-mono">{gameChainName}</span>
          <span className="text-ink-deep">·</span>
          <span>{formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
        </div>
        {variant === "joinable" && (
          <Button size="sm" onClick={onJoin}>
            Join
          </Button>
        )}
        {variant === "wrongChain" && (
          <Button size="sm" variant="secondary" onClick={() => setExpanded((v) => !v)}>
            Other chain
          </Button>
        )}
        {variant === "unsupported" && (
          <Pill tone="offchain" size="sm">
            Unsupported
          </Pill>
        )}
      </div>
      {expanded && variant === "wrongChain" && (
        <div className="border-t border-hairline-soft px-4 py-3 flex flex-wrap items-center gap-3 text-[13px] text-ink-soft animate-fadeup">
          <span>This game is on {gameChainName}. Switch your wallet to join it.</span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="text-ink-faint hover:text-ink" onClick={() => setExpanded(false)}>
              Not now
            </button>
            <Button size="sm" variant="accentTint" onClick={() => onSwitchChain?.(Number(chainId))}>
              Switch to {gameChainName}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
