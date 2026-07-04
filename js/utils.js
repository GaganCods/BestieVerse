// BestieVerse - Utilities (Web Audio API SFX Synth and Canvas Particle Engine)

let audioCtx = null;
let soundEnabled = true;

// Sound effects synth
export function toggleSound(enabled) {
  soundEnabled = enabled;
}

export function playSFX(type) {
  if (!soundEnabled) return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  switch (type) {
    case 'click': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }
    case 'pop': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
    case 'success': {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.15);
      });
      break;
    }
    case 'fail': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }
    case 'triumph': {
      const seq = [
        { note: 523.25, dur: 0.15, offset: 0 },
        { note: 659.25, dur: 0.15, offset: 0.15 },
        { note: 783.99, dur: 0.15, offset: 0.3 },
        { note: 1046.50, dur: 0.4, offset: 0.45 }
      ];
      seq.forEach(s => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(s.note, now + s.offset);
        gain.gain.setValueAtTime(0.15, now + s.offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + s.offset + s.dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + s.offset);
        osc.stop(now + s.offset + s.dur);
      });
      break;
    }
  }
}

// Particle Canvas Systems
let canvas;
let ctx;
let activeEffect = 'stars'; // 'stars', 'snow', 'confetti', 'none'
let particles = [];
let sparkles = [];
let explosions = [];
let width = window.innerWidth;
let height = window.innerHeight;

export function initEffects(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Track cursor position
  window.addEventListener('mousemove', (e) => {
    spawnSparkle(e.clientX, e.clientY);
  });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      spawnSparkle(e.touches[0].clientX, e.touches[0].clientY);
    }
  });

  requestAnimationFrame(loop);
}

export function setEffectType(type) {
  activeEffect = type;
  particles = [];
}

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function spawnSparkle(x, y) {
  const colors = ['#C5B0E8', '#FF9B85', '#E1F8F6', '#FFF8E7', '#F0F4F8'];
  const count = Math.random() > 0.6 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x,
      y,
      size: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5 - 0.3,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }
}

export function triggerConfetti() {
  const colors = ['#C5B0E8', '#FF9B85', '#CDF0EA', '#FFF5C0', '#F0F4F8'];
  for (let i = 0; i < 120; i++) {
    explosions.push({
      type: 'confetti',
      x: Math.random() * width,
      y: -20 - Math.random() * 50,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      dx: (Math.random() - 0.5) * 3,
      dy: Math.random() * 4 + 3,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      alpha: 1
    });
  }
}

export function triggerFireworks() {
  const colors = ['#C5B0E8', '#FF9B85', '#CDF0EA', '#FFF5C0'];
  for (let b = 0; b < 5; b++) {
    setTimeout(() => {
      const cx = Math.random() * (width - 200) + 100;
      const cy = Math.random() * (height - 250) + 100;
      const count = 50;
      const col = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 5 + 1.5;
        explosions.push({
          type: 'firework',
          x: cx,
          y: cy,
          size: Math.random() * 2 + 1,
          color: col,
          dx: Math.cos(ang) * spd,
          dy: Math.sin(ang) * spd,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.012
        });
      }
    }, b * 500);
  }
}

// Drawing helper for stars
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color, alpha) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function loop() {
  ctx.clearRect(0, 0, width, height);

  // Background particle spawners
  if (activeEffect !== 'none') {
    if (activeEffect === 'stars' && particles.length < 30 && Math.random() < 0.04) {
      const colors = ['#C5B0E8', '#FF9B85', '#E1F8F6', '#FFF8E7'];
      particles.push({
        type: 'star',
        x: Math.random() * width,
        y: height + 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        dy: -(Math.random() * 1.2 + 0.6),
        dx: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.2,
        wiggle: Math.random() * 100,
        wiggleSpeed: Math.random() * 0.02 + 0.01
      });
    } else if (activeEffect === 'snow' && particles.length < 60 && Math.random() < 0.15) {
      particles.push({
        type: 'snow',
        x: Math.random() * width,
        y: -10,
        size: Math.random() * 3 + 1,
        color: '#FFF',
        dy: Math.random() * 0.8 + 0.4,
        dx: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  // Draw background particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.dy;
    p.x += p.dx;

    if (p.type === 'star') {
      p.wiggle += p.wiggleSpeed;
      p.x += Math.sin(p.wiggle) * 0.3;
      drawStar(ctx, p.x, p.y, 5, p.size, p.size / 2, p.color, p.alpha);
    } else if (p.type === 'snow') {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (p.y < -30 || p.y > height + 30 || p.x < -30 || p.x > width + 30) {
      particles.splice(i, 1);
    }
  }

  // Draw sparkles (cursor trail)
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.dx;
    s.y += s.dy;
    s.alpha -= s.decay;

    if (s.alpha <= 0) {
      sparkles.splice(i, 1);
      continue;
    }

    drawStar(ctx, s.x, s.y, 4, s.size, s.size / 2, s.color, s.alpha);
  }

  // Draw explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    
    if (e.type === 'confetti') {
      e.y += e.dy;
      e.x += e.dx;
      e.rot += e.rotSpeed;
      e.dx += Math.sin(e.y * 0.05) * 0.05; // sway

      ctx.save();
      ctx.globalAlpha = e.alpha;
      ctx.fillStyle = e.color;
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rot * Math.PI / 180);
      ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size/2);
      ctx.restore();

      if (e.y > height + 10) {
        explosions.splice(i, 1);
      }
    } else if (e.type === 'firework') {
      e.x += e.dx;
      e.y += e.dy;
      e.dy += 0.05; // gravity
      e.alpha -= e.decay;

      if (e.alpha <= 0) {
        explosions.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = e.alpha;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  requestAnimationFrame(loop);
}
