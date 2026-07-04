// BestieVerse - Arcade Center (10 Interactive Mini-Games)

import { playSFX, triggerConfetti } from './utils.js';
import { unlockAchievement } from './storage.js';

// --- TIC TAC TOE ---
let tttBoard = Array(9).fill('');
let tttActive = true;

export function initTTT(container) {
  tttBoard = Array(9).fill('');
  tttActive = true;

  container.innerHTML = `
    <div class="ttt-container" style="display:flex; flex-direction:column; align-items:center; gap:1rem;">
      <h4 class="ttt-status" style="font-family:var(--font-heading); font-size:1.15rem; color:var(--primary); font-weight:700;">Your Turn! (Tap cell)</h4>
      <div class="ttt-board" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; width:280px; height:280px;">
        ${Array(9).fill(0).map((_, i) => `<div class="ttt-cell" data-idx="${i}" style="background:var(--sky-blue); border-radius:15px; border:2px solid var(--card-border); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:2rem; transition:var(--transition);"></div>`).join('')}
      </div>
      <button class="btn-secondary reset-ttt">Reset Board 🔁</button>
    </div>
  `;

  const cells = container.querySelectorAll('.ttt-cell');
  const status = container.querySelector('.ttt-status');

  cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
      if (tttBoard[idx] !== '' || !tttActive) return;

      // Player move
      makeTTTMove(idx, 'X', e.currentTarget);

      if (checkTTTWin('X')) {
        endTTT('win', status);
        return;
      }
      if (tttBoard.every(c => c !== '')) {
        endTTT('draw', status);
        return;
      }

      // Computer Move
      tttActive = false;
      status.textContent = "Computer is thinking... 🤖";
      
      setTimeout(() => {
        const compMove = getBestMove();
        if (compMove !== null) {
          const compCell = container.querySelector(`.ttt-cell[data-idx="${compMove}"]`);
          makeTTTMove(compMove, 'O', compCell);
          
          if (checkTTTWin('O')) {
            endTTT('lose', status);
            return;
          }
          if (tttBoard.every(c => c !== '')) {
            endTTT('draw', status);
            return;
          }
        }
        tttActive = true;
        status.textContent = "Your Turn!";
      }, 600);
    });
  });

  container.querySelector('.reset-ttt').addEventListener('click', () => {
    initTTT(container);
  });
}

function makeTTTMove(idx, player, cellEl) {
  tttBoard[idx] = player;
  playSFX('click');
  
  if (player === 'X') {
    cellEl.textContent = '❤️';
    cellEl.style.color = 'var(--accent)';
  } else {
    cellEl.textContent = '⭐';
    cellEl.style.color = 'var(--primary)';
  }
}

function checkTTTWin(player) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return wins.some(comb => comb.every(idx => tttBoard[idx] === player));
}

function getBestMove() {
  // Simple AI: 1. Win, 2. Block, 3. Take center, 4. Random
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  const findTrigger = (player) => {
    for (let c of wins) {
      const marks = c.map(idx => tttBoard[idx]);
      if (marks.filter(m => m === player).length === 2 && marks.filter(m => m === '').length === 1) {
        return c[marks.indexOf('')];
      }
    }
    return null;
  };

  let move = findTrigger('O');
  if (move !== null) return move;

  move = findTrigger('X');
  if (move !== null) return move;

  if (tttBoard[4] === '') return 4;

  const available = tttBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

function endTTT(result, statusEl) {
  tttActive = false;
  if (result === 'win') {
    statusEl.textContent = "Yay! You Won! 🏆🎉";
    triggerConfetti();
    playSFX('triumph');
    unlockAchievement('game-champion');
  } else if (result === 'lose') {
    statusEl.textContent = "Oops! Computer won! 🤖";
    playSFX('fail');
  } else {
    statusEl.textContent = "It's a draw! Fun match! 🤝";
  }
}


// --- ROCK PAPER SCISSORS ---
export function initRPS(container) {
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1.5rem;">
      <h4 class="rps-status" style="font-family:var(--font-heading); font-size:1.15rem; color:var(--primary); font-weight:700;">Choose your move!</h4>
      <div style="display:flex; gap:1rem;">
        <button class="btn-primary rps-choice" data-move="rock" style="font-size:2.5rem; width:80px; height:80px; padding:0; border-radius:50%;">✊</button>
        <button class="btn-primary rps-choice" data-move="paper" style="font-size:2.5rem; width:80px; height:80px; padding:0; border-radius:50%;">✋</button>
        <button class="btn-primary rps-choice" data-move="scissors" style="font-size:2.5rem; width:80px; height:80px; padding:0; border-radius:50%;">✌️</button>
      </div>
      <div class="rps-arena" style="display:none; gap:2rem; font-size:4rem; align-items:center; background:rgba(255,255,255,0.4); padding:1rem 2rem; border-radius:var(--radius); border:1px solid var(--card-border);">
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.2rem;">
          <span class="p-move">✊</span><span style="font-size:0.75rem; font-weight:600;">YOU</span>
        </div>
        <div style="font-size:1.5rem; font-weight:800; color:var(--primary);">VS</div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.2rem;">
          <span class="b-move">✊</span><span style="font-size:0.75rem; font-weight:600;">BOT</span>
        </div>
      </div>
      <div class="rps-result" style="font-size:1.25rem; font-weight:700; min-height:30px;"></div>
    </div>
  `;

  const choices = container.querySelectorAll('.rps-choice');
  const arena = container.querySelector('.rps-arena');
  const pMoveEl = container.querySelector('.p-move');
  const bMoveEl = container.querySelector('.b-move');
  const resultEl = container.querySelector('.rps-result');
  const statusEl = container.querySelector('.rps-status');

  const symbols = { rock: '✊', paper: '✋', scissors: '✌️' };

  choices.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pMove = e.currentTarget.getAttribute('data-move');
      playSFX('click');
      
      container.querySelector('div[style*="display:flex; gap:1rem;"]').style.display = 'none';
      arena.style.display = 'flex';
      
      pMoveEl.textContent = '✊';
      bMoveEl.textContent = '✊';
      
      // Shake
      pMoveEl.style.animation = 'shake 0.3s infinite';
      bMoveEl.style.animation = 'shake 0.3s infinite';
      
      setTimeout(() => {
        pMoveEl.style.animation = 'none';
        bMoveEl.style.animation = 'none';
        
        const moves = ['rock', 'paper', 'scissors'];
        const bMove = moves[Math.floor(Math.random() * moves.length)];
        
        pMoveEl.textContent = symbols[pMove];
        bMoveEl.textContent = symbols[bMove];
        
        let res = '';
        if (pMove === bMove) {
          res = 'draw';
        } else if (
          (pMove === 'rock' && bMove === 'scissors') ||
          (pMove === 'paper' && bMove === 'rock') ||
          (pMove === 'scissors' && bMove === 'paper')
        ) {
          res = 'win';
        } else {
          res = 'lose';
        }

        if (res === 'win') {
          resultEl.textContent = "You Won! Champ! 🏆🎉";
          resultEl.style.color = '#4A8B80';
          triggerConfetti();
          playSFX('success');
          unlockAchievement('game-champion');
        } else if (res === 'lose') {
          resultEl.textContent = "Bot wins! Try again! 🤖";
          resultEl.style.color = '#D66D57';
          playSFX('fail');
        } else {
          resultEl.textContent = "It's a draw! 🤝";
          resultEl.style.color = 'var(--text)';
        }

        statusEl.innerHTML = `<button class="btn-primary reset-rps" style="padding:0.5rem 1.2rem; font-size:0.8rem;">Play Again 🔁</button>`;
        container.querySelector('.reset-rps').addEventListener('click', () => {
          initRPS(container);
        });

      }, 1000);
    });
  });
}


// --- MEMORY MATCH ---
let memMatched = 0;
let memFirst = null;
let memSecond = null;
let memLock = false;

export function initMemory(container) {
  const icons = ['🐼', '🍕', '🍩', '🥑', '🎨', '🔮', '💖', '🦄'];
  const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
  
  memMatched = 0;
  memFirst = null;
  memSecond = null;
  memLock = false;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
      <h4 class="mem-status" style="font-family:var(--font-heading); font-size:1.15rem; color:var(--primary); font-weight:700;">Match the pairs!</h4>
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; width:100%; max-width:320px;">
        ${deck.map((icon, idx) => `
          <div class="mem-card-cell" data-idx="${idx}" data-icon="${icon}" style="aspect-ratio:1; cursor:pointer; perspective:1000px;">
            <div class="inner" style="position:relative; width:100%; height:100%; transition:transform 0.5s; transform-style:preserve-3d;">
              <div class="front" style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:var(--primary); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:white;">❓</div>
              <div class="back" style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:var(--sky-blue); border:1px solid var(--card-border); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.8rem; transform:rotateY(180deg);">
                ${icon}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn-secondary reset-mem">Reset Game 🔁</button>
    </div>
  `;

  const cards = container.querySelectorAll('.mem-card-cell');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const inner = card.querySelector('.inner');
      if (memLock || card.classList.contains('flipped') || card === memFirst) return;

      playSFX('pop');
      card.classList.add('flipped');
      inner.style.transform = 'rotateY(180deg)';

      if (!memFirst) {
        memFirst = card;
        return;
      }

      memSecond = card;
      memLock = true;

      const isMatch = memFirst.getAttribute('data-icon') === memSecond.getAttribute('data-icon');
      if (isMatch) {
        memMatched++;
        playSFX('success');
        memFirst = null;
        memSecond = null;
        memLock = false;

        if (memMatched === icons.length) {
          setTimeout(() => {
            container.querySelector('.mem-status').textContent = "Victory! Complete match! 🎉🏆";
            triggerConfetti();
            playSFX('triumph');
            unlockAchievement('game-champion');
          }, 500);
        }
      } else {
        setTimeout(() => {
          memFirst.classList.remove('flipped');
          memSecond.classList.remove('flipped');
          memFirst.querySelector('.inner').style.transform = 'none';
          memSecond.querySelector('.inner').style.transform = 'none';
          playSFX('fail');
          memFirst = null;
          memSecond = null;
          memLock = false;
        }, 1000);
      }
    });
  });

  container.querySelector('.reset-mem').addEventListener('click', () => {
    initMemory(container);
  });
}


// --- SLIDING PUZZLE ---
let pzState = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function initSliding(container) {
  pzState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  shuffleSliding();
  renderSliding(container);
}

function shuffleSliding() {
  let empty = 8;
  const moves = {
    0: [1, 3], 1: [0, 2, 4], 2: [1, 5],
    3: [0, 4, 6], 4: [1, 3, 5, 7], 5: [2, 4, 8],
    6: [3, 7], 7: [4, 6, 8], 8: [5, 7]
  };
  for (let i = 0; i < 30; i++) {
    const valid = moves[empty];
    const pick = valid[Math.floor(Math.random() * valid.length)];
    pzState[empty] = pzState[pick];
    pzState[pick] = 8;
    empty = pick;
  }
}

function renderSliding(container) {
  const isSolved = pzState.every((v, i) => v === i);
  
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
      <h4 class="pz-status" style="font-family:var(--font-heading); font-size:1.15rem; color:var(--primary); font-weight:700;">
        ${isSolved ? "Solved! You are a master! 🏆✨" : "Order the numbers 1 to 8!"}
      </h4>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; width:270px; height:270px; background:var(--lavender); border:4px solid var(--primary); border-radius:16px; overflow:hidden;">
        ${pzState.map((val, idx) => {
          if (val === 8) return `<div class="pz-tile empty" data-idx="${idx}"></div>`;
          return `
            <div class="pz-tile" data-idx="${idx}" style="background:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:var(--font-heading); font-size:1.6rem; font-weight:700; color:var(--primary); box-shadow:inset 0 0 10px rgba(155,130,193,0.15);">
              ${val + 1}
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn-secondary reset-pz">Shuffle 🔁</button>
        <button class="btn-primary cheat-pz" style="padding:0.4rem 1rem; font-size:0.8rem;">Cheat Solve 😉</button>
      </div>
    </div>
  `;

  if (isSolved) {
    triggerConfetti();
    playSFX('triumph');
    unlockAchievement('puzzle-solver');
    return;
  }

  container.querySelectorAll('.pz-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const idx = parseInt(tile.getAttribute('data-idx'));
      if (pzState[idx] === 8) return;

      const emptyIdx = pzState.indexOf(8);
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      const er = Math.floor(emptyIdx / 3);
      const ec = emptyIdx % 3;

      if ((Math.abs(r - er) + Math.abs(c - ec)) === 1) {
        pzState[emptyIdx] = pzState[idx];
        pzState[idx] = 8;
        playSFX('click');
        renderSliding(container);
      }
    });
  });

  container.querySelector('.reset-pz').addEventListener('click', () => {
    initSliding(container);
  });
  
  container.querySelector('.cheat-pz').addEventListener('click', () => {
    pzState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    renderSliding(container);
  });
}


// --- SIMON SAYS ---
let simonSeq = [];
let simonUserSeq = [];
let simonScore = 0;
let simonLock = false;

export function initSimon(container) {
  simonSeq = [];
  simonUserSeq = [];
  simonScore = 0;
  simonLock = false;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
      <h4 class="simon-status" style="font-family:var(--font-heading); font-size:1.15rem; color:var(--primary); font-weight:700;">Score: 0 | Press Start!</h4>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; width:260px; height:260px;">
        <div class="simon-pad red" data-color="red" style="background:#FFA693; border-radius:100px 20px 20px 20px; cursor:pointer; opacity:0.6; transition:opacity 0.2s;"></div>
        <div class="simon-pad blue" data-color="blue" style="background:#CBE4F9; border-radius:20px 100px 20px 20px; cursor:pointer; opacity:0.6; transition:opacity 0.2s;"></div>
        <div class="simon-pad green" data-color="green" style="background:#CDF0EA; border-radius:20px 20px 20px 100px; cursor:pointer; opacity:0.6; transition:opacity 0.2s;"></div>
        <div class="simon-pad yellow" data-color="yellow" style="background:#FFF5C0; border-radius:20px 20px 100px 20px; cursor:pointer; opacity:0.6; transition:opacity 0.2s;"></div>
      </div>
      <button class="btn-primary start-simon">Start Game 🕹️</button>
    </div>
  `;

  const startBtn = container.querySelector('.start-simon');
  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    nextSimonRound(container);
  });

  container.querySelectorAll('.simon-pad').forEach(pad => {
    pad.addEventListener('click', (e) => {
      if (simonLock) return;
      const col = e.currentTarget.getAttribute('data-color');
      flashPad(pad, col);
      simonUserSeq.push(col);

      // Check correctness
      const idx = simonUserSeq.length - 1;
      if (simonUserSeq[idx] !== simonSeq[idx]) {
        // Game Over
        playSFX('fail');
        container.querySelector('.simon-status').textContent = `Game Over! Final Score: ${simonScore} 😭`;
        startBtn.style.display = 'inline-flex';
        startBtn.textContent = 'Retry 🔁';
        simonLock = true;
        return;
      }

      if (simonUserSeq.length === simonSeq.length) {
        simonScore++;
        simonLock = true;
        container.querySelector('.simon-status').textContent = `Score: ${simonScore} | Success!`;
        playSFX('success');
        if (simonScore >= 5) unlockAchievement('game-champion');
        setTimeout(() => {
          nextSimonRound(container);
        }, 1000);
      }
    });
  });
}

function nextSimonRound(container) {
  simonUserSeq = [];
  simonLock = true;
  container.querySelector('.simon-status').textContent = `Score: ${simonScore} | Watch closely...`;

  const colors = ['red', 'blue', 'green', 'yellow'];
  simonSeq.push(colors[Math.floor(Math.random() * colors.length)]);

  // Play sequence
  let idx = 0;
  const playInterval = setInterval(() => {
    const col = simonSeq[idx];
    const pad = container.querySelector(`.simon-pad.${col}`);
    flashPad(pad, col);
    
    idx++;
    if (idx >= simonSeq.length) {
      clearInterval(playInterval);
      setTimeout(() => {
        simonLock = false;
        container.querySelector('.simon-status').textContent = `Score: ${simonScore} | Your turn!`;
      }, 500);
    }
  }, 600);
}

function flashPad(padEl, col) {
  playSFX('click');
  padEl.style.opacity = '1';
  padEl.style.transform = 'scale(1.05)';
  setTimeout(() => {
    padEl.style.opacity = '0.6';
    padEl.style.transform = 'none';
  }, 300);
}


// --- WORD SCRAMBLE ---
const scrambleWords = [
  { word: "friendship", hint: "What this entire website celebrates!" },
  { word: "caffeine", hint: "Sustenance for late-night chats ☕" },
  { word: "memories", hint: "Sweet Polaroids and flip cards are full of them 📸" },
  { word: "adventure", hint: "Road trips and cafes trips together" },
  { word: "overthinking", hint: "Our favorite mental sport of 3 business days 🧠" }
];
let scrambleIdx = 0;
let scrambleTries = 0;

export function initScramble(container) {
  scrambleIdx = 0;
  scrambleTries = 0;
  renderScramble(container);
}

function renderScramble(container) {
  if (scrambleIdx >= scrambleWords.length) {
    triggerConfetti();
    playSFX('triumph');
    unlockAchievement('game-champion');
    container.innerHTML = `
      <div class="glass-card" style="text-align:center; padding: 2rem 1rem;">
        <div style="font-size:3.5rem; margin-bottom:0.5rem;">✍️👑</div>
        <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.5rem; margin-bottom:1.5rem;">Word Scramble Cleared!</h3>
        <button class="btn-primary retry-scramble">Play Again 🔁</button>
      </div>
    `;
    container.querySelector('.retry-scramble').addEventListener('click', () => {
      initScramble(container);
    });
    return;
  }

  const item = scrambleWords[scrambleIdx];
  // Scramble word
  const scrambled = item.word.split('').sort(() => Math.random() - 0.5).join('');

  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Word ${scrambleIdx + 1} of ${scrambleWords.length}</p>
      <h3 style="font-size:2.2rem; letter-spacing:4px; color:var(--accent); font-family:var(--font-heading); margin-bottom:0.5rem;">${scrambled.toUpperCase()}</h3>
      <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.2rem;">Hint: ${item.hint}</p>

      <div style="display:flex; flex-direction:column; gap:0.8rem; max-width:280px; margin:0 auto;">
        <input type="text" class="form-input scramble-input" placeholder="Unscramble the word..." style="text-align:center;">
        <button class="btn-primary submit-scramble">Check Guess ✍️</button>
      </div>
      <div class="scramble-feedback" style="min-height:24px; font-weight:700; margin-top:0.8rem;"></div>
    </div>
  `;

  const input = container.querySelector('.scramble-input');
  const feedback = container.querySelector('.scramble-feedback');
  input.focus();

  const check = () => {
    const val = input.value.trim().toLowerCase();
    if (!val) return;

    if (val === item.word) {
      playSFX('success');
      feedback.textContent = "Spot on! Correct! 🎉";
      feedback.style.color = '#4A8B80';
      triggerConfetti();
      setTimeout(() => {
        scrambleIdx++;
        renderScramble(container);
      }, 1500);
    } else {
      playSFX('fail');
      feedback.textContent = "Nope! Try shaking up the letters! 🧐";
      feedback.style.color = '#D66D57';
      container.querySelector('.glass-card').classList.add('animate-shake');
      setTimeout(() => container.querySelector('.glass-card').classList.remove('animate-shake'), 400);
    }
  };

  container.querySelector('.submit-scramble').addEventListener('click', check);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') check();
  });
}


// --- NUMBER GUESSING ---
let targetNum = 0;
let guessCount = 0;

export function initNumGuess(container) {
  targetNum = Math.floor(Math.random() * 100) + 1;
  guessCount = 0;

  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <h3 style="font-family:var(--font-heading); font-size:1.4rem; margin-bottom:0.5rem; color:var(--primary);">Number Guesser 🔢</h3>
      <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem;">Guess a secret number between 1 and 100.</p>
      
      <div style="display:flex; flex-direction:column; gap:0.8rem; max-width:280px; margin:0 auto;">
        <input type="number" class="form-input guess-num-input" placeholder="Enter number..." min="1" max="100" style="text-align:center;">
        <button class="btn-primary submit-num-guess">Submit Guess</button>
      </div>
      
      <div class="guess-num-feedback" style="min-height:30px; font-weight:700; margin-top:1rem; font-size:1.05rem;"></div>
      <button class="btn-secondary reset-num-guess" style="margin-top:1rem; display:none;">Play Again 🔁</button>
    </div>
  `;

  const input = container.querySelector('.guess-num-input');
  const feedback = container.querySelector('.guess-num-feedback');
  const submitBtn = container.querySelector('.submit-num-guess');
  const resetBtn = container.querySelector('.reset-num-guess');

  const check = () => {
    const val = parseInt(input.value);
    if (isNaN(val) || val < 1 || val > 100) return;
    
    guessCount++;
    playSFX('click');

    if (val === targetNum) {
      playSFX('triumph');
      triggerConfetti();
      feedback.style.color = '#4A8B80';
      feedback.textContent = `Correct! It was ${targetNum}! Solved in ${guessCount} tries! 🎉🏆`;
      submitBtn.disabled = true;
      input.disabled = true;
      resetBtn.style.display = 'inline-flex';
      unlockAchievement('game-champion');
    } else {
      const diff = Math.abs(val - targetNum);
      let hint = val > targetNum ? "Lower!" : "Higher!";
      let coldHot = "Cold ❄️";
      if (diff <= 5) coldHot = "Burning Hot! 🔥";
      else if (diff <= 15) coldHot = "Warm! ☀️";

      feedback.style.color = '#D66D57';
      feedback.textContent = `${hint} (It's ${coldHot})`;
      
      container.querySelector('.glass-card').classList.add('animate-shake');
      setTimeout(() => container.querySelector('.glass-card').classList.remove('animate-shake'), 400);
    }
  };

  submitBtn.addEventListener('click', check);
  resetBtn.addEventListener('click', () => initNumGuess(container));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') check();
  });
}


// --- COLOR MATCH ---
let colText = '';
let colValue = '';
let colScore = 0;
let colTimer = null;
let colTimeLeft = 3;

export function initColorMatch(container) {
  colScore = 0;
  colTimeLeft = 3;
  nextColorMatchRound(container);
}

function nextColorMatchRound(container) {
  clearInterval(colTimer);
  colTimeLeft = 3;

  const colorNames = ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE"];
  const colorStyles = ["#FF9B85", "#CBE4F9", "#CDF0EA", "#FFF5C0", "#C5B0E8"];
  const namesSimple = ["red", "blue", "green", "yellow", "purple"];

  const textIdx = Math.floor(Math.random() * colorNames.length);
  const styleIdx = Math.floor(Math.random() * colorStyles.length);

  colText = namesSimple[textIdx];
  colValue = namesSimple[styleIdx];

  const matches = (textIdx === styleIdx);

  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Score: ${colScore}</p>
      
      <div style="height:6px; background:var(--sky-blue); border-radius:10px; margin-bottom:1.5rem; overflow:hidden; max-width:200px; margin:0 auto 1.5rem auto;">
        <div class="color-timer-bar" style="width:100%; height:100%; background:var(--primary); transition:width 0.1s linear;"></div>
      </div>
      
      <h3 style="font-size:3rem; font-weight:800; color:${colorStyles[styleIdx]}; margin-bottom:1.5rem; font-family:var(--font-heading); text-shadow:0 2px 10px rgba(0,0,0,0.05);">${colorNames[textIdx]}</h3>
      <p style="font-size:0.95rem; font-weight:600; margin-bottom:1.5rem;">Does the word match the color style?</p>
      
      <div style="display:flex; gap:1rem; justify-content:center;">
        <button class="btn-accent match-answer-btn" data-val="false" style="flex:1; max-width:120px;">NO ❌</button>
        <button class="btn-primary match-answer-btn" data-val="true" style="flex:1; max-width:120px; background:#4A8B80;">YES ✅</button>
      </div>
    </div>
  `;

  const bar = container.querySelector('.color-timer-bar');

  colTimer = setInterval(() => {
    colTimeLeft -= 0.1;
    const w = (colTimeLeft / 3) * 100;
    if (bar) bar.style.width = `${w}%`;

    if (colTimeLeft <= 0) {
      clearInterval(colTimer);
      playSFX('fail');
      endColorMatch(container);
    }
  }, 100);

  container.querySelectorAll('.match-answer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      clearInterval(colTimer);
      const userVal = e.currentTarget.getAttribute('data-val') === 'true';
      if (userVal === matches) {
        colScore++;
        playSFX('success');
        if (colScore >= 8) unlockAchievement('game-champion');
        nextColorMatchRound(container);
      } else {
        playSFX('fail');
        endColorMatch(container);
      }
    });
  });
}

function endColorMatch(container) {
  container.innerHTML = `
    <div class="glass-card" style="text-align:center; padding: 2rem 1.5rem;">
      <div style="font-size:3.5rem; margin-bottom:0.5rem;">💥🎨</div>
      <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.5rem; margin-bottom:0.5rem;">Oops, Wrong Match!</h3>
      <p style="font-size:1.1rem; margin-bottom:1.5rem;">Final Score: <strong>${colScore}</strong></p>
      <button class="btn-primary retry-match">Play Again 🔁</button>
    </div>
  `;
  container.querySelector('.retry-match').addEventListener('click', () => {
    initColorMatch(container);
  });
}


// --- WHACK A MOLE ---
let wmScore = 0;
let wmTimer = null;
let wmSpawnTimer = null;
let wmTimeLeft = 20;

export function initWhackAMole(container) {
  wmScore = 0;
  wmTimeLeft = 20;
  
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:280px; font-weight:700;">
        <span>Time: <span class="wm-time">20</span>s</span>
        <span style="color:var(--primary);">Score: <span class="wm-score">0</span></span>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; width:270px; height:270px;">
        ${Array(9).fill(0).map((_, i) => `
          <div class="wm-hole" data-idx="${i}" style="background:#5C5E76; border-radius:50%; border:3px solid var(--card-border); cursor:pointer; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 10px 10px rgba(0,0,0,0.3);">
            <div class="wm-mole" style="font-size:2.2rem; position:absolute; bottom:-50px; transition:bottom 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67); user-select:none;">🐹</div>
          </div>
        `).join('')}
      </div>
      <button class="btn-primary start-wm">Start whacking! 🔨</button>
    </div>
  `;

  const startBtn = container.querySelector('.start-wm');
  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    startWMGame(container);
  });
}

function startWMGame(container) {
  const timeEl = container.querySelector('.wm-time');
  const scoreEl = container.querySelector('.wm-score');
  const moles = container.querySelectorAll('.wm-mole');

  // Add click to moles
  moles.forEach(mole => {
    mole.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (mole.classList.contains('active')) {
        wmScore++;
        scoreEl.textContent = wmScore;
        playSFX('pop');
        mole.classList.remove('active');
        mole.style.bottom = '-50px';
      }
    });
  });

  // Timers setup
  clearInterval(wmTimer);
  wmTimer = setInterval(() => {
    wmTimeLeft--;
    timeEl.textContent = wmTimeLeft;
    if (wmTimeLeft <= 0) {
      clearInterval(wmTimer);
      clearInterval(wmSpawnTimer);
      moles.forEach(m => { m.style.bottom = '-50px'; m.classList.remove('active'); });
      
      playSFX('triumph');
      triggerConfetti();
      if (wmScore >= 12) unlockAchievement('game-champion');

      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:2rem 1.5rem;">
          <div style="font-size:3.5rem; margin-bottom:0.5rem;">🎉🔨</div>
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.5rem; margin-bottom:0.5rem;">Whack-a-Mole Finished!</h3>
          <p style="font-size:1.1rem; margin-bottom:1.5rem;">Final Whacks: <strong>${wmScore}</strong></p>
          <button class="btn-primary retry-wm">Play Again 🔁</button>
        </div>
      `;
      container.querySelector('.retry-wm').addEventListener('click', () => initWhackAMole(container));
    }
  }, 1000);

  // Spawn loop
  clearInterval(wmSpawnTimer);
  wmSpawnTimer = setInterval(() => {
    // Hide active
    moles.forEach(m => { m.style.bottom = '-50px'; m.classList.remove('active'); });

    const spawnIdx = Math.floor(Math.random() * 9);
    const mole = moles[spawnIdx];
    mole.classList.add('active');
    mole.style.bottom = '10px';

    setTimeout(() => {
      if (mole.classList.contains('active')) {
        mole.style.bottom = '-50px';
        mole.classList.remove('active');
      }
    }, 900);

  }, 1000);
}


// --- BUBBLE POP ---
let bpScore = 0;
let bpTimer = null;
let bpSpawnTimer = null;
let bpTimeLeft = 20;

export function initBubblePop(container) {
  bpScore = 0;
  bpTimeLeft = 20;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:1.2rem;">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:280px; font-weight:700;">
        <span>Time: <span class="bp-time">20</span>s</span>
        <span style="color:var(--primary);">Score: <span class="bp-score">0</span></span>
      </div>
      
      <!-- Bubble Field Wrapper -->
      <div class="bp-field" style="width:100%; max-width:320px; height:260px; background:rgba(255,255,255,0.4); border:2px dashed var(--primary); border-radius:16px; position:relative; overflow:hidden;"></div>
      
      <button class="btn-primary start-bp">Start Popping! 🎈</button>
    </div>
  `;

  const startBtn = container.querySelector('.start-bp');
  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    startBPGame(container);
  });
}

function startBPGame(container) {
  const timeEl = container.querySelector('.bp-time');
  const scoreEl = container.querySelector('.bp-score');
  const field = container.querySelector('.bp-field');

  // Timers setup
  clearInterval(bpTimer);
  bpTimer = setInterval(() => {
    bpTimeLeft--;
    timeEl.textContent = bpTimeLeft;
    if (bpTimeLeft <= 0) {
      clearInterval(bpTimer);
      clearInterval(bpSpawnTimer);
      field.innerHTML = "";
      
      playSFX('triumph');
      triggerConfetti();
      if (bpScore >= 15) unlockAchievement('game-champion');

      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:2rem 1.5rem;">
          <div style="font-size:3.5rem; margin-bottom:0.5rem;">🎈🎉</div>
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.5rem; margin-bottom:0.5rem;">Bubble Pop Finished!</h3>
          <p style="font-size:1.1rem; margin-bottom:1.5rem;">Bubbles Popped: <strong>${bpScore}</strong></p>
          <button class="btn-primary retry-bp">Play Again 🔁</button>
        </div>
      `;
      container.querySelector('.retry-bp').addEventListener('click', () => initBubblePop(container));
    }
  }, 1000);

  // Spawn bubbles
  clearInterval(bpSpawnTimer);
  bpSpawnTimer = setInterval(() => {
    const bub = document.createElement('div');
    const colors = ['#C5B0E8', '#FF9B85', '#CDF0EA', '#FFF5C0'];
    const size = Math.random() * 25 + 30; // 30-55px
    
    bub.style.position = 'absolute';
    bub.style.width = `${size}px`;
    bub.style.height = `${size}px`;
    bub.style.borderRadius = '50%';
    bub.style.background = colors[Math.floor(Math.random() * colors.length)];
    bub.style.border = '2px solid rgba(255,255,255,0.6)';
    bub.style.left = `${Math.random() * (field.clientWidth - size)}px`;
    bub.style.bottom = `-50px`;
    bub.style.cursor = 'pointer';
    bub.style.opacity = '0.75';
    bub.style.transition = 'bottom 2.8s linear';
    
    field.appendChild(bub);
    
    // Animate up
    setTimeout(() => {
      bub.style.bottom = `${field.clientHeight + 20}px`;
    }, 50);

    bub.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      bpScore++;
      scoreEl.textContent = bpScore;
      playSFX('pop');
      
      // pop effect
      bub.style.transform = 'scale(1.4)';
      bub.style.opacity = '0';
      bub.style.transition = 'transform 0.15s, opacity 0.15s';
      setTimeout(() => bub.remove(), 150);
    });

    // Remove if floats away
    setTimeout(() => {
      if (bub.parentNode) bub.remove();
    }, 3000);

  }, 600);
}
