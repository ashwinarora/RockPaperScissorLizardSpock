import type { ServerToClientEvents } from "@rpsls/shared";
import { useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Bounce, toast } from "react-toastify";
import { useAccount } from "wagmi";
import Footer from "./components/Footer";
import Topbar from "./components/Topbar";
import { HowToPlayScreen } from "./components/screens/HowToPlayScreen";
import { J1GameScreen } from "./components/screens/J1GameScreen";
import { J2GameScreen } from "./components/screens/J2GameScreen";
import { Lobby } from "./components/screens/Lobby";
import { ReconnectScreen } from "./components/screens/ReconnectScreen";
import { AppToastContainer } from "./components/ui/Toast";
import type { Move } from "./lib/game";
import { socket } from "./socket";

export type gameJ1 = {
  isThisJ1: true;
  status:
    | "reconnect"
    | "init"
    | "j2waiting"
    | "j2joined"
    | "contractDeployed"
    | "j1Claimed"
    | "j2Played"
    | "draw"
    | "j1Won"
    | "j2Won";
  stake: string;
  gameId?: string;
  move?: Move;
  salt?: string;
  j2Address?: string;
  contractAddress?: string;
  timedOut?: boolean;
  solveTx?: string;
};

export type gameJ2 = {
  isThisJ1: false;
  status:
    | "reconnect"
    | "preJoinChecks"
    | "waitingJ1Deployment"
    | "j1Deployed"
    | "j2Claimed"
    | "j2Played"
    | "draw"
    | "j1Won"
    | "j2Won";
  gameId?: string;
  move?: Move;
  stake: string;
  contractAddress?: string;
  solveTx?: string;
  timedOut?: boolean;
};

export type gameState = gameJ1 | gameJ2;

const initState: gameState = {
  isThisJ1: true,
  status: "init",
  stake: "",
} as const;

const storageKey = "gameState";

const getInitState = (): gameState => {
  const storedData = localStorage.getItem(storageKey);
  if (!storedData) return initState;
  const parsedData = JSON.parse(storedData);
  if (parsedData.status === "init") return initState;
  if (parsedData)
    return {
      isThisJ1: parsedData.isThisJ1,
      status: "reconnect",
      stake: parsedData.stake,
    };
  return initState;
};

const App = () => {
  const [game, setGame] = useState<gameState>(getInitState());
  const { address } = useAccount();

  const clearStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, []);

  const resetToLobby = useCallback(() => {
    clearStorage();
    setGame(initState);
  }, [clearStorage]);

  useEffect(() => {
    // Clear only terminal / pre-persistence states. j2waiting persists so the
    // host can reconnect after a refresh while waiting for a challenger.
    if (["preJoinChecks", "draw", "j1Won", "j2Won"].includes(game.status)) return clearStorage();
    if (game.status === "reconnect") return;
    const dataToStore = JSON.stringify({ ...game });
    localStorage.setItem(storageKey, dataToStore);
  }, [game, clearStorage]);

  useEffect(() => {
    const onConnect = () => {
      if (!address) return;
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return;
      const parsedData = JSON.parse(storedData);
      if (parsedData.status === "init") return;
      if (!parsedData?.gameId) return clearStorage();
      socket.emit("reconnectGame", {
        gameId: parsedData.gameId,
        playerAddress: address,
        isPlayer1: parsedData.isThisJ1,
      });
    };

    const handleReconnect: ServerToClientEvents["reconnectGameSuccess"] = (data) => {
      if (!data.success) {
        clearStorage();
        setGame(initState);
        return;
      }
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return;
      const parsedData = JSON.parse(storedData);
      setGame(parsedData);
    };

    socket.on("connect", onConnect);
    socket.on("reconnectGameSuccess", handleReconnect);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("reconnectGameSuccess", handleReconnect);
    };
  }, [address, clearStorage]);

  useEffect(() => {
    if (game.isThisJ1 !== true) return;
    const onGameStart: ServerToClientEvents["gameStart"] = (data) => {
      setGame({
        ...game,
        status: "j2joined",
        gameId: data.gameId,
        j2Address: data.j2Address,
      });
    };

    const handleJ2Played: ServerToClientEvents["j2Played"] = () => {
      setGame((prev) => {
        if (!prev?.isThisJ1) return prev;
        return { ...prev, status: "j2Played" };
      });
    };

    const handleGameOver: ServerToClientEvents["gameOver"] = (data) => {
      setGame((prev) => {
        if (!prev) return prev;
        if (!prev.isThisJ1) return prev;
        return {
          ...prev,
          status: data.winner === "draw" ? "draw" : data.winner === "j1" ? "j1Won" : "j2Won",
          solveTx: data.solveTxHash,
          timedOut: data.isTimeout,
        };
      });
    };

    socket.on("gameStart", onGameStart);
    socket.on("j2Played", handleJ2Played);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("gameStart", onGameStart);
      socket.off("j2Played", handleJ2Played);
      socket.off("gameOver", handleGameOver);
    };
  }, [game]);

  useEffect(() => {
    if (game.isThisJ1 !== false) return;

    const onJoinGameError: ServerToClientEvents["joinGameError"] = (data) => {
      toast.error(data.error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        transition: Bounce,
      });
      setGame({ ...initState });
    };

    const onGameStart: ServerToClientEvents["gameStart"] = (data) => {
      setGame((prev) => {
        if (prev.isThisJ1) return prev;
        const newState: gameJ2 = {
          ...prev,
          status: "waitingJ1Deployment",
          gameId: data.gameId,
        };
        return newState;
      });
    };

    const handleJ1Deployed: ServerToClientEvents["j1Deployed"] = (data) => {
      setGame((prev) => {
        if (!prev) return prev;
        if (prev?.isThisJ1) return prev;
        return {
          ...prev,
          status: "j1Deployed",
          contractAddress: data.contractAddress,
        };
      });
    };

    const handleGameOver: ServerToClientEvents["gameOver"] = (data) => {
      setGame((prev) => {
        if (!prev) return prev;
        if (prev.isThisJ1) return prev;
        return {
          ...prev,
          status: data.winner === "draw" ? "draw" : data.winner === "j1" ? "j1Won" : "j2Won",
          solveTx: data.solveTxHash,
          timedOut: data.isTimeout,
        };
      });
    };

    socket.on("joinGameError", onJoinGameError);
    socket.on("gameStart", onGameStart);
    socket.on("j1Deployed", handleJ1Deployed);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("joinGameError", onJoinGameError);
      socket.off("gameStart", onGameStart);
      socket.off("j1Deployed", handleJ1Deployed);
      socket.off("gameOver", handleGameOver);
    };
  }, [game]);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">
        <Routes>
          <Route path="/how-to-play" element={<HowToPlayScreen />} />
          <Route
            path="*"
            element={
              <>
                {game.status === "reconnect" && <ReconnectScreen />}
                {game.status === "init" && <Lobby game={game} setGame={setGame} />}
                {game.isThisJ1 && game.status !== "init" && game.status !== "reconnect" && (
                  <J1GameScreen game={game} setGame={setGame} onPlayAgain={resetToLobby} />
                )}
                {!game.isThisJ1 && game.status !== "preJoinChecks" && game.status !== "reconnect" && (
                  <J2GameScreen game={game} setGame={setGame} onPlayAgain={resetToLobby} />
                )}
              </>
            }
          />
        </Routes>
      </main>
      <Footer />
      <AppToastContainer />
    </div>
  );
};

export default App;
