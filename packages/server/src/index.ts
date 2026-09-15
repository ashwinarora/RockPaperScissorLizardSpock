import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@rpsls/shared"
import { JsonRpcProvider } from "ethers";
import deployedBytecode from "./RPSLS.js";
import GamesManager from "./GamesManager.js";
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from "./router.js";
import cors from 'cors'


const app = express();
const httpServer = createServer(app);
const devOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
const allowedOrigins = publicDomain
  ? [...devOrigins, `https://${publicDomain}`]
  : devOrigins;
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: allowedOrigins,
  },
});
app.use(cors({ origin: allowedOrigins }))

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
    const gameId = GamesManager.getInstance().handleDisconnect(socket.id)
  })

  socket.on("reconnectGame", async (data) => {
    console.log("reconnect attempt")
    const success = await GamesManager.getInstance().handleReconnection({...data, socketId: socket.id})
    socket.emit("reconnectGameSuccess", { success })
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
        error: "Game was Abandoned" 
      });
      await GamesManager.getInstance().markGameAsAbandoned(gameId)
      return;
    }
    if(roomSize !== 1) {
      socket.emit("joinGameError", { 
        error: "Room is full" 
      });
      return;
    }
    socket.join(gameId);
    GamesManager.getInstance().addJ2SocketIdToGame({ gameId: gameId, j2SocketId: socket.id, j2Address: data.j2Address })
    console.log("starting game ", gameId)
    io.to(gameId).emit("gameStart", {
      gameId: gameId,
      j2Address: data.j2Address
    });
  })

  socket.on("contractDeployed", async (data) => {
    const result = await GamesManager.getInstance().setGameContractAddress({ gameId: data.gameId, contractAddress: data.contractAddress })
    const gameSockets = GamesManager.getInstance().getSocketsOf(data.gameId);
    if(!gameSockets) return;
    // checking correct contract is deployed
    // currently only checking for bscTestnet chain 97
    if(result?.chainId === "97") {
      const bytecode = await bscProvider.getCode(data.contractAddress);
      if(bytecode && bytecode !== deployedBytecode) {
        io.to(data.gameId).emit("gameOver", {
          winner: "draw",
          isTimeout: true,
          solveTxHash: "",
        });
      }
    }
    socket.to(gameSockets.j2SocketId).emit("j1Deployed", {
      contractAddress: data.contractAddress,
    });
  })

  socket.on("j2Played", async (data) => {
    await GamesManager.getInstance().setJ2Played(data.gameId)
    const gameSockets = GamesManager.getInstance().getSocketsOf(data.gameId);
    if(!gameSockets) return;
    socket.to(gameSockets.j1SocketId).emit("j2Played")
  })

  socket.on("gameOver", (data) => {
    const gameSockets = GamesManager.getInstance().getSocketsOf(data.gameId);
    if(!gameSockets) return;
    if(gameSockets.j1SocketId === socket.id){
      socket.to(gameSockets.j2SocketId).emit("gameOver", data)
    } else if(gameSockets.j2SocketId === socket.id) {
      socket.to(gameSockets.j1SocketId).emit("gameOver", data)
    }
    GamesManager.getInstance().finalizeGame(data)
  })

});

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => {
  console.log(`server running on port ${port}`);
});