import { useEffect, useState } from "react";
import Topbar from "./components/Topbar"
import { socket } from './socket';
import LandingPage from "./components/LandingPage";
import CreateNewGame from "./components/CreateNewGame";
import J1Game from "./components/J1Game";
import { ServerToClientEvents } from "@kleros-assignment/shared";
import { Bounce, toast, ToastContainer } from "react-toastify";
import J2Game from "./components/J2Game";

export type gameJ1 = {
  isThisJ1: true,
  status: "init" | "j2waiting" | "j2joined" | "contractDeployed" | "j1Claimed" | "j2Played" | "draw" | "j1Won" | "j2Won",
  stake: string,
  gameId?: string,
  j2Address?: string,
  contractAddress?: string,
  timedOut?: boolean,
}

export type gameJ2 = {
  isThisJ1: false,
  status: "preJoinChecks" | "waitingJ1Deployment" | "j1Deployed" | "j2Claimed" | "j2Played" | "draw" | "j1Won" | "j2Won",
  gameId?: string,
  stake: string,
  contractAddress?: string,
  solveTx?: string,
  timedOut?: boolean,
}

export type gameState = gameJ1 | gameJ2;

const initState: gameState = {
  isThisJ1: true,
  status: "init",
  stake: ""
} as const;

const App = () => {
  const [game, setGame] = useState<gameState>({ ...initState});
  console.log(game)

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
    const onGameStart: ServerToClientEvents["gameStart"] = (data) => {
      setGame({
        ...game,
        status: "j2joined",
        gameId: data.gameId,
        j2Address: data.j2Address,
      });
    }

    const handleJ2Played: ServerToClientEvents["j2Played"] = () => {
      setGame((prevGame) => {
        if(!prevGame?.isThisJ1) return prevGame;
        return {
          ...prevGame,
          status: "j2Played",
        }
      })
    }

    const handleGameOver: ServerToClientEvents["gameOver"] = (data) => {
      setGame((prevGame) => {
        if(!prevGame) return prevGame;
        if(!prevGame.isThisJ1)  return prevGame;
        return {
          ...prevGame,
          status: "j2Won",
          solveTx: data.solveTxHash,
          timedOut: data.isTimeout
        }
      })
    }

    socket.on("gameStart", onGameStart);
    socket.on("j2Played", handleJ2Played);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("gameStart", onGameStart);
      socket.off("j2Played", handleJ2Played);
      socket.off("gameOver", handleGameOver);
    }
  }, [game])

  useEffect(() => {
    // setting listerns for only player 2
    if(game.isThisJ1 !== false) return

    const onJoinGameError: ServerToClientEvents["joinGameError"] = (data) => {
      console.log("join game error", data)
      toast.error(data.error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setGame({ ...initState });
    }

    const onGameStart: ServerToClientEvents["gameStart"] = (data) => {
      setGame((prevState) => {
        if(prevState.isThisJ1) return prevState;
        const newState: gameJ2 = {
          ...prevState,
          status: "waitingJ1Deployment",
          gameId: data.gameId,
        }
        return newState;
      })
    }

    const handleJ1Deployed: ServerToClientEvents["j1Deployed"] = (data) => {
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

    const handleGameOver: ServerToClientEvents["gameOver"] = (data) => {
      setGame((prevGame) => {
        if(!prevGame) return prevGame;
        if(prevGame.isThisJ1)  return prevGame;
        return {
          ...prevGame,
          status: data.winner === "draw" ? "draw" : data.winner === "j1" ? "j1Won" : "j2Won",
          solveTx: data.solveTxHash,
          timedOut: data.isTimeout
        }
      })
    }

    socket.on("joinGameError", onJoinGameError);
    socket.on("gameStart", onGameStart);
    socket.on("j1Deployed", handleJ1Deployed);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("joinGameError", onJoinGameError);
      socket.off("gameStart", onGameStart);
      socket.off("j1Deployed", handleJ1Deployed);
      socket.off("gameOver", handleGameOver);
    }
  }, [game])


  return (
    <div>
      <Topbar />
      {
        game.status === "init" && (<>
          <LandingPage game={game} setGame={setGame} />
          <div className="flex my-16 justify-center items-center">
            <hr className="w-1/12 mx-2" />
            <p>Or</p>
            <hr className="w-1/12 mx-2" />
          </div>
          <CreateNewGame game={game} setGame={setGame} />
        </>)
      }
      {
        game.isThisJ1 && game.status !== "init" && 
        (
          <J1Game game={game} setGame={setGame} />
        )
      }
      {
        !game.isThisJ1 && game.status !== "preJoinChecks" && 
        (
          <J2Game game={game} setGame={setGame} />
        )
      }
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  )
}

export default App