/**
 * 字旅手帳 — 發音（TTS）小工具
 * 使用瀏覽器內建 Web Speech API；若裝置不支援則優雅降級（回傳 false，呼叫端自行顯示文字提示）。
 */

const ZILV_LANG_VOICE_MAP = {
  es: ['es-ES', 'es-MX', 'es-US', 'es'],
  en: ['en-US', 'en-GB', 'en'],
  ja: ['ja-JP', 'ja'],
};

const ZilvTTS = {
  canSpeak() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  /** 嘗試依語言代碼找出最合適的語音 */
  pickVoice(lang) {
    if (!this.canSpeak()) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const candidates = ZILV_LANG_VOICE_MAP[lang] || [lang];
    for (const code of candidates) {
      const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(code.toLowerCase()));
      if (match) return match;
    }
    return null;
  },

  /**
   * 念出文字。回傳 boolean：是否成功發出語音請求。
   * @param {string} text 要念的文字
   * @param {string} lang 語言代碼（es / en / ja）
   */
  speak(text, lang) {
    if (!this.canSpeak() || !text) return false;
    try {
      window.speechSynthesis.cancel(); // 避免排隊疊加
      const utter = new SpeechSynthesisUtterance(text);
      const voice = this.pickVoice(lang);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = (ZILV_LANG_VOICE_MAP[lang] && ZILV_LANG_VOICE_MAP[lang][0]) || lang;
      }
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
      return true;
    } catch (err) {
      console.warn('[字旅手帳] 發音失敗：', err);
      return false;
    }
  },

  /** 部分瀏覽器需要等待 voiceschanged 事件才能取得完整語音清單 */
  warmUp() {
    if (!this.canSpeak()) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  },
};

window.ZilvTTS = ZilvTTS;
