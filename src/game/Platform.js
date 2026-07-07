export class Platform {
  constructor(x, y, width, height = 16, color = '#22c55e') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw(ctx, cameraX) {
    const sx = this.x - cameraX;
    // Only draw if visible
    if (sx + this.width < 0 || sx > ctx.canvas.width) return;
    ctx.fillStyle = this.color;
    ctx.fillRect(sx, this.y, this.width, this.height);
    // Top highlight
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(sx, this.y, this.width, 4);
  }
}