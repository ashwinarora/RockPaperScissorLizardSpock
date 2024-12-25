import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { Socket } from "node:dgram";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistPath = join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

type player = {
  socketId?: string;
  stake?: string;
  chainId?: string;
  j1Address?: string;
  j2Address?: string;
  move?: string;
}

type gameStatus = 'waiting' | 'j1Ready' | 'j2Ready'

let status: gameStatus= 'waiting'
let gameContract: string = ""

let j1: player = {}
let j2: player = {}

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on("statusRequest", () => {
    socket.emit("gameStatus", {
      status: status,
      j1: j1,
    })
  })

  socket.on("j1Ready", (data) => {
    console.log("j1Ready", data);
    status = 'j1Ready'
    j1 = {...data}
    console.log(j1)
    socket.broadcast.emit("gameStatus", {
      status: status,
      j1: j1,
    });
  })

  socket.on("j2Ready", (data) => {
    if(!j1.socketId) return
    console.log("j2Ready", data);
    j2 = {...data}
    status = 'j2Ready'
    console.log(j2)
    socket.to(j1.socketId).emit("j2Ready", {
      j2Address: data.j2Address,
    });
  })

  socket.on("contractDeployed", (data) => {
    if(!j2.socketId) return
    gameContract = data.contractAddress
    socket.to(j2.socketId).emit("j1Deployed", {
      contractAddress: data.contractAddress,
    });
  })

});


httpServer.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
