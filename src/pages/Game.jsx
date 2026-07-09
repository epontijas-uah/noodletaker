import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";
import GameCanvas from "../components/GameCanvas";

export default function Game() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }

        const socket = getSocket();
        if (!socket) return;

        // Unirse a una sala de prueba
        socket.emit("join_room", "partida1");

        socket.on("room_update", (players) => {
            console.log("[Sala] Jugadores conectados:", players);
        });

        socket.on("game_action", ({ from, action }) => {
            console.log(`[Acción] ${from}:`, action);
        });

        return () => {
            socket.off("room_update");
            socket.off("game_action");
        };
    }, [user]);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px" }}>
                <span>Jugador: <strong>{user}</strong></span>
                <button onClick={() => { logout(); navigate("/"); }}>Cerrar sesión</button>
            </div>
            <GameCanvas />
        </div>
    );
}