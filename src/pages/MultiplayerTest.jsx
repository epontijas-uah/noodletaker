import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/useAuth";

export default function MultiplayerTest() {
  const { user } = useAuth();

  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const roomId = "partida1";

  useEffect(() => {
    let mounted = true;
    let cleanupFn = null;
    let socket = getSocket();

    const setupHandlers = (socket) => {
      function handleConnect() {
        setConnected(true);
        socket.emit("join_room", roomId);
      }

      function handleDisconnect() {
        setConnected(false);
      }

      function handleRoomUpdate(playersInRoom) {
        console.log("[Sala] Jugadores conectados:", playersInRoom);
        setPlayers(playersInRoom);
      }

      function handleTestMessage(data) {
        setMessages((prev) => [
          ...prev,
          `${data.from}: ${data.message}`
        ]);
      }

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("room_update", handleRoomUpdate);
      socket.on("test_message", handleTestMessage);

      if (socket.connected) {
        handleConnect();
      }

      return () => {
        try {
          socket.emit("leave_room", roomId);
        } catch (e) {}

        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("room_update", handleRoomUpdate);
        socket.off("test_message", handleTestMessage);
      };
    };

    if (!socket) {
      const interval = setInterval(() => {
        socket = getSocket();
        if (socket) {
          clearInterval(interval);
          if (mounted) cleanupFn = setupHandlers(socket);
        }
      }, 100);

      return () => {
        mounted = false;
        clearInterval(interval);
        if (cleanupFn) cleanupFn();
      };
    }

    cleanupFn = setupHandlers(socket);

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, []);

  function sendMessage() {
    const socket = getSocket();

    if (!socket || !text.trim()) return;

    socket.emit("test_message", {
      roomId,
      message: text
    });

    setMessages((prev) => [
      ...prev,
      `Yo: ${text}`
    ]);

    setText("");
  }

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Prueba Multiplayer</h1>

      <p>
        Usuario actual: <strong>{user}</strong>
      </p>

      <p>
        Estado socket:{" "}
        <strong style={{ color: connected ? "green" : "red" }}>
          {connected ? "Conectado" : "Desconectado"}
        </strong>
      </p>

      <h2>Sala: {roomId}</h2>

      <h3>Jugadores conectados</h3>

      <ul>
        {players.map((player) => (
          <li key={player.socketId}>
            {player.username} - {player.socketId}
          </li>
        ))}
      </ul>

      <h3>Chat de prueba</h3>

      <div
        style={{
          border: "1px solid #ccc",
          minHeight: "120px",
          padding: "12px",
          marginBottom: "12px"
        }}
      >
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un mensaje"
      />

      <button onClick={sendMessage}>
        Enviar
      </button>
    </div>
  );
}