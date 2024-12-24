import { useState } from "react";
import { socket } from "../socket";
import MakeMove from "./MakeMove";
import { getHash, getRandomSalt, Move, toRealNumber } from "./utils";
import { useAccount, usePrepareTransactionRequest } from "wagmi";
import TxButton from "./TxButton";
import RPSLS from "../../../contracts/artifacts/contracts/RPS.sol/RPS.json";
import { config } from "../wagmi";
import { useDeployContract } from "wagmi";
import { gameJ1 } from "../App";

interface INewGameProps {
  j2Address: string;
  game: gameJ1;
}

const NewGame = ({ j2Address, game }: INewGameProps) => {
  const { address, chain } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const [move, setMove] = useState<Move | null>(null);
  const [stake, setStake] = useState("");

  return (
    <div className="w-full mt-4 text-3xl flex flex-col items-center justify-center">
      <div className="flex flex-col items-start justify-center gap-y-6">
        <div>Make a new game</div>
        <input
          type="number"
          value={stake}
          disabled={game.status !== "init"}
          onChange={(e) => setStake(e.target.value)}
          placeholder="Enter Stake"
          className="border border-gray-300 bg-slate-800 p-1 rounded disabled:cursor-not-allowed disabled:text-gray-800"
        />
        {game.status === "init" && (
          <button
            onClick={() => {
              console.log("emiting")
              socket.emit("j1ready", {
                stake: stake,
                chainId: chain?.id,
              });
            }}
            className="p-3 w-full bg-blue-500 text-white rounded"
          >
            Ready
          </button>
        )}
        {game.status === "j2waiting" && (
          <div>
            <div>Waiting for player 2 to join</div>
            <div className="mr-3 border-4 border-blue-300 rounded-full w-7 h-7 border-t-white animate-spin"></div>
          </div>
        )}
        {game.status === "j2joined" && (
          <div>
            <MakeMove move={move} setMove={setMove} />
            <div>
              {move && <p className="mt-4">You selected: {move}</p>}
              {stake && (
                <p className="mt-4">
                  Stake: {stake} {chain?.nativeCurrency.symbol}
                </p>
              )}
            </div>
            <TxButton
              asyncTask={async () => {
                if (!move) return;
                if (!stake.length) return;
                const realStake = toRealNumber(
                  stake,
                  chain?.nativeCurrency.decimals,
                );
                const salt = getRandomSalt();
                const hash = getHash(move, salt);
                console.log("depoying");
                try {
                  const result = await deployContractAsync({
                    abi: RPSLS.abi,
                    bytecode: RPSLS.bytecode as `0x${string}`,
                    args: [hash, j2Address],
                    value: realStake,
                    account: address,
                  });
                  console.log(result);
                } catch (error) {
                  console.error("Error deploying contract:", error);
                }
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

export default NewGame;
