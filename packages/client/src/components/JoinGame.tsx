import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { gameJ2 } from "../App";
import { socket } from "../socket";
import { useState } from "react";
import { getMoveNumber, HexString, Move, toRealNumber } from "./utils";
import MakeMove from "./MakeMove";
import TxButton from "./TxButton";
import RPSLS from "../../../contracts/artifacts/contracts/RPS.sol/RPS.json";

interface IJoinGameProps {
  game: gameJ2;
  setGame: (game: gameJ2) => void;
}

const JoinGame = ({ game, setGame }: IJoinGameProps) => {
  const { address, chain } = useAccount();
  const [move, setMove] = useState<Move | null>(null);
  const { writeContractAsync } = useWriteContract();
  const [playTxHash, setPlayTxHash] = useState<HexString>();
  const { data: depoyTxData } = useWaitForTransactionReceipt({
    hash: playTxHash,
  });

  return (
    <div className="w-full mt-4 text-3xl flex flex-col items-center justify-center">
      <div className="flex w-4/12 flex-col items-start justify-center gap-y-6">
        <div>Join Game</div>
        <div>
          Stake: {game.stake} {chain?.nativeCurrency.symbol}
        </div>
        <button
          disabled={game.status === "waitingJ1Deployment"}
          className="bg-blue-500 hover:bg-blue-700 text-white p-3 w-full rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => {
            socket.emit("j2Ready", {
              socketId: socket.id,
              j2Address: address,
            });
            setGame({ ...game, status: "waitingJ1Deployment" });
          }}
        >
          Join Game
        </button>
        {game.status === "waitingJ1Deployment" && (
          <div className="flex flex-col gap-y-4 mt-4 items-center justify-center">
            <div>Waiting for j1 to start the game</div>
            <div className="mr-3 border-4 border-blue-300 rounded-full w-24 h-24  border-t-white animate-spin"></div>
          </div>
        )}
        {game.status === "j1Deployed" && (
          <div>
            <MakeMove move={move} setMove={setMove} />
            <div>{move && <p className="mt-4">You selected: {move}</p>}</div>
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
                setPlayTxHash(txHash);
              }}
            >
              Start Game 🎮
            </TxButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinGame;
