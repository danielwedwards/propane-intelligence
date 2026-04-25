// scoring.js — vanilla JS scoring + filtering engine for Propane Intelligence.
// Ports v1 (us-propane-market-map) computeMarketShare / proxScores / filter logic
// to a single namespace exposed at window.PI.
//
// All functions are pure aside from the cache layer; they mutate companies
// in-place via attachScores() once at load time.
//
// Loads BEFORE the React/Babel modules so window.PI is available everywhere.

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. Geometry helpers
  // -------------------------------------------------------------------------

  // Haversine distance in miles between two {lat, lng} points.
  function haversine(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return Infinity;
    var R = 3958.8; // Earth radius in miles
    var toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad;
    var dLng = (b.lng - a.lng) * toRad;
    var lat1 = a.lat * toRad;
    var lat2 = b.lat * toRad;
    var sinDLat = Math.sin(dLat / 2);
    var sinDLng = Math.sin(dLng / 2);
    var x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  // -------------------------------------------------------------------------
  // 2. County lookup — nearest-county-by-centroid index
  // Locations don't carry FIPS codes, so we reverse-geocode each location to
  // its nearest county centroid once at load time and cache the FIPS on the
  // location object.
  // -------------------------------------------------------------------------

  // Spatial bucket: 1° lat/lng cells. ~70 mi at the equator, plenty fine for
  // nearest-county lookups since counties span ~30 mi typically.
  var _countyGrid = null;       // { 'lat,lng': [countyIdx, ...] }
  var _counties = null;         // raw counties array
  var _countyByFips = null;     // FIPS -> county

  function buildCountyIndex(counties) {
    _counties = counties;
    _countyGrid = {};
    _countyByFips = {};
    for (var i = 0; i < counties.length; i++) {
      var c = counties[i];
      if (c.lat == null || c.lng == null) continue;
      _countyByFips[c.fips] = c;
      var key = Math.round(c.lat) + ',' + Math.round(c.lng);
      // Insert into 9 surrounding cells so edge lookups still find them.
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          var k = (Math.round(c.lat) + dy) + ',' + (Math.round(c.lng) + dx);
          (_countyGrid[k] = _countyGrid[k] || []).push(i);
        }
      }
    }
  }

  // Returns the FIPS of the nearest county to a {lat, lng} point.
  function nearestCountyFips(loc) {
    if (!_countyGrid || loc.lat == null) return null;
    var key = Math.round(loc.lat) + ',' + Math.round(loc.lng);
    var bucket = _countyGrid[key] || [];
    var bestIdx = -1, bestDist = Infinity;
    for (var i = 0; i < bucket.length; i++) {
      var c = _counties[bucket[i]];
      var d = haversine(loc, c);
      if (d < bestDist) { bestDist = d; bestIdx = bucket[i]; }
    }
    if (bestIdx === -1) return null;
    return _counties[bestIdx].fips;
  }

  // -------------------------------------------------------------------------
  // 3. Proximity scores — for each company, distance from each of its
  // locations to the nearest anchor (Lampton Love) location.
  // -------------------------------------------------------------------------

  function computeProxScores(companies, anchorId) {
    if (anchorId == null) anchorId = 'll';
    var anchor = companies.find(function (c) { return c.id === anchorId; });
    if (!anchor || !anchor.locations) return {};
    var anchorLocs = anchor.locations.filter(function (l) { return l.lat != null && l.lng != null; });
    var out = {};
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      if (c.id === anchorId) { out[c.id] = { mean: 0, min: 0, locsWithin50: 0, locsWithin100: 0 }; continue; }
      var locs = (c.locations || []).filter(function (l) { return l.lat != null && l.lng != null; });
      if (locs.length === 0) { out[c.id] = { mean: null, min: null, locsWithin50: 0, locsWithin100: 0 }; continue; }
      var sum = 0, min = Infinity, w50 = 0, w100 = 0;
      for (var j = 0; j < locs.length; j++) {
        var locMin = Infinity;
        for (var k = 0; k < anchorLocs.length; k++) {
          var d = haversine(locs[j], anchorLocs[k]);
          if (d < locMin) locMin = d;
        }
        sum += locMin;
        if (locMin < min) min = locMin;
        if (locMin <= 50) w50++;
        if (locMin <= 100) w100++;
      }
      out[c.id] = {
        mean: sum / locs.length,
        min: min,
        locsWithin50: w50,
        locsWithin100: w100,
      };
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 4. County overlap — for each company, set of FIPS counties shared with
  // anchor and percentage overlap.
  // -------------------------------------------------------------------------

  function attachLocationCounties(companies) {
    for (var i = 0; i < companies.length; i++) {
      var locs = companies[i].locations || [];
      for (var j = 0; j < locs.length; j++) {
        if (locs[j].lat != null && !locs[j].fips) {
          locs[j].fips = nearestCountyFips(locs[j]);
        }
      }
    }
  }

  function companyCounties(c) {
    var s = new Set();
    var locs = c.locations || [];
    for (var i = 0; i < locs.length; i++) if (locs[i].fips) s.add(locs[i].fips);
    return s;
  }

  function computeCountyOverlap(companies, anchorId) {
    if (anchorId == null) anchorId = 'll';
    var anchor = companies.find(function (c) { return c.id === anchorId; });
    if (!anchor) return {};
    var anchorSet = companyCounties(anchor);
    var out = {};
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      if (c.id === anchorId) {
        out[c.id] = { sharedCounties: Array.from(anchorSet), count: anchorSet.size, pct: 100 };
        continue;
      }
      var theirs = companyCounties(c);
      var shared = [];
      theirs.forEach(function (f) { if (anchorSet.has(f)) shared.push(f); });
      var union = new Set();
      anchorSet.forEach(function (f) { union.add(f); });
      theirs.forEach(function (f) { union.add(f); });
      out[c.id] = {
        sharedCounties: shared,
        count: shared.length,
        pct: union.size ? (shared.length / union.size) * 100 : 0,
        ownCount: theirs.size,
      };
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 5. Market share — county-weighted (by gallon consumption from the v1
  // counties_national.json metric `g`).
  // -------------------------------------------------------------------------

  function computeMarketShare(companies) {
    if (!_counties) return {};
    // Total addressable gallons.
    var totalG = 0;
    var byFips = {};
    for (var i = 0; i < _counties.length; i++) {
      totalG += _counties[i].g || 0;
      byFips[_counties[i].fips] = _counties[i];
    }
    // Count operators per county so each company gets a proportional slice of
    // that county's gallons.
    var operatorsByCounty = {};
    for (var i = 0; i < companies.length; i++) {
      var s = companyCounties(companies[i]);
      s.forEach(function (f) {
        operatorsByCounty[f] = (operatorsByCounty[f] || 0) + 1;
      });
    }
    var out = {};
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      var s = companyCounties(c);
      var nationalG = 0;
      var byState = {};
      s.forEach(function (f) {
        var county = byFips[f];
        if (!county) return;
        var share = (county.g || 0) / Math.max(1, operatorsByCounty[f]);
        nationalG += share;
        var st = (county.n || '').split(',').pop().trim();
        byState[st] = (byState[st] || 0) + share;
      });
      out[c.id] = {
        nationalG: nationalG,
        nationalPct: totalG ? (nationalG / totalG) * 100 : 0,
        byStateG: byState,
      };
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 6. Fit score — six-bucket weighted composite (0–100). Weights default to
  // the v2 design spec (Geo 25 / Size 20 / Ops 15 / Culture 15 / Fin 15 / Int 10).
  // -------------------------------------------------------------------------

  var DEFAULT_WEIGHTS = { geo: 25, size: 20, ops: 15, culture: 15, fin: 15, integ: 10 };

  function bucket(v, lo, hi) {
    if (v == null || isNaN(v)) return 50;
    if (hi === lo) return 50;
    var t = (v - lo) / (hi - lo);
    return Math.max(0, Math.min(100, Math.round(t * 100)));
  }

  function computeFitBreakdown(c, anchor, prox, overlap) {
    // Geography — closer mean distance + more shared counties ⇒ higher score.
    var p = prox && prox[c.id];
    var o = overlap && overlap[c.id];
    var geo = p && p.mean != null
      ? Math.round(Math.max(0, Math.min(100, 100 - (p.mean / 8))))   // 0 mi → 100, 800 mi → 0
      : 50;
    if (o) geo = Math.round(0.7 * geo + 0.3 * Math.min(100, o.pct * 2));

    // Size — log-scaled total locations vs anchor.
    var anchorLocs = (anchor.locations || []).length || 1;
    var ratio = ((c.locations || []).length) / anchorLocs;
    var size = Math.round(Math.max(0, Math.min(100, 60 + 30 * Math.log10(Math.max(0.05, ratio)))));

    // Operations — proxy from estAnnualGallons / location.
    var locsCount = (c.locations || []).length || 1;
    var gpl = (c.estAnnualGallons || 0) / locsCount;
    var ops = bucket(gpl, 200000, 2000000);

    // Culture — family / private / coop favored, public / pe penalized.
    var cultureMap = { family: 90, private: 75, coop: 65, ll: 80, pe: 35, public: 25 };
    var culture = cultureMap[c.ownership] != null ? cultureMap[c.ownership] : 50;

    // Financial — revenue per location.
    var rpl = (c.estRevenue || 0) / locsCount;
    var fin = bucket(rpl, 0.3, 4.5);

    // Integration — fewer states ⇒ easier to integrate.
    var states = (c.states || []).length || 1;
    var integ = Math.round(Math.max(0, Math.min(100, 110 - states * 6)));

    return { geo: geo, size: size, ops: ops, culture: culture, fin: fin, integ: integ };
  }

  function computeFitScore(breakdown, weights) {
    var w = weights || DEFAULT_WEIGHTS;
    var total = w.geo + w.size + w.ops + w.culture + w.fin + w.integ;
    if (total === 0) return 0;
    var s = breakdown.geo * w.geo
          + breakdown.size * w.size
          + breakdown.ops * w.ops
          + breakdown.culture * w.culture
          + breakdown.fin * w.fin
          + breakdown.integ * w.integ;
    return Math.round(s / total);
  }

  // -------------------------------------------------------------------------
  // 7. Filter engine — port of v1 fil() (line 1494–1520).
  // -------------------------------------------------------------------------

  // Region → state set (matches v1).
  var REGIONS = {
    southeast: new Set(['AL','AR','FL','GA','KY','LA','MS','NC','SC','TN','VA','WV']),
    northeast: new Set(['CT','DE','MA','MD','ME','NH','NJ','NY','PA','RI','VT']),
    midwest:   new Set(['IA','IL','IN','MI','MN','MO','OH','WI']),
    south_central: new Set(['KS','NE','ND','OK','SD','TX']),
    west:      new Set(['AK','AZ','CA','CO','HI','ID','MT','NM','NV','OR','UT','WA','WY']),
  };

  function applyFilters(companies, filters, q) {
    filters = filters || {};
    q = (q || '').trim().toLowerCase();
    var ownership = filters.ownership instanceof Set ? filters.ownership : null;
    var companyType = filters.companyType instanceof Set ? filters.companyType : null;
    var stateFilter = filters.states instanceof Set ? filters.states : null;
    var region = filters.region;
    var hideExcluded = filters.hideExcluded !== false; // default true
    var hideAnchor = !!filters.hideAnchor;
    var platformOnly = !!filters.platformOnly;
    var revRange = filters.revRange;     // [min, max] in $M
    var locRange = filters.locRange;     // [min, max]
    var fitRange = filters.fitRange;     // [min, max] 0-100

    var out = [];
    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      if (hideExcluded && c.excluded) continue;
      if (hideAnchor && c.id === 'll') continue;
      if (platformOnly && !c.isPlatform) continue;
      if (ownership && ownership.size && !ownership.has(c.ownership)) continue;
      if (companyType && companyType.size && !companyType.has(c.companyType)) continue;
      if (region && region !== 'all') {
        var rs = REGIONS[region];
        if (rs) {
          var hit = false;
          var sts = c.states || [];
          for (var j = 0; j < sts.length; j++) if (rs.has(sts[j])) { hit = true; break; }
          if (!hit) continue;
        }
      }
      if (stateFilter && stateFilter.size) {
        var sts2 = c.states || [];
        var hit2 = false;
        for (var k = 0; k < sts2.length; k++) if (stateFilter.has(sts2[k])) { hit2 = true; break; }
        if (!hit2) continue;
      }
      if (revRange) {
        var r = c.estRevenue || 0;
        if (r < revRange[0] || r > revRange[1]) continue;
      }
      if (locRange) {
        var l = (c.locations || []).length || c.totalLocs || 0;
        if (l < locRange[0] || l > locRange[1]) continue;
      }
      if (fitRange && c.fitScore != null) {
        if (c.fitScore < fitRange[0] || c.fitScore > fitRange[1]) continue;
      }
      if (q) {
        var hay = (
          (c.name || '') + ' ' +
          (c.hqCity || '') + ' ' +
          (c.hqState || '') + ' ' +
          (c.parentGroup || '') + ' ' +
          (c.ownerDetail || '') + ' ' +
          (c.description || '') + ' ' +
          (c.phone || '') + ' ' +
          (c.states || []).join(' ') + ' ' +
          ((c.keyPersonnel || []).map(function (p) { return p.name || ''; }).join(' ')) + ' ' +
          ((c.serviceTypes || []).join(' '))
        ).toLowerCase();
        if (hay.indexOf(q) === -1) continue;
      }
      out.push(c);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 8. Public attach: runs all the above once after data load and writes
  // results back onto each company.
  // -------------------------------------------------------------------------

  function attachScores(companies, counties, anchorId) {
    if (anchorId == null) anchorId = 'll';
    if (counties && counties.length) buildCountyIndex(counties);
    attachLocationCounties(companies);

    var prox = computeProxScores(companies, anchorId);
    var overlap = computeCountyOverlap(companies, anchorId);
    var share = computeMarketShare(companies);
    var anchor = companies.find(function (c) { return c.id === anchorId; }) || companies[0];

    for (var i = 0; i < companies.length; i++) {
      var c = companies[i];
      c.proxScore = prox[c.id] || null;
      c.countyShared = overlap[c.id] || null;
      c.marketShare = share[c.id] || null;
      var bd = computeFitBreakdown(c, anchor, prox, overlap);
      c.fitBreakdown = bd;
      c.fitScore = computeFitScore(bd, DEFAULT_WEIGHTS);
    }
    return companies;
  }

  // Re-rank fit scores when weights change without rerunning prox/overlap.
  function rescoreFit(companies, weights) {
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].fitBreakdown) {
        companies[i].fitScore = computeFitScore(companies[i].fitBreakdown, weights);
      }
    }
    return companies;
  }

  // -------------------------------------------------------------------------
  // Public surface
  // -------------------------------------------------------------------------
  window.PI = {
    haversine: haversine,
    buildCountyIndex: buildCountyIndex,
    attachLocationCounties: attachLocationCounties,
    nearestCountyFips: nearestCountyFips,
    computeProxScores: computeProxScores,
    computeCountyOverlap: computeCountyOverlap,
    computeMarketShare: computeMarketShare,
    computeFitBreakdown: computeFitBreakdown,
    computeFitScore: computeFitScore,
    applyFilters: applyFilters,
    attachScores: attachScores,
    rescoreFit: rescoreFit,
    DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    REGIONS: REGIONS,
    // Read-only views
    counties: function () { return _counties; },
    countyByFips: function (fips) { return _countyByFips ? _countyByFips[fips] : null; },
  };
})();
