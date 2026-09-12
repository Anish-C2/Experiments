const CASPER_DATA = (() => {
  let cache = null;
  const SPORTS = ['football', 'futsal', 'cricsal'];
  const SPORT_DIR = { football: 'Football', futsal: 'Futsal', cricsal: 'Cricsal' };
  const files = {
    sectors: 'data/sectors.json',
    clubs: 'data/clubs.json',
    players: 'data/player-registry.json',
    competitions: 'data/competitions.json',
    dashboard: 'data/dashboard.json',
    awards: 'data/awards.json'
  };
  const arr = (o, k) => Array.isArray(o && o[k]) ? o[k] : [];
  const key = v => String(v || '').trim().toLowerCase();
  const PLAYER_ID = /^[A-Za-z][A-Za-z0-9'-]{1,19}$/;
  function listOf(entity, singular, plural) {
    const out = [];
    if (entity && Array.isArray(entity[plural])) out.push(...entity[plural]);
    if (entity && entity[singular]) out.push(entity[singular]);
    return [...new Set(out.filter(Boolean).map(String))];
  }
  function belongsToSector(entity, sectorId) {
    return listOf(entity, 'sector', 'sectors').some(s => key(s) === key(sectorId));
  }
  function belongsToClub(entity, clubId) {
    return listOf(entity, 'club', 'clubs').some(c => key(c) === key(clubId));
  }
  function emptySport() { return { goals: 0, runs: 0, wickets: 0, matches: 0, average: 0 }; }
  function indexBy(list) {
    const map = new Map();
    for (const item of list) if (item && item.nickname) map.set(key(item.nickname), item);
    return map;
  }
  function unique(items, label, errors, pattern) {
    const seen = new Set();
    for (const x of items) {
      const id = x && x.nickname;
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
  async function fetchText(path) {
    const r = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(path + ' returned HTTP ' + r.status);
    return r.text();
  }
  function validateRegistries(d, errors, warnings) {
    const required = ['sectors', 'clubs', 'players', 'competitions', 'dashboard'];
    for (const name of required) {
      if (!d[name]) errors.push('Missing dataset: ' + name);
      else if (!d[name].schema) warnings.push(name + ': missing schema');
    }
    const sectors = arr(d.sectors, 'sectors');
    const clubs = arr(d.clubs, 'clubs');
    const players = arr(d.players, 'players');
    const competitions = arr(d.competitions, 'competitions');
    unique(sectors, 'sector', errors, /^[A-Za-z0-9]{2,6}$/);
    unique(clubs, 'club', errors, /^[A-Za-z0-9]{2,6}$/);
    unique(players, 'player', errors, PLAYER_ID);
    unique(competitions, 'competition', errors, /^[A-Za-z0-9]{3,8}$/);
    const sid = new Set(sectors.map(x => key(x.nickname)));
    const cid = new Set(clubs.map(x => key(x.nickname)));
    clubs.forEach(x => listOf(x, 'sector', 'sectors').forEach(s => { if (!sid.has(key(s))) errors.push('club ' + x.nickname + ': unknown sector ' + s); }));
    players.forEach(x => {
      listOf(x, 'club', 'clubs').forEach(c => { if (!cid.has(key(c))) errors.push('player ' + x.nickname + ': unknown club ' + c); });
      listOf(x, 'sector', 'sectors').forEach(s => { if (!sid.has(key(s))) errors.push('player ' + x.nickname + ': unknown sector ' + s); });
    });
    competitions.forEach(x => {
      if (x.sector && !sid.has(key(x.sector))) errors.push('competition ' + x.nickname + ': unknown sector ' + x.sector);
      if (!x.sport || SPORTS.indexOf(x.sport) < 0) errors.push('competition ' + x.nickname + ': invalid sport ' + x.sport);
    });
    return { sectors, clubs, players, competitions };
  }
  function expectedFiles(registries, manifest) {
    const listed = arr(manifest, 'files');
    if (listed.length) return listed.map(f => ({ sector: f.sector, sport: key(f.sport), season: f.season || '2026A', path: f.path }));
    const out = [];
    for (const sector of registries.sectors) for (const sport of SPORTS) out.push({ sector: sector.nickname, sport, season: '2026A', path: 'data/' + sector.nickname + '/' + SPORT_DIR[sport] + '/Season_2026A.csn' });
    return out;
  }
  async function loadLedger(registries, errors, warnings) {
    let manifest = {};
    try { manifest = await fetchJSON('data/manifest.json'); }
    catch (err) { warnings.push('manifest missing (' + err.message + ')'); }
    const wanted = expectedFiles(registries, manifest);
    const clubMap = indexBy(registries.clubs);
    const competitionMap = indexBy(registries.competitions);
    const matches = []; const filesOut = []; const competitions = []; const seen = new Set();
    const loaded = await Promise.all(wanted.map(async file => {
      try {
        const text = await fetchText(file.path);
        const parsed = (CASPER_CSN.parseSeason || CASPER_CSN.parse)(text, file, errors);
        return { file, parsed, ok: true };
      } catch (err) {
        warnings.push(file.path + ' not loaded (' + err.message + ')');
        return { file, parsed: { matches: [], competitions: [] }, ok: false };
      }
    }));
    for (const item of loaded) {
      filesOut.push({ path: item.file.path, ok: item.ok, matches: item.parsed.matches.length, sport: item.file.sport, sector: item.file.sector, season: item.file.season });
      for (const row of item.parsed.competitions || []) competitions.push(row);
      for (const row of item.parsed.matches) {
        if (row.home && !clubMap.has(key(row.home))) errors.push(item.file.path + ': unknown home club ' + row.home);
        if (row.away && !clubMap.has(key(row.away))) errors.push(item.file.path + ': unknown away club ' + row.away);
        if (row.competition && !competitionMap.has(key(row.competition))) errors.push(item.file.path + ': unknown competition ' + row.competition);
        if (seen.has(row.id)) errors.push(item.file.path + ': duplicate match id ' + row.id);
        else seen.add(row.id);
        matches.push(row);
      }
    }
    return { manifest, files: filesOut, matches, competitions };
  }
  function derive(registries, ledger) {
    const playerMap = indexBy(registries.players);
    const bySector = {};
    for (const sector of registries.sectors) {
      bySector[sector.nickname] = {
        form: '\u2014', sports: Object.fromEntries(SPORTS.map(s => [s, emptySport()])),
        clubTable: [], playerStats: [], results: [], records: [],
        clubs: registries.clubs.filter(c => belongsToSector(c, sector.nickname)).length,
        players: registries.players.filter(p => belongsToSector(p, sector.nickname)).length,
        competitions: registries.competitions.filter(c => key(c.sector) === key(sector.nickname)).length
      };
    }
    const clubRows = {}; const playerRows = {}; const playerApps = {};
    for (const row of ledger.matches) {
      const pack = bySector[row.sector]; if (!pack) continue;
      pack.results.push(row);
      const sport = row.sport; if (SPORTS.indexOf(sport) < 0) continue;
      pack.sports[sport].matches += 1;
      if (sport === 'cricsal') { pack.sports[sport].runs += Number(row.runs || 0); pack.sports[sport].wickets += Number(row.wickets || 0); }
      else {
        const hs = Number(row.homeScore || 0), as = Number(row.awayScore || 0);
        pack.sports[sport].goals += hs + as;
        if (sport === 'football') {
          const hid = key(row.home), aid = key(row.away);
          if (!clubRows[hid]) clubRows[hid] = { club: row.home, sector: row.sector, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, elo: 1000, wr: '0%', form: '', seq: [] };
          if (!clubRows[aid]) clubRows[aid] = { club: row.away, sector: row.sector, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, elo: 1000, wr: '0%', form: '', seq: [] };
          clubRows[hid].p += 1; clubRows[aid].p += 1;
          clubRows[hid].gf += hs; clubRows[hid].ga += as; clubRows[aid].gf += as; clubRows[aid].ga += hs;
          if (hs > as) { clubRows[hid].w += 1; clubRows[aid].l += 1; clubRows[hid].seq.push('W'); clubRows[aid].seq.push('L'); }
          else if (hs < as) { clubRows[hid].l += 1; clubRows[aid].w += 1; clubRows[hid].seq.push('L'); clubRows[aid].seq.push('W'); }
          else { clubRows[hid].d += 1; clubRows[aid].d += 1; clubRows[hid].seq.push('D'); clubRows[aid].seq.push('D'); }
        }
      }
      const credits = row.credits || { goals: [], assists: [] };
      const involved = new Set();
      for (const g of credits.goals || []) {
        if (!playerMap.has(key(g.player))) continue;
        const pk = key(g.player) + '|' + sport;
        if (!playerRows[pk]) playerRows[pk] = { player: g.player, club: g.side === 'away' ? row.away : row.home, sector: row.sector, sport, primary: 0, secondary: 0, apps: 0, discipline: 0 };
        playerRows[pk].primary += Number(g.n || 0); involved.add(pk);
      }
      for (const a of credits.assists || []) {
        if (!playerMap.has(key(a.player))) continue;
        const pk = key(a.player) + '|' + sport;
        if (!playerRows[pk]) playerRows[pk] = { player: a.player, club: a.side === 'away' ? row.away : row.home, sector: row.sector, sport, primary: 0, secondary: 0, apps: 0, discipline: 0 };
        playerRows[pk].secondary += Number(a.n || 0); involved.add(pk);
      }
      for (const pk of involved) { if (!playerApps[pk]) playerApps[pk] = new Set(); playerApps[pk].add(row.id); }
    }
    Object.keys(playerRows).forEach(pk => { playerRows[pk].apps = playerApps[pk] ? playerApps[pk].size : 0; });
    for (const sector of registries.sectors) {
      const pack = bySector[sector.nickname];
      for (const sport of SPORTS) {
        const block = pack.sports[sport];
        block.average = block.matches ? +(((sport === 'cricsal' ? block.runs : block.goals) / block.matches).toFixed(2)) : 0;
      }
      pack.clubTable = Object.values(clubRows).filter(r => key(r.sector) === key(sector.nickname)).map(r => {
        r.gd = r.gf - r.ga; r.wr = r.p ? Math.round((r.w / r.p) * 100) + '%' : '0%';
        r.elo = 1000 + r.w * 12 + r.d * 4 - r.l * 8 + r.gd; r.form = (r.seq || []).slice(-5).join('') || '\u2014';
        return r;
      }).sort((a, b) => (b.w - a.w) || (b.gd - a.gd) || (b.gf - a.gf)).map((r, i) => Object.assign({ rank: i + 1 }, r));
      pack.playerStats = Object.values(playerRows).filter(r => key(r.sector) === key(sector.nickname)).sort((a, b) => (b.primary - a.primary) || (b.secondary - a.secondary));
      pack.form = pack.results.filter(r => r.sport === 'football').slice(-5).map(r => Number(r.homeScore) > Number(r.awayScore) ? 'W' : Number(r.homeScore) < Number(r.awayScore) ? 'L' : 'D').join('') || '\u2014';
    }
    const networkSports = Object.values(bySector).reduce((acc, pack) => {
      const out = {};
      for (const sport of SPORTS) {
        const x = acc[sport] || emptySport(); const y = pack.sports[sport] || emptySport(); const block = emptySport();
        block.matches = x.matches + y.matches;
        if (sport === 'cricsal') { block.runs = x.runs + y.runs; block.wickets = x.wickets + y.wickets; block.average = block.matches ? +(block.runs / block.matches).toFixed(2) : 0; }
        else { block.goals = x.goals + y.goals; block.average = block.matches ? +(block.goals / block.matches).toFixed(2) : 0; }
        out[sport] = block;
      }
      return out;
    }, Object.fromEntries(SPORTS.map(s => [s, emptySport()])));
    const network = {
      sectors: registries.sectors.length, active: registries.sectors.filter(s => s.status === 'active').length,
      clubs: registries.clubs.length, players: registries.players.length, competitions: registries.competitions.length,
      sports: networkSports, clubTable: registries.sectors.flatMap(s => bySector[s.nickname].clubTable),
      playerStats: registries.sectors.flatMap(s => bySector[s.nickname].playerStats),
      results: registries.sectors.flatMap(s => bySector[s.nickname].results), records: [],
      form: registries.sectors.map(s => ({ sector: s.nickname, form: bySector[s.nickname].form, average: bySector[s.nickname].sports.football.average }))
    };
    return { bySector, network };
  }
  function scope(model, sectorId) {
    if (!sectorId || key(sectorId) === 'all') {
      return { id: 'ALL', label: 'NETWORK', sectors: model.sectors, clubs: model.clubs, players: model.players, competitions: model.competitions, sports: model.network.sports, clubTable: model.network.clubTable, playerStats: model.network.playerStats, results: model.network.results, records: model.network.records, form: model.network.form, counts: { sectors: model.network.sectors, active: model.network.active, clubs: model.network.clubs, players: model.network.players, competitions: model.network.competitions } };
    }
    const sector = model.indexes.sector.get(key(sectorId));
    if (!sector) return scope(model, 'all');
    const pack = model.bySector[sector.nickname];
    return { id: sector.nickname, label: sector.name, sector, sectors: [sector], clubs: model.clubs.filter(c => belongsToSector(c, sector.nickname)), players: model.players.filter(p => belongsToSector(p, sector.nickname)), competitions: model.competitions.filter(c => key(c.sector) === key(sector.nickname)), sports: pack.sports, clubTable: pack.clubTable, playerStats: pack.playerStats, results: pack.results, records: pack.records, form: [{ sector: sector.nickname, form: pack.form, average: pack.sports.football.average }], counts: { sectors: 1, active: sector.status === 'active' ? 1 : 0, clubs: pack.clubs, players: pack.players, competitions: pack.competitions } };
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
    const ledger = await loadLedger(registries, errors, warnings);
    const derived = derive(registries, ledger);
    cache = Object.assign({}, registries, {
      dashboard: raw.dashboard || {}, bySector: derived.bySector, network: derived.network, ledger,
      seasonCompetitions: ledger.competitions || [], officialAwards: raw.awards || null,
      indexes: { sector: indexBy(registries.sectors), club: indexBy(registries.clubs), player: indexBy(registries.players), competition: indexBy(registries.competitions) },
      mock: !!(raw.dashboard && raw.dashboard.mock), ok: !errors.length, errors, warnings,
      scope: sectorId => scope(cache, sectorId),
      get: (kind, id) => cache.indexes[kind] ? (cache.indexes[kind].get(key(id)) || null) : null,
      belongsToSector, belongsToClub, listOf
    });
    if (typeof CASPER_AWARDS !== 'undefined' && CASPER_AWARDS.enhance) await CASPER_AWARDS.enhance(cache);
    if (warnings.length) console.warn('CASPER data warnings', warnings);
    if (errors.length) console.error('CASPER data validation errors', errors);
    return cache;
  }
  return { load, clear: () => { cache = null; }, sports: SPORTS };
})();
