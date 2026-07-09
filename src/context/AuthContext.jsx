import { createContext, useContext, useState, useEffect } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Al cargar la app, recuperar sesión guardada
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("username");
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(savedUser);
            connectSocket(savedToken);
        }
    }, []);

    function login(username, token) {
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);
        setToken(token);
        setUser(username);
        connectSocket(token);
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setToken(null);
        setUser(null);
        disconnectSocket();
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}