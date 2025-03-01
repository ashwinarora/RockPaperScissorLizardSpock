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
    <div className="w-6/12 mx-auto text-xl">
      {game.status === "j2waiting" && (
        // <div className="flex flex-col items-center justify-center gap-y-4">
        //   <div>Waiting for player 2 to join</div>
        //   <div className="mr-3 border-4 border-blue-300 rounded-full w-24 h-24  border-t-white animate-spin"></div>
        // </div>
        <div className="bg-[#0A183A] border border-[#089BFB]  shadow-lg  mx-auto w-full max-w-5xl rounded-xl p-28 flex flex-col items-center mb-8">
          <div className="flex flex-col items-center mb-4 gap-16">
            <div>
              <img src="assests/loading.gif" alt="" />
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
        <div>
          <MakeMove move={game.move} setMove={setMove} />
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
            Start Game 🎮
          </TxButton>
        </div>
      )}
      <div>
        {game.move && <p className="mt-4">You selected: {game.move}</p>}
      </div>
      {game.status === "contractDeployed" && (
        <div>
          <p>Game started! Contract deployed at: {game.contractAddress}</p>
          <div className="flex flex-row gap-x-4 my-4 items-center justify-start">
            <p>Waiting for J2 to play</p>
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
        <div className="italic">
          <p>Game over! J2 timed out. You claimed your stake.</p>
        </div>
      )}
      {game.status === "j2Played" && (
        <div className="w-full">
          <p>J2 has Played!</p>
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
      )}
      {game.status === "draw" && (
        <div className="italic">
          <p>Game Over! It's a draw!</p>
        </div>
      )}
      {game.status === "j1Won" && (
        <div className="italic">
          <p>Game Over! You won!</p>
        </div>
      )}
      {game.status === "j2Won" && (
        <div className="italic">
          <p>Game Over! J2 won! You Lost.</p>
          {game.timedOut && <p>You TimedOut!</p>}
        </div>
      )}
    </div>
  );
};

export default J1Game;
