(function () {
  'use strict';

  var SLOTS = ['01', '02', '03'];
  var EXT_RE = /^(.*)\.(jpe?g|png|heic)$/i;
  var LS_KEY = 'rakuhome-spots-ticks-v1';
  var SEEN_KEY = 'rakuhome-spots-titles-seen-v1';
  var SEEN_KEY_DEMO = 'rakuhome-spots-titles-seen-demo-v1';
  var DEMO_TIER = {
    '東京/港區': 3,
    '東京/新宿區': 2,
    '京都/中京區': 1
  };
  var LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';
  var iconSeq = 0;

  function nextIconId(prefix) {
    iconSeq += 1;
    return prefix + '-' + iconSeq;
  }

  function starSvg(light, mid, deep, stroke) {
    var id = nextIconId('star');
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="3" y1="2" x2="18" y2="22">' +
      '<stop offset="0" stop-color="' + light + '"/><stop offset=".48" stop-color="' + mid + '"/>' +
      '<stop offset="1" stop-color="' + deep + '"/></linearGradient></defs>' +
      '<path fill="url(#' + id + ')" stroke="' + stroke + '" stroke-width=".8" stroke-linejoin="round" d="M12 1.7 14.85 8.05 21.6 8.7 16.5 13.15 18.05 19.75 12 16.35 5.95 19.75 7.5 13.15 2.4 8.7 9.15 8.05z"/>' +
      '<path fill="#fff" fill-opacity=".55" d="M12 1.7 10.15 6.9 9.15 8.05h5.7L12 3.35z"/></svg>';
  }

  function crownSvg(sparkle) {
    var id = nextIconId('crown');
    var body = '<defs><linearGradient id="' + id + '" x1="3" y1="4" x2="16" y2="20">' +
      '<stop offset="0" stop-color="#fff4c4"/><stop offset=".42" stop-color="#f0c14b"/>' +
      '<stop offset="1" stop-color="#c4841a"/></linearGradient></defs>' +
      '<path fill="url(#' + id + ')" stroke="#8a5a00" stroke-width=".7" stroke-linejoin="round" d="M2.8 16.2 5.2 7.6 9.3 12.1 12 3.8 14.7 12.1 18.8 7.6 21.2 16.2z"/>' +
      '<path fill="#a86b12" d="M2.8 16.6h18.4v2.5a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1z"/>' +
      '<path fill="#ffe7a0" d="M3.3 16.6h17.4v.7H3.3z"/>' +
      '<circle cx="12" cy="3.9" r="1.15" fill="#fff8dc" stroke="#8a5a00" stroke-width=".45"/>' +
      '<circle cx="5.15" cy="7.7" r="1.05" fill="#e25b4a" stroke="#8a3030" stroke-width=".35"/>' +
      '<circle cx="18.85" cy="7.7" r="1.05" fill="#3d8fd1" stroke="#1d4e73" stroke-width=".35"/>' +
      '<circle cx="12" cy="11.3" r="1.05" fill="#3dae6a" stroke="#1d6b40" stroke-width=".35"/>';
    if (!sparkle) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
    }
    function spark(x, y, s, fill) {
      var a = s * 0.32;
      return '<path fill="' + fill + '" stroke="#c4841a" stroke-width=".4" stroke-linejoin="round" d="M' + x + ' ' + (y - s) +
        ' L' + (x + a) + ' ' + (y - a) + ' L' + (x + s) + ' ' + y + ' L' + (x + a) + ' ' + (y + a) +
        ' L' + x + ' ' + (y + s) + ' L' + (x - a) + ' ' + (y + a) + ' L' + (x - s) + ' ' + y +
        ' L' + (x - a) + ' ' + (y - a) + ' Z"/>';
    }
    return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      spark(9, 11, 4.2, '#fff6c8') + spark(39.5, 9, 3.2, '#ffe08a') + spark(40, 34, 3.6, '#fff') +
      '<g transform="translate(6 9) scale(1.5)">' + body + '</g></svg>';
  }

  function iconKind(scope, tier) {
    if (scope === 'grand') return 'grand';
    if (scope === 'city') return 'city';
    if (tier === 1) return 'bronze';
    if (tier === 2) return 'silver';
    if (tier === 3) return 'gold';
    return '';
  }

  function tierIcon(kind) {
    var svg = '';
    if (kind === 'bronze') svg = starSvg('#fff0dc', '#e39a45', '#a86520', '#8a4e12');
    else if (kind === 'silver') svg = starSvg('#ffffff', '#d5dee8', '#7f95a8', '#5c7286');
    else if (kind === 'gold' || kind === 'city') svg = crownSvg(false);
    else if (kind === 'grand') svg = crownSvg(true);
    if (!svg) return '';
    return '<span class="tier-icon tier-icon-' + kind + '" aria-hidden="true">' + svg + '</span>';
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
    var unmatched = [];
    var seen = new Set();
    (Array.isArray(files) ? files : []).forEach(function (file) {
      if (typeof file !== 'string') return;
      var base = basename(file);
      if (!base) return;
      var match = base.match(EXT_RE);
      var hit = match ? stemToSpot.get(fold(match[1].trim())) : null;
      if (hit) {
        found[hit.index][hit.slotIndex] = true;
        return;
      }
      if (!seen.has(base)) {
        seen.add(base);
        unmatched.push(base);
      }
    });

    var done = found.filter(function (slots) { return slots.some(Boolean); }).length;
    return { found: found, unmatched: unmatched, done: done, total: list.length };
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

  function writeTick(key, index, checked) {
    var all = readTicks();
    var cur = ticksFor(key);
    cur[index] = Boolean(checked);
    if (cur.some(Boolean)) all[key] = cur;
    else delete all[key];
    try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (err) {}
    return cur;
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

  function normTitles(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var labels = Array.isArray(raw.tierLabels) && raw.tierLabels.length >= 3
      ? raw.tierLabels.slice(0, 3).map(String)
      : ['達標 1/3', '達標 2/3', '全區完成'];
    var map = {};
    (Array.isArray(raw.wards) ? raw.wards : []).forEach(function (row) {
      if (!row || !row.city || !row.ward) return;
      map[wardKey(String(row.city), String(row.ward))] = Array.isArray(row.titles)
        ? row.titles.map(String)
        : [];
    });
    var cities = (Array.isArray(raw.cities) ? raw.cities : []).filter(function (row) {
      return row && row.city && row.title;
    }).map(function (row) {
      return {
        city: String(row.city),
        kicker: row.kicker ? String(row.kicker) : String(row.city),
        title: String(row.title)
      };
    });
    var grand = raw.grand && typeof raw.grand === 'object' ? raw.grand : {};
    return {
      tierLabels: labels,
      map: map,
      cities: cities,
      grand: {
        kicker: grand.kicker ? String(grand.kicker) : '全部完成',
        title: grand.title ? String(grand.title) : ''
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

  function currentTitleName(city, ward, done, total) {
    var tier = tierCount(done, total);
    if (!tier) return '';
    return titlesFor(city, ward)[tier - 1] || '';
  }

  function collectUnlocks(rows, titles) {
    titles = titles || normTitles(null);
    var unlocks = [];
    var byCity = {};
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var tier = tierCount(row.done, row.total);
      var names = titles.map[wardKey(row.city, row.ward)] || [];
      var i;
      for (i = 1; i <= tier; i++) {
        if (!names[i - 1]) continue;
        unlocks.push({
          id: 'ward:' + wardKey(row.city, row.ward) + ':' + i,
          scope: 'ward',
          tier: i,
          city: row.city,
          ward: row.ward,
          title: names[i - 1],
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
        threshold: titles.grand.kicker
      });
    }
    return unlocks;
  }

  var model = null;
  var state = { cat: 'all' };
  var seenCache = null;

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

  function progressFor(ward) {
    var stat = analyze(ward.ward, ward.spots, filesFor(ward));
    var key = wardKey(ward.city, ward.ward);
    if (model.synthetic && model.synthetic[key] && stat.total === 0) {
      var syn = model.synthetic[key];
      return {
        done: syn.done,
        total: syn.total,
        found: stat.found,
        unmatched: stat.unmatched,
        synthetic: true
      };
    }
    return {
      done: stat.done,
      total: stat.total,
      found: stat.found,
      unmatched: stat.unmatched,
      synthetic: false
    };
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
      })
    ]).then(function (loaded) {
      var wardsJson = loaded[0];
      var statusWrap = loaded[1];
      var titlesWrap = loaded[2];
      var wards = Array.isArray(wardsJson && wardsJson.wards) ? wardsJson.wards.map(normWard) : [];
      var statusJson = statusWrap.json || {};
      model = {
        wards: wards,
        updated: Object.prototype.hasOwnProperty.call(statusJson, 'updated') ? statusJson.updated : null,
        files: statusJson.files && typeof statusJson.files === 'object' ? statusJson.files : {},
        statusError: statusWrap.error,
        titlesError: titlesWrap.error,
        titles: titlesWrap.error ? null : normTitles(titlesWrap.json),
        synthetic: null,
        demo: false
      };
      if (isDemo()) {
        var plan = planDemo(model.wards);
        model.demo = true;
        model.updated = '示範模式';
        model.files = plan.files;
        model.synthetic = plan.synthetic;
        model.statusError = false;
      }
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
    var route = parseRoute();
    if (!route) renderHome();
    else renderWard(route.city, route.ward);
    maybeToast();
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
    return html;
  }

  function progressCard(kicker, done, total, showUpdated) {
    var width = total ? (done / total) * 100 : 0;
    var updated = showUpdated
      ? '<div class="updated"><span>最後偵測時間</span><strong>' + esc(formatUpdated(model.updated)) + '</strong></div>'
      : '';
    return '<section class="hero-card">' + updated +
      '<div class="overall"><div><p class="kicker">' + esc(kicker) + '</p>' +
      '<p class="big num"><b>' + done + '</b><span>/ ' + total + '</span></p></div>' +
      '<p class="pct num">' + pct(done, total) + '%</p></div>' +
      '<div class="bar lg" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="' + esc(kicker) + '">' +
      '<span style="width:' + width + '%"></span></div>' +
      '<p class="hint">至少偵測到一張照片，這個景點即算完成。稱號只看燈號，自行勾選不計入。</p></section>';
  }

  function noteBlock(text) {
    return '<section class="note"><h2>說明</h2><p>' + text + '</p></section>';
  }

  function titleLine(name, tier) {
    var cls = 'current-title' + (name ? ' is-on tier-' + tier : ' is-empty');
    var text = name ? esc(name) : '尚未解鎖';
    var icon = name ? tierIcon(iconKind('ward', tier)) : '';
    return '<p class="' + cls + '"><span>目前稱號</span>' + icon + '<b>' + text + '</b></p>';
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
    var cls = 'badge scope-' + opts.scope +
      (opts.tier ? ' tier-' + opts.tier : '') +
      (opts.on ? ' is-on' : ' is-locked');
    var state = opts.on ? '已解鎖' : '未解鎖';
    var icon = tierIcon(iconKind(opts.scope, opts.tier));
    var lock = opts.on ? '' : LOCK_SVG;
    return '<li class="' + cls + '">' +
      '<span class="sr-only">' + state + '</span>' +
      '<span class="badge-line">' + icon +
      '<span class="badge-name">' + esc(opts.title) + '</span></span>' +
      '<span class="badge-threshold">' + lock + esc(opts.threshold) + '</span></li>';
  }

  function wallHtml(rows) {
    if (!model.titles) return '';
    var titles = model.titles;
    var unlocks = collectUnlocks(unlockRows(rows), titles);
    var onIds = {};
    unlocks.forEach(function (item) { onIds[item.id] = true; });
    var totalBadges = model.wards.length * 3 + titles.cities.length + (titles.grand.title ? 1 : 0);
    var grandOn = !!onIds.grand;
    var grand = '<ul class="badge-feature">' + badgeHtml({
      scope: 'grand',
      tier: 0,
      on: grandOn,
      title: titles.grand.title,
      threshold: titles.grand.kicker
    }) + '</ul>';
    var cityItems = titles.cities.map(function (city) {
      var id = 'city:' + city.city;
      return badgeHtml({
        scope: 'city',
        tier: 0,
        on: !!onIds[id],
        title: city.title,
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
        var names = titlesFor(ward.city, ward.ward);
        var held = tier ? (names[tier - 1] || '') : '';
        var badges = [1, 2, 3].map(function (level) {
          return badgeHtml({
            scope: 'ward',
            tier: level,
            on: tier >= level && !!names[level - 1],
            title: names[level - 1] || '尚未設定',
            threshold: tierLabel(level)
          });
        }).join('');
        var heldHtml = held
          ? '<b class="tier-' + tier + '">' + tierIcon(iconKind('ward', tier)) + esc(held) + '</b>'
          : '<b class="is-empty">尚未解鎖</b>';
        return '<li class="wall-ward"><div class="wall-ward-h"><span>' + esc(ward.ward) +
          '</span>' + heldHtml + '</div><ul class="badge-row">' + badges + '</ul></li>';
      }).join('');
      return '<section class="wall-city"><h3>' + esc(group.city) + '</h3><ul class="wall-wards">' +
        wardHtml + '</ul></section>';
    }).join('');
    var lead = '各區完成的景點達 1/3、2/3 與全部時，依序解鎖三個稱號。一座城市裡每個區都完成，解鎖城市稱號；' +
      model.wards.length + ' 個區全部完成，解鎖最終稱號。';
    return '<section class="wall" id="badge-wall" aria-labelledby="wall-title">' +
      '<div class="sec-h"><h2 id="wall-title">稱號牆</h2><span>已解鎖 ' + unlocks.length + ' / ' + totalBadges + '</span></div>' +
      '<p class="wall-lead">' + lead + '</p>' +
      grand +
      '<ul class="city-row">' + cityItems + '</ul>' +
      blocks +
      '</section>';
  }

  function renderHome() {
    document.title = '景點拍照進度';
    var rows = rowsOf();
    var done = 0;
    var total = 0;
    rows.forEach(function (row) {
      if (row.prog.total) {
        done += row.prog.done;
        total += row.prog.total;
      }
    });
    var items = rows.map(function (row) {
      var ward = row.ward;
      var prog = row.prog;
      var tier = tierCount(prog.done, prog.total);
      var held = currentTitleName(ward.city, ward.ward, prog.done, prog.total);
      var placeIcon = held ? tierIcon(iconKind('ward', tier)) : '';
      var place = '<span class="place"><small>' + esc(ward.city) + '</small><span class="place-name">' +
        esc(ward.ward) + placeIcon + '</span></span>';
      var earned = titleLine(held, tier);
      if (!ward.spots.length && !prog.synthetic) {
        return '<li><div class="ward"><div class="ward-top"><span class="date num">' + esc(ward.date) +
          '</span><span class="soon">清單整理中</span></div><div class="ward-mid">' + place +
          '</div>' + earned + '</div></li>';
      }
      var width = prog.total ? (prog.done / prog.total) * 100 : 0;
      var href = '#/' + ward.city + '/' + ward.ward;
      return '<li><a class="ward" href="' + esc(href) + '"><div class="ward-top"><span class="date num">' +
        esc(ward.date) + '</span><span class="frac num"><b>' + prog.done + '</b><span> / ' + prog.total +
        '</span></span></div><div class="ward-mid">' + place + '<i class="go" aria-hidden="true"></i></div>' +
        earned +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + prog.total +
        '" aria-valuenow="' + prog.done + '" aria-label="' + esc(ward.city + ward.ward) + '進度">' +
        '<span style="width:' + width + '%"></span></div></a></li>';
    }).join('');

    document.getElementById('app').innerHTML =
      '<header class="mast"><p class="brand">物件景點</p><h1>景點拍照進度</h1></header>' +
      banner() +
      '<div class="desk-split">' +
      progressCard('整體進度', done, total, true) +
      noteBlock('請將照片上傳到 Google Drive 資料夾「物件景點／城市／區」，並使用建議檔名。同一景點最多三張，尾碼為 01、02、03。燈號只看雲端偵測結果，每次偵測後會更新。勾選框是自己的紀錄，只存在這台裝置。稱號依各區已偵測完成的景點比例解鎖。') +
      '</div>' +
      wallHtml(rows) +
      '<div class="sec-h"><h2>行程</h2><span>' + model.wards.length + ' 個區域</span></div>' +
      '<ol class="wards">' + items + '</ol>';
  }

  function wardLadder(ward, prog) {
    if (!model.titles) return '';
    var tier = tierCount(prog.done, prog.total);
    var names = titlesFor(ward.city, ward.ward);
    var badges = [1, 2, 3].map(function (level) {
      return badgeHtml({
        scope: 'ward',
        tier: level,
        on: tier >= level && !!names[level - 1],
        title: names[level - 1] || '尚未設定',
        threshold: tierLabel(level)
      });
    }).join('');
    return '<ul class="badge-row ward-ladder">' + badges + '</ul>';
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
    var tier = tierCount(prog.done, prog.total);
    var held = currentTitleName(ward.city, ward.ward, prog.done, prog.total);
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
      var warn = ticks.some(Boolean) && !hit;
      var hidden = state.cat !== 'all' && state.cat !== spot.cat;
      var file = suggestName(ward.ward, spot.cat, spot.name);
      var boxes = SLOTS.map(function (slot, slotIndex) {
        return '<label class="tick"><input type="checkbox" data-tick="' + slotIndex + '"' +
          (ticks[slotIndex] ? ' checked' : '') + ' aria-label="' + slot + '"><span>' + slot + '</span></label>';
      }).join('');
      return '<tr class="spot' + (hidden ? ' is-hide' : '') + (warn ? ' has-warn' : '') + '" data-key="' + esc(key) + '" data-cat="' +
        esc(spot.cat) + '" data-hit="' + (hit ? '1' : '0') + '">' +
        '<td class="td-cat"><span class="cat">' + esc(spot.cat) + '</span></td>' +
        '<td class="td-name"><span class="spot-name">' + esc(spot.name) + '</span></td>' +
        '<td class="td-file"><span class="cell-k">建議檔名</span><div class="fname"><code>' + esc(file).replace(/_01\.jpg$/, '<wbr>_01.jpg') +
        '</code><button type="button" class="copy" data-copy="' + esc(file) + '">複製</button></div></td>' +
        '<td class="td-ticks"><span class="cell-k">自行勾選</span><div class="ticks">' + boxes + '</div></td>' +
        '<td class="td-lamp"><span class="cell-k">燈號</span><p class="lamp' + (hit ? ' is-on' : '') +
        '" aria-label="已偵測 ' + count + ' 張，共 3 張"><i class="dot" aria-hidden="true"></i><span class="num">' +
        count + '/3</span></p><p class="warn' + (warn ? '' : ' is-hide') + '">已勾但雲端還沒偵測到</p></td></tr>';
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
    var plate = model.titles ? '<div class="title-plate">' + titleLine(held, tier) + wardLadder(ward, prog) + '</div>' : '';
    var headIcon = held ? tierIcon(iconKind('ward', tier)) : '';
    app.innerHTML =
      '<header class="mast"><a class="back" href="#/">返回總覽</a><p class="brand">' + esc(ward.date) + ' · ' +
      esc(ward.city) + '</p><h1 class="' + (headIcon ? 'with-tier' : '') + '"><span>' + esc(ward.ward) +
      '</span>' + headIcon + '</h1>' + plate + '</header>' +
      banner() +
      '<div class="desk-split">' +
      (ward.spots.length || prog.synthetic ? progressCard(ward.ward + '進度', prog.done, prog.total, true) : '') +
      noteBlock('請上傳到 Google Drive「' + esc(folder) + '」，並使用建議檔名。燈號會在每次偵測後更新。勾選框只存在這台裝置，也不會讓稱號提前解鎖。') +
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
    var host = toastHost();
    var node = document.createElement('div');
    node.className = 'toast scope-' + item.scope + (item.tier ? ' tier-' + item.tier : '');
    node.setAttribute('data-toast-id', item.id);
    node.innerHTML =
      tierIcon(iconKind(item.scope, item.tier)) +
      '<div class="toast-copy"><p class="toast-kicker">恭喜解鎖</p><p class="toast-title">' + esc(item.title) +
      '</p><p class="toast-meta">' + esc(toastMeta(item)) + '</p></div>' +
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
    if (!model || !model.titles || typeof document === 'undefined') return;
    var rows = rowsOf();
    var unlocks = collectUnlocks(unlockRows(rows), model.titles);
    var seen = readSeen();
    var fresh = unlocks.filter(function (item) { return !seen[item.id]; });
    if (!fresh.length) return;
    fresh.sort(function (a, b) {
      function rank(item) {
        if (item.scope === 'grand') return 0;
        if (item.scope === 'city') return 1;
        return 10 - item.tier;
      }
      return rank(a) - rank(b);
    });
    fresh.forEach(function (item) { seen[item.id] = 1; });
    writeSeen(seen);
    fresh.forEach(pushToast);
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

  function onClick(event) {
    var closeBtn = event.target.closest('[data-toast-close]');
    if (closeBtn) {
      dismissToast(closeBtn.closest('.toast'));
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
    if (!input) return;
    var row = input.closest('tr.spot');
    if (!row) return;
    var ticks = writeTick(row.getAttribute('data-key'), Number(input.getAttribute('data-tick')), input.checked);
    var showWarn = ticks.some(Boolean) && row.getAttribute('data-hit') !== '1';
    var warn = row.querySelector('.warn');
    if (warn) warn.classList.toggle('is-hide', !showWarn);
    row.classList.toggle('has-warn', showWarn);
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
      app.addEventListener('change', onChange);
      window.addEventListener('hashchange', function () {
        state.cat = 'all';
        render();
        window.scrollTo(0, 0);
      });
      load();
    });
  }
})();
