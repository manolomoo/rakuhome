(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SpotsLoot = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SLOTS = ['weapon', 'magic', 'armor'];
  var RARITY_FLOOR = { spot: 'common', boss: 'epic', achievement: 'rare' };
  var DEFAULT_RARITIES = [
    { id: 'common', name: '普通', rank: 1 },
    { id: 'rare', name: '稀有', rank: 2 },
    { id: 'epic', name: '史詩', rank: 3 },
    { id: 'legendary', name: '傳說', rank: 4 }
  ];
  var DEFAULT_CATEGORIES = [
    { id: 'weapon', name: '武器', slot: 'weapon' },
    { id: 'magic', name: '魔法/技能', slot: 'magic' },
    { id: 'armor', name: '防具/飾品', slot: 'armor' },
    { id: 'consumable', name: '消耗道具', slot: '' }
  ];
  var DEFAULT_STATS = ['攻擊', '魔力', '防禦', '敏捷', '幸運'];
  var DEFAULT_TABLES = {
    spot: [
      { rarity: 'common', weight: 620 },
      { rarity: 'rare', weight: 280 },
      { rarity: 'epic', weight: 85 },
      { rarity: 'legendary', weight: 15 }
    ],
    boss: [
      { rarity: 'epic', weight: 78 },
      { rarity: 'legendary', weight: 22 }
    ],
    achievement: [
      { rarity: 'rare', weight: 50 },
      { rarity: 'epic', weight: 40 },
      { rarity: 'legendary', weight: 10 }
    ]
  };

  function nfc(value) {
    var text = String(value == null ? '' : value);
    try { return text.normalize('NFC'); } catch (err) { return text; }
  }

  function imul(a, b) {
    var ah = (a >>> 16) & 65535;
    var al = a & 65535;
    var bh = (b >>> 16) & 65535;
    var bl = b & 65535;
    return (al * bl + ((ah * bl + al * bh) << 16)) | 0;
  }

  function hash32(value) {
    var text = String(value == null ? '' : value);
    var h = 2166136261;
    var i;
    for (i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mix32(seed) {
    var h = seed >>> 0;
    h = imul(h ^ (h >>> 16), 0x7feb352d);
    h = imul(h ^ (h >>> 15), 0x846ca68b);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function sourceId(kind, parts) {
    var bits = [nfc(kind)];
    var list = Array.isArray(parts) ? parts : [];
    var i;
    for (i = 0; i < list.length; i++) bits.push(nfc(list[i]));
    return bits.join('\u001f');
  }

  function positiveInt(value) {
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }

  function normTable(raw, fallback) {
    var rows = Array.isArray(raw) ? raw : [];
    var out = [];
    rows.forEach(function (row) {
      if (!row || !row.rarity) return;
      var weight = positiveInt(row.weight);
      if (!weight) return;
      out.push({ rarity: String(row.rarity), weight: weight });
    });
    return out.length ? out : fallback.slice();
  }

  function normLoot(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var rarities = (Array.isArray(raw.rarities) ? raw.rarities : []).map(function (row) {
      if (!row || !row.id || !row.name) return null;
      return { id: String(row.id), name: String(row.name), rank: positiveInt(row.rank) || 1 };
    }).filter(Boolean);
    if (!rarities.length) rarities = DEFAULT_RARITIES.slice();
    rarities.sort(function (a, b) { return a.rank - b.rank; });
    var rarityById = {};
    rarities.forEach(function (row) { rarityById[row.id] = row; });

    var categories = (Array.isArray(raw.categories) ? raw.categories : []).map(function (row) {
      if (!row || !row.id || !row.name) return null;
      var slot = row.slot ? String(row.slot) : '';
      if (SLOTS.indexOf(slot) < 0) slot = '';
      return { id: String(row.id), name: String(row.name), slot: slot };
    }).filter(Boolean);
    if (!categories.length) categories = DEFAULT_CATEGORIES.slice();
    var categoryById = {};
    var categoryOrder = {};
    categories.forEach(function (row, index) {
      categoryById[row.id] = row;
      categoryOrder[row.id] = index;
    });

    var stats = (Array.isArray(raw.stats) ? raw.stats : []).map(function (name) {
      return name ? String(name) : '';
    }).filter(Boolean);
    if (!stats.length) stats = DEFAULT_STATS.slice();

    var tablesIn = raw.dropTables && typeof raw.dropTables === 'object' ? raw.dropTables : {};
    var dropTables = {
      spot: normTable(tablesIn.spot, DEFAULT_TABLES.spot),
      boss: normTable(tablesIn.boss, DEFAULT_TABLES.boss),
      achievement: normTable(tablesIn.achievement, DEFAULT_TABLES.achievement)
    };

    var seen = {};
    var items = [];
    (Array.isArray(raw.items) ? raw.items : []).forEach(function (row) {
      if (!row || !row.id || !row.name || !row.category || !row.rarity) return;
      var id = String(row.id);
      if (seen[id]) return;
      var category = categoryById[String(row.category)];
      var rarity = rarityById[String(row.rarity)];
      if (!category || !rarity) return;
      var statMap = {};
      var sum = 0;
      var rawStats = row.stats && typeof row.stats === 'object' ? row.stats : {};
      stats.forEach(function (name) {
        var amount = positiveInt(rawStats[name]);
        if (!amount) return;
        statMap[name] = amount;
        sum += amount;
      });
      seen[id] = true;
      items.push({
        id: id,
        name: String(row.name),
        category: category.id,
        categoryName: category.name,
        slot: category.slot,
        rarity: rarity.id,
        rarityName: rarity.name,
        rarityRank: rarity.rank,
        icon: row.icon ? String(row.icon) : '🎁',
        description: row.description ? String(row.description) : '',
        stats: statMap,
        statSum: sum
      });
    });
    items.sort(function (a, b) {
      var ca = categoryOrder[a.category];
      var cb = categoryOrder[b.category];
      if (ca !== cb) return ca - cb;
      if (b.rarityRank !== a.rarityRank) return b.rarityRank - a.rarityRank;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

    var itemById = {};
    items.forEach(function (item) { itemById[item.id] = item; });
    return {
      stats: stats,
      rarities: rarities,
      rarityById: rarityById,
      categories: categories,
      categoryById: categoryById,
      dropTables: dropTables,
      items: items,
      itemById: itemById
    };
  }

  function pickWeighted(seed, table) {
    var total = 0;
    var i;
    for (i = 0; i < table.length; i++) total += table[i].weight;
    if (!total) return table.length ? table[0].rarity : 'common';
    var n = seed % total;
    var acc = 0;
    for (i = 0; i < table.length; i++) {
      acc += table[i].weight;
      if (n < acc) return table[i].rarity;
    }
    return table[table.length - 1].rarity;
  }

  function lowerRarity(config, rarity) {
    var list = config.rarities;
    var index = -1;
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === rarity) index = i;
    if (index > 0) return list[index - 1].id;
    return list.length ? list[0].id : rarity;
  }

  function clampRarity(config, kind, rarity) {
    var floorId = RARITY_FLOOR[kind] || 'common';
    var floor = config.rarityById[floorId];
    var rolled = config.rarityById[rarity];
    if (!floor) return rolled ? rarity : (config.rarities[0] ? config.rarities[0].id : rarity);
    if (!rolled || rolled.rank < floor.rank) return floor.id;
    return rolled.id;
  }

  function poolFor(config, rarity) {
    return config.items.filter(function (item) { return item.rarity === rarity; });
  }

  function dropFor(config, source, kind) {
    if (!config || !source) return null;
    var table = config.dropTables[kind] || config.dropTables.spot;
    var rarity = clampRarity(config, kind, pickWeighted(mix32(hash32(source + '\u001frarity')), table));
    var pool = poolFor(config, rarity);
    var guard = 0;
    while (!pool.length && guard < config.rarities.length) {
      rarity = lowerRarity(config, rarity);
      pool = poolFor(config, rarity);
      guard += 1;
    }
    if (!pool.length) return null;
    return pool[mix32(hash32(source + '\u001fitem')) % pool.length];
  }

  function pushDrop(bag, drop) {
    bag.drops.push(drop);
    bag.bySource[drop.source] = drop;
    var owned = bag.owned[drop.item.id];
    if (!owned) {
      owned = { item: drop.item, count: 0, sources: [] };
      bag.owned[drop.item.id] = owned;
    }
    owned.count += 1;
    owned.sources.push(drop.source);
  }

  function collect(rawConfig, report) {
    var config = rawConfig && rawConfig.items && rawConfig.itemById ? rawConfig : normLoot(rawConfig);
    var bag = { drops: [], owned: {}, bySource: {} };
    var data = report && typeof report === 'object' ? report : {};
    (Array.isArray(data.spots) ? data.spots : []).forEach(function (spot) {
      if (!spot || !spot.complete) return;
      var source = sourceId('spot', [spot.city, spot.ward, spot.cat, spot.name]);
      var item = dropFor(config, source, 'spot');
      if (!item) return;
      pushDrop(bag, {
        source: source,
        kind: 'spot',
        item: item,
        city: nfc(spot.city || ''),
        ward: nfc(spot.ward || ''),
        cat: nfc(spot.cat || ''),
        name: nfc(spot.name || ''),
        achievementName: ''
      });
    });
    (Array.isArray(data.bosses) ? data.bosses : []).forEach(function (boss) {
      if (!boss || !boss.defeated) return;
      var source = sourceId('boss', [boss.city, boss.ward]);
      var item = dropFor(config, source, 'boss');
      if (!item) return;
      pushDrop(bag, {
        source: source,
        kind: 'boss',
        item: item,
        city: nfc(boss.city || ''),
        ward: nfc(boss.ward || ''),
        cat: '',
        name: '',
        achievementName: ''
      });
    });
    (Array.isArray(data.achievements) ? data.achievements : []).forEach(function (row) {
      if (!row || !row.unlocked || !row.id) return;
      var source = sourceId('achievement', [row.id]);
      var item = dropFor(config, source, 'achievement');
      if (!item) return;
      pushDrop(bag, {
        source: source,
        kind: 'achievement',
        item: item,
        city: '',
        ward: '',
        cat: '',
        name: '',
        achievementName: nfc(row.name || '')
      });
    });
    var rarityTotals = {};
    config.rarities.forEach(function (row) {
      rarityTotals[row.id] = { id: row.id, name: row.name, rank: row.rank, owned: 0, total: 0 };
    });
    config.items.forEach(function (item) {
      if (!rarityTotals[item.rarity]) return;
      rarityTotals[item.rarity].total += 1;
      if (bag.owned[item.id]) rarityTotals[item.rarity].owned += 1;
    });
    var ownedCount = 0;
    config.items.forEach(function (item) { if (bag.owned[item.id]) ownedCount += 1; });
    bag.summary = {
      owned: ownedCount,
      total: config.items.length,
      rarity: rarityTotals
    };
    return bag;
  }

  function sumStats(items, statNames) {
    var names = Array.isArray(statNames) && statNames.length ? statNames : DEFAULT_STATS;
    var out = {};
    names.forEach(function (name) { out[name] = 0; });
    (Array.isArray(items) ? items : []).forEach(function (item) {
      if (!item || !item.stats) return;
      names.forEach(function (name) { out[name] += item.stats[name] || 0; });
    });
    return out;
  }

  function sortedByPower(items) {
    return (Array.isArray(items) ? items : []).slice().sort(function (a, b) {
      if ((b.rarityRank || 0) !== (a.rarityRank || 0)) return (b.rarityRank || 0) - (a.rarityRank || 0);
      if ((b.statSum || 0) !== (a.statSum || 0)) return (b.statSum || 0) - (a.statSum || 0);
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
  }

  function normStored(stored) {
    var out = {};
    SLOTS.forEach(function (slot) {
      var row = stored && stored[slot];
      var id = '';
      var manual = false;
      if (typeof row === 'string') {
        id = row;
        manual = !!row;
      } else if (row && typeof row === 'object') {
        id = row.id ? String(row.id) : '';
        manual = !!row.manual;
      }
      out[slot] = { id: id, manual: manual && !!id };
    });
    return out;
  }

  function resolveGear(rawConfig, ownedItems, stored) {
    var config = rawConfig && rawConfig.stats ? rawConfig : normLoot(rawConfig);
    var saved = normStored(stored);
    var bySlot = { weapon: [], magic: [], armor: [] };
    (Array.isArray(ownedItems) ? ownedItems : []).forEach(function (item) {
      if (!item || !item.slot || !bySlot[item.slot]) return;
      bySlot[item.slot].push(item);
    });
    var gear = {};
    SLOTS.forEach(function (slot) {
      var pool = sortedByPower(bySlot[slot]);
      var best = pool[0] || null;
      var pick = null;
      var manual = false;
      var cleared = false;
      if (saved[slot].manual) {
        pool.forEach(function (item) {
          if (!pick && item.id === saved[slot].id) pick = item;
        });
        if (pick) manual = true;
        else cleared = true;
      }
      if (!pick) pick = best;
      gear[slot] = {
        item: pick,
        manual: manual,
        cleared: cleared,
        bestId: best ? best.id : ''
      };
    });
    gear.stats = config.stats || DEFAULT_STATS.slice();
    return gear;
  }

  return {
    SLOTS: SLOTS.slice(),
    nfc: nfc,
    hash32: hash32,
    sourceId: sourceId,
    normLoot: normLoot,
    dropFor: dropFor,
    collect: collect,
    sumStats: sumStats,
    sortedByPower: sortedByPower,
    resolveGear: resolveGear
  };
});
