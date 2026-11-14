// Flower pile: flowers drift down gently, land on each other and settle into a heap.
// Pointer nudges them; click drops one more. No libraries.
// opts: count, region [from, to] as fractions of the width, minR, maxR, gap (ms between drops)
function startFlowerPile(canvas, srcs, opts) {
  opts = opts || {};
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, bodies = [], imgs = [], raf = 0, running = true, last = 0, time = 0;
  var pointer = { x: -9999, y: -9999, active: false };
  function region() { return typeof opts.region === 'function' ? opts.region() : (opts.region || [0, 1]); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = 520, MAX_FALL = 240, REST = 0.08;

  srcs.forEach(function (s) { var im = new Image(); im.src = s; imgs.push(im); });

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function add(x, y) {
    var r = rand(typeof opts.minR === 'function' ? opts.minR() : (opts.minR || 24), typeof opts.maxR === 'function' ? opts.maxR() : (opts.maxR || 40));
    var rg = region(), x0 = W * rg[0] + r, x1 = Math.max(x0 + 1, W * rg[1] - r);
    bodies.push({
      x: x == null ? rand(x0, x1) : x, y: y == null ? -r - rand(0, 60) : y,
      vx: rand(-8, 8), vy: rand(20, 60), r: r,
      a: rand(0, Math.PI * 2), va: rand(-0.35, 0.35),          // slow, gentle turn
      sway: rand(0.8, 1.6), phase: rand(0, Math.PI * 2), amp: rand(18, 34),
      rest: false, img: imgs[bodies.length % imgs.length]
    });
  }
  function drop(n) {
    for (var i = 0; i < n; i++) (function (i) { setTimeout(function () { if (running) add(); }, i * (opts.gap || 220)); })(i);
  }
  function step(dt) {
    var i, j, b, c;
    time += dt;
    for (i = 0; i < bodies.length; i++) {
      b = bodies[i];
      b.vy = Math.min(MAX_FALL, b.vy + G * dt);                 // air keeps the fall soft
      if (!b.rest) b.vx += Math.sin(time * b.sway + b.phase) * b.amp * dt;  // a little side-to-side drift
      if (pointer.active) {
        var dx = b.x - pointer.x, dy = b.y - pointer.y, d = Math.hypot(dx, dy), R = 90;
        if (d < R && d > 0.1) { var f = (1 - d / R) * 900 * dt; b.vx += dx / d * f; b.vy += dy / d * f; b.rest = false; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
      b.vx *= 0.98; b.va *= 0.97;
      b.rest = false;
      if (b.y > H - b.r) { b.y = H - b.r; b.vy *= -REST; b.vx *= 0.6; b.va *= 0.5; b.rest = true; }
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * REST; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * REST; }
    }
    for (var k = 0; k < 4; k++) {
      for (i = 0; i < bodies.length; i++) for (j = i + 1; j < bodies.length; j++) {
        b = bodies[i]; c = bodies[j];
        var ddx = c.x - b.x, ddy = c.y - b.y, dist = Math.hypot(ddx, ddy), min = (b.r + c.r) * 0.86;
        if (dist > 0 && dist < min) {
          var nx = ddx / dist, ny = ddy / dist, push = (min - dist) / 2;
          b.x -= nx * push; b.y -= ny * push; c.x += nx * push; c.y += ny * push;
          var rv = (c.vx - b.vx) * nx + (c.vy - b.vy) * ny;
          if (rv < 0) {
            var imp = -(1 + REST) * rv / 2;
            b.vx -= imp * nx; b.vy -= imp * ny; c.vx += imp * nx; c.vy += imp * ny;
            b.vx *= 0.85; c.vx *= 0.85; b.va *= 0.6; c.va *= 0.6;   // they grip and stop turning
          }
          if (ny > 0.5) b.rest = true; else if (ny < -0.5) c.rest = true;
        }
      }
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i], s = b.r * 2.25;
      if (!b.img.complete) continue;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      var ar = (b.img.naturalHeight || 1) / (b.img.naturalWidth || 1), w = ar > 1 ? s / ar : s, h = ar > 1 ? s : s * ar;
      ctx.drawImage(b.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }
  function loop(t) {
    if (!running) return;
    var dt = Math.min(0.033, last ? (t - last) / 1000 : 0.016); last = t;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }
  function onMove(e) { var r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true; }
  function onLeave() { pointer.active = false; }
  function onClick(e) { var r = canvas.getBoundingClientRect(); add(e.clientX - r.left, -30); }

  resize();
  window.addEventListener('resize', resize);
  var host = opts.host || canvas;
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('click', function (e) { if (!e.target.closest('a, button')) onClick(e); });

  var count = opts.count || 30;
  if (reduce) {
    for (var i = 0; i < count; i++) add(null, H - rand(20, 160));
    for (var s = 0; s < 400; s++) step(0.016);
    draw();
  } else {
    drop(count);
    raf = requestAnimationFrame(loop);
  }
  return {
    replay: function () { bodies = []; last = 0; drop(count); },
    stop: function () { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); }
  };
}
