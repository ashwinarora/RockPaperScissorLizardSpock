import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from "@kleros-assignment/shared"

const URL = 
    import.meta.env.MODE  === 'production'
    ? 'kleros-assignment-production.up.railway.app'
    : 'http://localhost:3000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL);