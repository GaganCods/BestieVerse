// BestieVerse - Quizzes, Emojis, This or That, and Rapid Fire Controller

import { friendshipQuiz, emojiPuzzles, thisOrThatList, rapidFireList, compilePersonalizedQuiz } from './quiz-data.js';
import { playSFX, triggerConfetti } from './utils.js';
import { unlockAchievement } from './storage.js';
import { saveResult, generateUniqueId, getCard, getResult } from './database.js';

// --- GLOBAL STATE ---
let currentCard = null;
let activeQuizList = [];
let quizIdx = 0;
let quizAnswers = [];
let quizStartTime = null;

// Track quiz stats for certificate
let friendScore = 0;
let friendCorrectCount = 0;
let friendTotalQuestions = 0;
let friendDurationStr = "";

// --- FRIENDSHIP QUIZ ---
export function initFriendshipQuiz(container, cardData = null) {
  currentCard = cardData;
  quizIdx = 0;
  quizAnswers = [];
  quizStartTime = Date.now();

  if (cardData) {
    activeQuizList = compilePersonalizedQuiz(cardData);
  } else {
    activeQuizList = friendshipQuiz;
  }
  
  renderQuizCard(container);
}

function renderQuizCard(container) {
  if (quizIdx >= activeQuizList.length) {
    renderQuizResult(container);
    return;
  }

  const q = activeQuizList[quizIdx];
  const progress = (quizIdx / activeQuizList.length) * 100;

  container.innerHTML = `
    <div class="glass-card" style="margin-bottom:1.5rem;">
      <div style="height:6px; background:var(--sky-blue); border-radius:10px; margin-bottom:1rem; overflow:hidden;">
        <div style="width:${progress}%; height:100%; background:var(--primary); transition:width 0.2s;"></div>
      </div>
      <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Question ${quizIdx + 1} of ${activeQuizList.length}</p>
      <h3 style="font-family:var(--font-heading); font-size:1.35rem; margin-bottom:1.5rem; line-height:1.4;">${q.q}</h3>
      <div style="display:flex; flex-direction:column; gap:0.8rem;">
        ${q.options.map((opt, idx) => `
          <button class="btn-secondary quiz-opt-btn" data-idx="${idx}" style="text-align:left; justify-content:flex-start; width:100%; border-radius:16px; padding:0.9rem 1.2rem;">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" style="display:none; padding:0.8rem; border-radius:12px; margin-top:1.2rem; text-align:center; font-weight:600; font-size:0.95rem;"></div>
    </div>
  `;

  const buttons = container.querySelectorAll('.quiz-opt-btn');
  const feedback = container.querySelector('.quiz-feedback');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      buttons.forEach(b => b.disabled = true);
      
      const selected = parseInt(e.currentTarget.getAttribute('data-idx'));
      quizAnswers.push(selected);
      
      const correct = (selected === q.answer);
      playSFX(correct ? 'success' : 'click');
      
      e.currentTarget.style.background = correct ? '#CDF0EA' : '#FFD8BE';
      e.currentTarget.style.color = '#3D3A45';
      
      feedback.style.display = 'block';
      feedback.style.background = correct ? 'rgba(205, 240, 234, 0.3)' : 'rgba(255, 155, 133, 0.15)';
      feedback.style.color = correct ? '#4A8B80' : '#D66D57';
      feedback.textContent = q.feedback;

      setTimeout(() => {
        quizIdx++;
        renderQuizCard(container);
      }, 1800);
    });
  });
}

function renderQuizResult(container) {
  triggerConfetti();
  playSFX('triumph');
  unlockAchievement('quiz-master');

  let correctCount = 0;
  quizAnswers.forEach((ans, idx) => {
    if (ans === activeQuizList[idx].answer) correctCount++;
  });

  const totalQ = activeQuizList.length;
  const scorePct = Math.round((correctCount / totalQ) * 100);
  
  const durationMs = Date.now() - quizStartTime;
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / 1000 / 60) % 60);
  const timeStr = `${minutes}m ${seconds}s`;

  // Save quiz states globally
  friendCorrectCount = correctCount;
  friendTotalQuestions = totalQ;
  friendScore = scorePct;
  friendDurationStr = timeStr;

  const counts = {};
  quizAnswers.forEach(ans => { counts[ans] = (counts[ans] || 0) + 1; });
  let topAns = 0;
  let maxCount = 0;
  for (let key in counts) {
    if (counts[key] > maxCount) {
      maxCount = counts[key];
      topAns = parseInt(key);
    }
  }

  const profiles = [
    { title: "The Sleep Champion & Snack Enthusiast 🐼🍟", desc: "You value sleep, cozy cabin rain vibes, and eating chips while reading the syllabus. A true master of comfort!" },
    { title: "The High-Speed Texting Meme Master 📱😂", desc: "You reply in 0.5 seconds, send 15 separate bubble texts, and find the perfect reaction meme for any situation. A communication icon!" },
    { title: "The Elite Gossip Officer ☕👀", desc: "You say you hate drama, but run to call me as soon as something happens. You keep the tea hot and the stories rolling!" },
    { title: "The Wholesome Adventure Seeker ⛰️🌸", desc: "You love spontaneous road trips, cozy blankets, cute cats, and exploring new cafes. A ray of absolute sunshine!" }
  ];

  const result = profiles[topAns] || profiles[0];

  container.innerHTML = `
    <div class="glass-card" style="text-align:center; padding: 2.5rem 1.5rem;">
      <div style="font-size:4rem; margin-bottom:1rem; animation:bounce 2s infinite;">🏆</div>
      <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.6rem; margin-bottom:0.5rem;">TRIVIA COMPLETED!</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Your Friendship Score: <strong>${scorePct}%</strong> (${correctCount}/${totalQ})</p>
      
      <div style="background:var(--yellow); padding:1.5rem; border-radius:var(--radius); margin-bottom:2rem; border:1px dashed var(--accent);">
        <h4 style="font-size:1.25rem; font-weight:700; margin-bottom:0.5rem;">${result.title}</h4>
        <p style="font-size:0.92rem; line-height:1.5; color:var(--text);">${result.desc}</p>
      </div>

      <button class="btn-primary proceed-results-btn">Next: Complete Challenges! ➡️</button>
    </div>
  `;

  container.querySelector('.proceed-results-btn').addEventListener('click', () => {
    playSFX('click');
    
    // Unlock Certificate nav tabs
    document.querySelectorAll('.cert-nav-link').forEach(link => {
      link.style.display = 'flex';
    });

    // Make claim button on ending view visible
    const endClaimBtn = document.getElementById('end-claim-cert-btn');
    if (endClaimBtn) {
      endClaimBtn.style.display = 'block';
      // Bind click on Ending view claim button
      endClaimBtn.onclick = () => {
        generateAndSaveFriendshipResult();
      };
    }

    // Programmatically navigate to achievements page to see challenges
    const link = document.querySelector('.mobile-nav-link[data-target="achievements-view"]') || 
                 document.querySelector('.nav-link[data-target="achievements-view"]');
    if (link) link.click();
  });
}

// Generate unique result share ID, save to DB, and render certificate
async function generateAndSaveFriendshipResult() {
  if (!currentCard) return;

  const resultId = generateUniqueId();
  const completedChalls = Array.from(document.querySelectorAll('.challenges-container input[type="checkbox"]:checked')).map(box => box.nextElementSibling.textContent.trim());

  const resultData = {
    cardId: currentCard.id,
    friendName: currentCard.friendName,
    score: friendScore,
    correctAnswers: friendCorrectCount,
    totalQuestions: friendTotalQuestions,
    timeTaken: friendDurationStr,
    favoriteEmoji: currentCard.favoriteEmoji,
    mostSelectedFood: currentCard.favoriteFood,
    mood: friendScore >= 80 ? "Super Happy! 💖" : "Goofy 😂",
    choices: ttChoices,
    completedChallenges: completedChalls
  };

  // Show loading modal/alert
  const claimBtn = document.getElementById('end-claim-cert-btn');
  claimBtn.disabled = true;
  claimBtn.textContent = "Sealing Certificate... 📜";

  try {
    await saveResult(resultId, resultData);
    // Render certificate view
    renderFriendCertificate(currentCard, resultId, friendScore);
    
    // Navigate to certificate view
    const link = document.querySelector('.mobile-nav-link[data-target="certificate-view"]') || 
                 document.querySelector('.nav-link[data-target="certificate-view"]');
    if (link) link.click();
  } catch (e) {
    console.error("Result save failed:", e);
    alert("Could not save certificate. Please try again.");
  } finally {
    claimBtn.disabled = false;
    claimBtn.textContent = "Claim Friendship Certificate! 📜";
  }
}

// Render Certificate Details on view screen
function renderFriendCertificate(card, resultId, score) {
  const certContainer = document.getElementById('friend-certificate');
  const nameEl = document.getElementById('cert-recipient-name');
  const dateEl = document.getElementById('cert-date');
  const sigImg = document.getElementById('cert-signature-img');
  const qrImg = document.getElementById('cert-verify-qr');
  const idEl = document.getElementById('cert-id-text');
  const sigLabel = document.getElementById('cert-creator-sig-label');

  if (!certContainer) return;

  // Apply cert style attributes
  certContainer.setAttribute('data-cert-style', card.certStyle || 'classic');

  // Customize frames dynamically based on style selection
  if (card.certStyle === 'neon') {
    certContainer.style.background = '#111';
    certContainer.style.color = '#39FF14';
    certContainer.style.border = '5px solid #FF007F';
    certContainer.style.boxShadow = '0 0 20px #FF007F';
  } else if (card.certStyle === 'cute') {
    certContainer.style.background = '#FFEAF0';
    certContainer.style.color = '#5D434B';
    certContainer.style.border = '8px double #FF8BA7';
  } else if (card.certStyle === 'arcade') {
    certContainer.style.background = '#1A142D';
    certContainer.style.color = '#00FF66';
    certContainer.style.border = '6px dashed #9D4EDD';
  } else {
    // Classic
    certContainer.style.background = '#FFF8E7';
    certContainer.style.color = '#3D3A45';
    certContainer.style.border = '12px double #9B82C1';
    certContainer.style.boxShadow = 'none';
  }

  // Populate dynamic details
  if (nameEl) nameEl.textContent = card.friendName;
  if (sigLabel) sigLabel.textContent = card.creatorName;
  
  const options = { month: 'long', year: 'numeric' };
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', options);

  if (sigImg) {
    sigImg.src = card.signature || '';
  }

  if (idEl) {
    idEl.textContent = `ID: Cert-${card.id}`;
  }

  // Generate QR Code verification link
  const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify/${card.id}`;
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`;
  }

  // Set up certificate controls and shared links
  setupCertificateControls(card, resultId, score);
}

// Bind certificate download and sharing functions
function setupCertificateControls(card, resultId, score) {
  const resultUrlInput = document.getElementById('cert-result-url');
  const copyBtn = document.getElementById('copy-result-url-btn');
  const dlPngBtn = document.getElementById('cert-download-png');
  const dlPdfBtn = document.getElementById('cert-download-pdf');
  const waBtn = document.getElementById('share-wa-btn');
  const tgBtn = document.getElementById('share-tg-btn');

  const resultUrl = `${window.location.origin}${window.location.pathname}#/result/${resultId}`;
  if (resultUrlInput) resultUrlInput.value = resultUrl;

  // Copy results link action
  if (copyBtn) {
    copyBtn.onclick = () => {
      playSFX('click');
      if (resultUrlInput) {
        resultUrlInput.select();
        navigator.clipboard.writeText(resultUrl);
        copyBtn.textContent = "Copied! ✓";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
      }
    };
  }

  // Download PNG (using html2canvas)
  if (dlPngBtn) {
    dlPngBtn.onclick = () => {
      playSFX('success');
      const target = document.getElementById('friend-certificate');
      html2canvas(target, {
        scale: 2, // scale up resolution for beautiful downloads
        backgroundColor: null,
        useCORS: true
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `BestieVerse-Friendship-Certificate-${card.friendName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    };
  }

  // Download PDF (using jsPDF)
  if (dlPdfBtn) {
    dlPdfBtn.onclick = () => {
      playSFX('success');
      const target = document.getElementById('friend-certificate');
      html2canvas(target, {
        scale: 2,
        useCORS: true
      }).then(canvas => {
        const { jsPDF } = window.jspdf;
        // Landscape certificate template format matching canvas aspect ratio
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        doc.save(`BestieVerse-Certificate-${card.friendName}.pdf`);
      });
    };
  }

  // Social Sharing Link generators
  const shareText = `I completed the Friendship Challenge in ${card.friendName}'s BestieVerse! Score: ${score}%! Check out my official certificate:`;
  if (waBtn) {
    waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + resultUrl)}`;
  }
  if (tgBtn) {
    tgBtn.href = `https://t.me/share/url?url=${encodeURIComponent(resultUrl)}&text=${encodeURIComponent(shareText)}`;
  }
}

// Render Result Viewer page for Creator
export async function renderResultPage(cardId) {
  // Fetch result data (cardId in result route resolves to result object id or cardId)
  // Let's check cardId as direct result ID first, if not check results mapped to cardId
  let result = await getResult(cardId);
  if (!result) {
    // If not found directly, search if creator is opening via cardId (fallback search)
    // For local fallback it is easy.
    alert("Could not load result. Link may be invalid.");
    window.location.hash = "#/";
    return;
  }

  // Fetch the parent card details to read creator/friend names
  const card = await getCard(result.cardId);
  if (!card) return;

  const header = document.getElementById('res-header');
  const subtitle = document.getElementById('res-subtitle');
  const scoreEl = document.getElementById('res-score');
  const levelEl = document.getElementById('res-level');
  const correctEl = document.getElementById('res-correct');
  const timeEl = document.getElementById('res-time');
  const emojiEl = document.getElementById('res-emoji');
  const foodEl = document.getElementById('res-food');
  const choicesEl = document.getElementById('res-choices');
  const dlBtn = document.getElementById('res-download-cert-btn');

  // Fill in content
  if (header) header.textContent = `${result.friendName}'s Quiz Results!`;
  if (subtitle) subtitle.textContent = `Awarded by ${card.creatorName}. Completed in ${result.timeTaken || 'some time'}.`;
  if (scoreEl) scoreEl.textContent = `${result.score}%`;
  
  // Friendship Levels
  let level = "Casual Friend";
  if (result.score >= 90) level = "Legendary Bestie ⭐⭐⭐⭐⭐";
  else if (result.score >= 75) level = "Super BFF 🌟🌟🌟🌟";
  else if (result.score >= 50) level = "Cozy Buddy ⭐⭐⭐";
  if (levelEl) levelEl.textContent = level;

  if (correctEl) correctEl.textContent = `${result.correctAnswers}/${result.totalQuestions}`;
  if (timeEl) timeEl.textContent = result.timeTaken || '--';
  if (emojiEl) emojiEl.textContent = result.favoriteEmoji || '--';
  if (foodEl) foodEl.textContent = result.mostSelectedFood || '--';

  // Render This or That selections
  if (choicesEl) {
    if (result.choices && result.choices.length > 0) {
      choicesEl.innerHTML = result.choices.map(c => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(0,0,0,0.1); padding: 0.2rem 0;">
          <strong>${c.q}:</strong>
          <span style="color: var(--primary); font-weight: 600;">${c.ans}</span>
        </div>
      `).join('');
    } else {
      choicesEl.innerHTML = `<div style="color:var(--text-muted);">No choices recorded.</div>`;
    }
  }

  // Download certificate action link from Result View
  if (dlBtn) {
    dlBtn.onclick = () => {
      // Temporarily render certificate and trigger download png!
      renderFriendCertificate(card, result.id, result.score);
      // Wait for DOM layout and trigger download PNG click
      setTimeout(() => {
        const dlPng = document.getElementById('cert-download-png');
        if (dlPng) dlPng.click();
      }, 500);
    };
  }
}

// Render Certificate Verification Details
export async function renderVerificationPage(cardId) {
  const card = await getCard(cardId);
  if (!card) {
    alert("Invalid verification code.");
    window.location.hash = "#/";
    return;
  }

  const vCertId = document.getElementById('v-cert-id');
  const vFriendName = document.getElementById('v-friend-name');
  const vCreatorName = document.getElementById('v-creator-name');
  const vScore = document.getElementById('v-score');
  const vLevel = document.getElementById('v-level');
  const vDate = document.getElementById('v-date');

  if (vCertId) vCertId.textContent = `Cert-${card.id}`;
  if (vFriendName) vFriendName.textContent = card.friendName;
  if (vCreatorName) vCreatorName.textContent = card.creatorName;
  
  // Since we are verifying the card certificate authenticity
  if (vScore) vScore.textContent = "PASSED";
  if (vLevel) vLevel.textContent = "Verified BFFs 💖";
  
  const options = { month: 'long', year: 'numeric', day: 'numeric' };
  if (vDate) vDate.textContent = new Date(card.createdAt).toLocaleDateString('en-US', options);
}

// --- GUESS THE EMOJI ---
let emojiIdx = 0;
let emojiScore = 0;

export function initGuessEmoji(container) {
  emojiIdx = 0;
  emojiScore = 0;
  renderEmojiCard(container);
}

function renderEmojiCard(container) {
  if (emojiIdx >= emojiPuzzles.length) {
    triggerConfetti();
    playSFX('triumph');
    unlockAchievement('puzzle-solver');
    
    container.innerHTML = `
      <div class="glass-card" style="text-align:center; padding: 2.5rem 1.5rem;">
        <div style="font-size:4rem; margin-bottom:1rem;">🧩🎉</div>
        <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.6rem; margin-bottom:0.5rem;">EMOJI PUZZLES DONE!</h3>
        <p style="font-size:1.1rem; margin-bottom:2rem;">You solved <strong>${emojiScore}</strong> out of <strong>${emojiPuzzles.length}</strong> puzzles! 🧠</p>
        <button class="btn-primary retry-emoji-btn">Retry Puzzles 🔁</button>
      </div>
    `;
    container.querySelector('.retry-emoji-btn').addEventListener('click', () => {
      initGuessEmoji(container);
    });
    return;
  }

  const p = emojiPuzzles[emojiIdx];
  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Puzzle ${emojiIdx + 1} of ${emojiPuzzles.length}</p>
      <h3 style="font-size:3rem; margin-bottom:1rem; letter-spacing:8px;">${p.puzzle}</h3>
      
      <div style="display:flex; flex-direction:column; gap:0.8rem; max-width:320px; margin: 0 auto 1rem auto;">
        <input type="text" class="form-input emoji-answer-input" placeholder="Type your guess here..." style="text-align:center;">
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-secondary hint-btn" style="flex:1; padding:0.6rem;">Get Hint 💡</button>
          <button class="btn-primary submit-emoji-btn" style="flex:1; padding:0.6rem;">Solve ⚡</button>
        </div>
      </div>
      
      <div class="hint-text" style="display:none; font-size:0.85rem; font-weight:600; color:var(--accent); margin-bottom:0.8rem;"></div>
      <div class="emoji-feedback" style="min-height:24px; font-weight:700; font-size:0.92rem;"></div>
    </div>
  `;

  const input = container.querySelector('.emoji-answer-input');
  const submitBtn = container.querySelector('.submit-emoji-btn');
  const hintBtn = container.querySelector('.hint-btn');
  const hintText = container.querySelector('.hint-text');
  const feedback = container.querySelector('.emoji-feedback');

  hintBtn.addEventListener('click', () => {
    playSFX('click');
    hintText.style.display = 'block';
    hintText.textContent = `Clue: ${p.hint}`;
  });

  const checkAnswer = () => {
    const val = input.value.trim().toLowerCase();
    if (!val) return;

    submitBtn.disabled = true;
    input.disabled = true;

    const isMatch = val.includes(p.answer) || p.answer.includes(val);

    if (isMatch) {
      playSFX('success');
      emojiScore++;
      feedback.style.color = '#4A8B80';
      feedback.textContent = "Exactly! You got it right! 🥳🎉";
      triggerConfetti();
    } else {
      playSFX('fail');
      feedback.style.color = '#D66D57';
      feedback.textContent = `Oops! The correct answer was "${p.answer}". 😜`;
      container.querySelector('.glass-card').classList.add('animate-shake');
      setTimeout(() => {
        container.querySelector('.glass-card').classList.remove('animate-shake');
      }, 500);
    }

    setTimeout(() => {
      emojiIdx++;
      renderEmojiCard(container);
    }, 2000);
  };

  submitBtn.addEventListener('click', checkAnswer);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
}

// --- THIS OR THAT ---
let ttIdx = 0;
let ttChoices = [];

export function initThisOrThat(container) {
  ttIdx = 0;
  ttChoices = [];
  renderThisThatCard(container);
}

function renderThisThatCard(container) {
  if (ttIdx >= thisOrThatList.length) {
    renderThisThatResult(container);
    return;
  }

  const item = thisOrThatList[ttIdx];
  container.innerHTML = `
    <div class="glass-card this-that-card" style="text-align:center; transition:transform 0.4s;">
      <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Choice ${ttIdx + 1} of ${thisOrThatList.length}</p>
      <h3 style="font-family:var(--font-heading); font-size:1.5rem; margin-bottom:2rem; color:var(--primary);">${item.question}</h3>
      
      <div style="display:flex; gap:1.2rem; justify-content:center; flex-wrap:wrap;">
        <button class="btn-primary tt-btn" data-dir="left" style="font-size:1.15rem; padding:1.2rem 2.2rem; border-radius:20px; min-width:160px; background:var(--primary);">
          ${item.optionA}
        </button>
        <button class="btn-accent tt-btn" data-dir="right" style="font-size:1.15rem; padding:1.2rem 2.2rem; border-radius:20px; min-width:160px;">
          ${item.optionB}
        </button>
      </div>
    </div>
  `;

  const card = container.querySelector('.this-that-card');
  container.querySelectorAll('.tt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dir = e.currentTarget.getAttribute('data-dir');
      const chosenText = dir === 'left' ? item.optionA : item.optionB;
      ttChoices.push({ q: item.question, ans: chosenText });
      
      playSFX('click');
      card.classList.add(dir === 'left' ? 'swipe-left-anim' : 'swipe-right-anim');

      setTimeout(() => {
        ttIdx++;
        renderThisThatCard(container);
      }, 450);
    });
  });
}

function renderThisThatResult(container) {
  triggerConfetti();
  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.6rem; margin-bottom:1.5rem;">YOUR CHOICE SUMMARY</h3>
      <div style="text-align:left; max-width:400px; margin:0 auto 2rem auto; display:flex; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.4); padding:1rem; border-radius:16px; border:1px solid var(--card-border);">
        ${ttChoices.map(c => `<div><strong>${c.q}:</strong> <span style="color:var(--primary); font-weight:600;">${c.ans}</span></div>`).join('')}
      </div>
      <button class="btn-primary retry-tt-btn">Play Again 🔁</button>
    </div>
  `;
  container.querySelector('.retry-tt-btn').addEventListener('click', () => {
    initThisOrThat(container);
  });
}

// --- RAPID FIRE ---
let rfIdx = 0;
let rfAnswers = [];
let rfTimer = null;
let rfTimeLeft = 5;

export function initRapidFire(container) {
  rfIdx = 0;
  rfAnswers = [];
  renderRapidCard(container);
}

function renderRapidCard(container) {
  if (rfIdx >= rapidFireList.length) {
    clearInterval(rfTimer);
    triggerConfetti();
    playSFX('triumph');
    container.innerHTML = `
      <div class="glass-card" style="text-align:center;">
        <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.6rem; margin-bottom:1rem;">RAPID FIRE COMPLETED!</h3>
        <p style="color:var(--text-muted); margin-bottom:1.5rem;">Look at how fast your subconscious works:</p>
        <div style="text-align:left; max-width:400px; margin:0 auto 2rem auto; display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto; background:rgba(255,255,255,0.4); padding:1rem; border-radius:16px;">
          ${rfAnswers.map(ans => `<div><strong>${ans.q}</strong> → <span style="color:var(--accent); font-weight:700;">${ans.a}</span></div>`).join('')}
        </div>
        <button class="btn-primary retry-rf-btn">Play Again 🔁</button>
      </div>
    `;
    container.querySelector('.retry-rf-btn').addEventListener('click', () => {
      initRapidFire(container);
    });
    return;
  }

  const q = rapidFireList[rfIdx];
  rfTimeLeft = 5;

  container.innerHTML = `
    <div class="glass-card" style="text-align:center;">
      <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Rapid Fire ${rfIdx + 1} of ${rapidFireList.length}</p>
      <h3 style="font-family:var(--font-heading); font-size:2rem; color:var(--primary); margin-bottom:1rem; min-height:55px;">${q}</h3>
      
      <div style="height:8px; background:var(--sky-blue); border-radius:10px; margin-bottom:1.5rem; overflow:hidden; max-width:250px; margin:0 auto 1.5rem auto;">
        <div class="rf-progress" style="width:100%; height:100%; background:var(--accent); transition:width 0.1s linear;"></div>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:0.8rem; max-width:280px; margin:0 auto;">
        <input type="text" class="form-input rf-text-input" placeholder="Type first word in your mind..." autofocus style="text-align:center;">
        <button class="btn-primary submit-rf-btn">Next Word ⚡</button>
      </div>
    </div>
  `;

  const input = container.querySelector('.rf-text-input');
  const bar = container.querySelector('.rf-progress');
  input.focus();

  const nextQuestion = (answerText) => {
    clearInterval(rfTimer);
    rfAnswers.push({ q, a: answerText });
    rfIdx++;
    renderRapidCard(container);
  };

  clearInterval(rfTimer);
  rfTimer = setInterval(() => {
    rfTimeLeft -= 0.1;
    const w = (rfTimeLeft / 5) * 100;
    if (bar) bar.style.width = `${w}%`;

    if (rfTimeLeft <= 0) {
      clearInterval(rfTimer);
      playSFX('fail');
      nextQuestion("⏰ Timeout!");
    }
  }, 100);

  const triggerNext = () => {
    const text = input.value.trim() || "😶 Blank!";
    playSFX('click');
    nextQuestion(text);
  };

  container.querySelector('.submit-rf-btn').addEventListener('click', triggerNext);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') triggerNext();
  });
}
