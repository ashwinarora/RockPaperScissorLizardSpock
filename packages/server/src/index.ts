import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// const __dirname = dirname(fileURLToPath(import.meta.url));

io.on('connection', (socket) => {
  socket.emit('hello', 'world');
});

httpServer.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
