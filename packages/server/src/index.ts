import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@kleros-assignment/shared"
import { JsonRpcProvider } from "ethers";
import deployedBytecode from "./RPSLS.js";
import GamesManager from "./GamesManager.js";
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from "./router";
import cors from 'cors'
import { number } from "zod";


const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});
app.use(cors({ origin: "http://localhost:5173" }))

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistPath = join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));


app.use('/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}), 
    onError: ({ error }) => {
      console.error('tRPC error:', error);
    }
  })
)


const bscProvider = new JsonRpcProvider("https://data-seed-prebsc-1-s2.bnbchain.org:8545");


io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
    const gameId = GamesManager.getInstance().removeGameByJ1SocketId(socket.id)
  })

  socket.on("newGameCreated", (data) => {
    const gameId = data.gameId.toString()
    console.log("new game created", data)
    socket.join(gameId);
    GamesManager.getInstance().addGame({ gameId: gameId, j1SocketId: socket.id })
  })

  socket.on("joinGame", async (data) => {
    console.log("joining game", data)
    const gameId = data.gameId.toString()
    const roomSize = io.sockets.adapter.rooms.get(gameId)?.size || 0;
    console.log("roomSize", roomSize)
    if(!GamesManager.getInstance().gameExists(gameId)){
      socket.emit("joinGameError", { 
        error: "Game Abandoned" 
      });
      return;
    }
    if(roomSize !== 1) {
      socket.emit("joinGameError", { 
        error: "Room is full" 
      });
      return;
    }
    socket.join(gameId);
    GamesManager.getInstance().addJ2SocketIdToGame({ gameId: gameId, j2SocketId: socket.id })
    io.to(gameId).emit("gameStart", { gameId: Number(gameId) });
  })

});

httpServer.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});