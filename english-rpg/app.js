"use strict";
/* ============================================================
   英語冒險者：日本租屋旅行RPG
   Self-contained vanilla JS game. No build step, no deps.
   ============================================================ */

/* ---------------- DATA: VOCAB ---------------- */
var CATS = {
  house:      { label: "租屋房產", emoji: "🏠" },
  transport:  { label: "交通運輸", emoji: "🚄" },
  travel:     { label: "旅遊住宿", emoji: "🧳" },
  life:       { label: "生活雜務", emoji: "🎌" }
};

var VOCAB = [
  { id: 1,  en: "apartment",            zh: "公寓",           cat: "house" },
  { id: 2,  en: "real estate agent",    zh: "房屋仲介",       cat: "house" },
  { id: 3,  en: "landlord",             zh: "房東",           cat: "house" },
  { id: 4,  en: "tenant",               zh: "房客",           cat: "house" },
  { id: 5,  en: "rental contract",      zh: "租約",           cat: "house" },
  { id: 6,  en: "deposit",              zh: "押金",           cat: "house" },
  { id: 7,  en: "key money",            zh: "禮金",           cat: "house" },
  { id: 8,  en: "monthly rent",         zh: "月租",           cat: "house" },
  { id: 9,  en: "utility bills",        zh: "水電費",         cat: "house" },
  { id: 10, en: "floor plan",           zh: "平面圖",         cat: "house" },
  { id: 11, en: "room layout",          zh: "房型格局",       cat: "house" },
  { id: 12, en: "furnished",            zh: "附家具的",       cat: "house" },
  { id: 13, en: "move-in date",         zh: "入住日",         cat: "house" },
  { id: 14, en: "guarantor",            zh: "保證人",         cat: "house" },
  { id: 15, en: "maintenance fee",      zh: "管理費",         cat: "house" },
  { id: 16, en: "renewal fee",          zh: "續約費",         cat: "house" },
  { id: 17, en: "property viewing",     zh: "看房",           cat: "house" },
  { id: 18, en: "listing",              zh: "物件",           cat: "house" },
  { id: 19, en: "commute time",         zh: "通勤時間",       cat: "house" },
  { id: 20, en: "nearest station",      zh: "最近車站",       cat: "house" },
  { id: 21, en: "walking distance",     zh: "步行距離",       cat: "house" },
  { id: 22, en: "building age",         zh: "屋齡",           cat: "house" },
  { id: 23, en: "renovation",           zh: "裝修",           cat: "house" },
  { id: 24, en: "mortgage",             zh: "房貸",           cat: "house" },
  { id: 25, en: "down payment",         zh: "頭期款",         cat: "house" },
  { id: 26, en: "square meter",         zh: "平方公尺",       cat: "house" },
  { id: 27, en: "north-facing",         zh: "朝北",           cat: "house" },
  { id: 28, en: "sunlight exposure",    zh: "採光",           cat: "house" },
  { id: 29, en: "earthquake resistant", zh: "耐震",           cat: "house" },
  { id: 30, en: "neighborhood",         zh: "社區",           cat: "house" },
  { id: 31, en: "tatami",               zh: "榻榻米",         cat: "house" },
  { id: 32, en: "sliding door",         zh: "滑門",           cat: "house" },
  { id: 33, en: "noise complaint",      zh: "噪音投訴",       cat: "house" },
  { id: 34, en: "garbage sorting",      zh: "垃圾分類",       cat: "house" },
  { id: 35, en: "real estate app",      zh: "房屋媒合App",    cat: "house" },
  { id: 36, en: "train pass",           zh: "電車定期票",     cat: "transport" },
  { id: 37, en: "platform",             zh: "月台",           cat: "transport" },
  { id: 38, en: "transfer",             zh: "轉乘",           cat: "transport" },
  { id: 39, en: "one-way ticket",       zh: "單程票",         cat: "transport" },
  { id: 40, en: "round-trip ticket",    zh: "來回票",         cat: "transport" },
  { id: 41, en: "local train",          zh: "普通車",         cat: "transport" },
  { id: 42, en: "express train",        zh: "特快車",         cat: "transport" },
  { id: 43, en: "bullet train",         zh: "新幹線",         cat: "transport" },
  { id: 44, en: "ticket gate",          zh: "剪票口",         cat: "transport" },
  { id: 45, en: "suitcase",             zh: "行李箱",         cat: "transport" },
  { id: 46, en: "luggage locker",       zh: "行李置物櫃",     cat: "transport" },
  { id: 47, en: "taxi fare",            zh: "計程車費",       cat: "transport" },
  { id: 48, en: "bus stop",             zh: "公車站",         cat: "transport" },
  { id: 49, en: "map app",              zh: "地圖App",        cat: "transport" },
  { id: 50, en: "IC card",              zh: "交通卡",         cat: "transport" },
  { id: 51, en: "hot spring",           zh: "溫泉",           cat: "travel" },
  { id: 52, en: "ryokan",               zh: "日式旅館",       cat: "travel" },
  { id: 53, en: "check-in",             zh: "入住登記",       cat: "travel" },
  { id: 54, en: "check-out",            zh: "退房",           cat: "travel" },
  { id: 55, en: "reservation",          zh: "預約",           cat: "travel" },
  { id: 56, en: "itinerary",            zh: "行程",           cat: "travel" },
  { id: 57, en: "tourist attraction",   zh: "觀光景點",       cat: "travel" },
  { id: 58, en: "souvenir",             zh: "紀念品",         cat: "travel" },
  { id: 59, en: "local cuisine",        zh: "當地美食",       cat: "travel" },
  { id: 60, en: "izakaya",              zh: "居酒屋",         cat: "travel" },
  { id: 61, en: "vending machine",      zh: "自動販賣機",     cat: "travel" },
  { id: 62, en: "typhoon",              zh: "颱風",           cat: "travel" },
  { id: 63, en: "weather forecast",     zh: "天氣預報",       cat: "travel" },
  { id: 64, en: "public bath",          zh: "公共浴池",       cat: "travel" },
  { id: 65, en: "slippers",             zh: "室內拖鞋",       cat: "travel" },
  { id: 66, en: "residence card",       zh: "在留卡",         cat: "life" },
  { id: 67, en: "visa",                 zh: "簽證",           cat: "life" },
  { id: 68, en: "immigration",          zh: "入境審查",       cat: "life" },
  { id: 69, en: "customs declaration",  zh: "海關申報",       cat: "life" },
  { id: 70, en: "currency exchange",    zh: "換匯",           cat: "life" },
  { id: 71, en: "SIM card",             zh: "SIM卡",          cat: "life" },
  { id: 72, en: "pocket Wi-Fi",         zh: "隨身Wi-Fi",      cat: "life" }
];

/* ---------------- DATA: CLASSES ---------------- */
var CLASSES = [
  { id: "knight", name: "文法騎士", emoji: "🛡️", desc: "穩健耐打，熟悉句型結構。",       baseHp: 60, baseAtk: 8,  baseCrit: 5  },
  { id: "mage",   name: "單字法師", emoji: "🧙", desc: "單字火力驚人，但較脆弱。",       baseHp: 45, baseAtk: 12, baseCrit: 8  },
  { id: "bard",   name: "會話吟遊詩人", emoji: "🎤", desc: "均衡發展，擅長持久作戰。",   baseHp: 55, baseAtk: 9,  baseCrit: 10 },
  { id: "ninja",  name: "聽力忍者", emoji: "🥷", desc: "爆擊率超高，一擊入魂。",         baseHp: 48, baseAtk: 9,  baseCrit: 15 }
];

/* ---------------- DATA: MONSTERS ---------------- */
var MONSTERS = [
  { id: "m1", name: "看房史萊姆",     emoji: "🟢", tier: 1, minLevel: 1,  hp: 22, atk: 3,  xp: 15 },
  { id: "m2", name: "超商店員怪",     emoji: "🏪", tier: 1, minLevel: 1,  hp: 26, atk: 4,  xp: 18 },
  { id: "m3", name: "腳踏車小偷貓",   emoji: "🐈", tier: 1, minLevel: 2,  hp: 28, atk: 4,  xp: 20 },
  { id: "m4", name: "房東哥布林",     emoji: "👺", tier: 2, minLevel: 4,  hp: 42, atk: 6,  xp: 32 },
  { id: "m5", name: "查票員機器人",   emoji: "🤖", tier: 2, minLevel: 4,  hp: 46, atk: 6,  xp: 34 },
  { id: "m6", name: "颱風精靈",       emoji: "🌀", tier: 2, minLevel: 5,  hp: 50, atk: 7,  xp: 38 },
  { id: "m7", name: "保證人幽靈",     emoji: "👻", tier: 3, minLevel: 7,  hp: 70, atk: 9,  xp: 52 },
  { id: "m8", name: "溫泉河童",       emoji: "🥒", tier: 3, minLevel: 7,  hp: 75, atk: 9,  xp: 55 },
  { id: "m9", name: "海關稽查犬",     emoji: "🐕", tier: 3, minLevel: 8,  hp: 80, atk: 10, xp: 60 },
  { id: "m10", name: "居酒屋章魚怪",  emoji: "🐙", tier: 4, minLevel: 10, hp: 110, atk: 12, xp: 80 },
  { id: "m11", name: "新幹線巡察隊長", emoji: "🚅", tier: 4, minLevel: 10, hp: 120, atk: 13, xp: 85 },
  { id: "boss1", name: "房東龍王", emoji: "🐉", tier: 99, minLevel: 12, hp: 260, atk: 18, xp: 220, boss: true, requireKills: 15 }
];

/* ---------------- DATA: LOOT ---------------- */
var LOOT = [
  { id: "w_pen",     name: "仲介的合約筆",   emoji: "🖊️", type: "weapon",    rarity: "common",    atk: 1 },
  { id: "w_umbrella",name: "塑膠雨傘劍",     emoji: "☂️", type: "weapon",    rarity: "common",    atk: 1 },
  { id: "a_slipper", name: "室內拖鞋護符",   emoji: "🥿", type: "accessory", rarity: "common",    hp: 5  },
  { id: "a_card",    name: "學生證護身符",   emoji: "🪪", type: "accessory", rarity: "common",    hp: 5  },
  { id: "w_ticket",  name: "電車定期票劍",   emoji: "🎫", type: "weapon",    rarity: "rare",      atk: 3 },
  { id: "w_chopstick",name:"旅館長筷雙刃",   emoji: "🥢", type: "weapon",    rarity: "rare",      atk: 3 },
  { id: "a_towel",   name: "溫泉毛巾斗篷",   emoji: "🧣", type: "accessory", rarity: "rare",      hp: 15 },
  { id: "a_iccard",  name: "IC卡圓盾",       emoji: "🛡️", type: "accessory", rarity: "rare",      crit: 5 },
  { id: "w_shinkansen",name:"新幹線疾風劍",  emoji: "⚔️", type: "weapon",    rarity: "epic",      atk: 6, crit: 5 },
  { id: "a_namecard",name: "仲介金色名片",   emoji: "💳", type: "accessory", rarity: "epic",      atk: 4, hp: 20 },
  { id: "w_seal",    name: "房東龍王的印章", emoji: "🔱", type: "weapon",    rarity: "legendary", atk: 12, crit: 10 },
  { id: "a_reikin",  name: "禮金之心",       emoji: "💎", type: "accessory", rarity: "legendary", atk: 5, hp: 40 }
];
var RARITY_LABEL = { common: "普通", rare: "稀有", epic: "英雄", legendary: "傳說" };
var RARITY_WEIGHTS = {
  1:  { common: 70, rare: 25, epic: 5,  legendary: 0 },
  2:  { common: 55, rare: 32, epic: 11, legendary: 2 },
  3:  { common: 38, rare: 36, epic: 20, legendary: 6 },
  4:  { common: 22, rare: 36, epic: 30, legendary: 12 },
  99: { common: 0,  rare: 10, epic: 40, legendary: 50 }
};

/* ---------------- DATA: ACHIEVEMENTS ---------------- */
var ACHIEVEMENTS = [
  { id: "a1", name: "初出茅廬", emoji: "🔰", desc: "贏得第一場戰鬥", test: function(s){ return s.stats.battlesWon >= 1; } },
  { id: "a2", name: "單字新手", emoji: "📗", desc: "累計答對 10 題",  test: function(s){ return s.stats.totalCorrect >= 10; } },
  { id: "a3", name: "單字達人", emoji: "📘", desc: "累計答對 50 題",  test: function(s){ return s.stats.totalCorrect >= 50; } },
  { id: "a4", name: "單字大師", emoji: "📙", desc: "累計答對 150 題", test: function(s){ return s.stats.totalCorrect >= 150; } },
  { id: "a5", name: "連勝高手", emoji: "🔥", desc: "單場連續答對 10 題", test: function(s){ return s.stats.bestCombo >= 10; } },
  { id: "a6", name: "小有名氣", emoji: "⭐", desc: "角色等級達到 5",  test: function(s){ return s.level >= 5; } },
  { id: "a7", name: "高階冒險者", emoji: "🌟", desc: "角色等級達到 10", test: function(s){ return s.level >= 10; } },
  { id: "a8", name: "收藏家", emoji: "🎁", desc: "獲得 5 種不同裝備", test: function(s){ return s.collectedItemIds.length >= 5; } },
  { id: "a9", name: "稀世珍寶", emoji: "💎", desc: "獲得一件傳說等級裝備", test: function(s){ return s.hasLegendary; } },
  { id: "a10", name: "怪物獵人", emoji: "🗡️", desc: "累計擊敗 20 隻怪物", test: function(s){ return s.stats.monstersDefeated >= 20; } },
  { id: "a11", name: "房東殺手", emoji: "🐉", desc: "擊敗首領「房東龍王」", test: function(s){ return s.bossDefeated; } },
  { id: "a12", name: "全科制霸", emoji: "🏅", desc: "每個單字分類都至少答對一次", test: function(s){
      var c = s.stats.categoryCorrect;
      return !!(c.house && c.transport && c.travel && c.life);
    } }
];

/* ---------------- STATE ---------------- */
var SAVE_KEY = "englishRpgSave_v1";
var state = null;

function freshState(name, classId) {
  return {
    name: name,
    classId: classId,
    level: 1,
    xp: 0,
    collectedItemIds: [],
    hasLegendary: false,
    bossDefeated: false,
    inventory: ["w_start", "a_start"],
    equipped: { weapon: "w_start", accessory: "a_start" },
    mastery: {},        // vocabId -> {correct, wrong}
    achievementsUnlocked: [],
    stats: {
      totalCorrect: 0,
      totalWrong: 0,
      battlesWon: 0,
      battlesLost: 0,
      monstersDefeated: 0,
      bestCombo: 0,
      currentCombo: 0,
      categoryCorrect: { house: false, transport: false, travel: false, life: false }
    }
  };
}

var START_WEAPON = { id: "w_start", name: "新手字典劍", emoji: "📔", type: "weapon", rarity: "common", atk: 0 };
var START_ACCESSORY = { id: "a_start", name: "入門學生證", emoji: "🪪", type: "accessory", rarity: "common", hp: 0 };

function allLootById(id) {
  if (id === "w_start") return START_WEAPON;
  if (id === "a_start") return START_ACCESSORY;
  for (var i = 0; i < LOOT.length; i++) { if (LOOT[i].id === id) return LOOT[i]; }
  return null;
}

function loadState() {
  var raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { raw = null; }
  if (!raw) return null;
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || !parsed.classId) return null;
    return parsed;
  } catch (e) { return null; }
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

/* ---------------- UTIL ---------------- */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function classById(id) { for (var i = 0; i < CLASSES.length; i++) { if (CLASSES[i].id === id) return CLASSES[i]; } return CLASSES[0]; }

function xpToNext(level) { return 40 + level * 35; }

function getEquippedWeapon() { return allLootById(state.equipped.weapon) || START_WEAPON; }
function getEquippedAccessory() { return allLootById(state.equipped.accessory) || START_ACCESSORY; }

function maxHp() {
  var cls = classById(state.classId);
  var acc = getEquippedAccessory();
  return cls.baseHp + (state.level - 1) * 5 + (acc.hp || 0);
}
function playerAtk() {
  var cls = classById(state.classId);
  var w = getEquippedWeapon();
  var acc = getEquippedAccessory();
  return cls.baseAtk + (state.level - 1) * 2 + (w.atk || 0) + (acc.atk || 0);
}
function playerCrit() {
  var cls = classById(state.classId);
  var w = getEquippedWeapon();
  var acc = getEquippedAccessory();
  return cls.baseCrit + (w.crit || 0) + (acc.crit || 0);
}

/* ---------------- TOAST ---------------- */
function toast(msg) {
  var zone = document.getElementById("toastZone");
  var el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(function () { el.remove(); }, 2700);
}

/* ---------------- ACHIEVEMENTS CHECK ---------------- */
function checkAchievements() {
  var newly = [];
  ACHIEVEMENTS.forEach(function (a) {
    if (state.achievementsUnlocked.indexOf(a.id) === -1 && a.test(state)) {
      state.achievementsUnlocked.push(a.id);
      newly.push(a);
    }
  });
  newly.forEach(function (a) { toast("🏆 成就解鎖：" + a.name); });
  return newly;
}

/* ---------------- XP / LEVEL ---------------- */
function grantXp(amount) {
  state.xp += amount;
  var leveledUp = false;
  while (state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    state.level += 1;
    leveledUp = true;
  }
  if (leveledUp) toast("✨ 升級了！現在是 Lv." + state.level);
  checkAchievements();
}

/* ---------------- LOOT ---------------- */
function rollLoot(monster) {
  var dropChance = monster.boss ? 1 : 0.7;
  if (Math.random() > dropChance) return null;
  var weights = RARITY_WEIGHTS[monster.tier] || RARITY_WEIGHTS[1];
  var roll = Math.random() * 100;
  var acc = 0, rarity = "common";
  var order = ["common", "rare", "epic", "legendary"];
  for (var i = 0; i < order.length; i++) {
    acc += weights[order[i]];
    if (roll <= acc) { rarity = order[i]; break; }
  }
  var pool = LOOT.filter(function (it) { return it.rarity === rarity; });
  if (!pool.length) pool = LOOT.filter(function (it) { return it.rarity === "common"; });
  var item = choice(pool);
  state.inventory.push(item.id);
  if (state.collectedItemIds.indexOf(item.id) === -1) state.collectedItemIds.push(item.id);
  if (item.rarity === "legendary") state.hasLegendary = true;
  checkAchievements();
  return item;
}

/* ---------------- VOCAB MASTERY / QUESTIONS ---------------- */
function getMastery(id) {
  if (!state.mastery[id]) state.mastery[id] = { correct: 0, wrong: 0 };
  return state.mastery[id];
}
function weightedVocabPick(excludeId) {
  var pool = VOCAB.filter(function (v) { return v.id !== excludeId; });
  var weights = pool.map(function (v) {
    var m = getMastery(v.id);
    return 1 / (m.correct + 1) + m.wrong * 0.5;
  });
  var total = weights.reduce(function (a, b) { return a + b; }, 0);
  var r = Math.random() * total;
  var acc = 0;
  for (var i = 0; i < pool.length; i++) {
    acc += weights[i];
    if (r <= acc) return pool[i];
  }
  return pool[pool.length - 1];
}

function makeQuestion() {
  var subject = weightedVocabPick(null);
  var direction = Math.random() < 0.5 ? "en2zh" : "zh2en";
  var sameCat = VOCAB.filter(function (v) { return v.cat === subject.cat && v.id !== subject.id; });
  var others = VOCAB.filter(function (v) { return v.id !== subject.id; });
  var distractorsPool = shuffle(sameCat).concat(shuffle(others));
  var seenText = {};
  var correctText = direction === "en2zh" ? subject.zh : subject.en;
  seenText[correctText] = true;
  var distractors = [];
  for (var i = 0; i < distractorsPool.length && distractors.length < 3; i++) {
    var cand = distractorsPool[i];
    var text = direction === "en2zh" ? cand.zh : cand.en;
    if (seenText[text]) continue;
    seenText[text] = true;
    distractors.push(text);
  }
  var choices = shuffle([correctText].concat(distractors));
  return {
    vocab: subject,
    direction: direction,
    prompt: direction === "en2zh" ? subject.en : subject.zh,
    correctText: correctText,
    choices: choices
  };
}

/* ---------------- BATTLE STATE ---------------- */
var battle = null; // { monster, monsterHp, monsterMaxHp, playerHp, playerMaxHp, question }

function startBattle(monsterDef) {
  var scaleLvl = Math.max(0, state.level - 1);
  var monster = Object.assign({}, monsterDef);
  monster.hp = monsterDef.hp + Math.floor(scaleLvl * 1.4);
  monster.atk = monsterDef.atk + Math.floor(scaleLvl * 0.4);
  battle = {
    monster: monster,
    monsterHp: monster.hp,
    monsterMaxHp: monster.hp,
    playerHp: maxHp(),
    playerMaxHp: maxHp(),
    question: null,
    locked: false
  };
  state.stats.currentCombo = 0;
  showScreen("battle");
  renderBattle();
  nextQuestion();
}

function nextQuestion() {
  battle.question = makeQuestion();
  battle.locked = false;
  renderQuestion();
}

function spawnFloater(zoneId, text, cls) {
  var zone = document.getElementById(zoneId);
  var el = document.createElement("div");
  el.className = "dmg-float " + cls;
  el.textContent = text;
  zone.appendChild(el);
  setTimeout(function () { el.remove(); }, 1000);
}

function answerQuestion(selectedText, btnEl) {
  if (battle.locked) return;
  battle.locked = true;
  var q = battle.question;
  var correct = selectedText === q.correctText;
  var m = getMastery(q.vocab.id);
  var allBtns = document.querySelectorAll("#choiceGrid .choice-btn");
  allBtns.forEach(function (b) { b.disabled = true; });

  if (correct) {
    m.correct++;
    state.stats.totalCorrect++;
    state.stats.currentCombo++;
    if (state.stats.currentCombo > state.stats.bestCombo) state.stats.bestCombo = state.stats.currentCombo;
    state.stats.categoryCorrect[q.vocab.cat] = true;
    btnEl.classList.add("correct");

    var isCrit = Math.random() * 100 < playerCrit();
    var dmg = playerAtk() * (isCrit ? 2 : 1) + rand(-1, 2);
    dmg = Math.max(1, dmg);
    battle.monsterHp = Math.max(0, battle.monsterHp - dmg);
    spawnFloater("monsterFloaterZone", (isCrit ? "暴擊！" : "") + "-" + dmg, isCrit ? "crit" : "dmg");
    shakeSprite("monsterSprite");
  } else {
    m.wrong++;
    state.stats.totalWrong++;
    state.stats.currentCombo = 0;
    btnEl.classList.add("wrong");
    allBtns.forEach(function (b) {
      if (b.dataset.text === q.correctText) b.classList.add("correct");
    });
    var mdmg = battle.monster.atk + rand(0, 2);
    battle.playerHp = Math.max(0, battle.playerHp - mdmg);
    spawnFloater("playerFloaterZone", "-" + mdmg, "dmg");
    shakeSprite("playerSprite");
  }

  checkAchievements();
  renderBattleBars();
  renderCombo();

  setTimeout(function () {
    if (battle.monsterHp <= 0) { endBattle(true); return; }
    if (battle.playerHp <= 0) { endBattle(false); return; }
    nextQuestion();
  }, 850);
}

function shakeSprite(id) {
  var el = document.getElementById(id);
  el.classList.remove("hit");
  void el.offsetWidth;
  el.classList.add("hit");
}

function endBattle(won) {
  if (won) {
    state.stats.battlesWon++;
    state.stats.monstersDefeated++;
    if (battle.monster.boss) state.bossDefeated = true;
    grantXp(battle.monster.xp);
    var loot = rollLoot(battle.monster);
    saveState();
    showVictoryModal(battle.monster, loot);
  } else {
    state.stats.battlesLost++;
    saveState();
    showDefeatModal(battle.monster);
  }
  battle = null;
}

function fleeBattle() {
  battle = null;
  showScreen("hub");
  renderHub();
}

/* ---------------- RENDER: HUD ---------------- */
function renderHud() {
  var cls = classById(state.classId);
  document.getElementById("hudAvatar").textContent = cls.emoji;
  document.getElementById("hudName").textContent = state.name;
  document.getElementById("hudLevel").textContent = state.level;
  var mh = maxHp();
  var curHp = battle ? battle.playerHp : mh;
  document.getElementById("hudHpFill").style.width = clamp((curHp / mh) * 100, 0, 100) + "%";
  document.getElementById("hudHpLabel").textContent = "HP " + curHp + "/" + mh;
  var need = xpToNext(state.level);
  document.getElementById("hudXpFill").style.width = clamp((state.xp / need) * 100, 0, 100) + "%";
  document.getElementById("hudXpLabel").textContent = "XP " + state.xp + "/" + need;
}

/* ---------------- RENDER: HUB ---------------- */
function titleForState() {
  var unlocked = state.achievementsUnlocked.length;
  if (state.bossDefeated) return "👑 房東龍王的征服者";
  if (unlocked >= 8) return "🌟 傳說中的冒險者";
  if (unlocked >= 4) return "⭐ 小有名氣的旅人";
  if (unlocked >= 1) return "🔰 初心者冒險者";
  return "剛踏上旅程的新手";
}

function renderHub() {
  document.getElementById("hubName").textContent = state.name;
  document.getElementById("hubTitle").textContent = titleForState();

  var list = document.getElementById("monsterList");
  list.innerHTML = "";
  MONSTERS.forEach(function (m) {
    var locked = state.level < m.minLevel || (m.requireKills && state.stats.monstersDefeated < m.requireKills);
    var card = document.createElement("div");
    card.className = "monster-card" + (locked ? " locked" : "") + (m.boss ? " tier-boss" : "");
    var reasonText = "";
    if (locked) {
      if (state.level < m.minLevel) reasonText = "需 Lv." + m.minLevel;
      else reasonText = "需擊敗 " + m.requireKills + " 隻怪物";
    }
    card.innerHTML =
      '<div class="m-emoji">' + m.emoji + '</div>' +
      '<div class="m-info"><div class="m-name">' + m.name + (m.boss ? " 👑首領" : "") + '</div>' +
      '<div class="m-meta">HP ' + m.hp + ' ・ ATK ' + m.atk + ' ・ 經驗 ' + m.xp + '</div></div>' +
      '<div class="m-tag">' + (locked ? reasonText : "Lv." + m.minLevel + "+") + '</div>';
    if (!locked) {
      card.addEventListener("click", function (mm) { return function () { startBattle(mm); }; }(m));
    }
    list.appendChild(card);
  });

  var dexPreview = document.getElementById("dexPreview");
  dexPreview.innerHTML = "";
  var sample = shuffle(VOCAB).slice(0, 4);
  sample.forEach(function (v) {
    var row = document.createElement("div");
    row.className = "dp-row";
    row.innerHTML = '<span class="dp-en">' + v.en + '</span><span class="dp-zh">' + v.zh + '</span>';
    dexPreview.appendChild(row);
  });
}

/* ---------------- RENDER: BATTLE ---------------- */
function renderBattle() {
  document.getElementById("battleMonsterName").textContent = battle.monster.name;
  document.getElementById("monsterSprite").textContent = battle.monster.emoji;
  var cls = classById(state.classId);
  document.getElementById("playerSprite").textContent = cls.emoji;
  document.getElementById("battlePlayerName").textContent = state.name;
  renderBattleBars();
  renderCombo();
}
function renderBattleBars() {
  document.getElementById("monsterHpFill").style.width = clamp((battle.monsterHp / battle.monsterMaxHp) * 100, 0, 100) + "%";
  document.getElementById("monsterHpLabel").textContent = battle.monsterHp + "/" + battle.monsterMaxHp;
  document.getElementById("playerHpFill").style.width = clamp((battle.playerHp / battle.playerMaxHp) * 100, 0, 100) + "%";
  document.getElementById("playerHpLabel").textContent = battle.playerHp + "/" + battle.playerMaxHp;
  renderHud();
}
function renderCombo() {
  var el = document.getElementById("comboIndicator");
  el.textContent = state.stats.currentCombo >= 2 ? ("🔥 連勝 x" + state.stats.currentCombo) : "";
}
function renderQuestion() {
  var q = battle.question;
  document.getElementById("questionType").textContent = q.direction === "en2zh" ? "這個英文單字的中文意思是？" : "這個中文片語的英文是？";
  document.getElementById("questionWord").textContent = q.prompt;
  var grid = document.getElementById("choiceGrid");
  grid.innerHTML = "";
  q.choices.forEach(function (text) {
    var btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = text;
    btn.dataset.text = text;
    btn.addEventListener("click", function () { answerQuestion(text, btn); });
    grid.appendChild(btn);
  });
}

/* ---------------- MODALS ---------------- */
function openModal(html) {
  document.getElementById("modalBox").innerHTML = html;
  document.getElementById("modalOverlay").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
}

function showVictoryModal(monster, loot) {
  var html = '<h2>🎉 戰勝了 ' + monster.name + '！</h2>';
  html += '<p class="hint">獲得經驗值 +' + monster.xp + '</p>';
  if (loot) {
    html += '<div class="loot-reveal">' +
      '<div class="lr-emoji">' + loot.emoji + '</div>' +
      '<div class="lr-name">' + loot.name + '</div>' +
      '<div class="lr-rarity" style="color:var(--' + loot.rarity + ')">★ ' + RARITY_LABEL[loot.rarity] + ' 等級</div>' +
      '<div class="lr-bonus">' + lootBonusText(loot) + '</div>' +
      '</div>';
  } else {
    html += '<p class="hint">這次沒有掉落道具，下次再加油！</p>';
  }
  html += '<button class="btn btn-primary" id="modalCloseBtn">返回城鎮</button>';
  openModal(html);
  document.getElementById("modalCloseBtn").addEventListener("click", function () {
    closeModal();
    showScreen("hub");
    renderHub();
  });
}

function showDefeatModal(monster) {
  var html = '<h2>💤 你被 ' + monster.name + ' 擊倒了</h2>';
  html += '<p class="hint">村裡的醫生幫你治療，體力已完全恢復。再去複習一下單字，重新挑戰吧！</p>';
  html += '<button class="btn btn-secondary" id="modalCloseBtn">返回城鎮</button>';
  openModal(html);
  document.getElementById("modalCloseBtn").addEventListener("click", function () {
    closeModal();
    showScreen("hub");
    renderHub();
  });
}

function lootBonusText(item) {
  var parts = [];
  if (item.atk) parts.push("攻擊 +" + item.atk);
  if (item.hp) parts.push("HP +" + item.hp);
  if (item.crit) parts.push("爆擊率 +" + item.crit + "%");
  return parts.join(" ・ ") || "沒有額外加成，但很有紀念價值！";
}

/* ---------------- RENDER: BAG ---------------- */
function itemCountMap() {
  var map = {};
  state.inventory.forEach(function (id) { map[id] = (map[id] || 0) + 1; });
  return map;
}

function renderBag() {
  var weapon = getEquippedWeapon();
  var acc = getEquippedAccessory();
  var slots = document.getElementById("equippedSlots");
  slots.innerHTML =
    '<div class="equip-slot"><div class="slot-label">⚔️ 武器</div><div class="slot-emoji">' + weapon.emoji + '</div>' +
    '<div class="slot-name">' + weapon.name + '</div><div class="slot-bonus">' + lootBonusText(weapon) + '</div></div>' +
    '<div class="equip-slot"><div class="slot-label">🔮 飾品</div><div class="slot-emoji">' + acc.emoji + '</div>' +
    '<div class="slot-name">' + acc.name + '</div><div class="slot-bonus">' + lootBonusText(acc) + '</div></div>';

  var map = itemCountMap();
  var ids = Object.keys(map);
  var grid = document.getElementById("bagGrid");
  document.getElementById("bagCount").textContent = ids.length;
  grid.innerHTML = "";
  if (!ids.length) {
    grid.innerHTML = '<div class="empty-msg">背包是空的，去戰鬥贏取裝備吧！</div>';
    return;
  }
  ids.forEach(function (id) {
    var item = allLootById(id);
    if (!item) return;
    var equippedHere = (item.type === "weapon" && state.equipped.weapon === id) ||
                        (item.type === "accessory" && state.equipped.accessory === id);
    var card = document.createElement("div");
    card.className = "item-card rarity-" + item.rarity;
    card.innerHTML =
      '<div class="i-emoji">' + item.emoji + '</div>' +
      '<div class="i-name">' + item.name + '</div>' +
      '<div class="i-rarity" style="color:var(--' + item.rarity + ')">' + RARITY_LABEL[item.rarity] + '</div>' +
      '<div class="i-bonus">' + lootBonusText(item) + '</div>' +
      (map[id] > 1 ? '<div class="i-count">持有 x' + map[id] + '</div>' : '') +
      (equippedHere ? '<div class="i-equipped">✅ 已裝備</div>' : '');
    card.addEventListener("click", function () {
      if (item.type === "weapon") state.equipped.weapon = id;
      else state.equipped.accessory = id;
      saveState();
      renderBag();
      renderHud();
      toast("已裝備：" + item.name);
    });
    grid.appendChild(card);
  });
}

/* ---------------- RENDER: DEX ---------------- */
var dexFilterCat = "all";
function renderDexFilter() {
  var wrap = document.getElementById("dexFilter");
  var cats = ["all", "house", "transport", "travel", "life"];
  wrap.innerHTML = "";
  cats.forEach(function (c) {
    var btn = document.createElement("button");
    btn.textContent = c === "all" ? "全部" : CATS[c].emoji + " " + CATS[c].label;
    btn.className = dexFilterCat === c ? "active" : "";
    btn.addEventListener("click", function () { dexFilterCat = c; renderDex(); });
    wrap.appendChild(btn);
  });
}
function renderDex() {
  renderDexFilter();
  var list = document.getElementById("dexList");
  list.innerHTML = "";
  var items = VOCAB.filter(function (v) { return dexFilterCat === "all" || v.cat === dexFilterCat; });
  items.forEach(function (v) {
    var m = getMastery(v.id);
    var stars = Math.min(3, Math.floor(m.correct / 3));
    var row = document.createElement("div");
    row.className = "dex-item" + (stars >= 3 ? " mastered" : "");
    row.innerHTML =
      '<div><div class="d-en">' + v.en + '</div><div class="d-zh">' + v.zh + '</div></div>' +
      '<div class="d-stars">' + (stars > 0 ? "★".repeat(stars) + "☆".repeat(3 - stars) : (m.correct + m.wrong > 0 ? "☆☆☆" : "未挑戰")) + '</div>';
    list.appendChild(row);
  });
}

/* ---------------- RENDER: ACHIEVEMENTS ---------------- */
function renderAchievements() {
  var list = document.getElementById("achList");
  list.innerHTML = "";
  document.getElementById("achProgress").textContent =
    "已解鎖 " + state.achievementsUnlocked.length + " / " + ACHIEVEMENTS.length + " 項成就";
  ACHIEVEMENTS.forEach(function (a) {
    var unlocked = state.achievementsUnlocked.indexOf(a.id) !== -1;
    var card = document.createElement("div");
    card.className = "ach-card" + (unlocked ? " unlocked" : "");
    card.innerHTML =
      '<div class="a-emoji">' + (unlocked ? a.emoji : "🔒") + '</div>' +
      '<div><div class="a-name">' + a.name + '</div><div class="a-desc">' + a.desc + '</div></div>';
    list.appendChild(card);
  });
}

/* ---------------- RENDER: CHARACTER MODAL ---------------- */
function showCharacterModal() {
  var cls = classById(state.classId);
  var html = '<div class="char-card">' +
    '<div class="c-emoji">' + cls.emoji + '</div>' +
    '<div class="c-name">' + state.name + '</div>' +
    '<div class="c-class">' + cls.name + '</div>' +
    '<div class="c-title">' + titleForState() + '</div>' +
    '<div class="char-stat-grid">' +
      statBox("等級", "Lv. " + state.level) +
      statBox("經驗值", state.xp + " / " + xpToNext(state.level)) +
      statBox("最大HP", maxHp()) +
      statBox("攻擊力", playerAtk()) +
      statBox("爆擊率", playerCrit() + "%") +
      statBox("擊敗怪物數", state.stats.monstersDefeated) +
      statBox("答對題數", state.stats.totalCorrect) +
      statBox("最佳連勝", state.stats.bestCombo) +
    '</div>' +
    '<button class="btn btn-primary" id="modalCloseBtn" style="margin-top:16px;">關閉</button>' +
    '</div>';
  openModal(html);
  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
}
function statBox(label, value) {
  return '<div class="char-stat"><div class="cs-label">' + label + '</div><div class="cs-value">' + value + '</div></div>';
}

/* ---------------- SCREEN SWITCHING ---------------- */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
  var target = document.getElementById("screen-" + name);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.screen === name);
  });
}

function onNavClick(screenName) {
  if (screenName === "character") { showCharacterModal(); return; }
  showScreen(screenName);
  if (screenName === "hub") renderHub();
  if (screenName === "bag") renderBag();
  if (screenName === "dex") renderDex();
  if (screenName === "ach") renderAchievements();
  renderHud();
}

/* ---------------- CHARACTER CREATION ---------------- */
var selectedClassId = null;
function renderClassGrid() {
  var grid = document.getElementById("classGrid");
  grid.innerHTML = "";
  CLASSES.forEach(function (c) {
    var card = document.createElement("div");
    card.className = "class-card" + (selectedClassId === c.id ? " selected" : "");
    card.innerHTML =
      '<div class="class-emoji">' + c.emoji + '</div>' +
      '<div class="class-name">' + c.name + '</div>' +
      '<div class="class-stats">HP' + c.baseHp + ' / ATK' + c.baseAtk + ' / 爆擊' + c.baseCrit + '%</div>' +
      '<div class="class-desc">' + c.desc + '</div>';
    card.addEventListener("click", function () { selectedClassId = c.id; renderClassGrid(); });
    grid.appendChild(card);
  });
}

function startNewGame() {
  var nameInput = document.getElementById("nameInput");
  var name = (nameInput.value || "").trim() || "無名勇者";
  if (!selectedClassId) { toast("請先選擇一個職業！"); return; }
  state = freshState(name, selectedClassId);
  saveState();
  enterGame();
}

function enterGame() {
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("bottomNav").classList.remove("hidden");
  showScreen("hub");
  renderHub();
  renderHud();
}

/* ---------------- INIT ---------------- */
function init() {
  var saved = loadState();
  if (saved) {
    state = saved;
    if (!state.stats) state.stats = freshState("", "knight").stats;
    if (!state.collectedItemIds) state.collectedItemIds = [];
    document.getElementById("continueWrap").classList.remove("hidden");
    document.getElementById("btnContinue").addEventListener("click", enterGame);
  }

  renderClassGrid();
  document.getElementById("btnStartGame").addEventListener("click", startNewGame);
  document.getElementById("btnResetAll").addEventListener("click", function () {
    if (confirm("確定要重設所有進度嗎？這個動作無法復原。")) {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      location.reload();
    }
  });
  document.getElementById("btnFleeBattle").addEventListener("click", fleeBattle);

  document.querySelectorAll(".nav-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { onNavClick(btn.dataset.screen); });
  });

  showScreen("start");
}

document.addEventListener("DOMContentLoaded", init);
