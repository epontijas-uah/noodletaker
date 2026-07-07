import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { loadGameAssets } from '../game/assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants.js';
import './GameCanvas.css';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [assets, setAssets] = useState(null);

  useEffect(() => {
    loadGameAssets().then(a => {
      setAssets(a);
      // Dibuja el estado inicial del canvas una vez cargados los assets
      const engine = new GameEngine(canvasRef.current, a, () => {});
      engine.drawStatic();
    }).catch(() => {});
  }, []);

  const startGame = () => {
    engineRef.current?.stop();
    engineRef.current = new GameEngine(canvasRef.current, assets, res => {
      setResults(res);
      setStatus('finished');
    });
    setStatus('playing');
    setResults([]);
    engineRef.current.start();
  };

  useEffect(() => () => engineRef.current?.stop(), []);

  return (
    <div className="canvas-wrapper">
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