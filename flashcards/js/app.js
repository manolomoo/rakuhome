/**
 * 字旅手帳 — 主程式
 * 純前端 SPA：以 data-view / hash 做簡易路由，所有資料存在 localStorage。
 */

const VIEWS = ['home', 'review', 'quiz', 'library', 'add', 'mistakes', 'settings'];

const BADGES = [
  { id: 'first-review', name: '初次複習', desc: '完成第一次翻卡複習', check: (p) => p.totalReviews >= 1 },
  { id: 'streak-7', name: '連續 7 天', desc: '連續學習 7 天', check: (p) => p.streak >= 7 },
  { id: 'streak-30', name: '連續 30 天', desc: '連續學習 30 天', check: (p) => p.streak >= 30 },
  { id: 'mastered-50', name: '記熟 50 字', desc: '累積 50 張卡片到達 30 天階', check: (p, cards) => countMastered(cards) >= 50 },
  { id: 'collector-100', name: '百字收藏', desc: '卡片庫累積達 100 張', check: (p, cards) => cards.length >= 100 },
  { id: 'quiz-ace', name: '驗收達人', desc: '驗收模式累積答對 100 題', check: (p) => p.totalQuizCorrect >= 100 },
];

// ------------------------------------------------------------------
// 全域狀態（僅存在於記憶體中，重新整理後由 localStorage 重建）
// ------------------------------------------------------------------
const state = {
  currentView: 'home',
  review: null, // { queue, index, remember, forget, xp }
  quiz: { mode: 'choice', queue: [], index: 0, score: 0, total: 0, current: null, roundXp: 0 },
  mp: null, // 錯題本練習： { queue, index }
  audioCtx: null,
};

/* ============================= 共用小工具 ============================= */

function $(id) {
  return document.getElementById(id);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function countMastered(cards) {
  return cards.filter((c) => ZilvSRS.isMastered(c)).length;
}

function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

function filterCardsByPack(cards, filterValue) {
  if (!filterValue || filterValue === 'all') return cards;
  return cards.filter((c) => c.pack === filterValue);
}

function packDisplayName(packId) {
  if (packId === 'custom') return '自訂單字';
  const pack = (window.ZILV_BUILTIN_PACKS || []).find((p) => p.id === packId);
  return pack ? pack.name : packId;
}

function langLabel(lang) {
  return { es: 'ES', en: 'EN', ja: 'JA' }[lang] || lang.toUpperCase();
}

let toastTimer = null;
function showToast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('toast--show'), 2600);
}

/** 以 WebAudio 合成極短提示音，不需任何外部音檔 */
function playTone(freq, durationMs) {
  const settings = ZilvStorage.getSettings();
  if (!settings.sound) return;
  try {
    if (!state.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new Ctx();
    }
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    // 部分瀏覽器需使用者互動後才允許 AudioContext，失敗時靜默忽略即可
  }
}
const soundFlip = () => playTone(520, 90);
const soundCorrect = () => playTone(880, 150);
const soundWrong = () => playTone(220, 180);

/* ============================= 進度 / XP / 成就 ============================= */

function addXp(amount) {
  const progress = ZilvStorage.getProgress();
  ZilvStorage.updateProgress({ xp: progress.xp + amount });
}

function touchStreak() {
  const progress = ZilvStorage.getProgress();
  const today = todayStr();
  if (progress.lastActiveDate === today) return;
  const yesterday = todayStr(new Date(Date.now() - 86400000));
  const streak = progress.lastActiveDate === yesterday ? progress.streak + 1 : 1;
  ZilvStorage.updateProgress({ streak, lastActiveDate: today });
}

function checkBadges() {
  const progress = ZilvStorage.getProgress();
  const cards = ZilvStorage.getCards();
  const unlocked = new Set(progress.badges || []);
  let changed = false;
  BADGES.forEach((badge) => {
    if (!unlocked.has(badge.id) && badge.check(progress, cards)) {
      unlocked.add(badge.id);
      changed = true;
      showToast(`🏅 解鎖成就：${badge.name}`);
    }
  });
  if (changed) ZilvStorage.updateProgress({ badges: Array.from(unlocked) });
}

/* ============================= 路由 ============================= */

function navigate(view) {
  if (!VIEWS.includes(view)) view = 'home';
  VIEWS.forEach((v) => {
    $(`view-${v}`).hidden = v !== view;
  });
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.navto === view);
  });
  state.currentView = view;
  if (location.hash !== `#${view}`) location.hash = view;
  onViewEnter(view);
}

function onViewEnter(view) {
  if (view === 'home') renderHome();
  else if (view === 'review') startReview();
  else if (view === 'quiz') startQuizRound();
  else if (view === 'library') renderLibrary();
  else if (view === 'add') renderAddImportList();
  else if (view === 'mistakes') renderMistakes();
  else if (view === 'settings') renderSettings();
}

function wireGlobalNav() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-navto]');
    if (target) navigate(target.dataset.navto);
  });
}

/* ============================= 詞庫下拉選單 ============================= */

function buildPackOptionsHtml({ includeAll = true, includeCustom = true } = {}) {
  let html = '';
  if (includeAll) html += '<option value="all">全部詞庫</option>';
  (window.ZILV_BUILTIN_PACKS || []).forEach((p) => {
    html += `<option value="${p.id}">${p.name}</option>`;
  });
  if (includeCustom) html += '<option value="custom">自訂單字</option>';
  return html;
}

function populateAllPackSelects() {
  $('home-filter').innerHTML = buildPackOptionsHtml();
  $('quiz-filter').innerHTML = buildPackOptionsHtml();
  $('lib-filter-pack').innerHTML = buildPackOptionsHtml();
  const settings = ZilvStorage.getSettings();
  $('home-filter').value = settings.activeFilter;
}

/* ============================= 首頁儀表板 ============================= */

function renderHome() {
  const cards = ZilvStorage.getCards();
  const settings = ZilvStorage.getSettings();
  const progress = ZilvStorage.getProgress();

  $('home-filter').value = settings.activeFilter;
  const pool = filterCardsByPack(cards, settings.activeFilter);
  const due = ZilvSRS.dueCards(pool).length;

  $('stat-due').textContent = String(due);
  $('stat-streak').textContent = String(progress.streak);
  $('stat-mastered').textContent = String(countMastered(cards));
  $('stat-level').textContent = `Lv.${levelFromXp(progress.xp)}`;
  $('xp-text').textContent = `${progress.xp} XP`;
  $('xp-bar-fill').style.width = `${progress.xp % 100}%`;

  const mistakesCount = ZilvStorage.getMistakes().length;
  $('mistakes-count-home').textContent = String(mistakesCount);

  renderBadgeStrip();
}

function renderBadgeStrip() {
  const progress = ZilvStorage.getProgress();
  const unlocked = BADGES.filter((b) => (progress.badges || []).includes(b.id));
  const strip = $('badge-strip');
  if (!unlocked.length) {
    strip.innerHTML = '<p class="badge-strip__empty">完成複習與驗收即可解鎖徽章</p>';
    return;
  }
  strip.innerHTML = unlocked
    .map((b) => `<span class="badge-chip" title="${b.desc}">🏅 ${b.name}</span>`)
    .join('');
}

function wireHome() {
  $('home-filter').addEventListener('change', (e) => {
    ZilvStorage.updateSettings({ activeFilter: e.target.value });
    renderHome();
  });
  $('btn-start-review').addEventListener('click', () => navigate('review'));
}

/* ============================= 翻卡複習 ============================= */

function startReview() {
  const settings = ZilvStorage.getSettings();
  const cards = ZilvStorage.getCards();
  const pool = filterCardsByPack(cards, settings.activeFilter);
  const due = shuffle(ZilvSRS.dueCards(pool));

  state.review = { queue: due, index: 0, remember: 0, forget: 0, xp: 0 };
  $('review-summary').hidden = true;

  if (!due.length) {
    $('review-empty').hidden = false;
    $('review-stage').hidden = true;
    return;
  }
  $('review-empty').hidden = true;
  $('review-stage').hidden = false;
  renderReviewCard();
}

function renderReviewCard() {
  const { queue, index } = state.review;
  const card = queue[index];
  $('review-card').classList.remove('is-flipped');
  $('review-front-lang').textContent = langLabel(card.lang);
  $('review-front-term').textContent = card.term;
  $('review-front-reading').textContent = card.reading || '';
  $('review-back-meaning').textContent = card.meaning;
  $('review-back-example').textContent = card.example || '';
  $('review-progress').textContent = `${index + 1} / ${queue.length}`;
  $('review-grade-row').hidden = true;
  $('review-flip-btn').hidden = false;
}

function flipReviewCard() {
  if (!state.review || !state.review.queue.length) return;
  const el = $('review-card');
  const willFlip = !el.classList.contains('is-flipped');
  el.classList.toggle('is-flipped');
  soundFlip();
  $('review-grade-row').hidden = !willFlip;
  $('review-flip-btn').hidden = willFlip;
}

function gradeReviewCard(result) {
  if (!state.review) return;
  const { queue, index } = state.review;
  const card = queue[index];
  const newSrs = ZilvSRS.review(card, result);
  ZilvStorage.updateCard(card.id, { srs: newSrs });

  const xpGain = result === 'remember' ? 2 : 1;
  state.review[result === 'remember' ? 'remember' : 'forget'] += 1;
  state.review.xp += xpGain;
  addXp(xpGain);
  touchStreak();
  const progress = ZilvStorage.getProgress();
  ZilvStorage.updateProgress({ totalReviews: progress.totalReviews + 1 });
  checkBadges();

  if (result === 'remember') soundCorrect();

  state.review.index += 1;
  if (state.review.index >= queue.length) finishReview();
  else renderReviewCard();
}

function finishReview() {
  $('review-stage').hidden = true;
  $('review-summary').hidden = false;
  $('review-summary-remember').textContent = String(state.review.remember);
  $('review-summary-forget').textContent = String(state.review.forget);
  $('review-summary-xp').textContent = String(state.review.xp);
}

function wireReview() {
  $('review-card').addEventListener('click', flipReviewCard);
  $('review-flip-btn').addEventListener('click', flipReviewCard);
  $('review-btn-forget').addEventListener('click', () => gradeReviewCard('forget'));
  $('review-btn-remember').addEventListener('click', () => gradeReviewCard('remember'));
  $('review-pronounce').addEventListener('click', (e) => {
    e.stopPropagation();
    const card = state.review && state.review.queue[state.review.index];
    if (!card) return;
    if (!ZilvTTS.speak(card.term, card.lang)) showToast('此裝置不支援語音合成');
  });

  document.addEventListener('keydown', (e) => {
    if (state.currentView !== 'review' || !state.review || !state.review.queue.length) return;
    const flipped = $('review-card').classList.contains('is-flipped');
    if (e.code === 'Space') {
      e.preventDefault();
      flipReviewCard();
    } else if (flipped && (e.code === 'ArrowLeft')) {
      gradeReviewCard('forget');
    } else if (flipped && (e.code === 'ArrowRight')) {
      gradeReviewCard('remember');
    }
  });
}

/* ============================= 驗收模式（選擇題／拼字／聽音選字） ============================= */

function buildChoiceOptions(card, field, filteredPool, allCards) {
  const correctText = card[field];
  const seen = new Set([correctText]);
  const distractors = [];

  function tryPool(poolArr) {
    shuffle(poolArr).forEach((c) => {
      if (distractors.length < 3 && c.id !== card.id && c[field] && !seen.has(c[field])) {
        distractors.push(c[field]);
        seen.add(c[field]);
      }
    });
  }

  tryPool(filteredPool);
  if (distractors.length < 3) tryPool(allCards);
  return shuffle([correctText, ...distractors]);
}

function startQuizRound() {
  const filter = $('quiz-filter').value || 'all';
  const mode = state.quiz.mode;
  const cards = ZilvStorage.getCards();
  const pool = filterCardsByPack(cards, filter);
  const minNeeded = mode === 'spelling' ? 1 : 4;

  $('quiz-summary').hidden = true;

  if (pool.length < minNeeded) {
    $('quiz-empty').hidden = false;
    $('quiz-stage').hidden = true;
    return;
  }
  $('quiz-empty').hidden = true;
  $('quiz-stage').hidden = false;

  const roundSize = Math.min(10, pool.length);
  state.quiz.pool = pool;
  state.quiz.allCards = cards;
  state.quiz.queue = shuffle(pool).slice(0, roundSize);
  state.quiz.index = 0;
  state.quiz.score = 0;
  state.quiz.total = 0;
  state.quiz.roundXp = 0;

  $('quiz-direction-field').hidden = mode !== 'choice';
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { queue, index, mode } = state.quiz;
  const card = queue[index];
  state.quiz.current = card;

  $('quiz-progress').textContent = `${index + 1} / ${queue.length}`;
  $('quiz-score').textContent = String(state.quiz.score);
  $('quiz-lang-tag').textContent = langLabel(card.lang);
  $('quiz-options').innerHTML = '';
  $('quiz-listen-controls').hidden = true;
  $('quiz-spell-controls').hidden = true;
  $('quiz-prompt-reading').textContent = '';

  if (mode === 'choice') {
    const direction = $('quiz-direction').value;
    const field = direction === 'fl2cn' ? 'meaning' : 'term';
    $('quiz-prompt').textContent = direction === 'fl2cn' ? card.term : card.meaning;
    $('quiz-prompt-reading').textContent = direction === 'fl2cn' ? (card.reading || '') : '';
    renderOptions(buildChoiceOptions(card, field, state.quiz.pool, state.quiz.allCards), card[field]);
  } else if (mode === 'spelling') {
    $('quiz-prompt').textContent = card.meaning;
    $('quiz-prompt-reading').textContent = card.example || '';
    $('quiz-spell-controls').hidden = false;
    const input = $('quiz-spell-input');
    input.value = '';
    input.disabled = false;
    $('quiz-spell-feedback').textContent = '';
    setTimeout(() => input.focus(), 50);
  } else if (mode === 'listen') {
    $('quiz-prompt').textContent = '🔊 聽聽看，這是什麼意思？';
    $('quiz-listen-controls').hidden = false;
    const canSpeak = ZilvTTS.canSpeak();
    $('quiz-listen-fallback').hidden = canSpeak;
    if (!canSpeak) {
      $('quiz-listen-fallback').textContent = `此裝置不支援語音合成，已改為直接顯示外語詞：「${card.term}」`;
    } else {
      ZilvTTS.speak(card.term, card.lang);
    }
    renderOptions(buildChoiceOptions(card, 'meaning', state.quiz.pool, state.quiz.allCards), card.meaning);
  }
}

function renderOptions(options, correctText) {
  const wrap = $('quiz-options');
  wrap.innerHTML = '';
  options.forEach((optText) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = optText;
    btn.addEventListener('click', () => handleOptionClick(btn, optText, correctText));
    wrap.appendChild(btn);
  });
}

function handleOptionClick(btn, chosenText, correctText) {
  const wrap = $('quiz-options');
  if (wrap.classList.contains('is-locked')) return;
  wrap.classList.add('is-locked');
  const isCorrect = chosenText === correctText;
  btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
  if (!isCorrect) {
    Array.from(wrap.children).forEach((c) => {
      if (c.textContent === correctText) c.classList.add('is-correct');
    });
  }
  handleQuizAnswer(isCorrect);
  setTimeout(() => {
    wrap.classList.remove('is-locked');
    advanceQuiz();
  }, 900);
}

function stripDiacritics(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeSpelling(str, lang, laxAccent) {
  let s = (str || '').trim().toLowerCase();
  if (lang === 'es' && laxAccent) s = stripDiacritics(s);
  return s;
}

function submitSpelling() {
  const input = $('quiz-spell-input');
  if (input.disabled) return;
  const card = state.quiz.current;
  const settings = ZilvStorage.getSettings();
  const target = card.lang === 'ja' ? card.reading : card.term;
  const isCorrect = normalizeSpelling(input.value, card.lang, settings.laxAccent)
    === normalizeSpelling(target, card.lang, settings.laxAccent);

  input.disabled = true;
  $('quiz-spell-feedback').textContent = isCorrect ? '✅ 正確！' : `❌ 正確答案：${target}`;
  $('quiz-spell-feedback').className = `spell-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;
  handleQuizAnswer(isCorrect);
  setTimeout(advanceQuiz, 1100);
}

function handleQuizAnswer(isCorrect) {
  const card = state.quiz.current;
  state.quiz.total += 1;
  if (isCorrect) {
    state.quiz.score += 1;
    state.quiz.roundXp += 3;
    addXp(3);
    ZilvStorage.removeMistake(card.id);
    const progress = ZilvStorage.getProgress();
    ZilvStorage.updateProgress({ totalQuizCorrect: progress.totalQuizCorrect + 1 });
    soundCorrect();
  } else {
    ZilvStorage.addMistake(card.id);
    soundWrong();
  }
  touchStreak();
  checkBadges();
}

function advanceQuiz() {
  state.quiz.index += 1;
  if (state.quiz.index >= state.quiz.queue.length) finishQuizRound();
  else renderQuizQuestion();
}

function finishQuizRound() {
  $('quiz-stage').hidden = true;
  $('quiz-summary').hidden = false;
  $('quiz-summary-correct').textContent = String(state.quiz.score);
  $('quiz-summary-total').textContent = String(state.quiz.total);
  $('quiz-summary-xp').textContent = String(state.quiz.roundXp);
}

function wireQuiz() {
  $('quiz-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#quiz-tabs .tab-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    state.quiz.mode = btn.dataset.mode;
    startQuizRound();
  });
  $('quiz-filter').addEventListener('change', startQuizRound);
  $('quiz-direction').addEventListener('change', startQuizRound);
  $('quiz-listen-play').addEventListener('click', () => {
    const card = state.quiz.current;
    if (card) ZilvTTS.speak(card.term, card.lang);
  });
  $('quiz-spell-submit').addEventListener('click', submitSpelling);
  $('quiz-spell-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitSpelling();
  });
  $('quiz-summary-retry').addEventListener('click', startQuizRound);
}

/* ============================= 卡片庫 ============================= */

function renderLibrary() {
  populateCategorySelect();
  const search = $('lib-search').value.trim().toLowerCase();
  const packFilter = $('lib-filter-pack').value;
  const categoryFilter = $('lib-filter-category').value;

  let cards = ZilvStorage.getCards();
  if (packFilter && packFilter !== 'all') cards = cards.filter((c) => c.pack === packFilter);
  if (categoryFilter && categoryFilter !== 'all') cards = cards.filter((c) => c.category === categoryFilter);
  if (search) {
    cards = cards.filter(
      (c) => c.term.toLowerCase().includes(search) || c.meaning.toLowerCase().includes(search)
    );
  }

  $('lib-count').textContent = `共 ${cards.length} 張卡片`;
  $('lib-empty').hidden = cards.length > 0 || !!search;
  if (!cards.length && search) {
    $('lib-list').innerHTML = '<li class="card-list__empty">找不到符合的卡片</li>';
    return;
  }

  $('lib-list').innerHTML = cards
    .map((c) => {
      const stageLabel = !c.srs
        ? '新卡'
        : ZilvSRS.isMastered(c)
          ? '已記熟'
          : `複習中・第 ${c.srs.stage} 階`;
      return `
        <li class="card-item" data-id="${c.id}">
          <span class="lang-tag lang-tag--sm">${langLabel(c.lang)}</span>
          <div class="card-item__body">
            <p class="card-item__term">${escapeHtml(c.term)} ${c.reading ? `<span class="card-item__reading">(${escapeHtml(c.reading)})</span>` : ''}</p>
            <p class="card-item__meaning">${escapeHtml(c.meaning)}</p>
            <p class="card-item__meta">${escapeHtml(c.category || packDisplayName(c.pack))}・${stageLabel}</p>
          </div>
          <button class="icon-btn icon-btn--sound" data-action="sound" aria-label="播放發音">🔊</button>
          <button class="icon-btn icon-btn--danger" data-action="delete" aria-label="刪除卡片">✕</button>
        </li>`;
    })
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function populateCategorySelect() {
  const packFilter = $('lib-filter-pack').value;
  let cards = ZilvStorage.getCards();
  if (packFilter && packFilter !== 'all') cards = cards.filter((c) => c.pack === packFilter);
  const categories = Array.from(new Set(cards.map((c) => c.category).filter(Boolean))).sort();
  const current = $('lib-filter-category').value;
  $('lib-filter-category').innerHTML = `<option value="all">全部分類</option>${categories
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join('')}`;
  if (categories.includes(current)) $('lib-filter-category').value = current;
}

function wireLibrary() {
  $('lib-search').addEventListener('input', renderLibrary);
  $('lib-filter-pack').addEventListener('change', renderLibrary);
  $('lib-filter-category').addEventListener('change', renderLibrary);

  $('lib-list').addEventListener('click', (e) => {
    const li = e.target.closest('.card-item');
    if (!li) return;
    const id = li.dataset.id;
    const card = ZilvStorage.getCards().find((c) => c.id === id);
    if (!card) return;
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'sound') {
      if (!ZilvTTS.speak(card.term, card.lang)) showToast('此裝置不支援語音合成');
    } else if (action.dataset.action === 'delete') {
      if (window.confirm(`確定要刪除「${card.term}」這張卡片嗎？此操作無法復原。`)) {
        ZilvStorage.deleteCard(id);
        renderLibrary();
        showToast('已刪除卡片');
      }
    }
  });
}

/* ============================= 新增單字 ============================= */

function renderAddImportList() {
  const installed = new Set(ZilvStorage.getInstalledPacks());
  const existingIds = new Set(ZilvStorage.getCards().map((c) => c.id));
  $('add-import-list').innerHTML = (window.ZILV_BUILTIN_PACKS || [])
    .map((pack) => {
      const haveCount = pack.cards.filter((c) => existingIds.has(c.id)).length;
      const fullyImported = haveCount === pack.cards.length;
      return `
        <div class="pack-item">
          <div class="pack-item__info">
            <p class="pack-item__name">${pack.name}</p>
            <p class="pack-item__desc">${pack.description}</p>
            <p class="pack-item__count">${haveCount} / ${pack.cards.length} 已加入${installed.has(pack.id) ? '' : ''}</p>
          </div>
          <button class="btn ${fullyImported ? 'btn--outline' : 'btn--primary'} btn--small" data-pack="${pack.id}" type="button">
            ${fullyImported ? '已匯入' : '匯入'}
          </button>
        </div>`;
    })
    .join('');
}

function wireAdd() {
  $('add-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#add-tabs .tab-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    ['import', 'manual', 'batch'].forEach((name) => {
      $(`add-panel-${name}`).hidden = name !== btn.dataset.tab;
    });
  });

  $('add-import-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pack]');
    if (!btn) return;
    const pack = (window.ZILV_BUILTIN_PACKS || []).find((p) => p.id === btn.dataset.pack);
    if (!pack) return;
    const added = ZilvStorage.addCards(pack.cards);
    ZilvStorage.markPackInstalled(pack.id);
    checkBadges();
    renderAddImportList();
    showToast(added > 0 ? `已加入 ${added} 張卡片（${pack.name}）` : '這個詞庫已經全部加入過了');
  });

  $('add-manual-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const term = $('manual-term').value.trim();
    const meaning = $('manual-meaning').value.trim();
    if (!term || !meaning) return;
    const card = {
      id: `custom__${term.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      pack: 'custom',
      lang: $('manual-lang').value,
      term,
      meaning,
      reading: $('manual-reading').value.trim(),
      category: $('manual-category').value.trim() || '自訂',
      example: $('manual-example').value.trim(),
    };
    ZilvStorage.addCards([card]);
    checkBadges();
    e.target.reset();
    showToast(`已新增「${term}」`);
  });

  $('batch-text').addEventListener('input', updateBatchPreview);
  $('batch-submit').addEventListener('click', submitBatchAdd);
}

function parseBatchLines(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const valid = [];
  let invalid = 0;
  lines.forEach((line) => {
    let parts = line.includes('|') ? line.split('|') : line.split(',');
    parts = parts.map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      valid.push({ term: parts[0], meaning: parts[1] });
    } else {
      invalid += 1;
    }
  });
  return { valid, invalid };
}

function updateBatchPreview() {
  const { valid, invalid } = parseBatchLines($('batch-text').value);
  if (!valid.length && !invalid) {
    $('batch-preview').textContent = '尚未輸入內容';
    return;
  }
  $('batch-preview').textContent = `偵測到 ${valid.length} 組可加入的單字${invalid ? `（${invalid} 行格式有誤已忽略）` : ''}`;
}

function submitBatchAdd() {
  const { valid } = parseBatchLines($('batch-text').value);
  if (!valid.length) {
    showToast('沒有偵測到可加入的單字，請確認格式');
    return;
  }
  const lang = $('batch-lang').value;
  const category = $('batch-category').value.trim() || '自訂';
  const cards = valid.map((v, i) => ({
    id: `custom__${v.term.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
    pack: 'custom',
    lang,
    term: v.term,
    meaning: v.meaning,
    reading: '',
    category,
    example: '',
  }));
  const added = ZilvStorage.addCards(cards);
  checkBadges();
  $('batch-text').value = '';
  updateBatchPreview();
  showToast(`已加入 ${added} 張卡片`);
}

/* ============================= 錯題本 ============================= */

function renderMistakes() {
  const mistakes = ZilvStorage.getMistakes();
  const cards = ZilvStorage.getCards();
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  // 清除已被刪除卡片的殘留錯題紀錄
  const stale = mistakes.filter((m) => !cardMap.has(m.cardId));
  if (stale.length) {
    stale.forEach((m) => ZilvStorage.removeMistake(m.cardId));
  }
  const valid = mistakes.filter((m) => cardMap.has(m.cardId));

  $('mistakes-empty').hidden = valid.length > 0;
  $('mistakes-list-wrap').hidden = valid.length === 0;
  $('mistakes-practice').hidden = true;

  $('mistakes-list').innerHTML = valid
    .map((m) => {
      const c = cardMap.get(m.cardId);
      return `
        <li class="card-item" data-id="${c.id}">
          <span class="lang-tag lang-tag--sm">${langLabel(c.lang)}</span>
          <div class="card-item__body">
            <p class="card-item__term">${escapeHtml(c.term)}</p>
            <p class="card-item__meaning">${escapeHtml(c.meaning)}</p>
          </div>
        </li>`;
    })
    .join('');
}

function startMistakePractice() {
  const mistakes = ZilvStorage.getMistakes();
  const allCards = ZilvStorage.getCards();
  const cardMap = new Map(allCards.map((c) => [c.id, c]));
  const queue = shuffle(mistakes.map((m) => cardMap.get(m.cardId)).filter(Boolean));

  if (allCards.length < 4) {
    showToast('卡片不足，請先新增更多單字再練習');
    return;
  }
  if (!queue.length) {
    showToast('目前沒有錯題可以練習');
    return;
  }

  state.mp = { queue, index: 0, allCards };
  $('mistakes-list-wrap').hidden = true;
  $('mistakes-practice').hidden = false;
  renderMpQuestion();
}

function renderMpQuestion() {
  const { queue, index, allCards } = state.mp;
  const card = queue[index];
  $('mp-progress').textContent = `${index + 1} / ${queue.length}`;
  $('mp-lang-tag').textContent = langLabel(card.lang);
  $('mp-prompt').textContent = card.term;

  const options = buildChoiceOptions(card, 'meaning', allCards, allCards);
  const wrap = $('mp-options');
  wrap.innerHTML = '';
  options.forEach((optText) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = optText;
    btn.addEventListener('click', () => {
      if (wrap.classList.contains('is-locked')) return;
      wrap.classList.add('is-locked');
      const isCorrect = optText === card.meaning;
      btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      if (!isCorrect) {
        Array.from(wrap.children).forEach((c2) => {
          if (c2.textContent === card.meaning) c2.classList.add('is-correct');
        });
      }
      if (isCorrect) {
        soundCorrect();
        ZilvStorage.removeMistake(card.id);
        addXp(1);
        touchStreak();
      } else {
        soundWrong();
      }
      setTimeout(() => {
        wrap.classList.remove('is-locked');
        state.mp.index += 1;
        if (state.mp.index >= queue.length) {
          showToast('錯題練習完成！');
          renderMistakes();
        } else {
          renderMpQuestion();
        }
      }, 900);
    });
    wrap.appendChild(btn);
  });
}

function wireMistakes() {
  $('mistakes-practice-btn').addEventListener('click', startMistakePractice);
  $('mp-exit').addEventListener('click', () => {
    $('mistakes-practice').hidden = true;
    renderMistakes();
  });
}

/* ============================= 設定 ============================= */

function applyTheme() {
  const settings = ZilvStorage.getSettings();
  document.documentElement.setAttribute('data-theme', settings.theme);
}

function renderSettings() {
  const settings = ZilvStorage.getSettings();
  $('set-daily-goal').value = settings.dailyGoal;
  $('set-learn-lang').value = settings.learnLang;
  $('set-theme-dark').checked = settings.theme === 'dark';
  $('set-sound').checked = settings.sound;
  $('set-lax-accent').checked = settings.laxAccent;
  renderAchievements();
}

function renderAchievements() {
  const progress = ZilvStorage.getProgress();
  const unlocked = new Set(progress.badges || []);
  $('set-achievements').innerHTML = BADGES
    .map(
      (b) => `
      <div class="badge-tile ${unlocked.has(b.id) ? 'is-unlocked' : ''}">
        <span class="badge-tile__icon">${unlocked.has(b.id) ? '🏅' : '🔒'}</span>
        <span class="badge-tile__name">${b.name}</span>
        <span class="badge-tile__desc">${b.desc}</span>
      </div>`
    )
    .join('');
}

function wireSettings() {
  $('set-daily-goal').addEventListener('change', (e) => {
    const v = Math.max(1, Math.min(200, Number(e.target.value) || 15));
    ZilvStorage.updateSettings({ dailyGoal: v });
    e.target.value = v;
  });
  $('set-learn-lang').addEventListener('change', (e) => {
    ZilvStorage.updateSettings({ learnLang: e.target.value });
  });
  $('set-theme-dark').addEventListener('change', (e) => {
    ZilvStorage.updateSettings({ theme: e.target.checked ? 'dark' : 'light' });
    applyTheme();
  });
  $('set-sound').addEventListener('change', (e) => {
    ZilvStorage.updateSettings({ sound: e.target.checked });
  });
  $('set-lax-accent').addEventListener('change', (e) => {
    ZilvStorage.updateSettings({ laxAccent: e.target.checked });
  });

  $('btn-toggle-theme').addEventListener('click', () => {
    const settings = ZilvStorage.getSettings();
    ZilvStorage.updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
    applyTheme();
    if (state.currentView === 'settings') renderSettings();
  });

  $('set-export-btn').addEventListener('click', () => {
    const data = ZilvStorage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zilv-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $('set-import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!window.confirm('匯入將覆蓋目前的卡片與進度資料，確定要繼續嗎？')) return;
        ZilvStorage.importAll(data);
        showToast('已匯入備份資料');
        populateAllPackSelects();
        renderSettings();
        if (state.currentView === 'home') renderHome();
      } catch (err) {
        showToast('匯入失敗：檔案格式不正確');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('set-reset-progress').addEventListener('click', () => {
    if (!window.confirm('將重設所有複習排程、經驗值與成就，但保留卡片內容。確定要繼續嗎？')) return;
    ZilvStorage.resetProgressOnly();
    showToast('已重設進度（卡片已保留）');
    renderSettings();
  });

  $('set-reset-all').addEventListener('click', () => {
    if (!window.confirm('將完全清空所有卡片與進度，此操作無法復原！確定要繼續嗎？')) return;
    ZilvStorage.resetEverything();
    showToast('已完全重設');
    populateAllPackSelects();
    renderSettings();
  });
}

/* ============================= 啟動 ============================= */

function init() {
  ZilvTTS.warmUp();
  applyTheme();
  populateAllPackSelects();
  wireGlobalNav();
  wireHome();
  wireReview();
  wireQuiz();
  wireLibrary();
  wireAdd();
  wireMistakes();
  wireSettings();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* 離線快取為加分功能，註冊失敗不影響主要功能 */
    });
  }

  const initialView = (location.hash || '#home').replace('#', '');
  navigate(VIEWS.includes(initialView) ? initialView : 'home');
}

document.addEventListener('DOMContentLoaded', init);
