import { io } from 'socket.io-client';

const URL = 
    import.meta.env.MODE  === 'production'
    ? 'kleros-assignment-production.up.railway.app'
    : 'http://localhost:3000';

export const socket = io(URL);