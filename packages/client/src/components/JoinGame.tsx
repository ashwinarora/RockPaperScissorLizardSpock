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
    <div className="w-full h-full flex flex-col text-2xl mt-2 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg p-6 max-w-5xl mx-auto">
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
        <div className="rounded-lg shadow-inner">
          <table className="w-full min-w-0 table-fixed border-collapse bg-slate-800 rounded-lg">
            <thead className="bg-slate-700 text-slate-300 uppercase text-xs sm:text-sm">
              <tr>
                <th className="px-4 py-2">Game ID</th>
                <th className="px-4 py-2">Chain ID</th>
                <th className="px-4 py-2">Stake</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {joinableGames.map((game, index: any) => (
                <tr
                  key={index}
                  className="border-b border-slate-700 hover:bg-slate-700 transition duration-200"
                >
                  <td className="px-2 py-3 text-center text-white text-sm sm:text-base">
                    {game.id}
                  </td>
                  <td className="px-2 py-3 text-center text-white text-sm sm:text-base">
                    {game.chainId}
                  </td>
                  <td className="px-4 py-3 text-center text-white text-sm sm:text-base max-w-[50px] truncate break-words">
                    {game.stake}
                  </td>
                  <td className="px-4 py-3 text-center text-white text-sm sm:text-base">
                    {formatDistanceToNow(new Date(game.updatedAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
                      onClick={() => {
                        if (!address) return;
                        setGame(() => ({
                          isThisJ1: false,
                          status: "preJoinChecks",
                          stake: game.stake,
                        }));
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
