import { io } from "socket.io-client";

let socket;

export function getRealtimeSocket() {
  if (socket) return socket;

  const url = import.meta.env.DEV ? "http://localhost:5000" : undefined;
  socket = io(url, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socket;
}

