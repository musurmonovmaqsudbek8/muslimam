(() => {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const secs = [...document.querySelectorAll('.s')];
const prog = document.getElementById('prog');
const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
let W, H, DPR, mode = 'drift', cur = -1, busy = false;

// ---- flowers
document.querySelectorAll('.fl').forEach(f => {
  const n = +f.dataset.n; let h = '';
  for (let k = 0; k < n; k++) h += `<i style="--r:${k * 360 / n}deg;--k:${k}"></i>`;
  f.innerHTML = h + '<b></b>';
});

// ---- staggered lines & button delays
secs.forEach(s => {
  const ls = [...s.querySelectorAll('.l')];
  ls.forEach((l, i) => l.style.setProperty('--i', i));
  const last = ls.length ? ls.length * .95 + 2.2 : 3;
  s.style.setProperty('--bd', (last + (s.querySelector('.quote,.hold') ? 1 : 0)) + 's');
  s.querySelectorAll('.ll').forEach((l, i) => l.style.setProperty('--i', i));
});

// ---- particles
const P = [];
const rnd = (a, b) => a + Math.random() * (b - a);
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function mk(x, y, k) {
  return { x: x ?? rnd(0, W), y: y ?? rnd(0, H), r: rnd(1, 3), vx: rnd(-.2, .2), vy: rnd(-.25, .1),
    k: k ?? (Math.random() < .55 ? 0 : Math.random() < .6 ? 1 : 2), rot: rnd(0, 6.28), vr: rnd(-.01, .01),
    ph: rnd(0, 6.28), s: rnd(5, 11) };
}
function init() {
  P.length = 0;
  const n = RM ? 30 : (W < 700 ? 55 : 110);
  for (let i = 0; i < n; i++) P.push(mk());
}
const bf = Array.from({ length: 5 }, (_, i) => ({ ph: i * 1.7, sp: rnd(.25, .45), a: rnd(.2, .45), y: rnd(.25, .8), sz: rnd(9, 15), c: i % 2 ? '#7fe8d2' : '#eab8be' }));
function butterfly(b, t) {
  const x = W * (.5 + .42 * Math.sin(t * b.sp * .0004 + b.ph)), y = H * b.y + 40 * Math.sin(t * .0007 + b.ph * 2);
  const f = Math.abs(Math.cos(t * .008 + b.ph)), s = b.sz;
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(t * .0004 + b.ph) * .4);
  ctx.fillStyle = b.c; ctx.globalAlpha = .75; ctx.shadowColor = b.c; ctx.shadowBlur = 14;
  for (const d of [-1, 1]) { ctx.save(); ctx.scale(d * (.25 + .75 * f), 1);
    ctx.beginPath(); ctx.ellipse(s * .55, -s * .3, s * .6, s * .9, .5, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * .4, s * .5, s * .4, s * .55, -.4, 0, 6.28); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function draw(t) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, cyc = Math.sin(t / 2600);
  for (const p of P) {
    p.ph += .02;
    if (mode === 'rain') { p.vx = 0; p.vy = 1.4 + p.r * .5; }
    else if (mode === 'gather') {
      const g = cyc > 0 ? .02 : -.012; p.x += (cx - p.x) * g; p.y += (cy - p.y) * g; p.x += p.vx; p.y += p.vy;
    } else if (mode === 'final') {
      const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
      p.x += dx * .006 + dy * .0035; p.y += dy * .006 - dx * .0035;
      if (d < 70) { p.x -= dx / d * 1.2; p.y -= dy / d * 1.2; }
    } else { p.x += p.vx + Math.sin(p.ph) * .3; p.y += p.vy + (p.k ? .12 : 0); }
    p.rot += p.vr;
    if (mode !== 'final') {
      if (p.y > H + 20) { p.y = -20; p.x = rnd(0, W); } if (p.y < -30 && mode !== 'rain') p.y = H + 20;
      if (p.x < -30) p.x = W + 20; if (p.x > W + 30) p.x = -20;
    }
    const tw = .5 + .5 * Math.sin(p.ph * 1.5);
    ctx.save(); ctx.translate(p.x, p.y);
    if (mode === 'rain') {
      ctx.strokeStyle = `rgba(150,240,225,${.25 + tw * .2})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12 + p.r * 3); ctx.stroke();
    } else if (p.k === 0 || mode === 'net' || mode === 'gather') {
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 5);
      gr.addColorStop(0, `rgba(255,240,200,${.9 * tw + .1})`); gr.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, p.r * 5, 0, 6.28); ctx.fill();
    } else {
      ctx.rotate(p.rot); ctx.globalAlpha = .55 + .2 * tw;
      ctx.fillStyle = p.k === 1 ? '#f2c9cf' : '#3fbf9f';
      ctx.beginPath(); ctx.ellipse(0, 0, p.s * .35, p.s * .7 * Math.abs(Math.cos(p.ph * .6) * .4 + .6), 0, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }
  if (mode === 'net') {
    ctx.lineWidth = .7;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
      if (d < 130) { ctx.strokeStyle = `rgba(232,207,155,${(1 - d / 130) * .5})`; ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke(); }
    }
  }
  if (mode === 'night') bf.forEach(b => butterfly(b, t));
  if (mode === 'final') {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220); g.addColorStop(0, 'rgba(232,207,155,.18)'); g.addColorStop(1, 'rgba(232,207,155,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (!RM) requestAnimationFrame(draw);
}

// burst of particles
function burst(x, y, n = 26, petals = false) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.28), sp = rnd(1, 4), p = mk(x, y, petals ? 1 : 0);
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - (petals ? 0 : 0); p.r = rnd(1.5, 3.5); p.life = 1;
    P.push(p);
  }
  while (P.length > (W < 700 ? 130 : 240)) P.shift();
}

// ---- navigation
function go(n) {
  if (busy) return; busy = true;
  const old = secs[cur], nw = secs[n];
  if (old) { old.classList.add('out'); old.classList.remove('on'); setTimeout(() => old.classList.remove('out'), 1000); }
  nw.className = 's on in' + (n % 5);
  setTimeout(() => nw.classList.remove('in' + (n % 5)), 1800);
  cur = n; mode = nw.dataset.mode;
  prog.textContent = String(n + 1).padStart(2, '0') + ' / 10';
  if (n === 0) init();
  setTimeout(() => busy = false, 1300);
}
document.querySelectorAll('.next').forEach(b => b.addEventListener('click', e => {
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
  const rp = document.createElement('span'); rp.className = 'rp';
  rp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(rp); setTimeout(() => rp.remove(), 800);
  burst(r.left + r.width / 2, r.top + r.height / 2, 30);
  cv.style.transition = 'filter .5s'; cv.style.filter = 'blur(3px)'; setTimeout(() => cv.style.filter = '', 700);
  if (b.id === 'restart') { go(0); return; }
  go(cur + 1);
}));

// ---- envelope
const env = document.getElementById('env'), letter = document.getElementById('letter'), n9 = document.getElementById('n9');
function openEnv() {
  if (env.classList.contains('open')) return;
  env.classList.add('open');
  const r = env.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 40, true);
  setTimeout(() => { env.classList.add('gone'); document.querySelector('.hint').style.display = 'none'; letter.classList.add('show');
    burst(innerWidth / 2, innerHeight * .4, 40, true); }, 1000);
  setTimeout(() => n9.classList.add('ready'), 1000 + 5 * 1000 + 800);
}
env.addEventListener('click', openEnv);
env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openEnv(); });

addEventListener('resize', () => { resize(); });
resize(); init(); requestAnimationFrame(draw); go(0);
})();
