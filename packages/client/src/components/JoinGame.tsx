import { socket } from "../socket";
import { trpc } from "../trpc";
import { formatDistanceToNow } from "date-fns";
import { gameJ2, gameState } from "../App";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { IoGameController } from "react-icons/io5";
interface IJoinGamePageProps {
  game: gameState;
  setGame: React.Dispatch<React.SetStateAction<gameState>>;
}

const JoinGamePage = ({ game, setGame }: IJoinGamePageProps) => {
  const { address } = useAccount();
  const { data: joinableGames, refetch } = trpc.joinableGames.useQuery();

  useEffect(() => {
    refetch();
  }, [game]);

  return (
    <div className="w-full h-full flex flex-col text-2xl mt-2 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <IoGameController className="h-6 w-6 text-blue-400" />
          Join a Game
        </h2>
        <p className="text-slate-400 text-base">
          Join an existing game or create your own
        </p>
      </div>

      {!joinableGames || joinableGames?.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-400">No available games</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-inner">
          <table className="w-full table-auto border-collapse bg-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-700 text-slate-300 uppercase text-sm">
              <tr>
                <th className="px-6 py-3">Game ID</th>
                <th className="px-6 py-3">Chain ID</th>
                <th className="px-6 py-3">Stake</th>
                <th className="px-6 py-3">Updated At</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {joinableGames.map((game, index: any) => (
                <tr
                  key={index}
                  className="border-b border-slate-700 hover:bg-slate-700 transition duration-200"
                >
                  <td className="px-6 py-4 text-center text-white">
                    {game.id}
                  </td>
                  <td className="px-6 py-4 text-center text-white">
                    {game.chainId}
                  </td>
                  <td className="px-6 py-4 text-center text-white">
                    {game.stake}
                  </td>
                  <td className="px-6 py-4 text-center text-white">
                    {formatDistanceToNow(new Date(game.updatedAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-5 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                      onClick={() => {
                        if (!address) return;
                        setGame(() => {
                          const newState: gameJ2 = {
                            isThisJ1: false,
                            status: "preJoinChecks",
                            stake: game.stake,
                          };
                          return newState;
                        });
                        socket.emit("joinGame", {
                          gameId: game.id.toString(),
                          j2Address: address,
                        });
                      }}
                    >
                      Join
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JoinGamePage;
