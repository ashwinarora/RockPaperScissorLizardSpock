import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';
import NewGame from "./components/NewGame";
import JoinGame from "./components/JoinGame";

export type gameJ1 = {
  isThisJ1: true,
  status: "init" | "j2waiting" | "j2joined" | "contractDeployed" | "j1Claimed",
  j2Address?: string,
  contractAddress?: string,
}

export type gameJ2 = {
  isThisJ1: false,
  status: "j1Ready"| "waitingJ1Deployment" | "j1Deployed",
  stake: string,
  chainId: string,
  contractAddress?: string,
}

export type gameState = gameJ1 | gameJ2;

const App = () => {
  const [game, setGame] = useState<gameState>();

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
          status: "j1Ready",
          stake: status.j1.stake,
          chainId: status.j1.chainId,
        })
      }
    }

    const handleJ2Ready = (data) => {
      setGame((prevGame) => {
        if (!prevGame?.isThisJ1) return prevGame;
        return {
          ...prevGame,
          status: "j2joined",
          j2Address: data.j2Address,
        };
      });
    }

    const handleJ1Deployed = (data) => {
      setGame((prevGame) => {
        if(!prevGame) return prevGame;
        if(prevGame?.isThisJ1) return prevGame;
        return {
          ...prevGame,
          status: "j1Deployed",
          contractAddress: data.contractAddress,
        }
      });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('gameStatus', handleIncomingStatus);
    socket.on('j2Ready', handleJ2Ready)
    socket.on('j1Deployed', handleJ1Deployed)

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('gameStatus', handleIncomingStatus);
      socket.off('j2Ready', handleJ2Ready)
      socket.off('j1Deployed', handleJ1Deployed)
    }
  }, [])

  return (
    <div>
      <Topbar />
      {
        game && game.isThisJ1 && <NewGame  game={game} setGame={setGame} />
      }
      {
        game && !game.isThisJ1 && <JoinGame game={game} setGame={setGame} />
      }
    </div>
  )
}

export default App

// need to make the join game page. Get the stake from the socket and do join. Then emit j2 address. j1 will then get j2 address and then start the game. 
