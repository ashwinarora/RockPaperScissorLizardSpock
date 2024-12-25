import { useEffect, useState } from "react";
import { socket } from "../socket";
import MakeMove from "./MakeMove";
import { getHash, getRandomSalt, HexString, Move, toRealNumber } from "./utils";
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import TxButton from "./TxButton";
import RPSLS from "../../../contracts/artifacts/contracts/RPS.sol/RPS.json";
import { useDeployContract } from "wagmi";
import { gameJ1 } from "../App";

interface INewGameProps {
  game: gameJ1;
  setGame: (game: gameJ1) => void;
}

const NewGame = ({ game, setGame }: INewGameProps) => {
  const { address, chain } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const [move, setMove] = useState<Move | null>(null);
  const [stake, setStake] = useState("");
  const [txHash, setTxHash] = useState<HexString>();
  const publicClient = usePublicClient();
  const { data: depoyTxData } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if(!depoyTxData) return;
    if(!depoyTxData.contractAddress) return;
    if(game.status !== "j2joined") return;
    setGame({ ...game, status: "contractDeployed", contractAddress: depoyTxData.contractAddress });
    socket.emit("contractDeployed", {
      contractAddress: depoyTxData.contractAddress,
    })
  }, [depoyTxData])

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
          className="border border-gray-300 bg-slate-800 p-1 rounded disabled:cursor-not-allowed disabled:text-gray-300"
        />
        {stake && (
          <p className="mt-4">
            Stake: {stake} {chain?.nativeCurrency.symbol}
          </p>
        )}
        {game.status === "init" && (
          <div className="w-full">
            <button
              disabled={!stake.length}
              onClick={() => {
                socket.emit("j1Ready", {
                  socketId: socket.id,
                  stake: stake,
                  chainId: chain?.id,
                  j1Address: address,
                });
                setGame({ ...game, status: "j2waiting" });
              }}
              className="p-3 w-full rounded bg-blue-500 hover:bg-blue-700 text-white disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Ready
            </button>
          </div>
        )}
        {game.status === "j2waiting" && (
          <div className="flex flex-col items-center justify-center gap-y-4">
            <div>Waiting for player 2 to join</div>
            <div className="mr-3 border-4 border-blue-300 rounded-full w-24 h-24  border-t-white animate-spin"></div>
          </div>
        )}
        {game.status === "j2joined" && (
          <div>
            <MakeMove move={move} setMove={setMove} />
            <div>{move && <p className="mt-4">You selected: {move}</p>}</div>
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
                  const txHash = await deployContractAsync({
                    abi: RPSLS.abi,
                    bytecode: RPSLS.bytecode as HexString,
                    args: [hash, game.j2Address],
                    value: realStake,
                    account: address,
                  });
                  console.log(txHash);
                  setTxHash(txHash);
                  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
                  console.log(receipt);
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
