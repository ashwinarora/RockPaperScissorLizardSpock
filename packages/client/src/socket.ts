import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from "@kleros-assignment/shared"

export const baseUrl = 
    import.meta.env.MODE  === 'production'
    ? import.meta.env.RAILWAY_PUBLIC_DOMAIN
    : 'http://localhost:3000/';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseUrl, {
    autoConnect: false,
    transports: ['websocket'],
});