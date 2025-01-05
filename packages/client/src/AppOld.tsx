import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';
import NewGame from "./components/NewGame";
import JoinGame from "./components/JoinGame";

export type gameJ1 = {
  isThisJ1: true,
  status: "init" | "j2waiting" | "j2joined" | "contractDeployed" | "j1Claimed" | "j2Played" | "draw" | "j1Won" | "j2Won",
  j2Address?: string,
  contractAddress?: string,
  timedOut?: boolean,
}

export type gameJ2 = {
  isThisJ1: false,
  status: "j1Ready"| "waitingJ1Deployment" | "j1Deployed" | "j2Claimed" | "j2Played" | "draw" | "j1Won" | "j2Won",
  stake: string,
  chainId: string,
  contractAddress?: string,
  solveTx?: string,
  timedOut?: boolean,
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

    const handleJ2Played = () => {
      setGame((prevGame) => {
        if(!prevGame?.isThisJ1) return prevGame;
        return {
          ...prevGame,
          status: "j2Played",
        }
      })
    }

    const handleGameOver = (data) => {
      setGame((prevGame) => {
        if(!prevGame) return prevGame;
        if(prevGame.isThisJ1) {
          return {
            ...prevGame,
            status: "j2Won",
            solveTx: data.solveTxHash,
            timedOut: data.isTimeout
          }
        } else {
          return {
            ...prevGame,
            status: data.winner === "draw" ? "draw" : data.winner === "j1" ? "j1Won" : "j2Won",
            solveTx: data.solveTxHash,
            timedOut: data.isTimeout
          }
        }
      })
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('gameStatus', handleIncomingStatus);
    socket.on('j2Ready', handleJ2Ready)
    socket.on('j1Deployed', handleJ1Deployed)
    socket.on('j2Played', handleJ2Played)
    socket.on('gameOver', handleGameOver)

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('gameStatus', handleIncomingStatus);
      socket.off('j2Ready', handleJ2Ready)
      socket.off('j1Deployed', handleJ1Deployed)
      socket.off('j2Played', handleJ2Played)
      socket.off('gameOver', handleGameOver)
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

// call solve function from NewGame.tsx
