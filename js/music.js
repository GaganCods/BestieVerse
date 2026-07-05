// BestieVerse - Premium YouTube Soundtrack Playlist Player

let ytPlayer = null;
let isPlayerReady = false;
let progressInterval = null;

// Playlist State
let playlist = [];
let activePlaylistIdx = 0; // Song currently loaded/playing
let carouselIdx = 0;      // Song currently showing in slide deck

// Extract Video ID from various YouTube link formats
export function extractYouTubeId(url) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
}

// Initialize soundtrack player configuration
export function initSoundtrackPlayer(card) {
  playlist = card.soundtracks || [];
  
  if (playlist.length === 0) {
    // Hide soundtrack nodes if not configured
    const mini = document.getElementById('music-mini-player');
    if (mini) mini.style.display = 'none';
    const full = document.getElementById('music-full-player');
    if (full) full.style.display = 'none';
    const intro = document.getElementById('music-intro-overlay');
    if (intro) intro.style.display = 'none';
    
    // Hide the playlist nav links
    document.querySelectorAll('[data-target="music-view"]').forEach(el => {
      el.style.display = 'none';
    });
    return;
  }

  // Show navigation links if soundtrack exists
  document.querySelectorAll('[data-target="music-view"]').forEach(el => {
    el.style.display = 'flex';
  });

  isPlayerReady = false;
  ytPlayer = null;
  activePlaylistIdx = 0;
  carouselIdx = 0;

  // 1. Build and Render Slide Cards inside Carousel
  renderCarouselSlides();

  // 2. Set Intro Prompt details matching Song 1
  const firstSong = playlist[0];
  const firstVideoId = extractYouTubeId(firstSong.youtubeUrl);
  const firstThumb = `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`;

  const imgIntro = document.getElementById('music-intro-cover');
  if (imgIntro) imgIntro.src = firstThumb;

  const tIntro = document.getElementById('music-intro-song-name');
  if (tIntro) tIntro.textContent = "Song Playlist Picked For You";

  const aIntro = document.getElementById('music-intro-artist');
  if (aIntro) aIntro.textContent = `${playlist.length} special songs chosen by ${card.creatorName || 'your bestie'}`;

  const introText = document.getElementById('music-intro-text');
  if (introText) {
    introText.textContent = `${card.creatorName || 'Your bestie'} curated a special playlist of ${playlist.length} song(s) for you to listen to during this experience!`;
  }

  // Display initial soundtrack intro
  const introOverlay = document.getElementById('music-intro-overlay');
  if (introOverlay) introOverlay.style.display = 'flex';

  // 3. Instantiate the YouTube player inside the modal
  const setupPlayer = () => {
    try {
      const container = document.getElementById('yt-actual-iframe-container');
      if (container) container.innerHTML = '<div id="yt-player-node"></div>';

      ytPlayer = new YT.Player('yt-player-node', {
        height: '100%',
        width: '100%',
        videoId: firstVideoId,
        playerVars: {
          'playsinline': 1,
          'controls': 1,
          'rel': 0,
          'modestbranding': 1
        },
        events: {
          'onReady': () => {
            isPlayerReady = true;
          },
          'onStateChange': onPlayerStateChange
        }
      });
    } catch (e) {
      console.error("Error setting up YouTube player:", e);
    }
  };

  // Load YouTube IFrame API script tag dynamically
  if (window.YT && window.YT.Player) {
    setupPlayer();
  } else {
    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      setupPlayer();
    };
  }

  // 4. Bind Carousel navigation actions
  const prevBtn = document.getElementById('music-prev-btn');
  if (prevBtn) {
    prevBtn.onclick = () => navigateCarousel(-1);
  }

  const nextBtn = document.getElementById('music-next-btn');
  if (nextBtn) {
    nextBtn.onclick = () => navigateCarousel(1);
  }

  // Swipe support for Mobile
  const carouselContainer = document.getElementById('music-cards-carousel-container');
  if (carouselContainer) {
    let startX = 0;
    carouselContainer.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].screenX;
      if (endX < startX - 60) navigateCarousel(1);  // swipe left
      if (endX > startX + 60) navigateCarousel(-1); // swipe right
    }, { passive: true });
  }

  // Keyboard navigation support
  window.onkeydown = (e) => {
    const musicView = document.getElementById('music-view');
    if (musicView && musicView.style.display !== 'none') {
      if (e.key === 'ArrowLeft') navigateCarousel(-1);
      if (e.key === 'ArrowRight') navigateCarousel(1);
    }
  };

  // 5. Bind player buttons
  const playIntroBtn = document.getElementById('music-intro-play-btn');
  if (playIntroBtn) {
    playIntroBtn.onclick = () => {
      if (introOverlay) introOverlay.style.display = 'none';
      const mini = document.getElementById('music-mini-player');
      if (mini) mini.style.display = 'flex';
      
      playSongIndex(0);
    };
  }

  const skipIntroBtn = document.getElementById('music-intro-skip-btn');
  if (skipIntroBtn) {
    skipIntroBtn.onclick = () => {
      if (introOverlay) introOverlay.style.display = 'none';
      const mini = document.getElementById('music-mini-player');
      if (mini) mini.style.display = 'flex';
      // Load first song metadata in paused state
      loadSongMetadataOnly(0);
    };
  }

  const miniPlayer = document.getElementById('music-mini-player');
  if (miniPlayer) {
    miniPlayer.onclick = (e) => {
      if (e.target.id === 'mini-play-pause-btn') return;
      const full = document.getElementById('music-full-player');
      if (full) full.style.display = 'flex';
    };
  }

  const closeFullBtn = document.getElementById('close-full-player-btn');
  if (closeFullBtn) {
    closeFullBtn.onclick = () => {
      const full = document.getElementById('music-full-player');
      if (full) full.style.display = 'none';
    };
  }

  const miniPlayBtn = document.getElementById('mini-play-pause-btn');
  if (miniPlayBtn) {
    miniPlayBtn.onclick = (e) => {
      e.stopPropagation();
      togglePlay();
    };
  }

  const fullPlayBtn = document.getElementById('full-play-pause-btn');
  if (fullPlayBtn) {
    fullPlayBtn.onclick = togglePlay;
  }

  const progressSlider = document.getElementById('full-player-progress');
  if (progressSlider) {
    progressSlider.oninput = (e) => {
      if (!ytPlayer || !isPlayerReady || !ytPlayer.getDuration) return;
      const duration = ytPlayer.getDuration();
      const seekVal = (e.target.value / 100) * duration;
      ytPlayer.seekTo(seekVal, true);
    };
  }

  // Scroll listener: show/hide mini player when scrolling away from Playlist cards
  window.addEventListener('scroll', () => {
    const musicView = document.getElementById('music-view');
    const mini = document.getElementById('music-mini-player');
    if (!mini || playlist.length === 0 || !ytPlayer || !isPlayerReady) return;

    if (musicView && musicView.style.display !== 'none') {
      if (window.scrollY > 150) {
        mini.style.display = 'flex';
      } else {
        mini.style.display = 'none';
      }
    }
  });
}

// Render dynamic slide cards inside carousel view
function renderCarouselSlides() {
  const container = document.getElementById('music-cards-carousel-container');
  if (!container) return;
  
  container.innerHTML = '';

  playlist.forEach((song, idx) => {
    const videoId = extractYouTubeId(song.youtubeUrl);
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const message = song.message || '';

    const slide = document.createElement('div');
    slide.className = `music-slide-card glass-card slide-card-${idx}`;
    slide.style.cssText = 'display: none; flex-direction: column; gap: 1.2rem; align-items: center; padding: 1.8rem; text-align: center; border-radius: 28px; width: 100%; max-width: 420px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; z-index: 2;';
    
    slide.innerHTML = `
      <!-- Album Cover (embossed circular outline) -->
      <div style="position: relative; width: 200px; height: 200px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); box-shadow: var(--shadow); margin: 0.2rem auto;">
        <img src="${thumbUrl}" alt="Song cover" class="rotating-album rotating-art-${idx}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 44px; height: 44px; background: var(--background); border-radius: 50%; border: 2.5px solid var(--primary);"></div>
      </div>

      <div>
        <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--accent); background: rgba(255,155,133,0.12); padding: 0.25rem 0.7rem; border-radius: 30px; display: inline-block; letter-spacing: 0.5px;">Song ${idx + 1}</div>
      </div>

      <!-- Note area -->
      ${message ? `
      <div style="width: 100%; border-top: 1px dashed var(--lavender); padding-top: 0.8rem; margin: 0.2rem 0;">
        <span style="font-size: 1.2rem; display: block; margin-bottom: 0.25rem;">💬</span>
        <p style="font-size: 0.85rem; line-height: 1.45; font-style: italic; color: var(--text); margin: 0; max-height: 60px; overflow-y: auto; padding: 0 0.5rem;">"${message}"</p>
      </div>
      ` : ''}

      <!-- Play song button -->
      <button class="btn-accent play-slide-song-btn" data-video-id="${videoId}" data-song-idx="${idx}" style="width: 80%; justify-content: center; gap: 0.5rem; font-size: 0.95rem; border-radius: 30px; padding: 0.65rem; cursor: pointer;">
        ▶ Play Song
      </button>
    `;

    // Click handler to play song from slide deck
    slide.querySelector('.play-slide-song-btn').onclick = () => {
      playSongIndex(idx);
    };

    container.appendChild(slide);
  });

  // Set active slide initial show
  showSlide(0);
}

// Show/Hide slide based on index
function showSlide(index) {
  const slides = document.querySelectorAll('.music-slide-card');
  if (slides.length === 0) return;

  // Clamp index range
  if (index >= slides.length) carouselIdx = 0;
  else if (index < 0) carouselIdx = slides.length - 1;
  else carouselIdx = index;

  slides.forEach((slide, idx) => {
    slide.style.display = (idx === carouselIdx) ? 'flex' : 'none';
  });

  const counter = document.getElementById('music-carousel-counter');
  if (counter) {
    counter.textContent = `Song ${carouselIdx + 1} / ${playlist.length}`;
  }
}

// Slide navigation helper
function navigateCarousel(direction) {
  showSlide(carouselIdx + direction);
}

// Play song matching index
function playSongIndex(idx) {
  if (idx < 0 || idx >= playlist.length) return;
  activePlaylistIdx = idx;

  const song = playlist[idx];
  const videoId = extractYouTubeId(song.youtubeUrl);
  if (!videoId) return;

  // Load and play video ID
  if (isPlayerReady && ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(videoId);
  } else {
    setTimeout(() => {
      if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(videoId);
    }, 1000);
  }

  updatePlayerMetadataUI(idx);
}

// Pre-load visual metadata only (when skipping intro overlay initially)
function loadSongMetadataOnly(idx) {
  if (idx < 0 || idx >= playlist.length) return;
  activePlaylistIdx = idx;
  updatePlayerMetadataUI(idx);
}

// Populate metadata covers, adaptive blurry backdrop, and personal note overlays
function updatePlayerMetadataUI(idx) {
  const song = playlist[idx];
  const videoId = extractYouTubeId(song.youtubeUrl);
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const message = song.message || "No message left for this song.";

  // Update image covers
  const imgMini = document.getElementById('mini-player-cover');
  const imgFull = document.getElementById('full-player-cover');
  if (imgMini) imgMini.src = thumbUrl;
  if (imgFull) imgFull.src = thumbUrl;

  // Update playing labels
  const tMini = document.getElementById('mini-player-title');
  const tFull = document.getElementById('full-player-title');
  if (tMini) tMini.textContent = `Song ${idx + 1}`;
  if (tFull) tFull.textContent = `Song ${idx + 1}`;

  const aMini = document.getElementById('mini-player-artist');
  const aFull = document.getElementById('full-player-artist');
  if (aMini) aMini.textContent = "Loading Track...";
  if (aFull) aFull.textContent = "Loading Track...";

  // Update personal note
  const noteFull = document.getElementById('full-player-note');
  if (noteFull) noteFull.textContent = `"${message}"`;

  // Set premium adaptive blur background graphic
  const fullPlayer = document.getElementById('music-full-player');
  if (fullPlayer) {
    let bgBackdrop = document.getElementById('music-player-blurred-bg');
    if (!bgBackdrop) {
      bgBackdrop = document.createElement('div');
      bgBackdrop.id = 'music-player-blurred-bg';
      bgBackdrop.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background-size:cover; background-position:center; filter:blur(40px) brightness(0.75); opacity:0.25; pointer-events:none; z-index:-1; border-radius:28px; transition: background-image 0.5s ease;';
      const content = fullPlayer.querySelector('.modal-content');
      if (content) {
        content.style.position = 'relative';
        content.style.overflow = 'hidden';
        content.appendChild(bgBackdrop);
      }
    }
    bgBackdrop.style.backgroundImage = `url(${thumbUrl})`;
  }
}

// Toggle Play / Pause states
function togglePlay() {
  if (!ytPlayer || !isPlayerReady || !ytPlayer.getPlayerState) return;
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

// Stop and reset player elements on exit
export function stopSoundtrackPlayer() {
  clearInterval(progressInterval);
  try {
    if (ytPlayer && isPlayerReady && ytPlayer.stopVideo) {
      ytPlayer.stopVideo();
    }
  } catch (err) {}
  
  const mini = document.getElementById('music-mini-player');
  if (mini) mini.style.display = 'none';
  const full = document.getElementById('music-full-player');
  if (full) full.style.display = 'none';
  const intro = document.getElementById('music-intro-overlay');
  if (intro) intro.style.display = 'none';
}

// Sync mini-player display state with current page view
export function handleMusicViewChange(viewId) {
  const mini = document.getElementById('music-mini-player');
  if (!mini || playlist.length === 0) return;

  // If a song is actively loaded/playing, toggle mini-player display
  const isSongActive = (ytPlayer && isPlayerReady);
  if (isSongActive) {
    if (viewId === 'music-view') {
      mini.style.display = 'none';
    } else {
      mini.style.display = 'flex';
    }
  }
}

// Helpers
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Timeline progress tracking loop
function startProgressTracking() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (!ytPlayer || !isPlayerReady || !ytPlayer.getCurrentTime) return;
    try {
      const elapsed = ytPlayer.getCurrentTime();
      const duration = ytPlayer.getDuration();
      
      if (duration > 0) {
        const pct = (elapsed / duration) * 100;
        const progress = document.getElementById('full-player-progress');
        const cTime = document.getElementById('full-player-current-time');
        const tTime = document.getElementById('full-player-total-time');

        if (progress) progress.value = pct;
        if (cTime) cTime.textContent = formatTime(elapsed);
        if (tTime) tTime.textContent = formatTime(duration);
      }
    } catch(err) {}
  }, 500);
}

// Synchronize all play button contents, spinning covers, and visual wave visualizers
function onPlayerStateChange(event) {
  const miniBtn = document.getElementById('mini-play-pause-btn');
  const fullBtn = document.getElementById('full-play-pause-btn');
  
  const rotators = document.querySelectorAll('.rotating-album');
  const visualizers = document.querySelectorAll('.visualizer-bar');

  if (event.data === YT.PlayerState.PLAYING) {
    if (miniBtn) miniBtn.textContent = '⏸';
    if (fullBtn) fullBtn.textContent = '⏸';
    
    // Play rotators and waveforms matching active song index
    rotators.forEach(el => el.classList.remove('playing'));
    visualizers.forEach(el => el.classList.remove('playing'));

    // Spin player circular thumb and also carousel slides matching active song index
    const activeArtEl = document.querySelector(`.rotating-art-${activePlaylistIdx}`);
    if (activeArtEl) activeArtEl.classList.add('playing');
    
    const playerMiniCover = document.getElementById('mini-player-cover');
    const playerFullCover = document.getElementById('full-player-cover');
    if (playerMiniCover) playerMiniCover.classList.add('playing');
    if (playerFullCover) playerFullCover.classList.add('playing');
    
    visualizers.forEach(el => el.classList.add('playing'));
    
    // Resolve Official YouTube Song Metadata (TOS compliant)
    try {
      const videoData = ytPlayer.getVideoData();
      if (videoData && videoData.title) {
        const fullTitle = videoData.title;
        let songName = fullTitle;
        let artistName = videoData.author || "YouTube Artist";
        if (fullTitle.includes('-')) {
          const parts = fullTitle.split('-');
          artistName = parts[0].trim();
          songName = parts[parts.length - 1].trim();
        }
        
        const aMini = document.getElementById('mini-player-artist');
        const aFull = document.getElementById('full-player-artist');
        const tMini = document.getElementById('mini-player-title');
        const tFull = document.getElementById('full-player-title');

        if (tMini) tMini.textContent = songName;
        if (tFull) tFull.textContent = songName;
        if (aMini) aMini.textContent = artistName;
        if (aFull) aFull.textContent = artistName;
      }
    } catch (e) {
      console.warn("Unable to read YouTube VideoData:", e);
    }

    startProgressTracking();
  } else {
    if (miniBtn) miniBtn.textContent = '▶';
    if (fullBtn) fullBtn.textContent = '▶';
    
    rotators.forEach(el => el.classList.remove('playing'));
    visualizers.forEach(el => el.classList.remove('playing'));
    
    clearInterval(progressInterval);
  }
}
