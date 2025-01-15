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
      }
    })
  }

  return (
    <div className="w-6/12 mt-4 mx-auto text-3xl flex flex-col items-center justify-center gap-y-8">
      {
        game.status === "waitingJ1Deployment" && (
          <div className="flex flex-col gap-y-4 mt-4 items-center justify-center">
            <div>Waiting for j1 to start the game</div>
            <div className="mr-3 border-4 border-blue-300 rounded-full w-24 h-24  border-t-white animate-spin"></div>
          </div>
        )
      }
      {
        game.status === "j1Deployed" && (
          <div>
            <MakeMove move={game.move} setMove={setMove} />
            <TxButton
              asyncTask={async () => {
                if (!game.move) return;
                if (!game.gameId) return;
                const txHash = await writeContractAsync({
                  abi: RPSLS.abi,
                  address: game.contractAddress as HexString,
                  functionName: "play",
                  args: [getMoveNumber(game.move)],
                  value: toRealNumber(
                    game.stake,
                    chain?.nativeCurrency.decimals,
                  ),
                });
                console.log(txHash);
                await waitForTransactionReceipt(config, {
                  hash: txHash,
                });
                socket.emit("j2Played", {
                  gameId: game.gameId,
                })
                setGame({ ...game, status: "j2Played" });
              }}
            >
              Start Game 🎮
            </TxButton>
          </div>
        )
      }
      <div>{game.move && <p className="mt-4">You selected: {game.move}</p>}</div>
      {
        game.status === "j2Played" && (
          <div>
            <div className="flex flex-row gap-x-4 my-4 items-center justify-start">
              <p>Waiting for J1 to Solve</p>
              <div className=" border-4 border-blue-300  rounded-full w-7 h-7  border-t-white animate-spin"></div>
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
                  if(!chain?.id) return;
                  if(!game.gameId) return;
                  const claimTxHash = await writeContractAsync({
                    abi: RPSLS.abi,
                    address: game.contractAddress as HexString,
                    functionName: "j1Timeout",
                  });
                  const receipt = await waitForTransactionReceipt(config, {
                    hash: claimTxHash,
                  });
                  if(receipt.status === "success") {
                    setGame((prevGame) => {
                      const newGame: gameJ2 = {
                        ...prevGame,
                        isThisJ1: false,
                        status: "j2Claimed",
                      }
                      return newGame
                    })
                    socket.emit("gameOver", {
                      solveTxHash: receipt.transactionHash,
                      winner: "j2",
                      isTimeout: true,
                      gameId: game.gameId
                    })
                  }
                }}
              >
                Claim Your Stake
              </TxButton>
            )}
          </div>
        )
      }
      {
        game.status === "j2Claimed" && (
          <div className="italic">
            <p>Game over! J1 timed out. You claimed your stake.</p>
          </div>
        )
      }
      {
        game.status === "draw" && (
          <div className="italic">
            <p>Game Over! It's a draw!</p>
          </div>
        )
      }
      {
        game.status === "j1Won" && (
          <div className="italic">
            <p>Game Over! J1 won! You Lost.</p>
            {game.timedOut && <p>You TimedOut!</p>}
          </div>
        )
      }
      {
        game.status === "j2Won" && (
          <div className="italic">
            <p>Game Over! You won!</p>
          </div>
        )
      }
    </div>
  )
};

export default J2Game;
