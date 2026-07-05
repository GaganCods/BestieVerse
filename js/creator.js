// BestieVerse - Creator form handler and Creator Dashboard renderer (URL-encoded)

import { encodeCard, decodeCard, getCreatorCards, deleteCard, saveCreatorCardHistory } from './database.js';
import { playSFX } from './utils.js';
import { questionLibrary } from './quiz-data.js';

// Initialize Creator Form Page
export function initCreatorForm() {
  const form = document.getElementById('creator-form');
  if (!form) return;

  // Setup question answering state
  let selectedQuestions = [];
  let creatorAnswers = {};

  // Manage Dynamic Soundtracks list
  const listContainer = document.getElementById('c-soundtracks-list');
  const addSongBtn = document.getElementById('c-add-song-btn');
  const counterEl = document.getElementById('c-soundtrack-counter');

  let songsList = [{ youtubeUrl: '', message: '' }]; // start with one card

  const updatePlaylistUI = () => {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    songsList.forEach((song, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card song-input-card';
      card.style.cssText = 'padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; border: 1px dashed var(--primary); position: relative;';
      card.innerHTML = `
        <button type="button" class="btn-remove-song" style="position: absolute; top: 8px; right: 8px; border: none; background: transparent; color: #D66D57; font-weight: bold; cursor: pointer; font-size: 1.1rem;">✕</button>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
          <div style="font-weight: 700; font-size: 0.82rem; color: var(--primary);">Song <span class="song-num-label">${idx + 1}</span></div>
          <div style="display: flex; gap: 0.4rem; margin-right: 2rem;">
            <button type="button" class="btn-move-up btn-secondary" style="padding: 0.15rem 0.45rem; font-size: 0.7rem; border-radius: 6px; cursor: pointer;">▲</button>
            <button type="button" class="btn-move-down btn-secondary" style="padding: 0.15rem 0.45rem; font-size: 0.7rem; border-radius: 6px; cursor: pointer;">▼</button>
          </div>
        </div>
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--text);">YouTube URL</label>
          <input type="url" class="form-input song-url-input" placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ" value="${song.youtubeUrl || ''}" required>
        </div>
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--text);">Personal Message (Max 150 chars)</label>
          <input type="text" class="form-input song-message-input" placeholder="e.g. I always think of us whenever I hear this! 💖" maxlength="150" value="${song.message || ''}">
        </div>
      `;

      // Bind Remove button
      card.querySelector('.btn-remove-song').onclick = () => {
        playSFX('click');
        saveCurrentInputs();
        songsList.splice(idx, 1);
        updatePlaylistUI();
      };

      // Bind Move Up button
      card.querySelector('.btn-move-up').onclick = () => {
        if (idx === 0) return;
        playSFX('click');
        saveCurrentInputs();
        const temp = songsList[idx];
        songsList[idx] = songsList[idx - 1];
        songsList[idx - 1] = temp;
        updatePlaylistUI();
      };

      // Bind Move Down button
      card.querySelector('.btn-move-down').onclick = () => {
        if (idx === songsList.length - 1) return;
        playSFX('click');
        saveCurrentInputs();
        const temp = songsList[idx];
        songsList[idx] = songsList[idx + 1];
        songsList[idx + 1] = temp;
        updatePlaylistUI();
      };

      listContainer.appendChild(card);
    });

    if (counterEl) counterEl.textContent = `${songsList.length} / 5 Songs`;
    if (addSongBtn) {
      addSongBtn.disabled = songsList.length >= 5;
    }
  };

  const saveCurrentInputs = () => {
    if (!listContainer) return;
    const cards = listContainer.querySelectorAll('.song-input-card');
    cards.forEach((card, idx) => {
      const urlInput = card.querySelector('.song-url-input');
      const msgInput = card.querySelector('.song-message-input');
      if (songsList[idx]) {
        songsList[idx].youtubeUrl = urlInput ? urlInput.value.trim() : '';
        songsList[idx].message = msgInput ? msgInput.value.trim() : '';
      }
    });
  };

  if (addSongBtn) {
    addSongBtn.onclick = () => {
      if (songsList.length >= 5) return;
      playSFX('click');
      saveCurrentInputs();
      songsList.push({ youtubeUrl: '', message: '' });
      updatePlaylistUI();
    };
  }

  // Draw soundtracks inputs
  updatePlaylistUI();

  // Handle Question Generation Button
  const genQuestionsBtn = document.getElementById('c-generate-questions-btn');
  const setupCard = document.getElementById('c-questions-setup-card');
  const questionsContainer = document.getElementById('creator-questions-container');
  const submitBtn = document.getElementById('generate-site-btn');

  if (genQuestionsBtn) {
    genQuestionsBtn.onclick = () => {
      playSFX('click');
      
      const selectedCategories = Array.from(document.querySelectorAll('input[name="c-categories"]:checked')).map(el => el.value);
      if (selectedCategories.length === 0) {
        alert("Please select at least one quiz category! 🧩");
        return;
      }

      const count = parseInt(document.getElementById('c-quiz-count').value);
      const pool = questionLibrary.filter(q => selectedCategories.includes(q.category));
      
      if (pool.length === 0) {
        alert("No questions found in the selected categories. Try checking more boxes!");
        return;
      }

      // Randomly select N questions
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
      creatorAnswers = {}; // reset answers

      // Render questions UI
      if (questionsContainer) {
        questionsContainer.innerHTML = selectedQuestions.map((q, idx) => `
          <div class="creator-question-card" data-qid="${q.id}" style="padding: 1.25rem; border: 1px solid var(--card-border); border-radius: 16px; display: flex; flex-direction: column; gap: 0.8rem; background: rgba(255,255,255,0.45); transition: var(--transition);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight: 700; font-size: 0.85rem; color: var(--primary);">Question ${idx + 1} of ${selectedQuestions.length}</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--lavender); padding: 2px 8px; border-radius: 8px; text-transform: uppercase;">${q.category}</span>
            </div>
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--text); margin: 0;">${q.q}</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem;" class="options-grid">
              ${q.options.map((opt, oIdx) => `
                <button type="button" class="btn-secondary creator-opt-btn" data-oidx="${oIdx}" style="font-size: 0.85rem; padding: 0.6rem 0.8rem; border-radius: 12px; text-align: center; width: 100%; transition: var(--transition);">
                  ${opt}
                </button>
              `).join('')}
            </div>
          </div>
        `).join('');

        // Bind clicks to options buttons
        questionsContainer.querySelectorAll('.creator-question-card').forEach(qCard => {
          const qId = parseInt(qCard.getAttribute('data-qid'));
          const buttons = qCard.querySelectorAll('.creator-opt-btn');
          
          buttons.forEach(btn => {
            btn.onclick = (e) => {
              playSFX('click');
              const oIdx = parseInt(btn.getAttribute('data-oidx'));
              
              // Clear previous selection
              buttons.forEach(b => {
                b.style.background = '';
                b.style.color = '';
                b.style.borderColor = '';
              });

              // Apply active style
              btn.style.background = 'var(--primary)';
              btn.style.color = 'white';
              btn.style.borderColor = 'var(--primary)';

              // Save answer
              creatorAnswers[qId] = oIdx;

              // Check if setup complete
              checkAllAnswered();
            };
          });
        });
      }

      const checkAllAnswered = () => {
        const answeredCount = Object.keys(creatorAnswers).length;
        if (answeredCount === selectedQuestions.length) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Generate BestieVerse Site ✨";
          submitBtn.style.animation = "pulse 1.2s infinite";
        } else {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `Answer All Questions to Generate (${answeredCount}/${selectedQuestions.length})`;
          submitBtn.style.animation = "";
        }
      };

      // Show setups segment and scroll smoothly
      if (setupCard) {
        setupCard.style.display = 'block';
        setTimeout(() => {
          setupCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }

      checkAllAnswered();
    };
  }

  // Handle form submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    playSFX('success');
    saveCurrentInputs();

    // Gather inputs
    const creatorName = document.getElementById('c-creator-name').value.trim();
    const nickname = document.getElementById('c-creator-nickname').value.trim();
    const signature = document.getElementById('c-signature-name').value.trim();
    const welcomeMessage = document.getElementById('c-welcome-message').value.trim();
    const theme = document.getElementById('c-theme').value;
    const passcode = document.getElementById('c-passcode').value.trim();

    // Check quiz answers
    if (selectedQuestions.length === 0 || Object.keys(creatorAnswers).length !== selectedQuestions.length) {
      alert("Please generate and answer all setup questions first! 🎯");
      return;
    }

    // Gather all songs and filter empty URLs
    const soundtracks = songsList.filter(s => s.youtubeUrl.length > 0).map(s => ({
      youtubeUrl: s.youtubeUrl,
      message: s.message || null
    }));

    if (soundtracks.length === 0) {
      alert("Please add at least 1 valid YouTube link for the soundtrack playlist! 🎵");
      return;
    }

    // Check games checked
    const checkedGames = Array.from(document.querySelectorAll('input[name="c-games"]:checked')).map(el => el.value);
    if (checkedGames.length < 3) {
      alert("Please select at least 3 games for your bestie to play! 🕹️");
      return;
    }

    // Check challenges checked
    const checkedChallenges = Array.from(document.querySelectorAll('input[name="c-challenges"]:checked')).map(el => parseInt(el.value));

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Packaging Magic... ✨";

    // Format quiz configuration: array of [qId, creatorAnswerIndex]
    const quizConfig = selectedQuestions.map(q => [q.id, creatorAnswers[q.id]]);

    // Create configuration JSON
    const cardData = {
      creatorName,
      nickname,
      signature,
      welcomeMessage,
      theme,
      games: checkedGames,
      challenges: checkedChallenges,
      passcode: passcode || null,
      soundtracks: soundtracks,
      quiz: quizConfig
    };

    try {
      // Compress and URL encode configuration
      const encodedCard = encodeCard(cardData);
      
      // Save link to browser history log
      saveCreatorCardHistory(encodedCard, creatorName, theme);
      
      // Redirect to Creator Dashboard
      window.location.hash = `#/dashboard/${encodedCard}`;
    } catch (err) {
      console.error("Save card failed:", err);
      alert("Something went wrong generating the card. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  };
}

// Creator Dashboard View Renderer
export function renderCreatorDashboard(encodedCard) {
  const friendUrlInput = document.getElementById('dash-friend-url');
  const qrImg = document.getElementById('dash-qr-img');
  const deleteBtn = document.getElementById('dash-delete-btn');

  // Compute share link URL
  const friendUrl = `${window.location.origin}${window.location.pathname}#/f/${encodedCard}`;
  if (friendUrlInput) friendUrlInput.value = friendUrl;

  // Render QR Code image using public server API
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(friendUrl)}`;
  }

  // Hide the results button on the dashboard as there is no backend database.
  // Instead, show a message explaining how the creator gets the results.
  const resultsBtn = document.getElementById('dash-view-results-btn');
  if (resultsBtn) {
    resultsBtn.style.display = 'none';
  }

  // Adjust dashboard UI helper texts for results sharing
  const dashboardShell = document.getElementById('dashboard-shell');
  let resultsNote = dashboardShell.querySelector('.results-share-note');
  if (!resultsNote) {
    resultsNote = document.createElement('div');
    resultsNote.className = 'results-share-note glass-card';
    resultsNote.style.marginTop = '1rem';
    resultsNote.style.padding = '1rem';
    resultsNote.style.borderLeft = '4px solid var(--accent)';
    resultsNote.style.fontSize = '0.85rem';
    resultsNote.style.textAlign = 'left';
    resultsNote.innerHTML = `
      <strong>🏆 Viewing Friend Results:</strong><br>
      Since BestieVerse is serverless, results are shared via links! When your friend completes the quiz, they will send you a <strong>Results Link</strong>. Simply open it to view their score and stats.
    `;
    
    // Insert before actions list
    const actionsHeader = dashboardShell.querySelector('h3');
    if (actionsHeader) {
      actionsHeader.parentNode.insertBefore(resultsNote, actionsHeader);
    }
  }

  // Copy share link action binding
  const copyBtn = document.getElementById('copy-friend-url-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      playSFX('click');
      if (friendUrlInput) {
        friendUrlInput.select();
        navigator.clipboard.writeText(friendUrl);
        copyBtn.textContent = "Copied! ✓";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
      }
    };
  }

  // Delete card action binding
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (confirm("Are you sure you want to delete this BestieVerse card link from your history? 🗑️")) {
        playSFX('fail');
        deleteCard(encodedCard);
        window.location.hash = "#/";
      }
    };
  }
}

// Render Creator Page History on Landing Screen
export function renderCreatorHistory() {
  const container = document.getElementById('landing-history-section');
  const listEl = document.getElementById('landing-history-list');
  if (!container || !listEl) return;

  const history = getCreatorCards();
  if (history.length === 0) {
    container.style.display = 'none';
    listEl.innerHTML = '';
    return;
  }

  // Show history segment
  container.style.display = 'block';
  listEl.innerHTML = history.map(card => {
    return `
      <div class="glass-card" style="padding: 1rem; border-left: 5px solid var(--primary); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div>
          <strong style="font-size: 1rem; color: var(--text);">${card.friendName}'s Card</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Created: ${new Date(card.createdAt).toLocaleDateString()} | Theme: <span style="text-transform: capitalize;">${card.theme}</span></div>
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <a href="#/f/${card.id}" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.78rem; border-radius: 8px;">Open 🚀</a>
          <a href="#/dashboard/${card.id}" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.78rem; border-radius: 8px;">Manage 🛠️</a>
          <button class="btn-secondary del-hist-btn" data-id="${card.id}" style="padding: 0.4rem 0.8rem; font-size: 0.78rem; border-radius: 8px; color: #D66D57; border-color: rgba(214,109,87,0.2);">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind deletion handlers for history list
  listEl.querySelectorAll('.del-hist-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const cardId = btn.getAttribute('data-id');
      if (confirm("Delete this page from history? 🗑️")) {
        playSFX('fail');
        deleteCard(cardId);
        renderCreatorHistory();
      }
    };
  });
}
