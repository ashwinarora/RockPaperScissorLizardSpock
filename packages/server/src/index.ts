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

}

type gameStatus = 'waiting' | 'j1Ready'

let status: gameStatus= 'waiting'

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
});


httpServer.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
