(function () {
  'use strict';
  var WORLD = null;
  var FILTERS = { sport: '', sector: '', season: '' };
  function $(id) { return document.getElementById(id); }
  function parseHash() {
    var raw = (location.hash || '#/dashboard').replace(/^#/, '');
    if (raw.charAt(0) !== '/') raw = '/' + raw;
    var parts = raw.split('/').filter(Boolean);
    return { view: parts[0] || 'dashboard', arg: parts.slice(1).join('/') };
  }
  function setNav(view) {
    document.querySelectorAll('.nav a').forEach(function (a) {
      var v = a.getAttribute('data-view');
      a.classList.toggle('on', v === view || (view === 'player' && v === 'players') || (view === 'team' && v === 'teams') || (view === 'competition' && v === 'competitions') || (view === 'match' && v === 'matches'));
    });
    document.querySelectorAll('.sportchips .chip[data-sport]').forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-sport') === FILTERS.sport);
    });
  }
  function fillFilterSelects() {
    if (!WORLD) return;
    var sectors = Object.keys(WORLD.sectors).sort();
    var seasons = {};
    Object.keys(WORLD.seasons).forEach(function (k) { seasons[WORLD.seasons[k].season] = true; });
    function fill(id, values, allLabel) {
      var el = $(id); if (!el) return;
      el.innerHTML = '<option value="">' + allLabel + '</option>' + values.map(function (v) { return '<option value="' + SPAUI.esc(v) + '">' + SPAUI.esc(v) + '</option>'; }).join('');
    }
    fill('f-sector', sectors, 'All sectors');
    fill('f-season', Object.keys(seasons).sort(), 'All seasons');
    $('f-sector').value = FILTERS.sector;
    $('f-season').value = FILTERS.season;
  }
  function render() {
    if (!WORLD) return;
    var r = parseHash();
    setNav(r.view);
    var html = '';
    try {
      var map = {
        dashboard: function () { return SPAUI.dash(WORLD, FILTERS); },
        home: function () { return SPAUI.dash(WORLD, FILTERS); },
        rankings: function () { return SPAUI.rankingsPage(WORLD, FILTERS); },
        players: function () { return SPAUI.playersPage(WORLD, FILTERS); },
        player: function () { return SPAUI.playerPage(WORLD, r.arg); },
        teams: function () { return SPAUI.teamsPage(WORLD, FILTERS); },
        team: function () { return SPAUI.teamPage(WORLD, r.arg); },
        competitions: function () { return SPAUI.competitionsPage(WORLD, FILTERS); },
        competition: function () { return SPAUI.competitionPage(WORLD, r.arg); },
        matches: function () { return SPAUI.matchesPage(WORLD, FILTERS); },
        match: function () { return SPAUI.matchPage(WORLD, r.arg); },
        seasons: function () { return SPAUI.seasonsPage(WORLD); },
        sectors: function () { return SPAUI.seasonsPage(WORLD); },
        records: function () { return SPAUI.recordsPage(WORLD); },
        debug: function () { return SPAUI.debugPage(WORLD); }
      };
      html = (map[r.view] || map.dashboard)();
    } catch (err) {
      html = '<div class="alert">Render error: ' + SPAUI.esc(err && err.message) + '</div>';
    }
    $('view').innerHTML = html;
    var nIss = (WORLD.issues || []).length;
    $('issue-count').textContent = nIss + ' validator flag' + (nIss === 1 ? '' : 's');
  }
  async function loadJson(path, fallback) {
    try { var r = await fetch(path); if (!r.ok) return fallback; return await r.json(); }
    catch (e) { return fallback; }
  }
  async function boot() {
    $('view').innerHTML = '<div class="card">Loading CSN archives…</div>';
    var config = await loadJson('config.json', {});
    var sportsCfg = await loadJson('sports.json', { sports: [] });
    var registry = await loadJson('player-registry.json', {});
    var misc = await loadJson('misc.json', {});
    delete registry._comment;
    var raw = {};
    for (var i = 0; i < sportsCfg.sports.length; i++) {
      var cfg = sportsCfg.sports[i], files = [];
      try { var man = await fetch(cfg.manifest); if (man.ok) files = await man.json(); } catch (e) {}
      raw[cfg.id] = [];
      for (var j = 0; j < files.length; j++) {
        try {
          var txt = await fetch(cfg.dataDir + '/' + files[j]).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
          raw[cfg.id] = raw[cfg.id].concat(CSN.parse(txt));
        } catch (e) { console.warn('Failed', cfg.id, files[j], e); }
      }
    }
    WORLD = SPAEngine.build({ sportsCfg: sportsCfg, registry: registry, config: config, misc: misc, raw: raw });
    window.SPA_WORLD = WORLD;
    fillFilterSelects();
    render();
  }
  document.addEventListener('DOMContentLoaded', function () {
    $('f-sector').addEventListener('change', function () { FILTERS.sector = this.value; render(); });
    $('f-season').addEventListener('change', function () { FILTERS.season = this.value; render(); });
    document.querySelectorAll('.chip[data-sport]').forEach(function (c) {
      c.addEventListener('click', function () {
        var s = c.getAttribute('data-sport');
        FILTERS.sport = FILTERS.sport === s ? '' : s;
        render();
      });
    });
    $('q').addEventListener('input', function () {
      var box = $('hits');
      var hits = SPAUI.search(WORLD || { players: {}, teams: {}, competitions: [] }, this.value);
      if (!hits.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
      box.style.display = 'block';
      box.innerHTML = hits.map(function (h) { return '<div data-href="' + SPAUI.esc(h.href) + '"><span class="badge">' + SPAUI.esc(h.type) + '</span> ' + SPAUI.esc(h.label) + '</div>'; }).join('');
    });
    $('hits').addEventListener('click', function (e) {
      var row = e.target.closest('div[data-href]'); if (!row) return;
      location.hash = row.getAttribute('data-href');
      $('hits').style.display = 'none'; $('q').value = '';
    });
    $('menu-btn').addEventListener('click', function () { document.querySelector('.nav').classList.toggle('open'); });
    window.addEventListener('hashchange', render);
    boot();
  });
})();
