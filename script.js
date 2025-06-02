document.addEventListener('DOMContentLoaded', () => {
  const pond = document.getElementById('pond');
  const frog = document.getElementById('frog');
  const deathScreen = document.getElementById('death-screen');
  const restartBtn = document.getElementById('restart-btn');
  const scoreSpan = document.getElementById('score');
  const levelSpan = document.getElementById('level');
  const finalScore = document.getElementById('final-score');
  const levelScreen = document.getElementById('level-screen');
  const levelTitle = document.getElementById('level-title');
  const levelStartBtn = document.getElementById('level-start-btn');

  const baseFadeDuration = 5000;
  const fadeStep = 100;
  let minFade = 700;
  let gameOver = false;
  let paused = true;
  let lilypadIdCounter = 0;
  let currentFrogPadId = null;

  let score = 0;
  let level = 1;
  const MAX_LILYPADS = 5;
  let lilypadsPerLevel = 4;

  const fadingPads = new Set();
  const fadeTimeouts = {};

  const flowerTypes = [
    { name: 'pink',   petal: '#ffb6de', center: '#ff64a6', outline: 'flower-pink' },
    { name: 'white',  petal: '#fff',    center: '#f7e06c', outline: 'flower-white' },
    { name: 'blue',   petal: '#3d2b77', center: '#7f90e4', outline: 'flower-blue' },
    { name: 'purple', petal: '#ae7ee1', center: '#7c43bd', outline: 'flower-purple' },
    { name: 'yellow', petal: '#ffe36c', center: '#ffd600', outline: 'flower-yellow' }
  ];

  function resetGameStateForLevel() {
    clearLilypads();
    lilypadIdCounter = 0;
    fadingPads.clear();
    clearAllFadeTimeouts();
    for (let i = 0; i < lilypadsPerLevel; i++) createLilypad();
    setTimeout(() => {
      placeFrogOnFirstLilypad();
    }, 100);
  }

  function updateScoreAndLevel(newScore) {
    score = newScore;
    scoreSpan.textContent = score;
    const newLevel = Math.floor(score / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      levelSpan.textContent = level;
      lilypadsPerLevel = Math.min(MAX_LILYPADS, 4 + (level - 1));
      minFade = Math.max(350, 700 - 50 * (level - 1));
      showLevelScreen();
    }
  }

  function clearLilypads() {
    document.querySelectorAll('.lilypad').forEach(lp => lp.remove());
    fadingPads.clear();
    clearAllFadeTimeouts();
  }

  function getFadeDuration() {
    if (level <= 2) {
      return baseFadeDuration;
    } else {
      return Math.floor(3000 + Math.random() * 2000);
    }
  }

  function createLilypad() {
    if (document.querySelectorAll('.lilypad').length >= lilypadsPerLevel) return;

    const pad = document.createElement('div');
    pad.className = 'lilypad';
    pad.dataset.lilypadId = ++lilypadIdCounter;
    const maxX = pond.clientWidth - 80;
    const maxY = pond.clientHeight - 50;
    pad.style.left = Math.floor(Math.random() * maxX) + 'px';
    pad.style.top = Math.floor(Math.random() * maxY) + 'px';
    pond.appendChild(pad);

    const flower = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
    pad.appendChild(createFlowerSVG(flower));

    pad.addEventListener('click', () => {
      if (gameOver || paused) return;
      if (currentFrogPadId === pad.dataset.lilypadId) return;

      updateScoreAndLevel(score + 1);

      const x = pad.offsetLeft + (pad.offsetWidth - frog.offsetWidth) / 2;
      const y = pad.offsetTop + (pad.offsetHeight - frog.offsetHeight) / 2;
      frog.style.left = `${x}px`;
      frog.style.top = `${y}px`;
      frog.style.display = "block";
      currentFrogPadId = pad.dataset.lilypadId;

      if (!fadingPads.has(pad.dataset.lilypadId)) {
        fadingPads.add(pad.dataset.lilypadId);
        startFading(pad, getFadeDuration());
      }
    });

    return pad;
  }

  function createFlowerSVG({petal, center, outline}) {
    const container = document.createElement('div');
    container.className = `flower ${outline}`;
    container.innerHTML = `
      <svg width="36" height="36" viewBox="0 0 36 36">
        <g>
          <ellipse cx="18" cy="7"  rx="6" ry="10" fill="${petal}" opacity="0.96" />
          <ellipse cx="29" cy="13" rx="7" ry="9"  fill="${petal}" opacity="0.96" transform="rotate(25 29 13)"/>
          <ellipse cx="27" cy="26" rx="7" ry="9"  fill="${petal}" opacity="0.96" transform="rotate(65 27 26)"/>
          <ellipse cx="9"  cy="27" rx="7" ry="9"  fill="${petal}" opacity="0.96" transform="rotate(-25 9 27)"/>
          <ellipse cx="7"  cy="13" rx="7" ry="9"  fill="${petal}" opacity="0.96" transform="rotate(-65 7 13)"/>
          <circle cx="18" cy="18" r="5" fill="${center}"/>
        </g>
      </svg>
    `;
    return container;
  }

  function startFading(pad, fadeDuration) {
    let elapsed = 0;
    const padId = pad.dataset.lilypadId;
    function fadeStepFn() {
      if (gameOver || paused) return;
      elapsed += fadeStep;
      let opacity = 1 - elapsed / fadeDuration;
      pad.style.opacity = opacity;
      if (opacity <= 0) {
        pad.remove();
        fadingPads.delete(padId);
        delete fadeTimeouts[padId];
        if (currentFrogPadId === padId) {
          showDeathScreen();
        } else {
          setTimeout(() => {
            if (document.querySelectorAll('.lilypad').length < lilypadsPerLevel) {
              createLilypad();
            }
          }, 50);
        }
      } else {
        fadeTimeouts[padId] = setTimeout(fadeStepFn, fadeStep);
      }
    }
    fadeStepFn();
    pad.onclick = null;
  }

  function clearAllFadeTimeouts() {
    for (let key in fadeTimeouts) {
      clearTimeout(fadeTimeouts[key]);
      delete fadeTimeouts[key];
    }
  }

  function showDeathScreen() {
    gameOver = true;
    clearAllFadeTimeouts();
    finalScore.textContent = `Final Score: ${score}, Level: ${level}`;
    deathScreen.classList.add('active');
    frog.style.display = 'none';
  }

  function hideDeathScreen() {
    deathScreen.classList.remove('active');
    gameOver = false;
    lilypadIdCounter = 0;
    currentFrogPadId = null;
    score = 0;
    level = 1;
    lilypadsPerLevel = 4;
    scoreSpan.textContent = score;
    levelSpan.textContent = level;
    minFade = 700;
    fadingPads.clear();
    clearAllFadeTimeouts();
    showLevelScreen();
  }

  function placeFrogOnFirstLilypad() {
    const pads = document.querySelectorAll('.lilypad');
    if (pads.length > 0) {
      const firstPad = pads[Math.floor(Math.random() * pads.length)];
      const x = firstPad.offsetLeft + (firstPad.offsetWidth - frog.offsetWidth) / 2;
      const y = firstPad.offsetTop + (firstPad.offsetHeight - frog.offsetHeight) / 2;
      frog.style.left = `${x}px`;
      frog.style.top = `${y}px`;
      frog.style.display = "block";
      currentFrogPadId = firstPad.dataset.lilypadId;
      if (!fadingPads.has(firstPad.dataset.lilypadId)) {
        fadingPads.add(firstPad.dataset.lilypadId);
        startFading(firstPad, getFadeDuration());
      }
    }
  }

  function showLevelScreen() {
    paused = true;
    clearAllFadeTimeouts();
    levelTitle.textContent = `Level ${level}`;
    levelScreen.classList.add('active');
    frog.style.display = "none";
  }

  function hideLevelScreenAndStart() {
    levelScreen.classList.remove('active');
    paused = false;
    resetGameStateForLevel();
    frog.style.display = "block";
  }

  levelStartBtn.addEventListener('click', hideLevelScreenAndStart);
  restartBtn.addEventListener('click', hideDeathScreen);

  window.addEventListener('resize', () => {
    if (!gameOver && !paused) hideDeathScreen();
  });

  // Show level screen initially
  function gameInit() {
    paused = true;
    showLevelScreen();
    frog.style.display = "none";
  }

  gameInit();
});
