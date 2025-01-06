import { Dispatch, SetStateAction } from "react";
import { socket } from "../socket";
import { trpc } from "../trpc";
import { formatDistanceToNow } from "date-fns";
import { gameState } from "../App";

interface ILandingPageProps {
  setGame: Dispatch<SetStateAction<gameState>>
}

const LandingPage = ({setGame}: ILandingPageProps ) => {
  const { data: joinableGames } = trpc.joinableGames.useQuery();

  return (
    <div className="w-full h-full flex flex-col text-2xl mt-2 justify-center items-center">
      <h1>Join a Game</h1>
      {joinableGames?.length === 0 ? (
        <p>No available games</p>
      ) : (
        <table className="table-auto mt-4">
          <thead>
            <tr>
              <th className="px-8 py-2">Game ID</th>
              <th className="px-8 py-2">Chain ID</th>
              <th className="px-8 py-2">Stake</th>
              <th className="px-8 py-2">Updated At</th>
              <th className="px-8 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {joinableGames?.map((game, index) => (
              <tr key={index} className="border-t">
                <td className="px-8 py-2">{game.id}</td>
                <td className="px-8 py-2">{game.chainId}</td>
                <td className="px-8 py-2">{game.stake}</td>
                <td className="px-8 py-2">
                  {formatDistanceToNow(new Date(game.updatedAt), { addSuffix: true })}
                </td>
                <td className="px-8 py-2">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={(() => {
                      socket.emit("joinGame", { gameId: game.id });
                      setGame((prevGame) => ({
                        ...prevGame,
                        isThisJ1: false,
                        status: "preJoinChecks",
                        stake: game.stake,
                        chainId: game.chainId,
                      }))
                    })}
                  >
                    Join
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LandingPage;