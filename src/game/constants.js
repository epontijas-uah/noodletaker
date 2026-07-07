export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.65;
export const JUMP_FORCE = -14;
export const GROUND_Y = 610;

export const GAME_WIDTH = 900;  // coordenadas internas del juego
export const GAME_HEIGHT = 650;

export const PLAYERS_CONFIG = [
  {
    id: 1, label: 'P1', color: '#a78bfa', x: 120,
    controls: { left: 'a', right: 'd', jump: 'w' },
  },
  {
    id: 2, label: 'P2', color: '#f87171', x: 200,
    controls: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp' },
  },
];