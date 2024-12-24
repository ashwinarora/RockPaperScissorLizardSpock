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
  status: "something"
}

export type gameState = gameJ1 | gameState2;

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isThisJ1, setIsThisJ1] = useState(true);
  const [game, setGame] = useState<gameState>({ isThisJ1: true, status: "init" });
  const [j2Address, setJ2Address] = useState("0xE825A421ecB2AaD71215773F4f4b753FaCbfbd07");

  console.log("isConnected", isConnected);

  useEffect(() => {
    const onConnect = () => {
      console.log("connected");
      setIsConnected(true);
    }
    const onDisconnect = () => {
      setIsConnected(false);
    }
    const onHello = (data: any) => {
      console.log('hello', data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('hello', onHello);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('hello', onHello);

    }
  }, [])

  return (
    <div>
      <Topbar />
      {
        game.isThisJ1 && <NewGame j2Address={j2Address} game={game} />
      }
    </div>
  )
}

export default App
