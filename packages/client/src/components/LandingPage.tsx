import { socket } from "../socket";
import { trpc } from "../trpc";
import { formatDistanceToNow } from "date-fns";
import { gameJ2, gameState } from "../App";
import { useAccount } from "wagmi";
import { useEffect } from "react";

interface ILandingPageProps {
  game: gameState,
  setGame: React.Dispatch<React.SetStateAction<gameState>>
}

const LandingPage = ({game, setGame}: ILandingPageProps ) => {
  const { address } = useAccount();
  const { data: joinableGames, refetch } = trpc.joinableGames.useQuery();

  useEffect(() => {
    refetch();
  }, [game])

  console.log(joinableGames?.length);

  return (
    <div className="w-full h-full flex flex-col text-2xl mt-2 justify-center items-center">
      <h1>Join a Game</h1>
      {!joinableGames ||  joinableGames?.length === 0 ? (
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
            {joinableGames.map((game, index) => (
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
                      if(!address) return;
                      setGame(() => {
                        const newState: gameJ2 = {
                          isThisJ1: false,
                          status: "preJoinChecks",
                          stake: game.stake,
                        }
                        return newState
                      })
                      socket.emit("joinGame", {
                        gameId: game.id.toString(),
                        j2Address: address,
                      });
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