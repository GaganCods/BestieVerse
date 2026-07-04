// BestieVerse - Local Storage Cache Manager (Streaks, Achievements, Stickers, Time Capsules)

export function getStreak() {
  const count = localStorage.getItem('BV_STREAK_COUNT');
  return count ? parseInt(count) : 0;
}

export function updateDailyStreak() {
  const today = new Date().toLocaleDateString('en-US'); // MM/DD/YYYY format
  const lastVisit = localStorage.getItem('BV_LAST_VISIT');
  let streak = getStreak();

  if (!lastVisit) {
    // First time visiting
    streak = 1;
    localStorage.setItem('BV_LAST_VISIT', today);
    localStorage.setItem('BV_STREAK_COUNT', '1');
    unlockAchievement('first-visit');
    return { newVisit: true, streak };
  }

  if (lastVisit === today) {
    // Visited already today
    return { newVisit: false, streak };
  }

  // Calculate day difference
  const dateToday = new Date(today);
  const dateLast = new Date(lastVisit);
  const diffTime = Math.abs(dateToday - dateLast);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Visited yesterday, increment streak
    streak += 1;
  } else {
    // Streak broken, reset
    streak = 1;
  }

  localStorage.setItem('BV_LAST_VISIT', today);
  localStorage.setItem('BV_STREAK_COUNT', streak.toString());
  
  // Award badges based on streak
  if (streak >= 3) unlockAchievement('streak-3');
  if (streak >= 7) unlockAchievement('streak-7');

  return { newVisit: true, streak };
}

// Badge Achievements
const badges = {
  'first-visit': { name: "First Visit 🏠", desc: "Entered the BestieVerse for the first time!" },
  'quiz-master': { name: "Quiz Master 🧠", desc: "Completed the friendship trivia quiz!" },
  'game-champion': { name: "Game Champion 🏆", desc: "Won a game in the Arcade!" },
  'meme-lover': { name: "Meme Lover 😂", desc: "Reacted to a meme in the Meme Corner!" },
  'puzzle-solver': { name: "Puzzle Solver 🧩", desc: "Solved a puzzle in the Puzzle Zone!" },
  'explorer': { name: "Explorer 🧭", desc: "Visited all main categories in the BestieVerse!" },
  'challenge-accepted': { name: "Challenge Accepted 💪", desc: "Accepted a friendship challenge!" },
  'streak-3': { name: "Streak Enthusiast 🔥", desc: "Visited BestieVerse 3 days in a row!" },
  'streak-7': { name: "Loyal Bestie 👑", desc: "Visited BestieVerse 7 days in a row!" }
};

export function getUnlockedAchievements() {
  const saved = localStorage.getItem('BV_ACHIEVEMENTS');
  return saved ? JSON.parse(saved) : [];
}

export function unlockAchievement(id) {
  if (!badges[id]) return false;
  
  const unlocked = getUnlockedAchievements();
  if (unlocked.includes(id)) return false;

  unlocked.push(id);
  localStorage.setItem('BV_ACHIEVEMENTS', JSON.stringify(unlocked));
  
  // Award a sticker automatically on achievement unlock
  const stickerMap = {
    'first-visit': '🌸',
    'quiz-master': '📚',
    'game-champion': '🎮',
    'meme-lover': '🎈',
    'puzzle-solver': '⭐',
    'explorer': '🍕',
    'challenge-accepted': '🎵'
  };
  if (stickerMap[id]) {
    collectSticker(stickerMap[id]);
  }

  return true;
}

export function getBadgesList() {
  return badges;
}

// Sticker System
export function getCollectedStickers() {
  const saved = localStorage.getItem('BV_STICKERS');
  return saved ? JSON.parse(saved) : [];
}

export function collectSticker(sticker) {
  const stickers = getCollectedStickers();
  if (stickers.includes(sticker)) return false;

  stickers.push(sticker);
  localStorage.setItem('BV_STICKERS', JSON.stringify(stickers));
  return true;
}

// Time Capsule
export function saveTimeCapsule(text, durationSec) {
  const unlockTime = Date.now() + durationSec * 1000;
  localStorage.setItem('BV_CAPSULE_TEXT', text);
  localStorage.setItem('BV_CAPSULE_UNLOCK', unlockTime.toString());
}

export function getTimeCapsule() {
  const text = localStorage.getItem('BV_CAPSULE_TEXT');
  const unlock = localStorage.getItem('BV_CAPSULE_UNLOCK');
  return text && unlock ? { text, unlockTime: parseInt(unlock) } : null;
}

export function resetTimeCapsule() {
  localStorage.removeItem('BV_CAPSULE_TEXT');
  localStorage.removeItem('BV_CAPSULE_UNLOCK');
}
