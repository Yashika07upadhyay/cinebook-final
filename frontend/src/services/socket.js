import { io } from "socket.io-client";

const SOCKET_URL = process.env.CLIENT_URL;

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
