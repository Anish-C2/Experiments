const CASPER_DATA = (() => {
  let cache = null;
  const SPORTS = ['football', 'futsal', 'cricsal'];
  const SPORT_DIR = { football: 'Football', futsal: 'Futsal', cricsal: 'Cricsal' };
  const files = {
    sectors: 'data/sectors.json',
    clubs: 'data/clubs.json',
    players: 'data/player-registry.json',
    competitions: 'data/competitions.json',
    dashboard: 'data/dashboard.json'
  };

  const arr = (o, k) => Array.isArray(o?.[k]) ? o[k] : [];
  const key = v => String(v || '').trim().toLowerCase();
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const nonNeg = v => isNum(v) && v >= 0;

  function emptySport() {
    return { goals: 0, runs: 0, wickets: 0, matches: 0, average: 0 };
  }

  function emptyPack() {
    return {
      form: '—',
      sports: Object.fromEntries(SPORTS.map(s => [s, emptySport()])),
      clubTable: [], playerStats: [], results: [], records: [],
      clubs: 0, players: 0, competitions: 0
    };
  }

  function indexBy(list) {
    const map = new Map();
    for (const item of list) if (item?.nickname) map.set(key(item.nickname), item);
    return map;
  }

  function unique(items, label, errors, pattern) {
    const seen = new Set();
    for (const x of items) {
      const id = x?.nickname;
      if (!id) errors.push(`${label}: missing General ID`);
      else if (pattern && !pattern.test(id)) errors.push(`${label}: invalid General ID ${id}`);
      else if (seen.has(key(id))) errors.push(`${label}: duplicate General ID ${id}`);
      else seen.add(key(id));
    }
  }

  function readSportBlock(raw, sport, path, errors) {
    const out = emptySport();
    if (!raw || typeof raw !== 'object') return out;
    const take = (field) => {
      if (raw[field] == null) return;
      if (!nonNeg(raw[field])) errors.push(`${path}.${field} must be a non-negative number`);
      else out[field] = raw[field];
    };
    take('matches'); take('average');
    if (sport === 'cricsal') {
      take('runs'); take('wickets');
      if (raw.goals != null) errors.push(`${path}: cricsal must not use a goals field`);
    } else {
      take('goals');
      if (raw.runs != null || raw.wickets != null) errors.push(`${path}: ${sport} must not use cricsal run/wicket fields`);
    }
    return out;
  }

  async function fetchJSON(path) {
    const r = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} returned HTTP ${r.status}`);
    try { return await r.json(); }
    catch { throw new Error(`${path} is not valid JSON`); }
  }

  function validateRegistries(d, errors, warnings) {
    for (const name of Object.keys(files)) {
      if (!d[name]) errors.push(`Missing dataset: ${name}`);
      else if (!d[name].schema) warnings.push(`${name}: missing schema`);
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
    sectors.forEach(x => { if (!x.name) errors.push(`sector ${x.nickname}: missing name`); });
    clubs.forEach(x => {
      if (!x.name) errors.push(`club ${x.nickname}: missing name`);
      (x.sectors || [x.sector]).filter(Boolean).forEach(s => { if (!sid.has(key(s))) errors.push(`club ${x.nickname}: unknown sector ${s}`); });
      if (!x.sector && !(x.sectors || []).length) errors.push(`club ${x.nickname}: missing sector`);
    });
    players.forEach(x => {
      if (!x.name) errors.push(`player ${x.nickname}: missing name`);
      (x.clubs || [x.club]).filter(Boolean).forEach(c => { if (!cid.has(key(c))) errors.push(`player ${x.nickname}: unknown club ${c}`); });
      (x.sectors || [x.sector]).filter(Boolean).forEach(s => { if (!sid.has(key(s))) errors.push(`player ${x.nickname}: unknown sector ${s}`); });
    });
    competitions.forEach(x => {
      if (!x.name) errors.push(`competition ${x.nickname}: missing name`);
      if (x.sector && !sid.has(key(x.sector))) errors.push(`competition ${x.nickname}: unknown sector ${x.sector}`);
      if (!x.sport || !SPORTS.includes(x.sport)) errors.push(`competition ${x.nickname}: invalid sport ${x.sport}`);
    });
    return { sectors, clubs, players, competitions };
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
    cache = {
      ...registries,
      dashboard: raw.dashboard || {},
      bySector: {},
      network: { sectors: registries.sectors.length, active: registries.sectors.filter(s => s.status === 'active').length, clubs: registries.clubs.length, players: registries.players.length, competitions: registries.competitions.length, sports: Object.fromEntries(SPORTS.map(s => [s, emptySport()])), clubTable: [], playerStats: [], results: [], records: [], form: [] },
      ledger: { files: [], matches: [] },
      indexes: { sector: indexBy(registries.sectors), club: indexBy(registries.clubs), player: indexBy(registries.players), competition: indexBy(registries.competitions) },
      mock: !!raw.dashboard?.mock,
      ok: !errors.length,
      errors,
      warnings,
      scope: () => ({ id: 'ALL', label: 'NETWORK', sectors: registries.sectors, clubs: registries.clubs, players: registries.players, competitions: registries.competitions, sports: Object.fromEntries(SPORTS.map(s => [s, emptySport()])), clubTable: [], playerStats: [], results: [], records: [], form: [], counts: { sectors: registries.sectors.length, active: registries.sectors.filter(s => s.status === 'active').length, clubs: registries.clubs.length, players: registries.players.length, competitions: registries.competitions.length } }),
      get: (kind, id) => cache.indexes[kind]?.get(key(id)) || null
    };
    for (const sector of registries.sectors) {
      cache.bySector[sector.nickname] = {
        form: '—',
        sports: Object.fromEntries(SPORTS.map(s => [s, emptySport()])),
        clubTable: [], playerStats: [], results: [], records: [],
        clubs: registries.clubs.filter(c => key(c.sector) === key(sector.nickname)).length,
        players: registries.players.filter(p => key(p.sector) === key(sector.nickname)).length,
        competitions: registries.competitions.filter(c => key(c.sector) === key(sector.nickname)).length
      };
    }
    if (warnings.length) console.warn('CASPER data warnings', warnings);
    if (errors.length) console.error('CASPER data validation errors', errors);
    return cache;
  }

  return { load, validate: raw => { const errors = []; const warnings = []; validateRegistries(raw, errors, warnings); return { ok: !errors.length, errors, warnings }; }, clear: () => { cache = null; }, sports: SPORTS };
})();
