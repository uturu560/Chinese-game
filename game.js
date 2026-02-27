(function () {
  "use strict";

  let wordSets = [];
  let currentSet = null;
  let currentLevel = 1;
  let cards = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let matchedCount = 0;
  let uiLang = "en";

  const gameArea = document.getElementById("game-area");
  const setSelect = document.getElementById("set-select");
  const levelSelect = document.getElementById("level-select");
  const nextBtn = document.getElementById("next-btn");
  const winMessage = document.getElementById("win-message");
  const winNextBtn = document.getElementById("win-next-btn");
  const winText = document.getElementById("win-text");

  var UI = {
    en: {
      title: "Chinese & English Matching Game",
      heading: "Match the Words!",
      instruction: "Click two cards to find matching pairs — Chinese and English.",
      chooseSet: "Choose a set:",
      level: "Level:",
      next: "Next",
      youDidIt: "You did it! Great job!",
      loading: "Loading..."
    },
    zh: {
      title: "中英配词游戏",
      heading: "来配对词语！",
      instruction: "点击两张卡片，找出中文和英文的配对。",
      chooseSet: "选择一组：",
      level: "级别：",
      next: "下一关",
      youDidIt: "太棒了！做得好！",
      loading: "加载中..."
    }
  };

  var setNames = {
    en: { animals: "Animals", colors: "Colors", numbers: "Numbers", family: "Family" },
    zh: { animals: "动物", colors: "颜色", numbers: "数字", family: "家庭" }
  };

  function playSound(type) {
    try {
      var ctx = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      var osc = ctx.createOscillator();
      osc.type = "sine";
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      if (type === "match") {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "next") {
        osc.frequency.setValueAtTime(392, ctx.currentTime);
        osc.frequency.setValueAtTime(523, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.24);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (_) {}
  }

  function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function createCard(pairId, text, isChinese) {
    const card = document.createElement("div");
    card.className = "card" + (isChinese ? " chinese" : "");
    card.dataset.pairId = String(pairId);
    card.dataset.text = text;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "Card: " + text);

    card.innerHTML =
      '<div class="card-inner">' +
      '<div class="card-face card-back"></div>' +
      '<div class="card-face card-front">' + escapeHtml(text) + "</div>" +
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

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  var PAIRS_PER_LEVEL = 6;

  function buildCardsFromSet(set, level) {
    var start = Math.max(0, Math.min(level - 1, set.pairs.length - PAIRS_PER_LEVEL));
    var pairList = set.pairs.slice(start, start + PAIRS_PER_LEVEL);
    var cardData = [];
    pairList.forEach(function (pair, index) {
      var chinese = pair[0], english = pair[1];
      cardData.push({ pairId: index, text: chinese, isChinese: true });
      cardData.push({ pairId: index, text: english, isChinese: false });
    });
    return shuffle(cardData).map(function (c) {
      return createCard(c.pairId, c.text, c.isChinese);
    });
  }

  function renderGame(set, level) {
    gameArea.innerHTML = "";
    winMessage.classList.add("hidden");
    cards = buildCardsFromSet(set, level);
    cards.forEach(function (el) { gameArea.appendChild(el); });
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    matchedCount = 0;
  }

  function handleCardClick(card) {
    if (lockBoard) return;
    if (card === firstCard) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("flipped");

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    lockBoard = true;

    const match =
      firstCard.dataset.pairId === secondCard.dataset.pairId;

    if (match) {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      matchedCount += 1;
      playSound("match");
      lockBoard = false;
      firstCard = null;
      secondCard = null;

      if (matchedCount === PAIRS_PER_LEVEL) {
        setTimeout(() => {
          playSound("win");
          showWin();
        }, 400);
      }
    } else {
      setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        lockBoard = false;
        firstCard = null;
        secondCard = null;
      }, 800);
    }
  }

  function showWin() {
    winMessage.classList.remove("hidden");
  }

  function startSet(setId) {
    var set = wordSets.find(function (s) { return s.id === setId; });
    if (!set) return;
    currentSet = set;
    currentLevel = parseInt(levelSelect.value, 10) || 1;
    renderGame(set, currentLevel);
  }

  function applyLanguage(lang) {
    uiLang = lang;
    document.title = UI[lang].title;
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.getElementById("page-title").textContent = UI[lang].heading;
    document.getElementById("instruction").textContent = UI[lang].instruction;
    document.getElementById("set-label").textContent = UI[lang].chooseSet;
    document.getElementById("level-label").textContent = UI[lang].level;
    nextBtn.textContent = UI[lang].next;
    winText.textContent = UI[lang].youDidIt;
    winNextBtn.textContent = UI[lang].next;
    document.querySelectorAll(".btn-lang").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    var names = setNames[lang];
    for (var i = 0; i < setSelect.options.length; i++) {
      var opt = setSelect.options[i];
      if (opt.value && names[opt.value]) opt.textContent = names[opt.value];
    }
  }

  function initSelector() {
    setSelect.innerHTML = "";
    wordSets.forEach(function (set) {
      var opt = document.createElement("option");
      opt.value = set.id;
      opt.textContent = setNames[uiLang][set.id] || set.name;
      setSelect.appendChild(opt);
    });
    if (wordSets.length > 0) {
      setSelect.value = wordSets[0].id;
      currentLevel = parseInt(levelSelect.value, 10) || 1;
      startSet(wordSets[0].id);
    }
  }

  function goToNextLevel() {
    if (!currentSet) return;
    winMessage.classList.add("hidden");
    currentLevel = currentLevel >= 10 ? 1 : currentLevel + 1;
    levelSelect.value = currentLevel;
    playSound("next");
    startSet(currentSet.id);
  }

  nextBtn.addEventListener("click", function () {
    goToNextLevel();
  });

  winNextBtn.addEventListener("click", function () {
    goToNextLevel();
  });

  setSelect.addEventListener("change", function () {
    startSet(setSelect.value);
  });

  levelSelect.addEventListener("change", function () {
    currentLevel = parseInt(levelSelect.value, 10) || 1;
    if (currentSet) startSet(currentSet.id);
  });

  document.getElementById("lang-en").addEventListener("click", function () {
    applyLanguage("en");
  });
  document.getElementById("lang-zh").addEventListener("click", function () {
    applyLanguage("zh");
  });

  var builtinSets = {
    sets: [
      { id: "animals", name: "Animals", pairs: [["狗", "dog"], ["猫", "cat"], ["鸟", "bird"], ["鱼", "fish"], ["兔", "rabbit"], ["马", "horse"], ["牛", "cow"], ["羊", "sheep"], ["猪", "pig"], ["鸡", "chicken"], ["鸭", "duck"], ["鼠", "mouse"], ["虎", "tiger"], ["龙", "dragon"], ["蛇", "snake"]] },
      { id: "colors", name: "Colors", pairs: [["红", "red"], ["蓝", "blue"], ["黄", "yellow"], ["绿", "green"], ["黑", "black"], ["白", "white"], ["橙", "orange"], ["紫", "purple"], ["粉", "pink"], ["棕", "brown"], ["灰", "grey"], ["金", "gold"], ["银", "silver"], ["青", "cyan"], ["米", "beige"]] },
      { id: "numbers", name: "Numbers", pairs: [["一", "one"], ["二", "two"], ["三", "three"], ["五", "five"], ["八", "eight"], ["十", "ten"], ["四", "four"], ["六", "six"], ["七", "seven"], ["九", "nine"], ["零", "zero"], ["两", "two (counting)"], ["百", "hundred"], ["千", "thousand"], ["半", "half"]] },
      { id: "family", name: "Family", pairs: [["妈妈", "mom"], ["爸爸", "dad"], ["哥哥", "older brother"], ["姐姐", "older sister"], ["弟弟", "younger brother"], ["妹妹", "younger sister"], ["爷爷", "grandpa"], ["奶奶", "grandma"], ["宝宝", "baby"], ["家", "family"], ["外公", "grandpa (maternal)"], ["外婆", "grandma (maternal)"], ["叔叔", "uncle"], ["阿姨", "aunt"], ["朋友", "friend"]] }
    ]
  };

  function loadSets() {
    wordSets = builtinSets.sets;
    initSelector();
  }

  fetch("words.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      wordSets = (data && data.sets && data.sets.length) ? data.sets : builtinSets.sets;
      initSelector();
      applyLanguage(uiLang);
    })
    .catch(function () {
      loadSets();
      applyLanguage(uiLang);
    });
})();
