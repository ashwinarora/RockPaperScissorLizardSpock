import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import type { gameJ2, gameState } from "../../App";
import { SUPPORTED_CHAINS, type SupportedChainId, isSupported } from "../../lib/chains";
import { cn } from "../../lib/cn";
import { socket } from "../../socket";
import { trpc } from "../../trpc";
import { GameCard } from "../domain/GameCard";
import { Wordmark } from "../domain/Wordmark";
import { Button } from "../ui/Button";
import { ChainDot, Pill } from "../ui/Pill";

type FilterKey = "wallet" | "all" | number;

interface LobbyProps {
  game: gameState;
  setGame: React.Dispatch<React.SetStateAction<gameState>>;
}

export const Lobby = ({ game, setGame }: LobbyProps) => {
  const { address, chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: joinableGames, refetch } = trpc.joinableGames.useQuery(undefined, {
    refetchInterval: 6000,
  });

  const [filter, setFilter] = useState<FilterKey>("wallet");
  const chainSupported = chain ? isSupported(chain.id) : false;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally refetch whenever any part of game state changes
  useEffect(() => {
    refetch();
  }, [game, refetch]);

  const activeFilterChainId = useMemo(() => {
    if (filter === "wallet") return chain?.id;
    if (filter === "all") return undefined;
    return filter;
  }, [filter, chain?.id]);

  const games = joinableGames ?? [];
  const shownGames = useMemo(() => {
    if (!activeFilterChainId) return games.map((g) => ({ ...g, dimmed: false }));
    return games.map((g) => ({ ...g, dimmed: Number(g.chainId) !== activeFilterChainId }));
  }, [games, activeFilterChainId]);

  const activeChain = activeFilterChainId ? SUPPORTED_CHAINS.find((c) => c.id === activeFilterChainId) : undefined;
  const matchingCount = shownGames.filter((g) => !g.dimmed).length;

  const handleJoin = (gameData: (typeof games)[number]) => {
    if (!address) return;
    setGame(() => {
      const newState: gameJ2 = {
        isThisJ1: false,
        status: "preJoinChecks",
        stake: gameData.stake,
      };
      return newState;
    });
    socket.emit("joinGame", {
      gameId: gameData.id.toString(),
      j2Address: address,
    });
  };

  const [stake, setStake] = useState("");
  const createGame = trpc.createNewGame.useMutation();

  const potPreview = stake ? (Number(stake) * 2).toString() : "0";
  const createDisabled = !isConnected || !chainSupported || !stake || createGame.isPending;
  const createLabel = !chainSupported
    ? "Unsupported chain"
    : createGame.isPending
      ? "Creating…"
      : `Create game · ${potPreview} ${chain?.nativeCurrency.symbol ?? ""} pot`;
  const createHint = !isConnected
    ? "Connect your wallet to create a game."
    : !chainSupported
      ? "Switch to a supported chain to create a game."
      : "Nothing leaves your wallet until your opponent joins and you commit your move.";

  const handleCreate = async () => {
    if (!chain?.id || !address) return;
    const result = await createGame.mutateAsync({
      chainId: chain.id.toString(),
      stake,
      j1Address: address,
    });
    socket.emit("newGameCreated", { gameId: result.gameId });
    setGame(() => ({
      isThisJ1: true,
      status: "j2waiting",
      stake,
      gameId: result.gameId.toString(),
    }));
  };

  return (
    <div className="mx-auto flex max-w-[620px] flex-col gap-8 px-4 pb-32 pt-6">
      {!isConnected && (
        <section className="flex flex-col items-center gap-4 py-8 text-center animate-risein">
          <Wordmark size="lg" />
          <p className="max-w-md text-[15px] text-ink-soft">
            …and nine other ways to win. Rock · Paper · Scissors · Spock · Lizard, played for real ETH against one other
            person. Stake, commit, reveal, take the pot.
          </p>
          <p className="text-[13px] text-ink-faint">Connect a wallet to play.</p>
        </section>
      )}

      {isConnected && (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[22px] font-bold text-ink">Create a game</h2>
              {chain && (
                <div className="flex items-center gap-1.5 text-[12px] text-ink-faint">
                  <span>Creating on</span>
                  <button
                    type="button"
                    onClick={() => {
                      // Focused-ring switcher target — open wallet chip menu is upstream, so
                      // for now cycle to next supported chain if user clicks the chip; the
                      // Wallet menu is the canonical switcher, but this is a shortcut.
                      const idx = SUPPORTED_CHAINS.findIndex((c) => c.id === chain.id);
                      const next = SUPPORTED_CHAINS[(idx + 1) % SUPPORTED_CHAINS.length];
                      switchChain({ chainId: next.id });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:border-[rgba(232,254,90,0.45)] hover:text-ink"
                  >
                    <ChainDot active={chainSupported} />
                    {chain.name}
                    <span className="text-ink-deep">change</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-xl4 border border-hairline-soft bg-surface p-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] uppercase tracking-widest text-ink-faint">Stake</span>
                <div className="flex items-center gap-2 rounded-xl2 border border-hairline-strong bg-surface-inset px-3 py-2.5 focus-within:border-[rgba(232,254,90,0.45)]">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    placeholder="0.001"
                    className="flex-1 bg-transparent font-mono text-[18px] text-ink placeholder:text-ink-deep focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="font-mono text-[13px] text-ink-faint">{chain?.nativeCurrency.symbol ?? ""}</span>
                </div>
              </label>
              <Button
                size="lg"
                disabled={createDisabled}
                onClick={handleCreate}
                className="w-full"
                variant={chainSupported ? "primary" : "secondary"}
              >
                {createLabel}
              </Button>
              <p className={cn("text-[12.5px]", chainSupported ? "text-ink-faint" : "text-warn-hi")}>{createHint}</p>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[22px] font-bold text-ink">Join a game</h2>
              {activeChain && matchingCount > 0 && (
                <span className="text-[12px] text-ink-faint">
                  {matchingCount} on {activeChain.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={filter === "wallet"} onClick={() => setFilter("wallet")}>
                Match my wallet
              </FilterChip>
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                All chains
              </FilterChip>
              {SUPPORTED_CHAINS.map((c) => (
                <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                  {c.name}
                </FilterChip>
              ))}
            </div>
            {games.length === 0 ? (
              <EmptyLobby heading="No open games yet." body="Create one above and send the link to a friend." />
            ) : matchingCount === 0 && activeChain ? (
              <EmptyLobby
                heading={`No open games on ${activeChain.name}.`}
                body={
                  <>
                    Create one above, or{" "}
                    <button
                      type="button"
                      className="text-accent underline underline-offset-2 hover:text-accent-hi"
                      onClick={() => setFilter("all")}
                    >
                      view all chains
                    </button>
                    .
                  </>
                }
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {shownGames.map((g) => (
                  <li key={g.id}>
                    <GameCard
                      gameId={g.id}
                      chainId={g.chainId}
                      stake={g.stake}
                      updatedAt={g.updatedAt}
                      currentChain={chain}
                      onJoin={() => handleJoin(g)}
                      onSwitchChain={(id) => switchChain({ chainId: id as SupportedChainId })}
                      dimmed={g.dimmed}
                    />
                  </li>
                ))}
              </ul>
            )}
            {isConnected && !chainSupported && (
              <div className="flex items-start gap-2 rounded-xl4 border border-[rgba(255,196,107,0.35)] bg-[rgba(255,196,107,0.07)] p-3 text-[12.5px] text-warn-hi">
                <AlertTriangle size={14} className="mt-0.5 text-warn shrink-0" />
                <span>
                  Your wallet is on {chain?.name ?? "an unknown chain"}. Games on that chain won't appear in this lobby.
                  Use the wallet menu to switch to a supported chain.
                </span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full border px-3 py-1 text-[12.5px] transition-colors",
      active
        ? "border-accent bg-[rgba(232,254,90,0.09)] text-accent"
        : "border-hairline bg-surface-2 text-ink-soft hover:text-ink hover:border-hairline-strong",
    )}
  >
    {children}
  </button>
);

const EmptyLobby = ({ heading, body }: { heading: string; body: React.ReactNode }) => (
  <div className="rounded-xl4 border border-dashed border-hairline-strong bg-surface p-8 text-center">
    <div className="font-display text-[16px] font-bold text-ink mb-1">{heading}</div>
    <div className="text-[13.5px] text-ink-faint">{body}</div>
    <div className="mt-4 flex justify-center gap-3 opacity-40">
      {["✊", "✋", "✌️", "🤏", "🖖"].map((g, i) => (
        <span key={g} className="text-[26px] animate-floaty" style={{ animationDelay: `${i * 0.4}s` }}>
          {g}
        </span>
      ))}
    </div>
    <Pill tone="offchain" size="sm" className="mt-4 mx-auto">
      All stakes stay in your wallet until you commit
    </Pill>
  </div>
);
