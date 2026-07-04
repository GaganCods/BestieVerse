// BestieVerse - Database Integration Module (Firebase Firestore + LocalStorage Fallback)

// To enable Firebase, fill in your project credentials below.
// If left blank, the app runs completely locally in Local Storage Mode.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let db = null;
let useFirebase = false;

// Initialize Firebase dynamically if credentials are provided
if (firebaseConfig.projectId && firebaseConfig.apiKey) {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useFirebase = true;
    console.log("BestieVerse: Firebase Firestore initialized! 🚀");
  } catch (err) {
    console.warn("BestieVerse: Firebase loading failed, falling back to Local Storage:", err);
  }
} else {
  console.log("BestieVerse: Running in Local Storage Mode (Offline-friendly). 📦");
}

// Generate a random 8-character ID for cards and results
export function generateUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Save Card Configuration
export async function saveCard(cardId, cardData) {
  cardData.createdAt = Date.now();
  cardData.id = cardId;

  if (useFirebase && db) {
    try {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await setDoc(doc(db, "bestie_cards", cardId), cardData);
      console.log(`Saved card ${cardId} to Firebase.`);
    } catch (e) {
      console.error("Firebase saveCard error, saving to local storage fallback:", e);
      saveCardToLocalStorage(cardId, cardData);
    }
  } else {
    saveCardToLocalStorage(cardId, cardData);
  }

  // Always save to local history so creator can manage their created pages
  saveCreatorCardHistory(cardId, cardData.friendName, cardData.theme);
}

// Get Card Configuration
export async function getCard(cardId) {
  if (useFirebase && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docSnap = await getDoc(doc(db, "bestie_cards", cardId));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.error("Firebase getDoc error, checking local storage:", e);
    }
  }
  return getCardFromLocalStorage(cardId);
}

// Save Quiz Results
export async function saveResult(resultId, resultData) {
  resultData.createdAt = Date.now();
  resultData.id = resultId;

  if (useFirebase && db) {
    try {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await setDoc(doc(db, "bestie_results", resultId), resultData);
      console.log(`Saved result ${resultId} to Firebase.`);
    } catch (e) {
      console.error("Firebase saveResult error, saving to local storage fallback:", e);
      saveResultToLocalStorage(resultId, resultData);
    }
  } else {
    saveResultToLocalStorage(resultId, resultData);
  }
}

// Get Quiz Results
export async function getResult(resultId) {
  if (useFirebase && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docSnap = await getDoc(doc(db, "bestie_results", resultId));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.error("Firebase getResult error, checking local storage:", e);
    }
  }
  return getResultFromLocalStorage(resultId);
}

// --- LOCAL STORAGE HELPERS (FALLBACKS) ---

function saveCardToLocalStorage(cardId, cardData) {
  const cards = JSON.parse(localStorage.getItem('BV_LOCAL_CARDS') || '{}');
  cards[cardId] = cardData;
  localStorage.setItem('BV_LOCAL_CARDS', JSON.stringify(cards));
}

function getCardFromLocalStorage(cardId) {
  const cards = JSON.parse(localStorage.getItem('BV_LOCAL_CARDS') || '{}');
  return cards[cardId] || null;
}

function saveResultToLocalStorage(resultId, resultData) {
  const results = JSON.parse(localStorage.getItem('BV_LOCAL_RESULTS') || '{}');
  results[resultId] = resultData;
  localStorage.setItem('BV_LOCAL_RESULTS', JSON.stringify(results));
}

function getResultFromLocalStorage(resultId) {
  const results = JSON.parse(localStorage.getItem('BV_LOCAL_RESULTS') || '{}');
  return results[resultId] || null;
}

// --- CREATOR MANAGEMENT HISTORY ---

export function getCreatorCards() {
  return JSON.parse(localStorage.getItem('BV_CREATOR_HISTORY') || '[]');
}

function saveCreatorCardHistory(cardId, friendName, theme) {
  const history = getCreatorCards();
  // Avoid duplicate entries
  if (!history.some(item => item.id === cardId)) {
    history.push({
      id: cardId,
      friendName,
      theme,
      createdAt: Date.now()
    });
    localStorage.setItem('BV_CREATOR_HISTORY', JSON.stringify(history));
  }
}

export async function deleteCard(cardId) {
  // Remove from history
  let history = getCreatorCards();
  history = history.filter(item => item.id !== cardId);
  localStorage.setItem('BV_CREATOR_HISTORY', JSON.stringify(history));

  // Remove card config
  if (useFirebase && db) {
    try {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await deleteDoc(doc(db, "bestie_cards", cardId));
    } catch (e) {
      console.error("Firebase delete error:", e);
    }
  }

  // Remove from local cards
  const cards = JSON.parse(localStorage.getItem('BV_LOCAL_CARDS') || '{}');
  if (cards[cardId]) {
    delete cards[cardId];
    localStorage.setItem('BV_LOCAL_CARDS', JSON.stringify(cards));
  }
}
