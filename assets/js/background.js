// Animated page background: drifting points joined by lines (they also link to
// the cursor), plus light falling snow. Toggle either effect in CONFIG.
(() => {
  const CONFIG = {
    lines: true,
    snow: true,
    linkDistance: 130,   // px between points before a line is drawn
    mouseDistance: 190,  // px within which points link to / drift toward the cursor
  };

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, rgb = "0, 0, 0";
  let points = [], flakes = [];
  const mouse = { x: null, y: null };

  const rand = (a, b) => a + Math.random() * (b - a);

  function readColor() {
    rgb = getComputedStyle(document.documentElement).getPropertyValue("--fx").trim() || rgb;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Scale counts with screen area so phones stay light.
    const area = w * h;
    points = Array.from({ length: Math.min(100, Math.round(area / 13000)) }, () => ({
      x: rand(0, w), y: rand(0, h), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4),
    }));
    flakes = Array.from({ length: Math.min(70, Math.round(area / 18000)) }, () => newFlake(true));
  }

  function newFlake(anywhere) {
    return {
      x: rand(0, w), y: anywhere ? rand(0, h) : -10,
      r: rand(1, 3.2), vy: rand(0.3, 1.1), phase: rand(0, Math.PI * 2),
    };
  }

  function drawLines() {
    const link2 = CONFIG.linkDistance ** 2;
    const mouse2 = CONFIG.mouseDistance ** 2;

    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.fillStyle = `rgba(${rgb}, 0.5)`;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);

      if (mouse.x !== null) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < mouse2) {
          // Pull the point gently toward the cursor.
          if (d2 > mouse2 / 4) { p.x -= dx * 0.02; p.y -= dy * 0.02; }
          line(p.x, p.y, mouse.x, mouse.y, 1 - d2 / mouse2);
        }
      }
    }

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < link2) line(a.x, a.y, b.x, b.y, 1 - d2 / link2);
      }
    }
  }

  function line(x1, y1, x2, y2, strength) {
    ctx.strokeStyle = `rgba(${rgb}, ${0.35 * strength})`;
    ctx.lineWidth = strength * 0.8 + 0.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawSnow(t) {
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y += f.vy;
      f.x += Math.sin(t / 1500 + f.phase) * 0.4;
      if (f.y > h + 10) flakes[i] = newFlake(false);

      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(${rgb}, 0.45)`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    if (CONFIG.lines) drawLines();
    if (CONFIG.snow) drawSnow(t);
    requestAnimationFrame(frame);
  }

  addEventListener("resize", resize);
  addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener("mouseleave", () => { mouse.x = mouse.y = null; });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColor);

  readColor();
  resize();
  requestAnimationFrame(frame);
})();
