const CASPER_AWARDS = (() => {
  const SPORTS = ['football', 'futsal', 'cricsal'];
  const key = v => String(v || '').trim().toLowerCase();
  const MIN_SPORTS = 2;
  const MIN_APPS = 2;

  function nameOf(model, kind, id) {
    const row = model.get && id ? model.get(kind, id) : null;
    return (row && (row.name || row.nickname)) || id || '—';
  }

  function bump(map, id, patch) {
    if (!id) return;
    const k = key(id);
    if (!map[k]) map[k] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, runs: 0, wickets: 0 };
    const row = map[k];
    Object.keys(patch).forEach(field => { row[field] += patch[field]; });
  }

  function winnerOfFinal(matches, competitionId) {
    const finals = matches.filter(m => key(m.competition) === key(competitionId) && /^F$/i.test(m.round || ''));
    const last = finals[finals.length - 1];
    if (!last) return '';
    const hs = Number(last.homeScore || 0), as = Number(last.awayScore || 0);
    if (hs > as) return last.home;
    if (as > hs) return last.away;
    const pens = String(last.note || '').match(/p\s*(\d+)\s*-\s*(\d+)/i);
    if (pens) return Number(pens[1]) > Number(pens[2]) ? last.home : last.away;
    return '';
  }

  function clubTables(matches) {
    const out = {};
    for (const row of matches) {
      const slot = (row.sector || '') + '|' + (row.sport || '');
      if (!out[slot]) out[slot] = {};
      const table = out[slot];
      const hs = Number(row.homeScore || 0);
      const as = Number(row.awayScore || 0);
      if (row.sport === 'cricsal') {
        bump(table, row.home, { p: 1, runs: hs, gf: hs, ga: as, cs: as === 0 ? 1 : 0, wickets: Number(row.wickets || 0) });
        bump(table, row.away, { p: 1, runs: as, gf: as, ga: hs, cs: hs === 0 ? 1 : 0 });
        if (hs > as) { bump(table, row.home, { w: 1 }); bump(table, row.away, { l: 1 }); }
        else if (as > hs) { bump(table, row.away, { w: 1 }); bump(table, row.home, { l: 1 }); }
        else { bump(table, row.home, { d: 1 }); bump(table, row.away, { d: 1 }); }
      } else {
        bump(table, row.home, { p: 1, gf: hs, ga: as, cs: as === 0 ? 1 : 0 });
        bump(table, row.away, { p: 1, gf: as, ga: hs, cs: hs === 0 ? 1 : 0 });
        if (hs > as) { bump(table, row.home, { w: 1 }); bump(table, row.away, { l: 1 }); }
        else if (as > hs) { bump(table, row.away, { w: 1 }); bump(table, row.home, { l: 1 }); }
        else { bump(table, row.home, { d: 1 }); bump(table, row.away, { d: 1 }); }
      }
    }
    return out;
  }

  function pickMax(rows, score, minP) {
    const eligible = rows.filter(r => (r.p || 0) >= (minP || MIN_APPS));
    if (!eligible.length) return null;
    return eligible.slice().sort((a, b) => score(b) - score(a) || (b.p || 0) - (a.p || 0))[0];
  }

  function pickMin(rows, score, minP) {
    const eligible = rows.filter(r => (r.p || 0) >= (minP || MIN_APPS));
    if (!eligible.length) return null;
    return eligible.slice().sort((a, b) => score(a) - score(b) || (b.p || 0) - (a.p || 0))[0];
  }

  function playerGoals(matches, sport) {
    const tally = {};
    for (const row of matches.filter(m => m.sport === sport)) {
      for (const g of (row.credits && row.credits.goals) || []) {
        if (!g.player) continue;
        const k = key(g.player);
        if (!tally[k]) tally[k] = { id: g.player, n: 0, club: g.side === 'away' ? row.away : row.home, sector: row.sector, sport };
        tally[k].n += g.n || 0;
      }
    }
    return Object.values(tally).sort((a, b) => b.n - a.n);
  }

  function captainOf(comps, clubId) {
    for (const c of comps) {
      const hit = c.captains && c.captains[key(clubId)];
      if (hit && hit.player) return hit.player;
    }
    return '';
  }

  function prestigeMap(competitions) {
    const best = {};
    for (const c of competitions) {
      if (!c.sport || !c.sector) continue;
      const k = c.sector + '|' + c.sport;
      if (!best[k] || c.sort > best[k].sort) best[k] = c;
    }
    return best;
  }

  function hostedSports(sector, competitions, matches) {
    return SPORTS.filter(sport =>
      matches.some(m => m.sector === sector && m.sport === sport) ||
      competitions.some(c => c.sector === sector && c.sport === sport)
    );
  }

  function sportHonors(model, sector, sport, table, comps, matches) {
    const rows = Object.values(table || {});
    const prestige = prestigeMap(comps)[sector + '|' + sport];
    const champion = (prestige && (prestige.awards.ch || winnerOfFinal(matches, prestige.id))) || '';
    let scorer = null;
    if (sport === 'football') {
      const board = playerGoals(matches.filter(m => m.sector === sector), 'football');
      if (board[0]) scorer = { id: board[0].id, kind: 'player', value: board[0].n, club: board[0].club };
    } else if (sport === 'cricsal') {
      const top = pickMax(rows, r => r.runs || 0, 1);
      if (top) scorer = { id: captainOf(comps, top.id) || top.id, kind: captainOf(comps, top.id) ? 'player' : 'club', value: top.runs, club: top.id };
    } else {
      const top = pickMax(rows, r => r.gf || 0, 1);
      if (top) scorer = { id: captainOf(comps, top.id) || top.id, kind: captainOf(comps, top.id) ? 'player' : 'club', value: top.gf, club: top.id };
    }
    const defence = pickMin(rows, r => r.p ? r.ga / r.p : 99, MIN_APPS);
    const gk = pickMax(rows, r => r.cs || 0, 1);
    return {
      sport,
      prestige: prestige ? { id: prestige.id, name: prestige.name, dos: prestige.dos, doc: prestige.doc, champion } : null,
      topScorer: scorer,
      bestDefence: defence ? { id: defence.id, kind: 'club', value: defence.p ? +(defence.ga / defence.p).toFixed(2) : 0, ga: defence.ga, p: defence.p } : null,
      bestGk: gk ? { id: gk.id, kind: 'club', value: gk.cs, p: gk.p } : null
    };
  }

  function labelHolder(model, honor) {
    if (!honor) return 'Unawarded';
    if (honor.kind === 'player') return nameOf(model, 'player', honor.id);
    return nameOf(model, 'club', honor.id);
  }

  async function loadCompetitions(model) {
    if (model.seasonCompetitions && model.seasonCompetitions.length) return model.seasonCompetitions;
    const out = [];
    for (const file of (model.ledger && model.ledger.files) || []) {
      if (!file.path || file.ok === false) continue;
      try {
        const text = await fetch(file.path + '?v=' + Date.now(), { cache: 'no-store' }).then(r => r.text());
        const parsed = CASPER_CSN.parseSeason(text, { path: file.path, sport: file.sport, sector: file.sector, season: file.season || '2026A' }, []);
        out.push.apply(out, parsed.competitions || []);
      } catch (err) { model.warnings && model.warnings.push(file.path + ' awards meta: ' + err.message); }
    }
    return out;
  }

  async function compute(model) {
    const matches = (model.ledger && model.ledger.matches) || model.network.results || [];
    const competitions = await loadCompetitions(model);
    const tables = clubTables(matches);
    const season = '2026A';
    const sectors = [];
    for (const sector of model.sectors || []) {
      const hosted = hostedSports(sector.nickname, competitions, matches);
      const bySport = {};
      for (const sport of hosted) {
        bySport[sport] = sportHonors(model, sector.nickname, sport, tables[sector.nickname + '|' + sport], competitions.filter(c => c.sector === sector.nickname && c.sport === sport), matches);
      }
      const eligible = hosted.length >= MIN_SPORTS;
      let sweep = null, attacker = null, defence = null, reason = '';
      if (!eligible) reason = 'Sector hosts ' + hosted.length + ' sport' + (hosted.length === 1 ? '' : 's') + '; Golden honors need 2 or 3.';
      else {
        const crowns = hosted.map(s => bySport[s].prestige && bySport[s].prestige.champion);
        if (crowns.every(Boolean) && crowns.every(id => key(id) === key(crowns[0]))) sweep = { id: crowns[0], kind: 'club' };
        else if (!crowns.every(Boolean)) reason = 'A hosted sport still has no completed crown tournament.';
        const scorers = hosted.map(s => bySport[s].topScorer && bySport[s].topScorer.id);
        if (scorers.every(Boolean) && scorers.every(id => key(id) === key(scorers[0]))) attacker = hosted.map(s => bySport[s].topScorer)[0];
        const walls = hosted.map(s => bySport[s].bestDefence && bySport[s].bestDefence.id);
        if (walls.every(Boolean) && walls.every(id => key(id) === key(walls[0]))) defence = hosted.map(s => bySport[s].bestDefence)[0];
      }
      sectors.push({ sector: sector.nickname, name: sector.name, season, hosted, eligible, bySport, sweep, attacker, defence, reason });
    }

    const sameClubAcross = (field) => {
      const hits = sectors.filter(s => s[field] && s[field].id);
      const byId = {};
      hits.forEach(s => {
        const k = key(s[field].id);
        if (!byId[k]) byId[k] = [];
        byId[k].push(s.sector);
      });
      return Object.keys(byId).filter(k => new Set(byId[k]).size >= 2).map(k => ({ id: hits.find(s => key(s[field].id) === k)[field].id, sectors: byId[k], kind: hits.find(s => key(s[field].id) === k)[field].kind }));
    };

    const tsars = {};
    const allStars = {};
    for (const sport of SPORTS) {
      if (sport === 'football') {
        const board = playerGoals(matches, 'football');
        tsars[sport] = board[0] || null;
        allStars[sport] = board.slice(0, 4);
      } else {
        const pooled = {};
        sectors.forEach(s => {
          const table = tables[s.sector + '|' + sport] || {};
          Object.values(table).forEach(row => {
            const player = captainOf(competitions.filter(c => c.sector === s.sector && c.sport === sport), row.id) || row.id;
            const k = key(player);
            if (!pooled[k]) pooled[k] = { id: player, n: 0, club: row.id, sport };
            pooled[k].n += sport === 'cricsal' ? row.runs : row.gf;
          });
        });
        const board = Object.values(pooled).sort((a, b) => b.n - a.n);
        tsars[sport] = board[0] || null;
        allStars[sport] = board.slice(0, 4);
      }
    }

    const clubScore = {};
    sectors.forEach(s => {
      hostedSports(s.sector, competitions, matches).forEach(sport => {
        const honor = s.bySport[sport];
        if (honor && honor.prestige && honor.prestige.champion) {
          const id = honor.prestige.champion;
          if (!clubScore[key(id)]) clubScore[key(id)] = { id, pts: 0 };
          clubScore[key(id)].pts += 15;
        }
      });
      Object.values(tables).forEach(table => {
        Object.values(table).forEach(row => {
          if (!clubScore[key(row.id)]) clubScore[key(row.id)] = { id: row.id, pts: 0 };
          clubScore[key(row.id)].pts += (row.w || 0) * 3 + (row.d || 0) + Math.max(0, (row.gf || 0) - (row.ga || 0));
        });
      });
    });
    const bestClub = Object.values(clubScore).sort((a, b) => b.pts - a.pts)[0] || null;

    const board = [];
    sectors.forEach(s => {
      board.push({ label: s.name + ' Golden Sweep', value: s.sweep ? nameOf(model, 'club', s.sweep.id) : (s.eligible ? 'Pending' : 'Ineligible'), note: s.reason || (s.hosted.join(', ') + ' crowns') });
      board.push({ label: s.name + ' Golden Attacker', value: s.attacker ? labelHolder(model, s.attacker) : (s.eligible ? 'Pending' : 'Ineligible'), note: 'Top scorer in every hosted sport' });
      board.push({ label: s.name + ' Golden Defense', value: s.defence ? labelHolder(model, s.defence) : (s.eligible ? 'Pending' : 'Ineligible'), note: 'Best defence in every hosted sport' });
    });
    const slams = sameClubAcross('sweep');
    const boots = sameClubAcross('attacker');
    const shields = sameClubAcross('defence');
    board.push({ label: 'CASPER Grand Slam', value: slams.length ? slams.map(x => nameOf(model, 'club', x.id)).join(', ') : 'Unawarded', note: 'Golden Sweep in two sectors, same club, same season' });
    board.push({ label: 'CASPER Radioactive Boot', value: boots.length ? boots.map(x => labelHolder(model, { id: x.id, kind: x.kind })).join(', ') : 'Unawarded', note: 'Golden Attacker in two sectors, same season' });
    board.push({ label: 'CASPER Radioactive Shield', value: shields.length ? shields.map(x => labelHolder(model, { id: x.id, kind: x.kind })).join(', ') : 'Unawarded', note: 'Golden Defense in two sectors, same season' });
    SPORTS.forEach(sport => {
      const t = tsars[sport];
      board.push({ label: 'CASPER ' + sport[0].toUpperCase() + sport.slice(1) + ' Tsar', value: t ? nameOf(model, model.get('player', t.id) ? 'player' : 'club', t.id) : 'Unawarded', note: 'Top scorer across every sector · ' + season });
      board.push({ label: 'CASPER All-Star ' + sport[0].toUpperCase() + sport.slice(1), value: (allStars[sport] || []).map(x => x.id).join(', ') || 'Unawarded', note: 'Top 4 producers from every sector' });
    });
    board.push({ label: 'CASPER Best Club', value: bestClub ? nameOf(model, 'club', bestClub.id) : 'Unawarded', note: 'Aggregated titles and results across sports and sectors' });

    return {
      season,
      competitions,
      sectors,
      decadian: { grandSlam: slams, radioactiveBoot: boots, radioactiveShield: shields },
      tsars,
      allStars,
      bestClub,
      board
    };
  }

  function attach(model, honors) {
    model.honors = honors;
    model.network.records = honors.board;
    (model.sectors || []).forEach(sector => {
      const pack = model.bySector[sector.nickname];
      if (!pack) return;
      const row = honors.sectors.find(s => s.sector === sector.nickname);
      pack.records = honors.board.filter(r => r.label.indexOf(sector.name) === 0 || r.label.indexOf('CASPER') === 0);
      pack.honors = row;
    });
  }

  async function enhance(model) {
    if (model.honors) return model;
    const honors = await compute(model);
    attach(model, honors);
    return model;
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function render(host, model, sectorId) {
    if (!host || !model.honors) return;
    const honors = model.honors;
    const wanted = !sectorId || sectorId === 'ALL' ? honors.sectors : honors.sectors.filter(s => s.sector === sectorId);
    const card = (label, value, note) => `<div><small>${esc(label)}</small><b>${esc(value)}</b><span>${esc(note || '')}</span></div>`;
    const sportLine = (s, sport) => {
      const h = s.bySport[sport];
      if (!h) return '';
      const crown = h.prestige ? `${h.prestige.name} · ${h.prestige.champion ? nameOf(model, 'club', h.prestige.champion) : 'no champion yet'}` : 'no crown tournament';
      return `<div class="record-list"><div><small>CROWN</small><b>${esc(crown)}</b><span>last tournament by doc/dos</span></div><div><small>TOP SCORER</small><b>${esc(labelHolder(model, h.topScorer))}</b><span>${h.topScorer ? h.topScorer.value : '—'}</span></div><div><small>BEST DEFENCE</small><b>${esc(h.bestDefence ? nameOf(model, 'club', h.bestDefence.id) : '—')}</b><span>${h.bestDefence ? h.bestDefence.value + ' GA/M' : 'need more matches'}</span></div><div><small>BEST GK</small><b>${esc(h.bestGk ? nameOf(model, 'club', h.bestGk.id) : '—')}</b><span>${h.bestGk ? h.bestGk.value + ' clean sheets' : '—'}</span></div></div>`;
    };
    host.innerHTML = wanted.map(s => `<section class="box" style="margin-top:10px"><header><div><small>SECTOR HONORS · ${esc(s.season)}</small><h2>${esc(s.name)}</h2></div><span>${s.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}</span></header><p>${esc(s.reason || ('Hosted sports: ' + s.hosted.join(', ')))}</p><div class="record-list">${card('Golden Sweep', s.sweep ? nameOf(model, 'club', s.sweep.id) : (s.eligible ? 'Pending' : 'Ineligible'), 'Win every hosted sport crown')}${card('Golden Attacker', s.attacker ? labelHolder(model, s.attacker) : (s.eligible ? 'Pending' : 'Ineligible'), 'Top scorer in every hosted sport')}${card('Golden Defense', s.defence ? labelHolder(model, s.defence) : (s.eligible ? 'Pending' : 'Ineligible'), 'Best defence in every hosted sport')}</div><div class="detail-grid">${s.hosted.map(sport => `<div class="box"><header><div><small>${sport.toUpperCase()}</small><h2>AUTO AWARDS</h2></div></header>${sportLine(s, sport)}</div>`).join('')}</div></section>`).join('') +
      `<section class="box" style="margin-top:10px"><header><div><small>DECADIAN · SAME CLUB · TWO SECTORS</small><h2>CROSS-SECTOR HONORS</h2></div></header><div class="record-list">${card('CASPER Grand Slam', honors.decadian.grandSlam.length ? honors.decadian.grandSlam.map(x => nameOf(model, 'club', x.id)).join(', ') : 'Unawarded', 'Golden Sweep in two sectors')}${card('CASPER Radioactive Boot', honors.decadian.radioactiveBoot.length ? honors.decadian.radioactiveBoot.map(x => x.id).join(', ') : 'Unawarded', 'Golden Attacker in two sectors')}${card('CASPER Radioactive Shield', honors.decadian.radioactiveShield.length ? honors.decadian.radioactiveShield.map(x => x.id).join(', ') : 'Unawarded', 'Golden Defense in two sectors')}</div></section>` +
      `<section class="box" style="margin-top:10px"><header><div><small>SEASONAL · EVERY SECTOR</small><h2>NETWORK AWARDS</h2></div></header><div class="record-list">${honors.board.filter(r => r.label.indexOf('Tsar') >= 0 || r.label.indexOf('All-Star') >= 0 || r.label.indexOf('Best Club') >= 0).map(r => card(r.label, r.value, r.note)).join('')}</div></section>` +
      cabinetBlock(model, sectorId);
  }

  function cabinetBlock(model, sectorId) {
    const rows = ((model.officialAwards && model.officialAwards.awards) || []).filter(a => {
      if (!sectorId || sectorId === 'ALL') return true;
      return sectorId === 'S1';
    });
    if (!rows.length) return '';
    return `<section class="box" style="margin-top:10px"><header><div><small>SECTOR 1 · SALTLAKE 5</small><h2>OFFICIAL COMPETITION CABINET</h2></div><span>${rows.length} LISTED</span></header>${rows.map(a => `<div class="list-row"><b>${esc(String(a.competition || '').toUpperCase())}</b><strong>${esc(a.award)}</strong><span>${esc(a.name)} · ${esc(String(a.sport || '').toUpperCase())}</span><small>${esc(a.winnerName || a.winner)}</small></div>`).join('')}</section>`;
  }

  return { compute, enhance, render, hostedSports, prestigeMap };
})();

(function wrapLoad() {
  if (!window.CASPER_DATA || !CASPER_DATA.load) return;
  const orig = CASPER_DATA.load.bind(CASPER_DATA);
  CASPER_DATA.load = async function() {
    const model = await orig();
    return CASPER_AWARDS.enhance(model);
  };
})();
