import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import GameCanvas from "../components/GameCanvas";

export default function Game() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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