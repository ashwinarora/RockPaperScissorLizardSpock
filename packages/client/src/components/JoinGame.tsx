import { useAccount, useWriteContract } from "wagmi";
import { gameJ2 } from "../App";
import { socket } from "../socket";
import { useState } from "react";
import { getMoveNumber, HexString, Move, toRealNumber } from "./utils";
import { RPSLS } from "@kleros-assignment/contract";
import MakeMove from "./MakeMove";
import TxButton from "./TxButton";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../wagmi";
import useTimer from "./useTimer";
import Timeout from "./Timeout";

interface IJoinGameProps {
  game: gameJ2;
  setGame: (game: gameJ2) => void;
}

const JoinGame = ({ game, setGame }: IJoinGameProps) => {
  const { address, chain } = useAccount();
  const [move, setMove] = useState<Move | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { gameLastAction, gameTimeout } = useTimer(game.contractAddress);
  const [timeover, setTimeover] = useState(false);

  return (
    <div className="w-full mt-4 text-3xl flex flex-col items-center justify-center">
      <div className="flex w-5/12 flex-col items-start justify-center gap-y-6">
        <div>Join Game</div>
        <div>
          Stake: {game.stake} {chain?.nativeCurrency.symbol}
        </div>
        {
          (game.status === "j1Ready" || game.status === "waitingJ1Deployment") &&
          <button
            disabled={game.status === "waitingJ1Deployment"}
            className="bg-blue-500 hover:bg-blue-700 text-white p-3 w-full rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={() => {
              if(!socket.id) return;
              if(!address) return;
              socket.emit("j2Ready", {
                socketId: socket.id,
                j2Address: address,
              });
              setGame({ ...game, status: "waitingJ1Deployment" });
            }}
          >
            Join Game
          </button>
        }
        {game.status === "waitingJ1Deployment" && (
          <div className="flex flex-col gap-y-4 mt-4 items-center justify-center">
            <div>Waiting for j1 to start the game</div>
            <div className="mr-3 border-4 border-blue-300 rounded-full w-24 h-24  border-t-white animate-spin"></div>
          </div>
        )}
        {game.status === "j1Deployed" && (
          <div>
            <MakeMove move={move} setMove={setMove} />
            <TxButton
              asyncTask={async () => {
                if (!move) return;
                const txHash = await writeContractAsync({
                  abi: RPSLS.abi,
                  address: game.contractAddress as HexString,
                  functionName: "play",
                  args: [getMoveNumber(move)],
                  value: toRealNumber(
                    game.stake,
                    chain?.nativeCurrency.decimals,
                  ),
                });
                console.log(txHash);
                await waitForTransactionReceipt(config, {
                  hash: txHash,
                });
                socket.emit("j2Played")
                setGame({ ...game, status: "j2Played" });
              }}
            >
              Start Game 🎮
            </TxButton>
          </div>
        )}
        <div>{move && <p className="mt-4">You selected: {move}</p>}</div>
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
                    const claimTxHash = await writeContractAsync({
                      abi: RPSLS.abi,
                      address: game.contractAddress as HexString,
                      functionName: "j1Timeout",
                    });
                    const receipt = await waitForTransactionReceipt(config, {
                      hash: claimTxHash,
                    });
                    if(receipt.status === "success") {
                      setGame({ ...game, status: "j2Claimed" });
                    }
                  }}
                >
                  Claim Your Stake
                </TxButton>
              )}
            </div>
          )
        }
        {game.status === "j2Claimed" && (
          <div className="italic">
            <p>Game over! J1 timed out. You claimed your stake.</p>
          </div>
        )}
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
    </div>
  );
};

export default JoinGame;
