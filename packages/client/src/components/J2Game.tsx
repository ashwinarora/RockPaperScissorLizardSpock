import { Dispatch, SetStateAction, useState } from "react";
import { gameJ2, gameState } from "../App";
import MakeMove from "./MakeMove";
import { getMoveNumber, HexString, Move, toRealNumber } from "./utils";
import TxButton from "./TxButton";
import { useAccount, useWriteContract } from "wagmi";
import { RPSLS } from "@rpsls/contract";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../wagmi";
import { socket } from "../socket";
import Timeout from "./Timeout";
import useTimer from "./useTimer";

interface IJ2GameProps {
  game: gameState;
  setGame: Dispatch<SetStateAction<gameState>>;
}

const J2Game = ({ game, setGame }: IJ2GameProps) => {
  const { chain } = useAccount();
  // const [move, setMove] = useState<Move | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { gameLastAction, gameTimeout } = useTimer(game.contractAddress);
  const [timeover, setTimeover] = useState(false);

  const setMove = (move: Move | undefined) => {
    setGame((prevGame) => {
      return {
        ...prevGame,
        move: move,
      };
    });
  };

  return (
    <div className="w-8/12 mt-4 mx-auto text-xl flex justify-center">
      {game.status === "waitingJ1Deployment" && (
        <div className="bg-[#0A183A] border border-[#089BFB]  shadow-lg  mx-auto w-full max-w-5xl rounded-xl p-28 flex flex-col items-center mb-8 pb-16">
          <div className="flex flex-col items-center mb-4 gap-16">
            <div>
              <img src="/assets/loading.gif" alt="" />
            </div>
            <div>
              <p className="text-3xl">
                Waiting for <span className="text-[#089BFB]">player 1</span> to
                start the game
              </p>
            </div>
          </div>
        </div>
      )}
      {game.status === "j1Deployed" && (
        <div className="bg-[#0A183A] rounded-3xl px-16 py-16 mt-10 max-w-6xl text-center border border-[#2563EB] flex flex-col justify-center items-center">
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
              if (!game.gameId) return;
              const txHash = await writeContractAsync({
                abi: RPSLS.abi,
                address: game.contractAddress as HexString,
                functionName: "play",
                args: [getMoveNumber(game.move)],
                value: toRealNumber(game.stake, chain?.nativeCurrency.decimals),
              });
              console.log(txHash);
              await waitForTransactionReceipt(config, {
                hash: txHash,
              });
              socket.emit("j2Played", {
                gameId: game.gameId,
              });
              setGame({ ...game, status: "j2Played" });
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

      {game.status === "j2Played" && (
        <div className="bg-[#0A183A] rounded-3xl p-32 mt-10 max-w-6xl text-center border border-[#2563EB]">
          <p className="mt-4 w-[28rem] m-auto flex justify-center items-center disabled:cursor-not-allowed  px-4 pb-2 bg-slate-950 text-white rounded-xl">
            {game.move && <p className="mt-4">You selected: {game.move}</p>}
          </p>
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB] mt-6">
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
          <div className="flex flex-row gap-x-4 my-4 items-center justify-center">
            <p>
              Waiting for{" "}
              <span className="text-[#089BFB] text-2xl">Player 1</span> to Solve
            </p>
          </div>

          {gameTimeout && gameLastAction && (
            <Timeout
              timeout={gameTimeout?.result as bigint}
              lastAction={gameLastAction.result as bigint}
              setTimeover={setTimeover}
            />
          )}
          {timeover && (
            <TxButton
              asyncTask={async () => {
                if (!chain?.id) return;
                if (!game.gameId) return;
                const claimTxHash = await writeContractAsync({
                  abi: RPSLS.abi,
                  address: game.contractAddress as HexString,
                  functionName: "j1Timeout",
                });
                const receipt = await waitForTransactionReceipt(config, {
                  hash: claimTxHash,
                });
                if (receipt.status === "success") {
                  setGame((prevGame) => {
                    const newGame: gameJ2 = {
                      ...prevGame,
                      isThisJ1: false,
                      status: "j2Claimed",
                    };
                    return newGame;
                  });
                  socket.emit("gameOver", {
                    solveTxHash: receipt.transactionHash,
                    winner: "j2",
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
      {game.status === "j2Claimed" && (
        <div className="bg-[#0A183A] rounded-3xl p-20 mt-6 max-w-6xl text-center border border-[#2563EB] flex flex-col gap-4">
          <div className="flex justify-center">
            {game.move && (
              <p className="mt-2 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB]">{game.move}</span>
              </p>
            )}
          </div>
          <div className="bg-[#0A183A] text-white px-6 py-1 mb-4 rounded-lg border border-[#089BFB] ">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>
          <p className="text-[#089BFB] text-3xl">Game over! </p>
          <p className=" text-3xl">Player 1 timed out</p>
          <div className="relative flex justify-center items-center text-3xl font-bold text-white">
            <img
              src="/assets/won.svg"
              alt="You Won!"
              className="max-w-64 h-auto"
            />
            <span className=" absolute text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
              You claimed your stake.
            </span>
          </div>
          <button
            type="button"
            className="flex justify-center w-6/12 mt-4 px-2 py-1.5 bg-blue-600 rounded-md text-center text-white text-2xl cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed m-auto "
            onClick={() => (window.location.href = "/")}
          >
            Play Again!
          </button>
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
          <div className="bg-[#0A183A] text-white px-6 py-3 mb-4 rounded-lg border border-[#089BFB]">
            <p className="text-2xl">
              Stake Amount:{" "}
              <span className="text-[#089BFB] font-semibold pr-4">
                {game.stake}
              </span>
              {chain?.nativeCurrency.symbol}
            </p>
          </div>{" "}
          <span className="text-[#089BFB] text-2xl">Game Over!</span>{" "}
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
              <p className="mt-4 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-slate-950 text-white rounded-xl ">
                You selected:{" "}
                <span className="text-[#089BFB]">{game.move}</span>
              </p>
            )}
          </div>
          <div>
            <p className="text-[#089BFB] text-3xl">Game Over!</p>
          </div>
          <div className="text-3xl"> Player 1 won! .</div>
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
      {game.status === "j2Won" && (
        <div className="bg-[#0A183A] rounded-3xl p-20 mt-10  w-9/12 text-center border border-[#2563EB] flex flex-col gap-6">
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
    </div>
  );
};

export default J2Game;
