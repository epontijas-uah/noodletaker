export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const GRAVITY = 0.65;
export const JUMP_FORCE = -14;
export const GROUND_Y = 610;

export const PLAYERS_CONFIG = [
  {
    id: 1,
    label: 'P1',
    spriteKey: 'p1',
    x: 120,
    controls: { left: 'a', right: 'd', jump: 'w' },
  },
  {
    id: 2,
    label: 'P2',
    spriteKey: 'p2',
    x: 200,
    controls: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp' },
  },
];