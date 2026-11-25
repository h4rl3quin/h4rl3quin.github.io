let txt = 'Come \n and \n get me!';
let fontSize = 250;
let gridDensity = 12;
let mouseRadius = 120;
let spreadSpeed = 30;
let returnSpeed = 30;
let particles = [];
let textBuffer;
let currentTheme = 0;

let themes = [
  {
    bg: [0, 20, 60],
    bgDark: [0, 80, 120],
    mouseEmoji: '🦈',
    emojis: ['🐟', '🐠', '🐡']
  },
  {
    bg: [60, 20, 20],
    bgDark: [120, 60, 40],
    mouseEmoji: '🫦',
    emojis: ['🍔', '🌮', '🍟']
  },
  {
    bg: [40, 45, 35],
    bgDark: [80, 88, 72],
    mouseEmoji: '🤚',
    emojis: ['🌷', '🌻', '🪻']
  },
  {
    bg: [35, 15, 50],
    bgDark: [72, 28, 100],
    mouseEmoji: '🐦‍⬛',
    emojis: ['🪰', '🪲', '🪱']
  }
];

let particleEmojis;
let mouseEmoji;
let emojiSize;
let mouseEmojiSize = 60;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textBuffer = createGraphics(width, height);
  textAlign(CENTER, CENTER);

  textBuffer.background(0);
  textBuffer.textFont("Georgia");
  textBuffer.fill(255);
  textBuffer.textSize(fontSize);
  textBuffer.textAlign(CENTER, CENTER);
  textBuffer.textLeading(fontSize - 30); 
  textBuffer.text(txt, width / 2, height / 2);

  loadTheme();
}

function loadTheme() {
  let theme = themes[currentTheme];
  background(theme.bg[0], theme.bg[1], theme.bg[2]);
  mouseEmoji = theme.mouseEmoji;
  particleEmojis = theme.emojis;
  emojiSize = gridDensity * random(1, 2);
  generateParticles();
}

function draw() {
  let theme = themes[currentTheme];

  // Semi-transparent tint
  background(theme.bg[0], theme.bg[1], theme.bg[2], 80);

  // Instruction text
  fill(theme.bgDark[0], theme.bgDark[1], theme.bgDark[2], 200);
  textSize(16);
  text('Press [1], [2], [3] or [4]', width / 2, height - 40);

  textBuffer.background(0);
  textBuffer.fill(255);
  textBuffer.textSize(fontSize);
  textBuffer.textAlign(CENTER, CENTER);
  textBuffer.text(txt, width / 2, height / 2);

  for (let p of particles) {
    p.update();
    p.draw();
  }

  // Draw mouse emoji
  textSize(mouseEmojiSize);
  text(mouseEmoji, mouseX, mouseY);
}

function generateParticles() {
  particles = [];
  let theme = themes[currentTheme];

  for (let y = 0; y < height; y += gridDensity) {
    for (let x = 0; x < width; x += gridDensity) {
      if (textBuffer.get(x, y)[0] > 128) {
        particles.push(new Particle(x, y, theme));
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateParticles();
}

function keyPressed() {
  if (key === '1') { currentTheme = 0; loadTheme(); }
  else if (key === '2') { currentTheme = 1; loadTheme(); }
  else if (key === '3') { currentTheme = 2; loadTheme(); }
  else if (key === '4') { currentTheme = 3; loadTheme(); }
}

class Particle {
  constructor(x, y, theme) {
    this.x = this.baseX = x;
    this.y = this.baseY = y;
    this.opa = random(200, 255);
    this.emoji = theme.emojis[floor(random(theme.emojis.length))];
  }

  update() {
    let waveX = sin(frameCount * 0.02 + this.baseY * 0.01) * 8;
    let waveY = cos(frameCount * 0.02 + this.baseX * 0.01) * 8;

    let targetX = this.baseX + waveX;
    let targetY = this.baseY + waveY;

    let dx = mouseX - this.x, dy = mouseY - this.y;
    let d = sqrt(dx*dx + dy*dy);
    if (d < mouseRadius && d > 0) {
      let f = (mouseRadius - d) / mouseRadius * spreadSpeed;
      this.x -= (dx / d) * f;
      this.y -= (dy / d) * f;
    } else {
      this.x = lerp(this.x, targetX, 1 / returnSpeed);
      this.y = lerp(this.y, targetY, 1 / returnSpeed);
    }
  }

  draw() {
    textSize(emojiSize);
    text(this.emoji, this.x, this.y);
  }
}
