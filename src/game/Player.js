import { GRAVITY, JUMP_FORCE, GROUND_Y, CANVAS_WIDTH } from './constants.js';

export class Player {
  constructor({ id, label, color, x, controls, spriteKey }) {
    this.id = id;
    this.label = label;
    this.color = color;
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.width = 40;
    this.height = 56;
    this.onGround = false;
    this.controls = controls;
    this.finished = false;
    this.finishTime = null;
    this.spriteKey = spriteKey; // 'p1' | 'p2'

    // Animación
    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 120; // ms por frame
    this.facing = 1; // 1 = derecha, -1 = izquierda
  }

  update(keys, platforms, finishX, deltaTime = 16) {
    if (this.finished) return;

    const speed = 4;
    let moving = false;

    // Horizontal movement
    if (keys[this.controls.left]) {
      this.vx = -speed;
      this.facing = -1;
      moving = true;
    } else if (keys[this.controls.right]) {
      this.vx = speed;
      this.facing = 1;
      moving = true;
    } else {
      this.vx = 0;
    }

    // Jump
    if (keys[this.controls.jump] && this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    }

    // Gravity
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Don't go left of screen
    if (this.x < 0) this.x = 0;

    // Platform collision
    this.onGround = false;
    for (const plat of platforms) {
      if (
        this.vy >= 0 &&
        this.x + this.width > plat.x &&
        this.x < plat.x + plat.width &&
        this.y + this.height >= plat.y &&
        this.y + this.height <= plat.y + plat.height + 10
      ) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }

    // Finish line
    if (this.x + this.width >= finishX && !this.finished) {
      this.finished = true;
      this.finishTime = Date.now();
    }

    // Animación: avanza frame si se mueve y está en suelo
    if (moving && this.onGround) {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % 4; // 4 frames de walk
      }
    } else {
      this.frame = 3; // idle frame
      this.frameTimer = 0;
    }
  }

  draw(ctx, cameraX, assets) {
    const sx = this.x - cameraX;
    const sprite = assets?.players?.[this.spriteKey];

    if (sprite?.image) {
      const { image, frameWidth, frameHeight } = sprite;

      // Escala para que encaje con el hitbox
      const drawW = this.width * 1.2;
      const drawH = this.height * 1.2;
      const drawX = sx - (drawW - this.width) / 2;
      const drawY = this.y - (drawH - this.height);

      ctx.save();

      // Flip horizontal si va a la izquierda
      if (this.facing === -1) {
        ctx.translate(drawX + drawW / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(drawX + drawW / 2), 0);
      }

      ctx.drawImage(
        image,
        this.frame * frameWidth, 0,  // frame actual del spritesheet
        frameWidth, frameHeight,      // tamaño del frame fuente
        drawX, drawY,                 // posición en canvas
        drawW, drawH                  // tamaño dibujado
      );

      ctx.restore();
    } else {
      // Fallback: rectángulo con ojos
      ctx.fillStyle = this.color;
      ctx.fillRect(sx, this.y, this.width, this.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(sx + 6, this.y + 8, 8, 8);
      ctx.fillRect(sx + 18, this.y + 8, 8, 8);
      ctx.fillStyle = '#111';
      ctx.fillRect(sx + 9, this.y + 11, 4, 4);
      ctx.fillRect(sx + 21, this.y + 11, 4, 4);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, sx + this.width / 2, this.y + this.height - 6);
    }
  }
}