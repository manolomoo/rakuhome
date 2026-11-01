(function () {
  'use strict';

  var SLOTS = ['01', '02', '03'];
  var EXT_RE = /^(.*)\.(jpe?g|png|heic)$/i;
  var LS_KEY = 'rakuhome-spots-ticks-v1';
  var TICK_AT_KEY = 'rakuhome-spots-tick-at-v1';
  var CLOUD_SEEN_KEY = 'rakuhome-spots-cloud-seen-v1';
  var EQUIP_KEY = 'rakuhome-spots-equip-v1';
  var EQUIP_KEY_DEMO = 'rakuhome-spots-equip-demo-v1';
  var SEEN_KEY = 'rakuhome-spots-titles-seen-v1';
  var SEEN_KEY_DEMO = 'rakuhome-spots-titles-seen-demo-v1';
  var LOOT_SEEN_KEY = 'rakuhome-spots-loot-seen-v1';
  var LOOT_SEEN_KEY_DEMO = 'rakuhome-spots-loot-seen-demo-v1';
  var LOOT_GEAR_KEY = 'rakuhome-spots-loot-gear-v1';
  var LOOT_GEAR_KEY_DEMO = 'rakuhome-spots-loot-gear-demo-v1';
  var DEMO_TIER = {
    '東京/港區': 3,
    '東京/新宿區': 2,
    '京都/中京區': 1
  };
  var LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';
  var HIDDEN_MARK = '？？？';

  function glyph(key) {
    var lib = typeof globalThis !== 'undefined' ? globalThis.SpotsIcons : null;
    if (lib && typeof lib.glyph === 'function') return lib.glyph(key || '');
    return '';
  }

  function lockMedalHtml() {
    return '<span class="tier-icon is-lock" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<rect x="5" y="11" width="14" height="9" rx="2"></rect>' +
      '<path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span>';
  }

  function iconKind(scope, tier) {
    if (scope === 'grand') return 'grand';
    if (scope === 'city') return 'city';
    if (tier === 1) return 'bronze';
    if (tier === 2) return 'silver';
    if (tier === 3) return 'gold';
    return '';
  }

  function medalHtml(iconKey, scope, tier, earned) {
    var kind = iconKind(scope, tier) || 'bronze';
    var state = earned ? 'is-earned' : 'is-teaser';
    return '<span class="tier-icon tier-icon-' + kind + ' ' + state + '" aria-hidden="true">' +
      glyph(iconKey) + '</span>';
  }

  function isHiddenWhenLocked(scope, tier) {
    if (scope === 'city' || scope === 'grand') return true;
    return scope === 'ward' && Number(tier) >= 2;
  }

  function nfc(value) {
    return String(value).normalize('NFC');
  }

  function fold(value) {
    return nfc(nfc(value).toLowerCase());
  }

  function basename(path) {
    var clean = nfc(path).replace(/[\u0000-\u001f]/g, '').trim();
    var parts = clean.split(/[/\\]/);
    return parts[parts.length - 1].trim();
  }

  function suggestName(ward, cat, name) {
    return nfc(ward) + '_' + nfc(cat) + '_' + nfc(name) + '_01.jpg';
  }

  function asFile(file) {
    if (typeof globalThis !== 'undefined' && globalThis.SpotsRpg && typeof globalThis.SpotsRpg.asFile === 'function') {
      return globalThis.SpotsRpg.asFile(file);
    }
    if (typeof file === 'string') return { name: file, day: '' };
    return null;
  }

  function analyze(ward, spots, files) {
    var list = Array.isArray(spots) ? spots : [];
    var stemToSpot = new Map();
    list.forEach(function (spot, index) {
      SLOTS.forEach(function (slot, slotIndex) {
        stemToSpot.set(fold(ward + '_' + spot.cat + '_' + spot.name + '_' + slot), {
          index: index,
          slotIndex: slotIndex
        });
      });
    });

    var found = list.map(function () { return [false, false, false]; });
    var days = list.map(function () { return ['', '', '']; });
    var unmatched = [];
    var seen = new Set();
    (Array.isArray(files) ? files : []).forEach(function (file) {
      var entry = asFile(file);
      if (!entry) return;
      var base = basename(entry.name);
      if (!base) return;
      var match = base.match(EXT_RE);
      var hit = match ? stemToSpot.get(fold(match[1].trim())) : null;
      if (hit) {
        found[hit.index][hit.slotIndex] = true;
        var day = entry.day || '';
        var prev = days[hit.index][hit.slotIndex];
        if (day && (!prev || day < prev)) days[hit.index][hit.slotIndex] = day;
        return;
      }
      if (!seen.has(base)) {
        seen.add(base);
        unmatched.push(base);
      }
    });

    var done = found.filter(function (slots) { return slots.some(Boolean); }).length;
    return { found: found, days: days, unmatched: unmatched, done: done, total: list.length };
  }

  function spotKey(city, ward, cat, name) {
    return [city, ward, cat, name].map(function (part) {
      return encodeURIComponent(nfc(part));
    }).join('|');
  }

  function pct(done, total) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function formatUpdated(value) {
    if (value === null || value === undefined || String(value).trim() === '') return '尚未偵測';
    return String(value);
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function appBase() {
    var url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    var path = url.pathname.replace(/index\.html$/, '');
    if (path.charAt(path.length - 1) !== '/') path += '/';
    url.pathname = path;
    return url.href;
  }

  function isDemo() {
    try {
      return new URLSearchParams(window.location.search).get('demo') === '1';
    } catch (err) {
      return false;
    }
  }

  function readTicks() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === 'object' ? data : {};
    } catch (err) {
      return {};
    }
  }

  function ticksFor(key) {
    var all = readTicks();
    var cur = [false, false, false];
    if (Array.isArray(all[key])) {
      for (var i = 0; i < 3; i++) cur[i] = Boolean(all[key][i]);
    }
    return cur;
  }

  function readTickAt() {
    try {
      var raw = localStorage.getItem(TICK_AT_KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === 'object' ? data : {};
    } catch (err) {
      return {};
    }
  }

  function tickAtFor(key) {
    var all = readTickAt();
    var cur = [null, null, null];
    if (Array.isArray(all[key])) {
      for (var i = 0; i < 3; i++) cur[i] = all[key][i] || null;
    }
    return cur;
  }

  function writeTick(key, index, checked) {
    var all = readTicks();
    var cur = ticksFor(key);
    cur[index] = Boolean(checked);
    if (cur.some(Boolean)) all[key] = cur;
    else delete all[key];
    try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (err) {}

    var ats = readTickAt();
    var row = tickAtFor(key).slice();
    if (checked) {
      if (!row[index]) row[index] = new Date().toISOString();
    } else {
      row[index] = null;
    }
    if (row.some(Boolean)) ats[key] = row;
    else delete ats[key];
    try { localStorage.setItem(TICK_AT_KEY, JSON.stringify(ats)); } catch (err) {}
    return cur;
  }

  function readJsonStore(key) {
    try {
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : null;
    } catch (err) {
      return null;
    }
  }

  function fileId(city, ward, name) {
    return wardKey(city, ward) + '\n' + basename(name);
  }

  function syncCloudSeen() {
    if (!model || model.demo) return {};
    var stored = readJsonStore(CLOUD_SEEN_KEY) || { seeded: false, stamp: '', files: {} };
    if (!stored.files || typeof stored.files !== 'object') stored.files = {};
    var stamp = '';
    if (typeof globalThis.SpotsRpg !== 'undefined') stamp = globalThis.SpotsRpg.normalizeDay(model.updated) || '';
    var current = {};
    model.wards.forEach(function (ward) {
      filesFor(ward).forEach(function (file) {
        var entry = asFile(file);
        if (!entry) return;
        current[fileId(ward.city, ward.ward, entry.name)] = entry.day || '';
      });
    });
    if (!stored.seeded) {
      stored = { seeded: true, stamp: stamp, files: {} };
      Object.keys(current).forEach(function (id) { stored.files[id] = current[id] || ''; });
    } else {
      var changedStamp = Boolean(stamp) && stamp !== (stored.stamp || '');
      Object.keys(current).forEach(function (id) {
        if (Object.prototype.hasOwnProperty.call(stored.files, id)) {
          if (current[id]) stored.files[id] = current[id];
          return;
        }
        if (current[id]) stored.files[id] = current[id];
        else if (changedStamp) stored.files[id] = stamp;
        else stored.files[id] = '';
      });
      Object.keys(stored.files).forEach(function (id) {
        if (!Object.prototype.hasOwnProperty.call(current, id)) delete stored.files[id];
      });
      stored.stamp = stamp || stored.stamp || '';
      stored.seeded = true;
    }
    try { localStorage.setItem(CLOUD_SEEN_KEY, JSON.stringify(stored)); } catch (err) {}
    return stored.files;
  }

  function tierCount(done, total) {
    done = Number(done) || 0;
    total = Number(total) || 0;
    if (total <= 0 || done <= 0) return 0;
    if (done >= total) return 3;
    if (done * 3 >= total * 2) return 2;
    if (done * 3 >= total) return 1;
    return 0;
  }

  function isWardComplete(done, total) {
    done = Number(done) || 0;
    total = Number(total) || 0;
    return total > 0 && done >= total;
  }

  function quotaForTier(total, tier) {
    total = Number(total) || 0;
    tier = Number(tier) || 0;
    if (tier <= 0 || total <= 0) return 0;
    if (tier >= 3) return total;
    var min = tier === 1 ? Math.ceil(total / 3) : Math.ceil((total * 2) / 3);
    var max = tier === 1 ? Math.ceil((total * 2) / 3) - 1 : total - 1;
    if (max < min) return -1;
    var done = Math.min(Math.max(min, 1), max);
    return tierCount(done, total) === tier ? done : -1;
  }

  function wardKey(city, ward) {
    return city + '/' + ward;
  }

  function planDemo(wards) {
    var files = {};
    var synthetic = {};
    (Array.isArray(wards) ? wards : []).forEach(function (ward) {
      var key = wardKey(ward.city, ward.ward);
      var tier = Object.prototype.hasOwnProperty.call(DEMO_TIER, key) ? DEMO_TIER[key] : 0;
      var spots = Array.isArray(ward.spots) ? ward.spots : [];
      if (!spots.length) {
        files[key] = [];
        if (tier > 0) synthetic[key] = { done: tier, total: 3 };
        return;
      }
      var count = quotaForTier(spots.length, tier);
      if (count < 0) count = 0;
      files[key] = spots.slice(0, count).map(function (spot) {
        return suggestName(ward.ward, spot.cat, spot.name);
      });
    });
    return { files: files, synthetic: synthetic };
  }

  function normEntry(entry) {
    if (typeof entry === 'string') return { name: entry, icon: '' };
    if (entry && typeof entry === 'object') {
      var name = '';
      if (entry.name != null && String(entry.name).trim()) name = String(entry.name);
      else if (entry.title != null) name = String(entry.title);
      return { name: name, icon: entry.icon != null ? String(entry.icon) : '' };
    }
    return { name: '', icon: '' };
  }

  function entryName(entry) {
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    return entry.name || '';
  }

  function entryIcon(entry) {
    if (!entry || typeof entry === 'string') return '';
    return entry.icon || '';
  }

  function normTitles(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var labels = Array.isArray(raw.tierLabels) && raw.tierLabels.length >= 3
      ? raw.tierLabels.slice(0, 3).map(String)
      : ['達標 1/3', '達標 2/3', '全區完成'];
    var map = {};
    (Array.isArray(raw.wards) ? raw.wards : []).forEach(function (row) {
      if (!row || !row.city || !row.ward) return;
      map[wardKey(String(row.city), String(row.ward))] = Array.isArray(row.titles)
        ? row.titles.map(normEntry)
        : [];
    });
    var cities = (Array.isArray(raw.cities) ? raw.cities : []).filter(function (row) {
      return row && row.city && row.title;
    }).map(function (row) {
      return {
        city: String(row.city),
        kicker: row.kicker ? String(row.kicker) : String(row.city),
        title: String(row.title),
        icon: row.icon ? String(row.icon) : ''
      };
    });
    var grand = raw.grand && typeof raw.grand === 'object' ? raw.grand : {};
    return {
      tierLabels: labels,
      map: map,
      cities: cities,
      grand: {
        kicker: grand.kicker ? String(grand.kicker) : '全部完成',
        title: grand.title ? String(grand.title) : '',
        icon: grand.icon ? String(grand.icon) : ''
      }
    };
  }

  function tierLabel(tier) {
    var labels = model && model.titles ? model.titles.tierLabels : ['達標 1/3', '達標 2/3', '全區完成'];
    return labels[tier - 1] || '';
  }

  function titlesFor(city, ward) {
    if (!model || !model.titles) return [];
    return model.titles.map[wardKey(city, ward)] || [];
  }

  function titleView(city, ward, done, total) {
    var tier = tierCount(done, total);
    var entries = titlesFor(city, ward);
    var earnedEntry = tier > 0 ? entries[tier - 1] : null;
    if (earnedEntry && entryName(earnedEntry)) {
      return {
        name: entryName(earnedEntry),
        icon: entryIcon(earnedEntry),
        tier: tier,
        earned: true,
        teaser: false
      };
    }
    var first = entries[0];
    if (first && entryName(first)) {
      return {
        name: entryName(first),
        icon: entryIcon(first),
        tier: 1,
        earned: false,
        teaser: true
      };
    }
    return { name: '', icon: '', tier: 0, earned: false, teaser: false };
  }

  function collectUnlocks(rows, titles) {
    titles = titles || normTitles(null);
    var unlocks = [];
    var byCity = {};
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var tier = tierCount(row.done, row.total);
      var entries = titles.map[wardKey(row.city, row.ward)] || [];
      var i;
      for (i = 1; i <= tier; i++) {
        var entry = entries[i - 1];
        var name = entryName(entry);
        if (!name) continue;
        unlocks.push({
          id: 'ward:' + wardKey(row.city, row.ward) + ':' + i,
          scope: 'ward',
          tier: i,
          city: row.city,
          ward: row.ward,
          title: name,
          icon: entryIcon(entry),
          threshold: titles.tierLabels[i - 1] || ''
        });
      }
      if (!byCity[row.city]) byCity[row.city] = [];
      byCity[row.city].push(row);
    });
    titles.cities.forEach(function (city) {
      var list = byCity[city.city] || [];
      var ready = list.length > 0 && list.every(function (row) {
        return isWardComplete(row.done, row.total);
      });
      if (!ready) return;
      unlocks.push({
        id: 'city:' + city.city,
        scope: 'city',
        tier: 0,
        city: city.city,
        ward: '',
        title: city.title,
        icon: city.icon || '',
        threshold: city.kicker
      });
    });
    var grandReady = rows.length > 0 && rows.every(function (row) {
      return isWardComplete(row.done, row.total);
    });
    if (grandReady && titles.grand.title) {
      unlocks.push({
        id: 'grand',
        scope: 'grand',
        tier: 0,
        city: '',
        ward: '',
        title: titles.grand.title,
        icon: titles.grand.icon || '',
        threshold: titles.grand.kicker
      });
    }
    return unlocks;
  }

  var model = null;
  var state = { cat: 'all', codex: 'all', gearOpen: '' };
  var seenCache = null;
  var lootBagCache = null;
  var lootSeenMem = { key: '', seeded: false, ids: null };
  var lootQueue = [];
  var lootNode = null;

  function normWard(raw) {
    var spots = Array.isArray(raw && raw.spots) ? raw.spots : [];
    return {
      date: raw && raw.date ? String(raw.date) : '',
      city: raw && raw.city ? String(raw.city) : '',
      ward: raw && raw.ward ? String(raw.ward) : '',
      spots: spots.filter(function (spot) {
        return spot && spot.cat && spot.name;
      }).map(function (spot) {
        return { cat: String(spot.cat), name: String(spot.name) };
      })
    };
  }

  function filesFor(ward) {
    var key = wardKey(ward.city, ward.ward);
    var list = model.files[key];
    return Array.isArray(list) ? list : [];
  }

  function filesForAnalyze(ward) {
    var seen = model && model.cloudSeen ? model.cloudSeen : {};
    var scan = model && model.scanIndex ? model.scanIndex : {};
    return filesFor(ward).map(function (file) {
      var entry = asFile(file);
      if (!entry) return null;
      var id = fileId(ward.city, ward.ward, entry.name);
      if (!entry.day) entry.day = scan[id] || seen[id] || '';
      return { name: entry.name, day: entry.day };
    }).filter(Boolean);
  }

  function indexScans(scans) {
    var map = {};
    if (typeof globalThis.SpotsRpg === 'undefined') return map;
    (Array.isArray(scans) ? scans : []).forEach(function (scan) {
      if (!scan || !scan.files || typeof scan.files !== 'object') return;
      var day = globalThis.SpotsRpg.normalizeDay(scan.at || scan.date || scan.updated);
      Object.keys(scan.files).forEach(function (key) {
        (Array.isArray(scan.files[key]) ? scan.files[key] : []).forEach(function (file) {
          var entry = asFile(file);
          if (!entry) return;
          var parts = String(key).split('/');
          if (parts.length < 2) return;
          var id = fileId(parts[0], parts.slice(1).join('/'), entry.name);
          var fileDay = entry.day || day;
          if (!fileDay) return;
          if (!map[id] || fileDay < map[id]) map[id] = fileDay;
        });
      });
    });
    return map;
  }

  function enrichDemo(wards, files) {
    var day = '2026-11-02';
    var out = {};
    Object.keys(files || {}).forEach(function (key) {
      out[key] = (Array.isArray(files[key]) ? files[key] : []).map(function (name) {
        return { name: name, date: day };
      });
    });
    (Array.isArray(wards) ? wards : []).forEach(function (ward) {
      if (ward.city !== '東京' || ward.ward !== '港區') return;
      var key = wardKey(ward.city, ward.ward);
      var extra = [];
      ward.spots.slice(0, 12).forEach(function (spot) {
        ['02', '03'].forEach(function (slot) {
          extra.push({
            name: nfc(ward.ward) + '_' + nfc(spot.cat) + '_' + nfc(spot.name) + '_' + slot + '.jpg',
            date: day
          });
        });
      });
      out[key] = (out[key] || []).concat(extra);
    });
    return out;
  }

  function progressFor(ward) {
    var stat = analyze(ward.ward, ward.spots, filesForAnalyze(ward));
    var key = wardKey(ward.city, ward.ward);
    var spots = ward.spots.map(function (spot, index) {
      var spotId = spotKey(ward.city, ward.ward, spot.cat, spot.name);
      var ticks = ticksFor(spotId);
      var cloud = stat.found[index] || [false, false, false];
      var cloudOn = cloud.some(Boolean);
      var tickOn = ticks.some(Boolean);
      return {
        cat: spot.cat,
        name: spot.name,
        key: spotId,
        cloud: cloud,
        ticks: ticks,
        cloudDays: stat.days[index] || ['', '', ''],
        tickDays: tickAtFor(spotId),
        cloudComplete: cloudOn,
        pending: tickOn && !cloudOn,
        complete: cloudOn || tickOn
      };
    });
    var done = spots.filter(function (spot) { return spot.complete; }).length;
    var cloudDone = spots.filter(function (spot) { return spot.cloudComplete; }).length;
    var pendingDone = spots.filter(function (spot) { return spot.pending; }).length;
    if (model.synthetic && model.synthetic[key] && stat.total === 0) {
      var syn = model.synthetic[key];
      return {
        done: syn.done,
        total: syn.total,
        cloudDone: syn.done,
        pendingDone: 0,
        found: stat.found,
        days: stat.days,
        unmatched: stat.unmatched,
        spots: spots,
        synthetic: true
      };
    }
    return {
      done: done,
      total: stat.total,
      cloudDone: cloudDone,
      pendingDone: pendingDone,
      found: stat.found,
      days: stat.days,
      unmatched: stat.unmatched,
      spots: spots,
      synthetic: false
    };
  }

  function scoreNow() {
    if (!model || !model.rpg || typeof globalThis.SpotsRpg === 'undefined') return null;
    var report = {
      wards: model.wards.map(function (ward) {
        var prog = progressFor(ward);
        return {
          city: ward.city,
          ward: ward.ward,
          spots: prog.spots.map(function (spot) {
            return {
              cat: spot.cat,
              cloud: spot.cloud,
              ticks: spot.ticks,
              cloudDays: spot.cloudDays,
              tickDays: spot.tickDays
            };
          })
        };
      })
    };
    return globalThis.SpotsRpg.evaluate(model.rpg, report);
  }

  function load() {
    var app = document.getElementById('app');
    app.innerHTML = '<p class="loading">讀取中…</p>';
    var base = appBase();
    function getJson(name) {
      return fetch(new URL(name, base), { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error(name);
        return res.json();
      });
    }
    var wardsReq = getJson('data/wards.json');
    var statusReq = getJson('data/status.json');
    var titlesReq = getJson('data/titles.json');
    var rpgReq = getJson('data/rpg.json');
    var lootReq = getJson('data/loot.json');

    Promise.all([
      wardsReq,
      statusReq.then(function (json) {
        return { json: json, error: false };
      }, function () {
        return { json: { updated: null, files: {} }, error: true };
      }),
      titlesReq.then(function (json) {
        return { json: json, error: false };
      }, function () {
        return { json: null, error: true };
      }),
      rpgReq.then(function (json) {
        return { json: json, error: false };
      }, function () {
        return { json: null, error: true };
      }),
      lootReq.then(function (json) {
        return { json: json, error: false };
      }, function () {
        return { json: null, error: true };
      })
    ]).then(function (loaded) {
      var wardsJson = loaded[0];
      var statusWrap = loaded[1];
      var titlesWrap = loaded[2];
      var rpgWrap = loaded[3];
      var lootWrap = loaded[4];
      var wards = Array.isArray(wardsJson && wardsJson.wards) ? wardsJson.wards.map(normWard) : [];
      var statusJson = statusWrap.json || {};
      model = {
        wards: wards,
        updated: Object.prototype.hasOwnProperty.call(statusJson, 'updated') ? statusJson.updated : null,
        files: statusJson.files && typeof statusJson.files === 'object' ? statusJson.files : {},
        scans: Array.isArray(statusJson.scans) ? statusJson.scans : [],
        statusError: statusWrap.error,
        titlesError: titlesWrap.error,
        titles: titlesWrap.error ? null : normTitles(titlesWrap.json),
        rpgError: rpgWrap.error || typeof globalThis.SpotsRpg === 'undefined',
        rpg: rpgWrap.error || typeof globalThis.SpotsRpg === 'undefined' ? null : globalThis.SpotsRpg.normConfig(rpgWrap.json),
        lootError: lootWrap.error || typeof globalThis.SpotsLoot === 'undefined',
        loot: lootWrap.error || typeof globalThis.SpotsLoot === 'undefined' ? null : globalThis.SpotsLoot.normLoot(lootWrap.json),
        synthetic: null,
        demo: false,
        scanIndex: {},
        cloudSeen: {}
      };
      if (isDemo()) {
        var plan = planDemo(model.wards);
        model.demo = true;
        model.updated = '示範模式';
        model.files = enrichDemo(model.wards, plan.files);
        model.synthetic = plan.synthetic;
        model.scans = [];
        model.statusError = false;
      }
      model.scanIndex = indexScans(model.scans);
      model.cloudSeen = syncCloudSeen();
      if (document.body) document.body.classList.toggle('is-demo', model.demo);
      render();
    }).catch(function () {
      app.innerHTML = '<p class="error">資料讀取失敗，請重新整理。</p>';
    });
  }

  function parseRoute() {
    var raw = window.location.hash.replace(/^#/, '');
    if (!raw || raw === '/') return null;
    var path = raw;
    try { path = decodeURIComponent(raw); } catch (err) {}
    var parts = path.split('/').filter(function (part) { return part.length > 0; });
    if (parts.length < 2) return null;
    return { city: parts[0], ward: parts.slice(1).join('/') };
  }

  function render() {
    if (!model) return;
    lootBagCache = null;
    var route = parseRoute();
    if (!route) renderHome();
    else renderWard(route.city, route.ward);
    maybeToast();
    maybeLoot();
  }

  function banner() {
    var html = '';
    if (model.demo) {
      html += '<p class="banner demo">示範模式：進度是模擬的雲端偵測結果，只存在這次開啟的畫面。</p>';
    } else if (model.statusError) {
      html += '<p class="banner">偵測狀態讀取失敗，燈號暫時無法更新。</p>';
    }
    if (model.titlesError) {
      html += '<p class="banner">稱號資料讀取失敗，徽章暫時無法顯示。</p>';
    }
    if (model.rpgError) {
      html += '<p class="banner">冒險資料讀取失敗，等級暫時無法顯示。</p>';
    }
    if (model.lootError) {
      html += '<p class="banner">戰利品資料讀取失敗，掉落暫時無法顯示。</p>';
    }
    return html;
  }

  function splitBar(done, total, cloud, pending) {
    var cloudW = total ? (cloud / total) * 100 : 0;
    var pendW = total ? (pending / total) * 100 : 0;
    return '<span class="is-cloud" style="width:' + cloudW + '%"></span>' +
      '<span class="is-pending" style="width:' + pendW + '%"></span>';
  }

  function splitCount(cloud, pending) {
    return '<p class="split-count"><span class="is-cloud">雲端認證 ' + cloud + '</span>' +
      '<span class="is-pending">待確認 ' + pending + '</span></p>';
  }

  function progressCard(kicker, done, total, showUpdated, parts) {
    var cloud = parts ? parts.cloud : done;
    var pending = parts ? parts.pending : 0;
    var width = total ? (done / total) * 100 : 0;
    var updated = showUpdated
      ? '<div class="updated"><span>最後偵測時間</span><strong>' + esc(formatUpdated(model.updated)) + '</strong></div>'
      : '';
    var bar = parts ? splitBar(done, total, cloud, pending) : '<span style="width:' + width + '%"></span>';
    var split = parts ? splitCount(cloud, pending) : '';
    var label = parts
      ? kicker + '，完成 ' + done + '，雲端認證 ' + cloud + '，待確認 ' + pending
      : kicker;
    return '<section class="hero-card">' + updated +
      '<div class="overall"><div><p class="kicker">' + esc(kicker) + '</p>' +
      '<p class="big num"><b>' + done + '</b><span>/ ' + total + '</span></p></div>' +
      '<p class="pct num">' + pct(done, total) + '%</p></div>' +
      '<div class="bar lg" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="' + esc(label) + '">' +
      bar + '</div>' + split +
      '<p class="hint">勾一下立刻 +3，也算完成這個景點，標成待確認。雲端第一張 +10，多拍的每一張再 +5，燈號轉綠就是雲端認證。兩邊經驗加在一起，稱號、魔王和寶箱也是。</p></section>';
  }

  function noteBlock(text) {
    return '<section class="note"><h2>說明</h2><p>' + text + '</p></section>';
  }

  function titleLine(view) {
    if (!view || !view.name || (!view.earned && !view.teaser)) {
      return '<p class="current-title is-empty"><span>目前稱號</span><b>尚未解鎖</b></p>';
    }
    if (!view.earned) {
      return '<p class="current-title is-teaser"><span>目前稱號</span>' +
        medalHtml(view.icon, 'ward', 1, false) + '<b>' + esc(view.name) + '</b></p>';
    }
    return '<p class="current-title is-on tier-' + view.tier + '"><span>目前稱號</span>' +
      medalHtml(view.icon, 'ward', view.tier, true) + '<b>' + esc(view.name) + '</b></p>';
  }

  function rowsOf() {
    return model.wards.map(function (ward) {
      var prog = progressFor(ward);
      return { ward: ward, prog: prog };
    });
  }

  function unlockRows(rows) {
    return rows.map(function (row) {
      return {
        city: row.ward.city,
        ward: row.ward.ward,
        done: row.prog.done,
        total: row.prog.total
      };
    });
  }

  function badgeHtml(opts) {
    var real = opts.title || '';
    var secret = !opts.on && isHiddenWhenLocked(opts.scope, opts.tier) && real && real !== '尚未設定';
    var teaser = !opts.on && !secret;
    var pending = !!opts.on && opts.cert === 'pending';
    var cls = 'badge scope-' + opts.scope +
      (opts.tier ? ' tier-' + opts.tier : '') +
      (opts.on ? ' is-on' : ' is-locked') +
      (secret ? ' is-secret' : '') +
      (teaser ? ' is-teaser' : '') +
      (pending ? ' is-pending-tier' : '');
    var state = opts.on ? '已解鎖' : '未解鎖';
    if (opts.on && opts.cert === 'pending') state += '，待確認';
    else if (opts.on && opts.cert === 'cloud') state += '，雲端認證';
    var shown = secret ? HIDDEN_MARK : real;
    var icon = secret ? lockMedalHtml() : medalHtml(opts.icon, opts.scope, opts.tier, !!opts.on);
    var lock = (!opts.on && !secret) ? LOCK_SVG : '';
    var cert = '';
    if (opts.on && opts.cert === 'pending') cert = '待確認 · ';
    else if (opts.on && opts.cert === 'cloud') cert = '雲端認證 · ';
    return '<li class="' + cls + '">' +
      '<span class="sr-only">' + state + '</span>' +
      '<span class="badge-line">' + icon +
      '<span class="badge-name">' + esc(shown) + '</span></span>' +
      '<span class="badge-threshold">' + lock + esc(cert) + esc(opts.threshold) + '</span></li>';
  }

  function certOf(on, cloudOk) {
    if (!on) return '';
    return cloudOk ? 'cloud' : 'pending';
  }

  function wallHtml(rows) {
    if (!model.titles) return '';
    var titles = model.titles;
    var unlocks = collectUnlocks(unlockRows(rows), titles);
    var onIds = {};
    unlocks.forEach(function (item) { onIds[item.id] = true; });
    var totalBadges = model.wards.length * 3 + titles.cities.length + (titles.grand.title ? 1 : 0);
    var grandOn = !!onIds.grand;
    var grandCloud = rows.length > 0 && rows.every(function (row) {
      return isWardComplete(row.prog.cloudDone, row.prog.total);
    });
    var grand = '<ul class="badge-feature">' + badgeHtml({
      scope: 'grand',
      tier: 0,
      on: grandOn,
      cert: certOf(grandOn, grandCloud),
      title: titles.grand.title,
      icon: titles.grand.icon,
      threshold: titles.grand.kicker
    }) + '</ul>';
    var cityItems = titles.cities.map(function (city) {
      var id = 'city:' + city.city;
      var list = rows.filter(function (row) { return row.ward.city === city.city; });
      var cloudReady = list.length > 0 && list.every(function (row) {
        return isWardComplete(row.prog.cloudDone, row.prog.total);
      });
      var on = !!onIds[id];
      return badgeHtml({
        scope: 'city',
        tier: 0,
        on: on,
        cert: certOf(on, cloudReady),
        title: city.title,
        icon: city.icon,
        threshold: city.kicker
      });
    }).join('');
    var byCity = [];
    var cityIndex = {};
    model.wards.forEach(function (ward) {
      if (!Object.prototype.hasOwnProperty.call(cityIndex, ward.city)) {
        cityIndex[ward.city] = byCity.length;
        byCity.push({ city: ward.city, wards: [] });
      }
      byCity[cityIndex[ward.city]].wards.push(ward);
    });
    var blocks = byCity.map(function (group) {
      var wardHtml = group.wards.map(function (ward) {
        var prog = null;
        rows.forEach(function (row) {
          if (!prog && row.ward === ward) prog = row.prog;
        });
        var tier = tierCount(prog.done, prog.total);
        var cloudTier = tierCount(prog.cloudDone, prog.total);
        var entries = titlesFor(ward.city, ward.ward);
        var view = titleView(ward.city, ward.ward, prog.done, prog.total);
        var badges = [1, 2, 3].map(function (level) {
          var entry = entries[level - 1];
          var name = entryName(entry);
          var on = tier >= level && !!name;
          return badgeHtml({
            scope: 'ward',
            tier: level,
            on: on,
            cert: certOf(on, cloudTier >= level),
            title: name || '尚未設定',
            icon: entryIcon(entry),
            threshold: tierLabel(level)
          });
        }).join('');
        var heldHtml = view.earned
          ? '<b class="tier-' + view.tier + '">' + medalHtml(view.icon, 'ward', view.tier, true) + esc(view.name) + '</b>'
          : (view.teaser
            ? '<b class="is-teaser">' + medalHtml(view.icon, 'ward', 1, false) + esc(view.name) + '</b>'
            : '<b class="is-empty">尚未解鎖</b>');
        return '<li class="wall-ward"><div class="wall-ward-h"><span>' + esc(ward.ward) +
          '</span>' + heldHtml + '</div><ul class="badge-row">' + badges + '</ul></li>';
      }).join('');
      return '<section class="wall-city"><h3>' + esc(group.city) + '</h3><ul class="wall-wards">' +
        wardHtml + '</ul></section>';
    }).join('');
    var lead = '各區完成的景點達 1/3、2/3 與全部時，依序解鎖三個稱號。自己勾選或雲端拍到都算完成；只有勾選、雲端還沒看到的，會標成待確認。一座城市裡每個區都完成，解鎖城市稱號；' +
      model.wards.length + ' 個區全部完成，解鎖最終稱號。';
    return '<section class="wall" id="badge-wall" aria-labelledby="wall-title">' +
      '<div class="sec-h"><h2 id="wall-title">稱號牆</h2><span>已解鎖 ' + unlocks.length + ' / ' + totalBadges + '</span></div>' +
      '<p class="wall-lead">' + lead + '</p>' +
      grand +
      '<ul class="city-row">' + cityItems + '</ul>' +
      blocks +
      '</section>';
  }

  function bossName(city, ward) {
    if (!model || !model.rpg || !model.rpg.bosses) return '';
    return model.rpg.bosses[wardKey(city, ward)] || '';
  }

  function stageName(tier) {
    var stages = model && model.rpg ? model.rpg.stages : [];
    var found = '';
    stages.forEach(function (stage) {
      if (!found && stage.tier === tier) found = stage.name;
    });
    if (found) return found;
    if (tier === 1) return '小怪';
    if (tier === 2) return '精英怪';
    if (tier === 3) return '魔王';
    return '';
  }

  function rankUnlocks(list) {
    return list.slice().sort(function (a, b) {
      function rank(item) {
        if (item.scope === 'grand') return 0;
        if (item.scope === 'city') return 1;
        return 10 - (item.tier || 0);
      }
      return rank(a) - rank(b);
    });
  }

  function equipStorageKey() {
    return model && model.demo ? EQUIP_KEY_DEMO : EQUIP_KEY;
  }

  function readEquip() {
    try {
      return localStorage.getItem(equipStorageKey()) || '';
    } catch (err) {
      return '';
    }
  }

  function writeEquip(id) {
    try { localStorage.setItem(equipStorageKey(), id || ''); } catch (err) {}
  }

  function resolveEquip(unlocks) {
    var titles = unlocks.filter(function (item) {
      return item.scope === 'ward' || item.scope === 'city' || item.scope === 'grand';
    });
    if (!titles.length) {
      writeEquip('');
      return null;
    }
    var seen = readSeen();
    var fresh = titles.filter(function (item) { return !seen[item.id]; });
    var pick = null;
    if (fresh.length === 1) pick = fresh[0];
    else if (fresh.length > 1) pick = rankUnlocks(fresh)[0];
    else {
      var stored = readEquip();
      titles.forEach(function (item) {
        if (!pick && item.id === stored) pick = item;
      });
      if (!pick) pick = rankUnlocks(titles)[0];
    }
    if (pick) writeEquip(pick.id);
    return pick;
  }

  function xpBarHtml(score) {
    if (!score) return '';
    var level = score.level;
    var role = score.classInfo.current;
    var width = level.span ? (level.into / level.span) * 100 : 0;
    var label = '等級 ' + level.level + '，' + role.name + '，經驗 ' + level.total + '，下一級 ' + level.nextXp +
      '，手勾 ' + score.manualXp + '，雲端認證 ' + score.cloudXp;
    return '<section class="xpbar" aria-label="' + esc(label) + '">' +
      '<p class="xp-lv num"><b>Lv.' + level.level + '</b><span>' + esc(role.name) + '</span></p>' +
      '<div class="xp-track"><div class="bar lg" role="progressbar" aria-valuemin="0" aria-valuemax="' + level.span +
      '" aria-valuenow="' + level.into + '" aria-label="升級進度"><span style="width:' + width + '%"></span></div>' +
      '<p class="xp-ratio num"><b>' + level.total + '</b><span> / ' + level.nextXp + '</span></p></div>' +
      '<p class="xp-split"><span class="is-pending">手勾 XP ' + score.manualXp + '</span>' +
      '<span class="is-cloud">雲端認證 XP ' + score.cloudXp + '</span></p></section>';
  }

  function sheetHtml(score, equipped, titleCount, titleTotal) {
    if (!score) return '';
    var role = score.classInfo.current;
    var next = score.classInfo.next;
    var nextLine = next
      ? '<p class="sheet-next">下一職 ' + esc(next.name) + ' · Lv.' + next.level + '</p>'
      : '<p class="sheet-next">職業已經登頂，再走也是傳說。</p>';
    var titleHtml;
    if (equipped) {
      titleHtml = medalHtml(equipped.icon, equipped.scope, equipped.tier, true) +
        '<b>' + esc(equipped.title) + '</b>';
    } else {
      titleHtml = '<b class="is-empty">尚未解鎖</b>';
    }
    var cities = score.perCity.map(function (city) {
      var width = city.total ? (city.done / city.total) * 100 : 0;
      var cloudW = city.total ? (city.cloudDone / city.total) * 100 : 0;
      var pendW = city.total ? (city.pendingDone / city.total) * 100 : 0;
      return '<li><div class="city-h"><span>' + esc(city.city) + '</span><b class="num">' + city.done +
        '<span> / ' + city.total + '</span></b></div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + city.total + '" aria-valuenow="' +
        city.done + '" aria-label="' + esc(city.city) + '完成 ' + city.done + '，共 ' + city.total + '">' +
        '<span class="is-cloud" style="width:' + cloudW + '%"></span>' +
        '<span class="is-pending" style="width:' + pendW + '%"></span></div>' +
        '<p class="split-count"><span class="is-cloud">雲端 ' + city.cloudDone + '</span>' +
        '<span class="is-pending">待確認 ' + city.pendingDone + '</span></p></li>';
    }).join('');
    return '<section class="sheet" aria-labelledby="sheet-title">' +
      '<div class="sheet-id"><p class="kicker" id="sheet-title">角色卡</p>' +
      '<p class="sheet-lv num">Lv.' + score.level.level + '</p>' +
      '<h2 class="sheet-class">' + esc(role.name) + '</h2>' +
      (role.blurb ? '<p class="sheet-blurb">' + esc(role.blurb) + '</p>' : '') +
      nextLine +
      '<p class="xp-split sheet-xp"><span class="is-pending">手勾 XP ' + score.manualXp + '</span>' +
      '<span class="is-cloud">雲端認證 XP ' + score.cloudXp + '</span></p>' +
      '<p class="sheet-title-line"><span>最新稱號</span>' + titleHtml + '</p>' +
      '<p class="sheet-count">稱號 <b class="num">' + titleCount + '</b><span> / ' + titleTotal + '</span></p></div>' +
      '<div class="sheet-cities"><p class="kicker">各城完成</p><ul>' + cities + '</ul></div>' +
      gearSection() + '</section>';
  }

  function bossLine(city, ward, defeated) {
    if (!defeated) {
      return '<p class="boss is-secret"><span class="sr-only">魔王尚未討伐</span>' +
        '<span class="boss-k" aria-hidden="true">魔王</span>' + lockMedalHtml() +
        '<b aria-hidden="true">' + HIDDEN_MARK + '</b></p>';
    }
    var name = bossName(city, ward) || '這區的無名魔王';
    return '<p class="boss is-down"><span class="sr-only">魔王已討伐</span><span class="boss-k">魔王</span><b>' +
      esc(name) + '</b></p>';
  }

  function stageList(tier, cloudTier) {
    var html = [1, 2, 3].map(function (level) {
      var state = 'is-locked';
      var word = '未討伐';
      if (level <= tier && level <= cloudTier) {
        state = 'is-cloud';
        word = '雲端認證';
      } else if (level <= tier) {
        state = 'is-pending';
        word = '待確認';
      }
      var name = stageName(level);
      return '<li class="' + state + '"><span class="sr-only">' + esc(name + word) + '</span>' +
        '<b aria-hidden="true">' + esc(name) + '</b><small aria-hidden="true">' + esc(word) + '</small></li>';
    }).join('');
    return '<ol class="stages">' + html + '</ol>';
  }

  function dungeonCard(row) {
    var ward = row.ward;
    var prog = row.prog;
    var view = titleView(ward.city, ward.ward, prog.done, prog.total);
    var placeIcon = view.earned ? medalHtml(view.icon, 'ward', view.tier, true) : '';
    var place = '<span class="place"><small>' + esc(ward.city) + '</small><span class="place-name">' +
      esc(ward.ward) + placeIcon + '</span></span>';
    var earned = titleLine(view);
    if (!ward.spots.length && !prog.synthetic) {
      return '<li><div class="ward"><div class="ward-top"><span class="date num">' + esc(ward.date) +
        '</span><span class="soon">清單整理中</span></div><div class="ward-mid">' + place +
        '</div>' + earned + '</div></li>';
    }
    var tier = tierCount(prog.done, prog.total);
    var cloudTier = tierCount(prog.cloudDone, prog.total);
    var href = '#/' + ward.city + '/' + ward.ward;
    var drop = view.earned
      ? '<p class="drop"><span>掉落稱號</span>' + medalHtml(view.icon, 'ward', view.tier, true) + '<b>' + esc(view.name) + '</b></p>'
      : titleLine(view);
    return '<li><a class="ward dungeon" href="' + esc(href) + '"><div class="ward-top"><span class="date num">' +
      esc(ward.date) + '</span><span class="frac num"><b>' + prog.done + '</b><span> / ' + prog.total +
      '</span></span></div><div class="ward-mid">' + place + '<i class="go" aria-hidden="true"></i></div>' +
      stageList(tier, cloudTier) +
      bossLine(ward.city, ward.ward, tier >= 3) +
      drop +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + prog.total +
      '" aria-valuenow="' + prog.done + '" aria-label="' + esc(ward.city + ward.ward) + '副本，完成 ' + prog.done +
      '，雲端認證 ' + prog.cloudDone + '，待確認 ' + prog.pendingDone + '">' +
      splitBar(prog.done, prog.total, prog.cloudDone, prog.pendingDone) + '</div>' +
      splitCount(prog.cloudDone, prog.pendingDone) + '</a></li>';
  }

  function chestHtml(score) {
    if (!score) return '';
    var open = 0;
    var items = score.achievements.map(function (item) {
      if (item.unlocked) {
        open += 1;
        return '<li class="chest is-open"><span class="sr-only">已解鎖</span>' +
          '<span class="chest-ico" aria-hidden="true">' + glyph(item.icon || 'chest') + '</span>' +
          '<span class="chest-name">' + esc(item.name) + '</span>' +
          (item.flavor ? '<span class="chest-flavor">' + esc(item.flavor) + '</span>' : '') + '</li>';
      }
      return '<li class="chest is-locked"><span class="sr-only">未解鎖</span>' +
        '<span class="chest-ico" aria-hidden="true">' + glyph('chest') + '</span>' +
        '<span class="chest-name" aria-hidden="true">' + HIDDEN_MARK + '</span></li>';
    }).join('');
    if (!items) return '';
    return '<section class="chests-sec" aria-labelledby="chest-title">' +
      '<div class="sec-h"><h2 id="chest-title">寶箱</h2><span>已打開 ' + open + ' / ' + score.achievements.length + '</span></div>' +
      '<p class="wall-lead">寶箱關著的時候只看得到問號。自己勾選或雲端拍到都能打開，取消勾選又沒有雲端照片，箱子會重新關上。</p>' +
      '<ul class="chests">' + items + '</ul></section>';
  }

  function lootSeenKey() {
    return model && model.demo ? LOOT_SEEN_KEY_DEMO : LOOT_SEEN_KEY;
  }

  function lootGearKey() {
    return model && model.demo ? LOOT_GEAR_KEY_DEMO : LOOT_GEAR_KEY;
  }

  function readLootSeen() {
    var key = lootSeenKey();
    if (lootSeenMem.key === key && lootSeenMem.seeded) return lootSeenMem.ids;
    var data = readJsonStore(key);
    if (!data || data.seeded !== true || !data.ids || typeof data.ids !== 'object' || Array.isArray(data.ids)) {
      return null;
    }
    lootSeenMem = { key: key, seeded: true, ids: data.ids };
    return data.ids;
  }

  function writeLootSeen(ids) {
    var key = lootSeenKey();
    lootSeenMem = { key: key, seeded: true, ids: ids };
    try { localStorage.setItem(key, JSON.stringify({ seeded: true, ids: ids })); } catch (err) {}
  }

  function readLootGear() {
    var data = readJsonStore(lootGearKey());
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  function writeLootGear(stored) {
    try { localStorage.setItem(lootGearKey(), JSON.stringify(stored || {})); } catch (err) {}
  }

  function setGearSlot(slot, id, manual) {
    if (globalThis.SpotsLoot.SLOTS.indexOf(slot) < 0) return;
    var stored = readLootGear();
    stored[slot] = { id: id || '', manual: !!manual && !!id };
    writeLootGear(stored);
  }

  function lootReport(score) {
    var spots = [];
    var bosses = [];
    model.wards.forEach(function (ward) {
      var prog = progressFor(ward);
      bosses.push({
        city: ward.city,
        ward: ward.ward,
        defeated: prog.total > 0 && tierCount(prog.done, prog.total) >= 3
      });
      (prog.spots || []).forEach(function (spot) {
        spots.push({
          city: ward.city,
          ward: ward.ward,
          cat: spot.cat,
          name: spot.name,
          complete: !!spot.complete
        });
      });
    });
    var achievements = [];
    if (score) {
      achievements = score.achievements.map(function (item) {
        return { id: item.id, name: item.name, unlocked: !!item.unlocked };
      });
    }
    return { spots: spots, bosses: bosses, achievements: achievements };
  }

  function lootBag() {
    if (lootBagCache) return lootBagCache;
    if (!model || !model.loot || typeof globalThis.SpotsLoot === 'undefined') return null;
    lootBagCache = globalThis.SpotsLoot.collect(model.loot, lootReport(scoreNow()));
    return lootBagCache;
  }

  function rarityClass(id) {
    if (id === 'rare' || id === 'epic' || id === 'legendary' || id === 'common') return 'rarity-' + id;
    return 'rarity-common';
  }

  function lootIconHtml(icon, extraClass) {
    var cls = 'loot-ico' + (extraClass ? ' ' + extraClass : '');
    return '<span class="' + cls + '" aria-hidden="true">' + esc(icon || '🎁') + '</span>';
  }

  function statNames() {
    return model && model.loot && model.loot.stats.length ? model.loot.stats : ['攻擊', '魔力', '防禦', '敏捷', '幸運'];
  }

  function statLine(stats) {
    var parts = [];
    statNames().forEach(function (name) {
      var amount = stats && stats[name] ? stats[name] : 0;
      if (amount) parts.push(esc(name) + ' +' + amount);
    });
    return parts.join('　');
  }

  function statPills(stats) {
    return '<ul class="stat-pills">' + statNames().map(function (name) {
      var amount = stats && stats[name] ? stats[name] : 0;
      return '<li class="' + (amount ? 'is-on' : 'is-zero') + '"><span>' + esc(name) +
        '</span><b class="num">+' + amount + '</b></li>';
    }).join('') + '</ul>';
  }

  function gearState() {
    var bag = lootBag();
    if (!bag || !model.loot || typeof globalThis.SpotsLoot === 'undefined') return null;
    var owned = [];
    Object.keys(bag.owned).forEach(function (id) { owned.push(bag.owned[id].item); });
    var stored = readLootGear();
    var resolved = globalThis.SpotsLoot.resolveGear(model.loot, owned, stored);
    var dirty = false;
    globalThis.SpotsLoot.SLOTS.forEach(function (slot) {
      if (!resolved[slot].cleared) return;
      stored[slot] = { id: resolved[slot].item ? resolved[slot].item.id : '', manual: false };
      dirty = true;
    });
    if (dirty) writeLootGear(stored);
    var equipped = [];
    var consumables = [];
    owned.forEach(function (item) {
      if (item.category === 'consumable') consumables.push(item);
    });
    globalThis.SpotsLoot.SLOTS.forEach(function (slot) {
      if (resolved[slot].item) equipped.push(resolved[slot].item);
    });
    var names = statNames();
    return {
      bag: bag,
      resolved: resolved,
      equippedStats: globalThis.SpotsLoot.sumStats(equipped, names),
      pocketStats: globalThis.SpotsLoot.sumStats(consumables, names),
      totals: globalThis.SpotsLoot.sumStats(equipped.concat(consumables), names)
    };
  }

  function ownedInSlot(bag, slot) {
    var list = [];
    Object.keys(bag.owned).forEach(function (id) {
      var item = bag.owned[id].item;
      if (item.slot === slot) list.push(item);
    });
    return globalThis.SpotsLoot.sortedByPower(list);
  }

  function slotLabel(slot) {
    if (slot === 'weapon') return '武器';
    if (slot === 'magic') return '魔法';
    return '防具';
  }

  function gearSection() {
    var view = gearState();
    if (!view) return '';
    var slots = globalThis.SpotsLoot.SLOTS.map(function (slot) {
      var row = view.resolved[slot];
      var item = row.item;
      var open = state.gearOpen === slot;
      var label = slotLabel(slot);
      var body = item
        ? lootIconHtml(item.icon) +
          '<span class="gear-copy"><span class="gear-k">' + label + (row.manual ? '・手動' : '') +
          '</span><span class="gear-name">' + esc(item.name) + '</span><span class="gear-bonus">' +
          (statLine(item.stats) || '沒有加成') + '</span></span>'
        : '<span class="loot-ico is-sil" aria-hidden="true">🎁</span><span class="gear-copy"><span class="gear-k">' +
          label + '</span><span class="gear-name is-empty">尚未入手</span></span>';
      return '<button type="button" class="gear-slot' + (item ? ' ' + rarityClass(item.rarity) : ' is-empty') +
        (open ? ' is-open' : '') + '" data-gear="' + slot + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        body + '</button>';
    }).join('');
    var picker = '';
    if (state.gearOpen && globalThis.SpotsLoot.SLOTS.indexOf(state.gearOpen) >= 0) {
      var slot = state.gearOpen;
      var choices = ownedInSlot(view.bag, slot);
      var current = view.resolved[slot];
      var label = slotLabel(slot);
      if (!choices.length) {
        picker = '<div class="gear-picker"><p class="gear-empty">這格還在等第一件' + label + '。先去完成景點吧。</p></div>';
      } else {
        var auto = current.manual
          ? '<button type="button" class="gear-auto" data-gear-auto="' + slot + '">換回自動，穿最好的</button>'
          : '<p class="gear-auto-note">現在自動穿著最好的一件。點下面可以改穿別的。</p>';
        var buttons = choices.map(function (item) {
          var on = current.item && current.item.id === item.id;
          return '<button type="button" class="gear-choice ' + rarityClass(item.rarity) + (on ? ' is-on' : '') +
            '" data-equip="' + esc(item.id) + '" data-slot="' + slot + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
            lootIconHtml(item.icon) + '<span class="gear-choice-copy"><b>' + esc(item.name) + '</b><small>' +
            esc(item.rarityName) + (statLine(item.stats) ? '・' + statLine(item.stats) : '') + '</small></span></button>';
        }).join('');
        picker = '<div class="gear-picker" role="group" aria-label="選擇' + label + '">' + auto + buttons + '</div>';
      }
    }
    var pocket = statLine(view.pocketStats);
    var equipped = statLine(view.equippedStats);
    var split = (equipped || pocket)
      ? '<p class="gear-split">' +
        (equipped ? '<span>裝備 ' + equipped + '</span>' : '') +
        (pocket ? '<span>口袋 ' + pocket + '</span>' : '') + '</p>'
      : '';
    var any = false;
    statNames().forEach(function (name) { if (view.totals[name]) any = true; });
    var totalHtml = any
      ? statPills(view.totals) + split
      : '<p class="gear-empty">能力合計還沒有加成，背包裡的風很大。</p>';
    return '<div class="sheet-gear"><p class="kicker">裝備</p><div class="gear-slots">' + slots +
      '</div>' + picker + '<p class="gear-total-k">能力合計</p>' + totalHtml + '</div>';
  }

  function codexHtml() {
    var bag = lootBag();
    if (!bag || !model.loot || !model.loot.items.length) return '';
    var summary = bag.summary;
    var counts = { all: { owned: summary.owned, total: summary.total } };
    model.loot.categories.forEach(function (cat) {
      counts[cat.id] = { owned: 0, total: 0 };
    });
    model.loot.items.forEach(function (item) {
      if (!counts[item.category]) return;
      counts[item.category].total += 1;
      if (bag.owned[item.id]) counts[item.category].owned += 1;
    });
    var cats = [{ id: 'all', name: '全部' }].concat(model.loot.categories);
    var chips = cats.map(function (cat) {
      var on = state.codex === cat.id;
      var count = counts[cat.id] || { owned: 0, total: 0 };
      return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-codex="' + esc(cat.id) +
        '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(cat.name) +
        ' <span class="num">' + count.owned + '/' + count.total + '</span></button>';
    }).join('');
    var rarityBits = model.loot.rarities.map(function (row) {
      var stat = summary.rarity[row.id] || { owned: 0, total: 0, name: row.name };
      return '<li class="' + rarityClass(row.id) + '"><span>' + esc(stat.name || row.name) + '</span><b class="num">' +
        stat.owned + '/' + stat.total + '</b></li>';
    }).join('');
    var view = gearState();
    var equipped = {};
    if (view) {
      globalThis.SpotsLoot.SLOTS.forEach(function (slot) {
        if (view.resolved[slot].item) equipped[view.resolved[slot].item.id] = true;
      });
    }
    var cells = model.loot.items.filter(function (item) {
      return state.codex === 'all' || item.category === state.codex;
    }).map(function (item) {
      var owned = bag.owned[item.id];
      if (!owned) {
        return '<li><div class="loot-cell is-locked"><span class="sr-only">未入手，' + esc(item.categoryName) +
          '</span><span class="loot-frame">' + lootIconHtml(item.icon, 'is-sil') +
          '<span class="loot-lock">' + LOCK_SVG + '</span></span><span class="loot-name" aria-hidden="true">' +
          HIDDEN_MARK + '</span><span class="loot-meta" aria-hidden="true">' + esc(item.categoryName) +
          '</span></div></li>';
      }
      var on = !!equipped[item.id];
      var inner = '<span class="loot-frame">' + lootIconHtml(item.icon) + '</span><span class="loot-name">' +
        esc(item.name) + '</span><span class="loot-meta">' + esc(item.rarityName) + '・' + esc(item.categoryName) +
        (on ? '・裝備中' : '') + '</span>' +
        (statLine(item.stats) ? '<span class="loot-stats">' + statLine(item.stats) + '</span>' : '') +
        (item.description ? '<span class="loot-desc">' + esc(item.description) + '</span>' : '');
      if (item.slot) {
        return '<li><button type="button" class="loot-cell is-owned ' + rarityClass(item.rarity) +
          (on ? ' is-equipped' : '') + '" data-equip="' + esc(item.id) + '" data-slot="' + item.slot +
          '" aria-pressed="' + (on ? 'true' : 'false') + '">' + inner + '</button></li>';
      }
      return '<li><div class="loot-cell is-owned ' + rarityClass(item.rarity) + '">' + inner + '</div></li>';
    }).join('');
    return '<section class="codex" id="loot-codex" aria-labelledby="codex-title"><div class="sec-h"><h2 id="codex-title">戰利品圖鑑</h2><span class="num">已入手 ' +
      summary.owned + ' / ' + summary.total + '</span></div>' +
      '<p class="wall-lead">完成的景點、討伐的魔王、打開的寶箱都會掉東西。同一進度在每台裝置、每次雲端掃描算出來都一樣。入手的亮出名號，還沒掉到的先鎖成剪影。武器、魔法、防具可以穿上；消耗品進口袋就直接加進能力。</p>' +
      '<ul class="rarity-counts">' + rarityBits + '</ul>' +
      '<div class="chips" role="toolbar" aria-label="圖鑑分類">' + chips + '</div>' +
      '<ul class="loot-grid">' + cells + '</ul></section>';
  }

  function dropPlace(drop) {
    if (drop.kind === 'spot') return drop.city + '・' + drop.ward + '・' + drop.name;
    if (drop.kind === 'boss') {
      var boss = bossName(drop.city, drop.ward);
      return drop.city + '・' + drop.ward + (boss ? '・' + boss : '');
    }
    return drop.achievementName || '寶箱';
  }

  function kindKicker(kind) {
    if (kind === 'boss') return '魔王討伐';
    if (kind === 'achievement') return '寶箱加碼';
    return '景點掉落';
  }

  function dismissLoot() {
    lootQueue.shift();
    if (lootNode && lootNode.parentNode) lootNode.parentNode.removeChild(lootNode);
    lootNode = null;
    if (lootQueue.length) paintLoot();
  }

  function paintLoot() {
    if (lootNode && lootNode.parentNode) lootNode.parentNode.removeChild(lootNode);
    lootNode = null;
    if (!lootQueue.length || typeof document === 'undefined') return;
    var drop = lootQueue[0];
    var item = drop.item;
    var bag = lootBag();
    var count = bag && bag.owned[item.id] ? bag.owned[item.id].count : 1;
    var dup = count > 1 ? '<p class="loot-dup">圖鑑裡已經有一件，再收一次也不會壞。</p>' : '';
    var extra = drop.extra ? '<p class="loot-dup">另外 ' + drop.extra + ' 件也一併收進圖鑑了。</p>' : '';
    var pending = lootQueue.length - 1;
    var button = pending > 0 ? '看下一件' : '收進圖鑑';
    var more = pending > 0 ? '<p class="loot-more">後面還有 ' + pending + ' 件</p>' : '';
    lootNode = document.createElement('div');
    lootNode.className = 'loot-reveal ' + rarityClass(item.rarity);
    lootNode.setAttribute('role', 'dialog');
    lootNode.setAttribute('aria-modal', 'true');
    lootNode.setAttribute('aria-labelledby', 'loot-reveal-title');
    lootNode.innerHTML =
      '<div class="loot-stage"><div class="loot-anim" aria-hidden="true"><div class="loot-glow"></div>' +
      '<div class="loot-chest"><div class="loot-lid"></div><div class="loot-box"><i></i></div></div></div>' +
      '<article class="loot-card"><p class="loot-kicker">' + esc(kindKicker(drop.kind)) + '・' + esc(item.rarityName) +
      '</p>' + lootIconHtml(item.icon, 'is-drop') + '<h2 id="loot-reveal-title">' + esc(item.name) +
      '</h2><p class="loot-place">' + esc(dropPlace(drop)) + '</p>' +
      (item.description ? '<p class="loot-desc">' + esc(item.description) + '</p>' : '') +
      (statLine(item.stats) ? '<p class="loot-stats">' + statLine(item.stats) + '</p>' : '') +
      dup + extra + '<button type="button" class="loot-take" data-loot-close>' + button + '</button>' +
      more + '</article></div>';
    document.body.appendChild(lootNode);
    var btn = lootNode.querySelector('[data-loot-close]');
    if (btn) {
      try { btn.focus({ preventScroll: true }); } catch (err) { btn.focus(); }
    }
  }

  function queueReveals(fresh) {
    var ranked = fresh.map(function (drop, index) {
      return { drop: drop, index: index, rank: drop.item.rarityRank || 0 };
    }).sort(function (a, b) {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.index - b.index;
    });
    var shown = ranked.slice(0, 4).map(function (row) { return row.drop; });
    var hidden = ranked.length - shown.length;
    if (hidden > 0 && shown.length) {
      var last = shown[shown.length - 1];
      shown[shown.length - 1] = {
        source: last.source,
        kind: last.kind,
        item: last.item,
        city: last.city,
        ward: last.ward,
        cat: last.cat,
        name: last.name,
        achievementName: last.achievementName,
        extra: (last.extra || 0) + hidden
      };
    }
    var was = lootQueue.length;
    lootQueue = lootQueue.concat(shown);
    if (!was) paintLoot();
  }

  function maybeLoot() {
    if (!model || typeof document === 'undefined') return;
    var bag = lootBag();
    if (!bag) return;
    var active = {};
    bag.drops.forEach(function (drop) { active[drop.source] = drop; });
    var ids = readLootSeen();
    if (!ids) {
      var seed = {};
      Object.keys(active).forEach(function (id) { seed[id] = 1; });
      writeLootSeen(seed);
      return;
    }
    var dirty = false;
    Object.keys(ids).forEach(function (id) {
      if (!active[id]) {
        delete ids[id];
        dirty = true;
      }
    });
    var fresh = [];
    bag.drops.forEach(function (drop) {
      if (ids[drop.source]) return;
      fresh.push(drop);
      ids[drop.source] = 1;
      dirty = true;
    });
    if (dirty) writeLootSeen(ids);
    if (fresh.length) queueReveals(fresh);
  }

  function rerenderKeepScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    render();
    window.scrollTo(0, y);
  }

  function renderHome() {
    document.title = '景點拍照進度';
    var rows = rowsOf();
    var done = 0;
    var total = 0;
    var cloud = 0;
    var pending = 0;
    rows.forEach(function (row) {
      if (!row.prog.total) return;
      done += row.prog.done;
      total += row.prog.total;
      cloud += row.prog.cloudDone;
      pending += row.prog.pendingDone;
    });
    var score = scoreNow();
    var unlocks = model.titles ? collectUnlocks(unlockRows(rows), model.titles) : [];
    var equipped = resolveEquip(unlocks);
    var titleTotal = model.titles
      ? model.wards.length * 3 + model.titles.cities.length + (model.titles.grand.title ? 1 : 0)
      : 0;
    var items = rows.map(dungeonCard).join('');
    document.getElementById('app').innerHTML =
      xpBarHtml(score) +
      '<header class="mast"><p class="brand">物件景點・走跳 RPG</p><h1>景點拍照進度</h1></header>' +
      banner() +
      sheetHtml(score, equipped, unlocks.length, titleTotal) +
      '<div class="desk-split">' +
      progressCard('整體進度', done, total, true, { cloud: cloud, pending: pending }) +
      noteBlock('請將照片上傳到 Google Drive 資料夾「物件景點／城市／區」，並使用建議檔名。同一景點最多三張，尾碼為 01、02、03。勾選會立刻加經驗，也算完成這個景點，畫面上寫待確認；雲端偵測到才亮綠燈，標成雲端認證。兩邊的經驗加在一起。取消勾選、又還沒被雲端拍到，稱號、魔王和寶箱會鎖回去。勾選只存在這台裝置。') +
      '</div>' +
      '<div class="sec-h"><h2>副本</h2><span>' + model.wards.length + ' 座</span></div>' +
      '<p class="wall-lead">每個區是一座副本。三分之一收小怪，三分之二打精英，全部清完才看得到魔王的名字，並掉落該區稱號。每完成一個景點會再掉一件戰利品，同一景點在每台裝置算出來都一樣。</p>' +
      '<ol class="wards">' + items + '</ol>' +
      chestHtml(score) +
      codexHtml() +
      wallHtml(rows);
  }

  function wardLadder(ward, prog) {
    if (!model.titles) return '';
    var tier = tierCount(prog.done, prog.total);
    var cloudTier = tierCount(prog.cloudDone, prog.total);
    var entries = titlesFor(ward.city, ward.ward);
    var badges = [1, 2, 3].map(function (level) {
      var entry = entries[level - 1];
      var name = entryName(entry);
      var on = tier >= level && !!name;
      return badgeHtml({
        scope: 'ward',
        tier: level,
        on: on,
        cert: certOf(on, cloudTier >= level),
        title: name || '尚未設定',
        icon: entryIcon(entry),
        threshold: tierLabel(level)
      });
    }).join('');
    return stageList(tier, cloudTier) + bossLine(ward.city, ward.ward, tier >= 3) +
      '<ul class="badge-row ward-ladder">' + badges + '</ul>';
  }

  function renderWard(city, wardName) {
    var ward = null;
    model.wards.forEach(function (item) {
      if (!ward && item.city === city && item.ward === wardName) ward = item;
    });
    var app = document.getElementById('app');
    if (!ward) {
      document.title = '找不到區域｜景點拍照進度';
      app.innerHTML = '<header class="mast"><a class="back" href="#/">返回總覽</a><h1>找不到這個區域</h1></header>' +
        '<p class="pending-note">請回到行程，重新選擇區域。</p>';
      return;
    }

    document.title = ward.city + ' ' + ward.ward + '｜景點拍照進度';
    var prog = progressFor(ward);
    var view = titleView(ward.city, ward.ward, prog.done, prog.total);
    var cats = new Map();
    ward.spots.forEach(function (spot) {
      cats.set(spot.cat, (cats.get(spot.cat) || 0) + 1);
    });

    var chips = '<button type="button" class="chip' + (state.cat === 'all' ? ' is-on' : '') +
      '" data-cat="all" aria-pressed="' + (state.cat === 'all' ? 'true' : 'false') + '">全部 <span>' +
      ward.spots.length + '</span></button>';
    cats.forEach(function (count, cat) {
      var on = state.cat === cat;
      chips += '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-cat="' + esc(cat) +
        '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(cat) + ' <span>' + count + '</span></button>';
    });

    var rows = ward.spots.map(function (spot, index) {
      var key = spotKey(ward.city, ward.ward, spot.cat, spot.name);
      var ticks = ticksFor(key);
      var slots = prog.found[index] || [false, false, false];
      var count = slots.filter(Boolean).length;
      var hit = count > 0;
      var pending = ticks.some(Boolean) && !hit;
      var lootHtml = '';
      if ((hit || ticks.some(Boolean)) && typeof globalThis.SpotsLoot !== 'undefined') {
        var bag = lootBag();
        if (bag) {
          var sid = globalThis.SpotsLoot.sourceId('spot', [ward.city, ward.ward, spot.cat, spot.name]);
          var found = bag.bySource[sid];
          if (found) {
            lootHtml = '<span class="spot-loot ' + rarityClass(found.item.rarity) + '">掉落 ' +
              esc(found.item.name) + '</span>';
          }
        }
      }
      var hidden = state.cat !== 'all' && state.cat !== spot.cat;
      var file = suggestName(ward.ward, spot.cat, spot.name);
      var boxes = SLOTS.map(function (slot, slotIndex) {
        return '<label class="tick"><input type="checkbox" data-tick="' + slotIndex + '"' +
          (ticks[slotIndex] ? ' checked' : '') + ' aria-label="' + slot + '"><span>' + slot + '</span></label>';
      }).join('');
      var lampClass = hit ? ' is-on is-cloud' : (pending ? ' is-pending' : '');
      var lampLabel = hit
        ? '已偵測 ' + count + ' 張，共 3 張，雲端認證'
        : (pending ? '待確認，雲端尚未偵測' : '尚未完成，0 張，共 3 張');
      var lampText = hit
        ? '<span class="num">' + count + '/3</span><span class="cert">雲端認證</span>'
        : (pending ? '<span class="cert">待確認</span>' : '<span class="num">0/3</span>');
      return '<tr class="spot' + (hidden ? ' is-hide' : '') + (pending ? ' has-pending' : '') + '" data-key="' + esc(key) + '" data-cat="' +
        esc(spot.cat) + '" data-hit="' + (hit ? '1' : '0') + '">' +
        '<td class="td-cat"><span class="cat">' + esc(spot.cat) + '</span></td>' +
        '<td class="td-name"><span class="spot-name">' + esc(spot.name) + '</span>' + lootHtml + '</td>' +
        '<td class="td-file"><span class="cell-k">建議檔名</span><div class="fname"><code>' + esc(file).replace(/_01\.jpg$/, '<wbr>_01.jpg') +
        '</code><button type="button" class="copy" data-copy="' + esc(file) + '">複製</button></div></td>' +
        '<td class="td-ticks"><span class="cell-k">自行勾選</span><div class="ticks">' + boxes + '</div></td>' +
        '<td class="td-lamp"><span class="cell-k">燈號</span><p class="lamp' + lampClass +
        '" aria-label="' + lampLabel + '"><i class="dot" aria-hidden="true"></i>' + lampText + '</p></td></tr>';
    }).join('');

    var shown = ward.spots.filter(function (spot) {
      return state.cat === 'all' || state.cat === spot.cat;
    }).length;

    var mismatch = '';
    if (prog.unmatched.length) {
      mismatch = '<section class="mismatch"><h2>檔名對不上清單</h2><ul>' +
        prog.unmatched.map(function (name) { return '<li><code>' + esc(name) + '</code></li>'; }).join('') +
        '</ul></section>';
    }

    var pending = '清單整理中';
    if (prog.synthetic) pending += '。示範模式先以 ' + prog.done + '/' + prog.total + ' 模擬完成比例。';
    var body = (ward.spots.length
      ? '<div class="sec-h"><h2>景點清單</h2><span id="shown">顯示 ' + shown + ' 個</span></div>' +
        '<div class="chips" role="toolbar" aria-label="分類篩選">' + chips + '</div>' +
        '<div class="table-wrap"><table class="spots"><caption class="sr-only">' + esc(ward.ward) +
        '景點拍照清單</caption><thead><tr><th scope="col">分類</th><th scope="col">名稱</th><th scope="col">建議檔名</th>' +
        '<th scope="col">自行勾選</th><th scope="col">燈號</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<p class="pending-note">' + esc(pending) + '</p>') + mismatch;

    var folder = '物件景點／' + ward.city + '／' + ward.ward;
    var plate = model.titles ? '<div class="title-plate">' + titleLine(view) + wardLadder(ward, prog) + '</div>' : '';
    var headIcon = view.earned ? medalHtml(view.icon, 'ward', view.tier, true) : '';
    app.innerHTML =
      xpBarHtml(scoreNow()) +
      '<header class="mast"><a class="back" href="#/">返回總覽</a><p class="brand">' + esc(ward.date) + ' · ' +
      esc(ward.city) + '</p><h1 class="' + (headIcon ? 'with-tier' : '') + '"><span>' + esc(ward.ward) +
      '</span>' + headIcon + '</h1>' + plate + '</header>' +
      banner() +
      '<div class="desk-split">' +
      (ward.spots.length || prog.synthetic
        ? progressCard(ward.ward + '進度', prog.done, prog.total, true, { cloud: prog.cloudDone, pending: prog.pendingDone })
        : '') +
      noteBlock('請上傳到 Google Drive「' + esc(folder) + '」，並使用建議檔名。勾選立刻 +3 XP，也算這個景點完成，燈號會寫待確認。雲端拍到才是雲端認證。取消勾選、雲端又還沒有照片，這座副本的稱號會鎖回去。完成的景點會掉一件戰利品，取消後若雲端也沒有照片，那件掉落會鎖回去。') +
      '</div>' +
      body;
  }

  function seenStorageKey() {
    return model && model.demo ? SEEN_KEY_DEMO : SEEN_KEY;
  }

  function readSeen() {
    if (seenCache) return seenCache;
    try {
      var raw = localStorage.getItem(seenStorageKey());
      var data = raw ? JSON.parse(raw) : {};
      seenCache = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch (err) {
      seenCache = {};
    }
    return seenCache;
  }

  function writeSeen(data) {
    seenCache = data;
    try { localStorage.setItem(seenStorageKey(), JSON.stringify(data)); } catch (err) {}
  }

  function toastHost() {
    var host = document.getElementById('toasts');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'toasts';
    host.className = 'toasts';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'false');
    document.body.appendChild(host);
    return host;
  }

  function toastMeta(item) {
    if (item.scope === 'ward') return item.city + '・' + item.ward + '・' + item.threshold;
    return item.threshold;
  }

  function pushToast(item) {
    spawnToast({
      id: item.id,
      className: 'scope-' + item.scope + (item.tier ? ' tier-' + item.tier : ''),
      icon: medalHtml(item.icon, item.scope, item.tier, true),
      kicker: '恭喜解鎖',
      title: item.title,
      meta: toastMeta(item)
    });
  }

  function pushClassToast(role, level) {
    spawnToast({
      id: 'class:' + role.name,
      className: 'scope-class',
      icon: '<span class="level-orb num">' + level + '</span>',
      kicker: '職業升級',
      title: role.name,
      meta: 'Lv.' + level + (role.blurb ? ' · ' + role.blurb : '')
    });
  }

  function pushAchToast(item) {
    spawnToast({
      id: 'ach:' + item.id,
      className: 'scope-ach',
      icon: '<span class="chest-ico is-open">' + glyph(item.icon || 'chest') + '</span>',
      kicker: '寶箱開啟',
      title: item.name,
      meta: item.flavor || '成就解鎖'
    });
  }

  function spawnToast(opts) {
    var host = toastHost();
    var node = document.createElement('div');
    node.className = 'toast ' + (opts.className || '');
    node.setAttribute('data-toast-id', opts.id);
    node.innerHTML =
      opts.icon +
      '<div class="toast-copy"><p class="toast-kicker">' + esc(opts.kicker) + '</p><p class="toast-title">' + esc(opts.title) +
      '</p><p class="toast-meta">' + esc(opts.meta) + '</p></div>' +
      '<button type="button" class="toast-x" data-toast-close aria-label="關閉提示">×</button>';
    host.appendChild(node);
    clearTimeout(node._timer);
    node._timer = setTimeout(function () { dismissToast(node); }, 12000);
  }

  function dismissToast(node) {
    if (!node || !node.parentNode) return;
    node.classList.add('is-out');
    var remove = function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    };
    node.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 400);
  }

  function maybeToast() {
    if (!model || typeof document === 'undefined') return;
    var rows = rowsOf();
    var unlocks = model.titles ? collectUnlocks(unlockRows(rows), model.titles) : [];
    var score = scoreNow();
    var seen = readSeen();
    var active = {};
    unlocks.forEach(function (item) { active[item.id] = true; });
    if (score) {
      score.achievements.forEach(function (item) {
        if (item.unlocked) active['ach:' + item.id] = true;
      });
    }
    Object.keys(seen).forEach(function (id) {
      if (id.indexOf('class:') === 0) return;
      if (id.indexOf('ach:') === 0) {
        if (!active[id]) delete seen[id];
        return;
      }
      if (!model.titles) return;
      if (!active[id]) delete seen[id];
    });
    var fresh = rankUnlocks(unlocks.filter(function (item) { return !seen[item.id]; }));
    if (fresh.length) writeEquip(fresh[0].id);
    fresh.forEach(function (item) { seen[item.id] = 1; });
    var achFresh = [];
    if (score) {
      score.achievements.forEach(function (item) {
        var id = 'ach:' + item.id;
        if (item.unlocked && !seen[id]) {
          achFresh.push(item);
          seen[id] = 1;
        }
      });
      var level = score.level.level;
      var seenLevel = 1;
      score.config.classes.forEach(function (role) {
        if (seen['class:' + role.name]) seenLevel = Math.max(seenLevel, role.level);
      });
      var current = score.classInfo.current;
      var classToast = null;
      if (current && current.level > 1 && current.level > seenLevel) classToast = current;
      score.config.classes.forEach(function (role) {
        if (role.level <= level) seen['class:' + role.name] = 1;
        else delete seen['class:' + role.name];
      });
      writeSeen(seen);
      if (classToast) pushClassToast(classToast, level);
    } else {
      writeSeen(seen);
    }
    fresh.forEach(pushToast);
    achFresh.forEach(pushAchToast);
  }

  function floatXp(x, y, amount) {
    var node = document.createElement('div');
    node.className = 'xp-float num';
    node.textContent = '+' + amount;
    node.style.left = Math.round(x) + 'px';
    node.style.top = Math.round(y) + 'px';
    document.body.appendChild(node);
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 900);
  }

  function applyFilter() {
    var rows = document.querySelectorAll('#app tr.spot');
    var shown = 0;
    rows.forEach(function (row) {
      var hide = state.cat !== 'all' && row.getAttribute('data-cat') !== state.cat;
      row.classList.toggle('is-hide', hide);
      if (!hide) shown += 1;
    });
    document.querySelectorAll('#app button.chip').forEach(function (chip) {
      var on = chip.getAttribute('data-cat') === state.cat;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var label = document.getElementById('shown');
    if (label) label.textContent = '顯示 ' + shown + ' 個';
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function flashCopy(btn, ok) {
    btn.classList.toggle('is-copied', ok);
    btn.textContent = ok ? '已複製' : '複製失敗';
    clearTimeout(btn._timer);
    btn._timer = setTimeout(function () {
      btn.classList.remove('is-copied');
      btn.textContent = '複製';
    }, 1600);
  }

  function onKey(event) {
    if (event.key === 'Escape' && lootQueue.length) {
      event.preventDefault();
      dismissLoot();
    }
  }

  function onClick(event) {
    if (lootNode && event.target === lootNode) {
      dismissLoot();
      return;
    }
    var lootClose = event.target.closest('[data-loot-close]');
    if (lootClose) {
      dismissLoot();
      return;
    }
    var closeBtn = event.target.closest('[data-toast-close]');
    if (closeBtn) {
      dismissToast(closeBtn.closest('.toast'));
      return;
    }
    var autoBtn = event.target.closest('[data-gear-auto]');
    if (autoBtn) {
      setGearSlot(autoBtn.getAttribute('data-gear-auto'), '', false);
      rerenderKeepScroll();
      return;
    }
    var equipBtn = event.target.closest('[data-equip]');
    if (equipBtn) {
      setGearSlot(equipBtn.getAttribute('data-slot'), equipBtn.getAttribute('data-equip'), true);
      rerenderKeepScroll();
      return;
    }
    var gearBtn = event.target.closest('[data-gear]');
    if (gearBtn) {
      var slot = gearBtn.getAttribute('data-gear');
      state.gearOpen = state.gearOpen === slot ? '' : slot;
      rerenderKeepScroll();
      return;
    }
    var codexBtn = event.target.closest('button[data-codex]');
    if (codexBtn) {
      state.codex = codexBtn.getAttribute('data-codex') || 'all';
      rerenderKeepScroll();
      return;
    }
    var copyBtn = event.target.closest('button[data-copy]');
    if (copyBtn) {
      event.preventDefault();
      writeClipboard(copyBtn.getAttribute('data-copy') || '').then(function (ok) {
        flashCopy(copyBtn, ok);
      });
      return;
    }
    var chip = event.target.closest('button[data-cat]');
    if (!chip) return;
    state.cat = chip.getAttribute('data-cat');
    applyFilter();
  }

  function onChange(event) {
    var input = event.target.closest('input[data-tick]');
    if (!input || !model) return;
    var row = input.closest('tr.spot');
    if (!row) return;
    var rect = input.getBoundingClientRect();
    var before = scoreNow();
    var beforeXp = before ? before.totalXp : 0;
    writeTick(row.getAttribute('data-key'), Number(input.getAttribute('data-tick')), input.checked);
    var scrollY = window.scrollY;
    render();
    window.scrollTo(0, scrollY);
    var after = scoreNow();
    var delta = (after ? after.totalXp : 0) - beforeXp;
    if (delta > 0) floatXp(rect.left + rect.width / 2, rect.top, delta);
  }

  var api = {
    analyze: analyze,
    suggestName: suggestName,
    spotKey: spotKey,
    pct: pct,
    formatUpdated: formatUpdated,
    fold: fold,
    tierCount: tierCount,
    isWardComplete: isWardComplete,
    quotaForTier: quotaForTier,
    planDemo: planDemo,
    normTitles: normTitles,
    collectUnlocks: collectUnlocks
  };
  if (typeof globalThis !== 'undefined') globalThis.SpotsCore = api;

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      var app = document.getElementById('app');
      if (!app) return;
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
      app.addEventListener('change', onChange);
      window.addEventListener('hashchange', function () {
        state.cat = 'all';
        state.gearOpen = '';
        render();
        window.scrollTo(0, 0);
      });
      load();
    });
  }
})();
