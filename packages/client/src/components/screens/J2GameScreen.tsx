import { RPSLS } from "@rpsls/contract";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { decodeFunctionData } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { getTransaction, waitForTransactionReceipt } from "wagmi/actions";
import type { gameJ2, gameState } from "../../App";
import useTimer from "../../hooks/useTimer";
import { type HexString, MOVES, type Move, doubleAmount, getMoveNumber, toRealNumber } from "../../lib/game";
import { socket } from "../../socket";
import { config } from "../../wagmi";
import { MoveGrid } from "../domain/MoveGrid";
import { ResultPanel, type ResultVariant } from "../domain/ResultPanel";
import { WaitPanel } from "../domain/WaitPanel";
import { CopyChip } from "../ui/CopyChip";
import { CountdownRing } from "../ui/CountdownRing";
import { type Step, Stepper } from "../ui/Stepper";
import { TxButton } from "../ui/TxButton";

interface Props {
  game: gameState;
  setGame: Dispatch<SetStateAction<gameState>>;
  onPlayAgain: () => void;
}

export const J2GameScreen = ({ game, setGame, onPlayAgain }: Props) => {
  const { chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { gameLastAction, gameTimeout } = useTimer(game.contractAddress);
  const [timeover, setTimeover] = useState(false);
  const [j1Move, setJ1Move] = useState<Move | undefined>();

  const setMove = (move: Move | undefined) => setGame((prev) => ({ ...prev, move }));

  const isTerminalReveal =
    !game.isThisJ1 &&
    !!game.solveTx &&
    !game.timedOut &&
    (game.status === "j1Won" || game.status === "j2Won" || game.status === "draw");

  useEffect(() => {
    if (!isTerminalReveal || !game.solveTx) return;
    let cancelled = false;
    (async () => {
      try {
        const tx = await getTransaction(config, { hash: game.solveTx as HexString });
        const decoded = decodeFunctionData({ abi: RPSLS.abi, data: tx.input });
        if (decoded.functionName !== "solve" || !Array.isArray(decoded.args)) return;
        const moveNum = Number(decoded.args[0]);
        if (moveNum >= 1 && moveNum <= 5 && !cancelled) setJ1Move(MOVES[moveNum - 1]);
      } catch {
        // leave j1Move undefined — panel falls back to hidden
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isTerminalReveal, game.solveTx]);

  if (game.isThisJ1) return null;

  // ────────── waiting for J1 to deploy ──────────
  if (game.status === "waitingJ1Deployment") {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-6">
        <WaitPanel
          title="Waiting for the host…"
          body="They're committing their move and deploying the game. This usually takes a few seconds — up to a minute if the network is busy."
          rows={
            <>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl2">
                <span className="text-[12.5px] text-ink-faint">Game id</span>
                <CopyChip value={game.gameId ?? ""} label={`#${game.gameId ?? ""}`} size="sm" />
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl2">
                <span className="text-[12.5px] text-ink-faint">Stake</span>
                <span className="font-mono text-[13px] text-ink">
                  {game.stake} {chain?.nativeCurrency.symbol ?? ""}
                </span>
              </div>
            </>
          }
          actions={
            <button type="button" onClick={onPlayAgain} className="text-ink-faint hover:text-ink text-[13px] py-2">
              Leave game
            </button>
          }
        />
      </div>
    );
  }

  // ────────── contract deployed, pick move + play ──────────
  if (game.status === "j1Deployed") {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-6 flex flex-col gap-6">
        <header className="text-center">
          <h2 className="font-display text-[24px] font-bold">Your move</h2>
          <p className="text-ink-soft text-[14px] mt-1">
            The host has staked. Pick your move — you'll stake the same amount when you confirm.
          </p>
        </header>
        <MoveGrid move={game.move} onSelect={setMove} />
        <div className="rounded-xl4 border border-hairline-soft bg-surface p-3 flex items-center justify-between text-[13px] text-ink-soft">
          <span>Contract</span>
          <CopyChip
            value={game.contractAddress ?? ""}
            label={`${game.contractAddress?.slice(0, 6)}…${game.contractAddress?.slice(-4)}`}
            size="sm"
          />
        </div>
        <TxButton
          disabled={!game.move}
          asyncTask={async () => {
            if (!game.move || !game.gameId) return false;
            const tx = await writeContractAsync({
              abi: RPSLS.abi,
              address: game.contractAddress as HexString,
              functionName: "play",
              args: [getMoveNumber(game.move)],
              value: toRealNumber(game.stake, chain?.nativeCurrency.decimals),
            });
            await waitForTransactionReceipt(config, { hash: tx });
            socket.emit("j2Played", { gameId: game.gameId });
            setGame({ ...game, status: "j2Played" });
          }}
        >
          Play · stake {game.stake} {chain?.nativeCurrency.symbol}
        </TxButton>
      </div>
    );
  }

  // ────────── waiting for J1 to reveal ──────────
  if (game.status === "j2Played") {
    const steps: Step[] = [
      { key: "deploy", title: "Host deployed the game", sub: "Their move is hidden", state: "done" },
      { key: "play", title: "You played", sub: `Your move: ${game.move ?? "?"}`, state: "done" },
      { key: "reveal", title: "Host reveals", sub: "Waiting for the reveal tx", state: "now" },
    ];

    return (
      <div className="mx-auto max-w-[760px] px-4 py-6 flex flex-col gap-6">
        <WaitPanel
          title="Waiting for the host to reveal…"
          body="They'll sign once more and the contract settles automatically."
          rows={
            <>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl2">
                <span className="text-[12.5px] text-ink-faint">Your move</span>
                <span className="font-mono text-[13px] text-accent">{game.move ?? "?"}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl2">
                <span className="text-[12.5px] text-ink-faint">Contract</span>
                <CopyChip
                  value={game.contractAddress ?? ""}
                  label={`${game.contractAddress?.slice(0, 6)}…${game.contractAddress?.slice(-4)}`}
                  size="sm"
                />
              </div>
            </>
          }
        />
        <div className="rounded-xl4 border border-hairline-soft bg-surface p-4 flex flex-col gap-4">
          <Stepper steps={steps} />
          {gameTimeout && gameLastAction && (
            <div className="border-t border-hairline-soft pt-3">
              <CountdownRing
                timeout={gameTimeout.result as bigint}
                lastAction={gameLastAction.result as bigint}
                onExpire={() => setTimeover(true)}
                label="until you can claim the pot"
                labelExpired="window closed — claim the pot"
              />
            </div>
          )}
        </div>
        {timeover && (
          <TxButton
            asyncTask={async () => {
              if (!chain?.id || !game.gameId) return false;
              const tx = await writeContractAsync({
                abi: RPSLS.abi,
                address: game.contractAddress as HexString,
                functionName: "j1Timeout",
              });
              const receipt = await waitForTransactionReceipt(config, { hash: tx });
              if (receipt.status === "success") {
                setGame(
                  (prev): gameJ2 => ({
                    ...(prev as gameJ2),
                    isThisJ1: false,
                    status: "j2Claimed",
                  }),
                );
                socket.emit("gameOver", {
                  solveTxHash: receipt.transactionHash,
                  winner: "j2",
                  isTimeout: true,
                  gameId: game.gameId,
                });
              }
            }}
          >
            Claim the pot
          </TxButton>
        )}
      </div>
    );
  }

  // ────────── terminal ──────────
  if (game.status === "j1Won" || game.status === "j2Won" || game.status === "draw" || game.status === "j2Claimed") {
    let variant: ResultVariant;
    if (game.status === "j2Claimed") variant = "timeoutWon";
    else if (game.status === "j2Won") variant = "won";
    else if (game.status === "j1Won") {
      variant = game.timedOut ? "timeoutLost" : "lost";
    } else {
      const isRefund = game.timedOut && !game.solveTx;
      variant = isRefund ? "refunded" : "draw";
    }

    const displayStake = variant === "won" || variant === "timeoutWon" ? doubleAmount(game.stake) : game.stake;
    const canRevealTheirs = variant === "won" || variant === "lost" || variant === "draw";

    return (
      <div className="mx-auto max-w-[760px] px-4 py-6">
        <ResultPanel
          variant={variant}
          myMove={game.move}
          theirMove={canRevealTheirs ? j1Move : undefined}
          theirMoveHidden={canRevealTheirs && !j1Move}
          stake={displayStake}
          chain={chain}
          solveTx={game.solveTx}
          onPlayAgain={onPlayAgain}
        />
      </div>
    );
  }

  return null;
};
