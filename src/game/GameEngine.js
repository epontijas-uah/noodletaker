import { PLAYERS_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { Player } from './Player.js';
import { buildLevel, LEVEL_WIDTH, FINISH_X } from './levels.js';

export class GameEngine {
  constructor(canvas, assets, onFinish, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.onFinish = onFinish;
    this.keys = {};
    this.localPlayerId = options.localPlayerId ?? 1;
    this.players = PLAYERS_CONFIG.map(cfg => new Player({
      ...cfg,
      isLocalControlled: cfg.id === this.localPlayerId,
    }));
    this.platforms = buildLevel();
    this.cameraX = 0;
    this.animId = null;
    this.results = [];
    this.boundHandleKeyDown = (e) => {
      this.keys[e.key] = true;
      e.preventDefault();
    };
    this.boundHandleKeyUp = (e) => {
      this.keys[e.key] = false;
    };
  }

  start() {
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
    this._loop();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.animId = null;
  }

  updateRemotePlayer(playerId, state) {
    const player = this.players.find(p => p.id === playerId);
    if (player && !player.isLocalControlled) {
      player.x = state.x ?? player.x;
      player.y = state.y ?? player.y;
      player.vx = state.vx ?? player.vx;
      player.vy = state.vy ?? player.vy;
      player.facing = state.facing ?? player.facing;
      player.onGround = state.onGround ?? player.onGround;
      if (state.finished !== undefined) player.finished = state.finished;
      if (state.finishTime !== undefined) player.finishTime = state.finishTime;
    }
  }

  getLocalPlayerState() {
    const player = this.players.find(p => p.isLocalControlled);
    if (!player) return null;
    return {
      id: player.id,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      facing: player.facing,
      onGround: player.onGround,
      finished: player.finished,
      finishTime: player.finishTime,
    };
  }

  _loop() {
    this._update();
    this._draw();

    const localPlayer = this.players.find(p => p.isLocalControlled);
    if (localPlayer && localPlayer.finished && this.results.length === 0) {
      this.results = [localPlayer, ...this.players.filter(p => !p.isLocalControlled)];
      this.onFinish(this.results);
      return;
    }

    this.animId = requestAnimationFrame(() => this._loop());
  }

  _update() {
    for (const player of this.players) {
      player.update(this.keys, this.platforms, FINISH_X);
    }
    const leadX = Math.max(...this.players.map(p => p.x));
    const targetCam = leadX - GAME_WIDTH * 0.35;
    this.cameraX = Math.max(0, Math.min(targetCam, LEVEL_WIDTH - GAME_WIDTH));
  }

  _draw() {
    const ctx = this.ctx;
    const scaleX = CANVAS_WIDTH / GAME_WIDTH;
    const scaleY = CANVAS_HEIGHT / GAME_HEIGHT;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // Fondo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Estrellas
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + this.cameraX * 0.05) % GAME_WIDTH);
      const sy = (i * 53) % 200;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Plataformas
    for (const plat of this.platforms) plat.draw(ctx, this.cameraX);

    // Línea de meta
    const fx = FINISH_X - this.cameraX;
    if (fx > -200 && fx < GAME_WIDTH + 200) {
      if (this.assets?.finishLine) {
        const img = this.assets.finishLine;
        const h = 220, w = img.width * (h / img.height);
        ctx.drawImage(img, fx - w / 2, GAME_HEIGHT - h - 100, w, h);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(fx, 0, 6, GAME_HEIGHT);
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 META', fx, 30);
      }
    }

    // Jugadores
    for (const player of this.players) player.draw(ctx, this.cameraX, this.assets);

    // Barra de progreso
    this._drawProgressBar(ctx);

    ctx.restore();
  }

  drawStatic() {
    this._draw();
  }

  _drawProgressBar(ctx) {
    const barX = 20, barY = 10, barW = GAME_WIDTH - 40, barH = 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    for (const p of this.players) {
      const pct = Math.min(p.x / FINISH_X, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, barX + barW * pct, barY + barH + 12);
    }
  }
}