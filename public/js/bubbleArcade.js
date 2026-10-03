/**
 * Cosmic Bubble Pop - Soothing No-Lose 2D Minigame
 * Blueprint Exit Strategy: Keeps child engaged and regulated while waiting for parent approval.
 */

class CosmicBubblePop {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.bubbles = [];
    this.particles = [];
    this.poppedCount = 0;
    this.animId = null;
    this.isRunning = false;

    this.colors = ['#8dbd61', '#70459e', '#ffb644', '#f4718d', '#6B5BFF', '#4cd3e3'];
    this.icons = ['⭐', '✨', '🪐', '💎', '🌙', '🐱', '🚀'];

    this.initCanvasSize();
    window.addEventListener('resize', () => this.initCanvasSize());

    // Click/touch handler
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
  }

  initCanvasSize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = Math.min(window.innerHeight * 0.75, 600);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    this.initCanvasSize();
    this.isRunning = true;
    this.bubbles = [];
    this.particles = [];
    this.poppedCount = 0;
    this.updateStatsDisplay();

    // Seed initial bubbles
    for (let i = 0; i < 16; i++) {
      this.spawnBubble(true);
    }

    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  spawnBubble(randomY = false) {
    const radius = 28 + Math.random() * 32;
    const x = radius + Math.random() * (this.width - radius * 2);
    const y = randomY ? Math.random() * (this.height - radius * 2) : this.height + radius + Math.random() * 50;
    const speed = 0.6 + Math.random() * 1.2;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const icon = this.icons[Math.floor(Math.random() * this.icons.length)];

    this.bubbles.push({
      x,
      y,
      radius,
      speed,
      color,
      icon,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03
    });
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      const dx = px - b.x;
      const dy = py - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= b.radius * 1.2) {
        // Popped!
        this.popBubble(i);
        break;
      }
    }
  }

  popBubble(index) {
    const b = this.bubbles[index];
    this.bubbles.splice(index, 1);
    this.poppedCount++;
    this.updateStatsDisplay();

    // Play synthesized pop
    const pitch = 450 + Math.random() * 400;
    if (window.sounds) window.sounds.playPop(pitch);

    // Create explosion particles
    for (let p = 0; p < 12; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: b.color,
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02
      });
    }

    // Spawn replacement bubble
    setTimeout(() => {
      if (this.isRunning) this.spawnBubble();
    }, 400 + Math.random() * 800);
  }

  updateStatsDisplay() {
    const countEl = document.getElementById('arcadePopCount');
    if (countEl) countEl.textContent = this.poppedCount;
  }

  loop() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Subtle cosmic background gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#100f24');
    grad.addColorStop(1, '#1b173b');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Twinkling stars in background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 12345) % this.width);
      const sy = ((i * 67890) % this.height);
      const sr = (i % 3 === 0) ? 2 : 1;
      this.ctx.fillRect(sx, sy, sr, sr);
    }

    // Update & draw bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      const wobX = b.x + Math.sin(b.wobble) * 8;

      // Wrap around top
      if (b.y + b.radius < 0) {
        b.y = this.height + b.radius;
        b.x = b.radius + Math.random() * (this.width - b.radius * 2);
      }

      // Draw bubble glow
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(wobX, b.y, b.radius, 0, Math.PI * 2);

      // Bubble fill
      this.ctx.fillStyle = `${b.color}33`; // translucent
      this.ctx.fill();

      // Bubble outline
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = b.color;
      this.ctx.stroke();

      // Shiny highlight
      this.ctx.beginPath();
      this.ctx.arc(wobX - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fill();

      // Center emoji/icon
      this.ctx.font = `${Math.round(b.radius * 0.8)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(b.icon, wobX, b.y);

      this.ctx.restore();
    }

    // Maintain minimum bubble count
    if (this.bubbles.length < 14) {
      this.spawnBubble();
    }

    // Update & draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }
}

window.CosmicBubblePop = CosmicBubblePop;
