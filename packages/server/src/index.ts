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

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('hello', 'world');
  
  socket.on("j1ready", (data) => {
    console.log("j1ready", data);
  })
});


httpServer.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
