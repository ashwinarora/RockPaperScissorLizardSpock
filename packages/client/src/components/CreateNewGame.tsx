import { trpc } from "../trpc";
import { useAccount } from "wagmi";
import { gameState } from "../App";
import { socket } from "../socket";
import { FaMagic, FaWallet } from "react-icons/fa";
interface INewGameProps {
  game: gameState;
  setGame: React.Dispatch<React.SetStateAction<gameState>>;
}

const CreateNewGame = ({ game, setGame }: INewGameProps) => {
  const { address, isConnected, chain } = useAccount();
  const createGame = trpc.createNewGame.useMutation();

  return (
    <>
      <div className="bg-[#0A183A] border border-[#089BFB]  shadow-lg  mx-auto w-full max-w-5xl rounded-xl p-8 flex flex-col items-center mb-20">
        <div className="flex flex-col items-center mb-4">
          <div className="mb-4 bg-[#0c1b36] rounded-full p-0">
            <img src="/assets/plus.svg" className="w-8 h-8" alt="plus" />
          </div>
          <h2 className="text-3xl font-bold text-[#0e90ff] mb-2">
            Create a New Game
          </h2>
          <p className="text-gray-300 mb-8">
            Set up a new game and wait for opponents
          </p>
        </div>

        <div className="space-y-4">
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
            className="w-[32rem] bg-slate-950  text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-center"
          />

          {/* Create Game Button */}
          <button
            className="mt-4 w-full flex justify-center items-center disabled:cursor-not-allowed gap-x-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            disabled={createGame.isPending || !game.stake.length}
            onClick={async () => {
              if (!isConnected) return;
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
            {isConnected ? (
              <FaMagic className="h-4 w-4" />
            ) : (
              <FaWallet className="h-4 w-4" />
            )}

            {isConnected ? "Create New Game" : "Connect Wallet"}
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
