import { Dispatch, SetStateAction, useState } from "react";
import { trpc } from "../trpc";
import { useAccount } from "wagmi";
import { gameState } from "../App";
import { socket } from "../socket";

interface INewGameProps {
  setGame: Dispatch<SetStateAction<gameState>>
}

const CreateNewGame = ({setGame}: INewGameProps) => {
  const { address, chain } = useAccount();
  const createGame = trpc.createNewGame.useMutation();
  const [stake, setStake] = useState("");
  
  return (
    <div className="w-5/12 mx-auto mt-4 text-2xl flex flex-col items-start gap-y-4 justify-center">
      <div> Create New Game</div>
      <input
        type="number"
        value={stake}
        onChange={(e) => setStake(e.target.value)}
        placeholder="Enter Stake"
        className="border w-full border-gray-300 bg-slate-800 p-1 rounded disabled:cursor-not-allowed disabled:text-gray-300"
      />
      <button
        className="mt-4 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        disabled={createGame.isPending || !stake.length}
        onClick={async () => {
          if(!chain?.id) return;
          if(!address) return;
          const result = await createGame.mutateAsync({
            chainId: chain.id.toString(),
            stake,
            j1Address: address,
          })
          console.log(result)
          socket.emit("newGameCreated", {
            gameId: result.gameId,
          })
          setGame((prevGame) => {
            return {
              ...prevGame,
              status: "j2waiting",
              isThisJ1: true,
              gameId: result.gameId,
            }
          })
        }}
      >
        Create New Game
        {
          createGame.isPending && <div className="mr-3 border-4 border-blue-300 rounded-full w-10 h-10  border-t-white animate-spin"></div>
        }
      </button>
    </div>
  );
};

export default CreateNewGame;
