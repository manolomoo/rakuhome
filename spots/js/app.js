(function () {
  'use strict';

  var SLOTS = ['01', '02', '03'];
  var EXT_RE = /^(.*)\.(jpe?g|png|heic)$/i;
  var LS_KEY = 'rakuhome-spots-ticks-v1';

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

  var model = null;
  var state = { cat: 'all' };

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
    var key = ward.city + '/' + ward.ward;
    var list = model.files[key];
    return Array.isArray(list) ? list : [];
  }

  function load() {
    var app = document.getElementById('app');
    app.innerHTML = '<p class="loading">讀取中…</p>';
    var base = appBase();
    var wardsReq = fetch(new URL('data/wards.json', base), { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('wards');
      return res.json();
    });
    var statusReq = fetch(new URL('data/status.json', base), { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('status');
      return res.json();
    });

    wardsReq.then(function (wardsJson) {
      return statusReq.then(function (statusJson) {
        return { wardsJson: wardsJson, statusJson: statusJson, statusError: false };
      }, function () {
        return { wardsJson: wardsJson, statusJson: { updated: null, files: {} }, statusError: true };
      });
    }).then(function (loaded) {
      var wards = Array.isArray(loaded.wardsJson && loaded.wardsJson.wards) ? loaded.wardsJson.wards : [];
      var statusJson = loaded.statusJson || {};
      model = {
        wards: wards.map(normWard),
        updated: Object.prototype.hasOwnProperty.call(statusJson, 'updated') ? statusJson.updated : null,
        files: statusJson.files && typeof statusJson.files === 'object' ? statusJson.files : {},
        statusError: loaded.statusError
      };
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
  }

  function banner() {
    if (!model.statusError) return '';
    return '<p class="banner">偵測狀態讀取失敗，燈號暫時無法更新。</p>';
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
      '<p class="hint">至少偵測到一張照片，這個景點即算完成。</p></section>';
  }

  function noteBlock(text) {
    return '<section class="note"><h2>說明</h2><p>' + text + '</p></section>';
  }

  function renderHome() {
    document.title = '景點拍照進度';
    var done = 0;
    var total = 0;
    var items = model.wards.map(function (ward) {
      var stat = analyze(ward.ward, ward.spots, filesFor(ward));
      if (ward.spots.length) {
        done += stat.done;
        total += stat.total;
      }
      return { ward: ward, stat: stat };
    }).map(function (row) {
      var ward = row.ward;
      var place = '<span class="place"><small>' + esc(ward.city) + '</small>' + esc(ward.ward) + '</span>';
      if (!ward.spots.length) {
        return '<li><div class="ward"><div class="ward-top"><span class="date num">' + esc(ward.date) +
          '</span><span class="soon">清單整理中</span></div><div class="ward-mid">' + place + '</div></div></li>';
      }
      var width = row.stat.total ? (row.stat.done / row.stat.total) * 100 : 0;
      var href = '#/' + ward.city + '/' + ward.ward;
      return '<li><a class="ward" href="' + esc(href) + '"><div class="ward-top"><span class="date num">' +
        esc(ward.date) + '</span><span class="frac num"><b>' + row.stat.done + '</b><span> / ' + row.stat.total +
        '</span></span></div><div class="ward-mid">' + place + '<i class="go" aria-hidden="true"></i></div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + row.stat.total +
        '" aria-valuenow="' + row.stat.done + '" aria-label="' + esc(ward.city + ward.ward) + '進度">' +
        '<span style="width:' + width + '%"></span></div></a></li>';
    }).join('');

    document.getElementById('app').innerHTML =
      '<header class="mast"><p class="brand">物件景點</p><h1>景點拍照進度</h1></header>' +
      banner() +
      '<div class="desk-split">' +
      progressCard('整體進度', done, total, true) +
      noteBlock('請將照片上傳到 Google Drive 資料夾「物件景點／城市／區」，並使用建議檔名。同一景點最多三張，尾碼為 01、02、03。燈號只看雲端偵測結果，每次偵測後會更新。勾選框是自己的紀錄，只存在這台裝置。') +
      '</div>' +
      '<div class="sec-h"><h2>行程</h2><span>' + model.wards.length + ' 個區域</span></div>' +
      '<ol class="wards">' + items + '</ol>';
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
    var stat = analyze(ward.ward, ward.spots, filesFor(ward));
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
      var slots = stat.found[index] || [false, false, false];
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
    if (stat.unmatched.length) {
      mismatch = '<section class="mismatch"><h2>檔名對不上清單</h2><ul>' +
        stat.unmatched.map(function (name) { return '<li><code>' + esc(name) + '</code></li>'; }).join('') +
        '</ul></section>';
    }

    var body = (ward.spots.length
      ? '<div class="sec-h"><h2>景點清單</h2><span id="shown">顯示 ' + shown + ' 個</span></div>' +
        '<div class="chips" role="toolbar" aria-label="分類篩選">' + chips + '</div>' +
        '<div class="table-wrap"><table class="spots"><caption class="sr-only">' + esc(ward.ward) +
        '景點拍照清單</caption><thead><tr><th scope="col">分類</th><th scope="col">名稱</th><th scope="col">建議檔名</th>' +
        '<th scope="col">自行勾選</th><th scope="col">燈號</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<p class="pending-note">清單整理中</p>') + mismatch;

    var folder = '物件景點／' + ward.city + '／' + ward.ward;
    app.innerHTML =
      '<header class="mast"><a class="back" href="#/">返回總覽</a><p class="brand">' + esc(ward.date) + ' · ' +
      esc(ward.city) + '</p><h1>' + esc(ward.ward) + '</h1></header>' +
      banner() +
      '<div class="desk-split">' +
      (ward.spots.length ? progressCard(ward.ward + '進度', stat.done, stat.total, true) : '') +
      noteBlock('請上傳到 Google Drive「' + esc(folder) + '」，並使用建議檔名。燈號會在每次偵測後更新。勾選框只存在這台裝置。') +
      '</div>' +
      body;
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
    fold: fold
  };
  if (typeof globalThis !== 'undefined') globalThis.SpotsCore = api;

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      var app = document.getElementById('app');
      if (!app) return;
      app.addEventListener('click', onClick);
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
