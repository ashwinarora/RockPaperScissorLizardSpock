import { socket } from "../socket";
import { trpc } from "../trpc";
import { formatDistanceToNow } from "date-fns";
import { gameState } from "../App";
import { useAccount } from "wagmi";
import { useEffect } from "react";
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
    <div className="w-full max-w-5xl bg-[#0A183A] rounded-xl p-6 flex flex-col items-centerr  shadow-lg  mx-auto border border-[#089BFB]">
      <div className="w-full max-w-5xl bg-[#0A183A]rounded-xl p-6 py-5 flex flex-col items-center">
        <div className="mb-4">
          <img src="/assets/gamebar.svg" alt="" />
        </div>
        <h2 className="text-3xl font-bold text-[#0e90ff] mb-2">Join a Game</h2>
        <p className="text-gray-300 mb-8">
          Join an existing game or create Your own New game
        </p>
      </div>

      {!joinableGames || joinableGames?.length === 0 ? (
        <div className="w-full bg-slate-950 border border-blue-900  rounded-3xl p-4 text-center">
          <p className="text-[#0898FB] text-xl opacity-1 font-semibold rounded ">
            No Games Available
          </p>
        </div>
      ) : (
        <div className="rounded-3xl shadow-inner overflow-hidden border border-blue-900 mx-12">
          <table className="w-full min-w-0 table-auto bg-slate-800 rounded-3xl  ">
            <thead className="bg-[#0A183A] text-slate-300 uppercase text-xs sm:text-sm rounded-3xl">
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
                  className="border-b bg-slate-950 border-slate-700  transition duration-200"
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
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
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
