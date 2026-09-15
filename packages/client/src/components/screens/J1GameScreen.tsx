import { RPSLS } from "@rpsls/contract";
import { AlertTriangle } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useAccount, useDeployContract, useReadContract, useWatchContractEvent, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { gameState } from "../../App";
import useTimer from "../../hooks/useTimer";
import {
  type HexString,
  type Move,
  doubleAmount,
  getHash,
  getMoveNumber,
  getRandomSalt,
  getWinner,
  toRealNumber,
} from "../../lib/game";
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

export const J1GameScreen = ({ game, setGame, onPlayAgain }: Props) => {
  const { address, chain } = useAccount();
  const salt = useMemo(() => getRandomSalt(), []);
  const { deployContractAsync } = useDeployContract();
  const { writeContractAsync } = useWriteContract();
  const { gameLastAction, gameTimeout } = useTimer(game.contractAddress);
  const [timeover, setTimeover] = useState(false);

  const { data: j2Move, refetch: fetchJ2Move } = useReadContract({
    abi: RPSLS.abi,
    address: game.contractAddress as HexString,
    functionName: "c2",
  });

  useEffect(() => {
    if (game.status === "j2Played") fetchJ2Move();
  }, [game, fetchJ2Move]);

  const hasSalt = game.isThisJ1 && !!game.salt;
  useEffect(() => {
    if (!game.isThisJ1) return;
    if (hasSalt) return;
    setGame((prev) => ({ ...prev, salt: salt.toString() }));
  }, [salt, game.isThisJ1, hasSalt, setGame]);

  useWatchContractEvent({
    address: game.contractAddress as HexString,
    abi: RPSLS.abi,
    eventName: "j2Played",
    onLogs: () => {
      if (game.status === "j2Played") return;
      setGame((prev) => {
        if (!prev?.isThisJ1) return prev;
        return { ...prev, status: "j2Played" };
      });
    },
  });

  const setMove = (move: Move | undefined) => setGame((prev) => ({ ...prev, move }));

  if (!game.isThisJ1) return null;

  // ────────── waiting for j2 ──────────
  if (game.status === "j2waiting") {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-6">
        <WaitPanel
          title="Waiting for a challenger…"
          body={`Send the link to a friend, or sit tight — anyone on ${chain?.name ?? "this chain"} can join from the lobby. Nothing is staked yet.`}
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
              Cancel
            </button>
          }
        />
      </div>
    );
  }

  // ────────── j2 joined, pick move + deploy ──────────
  if (game.status === "j2joined") {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-6 flex flex-col gap-6">
        <header className="text-center">
          <h2 className="font-display text-[24px] font-bold">Your move</h2>
          <p className="text-ink-soft text-[14px] mt-1">
            A challenger joined. Pick your move — it stays hidden until you reveal after they play.
          </p>
        </header>
        <MoveGrid move={game.move} onSelect={setMove} />
        <div className="rounded-xl4 border border-[rgba(255,196,107,0.28)] bg-[rgba(255,196,107,0.07)] p-3 text-[12.5px] text-warn-hi flex gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
          <p>
            Finish this game in this browser. The secret that reveals your move is stored on this device — if you clear
            site data or switch browsers before revealing, your opponent claims the pot after the 5-minute window.
          </p>
        </div>
        <TxButton
          disabled={!game.move}
          asyncTask={async () => {
            if (!game.move || !game.stake.length || !game.gameId || !game.salt) return false;
            const realStake = toRealNumber(game.stake, chain?.nativeCurrency.decimals);
            const hash = getHash(game.move, game.salt);
            const deployTxHash = await deployContractAsync({
              abi: RPSLS.abi,
              bytecode: RPSLS.bytecode as HexString,
              args: [hash, game.j2Address],
              value: realStake,
              account: address,
            });
            const receipt = await waitForTransactionReceipt(config, { hash: deployTxHash });
            if (!receipt.contractAddress) throw new Error("Contract not found");
            setGame({
              ...game,
              status: "contractDeployed",
              contractAddress: receipt.contractAddress,
            });
            socket.emit("contractDeployed", {
              gameId: game.gameId,
              contractAddress: receipt.contractAddress,
            });
          }}
        >
          Start game · stake {game.stake} {chain?.nativeCurrency.symbol}
        </TxButton>
      </div>
    );
  }

  // ────────── contract deployed, waiting on j2 play ──────────
  if (game.status === "contractDeployed") {
    const steps: Step[] = [
      { key: "deploy", title: "You deployed the game", sub: "Commit hash on-chain", state: "done" },
      { key: "play", title: "Opponent's move", sub: "They're picking now", state: "now" },
      { key: "reveal", title: "Reveal your move", sub: "You'll sign one more time", state: "next" },
    ];
    return (
      <div className="mx-auto max-w-[620px] px-4 py-6 flex flex-col gap-6">
        <WaitPanel
          title="Waiting for your opponent to play"
          body="They see the pot and are picking their move. This usually takes a few seconds."
          rows={
            <>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl2">
                <span className="text-[12.5px] text-ink-faint">Contract</span>
                <CopyChip
                  value={game.contractAddress ?? ""}
                  label={`${game.contractAddress?.slice(0, 6)}…${game.contractAddress?.slice(-4)}`}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl2">
                <span className="text-[12.5px] text-ink-faint">Stake</span>
                <span className="font-mono text-[13px] text-ink">
                  {game.stake} {chain?.nativeCurrency.symbol ?? ""}
                </span>
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
                label="until you can claim their stake"
                labelExpired="window closed — claim the pot"
              />
            </div>
          )}
        </div>
        {timeover && (
          <TxButton
            asyncTask={async () => {
              if (!game.gameId) return false;
              const tx = await writeContractAsync({
                abi: RPSLS.abi,
                address: game.contractAddress as HexString,
                functionName: "j2Timeout",
              });
              const receipt = await waitForTransactionReceipt(config, { hash: tx });
              if (receipt.status === "success") {
                setGame({ ...game, status: "j1Claimed" });
                socket.emit("gameOver", {
                  solveTxHash: receipt.transactionHash,
                  winner: "j1",
                  isTimeout: true,
                  gameId: game.gameId,
                });
              }
            }}
          >
            Claim your stake
          </TxButton>
        )}
      </div>
    );
  }

  // ────────── j2 played, reveal ──────────
  if (game.status === "j2Played") {
    return (
      <div className="mx-auto max-w-[620px] px-4 py-6 flex flex-col gap-6">
        <header className="text-center">
          <h2 className="font-display text-[24px] font-bold">Reveal your move</h2>
          <p className="text-ink-soft text-[14px] mt-1">
            Your opponent has played. One more signature to settle the game.
          </p>
        </header>
        <div className="rounded-xl4 border border-hairline-soft bg-surface p-4 text-center">
          <p className="text-[12px] uppercase tracking-widest text-ink-faint mb-2">Your move</p>
          <p className="font-display text-[20px] font-bold text-accent">{game.move}</p>
        </div>
        <TxButton
          asyncTask={async () => {
            if (!game.gameId || !game.isThisJ1 || !game.salt) return false;
            const tx = await writeContractAsync({
              abi: RPSLS.abi,
              address: game.contractAddress as HexString,
              functionName: "solve",
              args: [getMoveNumber(game.move), BigInt(game.salt)],
            });
            const j1n = getMoveNumber(game.move);
            const j2n = Number(j2Move);
            const winner = getWinner(j1n, j2n);
            const receipt = await waitForTransactionReceipt(config, { hash: tx });
            if (receipt.status === "success") {
              socket.emit("gameOver", {
                solveTxHash: receipt.transactionHash,
                winner,
                isTimeout: false,
                gameId: game.gameId,
              });
              setGame({
                ...game,
                status: winner === "draw" ? "draw" : winner === "j1" ? "j1Won" : "j2Won",
                solveTx: receipt.transactionHash,
              } as gameState);
            }
          }}
        >
          Reveal and settle
        </TxButton>
      </div>
    );
  }

  // ────────── terminal ──────────
  if (game.status === "j1Won" || game.status === "j2Won" || game.status === "draw" || game.status === "j1Claimed") {
    const j2NumMove = j2Move ? Number(j2Move) : 0;
    const theirMove =
      j2NumMove >= 1 && j2NumMove <= 5
        ? (["Rock", "Paper", "Scissors", "Spock", "Lizard"][j2NumMove - 1] as Move)
        : undefined;

    let variant: ResultVariant;
    if (game.status === "j1Claimed") variant = "timeoutWon";
    else if (game.status === "j1Won") variant = "won";
    else if (game.status === "j2Won") {
      variant = game.timedOut ? "timeoutLost" : "lost";
    } else {
      // draw
      const isRefund = game.timedOut && !game.solveTx;
      variant = isRefund ? "refunded" : "draw";
    }

    const displayStake = variant === "won" || variant === "timeoutWon" ? doubleAmount(game.stake) : game.stake;

    return (
      <div className="mx-auto max-w-[620px] px-4 py-6">
        <ResultPanel
          variant={variant}
          myMove={game.move}
          theirMove={theirMove}
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
