// BestieVerse - URL-Encoded Database-less Layer (LZ-String Compression)

/* 
  Since this is a 100% frontend database-less application, all configurations 
  and results are compressed into the URL hash using LZ-String.
  
  We also maintain a local history log of created card links in localStorage 
  so that creators can manage their previously built pages.
*/

// Compress Card Configuration to URL string
export function encodeCard(cardData) {
  try {
    const jsonStr = JSON.stringify(cardData);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (e) {
    console.error("Failed to encode card configuration:", e);
    return "";
  }
}

// Decompress Card Configuration from URL string
export function decodeCard(encodedStr) {
  if (!encodedStr) return null;
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(encodedStr);
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (e) {
    console.error("Failed to decode card configuration:", e);
    return null;
  }
}

// Compress Quiz Results to URL string
export function encodeResult(resultData) {
  try {
    const jsonStr = JSON.stringify(resultData);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (e) {
    console.error("Failed to encode quiz results:", e);
    return "";
  }
}

// Decompress Quiz Results from URL string
export function decodeResult(encodedStr) {
  if (!encodedStr) return null;
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(encodedStr);
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (e) {
    console.error("Failed to decode quiz results:", e);
    return null;
  }
}

// --- CREATOR MANAGEMENT HISTORY (Stored locally for convenience) ---

export function getCreatorCards() {
  try {
    return JSON.parse(localStorage.getItem('BV_CREATOR_HISTORY') || '[]');
  } catch (e) {
    return [];
  }
}

export function saveCreatorCardHistory(encodedCardString, friendName, theme) {
  const history = getCreatorCards();
  // Check if we already have this card in history
  if (!history.some(item => item.id === encodedCardString)) {
    history.push({
      id: encodedCardString, // we use the encoded string as the unique id
      friendName,
      theme,
      createdAt: Date.now()
    });
    localStorage.setItem('BV_CREATOR_HISTORY', JSON.stringify(history));
  }
}

export function deleteCard(encodedCardString) {
  let history = getCreatorCards();
  history = history.filter(item => item.id !== encodedCardString);
  localStorage.setItem('BV_CREATOR_HISTORY', JSON.stringify(history));
}
