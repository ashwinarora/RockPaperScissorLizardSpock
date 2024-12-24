import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';
import NewGame from "./components/NewGame";

export type gameJ1 = {
  isThisJ1: true,
  status: "init" | "j2waiting" | "j2joined" 
}

type gameState2 = {
  isThisJ1: false,
  status: "j1Ready"
}

export type gameState = gameJ1 | gameState2;

const App = () => {
  // const [isConnected, setIsConnected] = useState(false);
  const [game, setGame] = useState<gameState>();
  const [j2Address, setJ2Address] = useState("0xE825A421ecB2AaD71215773F4f4b753FaCbfbd07");

  useEffect(() => {
    const onConnect = () => {
      console.log("connected");
      socket.emit('statusRequest');
    }
    
    const onDisconnect = () => {
      console.log("disconnected");
    }

    const handleIncomingStatus = (status) => {
      console.log(status)
      if(status.status === "waiting") {
        setGame({ isThisJ1: true, status: "init" });
      }
      if(status.status === "j1Ready") {
        setGame({
          isThisJ1: false,
          status: "j1Ready"
        })
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('gameStatus', handleIncomingStatus);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    }
  }, [])

  return (
    <div>
      <Topbar />
      {
        game && game.isThisJ1 && <NewGame j2Address={j2Address} game={game} setGame={setGame} />
      }
      {
        game && !game.isThisJ1 && <div className="">Game is ready</div>
      }
    </div>
  )
}

export default App
