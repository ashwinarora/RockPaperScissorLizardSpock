import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { gameState } from "../App";
import MakeMove from "./MakeMove";
import {
  getHash,
  getMoveNumber,
  getRandomSalt,
  getWinner,
  HexString,
  Move,
  toRealNumber,
} from "./utils";
import TxButton from "./TxButton";
import {
  useAccount,
  useDeployContract,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { RPSLS } from "@rpsls/contract";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../wagmi";
import { socket } from "../socket";
import useTimer from "./useTimer";
import Timeout from "./Timeout";
import { useWatchContractEvent } from "wagmi";

interface IJ1GameProps {
  game: gameState;
  setGame: Dispatch<SetStateAction<gameState>>;
}

const J1Game = ({ game, setGame }: IJ1GameProps) => {
  const { address, chain } = useAccount();
  // const [move, setMove] = useState<Move | null>(null);
  const salt = useMemo(() => getRandomSalt(), []);
  const { deployContractAsync } = useDeployContract();
  const [timeover, setTimeover] = useState(false);
  const { gameLastAction, gameTimeout } = useTimer(game.contractAddress);
  const { writeContractAsync } = useWriteContract();

  const { data: j2Move, refetch: fetchJ2Move } = useReadContract({
    abi: RPSLS.abi,
    address: game.contractAddress as HexString,
    functionName: "c2",
  });

  useEffect(() => {
    if (game.status === "j2Played") {
      fetchJ2Move();
    }
  }, [game]);

  useEffect(() => {
    if (!game.isThisJ1) return;
    if (game.salt) return;
    setGame((prevGame) => {
      return {
        ...prevGame,
        salt: salt.toString(),
      };
    });
  }, [salt]);

  useWatchContractEvent({
    address: game.contractAddress as HexString,
    abi: RPSLS.abi,
    eventName: "j2Played",
    onLogs: () => {
      if (game.status === "j2Played") return;
      console.log("J2 Played");
      setGame((prevGame) => {
        if (!prevGame?.isThisJ1) return prevGame;
        return {
          ...prevGame,
          status: "j2Played",
        };
      });
    },
  });

  const setMove = (move: Move | undefined) => {
    setGame((prevGame) => {
      return {
        ...prevGame,
        move: move,
      };
    });
  };

  return (
    <div className="w-9/12 mx-auto text-xl flex justify-center ">
      {game.status === "j2waiting" && (
        <div className="bg-[#0A183A] border border-[#089BFB]  shadow-lg  mx-auto w-full max-w-5xl rounded-xl p-28 flex flex-col items-center mb-8">
          <div className="flex flex-col items-center mb-4 gap-16">
            <div>
              <img src="/assets/loading.gif" alt="" />
            </div>
            <div>
              <p className="text-3xl">
                Waiting for <span className="text-[#089BFB]">player 2</span> to
                join
              </p>
            </div>
          </div>
        </div>
      )}
      {game.status === "j2joined" && (
        <div className="bg-[#061636] rounded-3xl p-8 w-full max-w-4xl text-center flex flex-col items-center border border-[#2563EB]">
          <MakeMove move={game.move} setMove={setMove} />
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB]">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>
          <TxButton
            asyncTask={async () => {
              if (!game.move) return;
              if (!game.stake.length) return;
              if (!game.gameId) return;
              if (!game.salt) return;
              const realStake = toRealNumber(
                game.stake,
                chain?.nativeCurrency.decimals,
              );
              const hash = getHash(game.move, game.salt);
              try {
                const deployTxHash = await deployContractAsync({
                  abi: RPSLS.abi,
                  bytecode: RPSLS.bytecode as HexString,
                  args: [hash, game.j2Address],
                  value: realStake,
                  account: address,
                });
                const receipt = await waitForTransactionReceipt(config, {
                  hash: deployTxHash,
                });
                if (!receipt.contractAddress)
                  throw new Error("Contract not found");
                setGame({
                  ...game,
                  status: "contractDeployed",
                  contractAddress: receipt.contractAddress ?? "",
                });
                socket.emit("contractDeployed", {
                  gameId: game.gameId,
                  contractAddress: receipt.contractAddress,
                });
                console.log("Deploy Tx", receipt.transactionHash);
              } catch (error) {
                console.error("Error deploying contract:", error);
              }
            }}
          >
            Let's Play
          </TxButton>
          <div className="mt-4 w-6/12">
            {game.move && (
              <p className=" flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB] font-semibold">
                  {game.move}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {game.status === "contractDeployed" && (
        <div className="bg-[#0A183A] rounded-3xl px-16 py-16 mt-10 max-w-6xl text-center border border-[#2563EB]">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-4 w-6/12 flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected: {game.move}
              </p>
            )}
          </div>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB] mt-4">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>
          <div className="flex  items-center justify-center ">
            <img
              className="w-24 h-24 text-center"
              src="/assets/loading.gif"
              alt=""
            />
          </div>
          {gameTimeout && gameLastAction && (
            <Timeout
              timeout={gameTimeout?.result as bigint}
              lastAction={gameLastAction.result as bigint}
              setTimeover={setTimeover}
            />
          )}
          <div className="flex flex-row gap-x-4 my-4 items-center justify-center ">
            <p>
              Waiting for <span className="text-[#089BFB]">player 2</span> to
              play
            </p>
          </div>
          <p className="text-center">
            <span className="text-[#089BFB]">Game started! </span> Contract
            deployed at: {game.contractAddress}
          </p>
          {timeover && (
            <TxButton
              asyncTask={async () => {
                if (!game.gameId) return;
                const timeoutTxHash = await writeContractAsync({
                  abi: RPSLS.abi,
                  address: game.contractAddress as HexString,
                  functionName: "j2Timeout",
                });
                const recepit = await waitForTransactionReceipt(config, {
                  hash: timeoutTxHash,
                });
                if (recepit.status === "success") {
                  setGame({ ...game, status: "j1Claimed" });
                  socket.emit("gameOver", {
                    solveTxHash: recepit.transactionHash,
                    winner: "j1",
                    isTimeout: true,
                    gameId: game.gameId,
                  });
                }
              }}
            >
              Claim Your Stake
            </TxButton>
          )}
        </div>
      )}
      {game.status === "j1Claimed" && (
        <div className="bg-[#0A183A] rounded-3xl p-20 mt-6 max-w-6xl text-center border border-[#2563EB] flex flex-col gap-4">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-4 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB]">{game.move}</span>
              </p>
            )}
          </div>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB] mt-8">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>
          <p className="text-[#089BFB] text-3xl">Game over! </p>
          <p className=" text-3xl">Player 2 timed out</p>
          <p className=" text-3xl"> You claimed your stake.</p>
          <button
            type="button"
            className="flex justify-center w-6/12 mt-8 px-5 py-1.5 bg-blue-600 rounded-md text-center text-white text-2xl cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed m-auto"
            onClick={() => (window.location.href = "/")}
          >
            Play Again!
          </button>
        </div>
      )}
      {game.status === "j2Played" && (
        <div className="bg-[#061636] rounded-3xl p-20 w-full max-w-4xl text-center mt-16 border border-[#2563EB]">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-4 w-6/12 flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected: {game.move}
              </p>
            )}
          </div>
          <p className="mt-4 text-2xl">
            <span className="text-[#089BFB]">Player 2</span> has Played!
          </p>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB] mt-8">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>
          <div className="mt-28">
            <TxButton
              asyncTask={async () => {
                if (!game.gameId) return;
                if (!game.isThisJ1) return;
                if (!game.salt) return;
                try {
                  const solveTxHash = await writeContractAsync({
                    abi: RPSLS.abi,
                    address: game.contractAddress as HexString,
                    functionName: "solve",
                    args: [getMoveNumber(game.move), BigInt(game.salt)],
                  });
                  const j1MoveNumber = getMoveNumber(game.move);
                  const j2MoveNumber = Number(j2Move);
                  console.log(j1MoveNumber, j2MoveNumber);
                  const winner = getWinner(j1MoveNumber, j2MoveNumber);
                  const recepit = await waitForTransactionReceipt(config, {
                    hash: solveTxHash,
                  });
                  if (recepit.status === "success") {
                    socket.emit("gameOver", {
                      solveTxHash: recepit.transactionHash,
                      winner: winner,
                      isTimeout: false,
                      gameId: game.gameId,
                    });
                    setGame({
                      ...game,
                      status:
                        winner === "draw"
                          ? "draw"
                          : winner === "j1"
                            ? "j1Won"
                            : "j2Won",
                    });
                  }
                } catch (error) {
                  console.log(error);
                }
              }}
            >
              Solve Game
            </TxButton>
          </div>
        </div>
      )}
      {game.status === "draw" && (
        <div className="bg-[#0A183A] rounded-3xl p-20 mt-10 max-w-6xl text-center border border-[#2563EB] flex flex-col gap-6">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-4 w-9/12 flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB]">{game.move}</span>
              </p>
            )}
          </div>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB] ">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>
          <p>
            {" "}
            <span className="text-[#089BFB] text-2xl">Game Over!</span>{" "}
          </p>
          <p className="text-2xl">It's a draw!</p>
          <button
            type="button"
            className="flex justify-center w-6/12 mt-8 px-5 py-1.5 bg-blue-600 rounded-md text-center text-white text-2xl cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed m-auto"
            onClick={() => (window.location.href = "/")}
          >
            Play Again!
          </button>
        </div>
      )}
      {game.status === "j1Won" && (
        <div className="bg-[#0A183A] rounded-3xl p-20 mt-10 w-9/12 text-center border border-[#2563EB] flex flex-col gap-6">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-4 w-9/12 flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB]">{game.move}</span>
              </p>
            )}
          </div>
          <div>
            <p className="text-[#089BFB] text-3xl">Game Over!</p>
          </div>
          <div className="relative flex justify-center items-center text-3xl font-bold text-white">
            <img
              src="/assets/won.svg"
              alt="You Won!"
              className="max-w-64 h-auto"
            />
            <span className=" absolute text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
              You Won!
            </span>
          </div>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB]">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold">
                {2 * Number(game?.stake || 0)}
              </span>
            </p>
          </div>{" "}
          <button
            type="button"
            className="flex justify-center w-6/12 mt-8 px-5 py-1.5 bg-blue-600 rounded-md text-center text-white text-2xl cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed m-auto"
            onClick={() => (window.location.href = "/")}
          >
            Play Again!
          </button>
        </div>
      )}
      {game.status === "j2Won" && (
        <div className="bg-[#0A183A] rounded-3xl p-20 mt-10 w-9/12 text-center border border-[#2563EB] flex flex-col gap-6">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-4 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB]">{game.move}</span>
              </p>
            )}
          </div>
          <div>
            <p className="text-[#089BFB] text-3xl">Game Over!</p>
          </div>
          <div className="text-3xl"> Player 2 won! .</div>
          <div className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
            You Lost.
          </div>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB]">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold">{game.stake}</span>
            </p>
          </div>{" "}
          <button
            type="button"
            className="flex justify-center w-6/12 mt-8 px-5 py-1.5 bg-blue-600 rounded-md text-center text-white text-2xl cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed m-auto"
            onClick={() => (window.location.href = "/")}
          >
            Play Again!
          </button>
          {game.timedOut && <p>You TimedOut!</p>}
        </div>
      )}
    </div>
  );
};

export default J1Game;
