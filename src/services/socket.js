import { io } from "socket.io-client";

const MULTIPLAYER_URL = "http://localhost:4000";

let socket = null;

export function getSocket() {
    return socket;
}

export function connectSocket(token) {
    if (socket) socket.disconnect();

    socket = io(MULTIPLAYER_URL, {
        autoConnect: false,
        auth: { token }
    });

    socket.connect();

    socket.on("connect", () => {
        console.log("[Socket] Conectado al multiplayer-service");
    });

    socket.on("connect_error", (err) => {
        console.error("[Socket] Error de conexión:", err.message);
    });

    socket.on("disconnect", () => {
        console.log("[Socket] Desconectado");
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}