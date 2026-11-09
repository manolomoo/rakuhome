/**
 * 字旅手帳 — localStorage 存取層
 * 所有 key 皆以 `zilv-` 為前綴，避免與站上其他頁面衝突。
 */

const ZILV_KEYS = {
  cards: 'zilv-cards',
  settings: 'zilv-settings',
  progress: 'zilv-progress',
  mistakes: 'zilv-mistakes',
  installedPacks: 'zilv-installed-packs',
};

const DEFAULT_SETTINGS = {
  dailyGoal: 15, // 每日目標張數
  learnLang: 'es', // 預設學習語言（新增單字／發音預設）
  theme: 'light', // light | dark
  sound: true, // 音效開關
  laxAccent: true, // 拼字驗收時，西文忽略重音的寬鬆比對
  activeFilter: 'all', // 複習／驗收時使用的詞庫篩選：all | <packId>
};

const DEFAULT_PROGRESS = {
  xp: 0,
  streak: 0,
  lastActiveDate: '', // YYYY-MM-DD，用於計算連續天數
  badges: [], // 已解鎖成就 id 陣列
  totalReviews: 0,
  totalQuizCorrect: 0,
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredCloneFallback(fallback);
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn('[字旅手帳] 讀取 localStorage 失敗：', key, err);
    return structuredCloneFallback(fallback);
  }
}

function structuredCloneFallback(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('[字旅手帳] 寫入 localStorage 失敗：', key, err);
  }
}

const ZilvStorage = {
  /* ------------------------------ 卡片 ------------------------------ */
  getCards() {
    return readJSON(ZILV_KEYS.cards, []);
  },
  saveCards(cards) {
    writeJSON(ZILV_KEYS.cards, cards);
  },
  addCards(newCards) {
    const cards = this.getCards();
    const existingIds = new Set(cards.map((c) => c.id));
    let added = 0;
    newCards.forEach((card) => {
      if (!existingIds.has(card.id)) {
        cards.push(card);
        existingIds.add(card.id);
        added += 1;
      }
    });
    this.saveCards(cards);
    return added;
  },
  updateCard(id, patch) {
    const cards = this.getCards();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    cards[idx] = { ...cards[idx], ...patch };
    this.saveCards(cards);
    return cards[idx];
  },
  deleteCard(id) {
    const cards = this.getCards().filter((c) => c.id !== id);
    this.saveCards(cards);
    this.removeMistake(id);
  },

  /* ------------------------------ 設定 ------------------------------ */
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...readJSON(ZILV_KEYS.settings, DEFAULT_SETTINGS) };
  },
  saveSettings(settings) {
    writeJSON(ZILV_KEYS.settings, settings);
  },
  updateSettings(patch) {
    const settings = { ...this.getSettings(), ...patch };
    this.saveSettings(settings);
    return settings;
  },

  /* ------------------------------ 進度 ------------------------------ */
  getProgress() {
    return { ...DEFAULT_PROGRESS, ...readJSON(ZILV_KEYS.progress, DEFAULT_PROGRESS) };
  },
  saveProgress(progress) {
    writeJSON(ZILV_KEYS.progress, progress);
  },
  updateProgress(patch) {
    const progress = { ...this.getProgress(), ...patch };
    this.saveProgress(progress);
    return progress;
  },

  /* ------------------------------ 錯題本 ------------------------------ */
  getMistakes() {
    return readJSON(ZILV_KEYS.mistakes, []); // [{ cardId, missedAt }]
  },
  saveMistakes(mistakes) {
    writeJSON(ZILV_KEYS.mistakes, mistakes);
  },
  addMistake(cardId) {
    const mistakes = this.getMistakes().filter((m) => m.cardId !== cardId);
    mistakes.unshift({ cardId, missedAt: Date.now() });
    this.saveMistakes(mistakes);
  },
  removeMistake(cardId) {
    const mistakes = this.getMistakes().filter((m) => m.cardId !== cardId);
    this.saveMistakes(mistakes);
  },

  /* ------------------------------ 已匯入詞庫 ------------------------------ */
  getInstalledPacks() {
    return readJSON(ZILV_KEYS.installedPacks, []);
  },
  markPackInstalled(packId) {
    const packs = new Set(this.getInstalledPacks());
    packs.add(packId);
    writeJSON(ZILV_KEYS.installedPacks, Array.from(packs));
  },

  /* ------------------------------ 備份 ------------------------------ */
  exportAll() {
    return {
      schema: 1,
      exportedAt: new Date().toISOString(),
      cards: this.getCards(),
      settings: this.getSettings(),
      progress: this.getProgress(),
      mistakes: this.getMistakes(),
      installedPacks: this.getInstalledPacks(),
    };
  },
  importAll(data) {
    if (!data || typeof data !== 'object') throw new Error('備份檔格式錯誤');
    if (Array.isArray(data.cards)) this.saveCards(data.cards);
    if (data.settings) this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    if (data.progress) this.saveProgress({ ...DEFAULT_PROGRESS, ...data.progress });
    if (Array.isArray(data.mistakes)) this.saveMistakes(data.mistakes);
    if (Array.isArray(data.installedPacks)) writeJSON(ZILV_KEYS.installedPacks, data.installedPacks);
  },

  /* ------------------------------ 重設 ------------------------------ */
  resetProgressOnly() {
    // 保留卡片，重置排程、進度、錯題本
    const cards = this.getCards().map((c) => ({ ...c, srs: undefined }));
    this.saveCards(cards);
    this.saveProgress(structuredCloneFallback(DEFAULT_PROGRESS));
    this.saveMistakes([]);
  },
  resetEverything() {
    Object.values(ZILV_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

window.ZilvStorage = ZilvStorage;
