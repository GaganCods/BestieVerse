// Canvas visual effects engine: Hearts, Snow, Rain, Sparkles, Confetti, and Fireworks

let canvas;
let ctx;
let activeEffect = 'hearts'; // 'hearts', 'snow', 'rain', 'none'
let particles = [];
let sparkles = [];
let explosions = [];
let width = window.innerWidth;
let height = window.innerHeight;

// Mouse coordinates for sparkle trail
const mouse = { x: null, y: null, active: false };

export function initEffects(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Track cursor movement for sparkle trail
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    spawnSparkle(e.clientX, e.clientY);
  });
  
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
      spawnSparkle(mouse.x, mouse.y);
    }
  });

  window.addEventListener('mouseout', () => {
    mouse.active = false;
  });

  // Start render loop
  requestAnimationFrame(loop);
}

export function setEffectType(type) {
  activeEffect = type;
  particles = []; // Clear current background particles
}

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

// Sparkle cursor spawning
function spawnSparkle(x, y) {
  const count = Math.random() > 0.5 ? 2 : 1;
  const colors = ['#FF8FAB', '#FFC2D1', '#FFD166', '#FFF7FA', '#00f2fe', '#4facfe'];
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: x,
      y: y,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.5 - 0.5,
      opacity: 1,
      decay: Math.random() * 0.015 + 0.015
    });
  }
}

// Global confetti trigger
export function triggerConfetti() {
  const colors = ['#FF8FAB', '#FFC2D1', '#FFD166', '#a29bfe', '#81ecec', '#55efc4'];
  const particleCount = 150;
  
  for (let i = 0; i < particleCount; i++) {
    explosions.push({
      type: 'confetti',
      x: Math.random() * width,
      y: -20 - Math.random() * 50,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 4,
      speedY: Math.random() * 5 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 5,
      opacity: 1
    });
  }
}

// Global firework trigger
export function triggerFireworks() {
  const colors = ['#FF8FAB', '#FFD166', '#FF3F6C', '#81ecec', '#a29bfe', '#ffeaa7'];
  const burstCount = 6;
  
  for (let b = 0; b < burstCount; b++) {
    setTimeout(() => {
      const centerX = Math.random() * (width - 200) + 100;
      const centerY = Math.random() * (height - 300) + 100;
      const sparkCount = 60 + Math.floor(Math.random() * 30);
      const fireworkColor = colors[Math.floor(Math.random() * colors.length)];
      
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        explosions.push({
          type: 'firework',
          x: centerX,
          y: centerY,
          size: Math.random() * 3 + 1.5,
          color: fireworkColor,
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          opacity: 1,
          decay: Math.random() * 0.015 + 0.01
        });
      }
    }, b * 600);
  }
}

// Draw a Bezier curve heart
function drawHeart(ctx, x, y, size, color, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.quadraticCurveTo(x, y, x + size / 2, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
  ctx.quadraticCurveTo(x + size, y + size * 2/3, x + size / 2, y + size);
  ctx.quadraticCurveTo(x, y + size * 2/3, x, y + size / 3);
  ctx.quadraticCurveTo(x - size, y, x - size / 2, y);
  ctx.quadraticCurveTo(x, y, x, y + size / 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Render loop
function loop() {
  ctx.clearRect(0, 0, width, height);

  // 1. Spawning background particles
  if (activeEffect !== 'none') {
    if (activeEffect === 'hearts' && particles.length < 35 && Math.random() < 0.03) {
      const colors = ['#FF8FAB', '#FFC2D1', '#FFD166', '#FFB6C1', '#FF69B4'];
      particles.push({
        x: Math.random() * width,
        y: height + 30,
        size: Math.random() * 15 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: -(Math.random() * 1.5 + 0.8),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.4 + 0.3,
        wiggle: Math.random() * 100,
        wiggleSpeed: Math.random() * 0.02 + 0.01
      });
    } else if (activeEffect === 'snow' && particles.length < 80 && Math.random() < 0.2) {
      particles.push({
        x: Math.random() * width,
        y: -10,
        size: Math.random() * 4 + 1.5,
        color: '#FFF',
        speedY: Math.random() * 1 + 0.5,
        speedX: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.6 + 0.2
      });
    } else if (activeEffect === 'rain' && particles.length < 120) {
      particles.push({
        x: Math.random() * width,
        y: -20,
        length: Math.random() * 15 + 15,
        speedY: Math.random() * 6 + 8,
        speedX: -1.5, // Wind tilt
        opacity: Math.random() * 0.2 + 0.1
      });
    }
  }

  // 2. Update and draw background particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.speedY;
    p.x += p.speedX;

    if (activeEffect === 'hearts') {
      p.wiggle += p.wiggleSpeed;
      p.x += Math.sin(p.wiggle) * 0.3;
      drawHeart(ctx, p.x, p.y, p.size, p.color, p.opacity);
    } else if (activeEffect === 'snow') {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (activeEffect === 'rain') {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.strokeStyle = '#FF8FAB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
      ctx.stroke();
      ctx.restore();
    }

    // Recycle or remove particles that go off-screen
    if (p.y < -50 || p.y > height + 50 || p.x < -50 || p.x > width + 50) {
      particles.splice(i, 1);
    }
  }

  // 3. Update and draw cursor sparkles
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.speedX;
    s.y += s.speedY;
    s.opacity -= s.decay;

    if (s.opacity <= 0) {
      sparkles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = s.color;
    
    // Draw simple sparkle cross/star
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Update and draw explosions (Confetti and Fireworks)
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    
    if (e.type === 'confetti') {
      e.y += e.speedY;
      e.x += e.speedX;
      e.rotation += e.rotationSpeed;
      
      // Swing movement
      e.speedX += Math.sin(e.y * 0.05) * 0.1;
      
      ctx.save();
      ctx.globalAlpha = e.opacity;
      ctx.fillStyle = e.color;
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotation * Math.PI / 180);
      ctx.fillRect(-e.size / 2, -e.size / 2, e.size, e.size / 2);
      ctx.restore();

      if (e.y > height + 20) {
        explosions.splice(i, 1);
      }
    } else if (e.type === 'firework') {
      e.x += e.speedX;
      e.y += e.speedY;
      // Gravity drag
      e.speedY += 0.08;
      e.opacity -= e.decay;

      if (e.opacity <= 0) {
        explosions.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = e.opacity;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  requestAnimationFrame(loop);
}
