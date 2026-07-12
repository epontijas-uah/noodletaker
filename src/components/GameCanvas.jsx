import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { loadGameAssets } from '../game/assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants.js';
import { useAuth } from '../context/useAuth';
import { getSocket } from '../services/socket';
import './GameCanvas.css';

const ROOM_ID = 'partida1';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [assets, setAssets] = useState(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState('Sin conectar');
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [assignedPlayer, setAssignedPlayer] = useState(null);
  const [localPlayerId, setLocalPlayerId] = useState(1);

  useEffect(() => {
    loadGameAssets()
      .then((loadedAssets) => {
        setAssets(loadedAssets);

        if (canvasRef.current) {
          const tempEngine = new GameEngine(canvasRef.current, loadedAssets, () => {});
          tempEngine._draw();
        }
      })
      .catch((err) => {
        console.error('Error cargando assets:', err);
      });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    let mounted = true;
    let socket = getSocket();
    setMultiplayerStatus('Conectando...');

    const handleConnect = () => {
      if (mounted) {
        setMultiplayerStatus('Conectado');
        socket.emit('join_room', ROOM_ID);
      }
    };

    const handleDisconnect = () => {
      if (mounted) {
        setMultiplayerStatus('Desconectado');
      }
    };

    const handleRoomUpdate = (playersInRoom = []) => {
      if (!mounted) return;

      const normalizedPlayers = playersInRoom.map((player, index) => ({
        ...player,
        socketId: player.socketId ?? player.id ?? player.username ?? `${player.username || 'jugador'}-${index}`,
        joinOrder: player.joinOrder ?? index + 1,
      }));

      setRoomPlayers(normalizedPlayers);

      const socketInstance = getSocket();
      const currentPlayerIndex = normalizedPlayers.findIndex((player) =>
        player.socketId === socketInstance?.id || player.username === user || player.socketId === user
      );

      if (currentPlayerIndex >= 0) {
        const playerEntry = normalizedPlayers[currentPlayerIndex];
        const assignedId = playerEntry.joinOrder;
        setAssignedPlayer({ ...playerEntry, playerId: assignedId });
        setLocalPlayerId(assignedId);
      } else if (normalizedPlayers.length > 0) {
        const fallbackPlayer = normalizedPlayers[0];
        setAssignedPlayer({ ...fallbackPlayer, playerId: fallbackPlayer.joinOrder ?? 1 });
        setLocalPlayerId(fallbackPlayer.joinOrder ?? 1);
      }
    };

    const setupHandlers = () => {
      if (!socket) return;
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('room_update', handleRoomUpdate);

      if (socket.connected) {
        handleConnect();
      }
    };

    if (!socket) {
      const interval = setInterval(() => {
        socket = getSocket();
        if (socket && mounted) {
          clearInterval(interval);
          setupHandlers();
        }
      }, 100);

      return () => {
        mounted = false;
        clearInterval(interval);
        if (socket) {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('room_update', handleRoomUpdate);
        }
      };
    }

    setupHandlers();

    return () => {
      mounted = false;
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('room_update', handleRoomUpdate);
      }
    };
  }, [user]);

  const startGame = () => {
    if (!assets || !canvasRef.current) return;

    engineRef.current?.stop();
    engineRef.current = new GameEngine(canvasRef.current, assets, (res) => {
      setResults(res);
      setStatus('finished');
    }, { localPlayerId });
    setStatus('playing');
    setResults([]);
    engineRef.current.start();
  };

  useEffect(() => {
    if (status !== 'playing' || !engineRef.current) return;

    const socket = getSocket();
    if (!socket) return;

    let syncInterval = null;
    let lastEmittedState = null;

    const handleRemotePlayerMove = (data) => {
      const playerId = data?.playerId ?? data?.player?.id;
      const state = data?.state ?? data?.position;

      if (engineRef.current && playerId !== undefined && playerId !== localPlayerId) {
        console.log('[Sync] Recibido movimiento de jugador', playerId, state);
        engineRef.current.updateRemotePlayer(playerId, state);
      }
    };

    socket.on('player_move', handleRemotePlayerMove);
    socket.on('player_moved', handleRemotePlayerMove);

    syncInterval = setInterval(() => {
      if (engineRef.current) {
        const state = engineRef.current.getLocalPlayerState();
        if (state && JSON.stringify(state) !== JSON.stringify(lastEmittedState)) {
          lastEmittedState = state;
          console.log('[Sync] Emitiendo movimiento local', state);
          socket.emit('player_move', {
            roomId: ROOM_ID,
            playerId: localPlayerId,
            state,
          });
        }
      }
    }, 30);

    return () => {
      if (syncInterval) clearInterval(syncInterval);
      socket.off('player_move', handleRemotePlayerMove);
    };
  }, [status, localPlayerId]);

  return (
    <div className="canvas-wrapper">
      <div style={{ marginBottom: '12px', color: '#000000' }}>
        <p style={{ margin: '0 0 6px' }}>
          Conexión: <strong>{multiplayerStatus}</strong>
        </p>
        <p style={{ margin: '0 0 6px' }}>
          {assignedPlayer
            ? `Controlas el personaje ${assignedPlayer.playerId} (${assignedPlayer.username || 'Jugador'})`
            : 'Esperando asignación de personaje...'}
        </p>
        <p style={{ margin: '0' }}>
          Sala: <strong>{ROOM_ID}</strong>
        </p>
        <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
          {roomPlayers.map((player) => (
            <li key={player.socketId}>
              {player.username || 'Jugador'} · personaje {player.joinOrder}
            </li>
          ))}
        </ul>
      </div>

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="game-canvas" />

      {status === 'idle' && (
        <div className="overlay">
          <button onClick={startGame}>▶ Iniciar</button>
        </div>
      )}

      {status === 'finished' && (
        <div className="overlay">
          <p>¡Carrera terminada!</p>
          {results.map((p, i) => (
            <p key={p.id}>{i === 0 ? '🥇' : '🥈'} {p.label}</p>
          ))}
          <button onClick={startGame}>Jugar de nuevo</button>
        </div>
      )}
    </div>
  );
}