import { GRAVITY, JUMP_FORCE, GROUND_Y } from './constants.js';

export class Player {
  constructor({ id, label, color, x, controls, spriteKey, isLocalControlled = false }) {
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
    this.spriteKey = spriteKey;
    this.facing = 1;
    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 120;
    this.isLocalControlled = isLocalControlled;
  }

  update(keys, platforms, finishX, deltaTime = 16) {
    if (this.finished) return;

    const speed = 4;
    let moving = false;

    if (this.isLocalControlled) {
      if (keys[this.controls.left]) {
        this.vx = -speed; this.facing = -1; moving = true;
      } else if (keys[this.controls.right]) {
        this.vx = speed; this.facing = 1; moving = true;
      } else {
        this.vx = 0;
      }

      if (keys[this.controls.jump] && this.onGround) {
        this.vy = JUMP_FORCE;
        this.onGround = false;
      }
    } else {
      this.vx = 0;
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0) this.x = 0;

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

    if (this.x + this.width >= finishX && !this.finished) {
      this.finished = true;
      this.finishTime = Date.now();
    }

    if (moving && this.onGround) {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    } else {
      this.frame = 3;
      this.frameTimer = 0;
    }
  }

  draw(ctx, cameraX, assets) {
    const sx = this.x - cameraX;
    const sprite = assets?.players?.[this.spriteKey];

    console.log('sprite:', this.spriteKey, sprite);  
    console.log('image:', sprite?.image);  
    console.log('naturalWidth:', sprite?.image?.naturalWidth);

    if (sprite?.image) {
      const { image, frameWidth, frameHeight } = sprite;

      // Comprueba cuántos frames caben realmente en la imagen
      const totalFrames = Math.floor(image.naturalWidth / frameWidth);
      const safeFrame = this.frame % Math.max(totalFrames, 1);

      const drawW = this.width * 1.5;
      const drawH = this.height * 1.5;
      const drawX = sx - (drawW - this.width) / 2;
      const drawY = this.y - (drawH - this.height);

      ctx.save();
      // Flip sin ctx.scale anidado: usamos translate manual
      if (this.facing === -1) {
        ctx.translate(drawX + drawW / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(drawX + drawW / 2), 0);
      }
      ctx.drawImage(
        image,
        safeFrame * frameWidth, 0,
        frameWidth, frameHeight,
        drawX, drawY,
        drawW, drawH
      );
      ctx.restore();
    } else {
      // Fallback rectángulo
      ctx.fillStyle = this.color;
      ctx.fillRect(sx, this.y, this.width, this.height);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, sx + this.width / 2, this.y + this.height - 6);
    }
  }
}