import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';
import LandingPage from "./components/LandingPage";
import CreateNewGame from "./components/CreateNewGame";
import J1Game from "./components/J1Game";

export type gameJ1 = {
  status: "init" | "j2waiting" | "j2joined" | "contractDeployed" | "j1Claimed" | "j2Played" | "draw" | "j1Won" | "j2Won",
  isThisJ1?: true,
  gameId?: number,
  j2Address?: string,
  contractAddress?: string,
  timedOut?: boolean,
}

export type gameJ2 = {
  status: "init" | "j1Ready"| "waitingJ1Deployment" | "j1Deployed" | "j2Claimed" | "j2Played" | "draw" | "j1Won" | "j2Won",
  isThisJ1: false,
  stake: string,
  chainId: string,
  contractAddress?: string,
  solveTx?: string,
  timedOut?: boolean,
}

export type gameState = gameJ1 | gameJ2;

const App = () => {
  const [game, setGame] = useState<gameState>({
    status: "init",
  });

  useEffect(() => {
    const onConnect = () => {
      console.log("connected");
    }
    
    const onDisconnect = () => {
      console.log("disconnected");
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    }
  }, [])


  useEffect(() => {
    // setting listerns for only player 1
    if(game.isThisJ1 !== true) return
  }, [game])

  useEffect(() => {
    // setting listerns for only player 2
    if(game.isThisJ1 !== false) return
  }, [game])


  return (
    <div>
      <Topbar />
      {
        game.status === "init" && (<>
          <LandingPage />
          <div className="flex my-16 justify-center items-center">
            <hr className="w-1/12 mx-2" />
            <p>Or</p>
            <hr className="w-1/12 mx-2" />
          </div>
          <CreateNewGame setGame={setGame} />
        </>)
      }
      {
        game.status === "j2waiting" && (
          <J1Game game={game} setGame={setGame} />
        )
      }
    </div>
  )
}

export default App