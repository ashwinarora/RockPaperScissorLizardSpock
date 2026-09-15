import type { ClientToServerEvents, ServerToClientEvents } from "@rpsls/shared";
import { type Socket, io } from "socket.io-client";

export const baseUrl = import.meta.env.MODE === "production" ? window.location.origin : "http://localhost:3000/";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseUrl, {
  autoConnect: false,
  transports: ["websocket"],
});
