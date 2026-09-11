const CASPER_DATA = (() => {
  let cache = null;
  const SPORTS = ['football', 'futsal', 'cricsal'];
  const files = {
    sectors: 'data/sectors.json',
    clubs: 'data/clubs.json',
    players: 'data/player-registry.json',
    competitions: 'data/competitions.json',
    dashboard: 'data/dashboard.json'
  };
  const arr = (o, k) => Array.isArray(o?.[k]) ? o[k] : [];
  const key = v => String(v || '').trim().toLowerCase();
  function emptySport() { return { goals: 0, runs: 0, wickets: 0, matches: 0, average: 0 }; }
  function indexBy(list) {
    const map = new Map();
    for (const item of list) if (item?.nickname) map.set(key(item.nickname), item);
    return map;
  }
  function unique(items, label, errors, pattern) {
    const seen = new Set();
    for (const x of items) {
      const id = x?.nickname;
      if (!id) errors.push(label + ': missing General ID');
      else if (pattern && !pattern.test(id)) errors.push(label + ': invalid General ID ' + id);
      else if (seen.has(key(id))) errors.push(label + ': duplicate General ID ' + id);
      else seen.add(key(id));
    }
  }
  async function fetchJSON(path) {
    const r = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(path + ' returned HTTP ' + r.status);
    return r.json();
  }
  function validateRegistries(d, errors, warnings) {
    for (const name of Object.keys(files)) {
      if (!d[name]) errors.push('Missing dataset: ' + name);
      else if (!d[name].schema) warnings.push(name + ': missing schema');
    }
    const sectors = arr(d.sectors, 'sectors');
    const clubs = arr(d.clubs, 'clubs');
    const players = arr(d.players, 'players');
    const competitions = arr(d.competitions, 'competitions');
    unique(sectors, 'sector', errors, /^[A-Za-z0-9]{2,6}$/);
    unique(clubs, 'club', errors, /^[A-Za-z0-9]{2,6}$/);
    unique(players, 'player', errors, /^[A-Za-z][A-Za-z0-9'-]{1,19}$/);
    unique(competitions, 'competition', errors, /^[A-Za-z0-9]{3,8}$/);
    const sid = new Set(sectors.map(x => key(x.nickname)));
    const cid = new Set(clubs.map(x => key(x.nickname)));
    sectors.forEach(x => { if (!x.name) errors.push('sector ' + x.nickname + ': missing name'); });
    clubs.forEach(x => {
      if (!x.name) errors.push('club ' + x.nickname + ': missing name');
      (x.sectors || [x.sector]).filter(Boolean).forEach(s => { if (!sid.has(key(s))) errors.push('club ' + x.nickname + ': unknown sector ' + s); });
      if (!x.sector && !(x.sectors || []).length) errors.push('club ' + x.nickname + ': missing sector');
    });
    players.forEach(x => {
      if (!x.name) errors.push('player ' + x.nickname + ': missing name');
      (x.clubs || [x.club]).filter(Boolean).forEach(c => { if (!cid.has(key(c))) errors.push('player ' + x.nickname + ': unknown club ' + c); });
      (x.sectors || [x.sector]).filter(Boolean).forEach(s => { if (!sid.has(key(s))) errors.push('player ' + x.nickname + ': unknown sector ' + s); });
    });
    competitions.forEach(x => {
      if (!x.name) errors.push('competition ' + x.nickname + ': missing name');
      if (x.sector && !sid.has(key(x.sector))) errors.push('competition ' + x.nickname + ': unknown sector ' + x.sector);
      if (!x.sport || !SPORTS.includes(x.sport)) errors.push('competition ' + x.nickname + ': invalid sport ' + x.sport);
    });
    return { sectors, clubs, players, competitions };
  }
  function scopeAll(model) {
    return {
      id: 'ALL', label: 'NETWORK', sectors: model.sectors, clubs: model.clubs, players: model.players, competitions: model.competitions,
      sports: model.network.sports, clubTable: model.network.clubTable, playerStats: model.network.playerStats, results: model.network.results, records: model.network.records, form: model.network.form,
      counts: { sectors: model.network.sectors, active: model.network.active, clubs: model.network.clubs, players: model.network.players, competitions: model.network.competitions }
    };
  }
  async function load() {
    if (cache) return cache;
    const errors = []; const warnings = [];
    const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => {
      try { return [name, await fetchJSON(path)]; }
      catch (err) { errors.push(err.message); return [name, null]; }
    }));
    const raw = Object.fromEntries(entries);
    const registries = validateRegistries(raw, errors, warnings);
    const sports = Object.fromEntries(SPORTS.map(s => [s, emptySport()]));
    const bySector = {};
    for (const sector of registries.sectors) {
      bySector[sector.nickname] = {
        form: '—', sports: Object.fromEntries(SPORTS.map(s => [s, emptySport()])),
        clubTable: [], playerStats: [], results: [], records: [],
        clubs: registries.clubs.filter(c => key(c.sector) === key(sector.nickname)).length,
        players: registries.players.filter(p => key(p.sector) === key(sector.nickname)).length,
        competitions: registries.competitions.filter(c => key(c.sector) === key(sector.nickname)).length
      };
    }
    cache = {
      ...registries,
      dashboard: raw.dashboard || {},
      bySector,
      network: {
        sectors: registries.sectors.length,
        active: registries.sectors.filter(s => s.status === 'active').length,
        clubs: registries.clubs.length,
        players: registries.players.length,
        competitions: registries.competitions.length,
        sports, clubTable: [], playerStats: [], results: [], records: [],
        form: registries.sectors.map(s => ({ sector: s.nickname, form: '—', average: 0 }))
      },
      ledger: { files: [], matches: [] },
      indexes: { sector: indexBy(registries.sectors), club: indexBy(registries.clubs), player: indexBy(registries.players), competition: indexBy(registries.competitions) },
      mock: !!raw.dashboard && !!raw.dashboard.mock,
      ok: !errors.length,
      errors,
      warnings,
      scope: function(sectorId) {
        if (!sectorId || key(sectorId) === 'all') return scopeAll(cache);
        const sector = cache.indexes.sector.get(key(sectorId));
        if (!sector) return scopeAll(cache);
        const pack = cache.bySector[sector.nickname];
        return { id: sector.nickname, label: sector.name, sector, sectors: [sector], clubs: cache.clubs.filter(c => key(c.sector) === key(sector.nickname)), players: cache.players.filter(p => key(p.sector) === key(sector.nickname)), competitions: cache.competitions.filter(c => key(c.sector) === key(sector.nickname)), sports: pack.sports, clubTable: pack.clubTable, playerStats: pack.playerStats, results: pack.results, records: pack.records, form: [{ sector: sector.nickname, form: pack.form, average: 0 }], counts: { sectors: 1, active: sector.status === 'active' ? 1 : 0, clubs: pack.clubs, players: pack.players, competitions: pack.competitions } };
      },
      get: function(kind, id) { return cache.indexes[kind] ? cache.indexes[kind].get(key(id)) || null : null; }
    };
    if (warnings.length) console.warn('CASPER data warnings', warnings);
    if (errors.length) console.error('CASPER data validation errors', errors);
    return cache;
  }
  return { load, validate: function(raw) { const errors = []; const warnings = []; validateRegistries(raw, errors, warnings); return { ok: !errors.length, errors, warnings }; }, clear: function() { cache = null; }, sports: SPORTS };
})();
