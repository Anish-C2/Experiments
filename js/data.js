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

  function addSports(a, b) {
    const out = {};
    for (const sport of SPORTS) {
      const x = a[sport] || emptySport();
      const y = b[sport] || emptySport();
      const block = emptySport();
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
    try { return await r.json(); }
    catch { throw new Error(`${path} is not valid JSON`); }
  }

  async function fetchText(path) {
    const r = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} returned HTTP ${r.status}`);
    return r.text();
  }

  function flattenLegacyDashboard(raw, errors) {
    if (raw?.sectors && typeof raw.sectors === 'object' && !Array.isArray(raw.sectors)) return raw.sectors;
    const out = {};
    const stats = raw?.sectorStats || {};
    const clubTable = Array.isArray(raw?.clubTable) ? raw.clubTable : [];
    const results = Array.isArray(raw?.results) ? raw.results : [];
    for (const [id, pack] of Object.entries(stats)) {
      out[id] = { form: pack.form || '—', sports: pack.sports || {}, clubTable: [], playerStats: [], results: [], records: [] };
    }
    if (!Object.keys(out).length && (clubTable.length || results.length)) {
      errors.push('dashboard: legacy snapshot has tables/results but no sectorStats');
    }
    return out;
  }

  function headerMeta(text) {
    const meta = {};
    for (const line of String(text || '').split(/\r?\n/)) {
      const m = line.match(/^#\s*([a-zA-Z]+)\s*=\s*(.+?)\s*$/);
      if (m) meta[key(m[1])] = m[2].trim();
    }
    return meta;
  }

  function parseInnings(raw) {
    const tokens = String(raw || '').split(',').map(t => t.trim()).filter(Boolean);
    let runs = 0, wickets = 0;
    for (const token of tokens) {
      if (/^w$/i.test(token)) { wickets += 1; continue; }
      const extra = token.match(/^(\d+)?(wd|nb)$/i);
      if (extra) { runs += Number(extra[1] || 1); continue; }
      const n = Number(token);
      if (Number.isFinite(n)) runs += n;
    }
    return { tokens, runs, wickets };
  }

  function parseCSN(text, fileMeta, errors) {
    const meta = { ...fileMeta, ...headerMeta(text) };
    const sport = key(meta.sport);
    const sector = meta.sector || fileMeta.sector;
    const season = meta.season || fileMeta.season;
    const competition = meta.competition || fileMeta.competition || '';
    const matches = [];
    const body = String(text || '').replace(/\r/g, '');
    const blocks = body.split(/\nid\s*=\s*"/i).slice(1);
    for (const block of blocks) {
      const id = (block.match(/^([^"]+)"/) || [])[1];
      const slice = block.slice(String(id || '').length + 1);
      const line = slice.split('\n').map(x => x.trim()).find(x => x && !x.startsWith('#')) || '';
      if (!id) { errors.push(`${fileMeta.path}: CSN match is missing id`); continue; }
      if (!line) { errors.push(`${fileMeta.path}: CSN match ${id} has no body`); continue; }
      const cricket = line.match(/^([A-Za-z0-9]{2,6})-([A-Za-z0-9]{2,6}):\[([^\]]*)\]-\[([^\]]*)\](?:\{([^}]*)\})?(?:#([A-Za-z0-9]+))?;?$/);
      const goals = line.match(/^([A-Za-z0-9]{2,6})-([A-Za-z0-9]{2,6}):(\d+)\s*[-\u2013]\s*(\d+)(?:\(([^)]*)\))?(?:#([A-Za-z0-9]+))?(?:\{([^}]*)\})?(?:\(([^)]*)\))?;?$/);
      if (cricket) {
        if (sport && sport !== 'cricsal') errors.push(`${fileMeta.path}: ${id} uses Cricsal notation in a ${sport} file`);
        const homeIn = parseInnings(cricket[3]);
        const awayIn = parseInnings(cricket[4]);
        matches.push({
          id, source: fileMeta.path, sector, season, competition,
          sport: 'cricsal', home: cricket[1], away: cricket[2],
          score: `${homeIn.runs}\u2013${awayIn.runs}`,
          round: cricket[6] || 'MD',
          duration: '12b',
          status: 'FT',
          runs: homeIn.runs + awayIn.runs,
          wickets: homeIn.wickets + awayIn.wickets,
          events: cricket[5] || ''
        });
        continue;
      }
      if (goals) {
        if (sport === 'cricsal') errors.push(`${fileMeta.path}: ${id} uses goal notation in a cricsal file`);
        const extra = goals[8] || '';
        const dur = (extra.match(/dur=(\d+)/) || [])[1];
        matches.push({
          id, source: fileMeta.path, sector, season, competition,
          sport: sport === 'futsal' ? 'futsal' : 'football',
          home: goals[1], away: goals[2],
          score: `${goals[3]}\u2013${goals[4]}`,
          round: goals[6] || 'MD',
          duration: dur ? `${dur}\u2032` : (sport === 'futsal' ? '40\u2032' : '90\u2032'),
          status: 'FT',
          events: goals[7] || '',
          note: goals[5] || ''
        });
        continue;
      }
      errors.push(`${fileMeta.path}: could not parse CSN match ${id}`);
    }
    return { meta, matches };
  }

  function resultKey(row) {
    return [key(row.sport), key(row.home), key(row.away), String(row.score || '').replace(/\s/g, ''), key(row.competition || '')].join('|');
  }

  function expectedLedgerFiles(registries, manifest) {
    const seasons = arr(manifest, 'seasons').length ? arr(manifest, 'seasons') : ['2026A'];
    const listed = arr(manifest, 'files');
    if (listed.length) {
      return listed.map(f => ({
        sector: f.sector,
        sport: key(f.sport),
        season: f.season || seasons[0],
        competition: f.competition || '',
        path: f.path
      }));
    }
    const out = [];
    for (const sector of registries.sectors || []) {
      for (const sport of SPORTS) {
        for (const season of seasons) {
          out.push({
            sector: sector.nickname,
            sport,
            season,
            competition: '',
            path: `data/${sector.nickname}/${SPORT_DIR[sport]}/Season_${season}.csn`
          });
        }
      }
    }
    return out;
  }

  async function loadLedger(registries, errors, warnings) {
    let manifest = null;
    try { manifest = await fetchJSON('data/manifest.json'); }
    catch (err) { warnings.push(`data/manifest.json missing (${err.message}); reconstructing sector/sport/season paths`); }
    if (manifest && manifest.schema && manifest.schema !== 'casper.manifest') {
      warnings.push(`data/manifest.json unexpected schema ${manifest.schema}`);
    }
    const wanted = expectedLedgerFiles(registries, manifest || {});
    const sectorMap = indexBy(registries.sectors);
    const clubMap = indexBy(registries.clubs);
    const competitionMap = indexBy(registries.competitions);
    const matches = [];
    const filesOut = [];
    for (const file of wanted) {
      if (file.sector && !sectorMap.has(key(file.sector))) {
        errors.push(`ledger: unknown sector folder ${file.sector}`);
        continue;
      }
      if (file.sport && !SPORTS.includes(file.sport)) {
        errors.push(`ledger: unsupported sport ${file.sport} in ${file.path}`);
        continue;
      }
      try {
        const text = await fetchText(file.path);
        const parsed = parseCSN(text, file, errors);
        filesOut.push({ ...file, ok: true, matches: parsed.matches.length, empty: !parsed.matches.length });
        for (const row of parsed.matches) {
          if (row.home && !clubMap.has(key(row.home))) errors.push(`${file.path}: unknown home club ${row.home}`);
          if (row.away && !clubMap.has(key(row.away))) errors.push(`${file.path}: unknown away club ${row.away}`);
          if (row.competition && !competitionMap.has(key(row.competition))) {
            errors.push(`${file.path}: unknown competition ${row.competition}`);
          } else if (row.competition) {
            const competition = competitionMap.get(key(row.competition));
            if (competition.sport && row.sport !== competition.sport) {
              errors.push(`${file.path}: ${row.id} sport ${row.sport} does not match ${competition.nickname} sport ${competition.sport}`);
            }
            if (competition.sector && key(competition.sector) !== key(row.sector)) {
              warnings.push(`${file.path}: ${row.id} lives in ${row.sector} but competition ${competition.nickname} is registered to ${competition.sector}`);
            }
          }
          matches.push(row);
        }
      } catch (err) {
        warnings.push(`${file.path} not loaded (${err.message})`);
        filesOut.push({ ...file, ok: false, matches: 0, empty: true });
      }
    }
    const seen = new Set();
    for (const row of matches) {
      const idk = key(row.id);
      if (seen.has(idk)) errors.push(`ledger: duplicate CSN id ${row.id}`);
      else seen.add(idk);
    }
    return { manifest, files: filesOut, matches };
  }

  function mergeLedger(dash, ledger, errors) {
    const byKey = new Map();
    for (const sector of Object.keys(dash.bySector)) {
      for (const row of dash.bySector[sector].results || []) byKey.set(resultKey(row), row);
    }
    for (const row of ledger.matches) {
      const pack = dash.bySector[row.sector];
      if (!pack) { errors.push(`ledger: result ${row.id} points at unknown sector ${row.sector}`); continue; }
      const k = resultKey(row);
      const existing = byKey.get(k);
      if (existing) {
        existing.id = existing.id || row.id;
        existing.source = row.source;
        continue;
      }
      pack.results.push({
        id: row.id,
        status: row.status,
        home: row.home,
        away: row.away,
        score: row.score,
        competition: row.competition,
        round: row.round,
        duration: row.duration,
        sport: row.sport,
        sector: row.sector,
        source: row.source
      });
      byKey.set(k, pack.results[pack.results.length - 1]);
    }
    dash.network.results = Object.keys(dash.bySector).flatMap(id => dash.bySector[id].results);
    return dash;
  }

  function normalizeDashboard(raw, registries, errors, warnings) {
    if (!raw || typeof raw !== 'object') { errors.push('dashboard: missing object'); raw = { mock: true, sectors: {} }; }
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
      for (const sport of SPORTS) sports[sport] = readSportBlock(pack.sports?.[sport], sport, `dashboard.sectors.${id}.sports.${sport}`, errors);
      const clubTable = (Array.isArray(pack.clubTable) ? pack.clubTable : []).map((row, i) => {
        if (!row?.club) errors.push(`dashboard.sectors.${id}.clubTable[${i}]: missing club`);
        else if (!clubMap.has(key(row.club))) errors.push(`dashboard.sectors.${id}.clubTable: unknown club ${row.club}`);
        ['p','w','d','l','gf','ga','elo'].forEach(field => {
          if (row[field] != null && !nonNeg(row[field])) errors.push(`dashboard.sectors.${id}.clubTable.${row.club}.${field} invalid`);
        });
        if (row.gd != null && !isNum(row.gd)) errors.push(`dashboard.sectors.${id}.clubTable.${row.club}.gd invalid`);
        return { ...row, sector: id };
      });
      const playerStats = (Array.isArray(pack.playerStats) ? pack.playerStats : []).map((row, i) => {
        if (!row?.player) errors.push(`dashboard.sectors.${id}.playerStats[${i}]: missing player`);
        else if (!playerMap.has(key(row.player))) errors.push(`dashboard.sectors.${id}.playerStats: unknown player ${row.player}`);
        if (row.sport && !SPORTS.includes(row.sport)) errors.push(`dashboard.sectors.${id}.playerStats.${row.player}: invalid sport ${row.sport}`);
        ['primary','secondary','apps','discipline'].forEach(field => {
          if (row[field] != null && !nonNeg(row[field])) errors.push(`dashboard.sectors.${id}.playerStats.${row.player}.${field} invalid`);
        });
        return { ...row, sector: id };
      });
      const results = (Array.isArray(pack.results) ? pack.results : []).map((row, i) => {
        const path = `dashboard.sectors.${id}.results[${i}]`;
        if (!SPORTS.includes(row?.sport)) errors.push(`${path}: invalid or missing sport`);
        if (row?.home && !clubMap.has(key(row.home))) errors.push(`${path}: unknown home club ${row.home}`);
        if (row?.away && !clubMap.has(key(row.away))) errors.push(`${path}: unknown away club ${row.away}`);
        if (row?.competition && !competitionMap.has(key(row.competition))) errors.push(`${path}: unknown competition ${row.competition}`);
        else if (row?.competition) {
          const competition = competitionMap.get(key(row.competition));
          if (row.sport && competition.sport && row.sport !== competition.sport) errors.push(`${path}: sport ${row.sport} does not match competition sport ${competition.sport}`);
        }
        if (row?.score && !/^\d+\s*[\u2013-]\s*\d+$/.test(String(row.score))) errors.push(`${path}: score must look like 3\u20131`);
        return { ...row, sector: id };
      });
      bySector[id] = {
        form: pack.form || '—', sports, clubTable, playerStats, results,
        records: Array.isArray(pack.records) ? pack.records : [],
        clubs: registries.clubs.filter(c => key(c.sector) === key(id)).length,
        players: registries.players.filter(p => key(p.sector) === key(id)).length,
        competitions: registries.competitions.filter(c => key(c.sector) === key(id)).length
      };
    }
    for (const id of Object.keys(packs)) if (!sectorMap.has(key(id))) errors.push(`dashboard: unknown sector pack ${id}`);
    const networkSports = Object.values(bySector).reduce((acc, pack) => addSports(acc, pack.sports), Object.fromEntries(SPORTS.map(s => [s, emptySport()])));
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

  function scope(model, sectorId) {
    if (!sectorId || key(sectorId) === 'all') {
      return { id: 'ALL', label: 'NETWORK', sectors: model.sectors, clubs: model.clubs, players: model.players, competitions: model.competitions, sports: model.network.sports, clubTable: model.network.clubTable, playerStats: model.network.playerStats, results: model.network.results, records: model.network.records, form: model.network.form, counts: { sectors: model.network.sectors, active: model.network.active, clubs: model.network.clubs, players: model.network.players, competitions: model.network.competitions } };
    }
    const sector = model.indexes.sector.get(key(sectorId));
    if (!sector) return null;
    const pack = model.bySector[sector.nickname] || emptyPack();
    return { id: sector.nickname, label: sector.name, sector, sectors: [sector], clubs: model.clubs.filter(c => key(c.sector) === key(sector.nickname)), players: model.players.filter(p => key(p.sector) === key(sector.nickname)), competitions: model.competitions.filter(c => key(c.sector) === key(sector.nickname)), sports: pack.sports, clubTable: pack.clubTable, playerStats: pack.playerStats, results: pack.results, records: pack.records, form: [{ sector: sector.nickname, form: pack.form, average: pack.sports.football.average }], counts: { sectors: 1, active: sector.status === 'active' ? 1 : 0, clubs: pack.clubs, players: pack.players, competitions: pack.competitions } };
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
    const dash = normalizeDashboard(raw.dashboard, registries, errors, warnings);
    const ledger = await loadLedger(registries, errors, warnings);
    mergeLedger(dash, ledger, errors);
    cache = {
      ...registries,
      dashboard: {
        ...dash.raw,
        mock: dash.mock,
        network: dash.network,
        sports: dash.network.sports,
        sectorStats: dash.bySector,
        clubTable: dash.network.clubTable,
        playerStats: dash.network.playerStats,
        results: dash.network.results,
        records: dash.network.records
      },
      bySector: dash.bySector,
      network: dash.network,
      ledger,
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

  return { load, validate: raw => { const errors = []; const warnings = []; validateRegistries(raw, errors, warnings); return { ok: !errors.length, errors, warnings }; }, clear: () => { cache = null; }, sports: SPORTS };
})();
