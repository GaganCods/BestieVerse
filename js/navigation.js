// BestieVerse - Shell Routing and Tab Navigation Manager (URL-encoded)

import { playSFX } from './utils.js';
import { unlockAchievement } from './storage.js';
import { decodeCard, decodeResult } from './database.js';

let visitedViews = new Set();
const mainCategories = ['smile-view', 'music-view', 'games-view', 'quiz-view', 'meme-view', 'achievements-view'];

// Watch Hash Changes
export function initNavigation(routeChangeCallback, viewChangeCallback) {
  // Bind standard layout links inside app-shell
  const links = document.querySelectorAll('.nav-link, .mobile-nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      navigateTo(target, viewChangeCallback);
    });
  });

  // Welcome page button binders
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.onclick = () => {
      const nameInput = document.getElementById('f-friend-name');
      const name = nameInput ? nameInput.value.trim() : "";
      if (!name) {
        alert("Please enter your name to begin! 🌸");
        if (nameInput) nameInput.focus();
        return;
      }
      playSFX('click');
      navigateTo('smile-view', viewChangeCallback);
    };
  }

  const surpriseBtn = document.getElementById('random-surprise-btn');
  if (surpriseBtn) {
    surpriseBtn.onclick = () => {
      const nameInput = document.getElementById('f-friend-name');
      const name = nameInput ? nameInput.value.trim() : "";
      if (!name) {
        alert("Please enter your name to begin! 🌸");
        if (nameInput) nameInput.focus();
        return;
      }
      playSFX('triumph');
      const targets = ['smile-view', 'games-view', 'quiz-view', 'meme-view'];
      const pick = targets[Math.floor(Math.random() * targets.length)];
      navigateTo(pick, viewChangeCallback);
    };
  }

  // Setup Mascot & Secret Code detectors
  initSecrets();

  // Listen to hash changes for SPA shells routing
  const router = () => handleShellRouting(routeChangeCallback);
  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);

  // Initial trigger
  router();
}

// Shell View Routing Handler
async function handleShellRouting(callback) {
  const hash = window.location.hash || '#/';
  
  // Hide all shell containers
  document.querySelectorAll('.shell-view').forEach(shell => {
    shell.style.display = 'none';
  });

  // Reset page visual scroll
  window.scrollTo(0, 0);

  // Parse route matches
  if (hash === '#/' || hash === '') {
    showShell('landing-shell');
    if (callback) callback('landing', null);
  } else if (hash === '#/create') {
    showShell('creator-shell');
    if (callback) callback('create', null);
  } else if (hash.startsWith('#/dashboard/')) {
    const encodedCard = hash.replace('#/dashboard/', '');
    const card = decodeCard(encodedCard);
    if (!card) {
      alert("Invalid Dashboard URL! 💨");
      window.location.hash = '#/';
      return;
    }
    showShell('dashboard-shell');
    if (callback) callback('dashboard', encodedCard);
  } else if (hash.startsWith('#/f/')) {
    const encodedCard = hash.replace('#/f/', '');
    const card = decodeCard(encodedCard);
    if (!card) {
      alert("Oops! This BestieVerse link is invalid or corrupted. 💨");
      window.location.hash = '#/';
      return;
    }

    // Passcode validation overlay
    const overlay = document.getElementById('passcode-overlay');
    if (card.passcode) {
      showShell('app-shell');
      overlay.style.display = 'flex';
      
      const input = document.getElementById('passcode-input');
      const errorMsg = document.getElementById('passcode-error');
      const submitBtn = document.getElementById('submit-passcode-btn');

      input.value = '';
      errorMsg.style.display = 'none';

      const verifyPass = () => {
        if (input.value === card.passcode) {
          playSFX('success');
          overlay.style.display = 'none';
          if (callback) callback('friend', encodedCard);
        } else {
          playSFX('fail');
          errorMsg.style.display = 'block';
          input.value = '';
          input.focus();
        }
      };

      submitBtn.onclick = verifyPass;
      input.onkeypress = (e) => {
        if (e.key === 'Enter') verifyPass();
      };
    } else {
      overlay.style.display = 'none';
      showShell('app-shell');
      if (callback) callback('friend', encodedCard);
    }

  } else if (hash.startsWith('#/result/')) {
    const encodedResult = hash.replace('#/result/', '');
    const result = decodeResult(encodedResult);
    if (!result) {
      alert("Invalid Results URL! 💨");
      window.location.hash = '#/';
      return;
    }
    showShell('result-shell');
    if (callback) callback('result', encodedResult);
  } else if (hash.startsWith('#/verify/')) {
    const encodedResult = hash.replace('#/verify/', '');
    const result = decodeResult(encodedResult);
    if (!result) {
      alert("Invalid Verification URL! 💨");
      window.location.hash = '#/';
      return;
    }
    showShell('verify-shell');
    if (callback) callback('verify', encodedResult);
  } else {
    // Default routing fallback
    showShell('landing-shell');
    if (callback) callback('landing', null);
  }
}

function showShell(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  
  // Hide splash screen on direct loads
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';
}

// Inside App Navigation (Tab Toggles)
export function navigateTo(viewId, callback) {
  const views = document.querySelectorAll('.view');
  const targetView = document.getElementById(viewId);
  if (!targetView) return;

  // Track page visits for explorer badge
  if (mainCategories.includes(viewId)) {
    visitedViews.add(viewId);
    if (visitedViews.size === mainCategories.length) {
      if (unlockAchievement('explorer')) {
        alert("🧭 Explorer Badge Unlocked! You've visited all main sections in the BestieVerse! 🌸");
      }
    }
  }

  // Update Link classes
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    if (link.getAttribute('data-target') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle views
  views.forEach(v => v.classList.remove('active'));
  targetView.classList.add('active');

  if (callback) callback(viewId);
}

// Easter Eggs & Secrets
function initSecrets() {
  // 1. Double tap logo
  const logo = document.querySelector('.logo-wrap');
  let logoTaps = 0;
  if (logo) {
    logo.addEventListener('click', () => {
      logoTaps++;
      if (logoTaps === 2) {
        logoTaps = 0;
        triggerSecretModal("🌸 Sticker Voucher!", "Double tapped the logo! You unlocked the rare Flower Sticker 🌸!");
      }
      setTimeout(() => { logoTaps = 0; }, 800);
    });
  }

  // 2. Mascot clicks (tap mascot 5 times)
  const mascot = document.querySelector('.mascot-container');
  let mascotClicks = 0;
  if (mascot) {
    mascot.addEventListener('click', () => {
      mascotClicks++;
      playSFX('pop');
      
      // visual feedback
      mascot.classList.add('animate-shake');
      setTimeout(() => mascot.classList.remove('animate-shake'), 400);

      if (mascotClicks === 5) {
        mascotClicks = 0;
        playSFX('triumph');
        triggerSecretModal("⭐ Secret Star Badge Unlocked!", "You tapped the mascot 5 times! You are officially a curious investigator. Have a cookie! 🍪");
      }
    });
  }

  // 3. Konami sequence listener
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        pos = 0;
        playSFX('triumph');
        triggerSecretModal("🕹️ Developer Cheat Code Active!", "Congratulations! You found the Konami Code Easter Egg! Here is a virtual golden cup: 🏆");
      }
    } else {
      pos = 0;
    }
  });
}

function triggerSecretModal(title, msg) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-content glass-card" style="text-align:center; padding: 2.5rem 1.5rem; max-width:400px; position:relative; z-index:9999;">
      <div style="font-size:3.5rem; margin-bottom:1rem;">🎁</div>
      <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.3rem; margin-bottom:0.5rem;">${title}</h3>
      <p style="font-size:0.95rem; line-height:1.5; color:var(--text-muted); margin-bottom:1.5rem;">${msg}</p>
      <button class="btn-primary close-secret-btn" style="width:100%; justify-content:center;">Awesome! ✨</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.close-secret-btn').addEventListener('click', () => {
    playSFX('click');
    overlay.remove();
  });
}
