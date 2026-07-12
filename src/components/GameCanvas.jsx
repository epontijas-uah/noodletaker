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
  const [localReady, setLocalReady] = useState(false);
  const [waitingForOther, setWaitingForOther] = useState(false);

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

  const beginGame = () => {
    if (!assets || !canvasRef.current) return;

    engineRef.current?.stop();
    engineRef.current = new GameEngine(canvasRef.current, assets, (res) => {
      setResults(res);
      setStatus('finished');

      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('game_finished', {
          roomId: ROOM_ID,
          playerId: localPlayerId,
          results: res,
        });
      }
    }, { localPlayerId });

    setStatus('playing');
    setResults([]);
    setWaitingForOther(false);
    engineRef.current.start();
  };

  const requestStart = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    setLocalReady(true);
    setWaitingForOther(true);
    setStatus('waiting');

    socket.emit('player_ready', {
      roomId: ROOM_ID,
      playerId: localPlayerId,
    });
  };

  const requestRestart = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    setStatus('waiting');
    setLocalReady(true);
    setWaitingForOther(true);
    socket.emit('restart_game', { roomId: ROOM_ID });
  };

  useEffect(() => {
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

    const handleGameFinished = (data) => {
      if (!data?.results) return;
      console.log('[Sync] Partida terminada por jugador', data.playerId);
      if (engineRef.current) {
        engineRef.current.stop();
      }
      setResults(data.results);
      setStatus('finished');
      setLocalReady(false);
      setWaitingForOther(false);
    };

    const handleRestartGame = () => {
      console.log('[Sync] Reiniciar partida remoto');
      setLocalReady(false);
      setWaitingForOther(false);
      beginGame();
    };

    const handleGameStarted = () => {
      console.log('[Sync] Partida iniciada');
      setLocalReady(false);
      setWaitingForOther(false);
      beginGame();
    };

    socket.on('player_move', handleRemotePlayerMove);
    socket.on('player_moved', handleRemotePlayerMove);
    socket.on('game_finished', handleGameFinished);
    socket.on('restart_game', handleRestartGame);
    socket.on('game_started', handleGameStarted);

    if (status === 'playing') {
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
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval);
      socket.off('player_move', handleRemotePlayerMove);
      socket.off('player_moved', handleRemotePlayerMove);
      socket.off('game_finished', handleGameFinished);
      socket.off('restart_game', handleRestartGame);
      socket.off('game_started', handleGameStarted);
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
          <button onClick={requestStart} disabled={localReady}>
            ▶ Iniciar
          </button>
        </div>
      )}
      {status === 'waiting' && (
        <div className="overlay">
          <p>Preparado, esperando al otro jugador...</p>
        </div>
      )}

      {status === 'finished' && (
        <div className="overlay">
          <p>¡Carrera terminada!</p>
          {results.map((p, i) => (
            <p key={p.id}>{i === 0 ? '🥇' : '🥈'} {p.label}</p>
          ))}
          <button onClick={requestRestart}>Jugar de nuevo</button>
        </div>
      )}
    </div>
  );
}