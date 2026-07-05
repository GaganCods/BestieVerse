// BestieVerse - Quizzes, Emojis, This or That, and Rapid Fire Controller (URL-encoded)

import { questionLibrary, emojiPuzzles, thisOrThatList, rapidFireList } from './quiz-data.js';
import { playSFX, triggerConfetti } from './utils.js';
import { unlockAchievement } from './storage.js';
import { encodeCard, decodeCard, encodeResult, decodeResult } from './database.js';

// --- GLOBAL STATE ---
let currentCard = null;
let currentCardHash = "";
let activeQuizList = [];
let quizIdx = 0;
let quizAnswers = [];
let quizStartTime = null;

// Track quiz stats for certificate
let friendScore = 0;
let friendCorrectCount = 0;
let friendTotalQuestions = 0;
let friendDurationStr = "";

// Helper to generate a cute Certificate ID (e.g. BF-2026-X9A2B1)
function generateCertId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BF-${new Date().getFullYear()}-${result}`;
}

// --- FRIENDSHIP CHALLENGE QUIZ ---
export function initFriendshipQuiz(container, cardData = null, cardHash = "") {
  currentCard = cardData;
  currentCardHash = cardHash;
  quizIdx = 0;
  quizAnswers = [];
  quizStartTime = Date.now();

  if (cardData && cardData.quiz) {
    // Map configuration to full question objects
    activeQuizList = cardData.quiz.map(([qId, creatorAnsIdx]) => {
      const qTemplate = questionLibrary.find(item => item.id === qId);
      if (qTemplate) {
        return {
          id: qTemplate.id,
          category: qTemplate.category,
          q: qTemplate.q,
          options: qTemplate.options,
          answer: creatorAnsIdx,
          feedback: `Correct Answer!`
        };
      }
      return null;
    }).filter(q => q !== null);
  } else {
    // Fallback/Default quiz list if loaded directly without creator config
    activeQuizList = questionLibrary.slice(0, 10).map(q => ({
      id: q.id,
      category: q.category,
      q: q.q,
      options: q.options,
      answer: 0,
      feedback: "Default quiz option"
    }));
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
          <button class="btn-secondary quiz-opt-btn" data-idx="${idx}" style="text-align:left; justify-content:flex-start; width:100%; border-radius:16px; padding:0.9rem 1.2rem; transition: var(--transition);">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const buttons = container.querySelectorAll('.quiz-opt-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Disable all options
      buttons.forEach(b => b.disabled = true);
      
      const selected = parseInt(e.currentTarget.getAttribute('data-idx'));
      quizAnswers.push(selected);
      
      // Tap selection highlight
      e.currentTarget.style.background = 'var(--primary)';
      e.currentTarget.style.color = 'white';
      e.currentTarget.style.borderColor = 'var(--primary)';
      
      playSFX('click');
      
      setTimeout(() => {
        quizIdx++;
        renderQuizCard(container);
      }, 400);
    });
  });
}

function renderQuizResult(container) {
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

  // Save states globally
  friendCorrectCount = correctCount;
  friendTotalQuestions = totalQ;
  friendScore = scorePct;
  friendDurationStr = timeStr;

  let currentStep = 1;

  const showStep = () => {
    container.innerHTML = "";
    
    if (currentStep === 1) {
      // Step 1: Challenge Complete
      playSFX('success');
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 2.5rem 1.5rem; animation: fadeSlideIn 0.4s ease-out;">
          <div style="font-size:4.5rem; margin-bottom:1rem; animation:bounce 2s infinite;">🎉</div>
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.6rem; margin-bottom:0.5rem;">CHALLENGE COMPLETE!</h3>
          <p style="font-size:0.95rem; color:var(--text-muted); margin-bottom:2rem;">
            You completed the Friendship Challenge! Ready to see how well you know ${currentCard ? currentCard.creatorName : 'them'}?
          </p>
          <button class="btn-primary next-step-btn" style="padding:0.9rem 2.2rem;">Reveal My Score 🚀</button>
        </div>
      `;
    } else if (currentStep === 2) {
      // Step 2: Score Animation & Friendship Level
      playSFX('triumph');
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 2.5rem 1.5rem; animation: fadeSlideIn 0.4s ease-out;">
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.25rem; margin-bottom:1.5rem; text-transform:uppercase;">Calculating Friendship Accuracy...</h3>
          <div style="font-size:5rem; font-weight:800; color:var(--accent); line-height:1; margin-bottom:0.5rem;" id="res-score-counting">0%</div>
          <div id="res-level-reveal" style="font-size:1.3rem; font-weight:700; color:var(--text); opacity:0; transform:translateY(15px); transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom:2rem;">--</div>
          <button class="btn-primary next-step-btn" id="score-next-btn" style="padding:0.9rem 2.2rem; display:none;">Answer Review 🔍</button>
        </div>
      `;

      const scoreEl = container.querySelector('#res-score-counting');
      const levelEl = container.querySelector('#res-level-reveal');
      const nextBtn = container.querySelector('#score-next-btn');

      // Determine Friendship Level
      let levelText = "";
      if (scorePct === 100) levelText = "Soul-Level Best Friend 💖";
      else if (scorePct >= 90) levelText = "Legendary Best Friend ⭐";
      else if (scorePct >= 75) levelText = "Certified Best Friend 📜";
      else if (scorePct >= 60) levelText = "Pretty Good Friend 👍";
      else if (scorePct >= 40) levelText = "Need More Hangouts 😄";
      else levelText = "Let's spend more time together 😂";

      let currentVal = 0;
      const countTimer = setInterval(() => {
        currentVal += Math.max(1, Math.round(scorePct / 35));
        if (currentVal >= scorePct) {
          currentVal = scorePct;
          clearInterval(countTimer);
          triggerConfetti();
          
          if (levelEl) {
            levelEl.textContent = levelText;
            levelEl.style.opacity = '1';
            levelEl.style.transform = 'translateY(0)';
          }
          if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
          }
        }
        if (scoreEl) scoreEl.textContent = `${currentVal}%`;
      }, 30);

    } else if (currentStep === 3) {
      // Step 3: Answer Review & Funny Summary
      playSFX('click');
      
      const incorrectQuestions = [];
      activeQuizList.forEach((q, idx) => {
        if (quizAnswers[idx] !== q.answer) {
          const cleanQText = q.q
            .replace(/What's my |What is my |My |I usually /gi, '')
            .replace(/\?/g, '');
          incorrectQuestions.push(cleanQText.toLowerCase());
        }
      });

      let summaryText = "";
      if (scorePct === 100) {
        summaryText = "🤯 Are you in my mind?! You got every single question correct. You know me better than I know myself! We are officially the same person. 💖";
      } else if (scorePct >= 90) {
        summaryText = `😂 You definitely know me well. You only forgot: ${incorrectQuestions.map(q => `• ${q}`).join(', ')}. Looks like we need one more coffee meetup 😄`;
      } else if (scorePct >= 75) {
        summaryText = `😎 Solid score! You got most of them right, but forgot: ${incorrectQuestions.map(q => `• ${q}`).join(', ')}. Let's plan a hangout soon to catch up! 🍕`;
      } else if (scorePct >= 60) {
        summaryText = `🤔 Not bad, but we have some homework to do! You missed: ${incorrectQuestions.map(q => `• ${q}`).join(', ')}. Time to refresh our inside jokes!`;
      } else if (scorePct >= 40) {
        summaryText = `😅 We need more hangouts! You missed several key details like: ${incorrectQuestions.map(q => `• ${q}`).join(', ')}. Let's grab food and chat soon.`;
      } else {
        summaryText = `💀 Oh no! Do you even know me? 😂 You missed almost everything, including: ${incorrectQuestions.map(q => `• ${q}`).join(', ')}. Let's spend more time together ASAP!`;
      }

      container.innerHTML = `
        <div class="glass-card" style="padding: 2rem 1.5rem; animation: fadeSlideIn 0.4s ease-out; max-width:550px; margin:0 auto;">
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.3rem; margin-bottom:1rem; text-align:center;">ANSWER REVIEW</h3>
          
          <div style="display:flex; flex-direction:column; gap:0.8rem; max-height:280px; overflow-y:auto; margin-bottom:1.5rem; padding-right:0.25rem;">
            ${activeQuizList.map((q, idx) => {
              const isCorrect = quizAnswers[idx] === q.answer;
              return `
                <div style="padding:0.8rem; border:1px solid ${isCorrect ? 'rgba(74, 139, 128, 0.2)' : 'rgba(214, 109, 87, 0.2)'}; border-radius:12px; background:${isCorrect ? 'rgba(205, 240, 234, 0.15)' : 'rgba(255, 155, 133, 0.08)'}; text-align:left;">
                  <div style="font-size:0.7rem; font-weight:700; color:var(--text-muted); margin-bottom:0.15rem;">QUESTION ${idx + 1}</div>
                  <div style="font-weight:600; font-size:0.88rem; color:var(--text); margin-bottom:0.4rem;">${q.q}</div>
                  <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.15rem;">
                    <div style="color:${isCorrect ? '#376F65' : '#D66D57'}; font-weight:700;">
                      ${isCorrect ? '✅' : '❌'} Your Answer: ${q.options[quizAnswers[idx]] || 'None'}
                    </div>
                    ${!isCorrect ? `<div style="color:#376F65; font-weight:600;">✅ Correct Answer: ${q.options[q.answer]}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Funny Summary Box -->
          <div style="background:var(--yellow); padding:1.1rem; border-radius:16px; border:1px dashed var(--accent); font-size:0.9rem; line-height:1.5; color:var(--text); text-align:left; margin-bottom:1.5rem;">
            ${summaryText}
          </div>
          
          <button class="btn-primary next-step-btn" style="padding:0.9rem 2.2rem; width:100%; justify-content:center;">Unlock Achievements 🏆</button>
        </div>
      `;
    } else if (currentStep === 4) {
      // Step 4: Achievements Unlocked
      playSFX('success');
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 2.5rem 1.5rem; animation: fadeSlideIn 0.4s ease-out;">
          <div style="font-size:4.5rem; margin-bottom:1rem; animation:pulse 1s infinite;">🏆</div>
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.3rem; margin-bottom:0.5rem;">ACHIEVEMENTS UNLOCKED</h3>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1.5rem;">You earned the following stickers and badges during this challenge!</p>
          
          <div style="display:flex; gap:1rem; justify-content:center; margin-bottom:2rem; flex-wrap:wrap;">
            <div style="background:var(--yellow); border:1px solid var(--accent); padding:0.8rem; border-radius:16px; width:90px; text-align:center;">
              <div style="font-size:2rem; margin-bottom:0.25rem;">📚</div>
              <div style="font-size:0.62rem; font-weight:700;">Quiz Sticker</div>
            </div>
            ${scorePct >= 85 ? `
              <div style="background:var(--yellow); border:1px solid var(--accent); padding:0.8rem; border-radius:16px; width:90px; text-align:center;">
                <div style="font-size:2rem; margin-bottom:0.25rem;">🏆</div>
                <div style="font-size:0.62rem; font-weight:700;">Quiz Master</div>
              </div>
            ` : ''}
            <div style="background:var(--yellow); border:1px solid var(--accent); padding:0.8rem; border-radius:16px; width:90px; text-align:center;">
              <div style="font-size:2rem; margin-bottom:0.25rem;">⭐</div>
              <div style="font-size:0.62rem; font-weight:700;">BFF Challenge</div>
            </div>
          </div>

          <button class="btn-primary next-step-btn" style="padding:0.9rem 2.2rem; width:100%; justify-content:center;">Claim Certificate 📜</button>
        </div>
      `;
    } else if (currentStep === 5) {
      // Step 5: Certificate Unlock Padlock animation
      playSFX('success');
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 2.5rem 1.5rem; animation: fadeSlideIn 0.4s ease-out;">
          <div id="padlock-animation" style="font-size:5.5rem; margin-bottom:1rem; cursor:pointer; display:inline-block; transition:transform 0.4s;">🔒</div>
          <h3 style="font-family:var(--font-heading); color:var(--primary); font-size:1.3rem; margin-bottom:0.5rem;">YOUR CERTIFICATE IS READY</h3>
          <p style="font-size:0.92rem; color:var(--text-muted); margin-bottom:2rem;">Click below to unlock your verified Certificate of Friendship!</p>
          <button class="btn-accent" id="unlock-cert-btn" style="padding:0.9rem 2.5rem; animation: pulse 1.2s infinite;">Unlock Certificate ✨</button>
        </div>
      `;

      const padlock = container.querySelector('#padlock-animation');
      const unlockBtn = container.querySelector('#unlock-cert-btn');

      unlockBtn.onclick = () => {
        playSFX('triumph');
        padlock.style.transform = 'scale(1.25) rotate(15deg)';
        padlock.textContent = '🔓';
        
        setTimeout(() => {
          triggerConfetti();
          // Unlock certificate view tab
          document.querySelectorAll('.cert-nav-link').forEach(link => {
            link.style.display = 'flex';
          });
          generateAndSaveFriendshipResult();
        }, 800);
      };
    }

    const nextBtn = container.querySelector('.next-step-btn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        playSFX('click');
        currentStep++;
        showStep();
      };
    }
  };

  showStep();
}

// Package result, compress, and render certificate
export function generateAndSaveFriendshipResult() {
  if (!currentCard) {
    if (window.location.hash.includes('#/f/')) {
      const hash = window.location.hash;
      const encodedCard = hash.split('#/f/')[1];
      if (encodedCard) {
        const cleanHash = encodedCard.split('?')[0];
        currentCard = decodeCard(cleanHash);
        currentCardHash = cleanHash;
      }
    }
  }

  if (!currentCard) return;

  const certId = generateCertId();

  // Retrieve the friend's name entered at the start (id="f-friend-name")
  const friendNameInput = document.getElementById('f-friend-name');
  const recipientName = friendNameInput ? friendNameInput.value.trim() : (currentCard.friendName || "Priya Sharma");

  // Package results + parent card config
  const resultData = {
    cardId: currentCardHash,
    certId: certId,
    friendName: recipientName,
    creatorName: currentCard.creatorName,
    score: friendScore,
    correctAnswers: friendCorrectCount,
    totalQuestions: friendTotalQuestions,
    timeTaken: friendDurationStr,
    friendAnswers: quizAnswers
  };

  try {
    const encodedResult = encodeResult(resultData);
    
    // Render certificate details
    renderFriendCertificate(currentCard, encodedResult, friendScore, certId);
    
    // Navigate to certificate view
    const link = document.querySelector('.mobile-nav-link[data-target="certificate-view"]') || 
                 document.querySelector('.nav-link[data-target="certificate-view"]');
    if (link) link.click();
  } catch (e) {
    console.error("Result save failed:", e);
    alert("Could not generate certificate. Please try again.");
  }
}

// Render Certificate Details on view screen
function renderFriendCertificate(card, encodedResult, score, certId) {
  const certContainer = document.getElementById('friend-certificate');
  if (!certContainer) return;

  // Retrieve the friend's name entered at the start (id="f-friend-name")
  const friendNameInput = document.getElementById('f-friend-name');
  const recipientName = friendNameInput ? friendNameInput.value.trim() : (card.friendName || "Priya Sharma");

  // 1. Populate Names & Signatures
  const nameEl = document.getElementById('cert-recipient-name');
  if (nameEl) nameEl.textContent = recipientName;

  const creatorSig = document.getElementById('cert-creator-signature');
  if (creatorSig) creatorSig.textContent = card.signature || card.creatorName;

  // 2. Populate Date & ID
  const dateEl = document.getElementById('cert-date');
  const idEl = document.getElementById('cert-id-text');
  
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  if (idEl) idEl.textContent = certId;

  // 3. Populate Score & Friendship Rank Level
  const scoreDisplay = document.getElementById('cert-score-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = `${score}%`;
  }

  const rankEl = document.getElementById('cert-rank-display');
  let rankLabel = "Cozy Buddy";
  if (score === 100) rankLabel = "Soul-Level Best Friend";
  else if (score >= 90) rankLabel = "Legendary Best Friend";
  else if (score >= 75) rankLabel = "Certified Best Friend";
  else if (score >= 60) rankLabel = "Pretty Good Friend";
  else if (score >= 40) rankLabel = "Need More Hangouts";
  else rankLabel = "Let's spend more time together";
  
  if (rankEl) rankEl.textContent = rankLabel;

  // 4. Wire Controls
  setupCertificateControls(card, encodedResult, score);
}

// Bind certificate download and sharing functions
function setupCertificateControls(card, encodedResult, score) {
  const resultUrlInput = document.getElementById('cert-result-url');
  const copyBtn = document.getElementById('copy-result-url-btn');
  const dlPngBtn = document.getElementById('cert-download-png');
  const dlPdfBtn = document.getElementById('cert-download-pdf');
  const waBtn = document.getElementById('share-wa-btn');
  const tgBtn = document.getElementById('share-tg-btn');

  const resultUrl = `${window.location.origin}${window.location.pathname}#/result/${encodedResult}`;
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
  const friendNameInput = document.getElementById('f-friend-name');
  const recipientName = friendNameInput ? friendNameInput.value.trim() : (card.friendName || "Priya Sharma");

  if (dlPngBtn) {
    dlPngBtn.onclick = () => {
      playSFX('success');
      const target = document.getElementById('friend-certificate');
      html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Certificate-Friendship-${recipientName}.png`;
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
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        doc.save(`Certificate-Friendship-${recipientName}.pdf`);
      });
    };
  }

  // Social Sharing Links
  const shareText = `I completed the Friendship Challenge in ${card.creatorName}'s BestieVerse! Score: ${score}%! Check out my official certificate:`;
  if (waBtn) {
    waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + resultUrl)}`;
  }
  if (tgBtn) {
    tgBtn.href = `https://t.me/share/url?url=${encodeURIComponent(resultUrl)}&text=${encodeURIComponent(shareText)}`;
  }

  // Web Share API trigger
  const webShareBtn = document.getElementById('cert-web-share-btn');
  if (webShareBtn) {
    webShareBtn.onclick = () => {
      playSFX('click');
      if (navigator.share) {
        navigator.share({
          title: 'BestieVerse Friendship Certificate',
          text: shareText,
          url: resultUrl
        }).catch(err => console.log("Sharing failed:", err));
      } else {
        if (resultUrlInput) {
          resultUrlInput.select();
          navigator.clipboard.writeText(resultUrl);
          alert("Web Share is not supported on this browser. We've copied the Result Link to your clipboard! 📋");
        }
      }
    };
  }
}

// Render Result Viewer page for Creator (URL-decoded)
export function renderResultPage(encodedResult) {
  const result = decodeResult(encodedResult);
  if (!result) {
    alert("Could not load result. Link is invalid or corrupted.");
    window.location.hash = "#/";
    return;
  }

  const card = decodeCard(result.cardId);
  if (!card) return;

  const header = document.getElementById('res-header');
  const subtitle = document.getElementById('res-subtitle');
  const scoreEl = document.getElementById('res-score');
  const levelEl = document.getElementById('res-level');
  const correctEl = document.getElementById('res-correct');
  const timeEl = document.getElementById('res-time');
  const choicesEl = document.getElementById('res-choices');
  const dlBtn = document.getElementById('res-download-cert-btn');

  // Fill in content
  if (header) header.textContent = `${result.friendName}'s Quiz Results!`;
  if (subtitle) subtitle.textContent = `Awarded by ${card.creatorName}. Completed in ${result.timeTaken || 'some time'}.`;
  if (scoreEl) scoreEl.textContent = `${result.score}%`;
  
  // Friendship Levels
  let level = "Cozy Buddy";
  if (result.score === 100) level = "Soul-Level Best Friend 💖";
  else if (result.score >= 90) level = "Legendary Best Friend ⭐";
  else if (result.score >= 75) level = "Certified Best Friend 📜";
  else if (result.score >= 60) level = "Pretty Good Friend 👍";
  else if (result.score >= 40) level = "Need More Hangouts 😄";
  else level = "Let's spend more time together 😂";
  
  if (levelEl) levelEl.textContent = level;

  if (correctEl) correctEl.textContent = `${result.correctAnswers}/${result.totalQuestions}`;
  if (timeEl) timeEl.textContent = result.timeTaken || '--';

  // Render Detailed Review for Creator
  if (choicesEl) {
    if (result.friendAnswers && card.quiz) {
      choicesEl.innerHTML = card.quiz.map(([qId, creatorAnsIdx], idx) => {
        const qTemplate = questionLibrary.find(item => item.id === qId);
        if (!qTemplate) return '';
        
        const friendAnsIdx = result.friendAnswers[idx];
        const isCorrect = friendAnsIdx === creatorAnsIdx;
        
        return `
          <div style="border-bottom: 1px dashed rgba(0,0,0,0.1); padding: 0.5rem 0; text-align: left;">
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-muted);">Question ${idx + 1}: ${qTemplate.q}</div>
            <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.15rem; margin-top:0.25rem;">
              <span style="color:${isCorrect ? '#376F65' : '#D66D57'}; font-weight:700;">
                ${isCorrect ? '✅' : '❌'} Friend's Answer: ${qTemplate.options[friendAnsIdx] || 'None'}
              </span>
              ${!isCorrect ? `<span style="color:#376F65; font-weight:600;">✅ Correct Answer: ${qTemplate.options[creatorAnsIdx]}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } else {
      choicesEl.innerHTML = `<div style="color:var(--text-muted);">No choices recorded.</div>`;
    }
  }

  // Setup Certificate Download & Overlay Modal View
  if (dlBtn) {
    dlBtn.onclick = () => {
      playSFX('click');
      renderFriendCertificate(card, encodedResult, result.score, result.certId);
      
      const cert = document.getElementById('friend-certificate');
      const modal = document.getElementById('res-cert-modal');
      const modalContainer = document.getElementById('res-modal-cert-container');
      
      if (cert && modal && modalContainer) {
        modalContainer.appendChild(cert);
        modal.style.display = 'flex';
        modal.classList.add('active');
      }
    };
  }

  // Handle closing modal
  const closeModalBtn = document.getElementById('close-res-cert-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.onclick = () => {
      playSFX('click');
      const cert = document.getElementById('friend-certificate');
      const originalParent = document.querySelector('#certificate-view div[style*="max-width: 550px"]');
      const modal = document.getElementById('res-cert-modal');
      
      if (cert && originalParent) {
        const controlsDiv = originalParent.querySelector('div[style*="display: flex; flex-direction: column"]');
        originalParent.insertBefore(cert, controlsDiv);
      }
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
    };
  }

  // Bind modal downloads
  const modalPng = document.getElementById('res-modal-download-png');
  const originalPng = document.getElementById('cert-download-png');
  if (modalPng && originalPng) {
    modalPng.onclick = () => originalPng.click();
  }

  const modalPdf = document.getElementById('res-modal-download-pdf');
  const originalPdf = document.getElementById('cert-download-pdf');
  if (modalPdf && originalPdf) {
    modalPdf.onclick = () => originalPdf.click();
  }
}

// Render Certificate Verification Details (URL-decoded)
export function renderVerificationPage(encodedResult) {
  const result = decodeResult(encodedResult);
  if (!result) {
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

  if (vCertId) vCertId.textContent = result.certId;
  if (vFriendName) vFriendName.textContent = result.friendName;
  if (vCreatorName) vCreatorName.textContent = result.creatorName;
  if (vScore) vScore.textContent = `${result.score}%`;
  
  let level = "Cozy Buddy";
  if (result.score === 100) level = "Soul-Level Best Friend";
  else if (result.score >= 90) level = "Legendary Best Friend";
  else if (result.score >= 75) level = "Certified Best Friend";
  else if (result.score >= 60) level = "Pretty Good Friend";
  else if (result.score >= 40) level = "Need More Hangouts";
  else level = "Let's spend more time together";
  
  if (vLevel) vLevel.textContent = level;
  
  const options = { month: 'long', year: 'numeric', day: 'numeric' };
  if (vDate) vDate.textContent = new Date().toLocaleDateString('en-US', options);
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
