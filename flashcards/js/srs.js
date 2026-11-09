/**
 * 字旅手帳 — 艾賓浩斯間隔複習排程
 * 階段對應天數：1 → 3 → 7 → 14 → 30
 * stage = 0 代表全新卡片（立即到期）；stage 1~5 對應上面五個間隔，
 * stage 5（30 天）視為「已記熟」。
 * 自評「不熟」時後退兩階（最低回到 0），讓間隔明顯縮短；
 * 自評「記得」時前進一階，最高停在 30 天階。
 */

const SRS_STAGE_DAYS = [1, 3, 7, 14, 30];
const SRS_MAX_STAGE = SRS_STAGE_DAYS.length; // 5 = 已記熟
const DAY_MS = 24 * 60 * 60 * 1000;

const ZilvSRS = {
  MAX_STAGE: SRS_MAX_STAGE,

  /** 建立一張新卡片的排程資料 */
  createState() {
    return {
      stage: 0,
      dueAt: Date.now(),
      reps: 0,
      lapses: 0,
      lastResult: null,
      lastReviewedAt: null,
    };
  },

  /** 卡片是否已到期（尚未安排過排程的卡片視為到期） */
  isDue(card, now = Date.now()) {
    if (!card.srs) return true;
    return card.srs.dueAt <= now;
  },

  /** 是否已到達「記熟」階（30 天階） */
  isMastered(card) {
    return !!card.srs && card.srs.stage >= SRS_MAX_STAGE;
  },

  /** 依自評結果更新排程，回傳更新後的 srs 物件（不會修改傳入物件） */
  review(card, result) {
    const prev = card.srs || this.createState();
    let stage = prev.stage;
    const lapses = prev.lapses || 0;

    if (result === 'remember') {
      stage = Math.min(stage + 1, SRS_MAX_STAGE);
    } else {
      stage = Math.max(stage - 2, 0);
    }

    // stage 0 時仍給 1 天緩衝，避免同一天內無限重複出現
    const intervalDays = stage === 0 ? SRS_STAGE_DAYS[0] : SRS_STAGE_DAYS[stage - 1];

    return {
      stage,
      dueAt: Date.now() + intervalDays * DAY_MS,
      reps: (prev.reps || 0) + 1,
      lapses: result === 'remember' ? lapses : lapses + 1,
      lastResult: result,
      lastReviewedAt: Date.now(),
    };
  },

  /** 取得指定卡片集合中，目前到期的卡片 */
  dueCards(cards, now = Date.now()) {
    return cards.filter((c) => this.isDue(c, now));
  },
};

window.ZilvSRS = ZilvSRS;
