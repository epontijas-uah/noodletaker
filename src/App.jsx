import GameCanvas from './components/GameCanvas';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: 20,
    }}>
      <h1 style={{ color: 'white', marginBottom: 24, fontSize: 28 }}>
        🎮 Platform Racer
      </h1>
      <GameCanvas />
    </div>
  );
}