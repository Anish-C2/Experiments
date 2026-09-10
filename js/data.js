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
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const nonNeg = v => isNum(v) && v >= 0;

  function emptySport(sport) {
    return { goals: 0, runs: 0, wickets: 0, matches: 0, average: 0 };
  }

  function emptyPack() {
    return {
      form: '—',
      sports: Object.fromEntries(SPORTS.map(s => [s, emptySport(s)])),
      clubTable: [],
      playerStats: [],
      results: [],
      records: [],
      clubs: 0,
      players: 0,
      competitions: 0
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
    const out = emptySport(sport);
    if (!raw || typeof raw !== 'object') return out;
    const take = (field) => {
      if (raw[field] == null) return;
      if (!nonNeg(raw[field])) errors.push(`${path}.${field} must be a non-negative number`);
      else out[field] = raw[field];
    };
    take('matches');
    take('average');
    if (sport === 'cricsal') {
      take('runs');
      take('wickets');
      if (raw.goals != null) errors.push(`${path}: cricsal must not use a goals field`);
    } else {
      take('goals');
      if (raw.runs != null || raw.wickets != null) errors.push(`${path}: ${sport} must not use cricsal run/wicket fields`);
    }
    return out;
  }

  function addSports(a, b) {
    const out = {};
    for (const sport of SPORTS) {
      const x = a[sport] || emptySport(sport);
      const y = b[sport] || emptySport(sport);
      const block = emptySport(sport);
      block.matches = x.matches + y.matches;
      if (sport === 'cricsal') {
        block.runs = x.runs + y.runs;
        block.wickets = x.wickets + y.wickets;
        block.average = block.matches ? +(block.runs / block.matches).toFixed(2) : 0;
      } else {
        block.goals = x.goals + y.goals;
        block.average = block.matches ? +(block.goals / block.matches).toFixed(2) : 0;
      }
      out[sport] = block;
    }
    return out;
  }

  async function fetchJSON(path) {
    const r = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} returned HTTP ${r.status}`);
    try {
      return await r.json();
    } catch {
      throw new Error(`${path} is not valid JSON`);
    }
  }

  function flattenLegacyDashboard(raw, errors) {
    if (raw?.sectors && typeof raw.sectors === 'object' && !Array.isArray(raw.sectors)) {
      return raw.sectors;
    }
    const out = {};
    const stats = raw?.sectorStats || {};
    const clubTable = Array.isArray(raw?.clubTable) ? raw.clubTable : [];
    const results = Array.isArray(raw?.results) ? raw.results : [];
    for (const [id, pack] of Object.entries(stats)) {
      out[id] = {
        form: pack.form || '—',
        sports: pack.sports || {},
        clubTable: [],
        playerStats: [],
        results: [],
        records: []
      };
    }
    if (!Object.keys(out).length && (clubTable.length || results.length)) {
      errors.push('dashboard: legacy snapshot has tables/results but no sectorStats');
    }
    return out;
  }

  function normalizeDashboard(raw, registries, errors, warnings) {
    if (!raw || typeof raw !== 'object') {
      errors.push('dashboard: missing object');
      raw = { mock: true, sectors: {} };
    }
    if (!raw.schema) warnings.push('dashboard: missing schema');
    if (raw.mock) warnings.push('Dashboard data is marked mock');

    const sectorMap = indexBy(registries.sectors);
    const clubMap = indexBy(registries.clubs);
    const playerMap = indexBy(registries.players);
    const competitionMap = indexBy(registries.competitions);
    const packs = flattenLegacyDashboard(raw, errors);
    const bySector = {};

    for (const sector of registries.sectors) {
      const id = sector.nickname;
      const pack = packs[id] || packs[Object.keys(packs).find(k => key(k) === key(id))] || {};
      const sports = {};
      for (const sport of SPORTS) {
        sports[sport] = readSportBlock(pack.sports?.[sport], sport, `dashboard.sectors.${id}.sports.${sport}`, errors);
      }
      const clubTable = (Array.isArray(pack.clubTable) ? pack.clubTable : []).map((row, i) => {
        if (!row?.club) errors.push(`dashboard.sectors.${id}.clubTable[${i}]: missing club`);
        else if (!clubMap.has(key(row.club))) errors.push(`dashboard.sectors.${id}.clubTable: unknown club ${row.club}`);
        else if (key(clubMap.get(key(row.club)).sector) !== key(id)) {
          warnings.push(`dashboard.sectors.${id}.clubTable: club ${row.club} belongs to ${clubMap.get(key(row.club)).sector}`);
        }
        ['p', 'w', 'd', 'l', 'gf', 'ga', 'elo'].forEach(field => {
          if (row[field] != null && !nonNeg(row[field])) {
            errors.push(`dashboard.sectors.${id}.clubTable.${row.club}.${field} invalid`);
          }
        });
        if (row.gd != null && !isNum(row.gd)) errors.push(`dashboard.sectors.${id}.clubTable.${row.club}.gd invalid`);
        return { ...row, sector: id };
      });
      const playerStats = (Array.isArray(pack.playerStats) ? pack.playerStats : []).map((row, i) => {
        if (!row?.player) errors.push(`dashboard.sectors.${id}.playerStats[${i}]: missing player`);
        else if (!playerMap.has(key(row.player))) errors.push(`dashboard.sectors.${id}.playerStats: unknown player ${row.player}`);
        if (row.sport && !SPORTS.includes(row.sport)) errors.push(`dashboard.sectors.${id}.playerStats.${row.player}: invalid sport ${row.sport}`);
        ['primary', 'secondary', 'apps', 'discipline'].forEach(field => {
          if (row[field] != null && !nonNeg(row[field])) errors.push(`dashboard.sectors.${id}.playerStats.${row.player}.${field} invalid`);
        });
        return { ...row, sector: id };
      });
      const results = (Array.isArray(pack.results) ? pack.results : []).map((row, i) => {
        const path = `dashboard.sectors.${id}.results[${i}]`;
        if (!SPORTS.includes(row?.sport)) errors.push(`${path}: invalid or missing sport`);
        if (row?.home && !clubMap.has(key(row.home))) errors.push(`${path}: unknown home club ${row.home}`);
        if (row?.away && !clubMap.has(key(row.away))) errors.push(`${path}: unknown away club ${row.away}`);
        if (row?.competition && !competitionMap.has(key(row.competition))) {
          errors.push(`${path}: unknown competition ${row.competition}`);
        } else if (row?.competition) {
          const competition = competitionMap.get(key(row.competition));
          if (row.sport && competition.sport && row.sport !== competition.sport) {
            errors.push(`${path}: sport ${row.sport} does not match competition sport ${competition.sport}`);
          }
        }
        if (row?.score && !/^\d+\s*[–-]\s*\d+$/.test(String(row.score))) {
          errors.push(`${path}: score must look like 3–1`);
        }
        return { ...row, sector: id };
      });
      const records = Array.isArray(pack.records) ? pack.records : [];
      bySector[id] = {
        form: pack.form || '—',
        sports,
        clubTable,
        playerStats,
        results,
        records,
        clubs: registries.clubs.filter(c => key(c.sector) === key(id)).length,
        players: registries.players.filter(p => key(p.sector) === key(id)).length,
        competitions: registries.competitions.filter(c => key(c.sector) === key(id)).length
      };
    }

    for (const id of Object.keys(packs)) {
      if (!sectorMap.has(key(id))) errors.push(`dashboard: unknown sector pack ${id}`);
    }

    const networkSports = Object.values(bySector).reduce((acc, pack) => addSports(acc, pack.sports), Object.fromEntries(SPORTS.map(s => [s, emptySport(s)])));
    const network = {
      sectors: registries.sectors.length,
      active: registries.sectors.filter(s => s.status === 'active').length,
      clubs: registries.clubs.length,
      players: registries.players.length,
      competitions: registries.competitions.length,
      sports: networkSports,
      clubTable: registries.sectors.flatMap(s => bySector[s.nickname].clubTable),
      playerStats: registries.sectors.flatMap(s => bySector[s.nickname].playerStats),
      results: registries.sectors.flatMap(s => bySector[s.nickname].results),
      records: registries.sectors.flatMap(s => bySector[s.nickname].records),
      form: registries.sectors.map(s => ({ sector: s.nickname, form: bySector[s.nickname].form, average: bySector[s.nickname].sports.football.average }))
    };

    return { raw, bySector, network, mock: !!raw.mock };
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
    unique(players, 'player', errors, /^[A-Za-z]{3}$/);
    unique(competitions, 'competition', errors, /^[A-Za-z0-9]{3,8}$/);
    const sid = new Set(sectors.map(x => key(x.nickname)));
    const cid = new Set(clubs.map(x => key(x.nickname)));
    sectors.forEach(x => { if (!x.name) errors.push(`sector ${x.nickname}: missing name`); });
    clubs.forEach(x => {
      if (!x.name) errors.push(`club ${x.nickname}: missing name`);
      const refs = x.sectors || [x.sector];
      refs.filter(Boolean).forEach(s => { if (!sid.has(key(s))) errors.push(`club ${x.nickname}: unknown sector ${s}`); });
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

  function scope(model, sectorId) {
    if (!sectorId || key(sectorId) === 'all') {
      return {
        id: 'ALL',
        label: 'NETWORK',
        sectors: model.sectors,
        clubs: model.clubs,
        players: model.players,
        competitions: model.competitions,
        sports: model.network.sports,
        clubTable: model.network.clubTable,
        playerStats: model.network.playerStats,
        results: model.network.results,
        records: model.network.records,
        form: model.network.form,
        counts: {
          sectors: model.network.sectors,
          active: model.network.active,
          clubs: model.network.clubs,
          players: model.network.players,
          competitions: model.network.competitions
        }
      };
    }
    const sector = model.indexes.sector.get(key(sectorId));
    if (!sector) return null;
    const pack = model.bySector[sector.nickname] || emptyPack();
    return {
      id: sector.nickname,
      label: sector.name,
      sector,
      sectors: [sector],
      clubs: model.clubs.filter(c => key(c.sector) === key(sector.nickname)),
      players: model.players.filter(p => key(p.sector) === key(sector.nickname)),
      competitions: model.competitions.filter(c => key(c.sector) === key(sector.nickname)),
      sports: pack.sports,
      clubTable: pack.clubTable,
      playerStats: pack.playerStats,
      results: pack.results,
      records: pack.records,
      form: [{ sector: sector.nickname, form: pack.form, average: pack.sports.football.average }],
      counts: {
        sectors: 1,
        active: sector.status === 'active' ? 1 : 0,
        clubs: pack.clubs,
        players: pack.players,
        competitions: pack.competitions
      }
    };
  }

  async function load() {
    if (cache) return cache;
    const errors = [];
    const warnings = [];
    const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => {
      try {
        return [name, await fetchJSON(path)];
      } catch (err) {
        errors.push(err.message);
        return [name, null];
      }
    }));
    const raw = Object.fromEntries(entries);
    const registries = validateRegistries(raw, errors, warnings);
    const dash = normalizeDashboard(raw.dashboard, registries, errors, warnings);
    cache = {
      ...registries,
      dashboard: dash.raw,
      bySector: dash.bySector,
      network: dash.network,
      indexes: {
        sector: indexBy(registries.sectors),
        club: indexBy(registries.clubs),
        player: indexBy(registries.players),
        competition: indexBy(registries.competitions)
      },
      mock: dash.mock,
      ok: !errors.length,
      errors,
      warnings,
      scope: sectorId => scope(cache, sectorId),
      get: (kind, id) => cache.indexes[kind]?.get(key(id)) || null
    };
    if (warnings.length) console.warn('CASPER data warnings', warnings);
    if (errors.length) console.error('CASPER data validation errors', errors);
    return cache;
  }

  return { load, validate: raw => {
    const errors = [];
    const warnings = [];
    validateRegistries(raw, errors, warnings);
    return { ok: !errors.length, errors, warnings };
  }, clear: () => { cache = null; }, sports: SPORTS };
})();
