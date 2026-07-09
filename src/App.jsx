import GameCanvas from './components/GameCanvas';
import './App.css';

export default function App() {
  return (
    <div className="app-wrapper">
      <h1 className="app-title">🍜 Noodletaker</h1>
      <p className="app-subtitle">
        <span className="p1">P1: A / D / W</span>
      </p>
      <p className="app-subtitle">
        <span className="p2">P2: ← / → / ↑</span>
      </p>
      <GameCanvas />
    </div>
  );
}