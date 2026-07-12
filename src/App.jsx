import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider} from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Game from "./pages/Game";
import MultiplayerTest from "./pages/MultiplayerTest";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />

          <Route
            path="/multiplayer-test"
            element={
              <ProtectedRoute>
                <MultiplayerTest />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}