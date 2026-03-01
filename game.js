(function () {
  "use strict";

  let wordSets = [];
  let dailyWords = [];
  let currentSet = null;
  let currentLevel = 1;
  let cards = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let matchedCount = 0;
  let uiLang = "en";
  let roundScore = 0;
  let sessionScore = 0;
  let roundStartTime = 0;
  let timerInterval = null;
  let currentLevelCompleted = false;
  let highestLevelPassed = 0;
  let matchStreak = 0;

  const gameArea = document.getElementById("game-area");
  const gameBoardWrap = document.querySelector(".game-board-wrap");
  const setSelect = document.getElementById("set-select");
  const levelSelect = document.getElementById("level-select");
  const levelLabel = document.getElementById("level-label");
  const levelSelectRow = document.getElementById("level-select-row");
  const dailyLevelWrap = document.getElementById("daily-level-wrap");
  const dailyLevelDisplay = document.getElementById("daily-level-display");
  const nextBtn = document.getElementById("next-btn");
  const winMessage = document.getElementById("win-message");
  const winNextBtn = document.getElementById("win-next-btn");
  const winReplayBtn = document.getElementById("win-replay-btn");
  const winBackBtn = document.getElementById("win-back-btn");
  const winText = document.getElementById("win-text");
  const timerText = document.getElementById("timer-text");
  const scoreValue = document.getElementById("score-value");
  const progressText = document.getElementById("progress-text");
  const scoreLabel = document.getElementById("score-label");

  const UI = {
    en: {
      title: "Chinese & English Matching Game",
      heading: "Match the Words!",
      instruction: "Click two cards to find matching pairs — Chinese and English.",
      options: "OPTIONS",
      chooseSet: "Choose a set:",
      level: "Level:",
      next: "Next",
      replay: "Replay",
      backToStart: "Back to start",
      score: "SCORE:",
      time: "TIME:",
      youDidIt: "You did it! Great job!",
      progress: "Level {level}/{maxLevel} · {pairs} pairs",
      loading: "Loading...",
      memorize: "Remember the cards!",
      go: "Go!",
      modeDaily: "Daily (3/day)",
      modePractice: "Practice (unlimited)",
      dailyProgress: "Daily {n}/3",
      doneForToday: "You've completed today's 3 levels! Come back tomorrow or switch to Practice.",
      doneForTodayShort: "Today's challenge complete!",
      switchToPractice: "Practice mode",
      backToStart: "Back to start",
      partners: "Our partners",
      sponsors: "Our sponsors",
      thankYouSponsor: "Thank you for supporting us...",
      yourStreak: "Your streak",
      darkMode: "Dark mode"
    },
    zh: {
      title: "中英配词游戏",
      heading: "来配对词语！",
      instruction: "点击两张卡片，找出中文和英文的配对。",
      options: "选项",
      chooseSet: "选择一组：",
      level: "级别：",
      next: "下一关",
      replay: "再玩一次",
      backToStart: "返回开始",
      score: "得分：",
      time: "时间：",
      youDidIt: "太棒了！做得好！",
      progress: "级别 {level}/{maxLevel} · {pairs} 对",
      loading: "加载中...",
      memorize: "记住卡片位置！",
      go: "开始！",
      modeDaily: "每日（3关/天）",
      modePractice: "练习（无限）",
      dailyProgress: "今日 {n}/3",
      doneForToday: "今天的3关已完成！明天再来，或切换到练习模式。",
      doneForTodayShort: "今日挑战完成！",
      switchToPractice: "练习模式",
      backToStart: "返回开始",
      partners: "我们的合作伙伴",
      sponsors: "我们的赞助商",
      thankYouSponsor: "感谢您的支持...",
      yourStreak: "你的连续天数",
      darkMode: "深色模式"
    }
  };

  const PARTNERS_URL = "https://omg10.com/4/10629150";

  const setNames = {
    en: { animals: "Animals", colors: "Colors", numbers: "Numbers", family: "Family", verbs: "Verbs", daily: "Today's challenge" },
    zh: { animals: "动物", colors: "颜色", numbers: "数字", family: "家庭", verbs: "动词", daily: "今日挑战" }
  };

  const PAIRS_PER_LEVEL = 6;
  const POINTS_PER_MATCH = 10;
  const STREAK_BONUS_PER_MATCH = 5;
  const ROUND_TIME_SECONDS = 180;
  const PREVIEW_SECONDS = 6;
  const TIME_BONUS_MAX = 50;
  const TIME_BONUS_UNDER_SECONDS = 30;
  let previewTimeoutId = null;
  let previewCountdownInterval = null;
  const STARS_REQUIRED_TO_UNLOCK = 2;
  const DAILY_CHALLENGE_LEVELS = 3;
  const STORAGE_KEY_MODE = "matchingGameMode";
  const STORAGE_KEY_DAILY_PREFIX = "matchingGameDaily_";
  const STORAGE_KEY_LANG = "matchingGameLang";
  const STORAGE_KEY_SPONSOR_DATE = "matchingGameSponsorClickDate";
  const STORAGE_KEY_LAST_DAILY_DATE = "matchingGameLastDailyDate";
  const STORAGE_KEY_STREAK = "matchingGameStreak";
  const STORAGE_KEY_CELEBRATION_MILESTONES = "matchingGameCelebrationMilestones";
  const STORAGE_KEY_THEME = "matchingGameTheme";
  const CELEBRATION_MILESTONES = [1, 7, 30, 100, 200, 365, 500, 1000];
  const STREAK_EMOJI = "🔥";
  const TITLE_TIERS = [
    { min: 0, en: "Learner", zh: "学者", badges: "" },
    { min: 100, en: "Bronze Learner", zh: "青铜学者", badges: "🥉" },
    { min: 500, en: "Silver Scholar", zh: "白银学者", badges: "🥉🥈" },
    { min: 1000, en: "Gold Master", zh: "黄金大师", badges: "🥉🥈🥇" },
    { min: 2000, en: "Language Major", zh: "语言专才", badges: "🥉🥈🥇🎖️" },
    { min: 5000, en: "Grandmaster General", zh: "至尊大师", badges: "🥉🥈🥇🎖️⚔️" }
  ];

  const BG_MUSIC_SOURCES = ["bg1.mp3", "bg2.mp3", "bg3.mp3"];
  let bgMusicIndex = 0;
  let bgAudio = null;
  let bgMusicStarted = false;

  function playNextBgTrack() {
    if (!bgAudio || !BG_MUSIC_SOURCES.length) return;
    const src = BG_MUSIC_SOURCES[bgMusicIndex];
    bgAudio.src = src;
    bgAudio.volume = 0.35;
    bgAudio.loop = false;
    bgAudio.onended = function () {
      bgMusicIndex = (bgMusicIndex + 1) % BG_MUSIC_SOURCES.length;
      playNextBgTrack();
    };
    bgAudio.onerror = function () {
      bgMusicIndex = (bgMusicIndex + 1) % BG_MUSIC_SOURCES.length;
      playNextBgTrack();
    };
    bgAudio.play().catch(function () {});
  }

  function startBgMusic() {
    if (bgMusicStarted) return;
    bgMusicStarted = true;
    try {
      bgAudio = new Audio();
      playNextBgTrack();
    } catch (_) {}
  }

  function playSound(type) {
    try {
      const ctx = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === "suspended") {
        ctx.resume().then(function () { playSound(type); }).catch(function () {});
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      if (type === "flip") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "match") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "win") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (_) {}
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    roundStartTime = Date.now();
    timerText.textContent = formatTime(ROUND_TIME_SECONDS);
    timerInterval = setInterval(function () {
      const elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
      const remaining = Math.max(0, ROUND_TIME_SECONDS - elapsed);
      timerText.textContent = formatTime(remaining);
      if (remaining <= 0) {
        stopTimer();
        if (matchedCount < PAIRS_PER_LEVEL) handleTimeUp();
      }
    }, 500);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function getElapsedSeconds() {
    return roundStartTime ? Math.floor((Date.now() - roundStartTime) / 1000) : 0;
  }

  function clearPreview() {
    if (previewTimeoutId) { clearTimeout(previewTimeoutId); previewTimeoutId = null; }
    if (previewCountdownInterval) { clearInterval(previewCountdownInterval); previewCountdownInterval = null; }
    const overlay = gameBoardWrap && gameBoardWrap.querySelector(".preview-overlay");
    if (overlay) overlay.remove();
  }

  function startPlay() {
    cards.forEach(function (card) { card.classList.remove("flipped"); });
    lockBoard = false;
    startTimer();
  }

  function computeTimeBonus(seconds) {
    if (seconds <= TIME_BONUS_UNDER_SECONDS) {
      return Math.max(0, TIME_BONUS_MAX - Math.floor((seconds / TIME_BONUS_UNDER_SECONDS) * TIME_BONUS_MAX));
    }
    return 0;
  }

  function getTitleForScore(score) {
    let tier = TITLE_TIERS[0];
    for (let i = TITLE_TIERS.length - 1; i >= 0; i--) {
      if (score >= TITLE_TIERS[i].min) {
        tier = TITLE_TIERS[i];
        break;
      }
    }
    return tier;
  }

  function updateTitleDisplay() {
    const el = document.getElementById("title-display");
    if (!el) return;
    const tier = getTitleForScore(sessionScore);
    const name = uiLang === "zh" ? tier.zh : tier.en;
    const badgeStr = tier.badges ? " " + tier.badges : "";
    el.textContent = name + badgeStr;
    el.setAttribute("aria-label", name);
  }

  function updateProgress() {
    if (!progressText) return;
    const level = currentLevel || 1;
    const maxLevel = currentSet ? getMaxLevel(currentSet) : 10;
    progressText.textContent = (UI[uiLang].progress || UI.en.progress)
      .replace("{level}", level)
      .replace("{maxLevel}", maxLevel)
      .replace("{pairs}", matchedCount + "/" + PAIRS_PER_LEVEL);
    const levelFill = document.getElementById("level-progress-fill");
    const levelBar = document.querySelector(".level-progress-bar");
    if (levelFill && levelBar) {
      const levelPct = maxLevel ? (level / maxLevel) * 100 : 0;
      levelFill.style.width = levelPct + "%";
      levelBar.setAttribute("aria-valuenow", level);
      levelBar.setAttribute("aria-valuemax", maxLevel);
    }
    const pairsFill = document.getElementById("progress-bar-fill");
    const pairsBar = document.getElementById("pairs-progress-bar");
    if (pairsFill && pairsBar) {
      const pct = PAIRS_PER_LEVEL ? (matchedCount / PAIRS_PER_LEVEL) * 100 : 0;
      pairsFill.style.width = pct + "%";
      pairsBar.setAttribute("aria-valuenow", matchedCount);
      pairsBar.setAttribute("aria-valuemax", PAIRS_PER_LEVEL);
    }
  }

  function updateScoreDisplay() {
    if (scoreValue) scoreValue.textContent = sessionScore;
    updateTitleDisplay();
    try {
      sessionStorage.setItem("matchingGameScore", String(sessionScore));
    } catch (_) {}
  }

  function loadSessionScore() {
    try {
      const saved = sessionStorage.getItem("matchingGameScore");
      if (saved !== null) sessionScore = parseInt(saved, 10) || 0;
    } catch (_) {}
  }

  function getHighestLevelPassed(setId) {
    try {
      const key = "matchingGameLevel_" + setId;
      const s = localStorage.getItem(key);
      return s !== null ? Math.max(0, Math.min(10, parseInt(s, 10) || 0)) : 0;
    } catch (_) { return 0; }
  }

  function setHighestLevelPassed(setId, level) {
    try {
      const key = "matchingGameLevel_" + setId;
      const prev = getHighestLevelPassed(setId);
      localStorage.setItem(key, String(Math.max(prev, level)));
    } catch (_) {}
  }

  function getLevelStars(setId, level) {
    try {
      const key = "matchingGameStars_" + setId + "_" + level;
      const s = localStorage.getItem(key);
      return s !== null ? Math.min(3, Math.max(0, parseInt(s, 10) || 0)) : 0;
    } catch (_) { return 0; }
  }

  function setLevelStars(setId, level, stars) {
    try {
      const key = "matchingGameStars_" + setId + "_" + level;
      const val = Math.min(3, Math.max(0, stars));
      localStorage.setItem(key, String(val));
    } catch (_) {}
  }

  function getSavedSetAndLevel() {
    try {
      const setId = localStorage.getItem("matchingGameCurrentSet");
      const level = parseInt(localStorage.getItem("matchingGameCurrentLevel"), 10);
      return { setId: setId || null, level: (level >= 1 && level <= 10) ? level : 1 };
    } catch (_) { return { setId: null, level: 1 }; }
  }

  function saveSetAndLevel(setId, level) {
    try {
      localStorage.setItem("matchingGameCurrentSet", String(setId));
      localStorage.setItem("matchingGameCurrentLevel", String(level));
    } catch (_) {}
  }

  function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getDailyCountToday() {
    try {
      const key = STORAGE_KEY_DAILY_PREFIX + getTodayKey();
      const s = localStorage.getItem(key);
      return s !== null ? Math.max(0, parseInt(s, 10) || 0) : 0;
    } catch (_) { return 0; }
  }

  function incrementDailyCount() {
    try {
      const key = STORAGE_KEY_DAILY_PREFIX + getTodayKey();
      const n = getDailyCountToday() + 1;
      localStorage.setItem(key, String(Math.min(DAILY_CHALLENGE_LEVELS, n)));
      updateStreakFromDailyPlay();
      return n;
    } catch (_) { return 0; }
  }

  function getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function updateStreakFromDailyPlay() {
    try {
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DAILY_DATE);
      const current = parseInt(localStorage.getItem(STORAGE_KEY_STREAK), 10) || 0;
      let next = 1;
      if (lastDate === today) next = current;
      else if (lastDate === yesterday) next = current + 1;
      localStorage.setItem(STORAGE_KEY_LAST_DAILY_DATE, today);
      localStorage.setItem(STORAGE_KEY_STREAK, String(next));
    } catch (_) {}
  }

  function getStreak() {
    try {
      const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DAILY_DATE);
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      if (lastDate !== today && lastDate !== yesterday) return 0;
      return Math.max(0, parseInt(localStorage.getItem(STORAGE_KEY_STREAK), 10) || 0);
    } catch (_) { return 0; }
  }

  function getCelebrationShownMilestones() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_CELEBRATION_MILESTONES);
      if (!s) return [];
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function setCelebrationShownForMilestone(streak) {
    try {
      const arr = getCelebrationShownMilestones();
      if (arr.indexOf(streak) >= 0) return;
      arr.push(streak);
      arr.sort(function (a, b) { return a - b; });
      localStorage.setItem(STORAGE_KEY_CELEBRATION_MILESTONES, JSON.stringify(arr));
    } catch (_) {}
  }

  function shouldShowCelebrationOverlay() {
    const streak = getStreak();
    if (CELEBRATION_MILESTONES.indexOf(streak) < 0) return false;
    return getCelebrationShownMilestones().indexOf(streak) < 0;
  }

  function getGameMode() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_MODE);
      return s === "practice" ? "practice" : "daily";
    } catch (_) { return "daily"; }
  }

  function setGameMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode === "practice" ? "practice" : "daily");
    } catch (_) {}
  }

  function getSavedLang() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_LANG);
      return s === "zh" ? "zh" : "en";
    } catch (_) { return "en"; }
  }

  function setSavedLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang === "zh" ? "zh" : "en");
    } catch (_) {}
  }

  function getSavedTheme() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_THEME);
      return s === "dark" ? "dark" : "light";
    } catch (_) { return "light"; }
  }

  function setSavedTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme === "dark" ? "dark" : "light");
    } catch (_) {}
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (!root) return;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
    setSavedTheme(theme);
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
      toggle.classList.toggle("active", theme === "dark");
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function getSponsorClickedToday() {
    try {
      return localStorage.getItem(STORAGE_KEY_SPONSOR_DATE) === getTodayKey();
    } catch (_) { return false; }
  }

  function setSponsorClickedToday() {
    try {
      localStorage.setItem(STORAGE_KEY_SPONSOR_DATE, getTodayKey());
    } catch (_) {}
  }

  function updateSponsorButton() {
    const el = document.getElementById("support-link");
    if (!el) return;
    const clicked = getSponsorClickedToday();
    const lang = uiLang || "en";
    if (clicked) {
      el.classList.add("clicked");
      el.textContent = (UI[lang] && UI[lang].thankYouSponsor) ? UI[lang].thankYouSponsor : "Thank you for supporting us...";
      el.setAttribute("aria-label", el.textContent);
    } else {
      el.classList.remove("clicked");
      el.textContent = (UI[lang] && UI[lang].sponsors) ? UI[lang].sponsors : "Our sponsors";
      el.setAttribute("aria-label", el.textContent);
    }
  }

  function isPracticeMode() {
    return getGameMode() === "practice";
  }

  function getLevelsLeftToday() {
    if (isPracticeMode()) return 999;
    return Math.max(0, DAILY_CHALLENGE_LEVELS - getDailyCountToday());
  }

  function getDayOfYear() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  function getTodayDailyStartIndex() {
    if (!dailyWords || dailyWords.length < 18) return 0;
    const numBlocks = Math.floor(dailyWords.length / 18);
    const blockIndex = getDayOfYear() % Math.max(1, numBlocks);
    return blockIndex * 18;
  }

  function getTodayDailySet() {
    const start = getTodayDailyStartIndex();
    const pairs = (dailyWords || []).slice(start, start + 18);
    return { id: "daily", name: "Daily", pairs: pairs.length >= 18 ? pairs : (dailyWords || []).slice(0, 18) };
  }

  function showDailyLimitMessage() {
    const el = document.getElementById("daily-limit-message");
    if (el) el.classList.remove("hidden");
    const gameAreaEl = document.getElementById("game-area");
    if (gameAreaEl) gameAreaEl.classList.add("hidden");
  }

  function hideDailyLimitMessage() {
    const el = document.getElementById("daily-limit-message");
    if (el) el.classList.add("hidden");
    const gameAreaEl = document.getElementById("game-area");
    if (gameAreaEl) gameAreaEl.classList.remove("hidden");
  }

  function updateDailyProgressDisplay() {
    const wrap = document.getElementById("daily-progress-wrap");
    const text = document.getElementById("daily-progress-text");
    const streakEl = document.getElementById("streak-display");
    if (!wrap || !text) return;
    if (isPracticeMode()) {
      wrap.classList.add("hidden");
      return;
    }
    wrap.classList.remove("hidden");
    const n = getDailyCountToday();
    const tpl = (UI[uiLang] && UI[uiLang].dailyProgress) ? UI[uiLang].dailyProgress : "Daily {n}/3";
    text.textContent = tpl.replace("{n}", String(n));
    if (streakEl) {
      const streak = getStreak();
      const numEl = streakEl.querySelector(".streak-number");
      const emojiEl = streakEl.querySelector(".streak-emoji");
      if (numEl) numEl.textContent = streak;
      if (emojiEl) emojiEl.textContent = STREAK_EMOJI;
      streakEl.setAttribute("aria-label", (uiLang === "zh" ? "连续天数 " : "Streak ") + streak);
    }
  }

  function updateModeSwitcherUI() {
    const mode = getGameMode();
    document.querySelectorAll(".btn-mode").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
      const label = btn.getAttribute("data-mode") === "daily" ? (UI[uiLang].modeDaily || "Daily (3/day)") : (UI[uiLang].modePractice || "Practice (unlimited)");
      btn.textContent = label;
    });
  }

  function updateDailyLimitMessageText() {
    const textEl = document.querySelector(".daily-limit-text");
    const practiceBtn = document.getElementById("daily-limit-practice-btn");
    const backBtn = document.getElementById("daily-limit-back-btn");
    if (textEl && UI[uiLang].doneForToday) textEl.textContent = UI[uiLang].doneForToday;
    if (practiceBtn && UI[uiLang].switchToPractice) practiceBtn.textContent = UI[uiLang].switchToPractice;
    if (backBtn && UI[uiLang].backToStart) backBtn.textContent = UI[uiLang].backToStart;
  }

  function getMaxUnlockedLevel(setId) {
    if (setId === "daily") return Math.min(3, Math.max(1, getDailyCountToday() + 1));
    const highestPassed = getHighestLevelPassed(setId);
    const maxUnlocked = Math.max(1, Math.min(10, highestPassed + 1));
    return maxUnlocked;
  }

  function computeStars(roundScoreVal, elapsedSeconds) {
    if (roundScoreVal >= 80 || elapsedSeconds <= 25) return 3;
    if (roundScoreVal >= 60 || elapsedSeconds <= 45) return 2;
    return 1;
  }

  function triggerConfetti() {
    const colors = ["#6b4ce6", "#22c55e", "#fbbf24", "#f97316", "#ec4899", "#8b5cf6"];
    const container = document.createElement("div");
    container.className = "confetti-container";
    container.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 55; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDelay = Math.random() * 0.8 + "s";
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (6 + Math.random() * 6) + "px";
      p.style.height = p.style.width;
      container.appendChild(p);
    }
    document.body.appendChild(container);
    setTimeout(function () { container.remove(); }, 2800);
  }

  function updateLevelDropdown() {
    const setId = currentSet ? currentSet.id : null;
    const maxUnlocked = setId ? getMaxUnlockedLevel(setId) : 1;
    const maxLevel = currentSet ? getMaxLevel(currentSet) : 10;
    const maxSelectable = Math.min(maxUnlocked, maxLevel);
    for (let i = 0; i < levelSelect.options.length; i++) {
      const opt = levelSelect.options[i];
      const val = parseInt(opt.value, 10);
      opt.disabled = val > maxSelectable;
    }
  }

  function updateLevelControlVisibility() {
    const isDaily = currentSet && currentSet.id === "daily" && !isPracticeMode();
    if (levelLabel) levelLabel.classList.toggle("hidden", isDaily);
    if (levelSelectRow) levelSelectRow.classList.toggle("hidden", isDaily);
    if (dailyLevelWrap) {
      dailyLevelWrap.classList.toggle("hidden", !isDaily);
      if (isDaily && dailyLevelDisplay) dailyLevelDisplay.textContent = (currentLevel || 1) + " / 3";
    }
  }

  function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function createCard(pairId, text, isChinese, emoji) {
    const card = document.createElement("div");
    card.className = "card" + (isChinese ? " chinese" : "");
    card.dataset.pairId = String(pairId);
    card.dataset.text = text;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "Card: " + text);

    const frontContent = escapeHtml(text) + (emoji ? '<span class="card-emoji">' + escapeHtml(emoji) + "</span>" : "");
    card.innerHTML =
      '<div class="card-inner">' +
      '<div class="card-face card-back"></div>' +
      '<div class="card-face card-front">' + frontContent + "</div>" +
      "</div>";

    card.addEventListener("click", () => handleCardClick(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(card);
      }
    });

    return card;
  }

  function getMaxLevel(set) {
    if (!set || !set.pairs) return 1;
    return Math.min(10, Math.floor(set.pairs.length / PAIRS_PER_LEVEL));
  }

  function buildCardsFromSet(set, level) {
    // Each level uses a unique block of 6 pairs: L1 = 0-5, L2 = 6-11, ... L10 = 54-59. No overlap between levels.
    const levelNum = Math.max(1, parseInt(level, 10) || 1);
    const start = (levelNum - 1) * PAIRS_PER_LEVEL;
    const pairs = set.pairs || [];
    const pairList = pairs.slice(start, start + PAIRS_PER_LEVEL);
    const cardData = [];
    pairList.forEach((pair, index) => {
      const chinese = pair[0];
      const english = pair[1];
      const emoji = pair[2] || null;
      cardData.push({ pairId: index, text: chinese, isChinese: true, emoji: emoji });
      cardData.push({ pairId: index, text: english, isChinese: false, emoji: null });
    });
    return shuffle(cardData).map((c) =>
      createCard(c.pairId, c.text, c.isChinese, c.emoji)
    );
  }

  function updateNextButtonState() {
    nextBtn.disabled = !currentLevelCompleted;
    nextBtn.setAttribute("aria-disabled", currentLevelCompleted ? "false" : "true");
  }

  function handleTimeUp() {
    lockBoard = true;
    const timeupMessage = document.getElementById("timeup-message");
    const timeupText = document.getElementById("timeup-text");
    const timeupRetry = document.getElementById("timeup-retry-btn");
    const timeupBack = document.getElementById("timeup-back-btn");
    const timeupHint = document.querySelector(".timeup-hint");
    if (timeupText) timeupText.textContent = uiLang === "zh" ? "时间到！" : "Time's up!";
    if (timeupHint) timeupHint.textContent = uiLang === "zh" ? "再试一次，在时间用完前配对成功吧！" : "Try again and match all pairs before the timer runs out!";
    if (timeupRetry) timeupRetry.textContent = uiLang === "zh" ? "再试一次" : "Retry";
    if (timeupBack) timeupBack.textContent = UI[uiLang].backToStart || UI.en.backToStart;
    if (timeupMessage) timeupMessage.classList.remove("hidden");
  }

  function renderGame(set, level) {
    gameArea.innerHTML = "";
    winMessage.classList.add("hidden");
    const timeupMessage = document.getElementById("timeup-message");
    if (timeupMessage) timeupMessage.classList.add("hidden");
    stopTimer();
    clearPreview();
    roundScore = 0;
    currentLevelCompleted = false;
    matchStreak = 0;
    updateNextButtonState();
    cards = buildCardsFromSet(set, level);
    cards.forEach(function (el) {
      el.classList.add("flipped");
      gameArea.appendChild(el);
    });
    firstCard = null;
    secondCard = null;
    lockBoard = true;
    matchedCount = 0;
    updateProgress();
    updateScoreDisplay();

    const memorizeText = UI[uiLang].memorize || UI.en.memorize;
    const goText = UI[uiLang].go || UI.en.go;
    const overlay = document.createElement("div");
    overlay.className = "preview-overlay";
    overlay.setAttribute("aria-live", "polite");
    const msg = document.createElement("p");
    msg.className = "preview-overlay-msg";
    msg.textContent = memorizeText;
    const countEl = document.createElement("p");
    countEl.className = "preview-overlay-count";
    countEl.textContent = String(PREVIEW_SECONDS);
    overlay.appendChild(msg);
    overlay.appendChild(countEl);
    if (gameBoardWrap) gameBoardWrap.appendChild(overlay);

    let remaining = PREVIEW_SECONDS;
    previewCountdownInterval = setInterval(function () {
      remaining -= 1;
      if (remaining > 0) countEl.textContent = String(remaining);
      else {
        if (previewCountdownInterval) { clearInterval(previewCountdownInterval); previewCountdownInterval = null; }
        countEl.textContent = goText;
      }
    }, 1000);

    previewTimeoutId = setTimeout(function () {
      previewTimeoutId = null;
      if (previewCountdownInterval) { clearInterval(previewCountdownInterval); previewCountdownInterval = null; }
      overlay.remove();
      startPlay();
    }, PREVIEW_SECONDS * 1000);
  }

  function handleCardClick(card) {
    if (lockBoard) return;
    if (card === firstCard) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("flipped");
    startBgMusic();
    playSound("flip");

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    lockBoard = true;

    const match = firstCard.dataset.pairId === secondCard.dataset.pairId;

    if (match) {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      matchedCount += 1;
      matchStreak += 1;
      const matchPoints = POINTS_PER_MATCH + (matchStreak > 1 ? (matchStreak - 1) * STREAK_BONUS_PER_MATCH : 0);
      roundScore += matchPoints;
      sessionScore += matchPoints;
      updateProgress();
      updateScoreDisplay();
      playSound("match");
      lockBoard = false;
      firstCard = null;
      secondCard = null;

      if (matchedCount === PAIRS_PER_LEVEL) {
        currentLevelCompleted = true;
        setHighestLevelPassed(currentSet.id, currentLevel);
        if (!isPracticeMode()) incrementDailyCount();
        updateLevelDropdown();
        updateNextButtonState();
        updateDailyProgressDisplay();
        setTimeout(function () {
          stopTimer();
          const elapsed = getElapsedSeconds();
          const timeBonus = computeTimeBonus(elapsed);
          roundScore += timeBonus;
          sessionScore += timeBonus;
          updateScoreDisplay();
          const stars = computeStars(roundScore, elapsed);
          setLevelStars(currentSet.id, currentLevel, stars);
          updateLevelDropdown();
          playSound("win");
          const dailyLimitReached = !isPracticeMode() && getDailyCountToday() >= DAILY_CHALLENGE_LEVELS;
          if (dailyLimitReached) {
            if (shouldShowCelebrationOverlay()) {
              setCelebrationShownForMilestone(getStreak());
              showDailyCompleteCelebration(function () { showWin(elapsed, stars, true); });
            } else {
              triggerConfetti();
              showWin(elapsed, stars, true);
            }
          } else {
            triggerConfetti();
            showWin(elapsed, stars, false);
          }
        }, 400);
      }
    } else {
      matchStreak = 0;
      setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        lockBoard = false;
        firstCard = null;
        secondCard = null;
      }, 800);
    }
  }

  function showDailyCompleteCelebration(onDone) {
    const overlay = document.getElementById("daily-complete-celebration");
    const labelEl = document.getElementById("daily-complete-streak-label");
    const numEl = document.querySelector(".daily-complete-num");
    const emojiEl = document.querySelector(".daily-complete-emoji");
    if (!overlay) {
      if (onDone) onDone();
      return;
    }
    const streak = getStreak();
    const lang = uiLang || "en";
    if (labelEl) labelEl.textContent = (UI[lang] && UI[lang].yourStreak) ? UI[lang].yourStreak : "Your streak";
    if (numEl) numEl.textContent = streak;
    if (emojiEl) emojiEl.textContent = STREAK_EMOJI;
    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
    const reveal = overlay.querySelector(".daily-complete-streak-reveal");
    if (reveal) reveal.classList.remove("revealed");
    triggerConfetti();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (reveal) reveal.classList.add("revealed");
      });
    });
    setTimeout(function () {
      overlay.classList.remove("visible");
      overlay.classList.add("hidden");
      if (reveal) reveal.classList.remove("revealed");
      if (onDone) onDone();
    }, 1400);
  }

  function showWin(elapsedSeconds, stars, dailyLimitReached) {
    document.getElementById("win-score-value").textContent = roundScore;
    const remaining = Math.max(0, ROUND_TIME_SECONDS - (elapsedSeconds || 0));
    document.getElementById("win-time-value").textContent = formatTime(remaining);
    const starsEl = document.getElementById("win-stars");
    const earned = typeof stars === "number" ? Math.min(3, Math.max(0, stars)) : 1;
    if (starsEl) {
      starsEl.innerHTML = "";
      starsEl.setAttribute("aria-label", earned + " star" + (earned !== 1 ? "s" : ""));
      for (let i = 0; i < 3; i++) {
        const span = document.createElement("span");
        span.className = "win-star" + (i < earned ? " win-star-filled" : " win-star-empty");
        span.textContent = i < earned ? "★" : "☆";
        span.style.animationDelay = (i * 0.28) + "s";
        starsEl.appendChild(span);
      }
    }
    const winTextEl = document.getElementById("win-text");
    const winNextBtnEl = document.getElementById("win-next-btn");
    const winPracticeBtnEl = document.getElementById("win-practice-btn");
    if (dailyLimitReached) {
      if (winTextEl) winTextEl.textContent = (UI[uiLang] && UI[uiLang].doneForTodayShort) ? UI[uiLang].doneForTodayShort : "Today's challenge complete!";
      if (winNextBtnEl) winNextBtnEl.classList.add("hidden");
      if (winPracticeBtnEl) winPracticeBtnEl.classList.remove("hidden");
    } else {
      if (winTextEl) winTextEl.textContent = UI[uiLang].youDidIt;
      if (winNextBtnEl) winNextBtnEl.classList.remove("hidden");
      if (winPracticeBtnEl) winPracticeBtnEl.classList.add("hidden");
    }
    winMessage.classList.remove("hidden");
  }

  function startSet(setId) {
    const set = setId === "daily" ? getTodayDailySet() : wordSets.find((s) => s.id === setId);
    if (!set || !set.pairs || set.pairs.length < PAIRS_PER_LEVEL) return;
    currentSet = set;
    hideDailyLimitMessage();
    if (!isPracticeMode() && getLevelsLeftToday() === 0) {
      showDailyLimitMessage();
      updateDailyProgressDisplay();
      return;
    }
    updateLevelDropdown();
    const maxUnlocked = getMaxUnlockedLevel(set.id);
    const maxLevel = getMaxLevel(set);
    const maxSelectable = Math.min(maxUnlocked, maxLevel);
    let requested = parseInt(levelSelect.value, 10) || 1;
    currentLevel = requested > maxSelectable ? maxSelectable : Math.max(1, Math.min(10, requested));
    if (currentLevel !== requested) levelSelect.value = currentLevel;
    saveSetAndLevel(set.id, currentLevel);
    updateLevelControlVisibility();
    renderGame(set, currentLevel);
  }

  function applyLanguage(lang) {
    uiLang = lang;
    setSavedLang(lang);
    document.title = UI[lang].title;
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.getElementById("page-title").textContent = UI[lang].heading;
    document.getElementById("instruction").textContent = UI[lang].instruction;
    document.getElementById("options-title").textContent = UI[lang].options;
    document.getElementById("set-label").textContent = UI[lang].chooseSet;
    if (levelLabel) levelLabel.textContent = UI[lang].level;
    nextBtn.textContent = UI[lang].next;
    winText.textContent = UI[lang].youDidIt;
    winNextBtn.textContent = UI[lang].next;
    winReplayBtn.textContent = UI[lang].replay;
    winBackBtn.textContent = UI[lang].backToStart;
    if (scoreLabel) scoreLabel.textContent = UI[lang].score + " ";
    const timeLabelEl = document.getElementById("time-label");
    if (timeLabelEl) timeLabelEl.textContent = UI[lang].time + " ";
    updateSponsorButton();
    updateModeSwitcherUI();
    updateDailyProgressDisplay();
    updateDailyLimitMessageText();
    const savedSet = setSelect.value;
    refreshSetSelector();
    if (setSelect.querySelector('option[value="' + savedSet + '"]')) setSelect.value = savedSet;
    updateTitleDisplay();
    updateProgress();
    document.querySelectorAll(".btn-lang").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    const darkModeBtn = document.getElementById("dark-mode-toggle");
    if (darkModeBtn) darkModeBtn.textContent = UI[lang].darkMode;
  }

  function refreshSetSelector() {
    setSelect.innerHTML = "";
    if (isPracticeMode()) {
      wordSets.forEach((set) => {
        const opt = document.createElement("option");
        opt.value = set.id;
        opt.textContent = setNames[uiLang][set.id] || set.name;
        setSelect.appendChild(opt);
      });
    } else {
      const opt = document.createElement("option");
      opt.value = "daily";
      opt.textContent = setNames[uiLang].daily || "Today's challenge";
      setSelect.appendChild(opt);
    }
  }

  function initSelector() {
    updateModeSwitcherUI();
    refreshSetSelector();
    updateLevelDropdown();
    if (isPracticeMode()) {
      if (wordSets.length > 0) {
        const saved = getSavedSetAndLevel();
        const setExists = saved.setId && wordSets.some((s) => s.id === saved.setId);
        const setId = setExists ? saved.setId : wordSets[0].id;
        const set = wordSets.find((s) => s.id === setId);
        const maxUnlocked = set ? getMaxUnlockedLevel(set.id) : 1;
        const maxLevel = set ? getMaxLevel(set) : 10;
        const maxSelectable = Math.min(maxUnlocked, maxLevel);
        const level = setExists && saved.level >= 1 && saved.level <= maxSelectable ? saved.level : 1;
        setSelect.value = setId;
        levelSelect.value = String(level);
        currentLevel = level;
        startSet(setId);
      }
    } else {
      setSelect.value = "daily";
      const level = Math.min(3, Math.max(1, getDailyCountToday() + 1));
      levelSelect.value = String(level);
      currentLevel = level;
      startSet("daily");
    }
    updateDailyProgressDisplay();
  }

  function goToNextLevel() {
    if (!currentSet || !currentLevelCompleted) return;
    winMessage.classList.add("hidden");
    updateLevelDropdown();
    const maxLevelThisSet = getMaxLevel(currentSet);
    const nextLevel = currentLevel >= 10 ? 1 : currentLevel + 1;
    const idx = currentSet.id === "daily" ? -1 : wordSets.findIndex((s) => s.id === currentSet.id);
    const nextSet = idx >= 0 && idx < wordSets.length - 1 ? wordSets[idx + 1] : null;
    if (nextLevel > maxLevelThisSet && nextSet) {
      setSelect.value = nextSet.id;
      levelSelect.value = "1";
      currentLevel = 1;
      startSet(nextSet.id);
      return;
    }
    if (currentLevel >= 10 && nextSet) {
      setSelect.value = nextSet.id;
      levelSelect.value = "1";
      currentLevel = 1;
      startSet(nextSet.id);
      return;
    }
    currentLevel = Math.min(nextLevel, maxLevelThisSet);
    levelSelect.value = String(currentLevel);
    startSet(currentSet.id);
  }

  nextBtn.addEventListener("click", goToNextLevel);
  winNextBtn.addEventListener("click", goToNextLevel);

  winReplayBtn.addEventListener("click", () => {
    if (!currentSet) return;
    winMessage.classList.add("hidden");
    renderGame(currentSet, currentLevel);
  });

  winBackBtn.addEventListener("click", () => {
    winMessage.classList.add("hidden");
    levelSelect.value = "1";
    currentLevel = 1;
    if (currentSet) startSet(currentSet.id);
  });

  const timeupRetryBtn = document.getElementById("timeup-retry-btn");
  const timeupBackBtn = document.getElementById("timeup-back-btn");
  if (timeupRetryBtn) {
    timeupRetryBtn.addEventListener("click", () => {
      const timeupMessage = document.getElementById("timeup-message");
      if (timeupMessage) timeupMessage.classList.add("hidden");
      if (currentSet) renderGame(currentSet, currentLevel);
    });
  }
  if (timeupBackBtn) {
    timeupBackBtn.addEventListener("click", () => {
      const timeupMessage = document.getElementById("timeup-message");
      if (timeupMessage) timeupMessage.classList.add("hidden");
      levelSelect.value = "1";
      currentLevel = 1;
      if (currentSet) startSet(currentSet.id);
    });
  }

  setSelect.addEventListener("change", () => {
    startSet(setSelect.value);
  });

  levelSelect.addEventListener("change", () => {
    const requested = parseInt(levelSelect.value, 10) || 1;
    const maxUnlocked = currentSet ? getMaxUnlockedLevel(currentSet.id) : 1;
    const maxLevel = currentSet ? getMaxLevel(currentSet) : 10;
    const maxSelectable = Math.min(maxUnlocked, maxLevel);
    if (requested > maxSelectable) {
      levelSelect.value = currentLevel;
      return;
    }
    currentLevel = requested;
    if (currentSet) startSet(currentSet.id);
  });

  document.getElementById("mode-daily").addEventListener("click", () => {
    setGameMode("daily");
    updateModeSwitcherUI();
    updateDailyProgressDisplay();
    refreshSetSelector();
    setSelect.value = "daily";
    levelSelect.value = "1";
    currentLevel = 1;
    startSet("daily");
  });
  document.getElementById("mode-practice").addEventListener("click", () => {
    setGameMode("practice");
    updateModeSwitcherUI();
    updateDailyProgressDisplay();
    hideDailyLimitMessage();
    refreshSetSelector();
    const setId = wordSets.length > 0 ? wordSets[0].id : setSelect.value;
    setSelect.value = setId;
    levelSelect.value = "1";
    currentLevel = 1;
    startSet(setId);
  });

  const dailyLimitPracticeBtn = document.getElementById("daily-limit-practice-btn");
  const dailyLimitBackBtn = document.getElementById("daily-limit-back-btn");
  if (dailyLimitPracticeBtn) {
    dailyLimitPracticeBtn.addEventListener("click", () => {
      setGameMode("practice");
      updateModeSwitcherUI();
      updateDailyProgressDisplay();
      hideDailyLimitMessage();
      refreshSetSelector();
      const setId = wordSets.length > 0 ? wordSets[0].id : setSelect.value;
      setSelect.value = setId;
      levelSelect.value = "1";
      currentLevel = 1;
      startSet(setId);
    });
  }
  if (dailyLimitBackBtn) {
    dailyLimitBackBtn.addEventListener("click", () => {
      hideDailyLimitMessage();
      levelSelect.value = "1";
      currentLevel = 1;
      if (currentSet) startSet(currentSet.id);
    });
  }

  const winPracticeBtn = document.getElementById("win-practice-btn");
  if (winPracticeBtn) {
    winPracticeBtn.addEventListener("click", () => {
      setGameMode("practice");
      updateModeSwitcherUI();
      updateDailyProgressDisplay();
      winMessage.classList.add("hidden");
      goToNextLevel();
    });
  }

  const supportLinkEl = document.getElementById("support-link");
  if (supportLinkEl) {
    supportLinkEl.addEventListener("click", function (e) {
      if (getSponsorClickedToday()) {
        e.preventDefault();
        return;
      }
      window.open(PARTNERS_URL, "_blank", "noopener,noreferrer");
      setSponsorClickedToday();
      updateSponsorButton();
      e.preventDefault();
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") updateSponsorButton();
  });

  document.getElementById("lang-en").addEventListener("click", () => { applyLanguage("en"); startBgMusic(); });
  document.getElementById("lang-zh").addEventListener("click", () => { applyLanguage("zh"); startBgMusic(); });
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function () {
      applyTheme(getSavedTheme() === "dark" ? "light" : "dark");
    });
  }

  loadSessionScore();

  const builtinSets = { sets: (function () {
    try {
      return JSON.parse('{"sets":[{"id":"animals","name":"Animals","pairs":[["狗","dog","🐶"],["猫","cat","🐱"],["鸟","bird","🐦"],["鱼","fish","🐟"],["兔","rabbit","🐰"],["马","horse","🐴"],["牛","cow","🐄"],["羊","sheep","🐑"],["猪","pig","🐷"],["鸡","chicken","🐔"],["鸭","duck","🦆"],["鼠","mouse","🐭"],["虎","tiger","🐯"],["龙","dragon","🐉"],["蛇","snake","🐍"],["猴","monkey","🐵"],["熊","bear","🐻"],["狼","wolf","🐺"],["象","elephant","🐘"],["鹿","deer","🦌"],["狐狸","fox","🦊"],["熊猫","panda","🐼"],["狮子","lion","🦁"],["蜜蜂","bee","🐝"],["蝴蝶","butterfly","🦋"],["蚂蚁","ant","🐜"],["蜘蛛","spider","🕷️"],["螃蟹","crab","🦀"],["青蛙","frog","🐸"],["乌龟","turtle","🐢"],["鳄鱼","crocodile","🐊"],["企鹅","penguin","🐧"],["猫头鹰","owl","🦉"],["蝙蝠","bat","🦇"],["刺猬","hedgehog","🦔"],["袋鼠","kangaroo","🦘"],["考拉","koala","🐨"],["长颈鹿","giraffe","🦒"],["斑马","zebra","🦓"],["河马","hippo","🦛"],["犀牛","rhino","🦏"],["猩猩","orangutan","🦧"],["松鼠","squirrel","🐿️"],["海豚","dolphin","🐬"],["鲸鱼","whale","🐋"],["鲨鱼","shark","🦈"],["海星","starfish","⭐"],["章鱼","octopus","🐙"],["蜗牛","snail","🐌"],["蚯蚓","earthworm","🪱"],["瓢虫","ladybug","🐞"],["蜻蜓","dragonfly","🦋"],["蟋蟀","cricket","🦗"],["萤火虫","firefly","✨"]]},{"id":"colors","name":"Colors","pairs":[["红","red","🔴"],["蓝","blue","🔵"],["黄","yellow","🟡"],["绿","green","🟢"],["黑","black","⚫"],["白","white","⚪"],["橙","orange","🟠"],["紫","purple","🟣"],["粉","pink","🌸"],["棕","brown","🟤"],["灰","grey","◻️"],["金","gold","✨"],["银","silver","⚪"],["青","cyan","💎"],["米","beige","🍚"],["深蓝","dark blue","🔵"],["浅绿","light green","🟢"],["深红","dark red","🔴"],["天蓝","sky blue","🔵"],["柠檬黄","lemon yellow","🟡"],["橄榄绿","olive green","🟢"],["玫瑰红","rose red","🔴"],["海军蓝","navy blue","🔵"],["薄荷绿","mint green","🟢"],["桃色","peach","🍑"],["薰衣草","lavender","🟣"],["珊瑚色","coral","🪸"],["靛蓝","indigo","🟣"],["茶色","tan","🟤"],["奶油色","cream","🥛"],["栗色","maroon","🔴"],["青柠","lime","🟢"],["琥珀","amber","🟡"],["翡翠","emerald","💎"],["朱红","vermilion","🔴"],["藏青","navy","🔵"],["象牙白","ivory","⚪"],["炭灰","charcoal","◻️"],["赤褐","auburn","🟤"],["品红","magenta","🟣"],["青绿","teal","🟢"],["杏黄","apricot","🟡"],["猩红","scarlet","🔴"],["钴蓝","cobalt blue","🔵"],["橄榄","olive","🟢"],["紫罗兰","violet","🟣"],["米黄","wheat","🟡"],["石板灰","slate grey","◻️"]]},{"id":"numbers","name":"Numbers","pairs":[["一","one","1️⃣"],["二","two","2️⃣"],["三","three","3️⃣"],["四","four","4️⃣"],["五","five","5️⃣"],["六","six","6️⃣"],["七","seven","7️⃣"],["八","eight","8️⃣"],["九","nine","9️⃣"],["十","ten","🔟"],["零","zero","0️⃣"],["百","hundred","💯"],["千","thousand","🔢"],["半","half","➗"],["两","two (counting)","2️⃣"],["第一","first","1️⃣"],["第二","second","2️⃣"],["第三","third","3️⃣"],["几","how many","❓"],["多","many","📦"],["少","few","📉"],["双","pair","2️⃣"],["打","dozen","1️⃣2️⃣"],["倍","times","✖️"],["加","plus","➕"],["减","minus","➖"],["乘","multiply","✖️"],["除","divide","➗"],["等于","equals","🟰"],["数字","number","🔢"],["奇数","odd number","1️⃣"],["偶数","even number","2️⃣"],["分数","fraction","½"],["小数","decimal","1.5"],["百分","percent","%"],["倍率","multiple","✖️"],["数量","quantity","📊"],["顺序","order","1️⃣2️⃣3️⃣"],["倒数","countdown","⏱️"],["整数","whole number","🔢"],["双数","double","2️⃣"],["单数","single","1️⃣"],["十几","teens","1️⃣🔟"],["几十","tens","🔟"],["零头","odd","🔢"],["整","whole","1️⃣"],["余","remainder","➗"],["约","approximately","≈"]]},{"id":"family","name":"Family","pairs":[["妈妈","mom","👩"],["爸爸","dad","👨"],["哥哥","older brother","👦"],["姐姐","older sister","👧"],["弟弟","younger brother","👦"],["妹妹","younger sister","👧"],["爷爷","grandpa","👴"],["奶奶","grandma","👵"],["宝宝","baby","👶"],["家","family","🏠"],["外公","grandpa (maternal)","👴"],["外婆","grandma (maternal)","👵"],["叔叔","uncle","👨"],["阿姨","aunt","👩"],["朋友","friend","👫"],["儿子","son","👦"],["女儿","daughter","👧"],["丈夫","husband","👨"],["妻子","wife","👩"],["父母","parents","👨👩"],["兄弟","brothers","👦👦"],["姐妹","sisters","👧👧"],["祖父母","grandparents","👴👵"],["孙子","grandson","👦"],["孙女","granddaughter","👧"],["表哥","male cousin","👦"],["表姐","female cousin","👧"],["侄子","nephew","👦"],["侄女","niece","👧"],["堂兄","cousin (paternal)","👦"],["亲戚","relatives","👨👩"],["邻居","neighbor","🏠"],["同学","classmate","📚"],["老师","teacher","👩‍🏫"],["学生","student","📖"],["大人","adult","👨"],["小孩","child","👶"],["男人","man","👨"],["女人","woman","👩"],["男孩","boy","👦"],["女孩","girl","👧"],["双胞胎","twins","👫"],["新郎","groom","👨"],["新娘","bride","👩"],["继父","stepfather","👨"],["继母","stepmother","👩"],["养子","adopted son","👦"],["家人","family members","👨👩👧👦"]]},{"id":"verbs","name":"Verbs","pairs":[["跑","run","🏃"],["走","walk","🚶"],["吃","eat","🍽️"],["喝","drink","🥤"],["睡","sleep","😴"],["看","see","👀"],["听","listen","👂"],["说","say","🗣️"],["读","read","📖"],["写","write","✍️"],["唱","sing","🎤"],["玩","play","🎮"],["学习","study","📚"],["工作","work","💼"],["爱","love","❤️"],["喜欢","like","👍"],["想","think","🤔"],["来","come","👉"],["去","go","👋"],["买","buy","🛒"],["打开","open","📂"],["关闭","close","❌"],["问","ask","❓"],["帮助","help","🆘"],["给","give","🎁"],["拿","take","✋"],["放","put","📍"],["坐","sit","🪑"],["站","stand","🧍"],["飞","fly","✈️"],["游","swim","🏊"],["爬","climb","🧗"],["跳","jump","⬆️"],["等","wait","⏳"],["教","teach","👩‍🏫"],["学","learn","📖"],["开始","start","▶️"],["结束","finish","🏁"],["忘记","forget","🤷"],["记得","remember","🧠"],["尝试","try","💪"],["需要","need","📌"],["想要","want","🙏"],["做","do","✅"],["找","find","🔍"],["用","use","🔧"],["叫","call","📞"],["回答","answer","💬"],["笑","laugh","😄"],["哭","cry","😢"],["画","draw","🖌️"],["跳舞","dance","💃"],["做饭","cook","👨‍🍳"],["洗","wash","🧼"]]}]}').sets;
    } catch (e) {
      return [
        { id: "animals", name: "Animals", pairs: [["狗", "dog", "🐶"], ["猫", "cat", "🐱"], ["鸟", "bird", "🐦"], ["鱼", "fish", "🐟"], ["兔", "rabbit", "🐰"], ["马", "horse", "🐴"], ["牛", "cow", "🐄"], ["羊", "sheep", "🐑"], ["猪", "pig", "🐷"], ["鸡", "chicken", "🐔"], ["鸭", "duck", "🦆"], ["鼠", "mouse", "🐭"], ["虎", "tiger", "🐯"], ["龙", "dragon", "🐉"], ["蛇", "snake", "🐍"]] },
        { id: "colors", name: "Colors", pairs: [["红", "red", "🔴"], ["蓝", "blue", "🔵"], ["黄", "yellow", "🟡"], ["绿", "green", "🟢"], ["黑", "black", "⚫"], ["白", "white", "⚪"], ["橙", "orange", "🟠"], ["紫", "purple", "🟣"], ["粉", "pink", "🌸"], ["棕", "brown", "🟤"], ["灰", "grey", "◻️"], ["金", "gold", "✨"], ["银", "silver", "⚪"], ["青", "cyan", "💎"], ["米", "beige", "🍚"]] },
        { id: "numbers", name: "Numbers", pairs: [["一", "one", "1️⃣"], ["二", "two", "2️⃣"], ["三", "three", "3️⃣"], ["四", "four", "4️⃣"], ["五", "five", "5️⃣"], ["六", "six", "6️⃣"], ["七", "seven", "7️⃣"], ["八", "eight", "8️⃣"], ["九", "nine", "9️⃣"], ["十", "ten", "🔟"], ["零", "zero", "0️⃣"], ["百", "hundred", "💯"], ["千", "thousand", "🔢"], ["半", "half", "➗"], ["两", "two (counting)", "2️⃣"]] },
        { id: "family", name: "Family", pairs: [["妈妈", "mom", "👩"], ["爸爸", "dad", "👨"], ["哥哥", "older brother", "👦"], ["姐姐", "older sister", "👧"], ["弟弟", "younger brother", "👦"], ["妹妹", "younger sister", "👧"], ["爷爷", "grandpa", "👴"], ["奶奶", "grandma", "👵"], ["宝宝", "baby", "👶"], ["家", "family", "🏠"], ["外公", "grandpa (maternal)", "👴"], ["外婆", "grandma (maternal)", "👵"], ["叔叔", "uncle", "👨"], ["阿姨", "aunt", "👩"], ["朋友", "friend", "👫"]] },
        { id: "verbs", name: "Verbs", pairs: [["跑", "run", "🏃"], ["走", "walk", "🚶"], ["吃", "eat", "🍽️"], ["喝", "drink", "🥤"], ["睡", "sleep", "😴"], ["看", "see", "👀"], ["听", "listen", "👂"], ["说", "say", "🗣️"], ["读", "read", "📖"], ["写", "write", "✍️"], ["唱", "sing", "🎤"], ["玩", "play", "🎮"], ["学习", "study", "📚"], ["工作", "work", "💼"], ["爱", "love", "❤️"]] }
      ];
    }
  })() };

  const builtinDailyPairs = [
    ["桌子", "table", "🪑"], ["椅子", "chair", "🪑"], ["床", "bed", "🛏️"], ["沙发", "sofa", "🛋️"], ["门", "door", "🚪"], ["窗", "window", "🪟"],
    ["灯", "lamp", "💡"], ["书", "book", "📖"], ["笔", "pen", "🖊️"], ["手机", "phone", "📱"], ["电脑", "computer", "💻"], ["杯子", "cup", "🥤"],
    ["碗", "bowl", "🥣"], ["盘子", "plate", "🍽️"], ["刀", "knife", "🔪"], ["叉子", "fork", "🍴"], ["勺子", "spoon", "🥄"], ["钥匙", "key", "🔑"]
  ];

  function loadDailyWords() {
    return fetch("daily-words.json")
      .then((r) => r.json())
      .then((data) => {
        dailyWords = (data && data.pairs && data.pairs.length >= 18) ? data.pairs : builtinDailyPairs;
      })
      .catch(() => {
        dailyWords = builtinDailyPairs;
      });
  }

  Promise.all([
    fetch("words.json").then((r) => r.json()).then((data) => {
      wordSets = (data && data.sets && data.sets.length) ? data.sets : builtinSets.sets;
    }).catch(() => { wordSets = builtinSets.sets; }),
    loadDailyWords()
  ]).then(() => {
    uiLang = getSavedLang();
    initSelector();
    applyLanguage(uiLang);
    applyTheme(getSavedTheme());
    updateSponsorButton();
  });
})();
