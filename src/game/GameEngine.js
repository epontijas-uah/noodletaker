import { PLAYERS_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { Player } from './Player.js';
import { buildLevel, LEVEL_WIDTH, FINISH_X } from './levels.js';

export class GameEngine {
  constructor(canvas, assets, onFinish) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.onFinish = onFinish;
    this.keys = {};
    this.players = PLAYERS_CONFIG.map(cfg => new Player(cfg));
    this.platforms = buildLevel();
    this.cameraX = 0;
    this.animId = null;
    this.started = false;
    this.results = [];

    this._handleKey = this._handleKey.bind(this);
  }

  start() {
    this.started = true;
    window.addEventListener('keydown', e => { this.keys[e.key] = true; e.preventDefault(); });
    window.addEventListener('keyup',   e => { this.keys[e.key] = false; });
    this._loop();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this._handleKey);
    window.removeEventListener('keyup', this._handleKey);
  }

  _handleKey(e) { /* handled inline above */ }

  _loop() {
    this._update();
    this._draw();

    // Check finish
    const finished = this.players.filter(p => p.finished);
    if (finished.length === this.players.length && this.results.length === 0) {
      this.results = [...finished].sort((a, b) => a.finishTime - b.finishTime);
      this.onFinish(this.results);
      return;
    }
    if (finished.length === 1 && this.results.length === 0) {
      // First player finished — keep going until all finish or timeout
    }

    this.animId = requestAnimationFrame(() => this._loop());
  }

  _update() {
    for (const player of this.players) {
      player.update(this.keys, this.platforms, FINISH_X);
    }
    // Camera follows the leading player
    const leadX = Math.max(...this.players.map(p => p.x));
    const targetCam = leadX - CANVAS_WIDTH * 0.35;
    this.cameraX = Math.max(0, Math.min(targetCam, LEVEL_WIDTH - CANVAS_WIDTH));
  }

  _draw() {
    const ctx = this.ctx;
    // Sky gradient
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars (static)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + this.cameraX * 0.05) % CANVAS_WIDTH);
      const sy = (i * 53) % 200;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Platforms
    for (const plat of this.platforms) plat.draw(ctx, this.cameraX);

    // Finish line
    const fx = FINISH_X - this.cameraX;
    if (fx > -200 && fx < CANVAS_WIDTH + 200) {
      if (this.assets?.finishLine) {
        const img = this.assets.finishLine;
        const height = 220;
        const width = img.width * (height / img.height);
        ctx.drawImage(img, fx - width / 2, CANVAS_HEIGHT - height - 100, width, height);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(fx, 0, 6, CANVAS_HEIGHT);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 META', fx, 30);
      }
    }

    // Players
    for (const player of this.players) player.draw(ctx, this.cameraX, this.assets);

    // Progress bar
    this._drawProgressBar(ctx);
  }

  _drawProgressBar(ctx) {
    const barY = 10;
    const barH = 12;
    const barX = 20;
    const barW = CANVAS_WIDTH - 40;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);

    for (const p of this.players) {
      const pct = Math.min(p.x / FINISH_X, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(barX, barY, barW * pct, barH);
      // Marker
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, barX + barW * pct, barY + barH + 12);
    }
  }
}