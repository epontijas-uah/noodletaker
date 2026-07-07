import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { loadGameAssets } from '../game/assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants.js';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | playing | finished
  const [results, setResults] = useState([]);
  const [assets, setAssets] = useState(null);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Carga los assets una sola vez al montar el componente
  useEffect(() => {
    loadGameAssets()
      .then(loaded => {
        setAssets(loaded);
        setLoadingAssets(false);
      })
      .catch(err => {
        console.error('Error cargando assets:', err);
        setLoadingAssets(false); // Continúa sin assets (fallback)
      });
  }, []);

  const startGame = () => {
    if (engineRef.current) engineRef.current.stop();
    const engine = new GameEngine(canvasRef.current, assets, (res) => {
      setResults(res);
      setStatus('finished');
    });
    engineRef.current = engine;
    setStatus('playing');
    setResults([]);
    engine.start();
  };

  useEffect(() => () => engineRef.current?.stop(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Controls legend */}
      <div style={{ display: 'flex', gap: 32, color: '#94a3b8', fontSize: 13 }}>
        <span>🟣 <b>P1:</b> A / D / W</span>
        <span>🔴 <b>P2:</b> ← / → / ↑</span>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ border: '2px solid #334155', borderRadius: 8, display: 'block' }}
        />

        {/* Overlay: cargando assets */}
        {loadingAssets && (
          <div style={overlayStyle}>
            <p style={{ color: '#94a3b8', fontSize: 16 }}>⏳ Cargando assets...</p>
          </div>
        )}

        {/* Overlay: idle */}
        {!loadingAssets && status === 'idle' && (
          <div style={overlayStyle}>
            <h2 style={{ color: 'white', marginBottom: 8 }}>🏃 Platform Racer</h2>
            <p style={{ color: '#94a3b8', marginBottom: 20 }}>¡Llega primero a la meta!</p>
            <button onClick={startGame} style={btnStyle}>▶ Iniciar carrera</button>
          </div>
        )}

        {/* Overlay: finished */}
        {status === 'finished' && (
          <div style={overlayStyle}>
            <h2 style={{ color: '#fbbf24', marginBottom: 12 }}>🏁 ¡Carrera terminada!</h2>
            {results.map((p, i) => (
              <p key={p.id} style={{ color: i === 0 ? '#fbbf24' : '#94a3b8', fontSize: 18, margin: 4 }}>
                {i === 0 ? '🥇' : '🥈'} {p.label} — {i === 0 ? '¡Ganador!' : '2º lugar'}
              </p>
            ))}
            <button onClick={startGame} style={{ ...btnStyle, marginTop: 16 }}>🔄 Jugar de nuevo</button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'absolute', inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  borderRadius: 8,
};

const btnStyle = {
  padding: '10px 28px', fontSize: 16, fontWeight: 'bold',
  background: '#6366f1', color: 'white', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};