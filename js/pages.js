const CIcon = { football: '⚽', futsal: '🧦', cricsal: '🏏' };
const escPage = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
const pageSport = s => s === 'cricsal' ? 'CRICSAL' : String(s || '').toUpperCase();
const keyPage = v => String(v ?? '').trim().toLowerCase();
const byPage = (a, k, v) => (a || []).find(x => keyPage(x?.[k]) === keyPage(v));
const stat = (label, value, note = '') => `<div><small>${escPage(label)}</small><strong>${escPage(value)}</strong><span>${escPage(note)}</span></div>`;
const asList = v => Array.isArray(v) ? v.filter(x => x != null && x !== '').map(String) : (v == null || v === '' ? [] : [String(v)]);
const joinList = v => asList(v).join(', ');
const primaryClub = p => asList(p && p.clubs).concat(asList(p && p.club))[0] || '';
const playerClubs = p => { const out = []; asList(p && p.clubs).forEach(x => { if (!out.includes(x)) out.push(x); }); asList(p && p.club).forEach(x => { if (!out.includes(x)) out.push(x); }); return out; };
const playerSectors = p => { const out = []; asList(p && p.sectors).forEach(x => { if (!out.includes(x)) out.push(x); }); asList(p && p.sector).forEach(x => { if (!out.includes(x)) out.push(x); }); return out; };
const honorsOf = (d, kind, id) => (typeof CASPER_AWARDS !== 'undefined' && CASPER_AWARDS.forEntity) ? CASPER_AWARDS.forEntity(d, kind, id) : [];
const sportBlock = (sport, x) => { if (!x) return ''; const primary = sport === 'cricsal' ? (x.runs || 0) : (x.goals || 0); return `<div class="box"><header><div><small>${CIcon[sport] || ''} ${pageSport(sport)}</small><h2>STATISTICS</h2></div><span>${x.matches || 0} MATCHES</span></header><div class="record-list">${stat(sport === 'cricsal' ? 'RUNS' : 'GOALS', primary, 'recorded total')}${stat(sport === 'cricsal' ? 'WICKETS' : 'MATCHES', sport === 'cricsal' ? (x.wickets || 0) : (x.matches || 0), 'recorded')}${stat('AVERAGE', x.average || '—', sport === 'cricsal' ? 'runs per match' : 'goals per match')}</div></div>`; };
const entityStats = (sport, rows) => { const z = { matches: 0, goals: 0, runs: 0, wickets: 0 }; for (const r of rows || []) { if (sport && r.sport !== sport) continue; z.matches++; if (r.sport === 'cricsal') { z.runs += Number(r.runs || r.homeScore || 0); z.wickets += Number(r.wickets || 0); } else z.goals += Number(r.homeScore || 0) + Number(r.awayScore || 0); } const total = sport === 'cricsal' ? z.runs : z.goals; z.average = z.matches ? (total / z.matches).toFixed(2) : '—'; return z; };
const matchRows = (d, filter) => { const rows = (d.network && d.network.results) || []; return filter ? rows.filter(filter) : rows; };
const linkedResults = (d, c) => matchRows(d, r => keyPage(r.competition) === keyPage(c.nickname));
const clubResults = (d, id) => matchRows(d, r => keyPage(r.home) === keyPage(id) || keyPage(r.away) === keyPage(id));
const playerStats = (d, id) => ((d.network && d.network.playerStats) || []).filter(x => keyPage(x.player) === keyPage(id));
const renderStatStrip = items => `<div class="stats">${items.join('')}</div>`;
const empty = msg => `<div class="empty-state">${escPage(msg)}</div>`;
const sumSport = (rows, sport, field) => rows.filter(x => sport === 'all' ? true : sport === 'ball' ? x.sport !== 'cricsal' : x.sport === sport).reduce((a, x) => a + Number(x[field] || 0), 0);
function cabinetBox(d, kind, id) {
  const rows = honorsOf(d, kind, id);
  if (!rows.length) return `<div class="box"><header><div><small>HONOR CABINET</small><h2>EMPTY</h2></div><span>${escPage(String(kind).toUpperCase())}</span></header><p class="empty-state">No official or computed honors yet.</p></div>`;
  return `<div class="box"><header><div><small>HONOR CABINET</small><h2>${rows.length} AWARDS</h2></div><span>${escPage(String(kind).toUpperCase())}</span></header><div class="record-list">${rows.map(r => `<div class="cabinet-item"><small>${escPage(String(r.source || 'honor').toUpperCase())}</small><b>${escPage(r.label || r.award || '')}</b><span>${escPage(r.note || '')}</span></div>`).join('')}</div></div>`;
}
(async () => {
  try {
    const d = await CASPER_DATA.load();
    const q = new URLSearchParams(location.search);
    const id = q.get('id');
    const type = document.body.dataset.page;
    const $ = s => document.querySelector(s);
    document.querySelectorAll('.topbar nav a').forEach(a => { if (a.getAttribute('href') && a.getAttribute('href').includes(type)) a.classList.add('active'); });
    const setHead = (title, sub) => { document.title = 'CASPER — ' + title; if ($('#page-title')) $('#page-title').textContent = title; if ($('#page-sub')) $('#page-sub').textContent = sub; };
    const sectorStats = s => (d.bySector && d.bySector[s.nickname]) || { sports: { football: {}, futsal: {}, cricsal: {} }, clubs: 0, players: 0, competitions: 0, results: [] };
    if (type === 'players') {
      let rows = d.players.slice();
      const host = $('#directory'); if (!host) throw new Error('Missing #directory');
      const render = () => {
        host.innerHTML = renderStatStrip([
          stat('PLAYERS', d.players.length, 'registered'),
          stat('FOOTBALL GOALS', d.network.sports.football.goals, 'football'),
          stat('FUTSAL GOALS', d.network.sports.futsal.goals, 'futsal'),
          stat('CRICSAL RUNS', d.network.sports.cricsal.runs, 'cricsal'),
          stat('CRICSAL WICKETS', d.network.sports.cricsal.wickets, 'cricsal'),
          stat('FOOTBALL MATCHES', d.network.sports.football.matches, 'football'),
          stat('FUTSAL MATCHES', d.network.sports.futsal.matches, 'futsal'),
          stat('CRICSAL MATCHES', d.network.sports.cricsal.matches, 'cricsal')
        ]) + `<div class="directory">${rows.map(p => {
          const ps = playerStats(d, p.nickname);
          const honors = honorsOf(d, 'player', p.nickname);
          return `<a class="list-row list-row-rich" href="player.html?id=${encodeURIComponent(p.nickname)}"><b>${escPage(p.nickname)}</b><strong>${escPage(p.name)}</strong><span>${escPage(joinList(playerClubs(p)) || '—')} · ${escPage(joinList(playerSectors(p)) || '—')}</span><small>FB ${sumSport(ps,'football','primary')}G · FU ${sumSport(ps,'futsal','primary')}G · ${sumSport(ps,'ball','secondary')}A · ${sumSport(ps,'all','apps')} APP · ${sumSport(ps,'cricsal','primary')}R · ${sumSport(ps,'cricsal','secondary')}W · ${honors.length} AWARDS</small></a>`;
        }).join('') || empty('No players registered.')}</div>`;
      };
      render();
      $('#filter') && $('#filter').addEventListener('input', e => { const v = keyPage(e.target.value); rows = d.players.filter(p => keyPage(p.name + ' ' + p.nickname + ' ' + joinList(playerClubs(p)) + ' ' + joinList(playerSectors(p))).includes(v)); render(); });
    }
    if (type === 'clubs') {
      let rows = d.clubs.slice();
      const host = $('#directory'); if (!host) throw new Error('Missing #directory');
      const render = () => {
        const table = d.network.clubTable || [];
        host.innerHTML = renderStatStrip([
          stat('CLUBS', d.clubs.length, 'registered'), stat('PLAYERS', d.players.length, 'network'),
          stat('COMPETITIONS', d.competitions.length, 'network'), stat('FOOTBALL MATCHES', d.network.sports.football.matches, 'network'),
          stat('FOOTBALL GOALS', d.network.sports.football.goals, 'football'), stat('FUTSAL GOALS', d.network.sports.futsal.goals, 'futsal'),
          stat('CRICSAL RUNS', d.network.sports.cricsal.runs, 'cricsal'), stat('CRICSAL WICKETS', d.network.sports.cricsal.wickets, 'cricsal')
        ]) + `<div class="directory">${rows.map(c => {
          const t = byPage(table, 'club', c.nickname);
          const honors = honorsOf(d, 'club', c.nickname);
          const squad = d.players.filter(p => playerClubs(p).some(x => keyPage(x) === keyPage(c.nickname)));
          const results = clubResults(d, c.nickname);
          return `<a class="list-row list-row-rich" href="club.html?id=${encodeURIComponent(c.nickname)}"><b>${escPage(c.nickname)}</b><strong>${escPage(c.name)}</strong><span>${escPage(c.sector || '—')} · SQUAD ${squad.length} · ${honors.length} AWARDS</span><small>${t ? ('P ' + t.p + ' W ' + t.w + ' D ' + t.d + ' L ' + t.l + ' · GF ' + t.gf + ' GA ' + t.ga + ' GD ' + (t.gd > 0 ? '+' : '') + t.gd + ' · ELO ' + t.elo + ' · ' + t.wr) : 'no football table'} · FB ${results.filter(r => r.sport === 'football').length}M · FUT ${results.filter(r => r.sport === 'futsal').length}M · CRI ${results.filter(r => r.sport === 'cricsal').length}M</small></a>`;
        }).join('') || empty('No clubs registered.')}</div>`;
      };
      render();
      $('#filter') && $('#filter').addEventListener('input', e => { const v = keyPage(e.target.value); rows = d.clubs.filter(c => keyPage(c.name + ' ' + c.nickname + ' ' + c.sector).includes(v)); render(); });
    }
    if (type === 'player') {
      const p = byPage(d.players, 'nickname', id) || d.players[0];
      const c = byPage(d.clubs, 'nickname', primaryClub(p));
      const rows = playerStats(d, p.nickname);
      const honors = honorsOf(d, 'player', p.nickname);
      setHead(p.name, p.nickname + ' · ' + (joinList(playerSectors(p)) || '—') + ' · player registry');
      const cards = rows.length ? rows.map(x => `<div class="box"><header><div><small>${CIcon[x.sport] || ''} ${pageSport(x.sport)}</small><h2>PERFORMANCE</h2></div><span>${x.apps || 0} APPS</span></header><div class="record-list">${stat(x.sport === 'cricsal' ? 'RUNS' : 'GOALS', x.primary || 0, 'primary')}${stat(x.sport === 'cricsal' ? 'WICKETS' : 'ASSISTS', x.secondary || 0, 'secondary')}${stat('APPEARANCES', x.apps || 0, 'recorded')}${stat('RATE', x.apps ? (Number(x.primary || 0) / x.apps).toFixed(2) : '—', x.sport === 'cricsal' ? 'runs / app' : 'goals / app')}</div></div>`).join('') : `<div class="box"><header><div><small>SPORT STATISTICS</small><h2>NO ARCHIVE TOTALS</h2></div></header><p>Statistics will appear when official match records are linked.</p></div>`;
      $('#directory').innerHTML = renderStatStrip([
        stat('GENERAL ID', p.nickname, 'identity'), stat('CLUBS', playerClubs(p).length, joinList(playerClubs(p)) || 'registered'),
        stat('SECTORS', playerSectors(p).length, joinList(playerSectors(p)) || 'represented'),
        stat('GOALS', sumSport(rows, 'ball', 'primary'), 'football + futsal'), stat('ASSISTS', sumSport(rows, 'ball', 'secondary'), 'football + futsal'),
        stat('CRICSAL RUNS', sumSport(rows, 'cricsal', 'primary'), sumSport(rows, 'cricsal', 'secondary') + ' wickets'), stat('APPEARANCES', sumSport(rows, 'all', 'apps'), 'recorded'),
        stat('AWARDS', honors.length, 'cabinet')
      ]) + `<div class="detail-grid">${cards}${cabinetBox(d, 'player', p.nickname)}<div class="box"><header><div><small>REGISTRY</small><h2>PROFILE</h2></div></header><div class="record-list">${stat('NAME', p.name, 'registered')}${stat('CURRENT CLUB', (c && c.name) || primaryClub(p) || '—', 'registry')}${stat('ALL CLUBS', joinList(playerClubs(p)) || '—', 'registry')}${stat('SECTORS', joinList(playerSectors(p)) || '—', 'registry')}${stat('REGISTERED', p.date_registered || '—', 'date')}</div></div></div>`;
    }
    if (type === 'club') {
      const c = byPage(d.clubs, 'nickname', id) || d.clubs[0];
      const t = byPage(d.network.clubTable, 'club', c.nickname);
      const players = d.players.filter(p => playerClubs(p).some(x => keyPage(x) === keyPage(c.nickname)));
      const results = clubResults(d, c.nickname);
      const f = entityStats('football', results), fu = entityStats('futsal', results), cr = entityStats('cricsal', results);
      const honors = honorsOf(d, 'club', c.nickname);
      setHead(c.name, c.nickname + ' · ' + (c.sector || '') + ' · registered club');
      $('#directory').innerHTML = renderStatStrip([
        stat('SECTOR', c.sector || '—', 'primary'), stat('SQUAD', players.length, 'registered'),
        stat('FOOTBALL P', (t && t.p) || f.matches, 'table'), stat('WINS', (t && t.w) || 0, 'football'),
        stat('FORM', (t && t.form) || '—', (t && t.wr) || 'win rate'), stat('ELO', (t && t.elo) || '—', 'football'),
        stat('TITLES', honors.filter(h => /champion/i.test(h.label || '')).length, 'official + computed'),
        stat('AWARDS', honors.length, 'cabinet')
      ]) + `<div class="detail-grid">${sportBlock('football', Object.assign({}, f, t ? { goals: t.gf, matches: t.p, average: t.p ? (t.gf / t.p).toFixed(2) : '—' } : f))}${sportBlock('futsal', fu)}${sportBlock('cricsal', cr)}${cabinetBox(d, 'club', c.nickname)}<div class="box"><header><div><small>SQUAD REGISTRY</small><h2>${players.length} PLAYERS</h2></div></header>${players.map(p => `<a class="mini-link" href="player.html?id=${encodeURIComponent(p.nickname)}"><b>${escPage(p.nickname)}</b>${escPage(p.name)} · ${sumSport(playerStats(d, p.nickname), 'ball', 'primary')} GOALS · ${sumSport(playerStats(d, p.nickname), 'cricsal', 'primary')} RUNS</a>`).join('') || empty('No registered players.')}</div></div>`;
    }
    if (type === 'awards') {
      const host = $('#directory');
      const wanted = q.get('sector') || 'ALL';
      const chips = document.getElementById('sector-chips');
      if (chips) chips.innerHTML = [{ nickname: 'ALL', name: 'ALL SECTORS' }].concat(d.sectors).map(s => `<a class="chip${s.nickname === wanted ? ' active' : ''}" href="awards.html${s.nickname === 'ALL' ? '' : '?sector=' + encodeURIComponent(s.nickname)}">${escPage(s.nickname === 'ALL' ? 'ALL SECTORS' : s.nickname)}</a>`).join('');
      if (typeof CASPER_AWARDS !== 'undefined' && CASPER_AWARDS.render) CASPER_AWARDS.render(host, d, wanted);
      const official = ((d.officialAwards && d.officialAwards.awards) || []);
      const playerCabinet = d.players.map(p => ({ p: p, rows: honorsOf(d, 'player', p.nickname) })).filter(x => x.rows.length);
      const clubCabinet = d.clubs.map(c => ({ c: c, rows: honorsOf(d, 'club', c.nickname) })).filter(x => x.rows.length);
      if (host) host.insertAdjacentHTML('beforeend', `<section class="box" style="margin-top:10px"><header><div><small>PLAYER CABINETS</small><h2>${playerCabinet.length} PLAYERS WITH HONORS</h2></div></header>${playerCabinet.map(x => `<a class="list-row" href="player.html?id=${encodeURIComponent(x.p.nickname)}"><b>${escPage(x.p.nickname)}</b><strong>${escPage(x.p.name)}</strong><span>${escPage(x.rows.map(r => r.label).join(' · '))}</span><small>${x.rows.length} AWARDS</small></a>`).join('') || empty('No player honors yet.')}</section><section class="box" style="margin-top:10px"><header><div><small>CLUB CABINETS</small><h2>${clubCabinet.length} CLUBS WITH HONORS</h2></div></header>${clubCabinet.map(x => `<a class="list-row" href="club.html?id=${encodeURIComponent(x.c.nickname)}"><b>${escPage(x.c.nickname)}</b><strong>${escPage(x.c.name)}</strong><span>${escPage(x.rows.map(r => r.label).join(' · '))}</span><small>${x.rows.length} AWARDS</small></a>`).join('') || empty('No club honors yet.')}</section><section class="box" style="margin-top:10px"><header><div><small>OFFICIAL LIST</small><h2>${official.length} RECORDED AWARDS</h2></div><span>awards.json</span></header>${official.map(a => `<div class="list-row"><b>${escPage(pageSport(a.sport))}</b><strong>${escPage(a.award)}</strong><span>${escPage(a.name)} · ${escPage(a.competition)}</span><small>${escPage(a.winnerName || a.winner)}</small></div>`).join('') || empty('No official awards file.')}</section>`);
    }
    if (type === 'sectors') {
      const host = $('#directory'); if (!host) throw new Error('Missing #directory');
      const n = d.network;
      host.innerHTML = renderStatStrip([stat('SECTORS', n.sectors, 'network'), stat('ACTIVE', n.active, 'operating'), stat('CLUBS', n.clubs, 'network'), stat('PLAYERS', n.players, 'network'), stat('COMPETITIONS', n.competitions, 'network'), stat('FOOTBALL GOALS', n.sports.football.goals, 'football'), stat('FUTSAL GOALS', n.sports.futsal.goals, 'futsal'), stat('CRICSAL RUNS', n.sports.cricsal.runs, 'cricsal')]) + `<div class="sector-grid">${d.sectors.map((s, i) => { const x = sectorStats(s); return `<a class="directory-card" href="sector.html?id=${encodeURIComponent(s.nickname)}"><div class="directory-kicker">SECTOR ${String(i + 1).padStart(2, '0')} · ${escPage(s.nickname)}</div><h2>${escPage(s.name)}</h2><p>${escPage(s.description || '')}</p><div class="directory-meta"><b>${x.clubs}<small>CLUBS</small></b><b>${x.players}<small>PLAYERS</small></b><b>${x.competitions}<small>COMPETITIONS</small></b><b>${escPage(s.status).toUpperCase()}<small>STATUS</small></b></div></a>`; }).join('') || empty('No sectors registered.')}</div>`;
    }
    if (type === 'sector') {
      const s = byPage(d.sectors, 'nickname', id) || d.sectors[0];
      const x = sectorStats(s); const sp = x.sports || {};
      setHead(s.name, (s.region || s.nickname) + ' · ' + (s.description || ''));
      $('#directory').innerHTML = renderStatStrip([stat('CLUBS', x.clubs, 'registered'), stat('PLAYERS', x.players, 'registered'), stat('COMPETITIONS', x.competitions, 'registered'), stat('MATCHES', ((d.bySector && d.bySector[s.nickname] && d.bySector[s.nickname].results) || []).length, 'archive'), stat('FOOTBALL GOALS', (sp.football && sp.football.goals) || 0, 'football only'), stat('FUTSAL GOALS', (sp.futsal && sp.futsal.goals) || 0, 'futsal only'), stat('CRICSAL RUNS', (sp.cricsal && sp.cricsal.runs) || 0, 'cricsal only'), stat('CRICSAL WICKETS', (sp.cricsal && sp.cricsal.wickets) || 0, 'cricsal only')]) + `<div class="detail-grid">${sportBlock('football', sp.football)}${sportBlock('futsal', sp.futsal)}${sportBlock('cricsal', sp.cricsal)}<div class="box"><header><div><small>REGISTRY</small><h2>ENTITIES</h2></div></header>${d.clubs.filter(c => keyPage(c.sector) === keyPage(s.nickname)).map(c => `<a class="mini-link" href="club.html?id=${encodeURIComponent(c.nickname)}"><b>${escPage(c.nickname)}</b>${escPage(c.name)}</a>`).join('')}${d.players.filter(p => playerSectors(p).some(sx => keyPage(sx) === keyPage(s.nickname))).map(p => `<a class="mini-link" href="player.html?id=${encodeURIComponent(p.nickname)}"><b>${escPage(p.nickname)}</b>${escPage(p.name)}</a>`).join('') || empty('No entities registered in this sector.')}</div></div>`;
    }
    if (type === 'competitions') {
      let rows = d.competitions.slice();
      const host = $('#directory'); if (!host) throw new Error('Missing #directory');
      const render = () => {
        host.innerHTML = renderStatStrip([stat('COMPETITIONS', rows.length, 'registry'), stat('FOOTBALL', d.competitions.filter(c => c.sport === 'football').length, 'competitions'), stat('FUTSAL', d.competitions.filter(c => c.sport === 'futsal').length, 'competitions'), stat('CRICSAL', d.competitions.filter(c => c.sport === 'cricsal').length, 'competitions'), stat('ACTIVE', d.competitions.filter(c => c.status === 'active').length, 'status'), stat('LIVE', d.competitions.filter(c => c.status === 'live').length, 'status'), stat('SECTORS', new Set(d.competitions.map(c => c.sector)).size, 'represented'), stat('SEASONS', new Set(d.competitions.map(c => c.season)).size, 'represented')]) + `<div class="directory">${rows.map(c => { const r = linkedResults(d, c); const s = entityStats(c.sport, r); const total = c.sport === 'cricsal' ? s.runs : s.goals; return `<a class="list-row" href="competition.html?id=${encodeURIComponent(c.nickname)}"><b>${CIcon[c.sport] || ''} ${escPage(c.nickname)}</b><strong>${escPage(c.name)}</strong><span>${escPage(c.sector)} · ${pageSport(c.sport)}</span><small>${r.length ? (total + ' · ' + r.length + ' MATCHES') : 'NO MATCH DATA'}</small></a>`; }).join('') || empty('No competitions registered.')}</div>`;
      };
      render();
      $('#filter') && $('#filter').addEventListener('input', e => { const v = keyPage(e.target.value); rows = d.competitions.filter(c => keyPage(c.name + ' ' + c.nickname + ' ' + c.sector + ' ' + c.sport).includes(v)); render(); });
    }
    if (type === 'competition') {
      const c = byPage(d.competitions, 'nickname', id) || d.competitions[0];
      const rows = linkedResults(d, c);
      const s = entityStats(c.sport, rows);
      const participants = new Set(rows.flatMap(r => [r.home, r.away]));
      setHead(c.name, c.nickname + ' · ' + (c.sector || '—') + ' · ' + pageSport(c.sport));
      $('#directory').innerHTML = `<div class="competition-shell">${renderStatStrip([stat('SPORT', pageSport(c.sport), 'competition'), stat('MATCHES', rows.length, 'recorded'), stat(c.sport === 'cricsal' ? 'RUNS' : 'GOALS', c.sport === 'cricsal' ? s.runs : s.goals, 'competition total'), stat('AVERAGE', s.average, 'per match'), stat('PARTICIPANTS', participants.size, 'clubs')])}<div class="detail-grid"><div class="box"><header><div><small>COMPETITION PROFILE</small><h2>METADATA</h2></div></header><div class="record-list">${stat('GENERAL ID', c.nickname, 'identity')}${stat('SECTOR', c.sector || '—', 'registry')}${stat('SEASON', c.season || '—', 'registry')}${stat('TYPE', c.type || '—', 'format')}${stat('STATUS', c.status || '—', 'state')}</div></div><div class="box"><header><div><small>PARTICIPANTS</small><h2>${participants.size}</h2></div></header>${Array.from(participants).map(pid => { const x = byPage(d.clubs, 'nickname', pid); return `<a class="mini-link" href="club.html?id=${encodeURIComponent(pid)}"><b>${escPage(pid)}</b>${escPage((x && x.name) || pid)}</a>`; }).join('') || empty('No participants recorded.')}</div><div class="box"><header><div><small>RESULTS</small><h2>MATCH CENTRE</h2></div></header>${rows.map(r => `<div class="result"><small>${escPage(r.round)}<br>${escPage(r.status)}</small><strong>${escPage(r.home)}<br>${escPage(r.away)}</strong><b>${escPage(r.score)}</b><small>${escPage(r.duration || '')}</small><em>${CIcon[r.sport] || ''}</em></div>`).join('') || empty('No recorded matches.')}</div></div></div>`;
    }
  } catch (e) {
    console.error(e);
    const main = document.querySelector('main');
    if (main) main.insertAdjacentHTML('afterbegin', `<div class="data-error">CASPER DATA ERROR · ${escPage(e.message)}</div>`);
  }
})();
