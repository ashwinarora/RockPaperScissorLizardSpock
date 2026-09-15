import type { ClientToServerEvents, ServerToClientEvents } from "@rpsls/shared";
import { type Socket, io } from "socket.io-client";

export const baseUrl =
  import.meta.env.MODE === "production" ? import.meta.env.RAILWAY_PUBLIC_DOMAIN : "http://localhost:3000/";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseUrl, {
  autoConnect: false,
  transports: ["websocket"],
});
