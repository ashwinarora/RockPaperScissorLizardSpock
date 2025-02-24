import { trpc } from "../trpc";
import { useAccount } from "wagmi";
import { gameState } from "../App";
import { socket } from "../socket";
import { FaPlus, FaMagic } from "react-icons/fa";
interface INewGameProps {
  game: gameState;
  setGame: React.Dispatch<React.SetStateAction<gameState>>;
}

const CreateNewGame = ({ game, setGame }: INewGameProps) => {
  const { address, chain } = useAccount();
  const createGame = trpc.createNewGame.useMutation();

  return (
    <>
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-lg max-w-5xl mx-auto">
        {/* Card Header */}
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <FaPlus className="h-5 w-5 text-blue-400" />
            Create New Game
          </h2>
          <p className="text-sm text-slate-400">
            Set up a new game and wait for opponents
          </p>
        </div>

        {/* Card Content */}
        <div className="space-y-4">
          {/* Stake Amount Input */}
          <input
            type="number"
            value={game.stake}
            onChange={(e) => {
              setGame((prevGame) => {
                return {
                  ...prevGame,
                  stake: e.target.value,
                };
              });
            }}
            placeholder="Enter Stake Amount"
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Create Game Button */}
          <button
            className="mt-4 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            disabled={createGame.isPending || !game.stake.length}
            onClick={async () => {
              if (!chain?.id) return;
              if (!address) return;
              const result = await createGame.mutateAsync({
                chainId: chain.id.toString(),
                stake: game.stake,
                j1Address: address,
              });
              socket.emit("newGameCreated", {
                gameId: result.gameId,
              });
              setGame((prevGame) => {
                return {
                  ...prevGame,
                  status: "j2waiting",
                  isThisJ1: true,
                  gameId: result.gameId.toString(),
                };
              });
            }}
          >
            <FaMagic className="h-4 w-4" />
            Create New Game
            {createGame.isPending && (
              <div className="mr-3 border-4 border-blue-300 rounded-full w-10 h-10  border-t-white animate-spin"></div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateNewGame;
