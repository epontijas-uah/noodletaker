import { GROUND_Y } from './constants.js';
import { Platform } from './Platform.js';

// Total level width
export const LEVEL_WIDTH = 4000;
export const FINISH_X = LEVEL_WIDTH - 100;

export function buildLevel() {
  const platforms = [];

  // Ground — split into segments with gaps
  const groundSegments = [
    [0, 600], [650, 400], [1100, 300], [1450, 500],
    [2000, 350], [2400, 400], [2850, 300], [3200, 700],
  ];
  for (const [x, w] of groundSegments) {
    platforms.push(new Platform(x, GROUND_Y, w, 60, '#854d0e'));
  }

  // Floating platforms
  const floaters = [
    [500, GROUND_Y - 100, 120],
    [700, GROUND_Y - 160, 100],
    [900, GROUND_Y - 80,  140],
    [1100, GROUND_Y - 130, 110],
    [1350, GROUND_Y - 90, 130],
    [1600, GROUND_Y - 140, 100],
    [1800, GROUND_Y - 80, 120],
    [2050, GROUND_Y - 120, 110],
    [2250, GROUND_Y - 160, 90],
    [2500, GROUND_Y - 100, 130],
    [2700, GROUND_Y - 140, 100],
    [2900, GROUND_Y - 80, 120],
    [3100, GROUND_Y - 130, 110],
    [3400, GROUND_Y - 100, 150],
    [3600, GROUND_Y - 150, 120],
    [3800, GROUND_Y - 80, 180],
  ];
  for (const [x, y, w] of floaters) {
    platforms.push(new Platform(x, y, w, 16));
  }

  return platforms;
}