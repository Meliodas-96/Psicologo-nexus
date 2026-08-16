(function () {
  const canvas = document.getElementById('bg3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const PALETTES = {
    dark: {
      petals: [
        [236, 168, 214],
        [167, 139, 250],
        [103, 232, 249],
        [255, 255, 255]
      ],
      opacity: 0.82,
      glow: 0.5
    },
    light: {
      petals: [
        [236, 168, 214],
        [167, 139, 250],
        [103, 200, 249],
        [255, 140, 190]
      ],
      opacity: 0.75,
      glow: 0.3
    }
  };

  const BASE_COUNT = 38;
  const MAX_COUNT = 110;
  const MOUSE_RADIUS = 150;

  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, inside: false };

  window.addEventListener('mousemove', (e) => {
    if (mouse.px < -999) { mouse.px = e.clientX; mouse.py = e.clientY; }
    const dx = e.clientX - mouse.px;
    const dy = e.clientY - mouse.py;
    mouse.speed = Math.min(Math.hypot(dx, dy), 60);
    mouse.px = e.clientX; mouse.py = e.clientY;
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.inside = true;
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      glow.classList.add('visible');
    }
  });
  window.addEventListener('mouseleave', () => {
    mouse.inside = false;
    mouse.x = -9999; mouse.y = -9999;
    const glow = document.getElementById('cursor-glow');
    if (glow) glow.classList.remove('visible');
  });

  let isDark = true;
  window.__nexusSetBgTheme = function (dark) { isDark = dark; };

  const rand = (a, b) => a + Math.random() * (b - a);

  function treeSpawnX() {
    const w = Math.min(420, W * 0.46);
    const left = Math.max(0, W - w - 10);
    const right = left + w * 0.5;
    const leftTree = Math.min(w - 10, W * 0.46) * 0.5 + 10;
    const useRight = Math.random() < 0.5;
    const c = useRight ? right : leftTree;
    const spread = w * 0.42;
    let x = c + (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * spread;
    return Math.max(20, Math.min(W - 20, x));
  }

  class Petal {
    constructor(opts = {}) {
      this.respawn(true, opts);
    }

    respawn(fromTop, opts = {}) {
      this.size = opts.size ?? rand(7, 17);
      const fromTree = Math.random() < 0.62 && !opts.x;
      this.x = opts.x ?? (fromTree ? treeSpawnX() : rand(-40, W + 40));
      this.y = fromTop
        ? (opts.y ?? (fromTree ? rand(-30, 140) : rand(-H * 0.9, -20)))
        : rand(-20, H);
      this.vy = (opts.speed ?? rand(0.45, 1.25)) * (0.75 + this.size / 22);
      this.swayAmp = rand(24, 64);
      this.swayFreq = rand(0.0006, 0.0014);
      this.phase = rand(0, Math.PI * 2);
      this.rot = rand(0, Math.PI * 2);
      this.rotSpeed = rand(-0.012, 0.012);
      this.flip = rand(0, Math.PI * 2);
      this.flipSpeed = rand(0.008, 0.022);
      this.colorIdx = Math.floor(rand(0, 4));
      this.opacity = rand(0.45, 0.95);
      this.glow = Math.random() > 0.78;
      this.spinBoost = 0;
      this.vx = 0;
    }

    update(dt, t, wind) {
      this.y += this.vy * dt;
      this.x += (Math.sin(t * this.swayFreq + this.phase) * 0.55 + wind * 0.4) * dt + this.vx * dt;
      this.vx *= 0.92;
      this.rot += (this.rotSpeed + this.spinBoost) * dt;
      this.flip += this.flipSpeed * dt;
      this.spinBoost *= 0.94;

      if (mouse.inside) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_RADIUS && d > 0.01) {
          const force = Math.pow(1 - d / MOUSE_RADIUS, 2) * 3.2;
          this.vx += (dx / d) * force * 0.9;
          this.y += (dy / d) * force * 0.5;
          this.rotSpeed += 0.004 * force * 0.1;
          this.spinBoost += force * 0.02;
        }
      }

      if (this.y > H + 50 || this.x < -120 || this.x > W + 120) {
        this.respawn(true);
        this.y = rand(-60, -20);
      }
    }

    draw(pal) {
      const [r, g, b] = pal.petals[this.colorIdx];
      const scaleX = 0.22 + Math.abs(Math.cos(this.flip)) * 0.78;
      const s = this.size;
      const a = this.opacity * pal.opacity;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.scale(scaleX, 1);

      if (this.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${r},${g},${b},${pal.glow})`;
      }

      const grad = ctx.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, `rgba(${Math.min(r + 40, 255)},${Math.min(g + 40, 255)},${Math.min(b + 40, 255)},${a})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},${a * 0.82})`);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.95, -s * 0.55, s * 0.75, s * 0.55, 0, s);
      ctx.bezierCurveTo(-s * 0.75, s * 0.55, -s * 0.95, -s * 0.55, 0, -s);
      ctx.fill();

      ctx.restore();
    }
  }

  const petals = [];
  for (let i = 0; i < BASE_COUNT; i++) petals.push(new Petal());

  let last = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 16.6, 3);
    last = now;
    const t = now;

    const wind = Math.sin(t * 0.00012) * 0.8 + Math.sin(t * 0.00031 + 2) * 0.4;

    if (mouse.speed > 6 && petals.length < MAX_COUNT) {
      const n = Math.min(Math.ceil(mouse.speed / 18), 3);
      for (let i = 0; i < n; i++) {
        const p = new Petal({
          x: mouse.x + rand(-180, 180),
          y: rand(-80, -10),
          speed: rand(1.0, 1.9)
        });
        p.vy *= 1.25;
        petals.push(p);
      }
    }
    mouse.speed *= 0.9;

    while (petals.length > MAX_COUNT) petals.shift();

    const pal = isDark ? PALETTES.dark : PALETTES.light;
    ctx.clearRect(0, 0, W, H);

    for (const p of petals) {
      p.update(dt, t, wind);
      p.draw(pal);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
