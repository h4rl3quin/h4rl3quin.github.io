// Butter vs. Lasting Marriages in Maine — seesaw infographic (p5.js)
// Sliders resize the two blocks (they always sum to TOTAL, so one grows as the other shrinks).
// Press 1 = drop the butter block, 2 = drop the marriages block.

// ---- data / tuning ---------------------------------------------------------
const TOTAL = 9.5;            // butter + marriages (2009: 3.7 lb + 5.8)
const MIN_V = 0.5;            // smallest value either block can have
let butterVal = 3.7;          // marriages = TOTAL - butterVal

const G = 1800;               // gravity (px/s^2)
const PLANK_MASS = 2;         // plank weight in "value" units
const THETA_MAX = 0.30;       // max tilt in radians (plank hits the ground)
const LAUNCH_BOOST = 1.2;     // extra whip on the launched block
const STOP_RESTITUTION = 0.15;
const ANG_DAMP = 0.35;
const HOLD_TIME = 0.8;        // seconds the block hangs in the sky before falling
const BG = '#2b2b2b';

const blocks = [
  { key: 'butter',   sign: -1, col: '#E8A317', labelCol: '#F7CB6B',
    title: 'Butter Consumption per Capita', fmt: v => v.toFixed(1) + ' lb' },
  { key: 'marriage', sign: +1, col: '#D6457A', labelCol: '#F391B4',
    title: 'Lasting Marriages in Maine',    fmt: v => Math.round(v / TOTAL * 100) + '%' }
];

// ---- state -----------------------------------------------------------------
let mode = 'idle';            // idle | hold | sim
let holdT = 0, simT = 0, settleT = 0;
let theta = 0, omega = 0;     // plank angle (+ = right end down) and angular speed
let L, Lp, th, maxSide, triH, pivotX, pivotY, floorY;
let sliderL, sliderR;

// ---- helpers ---------------------------------------------------------------
const valueOf = b => b.key === 'butter' ? butterVal : TOTAL - butterVal;
const sideOf  = b => maxSide * Math.sqrt(valueOf(b) / (TOTAL - MIN_V));

function layout() {
  L = constrain((width / 2 - 80) / 1.3, 90, 340);   // lever arm of the blocks
  maxSide = 0.55 * L;
  Lp = L + maxSide / 2 + 10;                          // half plank length
  th = max(14, 0.06 * L);                             // plank thickness
  triH = Lp * sin(THETA_MAX) + th / 2 + 2;            // so the low end just touches the floor
  floorY = height - 20;                               // bottom aligned
  pivotX = width / 2;                                 // centered
  pivotY = floorY - triH;
}

function layoutSliders() {
  const len = min(240, height * 0.38);
  placeSlider(sliderL, pivotX - (Lp + 42), pivotY, len);
  placeSlider(sliderR, pivotX + (Lp + 42), pivotY, len);
}

function placeSlider(s, cx, cy, len) {
  s.style('width', len + 'px');
  s.style('height', '20px');
  s.style('transform', 'rotate(-90deg)');   // vertical: top = bigger
  s.style('margin', '0');
  s.position(cx - len / 2, cy - 10);
}

function attachedPose(b) {
  const s = sideOf(b);
  const lx = b.sign * L, ly = -(th / 2 + s / 2);
  const c = cos(theta), sn = sin(theta);
  return { x: pivotX + lx * c - ly * sn, y: pivotY + lx * sn + ly * c, ang: theta, s };
}
function poseOf(b) {
  return b.attached ? attachedPose(b) : { x: b.x, y: b.y, ang: 0, s: sideOf(b) };
}

function toIdle() {
  mode = 'idle'; omega = 0;
  blocks.forEach(b => { b.attached = true; b.vy = 0; });
}

// ---- setup -----------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  layout();
  blocks.forEach(b => { b.attached = true; b.x = 0; b.y = 0; b.vy = 0; });

  sliderL = createSlider(MIN_V, TOTAL - MIN_V, butterVal, 0.1);
  sliderR = createSlider(MIN_V, TOTAL - MIN_V, TOTAL - butterVal, 0.1);
  sliderL.style('accent-color', blocks[0].col);
  sliderR.style('accent-color', blocks[1].col);

  // linked sliders: one up = the other down by the same amount
  sliderL.input(() => {
    butterVal = round(sliderL.value() * 10) / 10;
    sliderR.value(TOTAL - butterVal);
    toIdle();
  });
  sliderR.input(() => {
    butterVal = round((TOTAL - sliderR.value()) * 10) / 10;
    sliderL.value(butterVal);
    toIdle();
  });
  layoutSliders();
  theta = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layout();
  layoutSliders();
  toIdle();
}

// ---- input -----------------------------------------------------------------
function keyPressed() {
  if (key === '1') startDrop('butter');
  if (key === '2') startDrop('marriage');
}

function startDrop(k) {
  const d = blocks.find(b => b.key === k);
  blocks.forEach(b => { b.attached = true; b.vy = 0; });
  d.attached = false;
  theta = -d.sign * THETA_MAX;                  // dropped block's end is UP, the other end rests low
  omega = 0;
  d.x = pivotX + d.sign * L * cos(theta);
  d.y = 100 + sideOf(d) / 2;                    // up in the sky
  d.vy = 0;
  mode = 'hold'; holdT = 0; simT = 0; settleT = 0;
}

// ---- physics ---------------------------------------------------------------
function inertia() {
  let I = PLANK_MASS * Lp * Lp / 3;
  for (const b of blocks) if (b.attached) I += valueOf(b) * L * L;
  return I;
}

function stopHit(dir) {
  theta = dir * THETA_MAX;
  const w = omega * dir;                         // > 0 means swinging into the ground
  if (w > 0) {
    if (w > 0.6) {
      // the plank slams the ground: whatever sits on the rising end gets flung
      const rising = blocks.find(b => b.attached && b.sign === -dir);
      if (rising) {
        const p = attachedPose(rising);
        rising.attached = false;
        rising.x = p.x; rising.y = p.y;
        rising.vy = -w * L * cos(theta) * LAUNCH_BOOST;
      }
      omega = -omega * STOP_RESTITUTION;
    } else {
      omega = 0;
    }
  }
}

function land(b, r) {
  // inelastic hit: angular momentum about the pivot is conserved
  const m = valueOf(b);
  const I = inertia();
  omega = (I * omega + m * b.vy * r) / (I + m * r * r);
  b.attached = true; b.vy = 0;
}

function stepPhysics(dt) {
  const I = inertia();
  let torqueSum = 0;
  for (const b of blocks) if (b.attached) torqueSum += valueOf(b) * b.sign;
  omega += (G * cos(theta) * L * torqueSum / I) * dt;
  omega *= (1 - ANG_DAMP * dt);
  theta += omega * dt;
  if (theta > THETA_MAX) stopHit(1);
  else if (theta < -THETA_MAX) stopHit(-1);

  for (const b of blocks) {
    if (b.attached) continue;
    b.vy += G * dt;
    b.y += b.vy * dt;
    const s = sideOf(b);
    const r = b.x - pivotX;
    const ct = cos(theta);
    const surfaceY = pivotY + r * tan(theta) - th / (2 * ct);
    const surfaceV = r * omega / (ct * ct);
    if (b.y + s / 2 >= surfaceY && (b.vy - surfaceV) > 0) land(b, r);
  }
}

function update(dt) {
  if (mode === 'idle') {
    // at rest: the heavier block sits low
    const diff = valueOf(blocks[1]) - valueOf(blocks[0]);
    const target = abs(diff) < 0.05 ? 0 : Math.sign(diff) * THETA_MAX;
    theta += (target - theta) * (1 - exp(-8 * dt));
    omega = 0;
  } else if (mode === 'hold') {
    holdT += dt;
    if (holdT >= HOLD_TIME) mode = 'sim';
  } else {
    simT += dt;
    const steps = ceil(dt * 240);
    for (let i = 0; i < steps; i++) stepPhysics(dt / steps);

    const calm = blocks.every(b => b.attached) &&
                 abs(omega) < 0.08 && abs(theta) >= THETA_MAX - 1e-3;
    settleT = calm ? settleT + dt : 0;
    if (settleT > 0.6 || simT > 30) toIdle();
  }
}

// ---- drawing ---------------------------------------------------------------
function draw() {
  update(min(deltaTime / 1000, 0.05));
  background(BG);

  // hint
  noStroke(); fill('#E8A317' ); textAlign(CENTER, TOP); textSize(16);
  text('Resize the blocks with the sliders   •   press 1 to drop butter   •   press 2 to drop marriages',
       width / 2, 12);

  // floor + triangle base
  stroke('#4a4a4a'); strokeWeight(2); line(0, floorY, width, floorY);
  noStroke(); fill('#7d7d7d');
  triangle(pivotX, pivotY, pivotX - triH * 0.6, floorY, pivotX + triH * 0.6, floorY);

  // plank
  push();
  translate(pivotX, pivotY); rotate(theta);
  rectMode(CENTER); fill('#cfcfcf'); noStroke();
  rect(0, 0, 2 * Lp, th, th / 2);
  pop();
  fill('#5f5f5f'); circle(pivotX, pivotY, th * 0.5);

  // blocks + labels
  for (const b of blocks) {
    const p = poseOf(b);
    push();
    translate(p.x, p.y); rotate(p.ang);
    rectMode(CENTER); noStroke(); fill(b.col);
    rect(0, 0, p.s, p.s, 10);
    pop();
    drawLabel(b, p);
  }

  // slider captions
  noStroke(); textSize(16); textAlign(CENTER, TOP);
  const cy = pivotY + min(240, height * 0.38) / 2 + 14;
  fill(blocks[0].labelCol); text('Butter Sales',   pivotX - (Lp + 80), cy);
  fill(blocks[1].labelCol); text('Couple Councling', pivotX + (Lp + 100), cy);
}

function drawLabel(b, p) {
  const off = p.y + p.s / 2 < 0;                 // block is above the screen
  const lx = constrain(p.x, 95, width - 95);
  const ly = max(p.y - p.s / 2 - 10, 74);        // floats above the block, stays on screen
  noStroke(); fill(b.labelCol); textAlign(CENTER, BOTTOM);
  textStyle(BOLD); textSize(24);
  text(b.fmt(valueOf(b)), lx, ly);
  textStyle(NORMAL); textSize(constrain(L * 0.05, 11, 15));
  text((off ? '▲ ' : '') + b.title, lx, ly - 28);
}