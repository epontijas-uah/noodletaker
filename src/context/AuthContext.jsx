import { createContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(localStorage.getItem("username"));
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      connectSocket(savedToken);
    }
  }, []);

  function login(username, receivedToken) {
    localStorage.setItem("username", username);
    localStorage.setItem("token", receivedToken);

    setUser(username);
    setToken(receivedToken);

    connectSocket(receivedToken);
  }

  function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);

    disconnectSocket();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: Boolean(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}