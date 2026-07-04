// BestieVerse - Application Bootstrapper & Main Controller

import { initEffects, setEffectType, playSFX, triggerConfetti, triggerFireworks } from './utils.js';
import { initNavigation, navigateTo } from './navigation.js';
import { updateDailyStreak, unlockAchievement } from './storage.js';
import { getCard } from './database.js';
import { initCreatorForm, renderCreatorDashboard, renderCreatorHistory } from './creator.js';
import { initFriendshipQuiz, renderResultPage, renderVerificationPage } from './quiz.js';
import { jokesList } from './jokes.js';
import { complimentsList, fortunesList } from './compliments.js';

import { initFriendshipQuiz as originalInitQuiz, initGuessEmoji, initThisOrThat, initRapidFire } from './quiz.js';
import { initTTT, initRPS, initMemory, initSliding, initSimon, initScramble, initNumGuess, initColorMatch, initWhackAMole, initBubblePop } from './games.js';

let currentLoadedCard = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Init Canvas Particle Layer
  const canvasEl = document.getElementById('effects-canvas');
  initEffects(canvasEl);
  setEffectType('stars');

  // 2. Check and render Streak metrics
  const streakInfo = updateDailyStreak();
  renderStreakDisplay(streakInfo);

  // 3. Initialize SPA Routing & Navigation
  initNavigation(onRouteChanged, onViewChange);

  // 4. Initialise Volume/Theme controls
  setupThemeToggle();
  setupVolumeToggle();

  // 5. Load Smile Board & Fortunes segment
  initDailySmile();
  initFortuneCookie();
  initMemeCorner();
});

// Shell Route Changed Listener
function onRouteChanged(routeType, id) {
  if (routeType === 'landing') {
    // Reset theme style to default pastel
    document.documentElement.removeAttribute('data-theme-style');
    renderCreatorHistory();
  } else if (routeType === 'create') {
    document.documentElement.removeAttribute('data-theme-style');
    initCreatorForm();
  } else if (routeType === 'dashboard') {
    document.documentElement.removeAttribute('data-theme-style');
    renderCreatorDashboard(id);
  } else if (routeType === 'friend') {
    loadFriendExperience(id);
  } else if (routeType === 'result') {
    document.documentElement.removeAttribute('data-theme-style');
    renderResultPage(id);
  } else if (routeType === 'verify') {
    document.documentElement.removeAttribute('data-theme-style');
    renderVerificationPage(id);
  }
}

// Load Friend Card details & configure App Shell
async function loadFriendExperience(cardId) {
  const card = await getCard(cardId);
  if (!card) return;
  currentLoadedCard = card;

  // Apply card style (11 themes)
  document.documentElement.setAttribute('data-theme-style', card.theme || 'pastel');

  // Customize welcome texts
  const welcomeHeading = document.getElementById('welcome-heading');
  const welcomeText = document.getElementById('welcome-text');
  if (welcomeHeading) welcomeHeading.textContent = `Hi, ${card.friendName}! 👋`;
  if (welcomeText) {
    welcomeText.textContent = `I made this BestieVerse card for you (aka ${card.nickname}) to celebrate our friendship. Complete the quizzes, play arcade games, stretch your challenges, and claim your certificate!`;
  }

  // Customize tribute ending
  const endingHeading = document.getElementById('ending-heading');
  const endingMessage = document.getElementById('ending-message');
  if (endingHeading) endingHeading.textContent = `Forever Besties! 💖`;
  if (endingMessage) {
    endingMessage.innerHTML = `${card.message.replace(/\n/g, '<br>')}<br><br><strong>— Signed, ${card.creatorName}</strong>`;
  }

  // Hide certificate navigation elements initially
  document.querySelectorAll('.cert-nav-link').forEach(link => link.style.display = 'none');
  const endClaim = document.getElementById('end-claim-cert-btn');
  if (endClaim) {
    endClaim.style.display = 'none';
    endClaim.textContent = "Claim Friendship Certificate! 📜";
  }

  // Render dynamic games
  renderDynamicGameTabs(card.games || ['ttt', 'rps', 'memory']);
  initGamesNav();

  // Load challenges
  initChallenges(card.challenges || [0, 1, 2, 3, 4]);

  // Load custom quiz
  const quizArea = document.getElementById('quiz-content-area');
  if (quizArea) {
    initFriendshipQuiz(quizArea, card);
  }

  // Render other views segments
  initTimeCapsuleView();
  renderAchievementsAndStickers();

  // Automatically start at welcome view
  navigateTo('welcome-view', onViewChange);
}

// Render dynamic game tabs
function renderDynamicGameTabs(enabledGames) {
  const tabContainer = document.querySelector('#games-view .sub-nav-tabs');
  if (!tabContainer) return;

  const allGames = {
    ttt: "Tic Tac Toe",
    rps: "RPS Hand",
    memory: "Card Match",
    sliding: "Sliding Board",
    simon: "Simon Says",
    scramble: "Word Scramble",
    "number-guess": "Num Guess",
    "color-match": "Color Speed",
    "whack-a-mole": "Whack Mole",
    "bubble-pop": "Bubble Pop"
  };

  tabContainer.innerHTML = enabledGames.map((gKey, idx) => `
    <button class="btn-secondary game-tab ${idx === 0 ? 'active' : ''}" data-type="${gKey}">${allGames[gKey] || gKey}</button>
  `).join('');
}

// Inner view switch triggers background visual updates
function onViewChange(viewId) {
  if (viewId === 'games-view' || viewId === 'welcome-view') {
    setEffectType('snow');
  } else if (viewId === 'ending-view') {
    setEffectType('stars');
    triggerFireworksEnding();
  } else {
    setEffectType('stars');
  }

  switch (viewId) {
    case 'quiz-view':
      initQuizNav();
      break;
    case 'games-view':
      initGamesNav();
      break;
    case 'achievements-view':
      renderAchievementsAndStickers();
      break;
  }
}

// Render streak info in UI
function renderStreakDisplay(info) {
  const display = document.getElementById('streak-count-display');
  if (display) display.textContent = info.streak;
  
  if (info.newVisit) {
    setTimeout(() => {
      playSFX('triumph');
      triggerConfetti();
      
      const popup = document.createElement('div');
      popup.className = 'modal-overlay active';
      popup.innerHTML = `
        <div class="modal-content glass-card" style="text-align:center; padding: 2.5rem 1.5rem; max-width:350px; position:relative; z-index:9999;">
          <div style="font-size:3.5rem; margin-bottom:0.5rem; animation:pulse 1s infinite;">🔥</div>
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.3rem; margin-bottom:0.5rem;">Daily Streak Updated!</h3>
          <p style="font-size:1rem; font-weight:600; margin-bottom:1.5rem;">You have a <strong>${info.streak}-Day Streak</strong>! 🌸</p>
          <button class="btn-primary close-streak-btn" style="width:100%; justify-content:center;">Sweet! Let's Explore</button>
        </div>
      `;
      document.body.appendChild(popup);
      popup.querySelector('.close-streak-btn').addEventListener('click', () => {
        playSFX('click');
        popup.remove();
      });
    }, 1200);
  }
}

// Daily positive message board
function initDailySmile() {
  const quoteEl = document.getElementById('smile-quote-text');
  const typeEl = document.getElementById('smile-quote-type');
  const refreshBtn = document.getElementById('smile-refresh-btn');

  const quotes = [
    "You are impossible to replace. Seriously.",
    "Your laugh is my absolute favorite sound in the universe.",
    "The world is 100 times better just because you're in it.",
    "BFF status: Locked in for life. No refund, no exchange!",
    "I hope your day is as bright as your smile. ✨",
    "Drink water and stop overthinking! 💧"
  ];

  const roll = () => {
    const r = Math.random();
    let text = "";
    let type = "";

    if (r < 0.33) {
      const joke = jokesList[Math.floor(Math.random() * jokesList.length)];
      text = `Q: ${joke.q}<br><br><strong>A: ${joke.a}</strong>`;
      type = "Daily Joke 😜";
    } else if (r < 0.66) {
      text = `"${complimentsList[Math.floor(Math.random() * complimentsList.length)]}"`;
      type = "Daily Compliment 🌟";
    } else {
      text = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
      type = "Positive Message 💖";
    }

    if (quoteEl) quoteEl.innerHTML = text;
    if (typeEl) typeEl.textContent = type;
  };

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      playSFX('click');
      roll();
      triggerConfetti();
    });
  }

  roll();
}

// Crack fortune cookie
function initFortuneCookie() {
  const cookie = document.querySelector('.fortune-cookie-graphic');
  const textEl = document.querySelector('.fortune-cookie-text');
  
  if (cookie) {
    cookie.addEventListener('click', () => {
      if (cookie.classList.contains('broken')) return;
      
      playSFX('pop');
      triggerConfetti();
      cookie.classList.add('broken');
      cookie.textContent = '🥠💨';
      
      const fortune = fortunesList[Math.floor(Math.random() * fortunesList.length)];
      textEl.style.display = 'block';
      textEl.innerHTML = `<em>"${fortune}"</em>`;
    });
  }

  const resetBtn = document.getElementById('reset-fortune-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      playSFX('click');
      if (cookie) {
        cookie.classList.remove('broken');
        cookie.textContent = '🥠';
      }
      if (textEl) {
        textEl.style.display = 'none';
        textEl.innerHTML = '';
      }
    });
  }
}

// React to memes
function initMemeCorner() {
  const container = document.querySelector('.meme-corner-cards');
  if (!container) return;

  const captions = [
    { title: "College/Exams Mood 📚", caption: "Me calculating how many hours of phone time I deserve after reading one single paragraph of my syllabus." },
    { title: "Late Replies 💬", caption: "My best friend reading my text, replying to it in their head, and closing the app for 3 business days." },
    { title: "Always Hungry 🍕", caption: "Planning my dinner menu while actively chewing my current lunch." },
    { title: "Sleep Schedule 😴", caption: "My brain deciding to replay an awkward conversation from 6 years ago when I am trying to sleep at 3 AM." },
    { title: "Shopping Cart 🛒", caption: "Adding $400 worth of clothes to my shopping cart just to close the tab because shipping is $5." },
    { title: "Group Chat Gossip 🤫", caption: "'I am a very peaceful person who hates gossiping' - Me as soon as she starts a message with 'So basically...'" }
  ];

  container.innerHTML = captions.map((c, i) => `
    <div class="glass-card" style="border-top: 5px solid var(--primary); display:flex; flex-direction:column; gap:0.5rem;">
      <h4 style="font-family:var(--font-heading); font-size:1.05rem; color:var(--primary); font-weight:700;">${c.title}</h4>
      <p style="font-size:0.9rem; line-height:1.4; color:var(--text); flex:1;">${c.caption}</p>
      
      <div style="display:flex; justify-content:space-around; border-top:1px solid var(--lavender); padding-top:0.4rem; margin-top:0.5rem;">
        <button class="meme-react-btn" data-idx="${i}">😂 <span class="count">0</span></button>
        <button class="meme-react-btn" data-idx="${i}">❤️ <span class="count">0</span></button>
        <button class="meme-react-btn" data-idx="${i}">🤣 <span class="count">0</span></button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.meme-react-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const countEl = btn.querySelector('.count');
      const current = parseInt(countEl.textContent);
      countEl.textContent = current + 1;
      
      playSFX('click');
      btn.style.transform = 'scale(1.25)';
      setTimeout(() => btn.style.transform = 'none', 150);
      
      triggerConfetti();
      unlockAchievement('meme-lover');
    });
  });
}

// Custom friendship challenges
function initChallenges(selectedIndices = [0, 1, 2, 3, 4]) {
  const container = document.querySelector('.challenges-container');
  if (!container) return;

  const list = [
    { text: "Drink a glass of water right now! 💧" },
    { text: "Send your absolute favorite reaction sticker/emoji to me. 💬" },
    { text: "Smile at the screen for 10 seconds straight. 😊" },
    { text: "Close your eyes and take three deep breaths. 🧘" },
    { text: "Stand up and stretch your arms for 10 seconds. 🤸" }
  ];

  const filtered = list.filter((_, idx) => selectedIndices.includes(idx));

  container.innerHTML = filtered.map((c, idx) => `
    <div style="display:flex; align-items:center; gap:0.8rem; padding:0.4rem 0;">
      <input type="checkbox" id="challenge-${idx}" style="width:18px; height:18px; accent-color:var(--primary); cursor:pointer;">
      <label for="challenge-${idx}" style="font-size:0.95rem; cursor:pointer; color:var(--text);">${c.text}</label>
    </div>
  `).join('');

  container.querySelectorAll('input[type="checkbox"]').forEach(box => {
    box.addEventListener('change', (e) => {
      const label = e.target.nextElementSibling;
      playSFX('click');
      if (e.target.checked) {
        label.style.textDecoration = 'line-through';
        label.style.color = 'var(--text-muted)';
        triggerConfetti();
        unlockAchievement('challenge-accepted');
      } else {
        label.style.textDecoration = 'none';
        label.style.color = 'var(--text)';
      }
    });
  });
}

// Time Capsule logic
let capsuleTimer = null;
import { saveTimeCapsule, getTimeCapsule, resetTimeCapsule } from './storage.js';

function initTimeCapsuleView() {
  const container = document.getElementById('capsule-view-content');
  if (!container) return;

  clearInterval(capsuleTimer);
  const capsule = getTimeCapsule();

  if (capsule) {
    const updateCountdown = () => {
      const diff = capsule.unlockTime - Date.now();
      if (diff <= 0) {
        clearInterval(capsuleTimer);
        container.innerHTML = `
          <div class="glass-card" style="text-align:center;">
            <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.3rem; margin-bottom:1rem;">🔓 TIME CAPSULE OPENED!</h3>
            <div style="background:white; padding:1.5rem; border-radius:15px; border:1px solid var(--lavender); font-family:var(--font-fancy); font-size:1.3rem; text-align:left; color:#3D3A45; margin-bottom:1rem;">
              "${capsule.text}"
            </div>
            <button class="btn-primary reset-capsule-btn">Create a New One 🔒</button>
          </div>
        `;
        container.querySelector('.reset-capsule-btn').addEventListener('click', () => {
          resetTimeCapsule();
          initTimeCapsuleView();
        });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        container.innerHTML = `
          <div class="glass-card" style="text-align:center;">
            <h3 style="font-family:var(--font-heading); font-size:1.3rem; margin-bottom:1rem; color:var(--primary);">🔒 TIME CAPSULE SEALED</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Unlocking in space-time:</p>
            <div style="display:flex; gap:0.5rem; justify-content:center; margin-bottom:1rem; font-weight:700;">
              <span style="background:var(--lavender); padding:0.5rem; border-radius:8px; color: var(--primary);">${days}d</span>
              <span style="background:var(--lavender); padding:0.5rem; border-radius:8px; color: var(--primary);">${hours}h</span>
              <span style="background:var(--lavender); padding:0.5rem; border-radius:8px; color: var(--primary);">${mins}m</span>
              <span style="background:var(--lavender); padding:0.5rem; border-radius:8px; color: var(--primary);">${secs}s</span>
            </div>
          </div>
        `;
      }
    };
    updateCountdown();
    capsuleTimer = setInterval(updateCountdown, 1000);
  } else {
    container.innerHTML = `
      <div class="glass-card">
        <h3 style="font-family:var(--font-heading); font-size:1.3rem; margin-bottom:0.5rem; text-align:center; color:var(--primary);">⏳ Lock a Message</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin-bottom:1.2rem;">Write down predictions or letters. Once sealed, you cannot open them until the timer expires!</p>
        <div style="display:flex; flex-direction:column; gap:0.8rem;">
          <textarea class="form-input capsule-text" placeholder="Write a note to your future self..." style="height:100px; resize:none;"></textarea>
          <select class="form-input capsule-duration">
            <option value="60">1 Minute (Test)</option>
            <option value="86400">1 Day</option>
            <option value="2592000">30 Days</option>
          </select>
          <button class="btn-primary seal-capsule-btn">Seal Time Capsule 🔒</button>
        </div>
      </div>
    `;
    container.querySelector('.seal-capsule-btn').addEventListener('click', () => {
      const txt = container.querySelector('.capsule-text').value.trim();
      const dur = parseInt(container.querySelector('.capsule-duration').value);
      if (!txt) return;

      saveTimeCapsule(txt, dur);
      playSFX('success');
      initTimeCapsuleView();
    });
  }
}

// Achievements & stickers album list
import { getUnlockedAchievements, getBadgesList, getCollectedStickers } from './storage.js';

function renderAchievementsAndStickers() {
  const badgesBox = document.querySelector('.badges-list-grid');
  const stickersBox = document.querySelector('.stickers-list-grid');
  
  if (badgesBox) {
    const list = getBadgesList();
    const unlocked = getUnlockedAchievements();
    
    badgesBox.innerHTML = Object.keys(list).map(key => {
      const b = list[key];
      const isUnlocked = unlocked.includes(key);
      return `
        <div class="glass-card" style="padding:1rem; border-left:4px solid ${isUnlocked ? 'var(--primary)' : 'var(--text-muted)'}; opacity:${isUnlocked ? 1 : 0.5}; display:flex; align-items:center; gap:0.8rem;">
          <span style="font-size:2rem;">${isUnlocked ? '🏆' : '🔒'}</span>
          <div>
            <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:700; color: var(--text);">${b.name}</h4>
            <p style="font-size:0.75rem; color:var(--text-muted);">${b.desc}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  if (stickersBox) {
    const collected = getCollectedStickers();
    const available = ['🌸', '⭐', '🍕', '🎮', '🎈', '🎵', '📚'];
    
    stickersBox.innerHTML = available.map(st => {
      const has = collected.includes(st);
      return `
        <div class="glass-card animate-bounce" style="width:70px; height:70px; display:flex; align-items:center; justify-content:center; font-size:2.2rem; padding:0; border-radius:50%; opacity:${has ? 1 : 0.25}; background:${has ? 'var(--yellow)' : 'var(--sky-blue)'}; border:2px solid ${has ? 'var(--accent)' : 'var(--card-border)'};">
          ${st}
        </div>
      `;
    }).join('');
  }
}

// Light/dark theme toggle
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  const mobileBtn = document.getElementById('mobile-theme-toggle-btn');
  const saved = localStorage.getItem('BV_THEME') || 'light';

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('BV_THEME', theme);
    const label = theme === 'dark' ? '☀️' : '🌙';
    if (btn) btn.textContent = label;
    if (mobileBtn) mobileBtn.textContent = label;
  };

  apply(saved);

  const toggle = () => {
    playSFX('click');
    const current = document.documentElement.getAttribute('data-theme');
    apply(current === 'dark' ? 'light' : 'dark');
  };

  if (btn) btn.addEventListener('click', toggle);
  if (mobileBtn) mobileBtn.addEventListener('click', toggle);
}

// Mute/unmute sound settings
function setupVolumeToggle() {
  const btn = document.getElementById('sound-toggle-btn');
  const mobileBtn = document.getElementById('mobile-sound-toggle-btn');
  let enabled = true;

  const toggle = () => {
    enabled = !enabled;
    import('./utils.js').then(m => m.toggleSound(enabled));
    
    const label = enabled ? '🔊' : '🔇';
    if (btn) btn.textContent = label;
    if (mobileBtn) mobileBtn.textContent = label;
  };

  if (btn) btn.onclick = toggle;
  if (mobileBtn) mobileBtn.onclick = toggle;
}

// Tab navigation listeners (Quiz)
function initQuizNav() {
  const container = document.getElementById('quiz-content-area');
  const tabs = document.querySelectorAll('.quiz-tab');

  tabs.forEach(tab => {
    if (tab.classList.contains('active')) {
      triggerQuizTab(tab.getAttribute('data-type'), container);
    }
    
    if (!tab.dataset.bound) {
      tab.dataset.bound = 'true';
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        triggerQuizTab(e.currentTarget.getAttribute('data-type'), container);
      });
    }
  });
}

function triggerQuizTab(type, container) {
  playSFX('click');
  if (type === 'friendship') {
    // If card details are loaded, pass them to quiz init
    initFriendshipQuiz(container, currentLoadedCard);
  } else if (type === 'guess-emoji') {
    initGuessEmoji(container);
  } else if (type === 'this-that') {
    initThisOrThat(container);
  } else if (type === 'rapid-fire') {
    initRapidFire(container);
  }
}

// Tab navigation listeners (Games)
function initGamesNav() {
  const container = document.getElementById('games-content-area');
  const tabs = document.querySelectorAll('.game-tab');

  tabs.forEach(tab => {
    if (tab.classList.contains('active')) {
      triggerGameTab(tab.getAttribute('data-type'), container);
    }

    if (!tab.dataset.bound) {
      tab.dataset.bound = 'true';
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        triggerGameTab(e.currentTarget.getAttribute('data-type'), container);
      });
    }
  });
}

function triggerGameTab(type, container) {
  playSFX('click');
  if (type === 'ttt') initTTT(container);
  else if (type === 'rps') initRPS(container);
  else if (type === 'memory') initMemory(container);
  else if (type === 'sliding') initSliding(container);
  else if (type === 'simon') initSimon(container);
  else if (type === 'scramble') initScramble(container);
  else if (type === 'number-guess') initNumGuess(container);
  else if (type === 'color-match') initColorMatch(container);
  else if (type === 'whack-a-mole') initWhackAMole(container);
  else if (type === 'bubble-pop') initBubblePop(container);
}

// Tribute screen visual effects
function triggerFireworksEnding() {
  triggerConfetti();
  triggerFireworks();
  
  const dim = document.createElement('div');
  dim.style.position = 'fixed';
  dim.style.top = '0';
  dim.style.left = '0';
  dim.style.width = '100vw';
  dim.style.height = '100vh';
  dim.style.background = 'rgba(0, 0, 0, 0.4)';
  dim.style.pointerEvents = 'none';
  dim.style.zIndex = '5';
  dim.style.animation = 'fadeIn 2s forwards';
  document.body.appendChild(dim);
  
  const linkWatcher = () => {
    dim.remove();
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.removeEventListener('click', linkWatcher);
    });
  };
  
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.addEventListener('click', linkWatcher);
  });
}
