const $ = id => document.getElementById(id);
if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
const CARS = { sports: { speed: 330, accel: 340, handling: 2.8 }, muscle: { speed: 310, accel: 420, handling: 2.0 }, police: { speed: 300, accel: 360, handling: 2.5 }, taxi: { speed: 260, accel: 280, handling: 2.3 } };
const LEVELS = [
  { name: 'Разминка', dist: 10000, bots: .82, coins: 110, obs: 0 },
  { name: 'Городской спринт', dist: 16000, bots: .87, coins: 150, obs: 40 },
  { name: 'Скоростное шоссе', dist: 24000, bots: .91, coins: 200, obs: 90 },
  { name: 'Марафон', dist: 34000, bots: .95, coins: 260, obs: 150 },
  { name: 'Легенда NYC', dist: 46000, bots: 1.0, coins: 340, obs: 230 }];
const W = 1400, TILE = 1200, T = { cx: 700, half: 150, len: 0, startY: 0, finY: 300 }, RL = T.cx - T.half, RR = T.cx + T.half;
let H = 11000, level = 0, unlocked = 0, myId = 'me', racing = false;
try { unlocked = +localStorage.getItem('nycr_lv') || 0; } catch (e) {}
function setLevel(n) { level = Math.max(0, Math.min(LEVELS.length - 1, n | 0)); T.len = H = LEVELS[level].dist + 550; T.startY = H - 250; }
setLevel(0);
const sel = { name: 'Racer', car: 'sports', color: '#ff2e63', track: 'beach' };
const names = ['sports', 'muscle', 'police', 'taxi'];
const label = { sports: 'Спорткар', muscle: 'Маслкар', police: 'Полиция', taxi: 'Такси NYC' };



/* ---------- helpers ---------- */
const shade = (h, a) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, v + a)); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const nAng = a => Math.atan2(Math.sin(a), Math.cos(a));
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* ---------- car renderer (faces +x, 56x28) ---------- */
function drawCar(c, type, col, t) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = 10; c.shadowOffsetY = 5;
  c.fillStyle = '#0c0c0c';
  [[-19, -16], [-19, 10], [12, -16], [12, 10]].forEach(([x, y]) => { rr(c, x, y, 10, 6, 2); c.fill(); });
  const g = c.createLinearGradient(0, -14, 0, 14);
  g.addColorStop(0, shade(col, 80)); g.addColorStop(.35, col); g.addColorStop(1, shade(col, -80));
  c.fillStyle = g; rr(c, -28, -13, 56, 26, type === 'muscle' ? 5 : 11); c.fill();
  c.restore();
  // type details
  if (type === 'muscle') { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(2, -5, 26, 3); c.fillRect(2, 2, 26, 3); }
  if (type === 'police') { c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-14, -13, 20, 26); c.fillStyle = '#111'; c.fillRect(-28, -13, 12, 26); }
  if (type === 'taxi') { c.fillStyle = '#111'; for (let i = 0; i < 8; i++) if (i % 2) { c.fillRect(-26 + i * 3, -13, 3, 2); c.fillRect(-26 + i * 3, 11, 3, 2); } }
  // windshield + rear glass + roof
  const gl = c.createLinearGradient(0, -9, 0, 9);
  gl.addColorStop(0, '#5fd4ff'); gl.addColorStop(.5, '#0b1b33'); gl.addColorStop(1, '#16466e');
  c.fillStyle = gl;
  c.beginPath(); c.moveTo(13, -10); c.lineTo(4, -8.5); c.lineTo(4, 8.5); c.lineTo(13, 10); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-9, -9); c.lineTo(-16, -10); c.lineTo(-16, 10); c.lineTo(-9, 9); c.closePath(); c.fill();
  const rg = c.createLinearGradient(0, -9, 0, 9); rg.addColorStop(0, shade(col, 40)); rg.addColorStop(1, shade(col, -60));
  c.fillStyle = rg; rr(c, -9, -9, 13, 18, 3); c.fill();
  // metallic highlights
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-22, -10.5); c.lineTo(22, -10.5); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(6, -6); c.lineTo(11, -8); c.stroke();
  // spoiler
  if (type === 'sports' || type === 'muscle') {
    c.fillStyle = '#151515'; c.fillRect(-31, -13, 5, 26); c.fillStyle = shade(col, 60); c.fillRect(-31, -13, 2, 26);
  }
  // taxi sign / police bar
  if (type === 'taxi') { c.fillStyle = '#ffe600'; c.shadowColor = '#ffe600'; c.shadowBlur = 8; rr(c, -5, -4, 7, 8, 2); c.fill(); c.shadowBlur = 0; }
  if (type === 'police') {
    const f = Math.floor(t * 6) % 2;
    c.shadowBlur = 14; c.shadowColor = f ? '#ff1030' : '#1060ff'; c.fillStyle = f ? '#ff1030' : '#1060ff'; c.fillRect(-4, -9, 4, 9);
    c.shadowColor = f ? '#1060ff' : '#ff1030'; c.fillStyle = f ? '#1060ff' : '#ff1030'; c.fillRect(-4, 0, 4, 9); c.shadowBlur = 0;
  }
  // head & tail lights
  c.shadowBlur = 12; c.shadowColor = '#fff6a0'; c.fillStyle = '#fffbd0';
  c.beginPath(); c.arc(27, -8, 2.6, 0, 7); c.arc(27, 8, 2.6, 0, 7); c.fill();
  c.shadowColor = '#f00'; c.fillStyle = '#ff2030'; c.fillRect(-29, -12, 2, 5); c.fillRect(-29, 7, 2, 5); c.shadowBlur = 0;
}
function cone(c, night) {
  const L = 230, g = c.createRadialGradient(26, 0, 4, 26, 0, L);
  g.addColorStop(0, `rgba(255,250,200,${night ? .75 : .38})`); g.addColorStop(1, 'rgba(255,250,200,0)');
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
  c.beginPath(); c.moveTo(26, -7); c.lineTo(L, -L * .42); c.lineTo(L, L * .42); c.lineTo(26, 7); c.fill(); c.restore();
}

/* ---------- vertical track (one tile, repeated along the road) ---------- */
function palm(c, x, y) {
  c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(16, 16, 36, 17, 0, 0, 7); c.fill();
  for (let i = 0; i < 8; i++) {
    c.save(); c.rotate(i * Math.PI / 4 + Math.random() * .25);
    const g = c.createLinearGradient(0, 0, 44, 0); g.addColorStop(0, '#0a7a2a'); g.addColorStop(1, '#3dec62');
    c.fillStyle = g; c.strokeStyle = '#06501a'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(22, -14, 46, 3); c.quadraticCurveTo(22, 6, 0, 0); c.fill(); c.stroke(); c.restore();
  }
  c.fillStyle = '#8a5a2b'; c.beginPath(); c.arc(0, 0, 6, 0, 7); c.fill();
  c.fillStyle = '#3a210a'; c.beginPath(); c.arc(-3, 2, 3, 0, 7); c.arc(3, 3, 3, 0, 7); c.fill(); c.restore();
}
function buildTile(kind) {
  const cv = mk(W, TILE), c = cv.getContext('2d'), beach = kind === 'beach';
  if (beach) {
    let g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#f2b84b'); c.fillStyle = g; c.fillRect(0, 0, W, TILE);
    const cols = ['#f4c95d', '#ffd56b', '#e8b24a', '#fff0b0', '#d9a03c'];
    for (let i = 0; i < 9000; i++) { c.fillStyle = cols[i % 5]; c.fillRect(Math.random() * W, Math.random() * TILE, 2, 2); }
    g = c.createLinearGradient(0, 0, 400, 0); g.addColorStop(0, '#0077b6'); g.addColorStop(1, '#00e5ff'); c.fillStyle = g; c.fillRect(0, 0, 400, TILE);
    c.fillStyle = '#c99a4c88'; c.fillRect(400, 0, 30, TILE);
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.globalAlpha = .85; c.beginPath();
    for (let y = 0; y <= TILE; y += 10) c.lineTo(398 + Math.sin(y * Math.PI / 75) * 6, y); c.stroke(); c.globalAlpha = 1;
  } else {
    c.fillStyle = '#07070f'; c.fillRect(0, 0, W, TILE);
    const neon = ['#ff2e97', '#00f0ff', '#ffe600', '#9d4dff', '#39ff14'], signs = ['PIZZA', 'BAR', 'HOTEL', 'TAXI', '24/7', 'BROADWAY', 'DINER', 'JAZZ'];
    for (const bx0 of [40, 220, RR + 60, RR + 250]) for (let y = 20; y < TILE - 140; y += 130) {
      if (Math.random() < .12) continue;
      const w = 90 + Math.random() * 40, h = 90 + Math.random() * 20, bx = bx0 + Math.random() * 20, by = y + Math.random() * 10;
      c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(bx + 16, by + 16, w, h);
      const g = c.createLinearGradient(bx, by, bx + w, by + h); g.addColorStop(0, '#1b1b35'); g.addColorStop(1, '#0b0b1a');
      c.fillStyle = g; c.fillRect(bx, by, w, h);
      for (let wx = bx + 8; wx < bx + w - 10; wx += 14) for (let wy = by + 8; wy < by + h - 12; wy += 14)
        if (Math.random() > .45) { c.fillStyle = Math.random() > .5 ? '#ffe98a' : '#7ff6ff'; c.fillRect(wx, wy, 7, 8); }
      const nc = neon[(Math.random() * 5) | 0];
      c.save(); c.shadowColor = nc; c.shadowBlur = 14; c.strokeStyle = nc; c.lineWidth = 3; c.strokeRect(bx, by, w, h);
      if (Math.random() > .55) { c.fillStyle = nc; c.font = 'bold 20px Impact'; c.fillText(signs[(Math.random() * 8) | 0], bx + 8, by + h - 6); }
      c.restore();
    }
  }
  c.fillStyle = beach ? '#2b2d33' : '#101018'; c.fillRect(RL, 0, T.half * 2, TILE);
  c.fillStyle = beach ? '#32343b' : '#15151f'; c.fillRect(RL + 14, 0, T.half * 2 - 28, TILE);
  for (let y = 0; y < TILE; y += 40) {
    c.fillStyle = (y / 40) % 2 ? (beach ? '#fff' : '#00f0ff') : (beach ? '#e8112d' : '#ff2e97');
    c.shadowColor = c.fillStyle; c.shadowBlur = beach ? 0 : 14; c.fillRect(RL - 14, y, 14, 40); c.fillRect(RR, y, 14, 40);
  }
  c.shadowBlur = 0;
  c.save(); if (!beach) { c.shadowColor = '#00f0ff'; c.shadowBlur = 16; } c.fillStyle = beach ? '#ffd400' : '#00f0ff';
  for (const x of [T.cx - 50, T.cx + 50]) for (let y = 0; y < TILE; y += 80) c.fillRect(x - 2, y, 4, 50);
  c.restore();
  c.save(); if (!beach) { c.shadowColor = '#ff2e97'; c.shadowBlur = 14; } c.fillStyle = beach ? '#fff' : '#ff2e97';
  c.fillRect(RL + 8, 0, 3, TILE); c.fillRect(RR - 11, 0, 3, TILE); c.restore();
  if (beach) for (let y = 40; y < TILE - 120; y += 170) { palm(c, 440 + Math.random() * 60, y + Math.random() * 40); palm(c, RR + 40 + Math.random() * 400, y + Math.random() * 40); palm(c, RR + 450 + Math.random() * 400, y + 60 + Math.random() * 40); }
  return cv;
}
function drawWorld(c, cx, cy, vw, vh, t, night) {
  c.fillStyle = night ? '#07070f' : '#f2b84b'; c.fillRect(cx, cy, vw, vh);
  for (let i = Math.floor(cy / TILE); i <= Math.floor((cy + vh) / TILE); i++) c.drawImage(bg, 0, i * TILE);
  if (!night) {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let x = 14; x < 390; x += 24) { c.beginPath(); for (let y = cy - cy % 12 - 12; y <= cy + vh + 12; y += 12) c.lineTo(x + Math.sin(y / 35 + t * 2 + x) * 4, y); c.stroke(); }
  }
  c.textAlign = 'center'; c.font = 'bold 40px Impact'; c.fillStyle = 'rgba(255,255,255,.35)';
  for (let m = 1000; m < T.startY - T.finY; m += 1000) { const y = T.startY - m; if (y > cy - 50 && y < cy + vh + 50) c.fillText(m + ' м', T.cx, y); }
  [T.startY, T.finY].forEach(y => {
    if (y < cy - 60 || y > cy + vh + 60) return;
    for (let r = 0; r < T.half * 2 / 15; r++) for (let k = 0; k < 3; k++) { c.fillStyle = (r + k) % 2 ? '#111' : '#fff'; c.fillRect(RL + r * 15, y + k * 15 - 22, 15, 15); }
  });
  if (T.finY > cy - 120 && T.finY < cy + vh + 120) { c.save(); c.shadowColor = '#ffe600'; c.shadowBlur = 20; c.fillStyle = '#ffe600'; c.font = '60px Impact'; c.fillText('ФИНИШ', T.cx, T.finY - 50); c.restore(); }
}

/* ---------- audio ---------- */
let AC, o1, o2, flt, eg;
function audioInit() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  flt = AC.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 500;
  eg = AC.createGain(); eg.gain.value = 0;
  o1 = AC.createOscillator(); o1.type = 'sawtooth'; o2 = AC.createOscillator(); o2.type = 'square';
  o1.connect(flt); o2.connect(flt); flt.connect(eg); eg.connect(AC.destination); o1.start(); o2.start();
}
function engine(r) {
  if (!AC) return; const t = AC.currentTime, f = 45 + r * 170;
  o1.frequency.setTargetAtTime(f, t, .05); o2.frequency.setTargetAtTime(f * .5, t, .05);
  flt.frequency.setTargetAtTime(350 + r * 1800, t, .05); eg.gain.setTargetAtTime(.035 + .05 * r, t, .05);
}
function chime() {
  if (!AC) return;
  [1318.5, 1975.5].forEach((f, i) => {
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * .08;
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.1, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .35);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + .4);
  });
}


/* ---------- menu flow ---------- */
const page = n => { document.querySelectorAll('.page').forEach(e => e.classList.remove('on')); if (n) $('p' + n).classList.add('on'); };
$('toGarage').onclick = () => { audioInit(); sel.name = $('nick').value.replace(/[<>&]/g, '').trim() || 'Racer'; page(2); };
$('prevCar').onclick = () => { sel.car = names[(names.indexOf(sel.car) + 3) % 4]; showStats(); };
$('nextCar').onclick = () => { sel.car = names[(names.indexOf(sel.car) + 1) % 4]; showStats(); };
$('col').oninput = e => sel.color = e.target.value;
$('toTrack').onclick = () => { drawLevels(); page(3); };
function drawLevels() {
  $('lvs').innerHTML = LEVELS.map((l, i) => `<button class="lv${i === level ? ' sel' : ''}" data-i="${i}" ${i > unlocked ? 'disabled' : ''}>${i > unlocked ? '🔒 ' : ''}${i + 1}. ${l.name}<br><small>${l.dist / 1000} км${l.obs ? ', конусы' : ''}</small></button>`).join('');
  document.querySelectorAll('.lv').forEach(b => b.onclick = () => { setLevel(+b.dataset.i); drawLevels(); });
}
document.querySelectorAll('.card').forEach(el => el.onclick = () => {
  sel.track = el.dataset.t; document.querySelectorAll('.card').forEach(x => x.classList.toggle('sel', x === el));
});
function showStats() {
  $('carName').textContent = label[sel.car]; if (!CARS) return; const c = CARS[sel.car];
  const bar = (n, v) => `<div class="bar"><span>${n}</span><div><i style="width:${v * 100}%"></i></div></div>`;
  $('stats').innerHTML = bar('Скорость', c.speed / 340) + bar('Управление', c.handling / 3) + bar('Разгон', c.accel / 430);
}
let bg = null, skids = [], players = [], coins = [], disp = {}, parts = [], keys = {}, lastIn = '';
$('startSolo').onclick = () => { audioInit(); peer = null; startRace(); };
$('hostBtn').onclick = hostRoom;
$('joinBtn').onclick = () => joinRoom($('code').value);
const qRoom = new URLSearchParams(location.search).get('room'); if (qRoom) $('code').value = qRoom.toUpperCase().slice(0, 5);

/* ---------- input ---------- */
const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
function sendIn(e, v) {
  const k = map[e.code]; if (!k || !racing) return;
  e.preventDefault(); keys[k] = v; sendInput();
  
}
addEventListener('keydown', e => { if (racing && !hostConn) { if (e.code === 'KeyR') newRace(); if (e.code === 'KeyN' && level < unlocked) { setLevel(level + 1); newRace(); } } });
addEventListener('keydown', e => sendIn(e, 1)); addEventListener('keyup', e => sendIn(e, 0));

/* ---------- host simulation (solo = host + bots) ---------- */
const DT = 1 / 60, onRoad = (x, y) => Math.abs(x - T.cx) < T.half;
let obs = [], simAcc = 0, simLast = 0, tk = 0, cid = 0, finished = 0, peer = null, hostConn = null, conns = [], lastCoins = 0;
const $m = t => { $('err').textContent = t; };
function spawnCoin() { coins.push({ id: ++cid, x: T.cx + (Math.random() - .5) * (T.half * 2 - 60), y: T.finY + 400 + Math.random() * (T.startY - T.finY - 900) }); }
function mkPlayer(id, n, k, col, i, bot) {
  return { id, n, k, c: col, bot, x: T.cx + ((i % 4) - 1.5) * 65, y: T.startY + Math.floor(i / 4) * 70 + (i % 2) * 25, a: -Math.PI / 2, d: -Math.PI / 2, v: 0, coins: 0, fin: 0, in: {}, lane: (Math.random() - .5) * 160, skill: LEVELS[level].bots * (.95 + Math.random() * .07) };
}
function newRace() {
  coins = []; cid = 0; finished = 0; lastCoins = 0; disp = {}; $('msg').textContent = '';
  skids = [];
  for (let i = 0; i < LEVELS[level].coins; i++) spawnCoin();
  obs = []; for (let i = 0; i < LEVELS[level].obs; i++) obs.push({ x: T.cx + (Math.random() - .5) * (T.half * 2 - 50), y: T.finY + 350 + Math.random() * (T.startY - T.finY - 800) });
  const old = players.filter(p => !p.bot), hum = old.length ? old : [mkPlayer(myId, sel.name, sel.car, sel.color, 0)];
  hum.forEach((p, i) => Object.assign(p, mkPlayer(p.id, p.n, p.k, p.c, i), { in: p.id === myId ? keys : {} }));
  const B = [['Nitro Nick', 'muscle', '#ffe600'], ['Brooklyn Bolt', 'sports', '#00f0ff'], ['Taxi Tina', 'taxi', '#ff8c00'], ['Officer Dash', 'police', '#1a6bff']];
  players = peer ? hum : [...hum, ...B.map((b, i) => mkPlayer('bot' + i, b[0], b[1], b[2], hum.length + i, true))];
  conns.forEach(c => c.open && (c.send({ t: 'reset', lv: level }), c.send({ t: 'coins', c: coins, o: obs })));
}
function showGame() { page(0); $('game').style.display = 'block'; $('hud').style.display = 'block'; racing = true; }
function startRace() {
  setLevel(level); bg = buildTile(sel.track); skids = []; parts = []; keys = {}; players = []; newRace(); showGame();
}
function ai(p) {
  let tx = T.cx + p.lane, ty = p.y - 220 - p.v * .25, best = null, bd = 380;
  coins.forEach(k => { const dy = p.y - k.y, dx = k.x - p.x; if (dy > 30 && dy < bd && Math.abs(dx) < dy * .7) { bd = dy; best = k; } });
  if (best) { tx = best.x; ty = best.y; }
  obs.forEach(o => { const dy = p.y - o.y; if (dy > 0 && dy < 260 && Math.abs(o.x - p.x) < 42) { tx = p.x + (p.x > o.x ? 80 : -80); ty = p.y - 160; } });
  const df = nAng(Math.atan2(ty - p.y, tx - p.x) - p.a);
  p.in = { up: Math.abs(df) < .9 || p.v < 90, down: p.v > 200 && Math.abs(df) > 1.1, left: df < -.08, right: df > .08 };
}
function step(p) {
  if (p.bot && !p.fin) ai(p);
  const C = CARS[p.k], i = p.fin ? {} : p.in, off = !onRoad(p.x, p.y), max = C.speed * (off ? .5 : 1) * (p.bot ? p.skill : 1);
  if (i.up) p.v += C.accel * DT; else if (i.down) p.v -= C.accel * 1.2 * DT; else p.v *= p.fin ? .97 : .99;
  if (off) p.v *= .985;
  if (p.v > max) p.v = Math.max(max, p.v - 300 * DT);
  p.v = Math.max(-max / 3, p.v);
  p.a += ((i.right ? 1 : 0) - (i.left ? 1 : 0)) * C.handling * DT * Math.max(-1, Math.min(1, p.v / 120));
  p.d += nAng(p.a - p.d) * (off ? .06 : .14); // drift: travel direction lags behind heading
  p.y = Math.max(20, Math.min(H - 20, p.y + Math.sin(p.d) * p.v * DT));
  p.x += Math.cos(p.d) * p.v * DT;
  if (p.x < RL - 40 || p.x > RR + 40) { p.x = Math.max(RL - 40, Math.min(RR + 40, p.x)); p.v *= .97; p.a += nAng(-Math.PI / 2 - p.a) * .08; p.d += nAng(-Math.PI / 2 - p.d) * .08; }
}
function tick() {
  let ch = false;
  players.forEach(p => {
    step(p); if (!p.fin && p.y <= T.finY) p.fin = ++finished;
    for (let j = obs.length - 1; j >= 0; j--) if (Math.hypot(obs[j].x - p.x, obs[j].y - p.y) < 24) { obs.splice(j, 1); p.v *= .4; ch = true; }
    for (let j = coins.length - 1; j >= 0; j--) if (Math.hypot(coins[j].x - p.x, coins[j].y - p.y) < 30) { coins.splice(j, 1); p.coins++; ch = true; }
  });
  for (let a = 0; a < players.length; a++) for (let b = a + 1; b < players.length; b++) {
    const A = players[a], B = players[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    if (d < 40) { const k = (40 - d) / 2; A.x -= dx / d * k; A.y -= dy / d * k; B.x += dx / d * k; B.y += dy / d * k; A.v *= .95; B.v *= .95; }
  }
  if (ch) conns.forEach(c => c.open && c.send({ t: 'coins', c: coins, o: obs }));
  if (++tk % 2 === 0 && conns.length) {
    const s = { t: 's', p: players.map(p => ({ id: p.id, n: p.n, c: p.c, k: p.k, x: +p.x.toFixed(1), y: +p.y.toFixed(1), a: +p.a.toFixed(3), v: +p.v.toFixed(1), coins: p.coins, fin: p.fin })) };
    conns.forEach(c => c.open && c.send(s));
  }
}

/* ---------- online: PeerJS (WebRTC) ---------- */
function onConn(c) {
  conns.push(c);
  c.on('data', m => {
    const p = players.find(q => q.id === c.peer);
    if (m.t === 'join' && !p) {
      players.push(mkPlayer(c.peer, String(m.n || 'Racer').replace(/[<>&]/g, '').slice(0, 12), CARS[m.k] ? m.k : 'sports', /^#[0-9a-f]{6}$/i.test(m.c) ? m.c : '#ff2e63', players.length));
      c.send({ t: 'hello', track: sel.track, lv: level }); c.send({ t: 'coins', c: coins, o: obs });
    } else if (m.t === 'in' && p && m.in) p.in = { up: !!m.in.up, down: !!m.in.down, left: !!m.in.left, right: !!m.in.right };
  });
  c.on('close', () => { players = players.filter(q => q.id !== c.peer); conns = conns.filter(x => x !== c); });
}
function hostRoom() {
  if (typeof Peer === 'undefined') return $m('Нет доступа к PeerJS: проверь интернет.');
  audioInit(); $m('Создаю комнату…');
  const code = Math.random().toString(36).slice(2, 7).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  peer = new Peer('nycr-' + code);
  peer.on('open', id => {
    myId = id; peer.on('connection', onConn); startRace();
    const link = location.href.split(/[?#]/)[0] + '?room=' + code;
    $('room').innerHTML = 'Комната: <b>' + code + '</b> <button id="cp">Копировать ссылку</button>';
    $('cp').onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(link); $('cp').textContent = 'Скопировано'; };
  });
  peer.on('error', e => { if (e.type === 'unavailable-id') { peer.destroy(); hostRoom(); } else $m('Ошибка: ' + e.type); });
}
function joinRoom(code) {
  code = code.trim().toUpperCase(); if (!code) return $m('Введи код комнаты.');
  if (typeof Peer === 'undefined') return $m('Нет доступа к PeerJS: проверь интернет.');
  audioInit(); $m('Подключение…'); peer = new Peer();
  setTimeout(() => { if (!racing) $m('Не удалось подключиться. Проверь код и интернет.'); }, 15000);
  peer.on('open', id => {
    myId = id; const c = hostConn = peer.connect('nycr-' + code, { reliable: true });
    c.on('open', () => c.send({ t: 'join', n: sel.name, k: sel.car, c: sel.color }));
    c.on('data', m => {
      if (m.t === 'hello') { sel.track = m.track; setLevel(m.lv); bg = buildTile(m.track); skids = []; disp = {}; parts = []; $('room').innerHTML = 'Комната: <b>' + code + '</b>'; showGame(); }
      else if (m.t === 's') players = m.p;
      else if (m.t === 'coins') { coins = m.c; obs = m.o || []; }
      else if (m.t === 'reset') { if (m.lv !== undefined) setLevel(m.lv); disp = {}; lastCoins = 0; $('msg').textContent = ''; skids = []; }
    });
    c.on('close', () => { $('msg').textContent = 'Хост вышел'; });
  });
  peer.on('error', e => $m(e.type === 'peer-unavailable' ? 'Комната не найдена.' : 'Ошибка: ' + e.type));
}
function sendInput() { if (hostConn && hostConn.open) hostConn.send({ t: 'in', in: { up: keys.up, down: keys.down, left: keys.left, right: keys.right } }); }

/* ---------- main loop ---------- */
const cv = $('game'), c = cv.getContext('2d'), pv = $('prev').getContext('2d');
let fr = 0, lbT = 0;
function resize() { cv.width = innerWidth; cv.height = innerHeight; } addEventListener('resize', resize); resize();

function garage(t) {
  pv.setTransform(1, 0, 0, 1, 0, 0);
  const g = pv.createRadialGradient(190, 115, 10, 190, 115, 220); g.addColorStop(0, '#5b2a9a'); g.addColorStop(1, '#12002b');
  pv.fillStyle = g; pv.fillRect(0, 0, 380, 230);
  pv.strokeStyle = '#00f0ff55'; for (let i = 0; i < 380; i += 38) { pv.beginPath(); pv.moveTo(i, 150); pv.lineTo(190 + (i - 190) * 3, 230); pv.stroke(); }
  pv.translate(190, 115); pv.rotate(t * .6); pv.scale(3.4, 3.4); drawCar(pv, sel.car, sel.color, t);
}

function race(t) {
  const me = disp[myId]; if (!me) { c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height); }
  const night = sel.track === 'city', dt = 1 / 60;
  const z = Math.max(1, cv.width / W), vw = cv.width / z, vh = cv.height / z, cx = (W - vw) / 2, cy = Math.max(-200, Math.min(H - vh + 200, (me ? me.y : T.startY) - vh * .7));
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = night ? '#07070f' : '#0077b6'; c.fillRect(0, 0, cv.width, cv.height);
  c.setTransform(z, 0, 0, z, 0, 0); c.translate(-cx, -cy); drawWorld(c, cx, cy, vw, vh, t, night);
  // update displayed players, skid + smoke
  const alive = {};
  players.forEach(p => {
    alive[p.id] = 1; const d = disp[p.id] || (disp[p.id] = { x: p.x, y: p.y, a: p.a, v: 0 }), pa = d.a, pvl = d.v;
    d.x += (p.x - d.x) * .45; d.y += (p.y - d.y) * .45; d.a += nAng(p.a - d.a) * .5; d.v = p.v;
    const da = Math.abs(nAng(d.a - pa)), ca = Math.cos(d.a), sa = Math.sin(d.a);
    if (Math.abs(p.v) > 140 && da > .02) [-11, 11].forEach(s => { skids.push({ x: d.x - ca * 15 - sa * s, y: d.y - sa * 15 + ca * s, l: 1 }); });
    if (p.v > pvl + .5 && p.v > 15 && Math.random() < .7 && parts.length < 300)
      parts.push({ x: d.x - ca * 30, y: d.y - sa * 30, vx: -ca * 20 + (Math.random() - .5) * 20, vy: -sa * 20 + (Math.random() - .5) * 20, l: 1, r: 4 + Math.random() * 4 });
    d.k = p.k; d.c = p.c; d.n = p.n;
  });
  Object.keys(disp).forEach(k => { if (!alive[k]) delete disp[k]; });
  if (skids.length > 1600) skids.splice(0, 300);
  for (let i = skids.length - 1; i >= 0; i--) { const k = skids[i]; k.l -= .003; if (k.l <= 0) { skids.splice(i, 1); continue; } if (k.y > cy - 20 && k.y < cy + vh + 20) { c.fillStyle = `rgba(8,8,8,${k.l * .55})`; c.beginPath(); c.arc(k.x, k.y, 2.4, 0, 7); c.fill(); } }
  // coins: spinning 3D-like glow
  coins.forEach(k => {
    if (k.y < cy - 30 || k.y > cy + vh + 30) return;
    const sp = Math.abs(Math.cos(t * 3 + k.id)), pul = 12 + 8 * Math.sin(t * 5 + k.id);
    c.save(); c.translate(k.x, k.y); c.shadowColor = '#ffd400'; c.shadowBlur = pul;
    const g = c.createRadialGradient(-3, -3, 1, 0, 0, 12); g.addColorStop(0, '#fffbb0'); g.addColorStop(.6, '#ffd400'); g.addColorStop(1, '#b8860b');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, Math.max(2, 11 * sp), 11, 0, 0, 7); c.fill();
    c.shadowBlur = 0; c.strokeStyle = '#9a6b00'; c.lineWidth = 2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-2 * sp, -4, 3 * sp, 2, 0, 0, 7); c.fill(); c.restore();
  });
  obs.forEach(o => {
    if (o.y < cy - 30 || o.y > cy + vh + 30) return;
    c.save(); c.translate(o.x, o.y); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(5, 6, 14, 8, 0, 0, 7); c.fill();
    c.fillStyle = '#222'; c.fillRect(-12, 6, 24, 5);
    const g = c.createLinearGradient(-10, 0, 10, 0); g.addColorStop(0, '#ff7a00'); g.addColorStop(1, '#ff3d00');
    c.fillStyle = g; c.beginPath(); c.moveTo(-9, 7); c.lineTo(0, -14); c.lineTo(9, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(-6, -2, 12, 4); c.restore();
  });
  // smoke
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt * 1.4; p.r += dt * 10;
    if (p.l <= 0) { parts.splice(i, 1); continue; }
    c.fillStyle = `rgba(200,200,200,${p.l * .35})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
  }
  const ds = Object.values(disp);
  ds.forEach(d => { c.save(); c.translate(d.x, d.y); c.rotate(d.a); cone(c, night); c.restore(); });
  ds.forEach(d => { c.save(); c.translate(d.x, d.y); c.rotate(d.a); drawCar(c, d.k, d.c, t); c.restore(); });
  c.textAlign = 'center'; c.font = 'bold 13px Verdana'; c.lineWidth = 3;
  ds.forEach(d => { c.strokeStyle = '#000'; c.fillStyle = '#fff'; c.strokeText(d.n, d.x, d.y - 32); c.fillText(d.n, d.x, d.y - 32); });
  // engine sound + HUD
  const mp = players.find(p => p.id === myId);
  if (mp) {
    if (mp.coins > lastCoins) chime(); lastCoins = mp.coins;
    engine(Math.min(1, Math.abs(mp.v) / CARS[mp.k].speed)); $('spd').textContent = Math.round(Math.abs(mp.v) * .6) + ' км/ч · осталось ' + Math.max(0, Math.round(mp.y - T.finY)) + ' м';
    if (mp.fin && mp.fin <= 3 && level + 1 > unlocked && level + 1 < LEVELS.length) { unlocked = level + 1; try { localStorage.setItem('nycr_lv', unlocked); } catch (e) {} }
    $('msg').textContent = mp.fin ? '🏁 Финиш! Место: ' + mp.fin + (hostConn ? ' — ждём хоста' : ' — R: заново' + (level < unlocked ? ', N: след. уровень' : '')) : '';
  }
  if (t - lbT > .25) {
    lbT = t;
    $('lb').innerHTML = '<h4>УР. ' + (level + 1) + ' · ' + LEVELS[level].name + '</h4>' + [...players].sort((a, b) => (a.fin || 99) - (b.fin || 99) || a.y - b.y).map(p =>
      `<div class="pl${p.id === myId ? ' me' : ''}"><u style="background:${p.c}"></u>${p.fin ? '🏁 ' : ''}${p.n}<em>&#9679; ${p.coins}</em></div>`).join('');
    $('prog').innerHTML = players.map(p => `<i style="left:${Math.max(0, Math.min(100, (T.startY - p.y) / (T.startY - T.finY) * 100))}%;background:${p.c}"></i>`).join('');
  }
}
function frame(ms) {
  requestAnimationFrame(frame); const t = ms / 1000;
  if ($('p2').classList.contains('on')) garage(t);
  if (racing && bg) { if (!hostConn) { simAcc += Math.min(ms - simLast, 100); while (simAcc >= 1000 / 60) { tick(); simAcc -= 1000 / 60; } } race(t); }
  simLast = ms;
}
requestAnimationFrame(frame);
showStats();
