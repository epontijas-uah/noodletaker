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
    console.log("1. Montando GameCanvas...");  
      
    loadGameAssets()  
      .then(loadedAssets => {  
        console.log("2. Assets cargados con éxito:", loadedAssets);  
        setAssets(loadedAssets);  
          
        // Dibujado inicial para que no se vea vacío  
        if (canvasRef.current) {  
          const tempEngine = new GameEngine(canvasRef.current, loadedAssets, () => {});  
          tempEngine._draw();  
        }  
      })  
      .catch(err => {  
        console.error("X. ERROR CARGANDO ASSETS:", err);  
      });  
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