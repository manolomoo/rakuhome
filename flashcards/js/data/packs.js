/**
 * 字旅手帳 — 內建詞庫包（原創內容）
 * 每個詞庫包含：id／語言代碼／顯示名稱／簡述／單字陣列
 * 單字欄位：term（外語詞）、reading（讀音，日文用羅馬拼音）、meaning（中文意思）、
 *          example（例句，選填）、category（分類）
 *
 * 所有內容均為原創編寫的基礎詞彙，不取自任何特定 App 或教材。
 */

/** 將字串轉成安全的 id 片段 */
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // 去除重音符號
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** 幫詞庫內每個字產生穩定 id，格式：pack-id__slug */
function buildPack(id, lang, name, description, theme, words) {
  const cards = words.map((w) => ({
    id: `${id}__${slugify(w.term)}`,
    pack: id,
    lang,
    term: w.term,
    reading: w.reading || '',
    meaning: w.meaning,
    example: w.example || '',
    category: w.category,
  }));
  return { id, lang, name, description, theme, cards };
}

/* ========================= 西文入門（es-basic） ========================= */
const ES_WORDS = [
  // 打招呼
  { term: 'Hola', meaning: '你好', category: '打招呼', example: '¡Hola! ¿Qué tal?' },
  { term: 'Buenos días', meaning: '早安', category: '打招呼' },
  { term: 'Buenas tardes', meaning: '午安', category: '打招呼' },
  { term: 'Buenas noches', meaning: '晚安（問候／道別）', category: '打招呼' },
  { term: 'Adiós', meaning: '再見', category: '打招呼' },
  { term: 'Hasta luego', meaning: '待會兒見', category: '打招呼' },
  { term: 'Por favor', meaning: '請', category: '打招呼' },
  { term: 'Gracias', meaning: '謝謝', category: '打招呼', example: 'Gracias por tu ayuda.' },
  { term: 'De nada', meaning: '不客氣', category: '打招呼' },
  { term: 'Lo siento', meaning: '對不起', category: '打招呼' },
  // 數字
  { term: 'uno', meaning: '一', category: '數字' },
  { term: 'dos', meaning: '二', category: '數字' },
  { term: 'tres', meaning: '三', category: '數字' },
  { term: 'cuatro', meaning: '四', category: '數字' },
  { term: 'cinco', meaning: '五', category: '數字' },
  { term: 'seis', meaning: '六', category: '數字' },
  { term: 'siete', meaning: '七', category: '數字' },
  { term: 'ocho', meaning: '八', category: '數字' },
  { term: 'nueve', meaning: '九', category: '數字' },
  { term: 'diez', meaning: '十', category: '數字' },
  // 顏色
  { term: 'rojo', meaning: '紅色', category: '顏色' },
  { term: 'azul', meaning: '藍色', category: '顏色' },
  { term: 'verde', meaning: '綠色', category: '顏色' },
  { term: 'amarillo', meaning: '黃色', category: '顏色' },
  { term: 'blanco', meaning: '白色', category: '顏色' },
  { term: 'negro', meaning: '黑色', category: '顏色' },
  { term: 'gris', meaning: '灰色', category: '顏色' },
  { term: 'naranja', meaning: '橘色', category: '顏色' },
  { term: 'morado', meaning: '紫色', category: '顏色' },
  { term: 'rosa', meaning: '粉紅色', category: '顏色' },
  // 食物
  { term: 'pan', meaning: '麵包', category: '食物' },
  { term: 'agua', meaning: '水', category: '食物' },
  { term: 'café', meaning: '咖啡', category: '食物' },
  { term: 'leche', meaning: '牛奶', category: '食物' },
  { term: 'huevo', meaning: '蛋', category: '食物' },
  { term: 'arroz', meaning: '米飯', category: '食物' },
  { term: 'pollo', meaning: '雞肉', category: '食物' },
  { term: 'fruta', meaning: '水果', category: '食物' },
  { term: 'verdura', meaning: '蔬菜', category: '食物' },
  { term: 'sopa', meaning: '湯', category: '食物' },
  // 旅行／租屋生活
  { term: 'pasaporte', meaning: '護照', category: '旅行與租屋' },
  { term: 'maleta', meaning: '行李箱', category: '旅行與租屋' },
  { term: 'habitación', meaning: '房間', category: '旅行與租屋' },
  { term: 'llave', meaning: '鑰匙', category: '旅行與租屋' },
  { term: 'alquiler', meaning: '租金', category: '旅行與租屋', example: 'El alquiler es muy alto.' },
  { term: 'contrato', meaning: '合約', category: '旅行與租屋' },
  { term: 'vecino', meaning: '鄰居', category: '旅行與租屋' },
  { term: 'dirección', meaning: '地址', category: '旅行與租屋' },
  { term: 'autobús', meaning: '公車', category: '旅行與租屋' },
  { term: 'estación', meaning: '車站', category: '旅行與租屋' },
];

/* ========================= 英文入門（en-basic） ========================= */
const EN_WORDS = [
  // 看房／租屋
  { term: 'landlord', meaning: '房東', category: '看房與租屋' },
  { term: 'tenant', meaning: '房客', category: '看房與租屋' },
  { term: 'lease', meaning: '租約', category: '看房與租屋' },
  { term: 'deposit', meaning: '押金', category: '看房與租屋', example: 'The deposit is two months’ rent.' },
  { term: 'utilities', meaning: '水電瓦斯費', category: '看房與租屋' },
  { term: 'furnished', meaning: '附家具的', category: '看房與租屋' },
  { term: 'appliance', meaning: '家電', category: '看房與租屋' },
  { term: 'roommate', meaning: '室友', category: '看房與租屋' },
  { term: 'move-in date', meaning: '搬入日期', category: '看房與租屋' },
  { term: 'notice period', meaning: '退租通知期', category: '看房與租屋' },
  // 交通
  { term: 'platform', meaning: '月台', category: '交通' },
  { term: 'transfer', meaning: '轉乘', category: '交通' },
  { term: 'timetable', meaning: '時刻表', category: '交通' },
  { term: 'fare', meaning: '車資', category: '交通' },
  { term: 'ticket gate', meaning: '票閘口', category: '交通' },
  { term: 'rush hour', meaning: '尖峰時段', category: '交通' },
  { term: 'IC card', meaning: 'IC 儲值卡', category: '交通' },
  { term: 'one-way ticket', meaning: '單程票', category: '交通' },
  { term: 'last train', meaning: '末班車', category: '交通' },
  { term: 'taxi', meaning: '計程車', category: '交通' },
  // 生活用品
  { term: 'detergent', meaning: '洗衣精', category: '生活用品' },
  { term: 'trash bag', meaning: '垃圾袋', category: '生活用品' },
  { term: 'recycling', meaning: '回收', category: '生活用品' },
  { term: 'umbrella', meaning: '雨傘', category: '生活用品' },
  { term: 'outlet', meaning: '插座', category: '生活用品' },
  { term: 'air conditioner', meaning: '冷氣機', category: '生活用品' },
  { term: 'futon', meaning: '日式被褥', category: '生活用品' },
  { term: 'slippers', meaning: '室內拖鞋', category: '生活用品' },
  { term: 'kettle', meaning: '電熱水壺', category: '生活用品' },
  { term: 'hanger', meaning: '衣架', category: '生活用品' },
  // 緊急與行政
  { term: 'embassy', meaning: '大使館', category: '緊急與行政' },
  { term: 'insurance', meaning: '保險', category: '緊急與行政' },
  { term: 'hospital', meaning: '醫院', category: '緊急與行政' },
  { term: 'pharmacy', meaning: '藥局', category: '緊急與行政' },
  { term: 'police station', meaning: '警察局', category: '緊急與行政' },
  { term: 'residence card', meaning: '在留卡', category: '緊急與行政' },
  { term: 'bank account', meaning: '銀行帳戶', category: '緊急與行政' },
  { term: 'SIM card', meaning: 'SIM 卡', category: '緊急與行政' },
  { term: 'visa', meaning: '簽證', category: '緊急與行政' },
  { term: 'emergency exit', meaning: '緊急出口', category: '緊急與行政' },
  // 日常短句
  { term: 'Excuse me.', meaning: '不好意思。', category: '日常短句' },
  { term: 'Where is it?', meaning: '它在哪裡？', category: '日常短句' },
  { term: 'How much is it?', meaning: '這多少錢？', category: '日常短句' },
  { term: 'I’m lost.', meaning: '我迷路了。', category: '日常短句' },
  { term: 'Can you help me?', meaning: '你能幫我嗎？', category: '日常短句' },
  { term: 'Is this seat taken?', meaning: '這個位子有人坐嗎？', category: '日常短句' },
  { term: 'I’ll take this one.', meaning: '我要這個。', category: '日常短句' },
  { term: 'What time is it?', meaning: '現在幾點？', category: '日常短句' },
  { term: 'It’s delicious.', meaning: '很好吃。', category: '日常短句' },
  { term: 'Nice to meet you.', meaning: '很高興認識你。', category: '日常短句' },
];

/* ========================= 日文入門（ja-basic） ========================= */
// term 為平假名（基礎假名詞庫，不含漢字），reading 為羅馬拼音輔助讀音
const JA_WORDS = [
  // 問候
  { term: 'おはよう', reading: 'ohayou', meaning: '早安', category: '問候' },
  { term: 'こんにちは', reading: 'konnichiwa', meaning: '午安／你好', category: '問候' },
  { term: 'こんばんは', reading: 'konbanwa', meaning: '晚安（問候）', category: '問候' },
  { term: 'さようなら', reading: 'sayounara', meaning: '再見', category: '問候' },
  { term: 'ありがとう', reading: 'arigatou', meaning: '謝謝', category: '問候' },
  { term: 'すみません', reading: 'sumimasen', meaning: '不好意思／抱歉', category: '問候' },
  { term: 'はい', reading: 'hai', meaning: '是', category: '問候' },
  { term: 'いいえ', reading: 'iie', meaning: '不是', category: '問候' },
  { term: 'おやすみ', reading: 'oyasumi', meaning: '晚安（睡前）', category: '問候' },
  { term: 'よろしくおねがいします', reading: 'yoroshiku onegaishimasu', meaning: '請多多指教', category: '問候' },
  // 數字
  { term: 'いち', reading: 'ichi', meaning: '一', category: '數字' },
  { term: 'に', reading: 'ni', meaning: '二', category: '數字' },
  { term: 'さん', reading: 'san', meaning: '三', category: '數字' },
  { term: 'よん', reading: 'yon', meaning: '四', category: '數字' },
  { term: 'ご', reading: 'go', meaning: '五', category: '數字' },
  { term: 'ろく', reading: 'roku', meaning: '六', category: '數字' },
  { term: 'なな', reading: 'nana', meaning: '七', category: '數字' },
  { term: 'はち', reading: 'hachi', meaning: '八', category: '數字' },
  { term: 'きゅう', reading: 'kyuu', meaning: '九', category: '數字' },
  { term: 'じゅう', reading: 'juu', meaning: '十', category: '數字' },
  // 生活用語
  { term: 'みず', reading: 'mizu', meaning: '水', category: '生活用語' },
  { term: 'ごはん', reading: 'gohan', meaning: '飯／米飯', category: '生活用語' },
  { term: 'いえ', reading: 'ie', meaning: '家', category: '生活用語' },
  { term: 'でんしゃ', reading: 'densha', meaning: '電車', category: '生活用語' },
  { term: 'えき', reading: 'eki', meaning: '車站', category: '生活用語' },
  { term: 'がっこう', reading: 'gakkou', meaning: '學校', category: '生活用語' },
  { term: 'しごと', reading: 'shigoto', meaning: '工作', category: '生活用語' },
  { term: 'おかね', reading: 'okane', meaning: '錢', category: '生活用語' },
  { term: 'じかん', reading: 'jikan', meaning: '時間', category: '生活用語' },
  { term: 'てがみ', reading: 'tegami', meaning: '信', category: '生活用語' },
  // 居家
  { term: 'やちん', reading: 'yachin', meaning: '房租', category: '居家' },
  { term: 'かぎ', reading: 'kagi', meaning: '鑰匙', category: '居家' },
  { term: 'へや', reading: 'heya', meaning: '房間', category: '居家' },
  { term: 'おふろ', reading: 'ofuro', meaning: '浴缸／泡澡', category: '居家' },
  { term: 'だいどころ', reading: 'daidokoro', meaning: '廚房', category: '居家' },
  { term: 'げんかん', reading: 'genkan', meaning: '玄關', category: '居家' },
  { term: 'となり', reading: 'tonari', meaning: '隔壁／鄰居', category: '居家' },
  { term: 'にもつ', reading: 'nimotsu', meaning: '行李', category: '居家' },
  { term: 'そうじ', reading: 'souji', meaning: '打掃', category: '居家' },
  { term: 'ごみ', reading: 'gomi', meaning: '垃圾', category: '居家' },
  // 交通
  { term: 'ちかてつ', reading: 'chikatetsu', meaning: '地下鐵', category: '交通' },
  { term: 'バス', reading: 'basu', meaning: '公車', category: '交通' },
  { term: 'タクシー', reading: 'takushi-', meaning: '計程車', category: '交通' },
  { term: 'きっぷ', reading: 'kippu', meaning: '車票', category: '交通' },
  { term: 'のりば', reading: 'noriba', meaning: '乘車處', category: '交通' },
  { term: 'しんかんせん', reading: 'shinkansen', meaning: '新幹線', category: '交通' },
  { term: 'うんてん', reading: 'unten', meaning: '駕駛', category: '交通' },
  { term: 'どうろ', reading: 'douro', meaning: '道路', category: '交通' },
  { term: 'ちず', reading: 'chizu', meaning: '地圖', category: '交通' },
  { term: 'よやく', reading: 'yoyaku', meaning: '預約', category: '交通' },
];

const BUILTIN_PACKS = [
  buildPack(
    'es-basic',
    'es',
    '西文入門',
    '打招呼、數字、顏色、食物與旅行租屋常用詞，共 50 字。',
    'es',
    ES_WORDS
  ),
  buildPack(
    'en-basic',
    'en',
    '英文入門',
    '日本旅行與租屋生活實用字，共 50 字。',
    'en',
    EN_WORDS
  ),
  buildPack(
    'ja-basic',
    'ja',
    '日文入門',
    'ひらがな基礎挨拶與生活用語，共 50 字。',
    'ja',
    JA_WORDS
  ),
];

// 提供給瀏覽器全域使用（無模組打包，純 <script> 載入）
window.ZILV_BUILTIN_PACKS = BUILTIN_PACKS;
