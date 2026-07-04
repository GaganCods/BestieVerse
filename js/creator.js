// BestieVerse - Creator form handler, Signature pad, and Creator Dashboard renderer

import { saveCard, generateUniqueId, getCreatorCards, deleteCard } from './database.js';
import { playSFX } from './utils.js';

let signaturePad = null;
let sigCtx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Initialize Creator Form Page
export function initCreatorForm() {
  const form = document.getElementById('creator-form');
  if (!form) return;

  // Initialize Signature Pad
  initSignaturePad();

  // Reset form inputs
  form.reset();
  if (sigCtx && signaturePad) {
    sigCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);
  }

  // Handle submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    playSFX('success');

    // Gather inputs
    const creatorName = document.getElementById('c-creator-name').value.trim();
    const friendName = document.getElementById('c-friend-name').value.trim();
    const nickname = document.getElementById('c-friend-nickname').value.trim();
    const friendshipSince = document.getElementById('c-friends-since').value.trim();
    const relationship = document.getElementById('c-relationship').value;
    const favoriteColor = document.getElementById('c-fav-color').value.trim();
    const favoriteFood = document.getElementById('c-fav-food').value.trim();
    const favoriteEmoji = document.getElementById('c-fav-emoji').value.trim();
    const message = document.getElementById('c-message').value.trim();
    const theme = document.getElementById('c-theme').value;
    const certStyle = document.getElementById('c-cert-style').value;
    const questionsCount = parseInt(document.getElementById('c-quiz-count').value);
    const passcode = document.getElementById('c-passcode').value.trim();

    // Check games checked
    const checkedGames = Array.from(document.querySelectorAll('input[name="c-games"]:checked')).map(el => el.value);
    if (checkedGames.length < 3) {
      alert("Please select at least 3 games for your bestie to play! 🕹️");
      return;
    }

    // Check challenges checked
    const checkedChallenges = Array.from(document.querySelectorAll('input[name="c-challenges"]:checked')).map(el => parseInt(el.value));

    // Handle Signature: if blank, draw typed name in cursive font
    if (isCanvasBlank(signaturePad)) {
      drawTextSignature(creatorName);
    }
    const signatureDataUrl = signaturePad.toDataURL();

    // Show loading state
    const submitBtn = document.getElementById('generate-site-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Generating Magic... ✨";

    // Generate unique ID and save
    const cardId = generateUniqueId();
    const cardData = {
      creatorName,
      friendName,
      nickname,
      friendshipSince,
      relationship,
      favoriteColor,
      favoriteFood,
      favoriteEmoji,
      message,
      theme,
      certStyle,
      games: checkedGames,
      challenges: checkedChallenges,
      questionsCount,
      passcode: passcode || null,
      signature: signatureDataUrl
    };

    try {
      await saveCard(cardId, cardData);
      // Navigate to Creator Dashboard
      window.location.hash = `#/dashboard/${cardId}`;
    } catch (err) {
      console.error("Save card failed:", err);
      alert("Something went wrong saving the card. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  };
}

// Draw Signature Canvas Logic
function initSignaturePad() {
  signaturePad = document.getElementById('signature-pad');
  if (!signaturePad) return;

  sigCtx = signaturePad.getContext('2d');
  
  // Set canvas stroke properties
  sigCtx.strokeStyle = '#3D3A45'; // Dark charcoal ink
  sigCtx.lineWidth = 3.5;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';

  // Responsive canvas size adjustment
  resizeSigCanvas();
  window.addEventListener('resize', resizeSigCanvas);

  // Drawing event listeners (Mouse)
  signaturePad.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = getCoords(e);
  });

  signaturePad.addEventListener('mousemove', draw);
  signaturePad.addEventListener('mouseup', () => isDrawing = false);
  signaturePad.addEventListener('mouseout', () => isDrawing = false);

  // Drawing event listeners (Touch)
  signaturePad.addEventListener('touchstart', (e) => {
    isDrawing = true;
    const touch = e.touches[0];
    [lastX, lastY] = getCoords(touch);
    e.preventDefault();
  }, { passive: false });

  signaturePad.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    const touch = e.touches[0];
    draw(touch);
    e.preventDefault();
  }, { passive: false });

  signaturePad.addEventListener('touchend', () => isDrawing = false);

  // Clear button
  const clearBtn = document.getElementById('clear-sig-btn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      playSFX('pop');
      sigCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);
    };
  }
}

function resizeSigCanvas() {
  if (!signaturePad) return;
  const rect = signaturePad.getBoundingClientRect();
  // Set coordinate resolution relative to visual layout
  signaturePad.width = rect.width;
  signaturePad.height = 130;
  
  // Re-apply styles after size reset
  if (sigCtx) {
    sigCtx.strokeStyle = '#3D3A45';
    sigCtx.lineWidth = 3.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
  }
}

function getCoords(e) {
  const rect = signaturePad.getBoundingClientRect();
  // Account for scale/transforms
  const x = (e.clientX - rect.left) * (signaturePad.width / rect.width);
  const y = (e.clientY - rect.top) * (signaturePad.height / rect.height);
  return [x, y];
}

function draw(e) {
  if (!isDrawing) return;
  const [x, y] = getCoords(e);

  sigCtx.beginPath();
  sigCtx.moveTo(lastX, lastY);
  sigCtx.lineTo(x, y);
  sigCtx.stroke();
  
  [lastX, lastY] = [x, y];
}

function isCanvasBlank(canvas) {
  if (!canvas) return true;
  const buffer = document.createElement('canvas');
  buffer.width = canvas.width;
  buffer.height = canvas.height;
  return canvas.toDataURL() === buffer.toDataURL();
}

function drawTextSignature(name) {
  if (!sigCtx || !signaturePad) return;
  sigCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);
  
  // Render name in dynamic handwriting font style
  sigCtx.font = "italic 44px 'Dancing Script', 'Brush Script MT', cursive";
  sigCtx.fillStyle = "#8369A8"; // Lavender ink
  sigCtx.textAlign = "center";
  sigCtx.textBaseline = "middle";
  
  // Add simple decorative stroke underlines
  sigCtx.fillText(name, signaturePad.width / 2, signaturePad.height / 2);
  
  sigCtx.beginPath();
  sigCtx.strokeStyle = "rgba(131, 105, 168, 0.4)";
  sigCtx.lineWidth = 2.5;
  sigCtx.moveTo(signaturePad.width / 2 - 100, signaturePad.height / 2 + 25);
  sigCtx.quadraticCurveTo(signaturePad.width / 2, signaturePad.height / 2 + 35, signaturePad.width / 2 + 120, signaturePad.height / 2 + 20);
  sigCtx.stroke();
}

// Creator Dashboard View Renderer
export function renderCreatorDashboard(cardId) {
  const friendUrlInput = document.getElementById('dash-friend-url');
  const qrImg = document.getElementById('dash-qr-img');
  const viewResultsBtn = document.getElementById('dash-view-results-btn');
  const deleteBtn = document.getElementById('dash-delete-btn');

  // Compute friend URL link
  const friendUrl = `${window.location.origin}${window.location.pathname}#/f/${cardId}`;
  if (friendUrlInput) friendUrlInput.value = friendUrl;

  // Render QR Code image using public server API
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(friendUrl)}`;
  }

  // Update view results link
  if (viewResultsBtn) {
    viewResultsBtn.href = `#/result/${cardId}`;
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
    deleteBtn.onclick = async () => {
      if (confirm("Are you sure you want to delete this BestieVerse card? This cannot be undone. 🗑️")) {
        playSFX('fail');
        await deleteCard(cardId);
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
    const friendUrl = `${window.location.origin}${window.location.pathname}#/f/${card.id}`;
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
    btn.onclick = async (e) => {
      e.preventDefault();
      const cardId = btn.getAttribute('data-id');
      if (confirm("Delete this page? 🗑️")) {
        playSFX('fail');
        await deleteCard(cardId);
        renderCreatorHistory();
      }
    };
  });
}
