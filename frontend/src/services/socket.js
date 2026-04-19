import { io } from "socket.io-client";

const SOCKET_URL = "https://cinebookfinal.onrender.com/";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
