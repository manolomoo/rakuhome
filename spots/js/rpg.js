(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SpotsRpg = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_STAGES = [
    { tier: 1, name: '小怪' },
    { tier: 2, name: '精英怪' },
    { tier: 3, name: '魔王' }
  ];

  var DEFAULT_CLASSES = [
    { level: 1, name: '見習攝影師', blurb: '' }
  ];

  function pad2(value) {
    var n = Number(value);
    return (n < 10 ? '0' : '') + n;
  }

  function normalizeDay(value) {
    if (value === null || value === undefined) return '';
    var text = String(value).trim();
    if (!text) return '';
    var match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return match[1] + '-' + pad2(match[2]) + '-' + pad2(match[3]);
    var parsed = Date.parse(text);
    if (isNaN(parsed)) return '';
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return fmt.format(new Date(parsed));
    } catch (err) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }

  function asFile(file) {
    if (typeof file === 'string') return { name: file, day: '' };
    if (!file || typeof file !== 'object') return null;
    var name = file.name || file.file || file.path || '';
    if (typeof name !== 'string' || !String(name).trim()) return null;
    var raw = file.day || file.date || file.scannedAt || file.scanned || file.mtime || file.at || '';
    return { name: String(name), day: normalizeDay(raw) };
  }

  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function normConfig(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var xpRaw = raw.xp && typeof raw.xp === 'object' ? raw.xp : {};
    var tiers = Array.isArray(xpRaw.wardTier) ? xpRaw.wardTier.slice(0, 3) : [15, 30, 60];
    while (tiers.length < 3) tiers.push(0);
    var curve = raw.levelCurve && typeof raw.levelCurve === 'object' ? raw.levelCurve : {};
    var classes = (Array.isArray(raw.classes) ? raw.classes : []).map(function (row) {
      if (!row || !row.name) return null;
      return {
        level: Math.max(1, num(row.level, 1)),
        name: String(row.name),
        blurb: row.blurb ? String(row.blurb) : ''
      };
    }).filter(Boolean).sort(function (a, b) { return a.level - b.level; });
    if (!classes.length) classes = DEFAULT_CLASSES.slice();
    var stages = (Array.isArray(raw.stages) ? raw.stages : []).map(function (row) {
      if (!row || !row.name) return null;
      return { tier: num(row.tier, 0), name: String(row.name) };
    }).filter(function (row) { return row && row.tier >= 1 && row.tier <= 3; });
    if (stages.length < 3) stages = DEFAULT_STAGES.slice();
    stages.sort(function (a, b) { return a.tier - b.tier; });
    var bosses = {};
    (Array.isArray(raw.bosses) ? raw.bosses : []).forEach(function (row) {
      if (!row || !row.city || !row.ward || !row.name) return;
      bosses[String(row.city) + '/' + String(row.ward)] = String(row.name);
    });
    var achievements = (Array.isArray(raw.achievements) ? raw.achievements : []).map(function (row) {
      if (!row || !row.id || !row.name || !row.rule || !row.rule.type) return null;
      return {
        id: String(row.id),
        name: String(row.name),
        flavor: row.flavor ? String(row.flavor) : '',
        icon: row.icon ? String(row.icon) : 'chest',
        rule: {
          type: String(row.rule.type),
          min: num(row.rule.min, 1),
          minSize: num(row.rule.minSize, 3),
          all: Boolean(row.rule.all)
        }
      };
    }).filter(Boolean);
    return {
      xp: {
        perTick: num(xpRaw.perTick, 3),
        firstPhoto: num(xpRaw.firstPhoto, 10),
        extraPhoto: num(xpRaw.extraPhoto, 5),
        wardTier: tiers.map(function (value) { return num(value, 0); }),
        city: num(xpRaw.city, 80),
        grand: num(xpRaw.grand, 200)
      },
      levelCurve: {
        type: curve.type ? String(curve.type) : 'triangular',
        base: Math.max(1, num(curve.base, 36))
      },
      classes: classes,
      stages: stages,
      bosses: bosses,
      achievements: achievements
    };
  }

  function xpToReach(level, base) {
    level = Math.max(1, level | 0);
    return base * (level - 1) * level / 2;
  }

  function levelFromXp(xp, base) {
    xp = Math.max(0, num(xp, 0));
    base = Math.max(1, num(base, 36));
    var approx = Math.floor((1 + Math.sqrt(1 + (8 * xp) / base)) / 2);
    if (!isFinite(approx) || approx < 1) approx = 1;
    while (xpToReach(approx + 1, base) <= xp) approx += 1;
    while (approx > 1 && xpToReach(approx, base) > xp) approx -= 1;
    var floorXp = xpToReach(approx, base);
    var nextXp = xpToReach(approx + 1, base);
    return {
      level: approx,
      into: xp - floorXp,
      span: nextXp - floorXp,
      floorXp: floorXp,
      nextXp: nextXp,
      total: xp
    };
  }

  function classFor(level, classes) {
    var list = Array.isArray(classes) && classes.length ? classes : DEFAULT_CLASSES;
    var current = list[0];
    var next = null;
    var i;
    for (i = 0; i < list.length; i++) {
      if (level >= list[i].level) current = list[i];
    }
    for (i = 0; i < list.length; i++) {
      if (list[i].level > current.level) {
        next = list[i];
        break;
      }
    }
    return { current: current, next: next };
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

  function flags(list, size) {
    var out = [];
    var i;
    for (i = 0; i < size; i++) out.push(Boolean(list && list[i]));
    return out;
  }

  function daysOf(list, mask) {
    var out = [];
    var i;
    for (i = 0; i < 3; i++) {
      if (!mask[i]) {
        out.push('');
        continue;
      }
      var day = list && list[i] ? normalizeDay(list[i]) : '';
      out.push(day);
    }
    return out;
  }

  function earliest(days) {
    var best = '';
    days.forEach(function (day) {
      if (!day) return;
      if (!best || day < best) best = day;
    });
    return best;
  }

  function spotView(spot, xp) {
    var cloud = flags(spot && spot.cloud, 3);
    var ticks = flags(spot && spot.ticks, 3);
    var cloudCount = cloud.filter(Boolean).length;
    var tickCount = ticks.filter(Boolean).length;
    var filled = 0;
    var i;
    for (i = 0; i < 3; i++) if (cloud[i] || ticks[i]) filled += 1;
    var photoXp = cloudCount > 0 ? xp.firstPhoto + xp.extraPhoto * (cloudCount - 1) : 0;
    var tickXp = tickCount * xp.perTick;
    var day = earliest(daysOf(spot && spot.cloudDays, cloud).concat(daysOf(spot && spot.tickDays, ticks)));
    return {
      cat: spot && spot.cat ? String(spot.cat) : '',
      cloudCount: cloudCount,
      tickCount: tickCount,
      filled: filled,
      complete: filled > 0,
      cloudComplete: cloudCount > 0,
      pending: filled > 0 && cloudCount === 0,
      triple: filled >= 3,
      extras: Math.max(0, cloudCount - 1),
      photoXp: photoXp,
      tickXp: tickXp,
      day: day
    };
  }

  function achievementMet(rule, stats) {
    if (!rule) return false;
    if (rule.type === 'spots') return stats.spots >= rule.min;
    if (rule.type === 'cloudSpots') return stats.cloudSpots >= rule.min;
    if (rule.type === 'triples') return stats.triples >= rule.min;
    if (rule.type === 'extras') return stats.extras >= rule.min;
    if (rule.type === 'bosses') return stats.bosses >= rule.min;
    if (rule.type === 'cities') return stats.cities >= rule.min;
    if (rule.type === 'daily') return stats.bestDay >= rule.min;
    if (rule.type === 'category') {
      return stats.clearedCategorySizes.some(function (size) { return size >= rule.minSize; });
    }
    if (rule.type === 'wardsTouched') {
      if (rule.all) return stats.wardCount > 0 && stats.wardsTouched >= stats.wardCount;
      return stats.wardsTouched >= rule.min;
    }
    return false;
  }

  function addBonus(bucket, cloudReached, amount) {
    if (!amount) return;
    if (cloudReached) bucket.cloud += amount;
    else bucket.manual += amount;
  }

  function evaluate(rawConfig, report) {
    var config = normConfig(rawConfig);
    var xp = config.xp;
    var wardsIn = Array.isArray(report && report.wards) ? report.wards : [];
    var tickXp = 0;
    var photoXp = 0;
    var spots = 0;
    var cloudSpots = 0;
    var pendingSpots = 0;
    var triples = 0;
    var extras = 0;
    var bosses = 0;
    var wardsTouched = 0;
    var clearedCategorySizes = [];
    var byDay = {};
    var byCity = {};
    var cityOrder = [];
    var wardResults = [];
    var bonus = { manual: 0, cloud: 0 };

    wardsIn.forEach(function (ward) {
      var city = ward && ward.city ? String(ward.city) : '';
      var name = ward && ward.ward ? String(ward.ward) : '';
      var list = Array.isArray(ward && ward.spots) ? ward.spots : [];
      var views = list.map(function (spot) { return spotView(spot, xp); });
      var total = views.length;
      var done = 0;
      var cloudDone = 0;
      var pendingDone = 0;
      var cats = {};
      views.forEach(function (view) {
        tickXp += view.tickXp;
        photoXp += view.photoXp;
        extras += view.extras;
        if (view.triple) triples += 1;
        if (view.complete) {
          done += 1;
          spots += 1;
          if (view.day) byDay[view.day] = (byDay[view.day] || 0) + 1;
        }
        if (view.cloudComplete) {
          cloudDone += 1;
          cloudSpots += 1;
        }
        if (view.pending) pendingDone += 1;
        if (view.pending) pendingSpots += 1;
        if (!view.cat) return;
        if (!cats[view.cat]) cats[view.cat] = { done: 0, total: 0 };
        cats[view.cat].total += 1;
        if (view.complete) cats[view.cat].done += 1;
      });
      Object.keys(cats).forEach(function (cat) {
        var row = cats[cat];
        if (row.total > 0 && row.done >= row.total) clearedCategorySizes.push(row.total);
      });
      var tier = tierCount(done, total);
      var cloudTier = tierCount(cloudDone, total);
      if (done > 0) wardsTouched += 1;
      if (tier >= 3) bosses += 1;
      var level;
      for (level = 1; level <= tier; level++) {
        addBonus(bonus, cloudTier >= level, xp.wardTier[level - 1] || 0);
      }
      if (city) {
        if (!Object.prototype.hasOwnProperty.call(byCity, city)) {
          cityOrder.push(city);
          byCity[city] = { city: city, done: 0, total: 0, cloudDone: 0, pendingDone: 0, wards: 0, readyWards: 0, cloudWards: 0 };
        }
        var bucket = byCity[city];
        bucket.done += done;
        bucket.total += total;
        bucket.cloudDone += cloudDone;
        bucket.pendingDone += pendingDone;
        bucket.wards += 1;
        if (total > 0 && done >= total) bucket.readyWards += 1;
        if (total > 0 && cloudDone >= total) bucket.cloudWards += 1;
      }
      wardResults.push({
        city: city,
        ward: name,
        done: done,
        total: total,
        cloudDone: cloudDone,
        pendingDone: pendingDone,
        tier: tier,
        cloudTier: cloudTier,
        bossDefeated: tier >= 3
      });
    });

    var citiesReady = 0;
    cityOrder.forEach(function (city) {
      var bucket = byCity[city];
      var ready = bucket.wards > 0 && bucket.readyWards >= bucket.wards;
      var cloudReady = bucket.wards > 0 && bucket.cloudWards >= bucket.wards;
      bucket.ready = ready;
      bucket.cloudReady = cloudReady;
      if (ready) {
        citiesReady += 1;
        addBonus(bonus, cloudReady, xp.city);
      }
    });

    var allReady = wardResults.length > 0 && wardResults.every(function (ward) {
      return ward.total > 0 && ward.done >= ward.total;
    });
    var allCloud = wardResults.length > 0 && wardResults.every(function (ward) {
      return ward.total > 0 && ward.cloudDone >= ward.total;
    });
    if (allReady) addBonus(bonus, allCloud, xp.grand);

    var bestDay = 0;
    Object.keys(byDay).forEach(function (day) {
      if (byDay[day] > bestDay) bestDay = byDay[day];
    });

    var manualXp = tickXp + bonus.manual;
    var cloudXp = photoXp + bonus.cloud;
    var totalXp = manualXp + cloudXp;
    var level = levelFromXp(totalXp, config.levelCurve.base);
    var role = classFor(level.level, config.classes);
    var stats = {
      spots: spots,
      cloudSpots: cloudSpots,
      pendingSpots: pendingSpots,
      triples: triples,
      extras: extras,
      bosses: bosses,
      cities: citiesReady,
      bestDay: bestDay,
      wardsTouched: wardsTouched,
      wardCount: wardResults.length,
      clearedCategorySizes: clearedCategorySizes
    };
    var achievements = config.achievements.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        flavor: item.flavor,
        icon: item.icon,
        unlocked: achievementMet(item.rule, stats)
      };
    });

    return {
      config: config,
      tickXp: tickXp,
      photoXp: photoXp,
      manualBonus: bonus.manual,
      cloudBonus: bonus.cloud,
      manualXp: manualXp,
      cloudXp: cloudXp,
      totalXp: totalXp,
      level: level,
      classInfo: role,
      stats: stats,
      days: byDay,
      achievements: achievements,
      wards: wardResults,
      perCity: cityOrder.map(function (city) { return byCity[city]; }),
      grandReady: allReady,
      grandCloud: allCloud
    };
  }

  return {
    normalizeDay: normalizeDay,
    asFile: asFile,
    normConfig: normConfig,
    xpToReach: xpToReach,
    levelFromXp: levelFromXp,
    classFor: classFor,
    tierCount: tierCount,
    evaluate: evaluate
  };
});
