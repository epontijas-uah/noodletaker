import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/api";
import { useAuth } from "../context/useAuth";

export default function Login() {
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState(""); // Cambiado de password a pin
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        try {
            // Pasamos 'pin' a la función de la API
            const data = await loginUser(username, pin); 
            login(username, data.token);
            navigate("/game");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setError("");
        try {
            await registerUser(username, pin);
            const data = await loginUser(username, pin);
            login(username, data.token);
            navigate("/game");
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "100px" }}>
            <h1>NOODLETAKER</h1>
            <form style={{ display: "flex", flexDirection: "column", gap: "10px", width: "250px" }}>
                <input
                    placeholder="Usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="PIN (4 dígitos)" // Cambiado el placeholder
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                />
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button onClick={handleLogin}>Iniciar sesión</button>
                <button onClick={handleRegister}>Registrarse</button>
            </form>
        </div>
    );
}