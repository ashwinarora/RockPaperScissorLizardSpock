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

type player = {
  socketId?: string;
  stake?: string;
  chainId?: string;
}

const bscProvider = new JsonRpcProvider("https://data-seed-prebsc-1-s2.bnbchain.org:8545");

type gameStatus = 'waiting' | 'j1Ready' | 'j2Ready'

let status: gameStatus= 'waiting' 
let gameContract: string = ""

let j1: player = {}
let j2: player = {}

const cleanup = () => {
  console.log("cleaning up server") 
  status = 'waiting'
  j1 = {}
  j2 = {}
  gameContract = ""
}

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("newGameCreated", (data) => {
    console.log("new game created", data)
    socket.join(data.gameId.toString());
  })

});

httpServer.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});