const $ = s => document.querySelector(s);
const icon = { football: '⚽', futsal: '🧥', cricsal: '🏏' };
const sportLabel = s => s === 'cricsal' ? 'CRICSAL' : String(s || '').toUpperCase();

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }
function setText(sel, text) { const el = $(sel); if (el) el.textContent = text; }

function sportLine(sport, block) {
  if (!block) return 'NO MATCHES YET';
  if (sport === 'cricsal') {
    return block.matches ? `${block.matches} MATCHES · ${Number(block.average).toFixed(2)} RUN AVG` : 'NO MATCHES YET';
  }
  return block.matches ? `${block.matches} MATCHES · ${Number(block.average).toFixed(2)} AVG` : 'NO MATCHES YET';
}

function renderMast(scope) {
  setText('.mast-grid span:nth-child(1) strong', String(scope.counts.sectors).padStart(2, '0'));
  setText('.mast-grid span:nth-child(2) strong', String(scope.counts.active).padStart(2, '0'));
  setText('.mast-grid span:nth-child(3) strong', fmt(scope.counts.clubs));
  setText('.mast-grid span:nth-child(4) strong', fmt(scope.counts.players));
}

function renderStats(scope) {
  const s = scope.sports;
  const n = scope.counts;
  const values = [
    ['SECTORS', n.sectors, scope.id === 'ALL' ? 'REGISTRY' : scope.id],
    ['COMPETITIONS', n.competitions, 'SECTOR SCOPE'],
    ['CLUBS', n.clubs, 'REGISTRY'],
    ['PLAYERS', n.players, 'REGISTRY'],
    ['FOOTBALL GOALS', s.football.goals, `${Number(s.football.average).toFixed(2)} / MATCH`],
    ['FUTSAL GOALS', s.futsal.goals, `${Number(s.futsal.average).toFixed(2)} / MATCH`],
    ['CRICSAL RUNS', s.cricsal.runs, `${Number(s.cricsal.average).toFixed(2)} / MATCH`],
    ['CRICSAL WICKETS', s.cricsal.wickets, `${s.cricsal.matches || 0} MATCHES`]
  ];
  const box = $('.stats');
  if (box) box.innerHTML = values.map(x => `<div><small>${x[0]}</small><strong>${fmt(x[1])}</strong><span>${esc(x[2])}</span></div>`).join('');
}

function renderSectors(model, scope) {
  const host = $('#sectors');
  if (!host) return;
  const list = scope.id === 'ALL' ? model.sectors : scope.sectors;
  host.innerHTML = list.map((s, i) => {
    const pack = model.bySector[s.nickname] || {};
    const sports = pack.sports || {};
    return `<article class="sector-card"><header><div><small>SECTOR ${String(i + 1).padStart(2, '0')} · ${esc(s.nickname)}</small><h2><a href="sector.html?id=${encodeURIComponent(s.nickname)}">${esc(s.name)}</a></h2><p>${esc(s.description)}</p></div><b class="live">${esc(s.status).toUpperCase()}</b></header><div class="sector-meta"><span><small>REGION</small><strong>${esc(s.region)}</strong></span><span><small>CLUBS</small><strong>${pack.clubs ?? 0}</strong></span><span><small>PLAYERS</small><strong>${pack.players ?? 0}</strong></span><span><small>COMPETITIONS</small><strong>${pack.competitions ?? 0}</strong></span></div><div class="sport-split">${['football', 'futsal', 'cricsal'].map(sport => { const x = sports[sport] || {}; return `<div><b>${icon[sport]} ${sportLabel(sport)}</b><strong>${sport === 'cricsal' ? `${fmt(x.runs)} RUNS · ${x.wickets || 0} W` : `${fmt(x.goals)} GOALS`}</strong><span>${sportLine(sport, x)}</span></div>`; }).join('')}</div></article>`;
  }).join('') || '<div class="empty-state">No sectors in this scope.</div>';
}

function renderClubs(model, scope) {
  const host = $('#club-table');
  if (!host) return;
  const rows = scope.clubTable;
  host.innerHTML = `<div class="club-head"><span>#</span><span>CLUB</span><span>SEC</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GF</span><span>GA</span><span>GD</span><span>ELO</span><span>WR</span><span>FORM</span></div>` +
    (rows.map(c => {
      const club = model.get('club', c.club);
      const gd = Number(c.gd || 0);
      return `<a class="club-row" href="club.html?id=${encodeURIComponent(c.club)}"><b>${c.rank ?? '—'}</b><strong>${esc(club?.name || c.club)}</strong><span>${esc(club?.sector || c.sector || '—')}</span><span>${c.p ?? '—'}</span><span>${c.w ?? '—'}</span><span>${c.d ?? '—'}</span><span>${c.l ?? '—'}</span><span>${c.gf ?? '—'}</span><span>${c.ga ?? '—'}</span><span>${gd > 0 ? '+' : ''}${gd}</span><span>${c.elo ?? '—'}</span><span>${esc(c.wr || '—')}</span><span class="form">${esc(c.form || '—')}</span></a>`;
    }).join('') || '<div class="empty-state">No sector table rows in this scope.</div>');
}

function renderPlayers(model, scope) {
  const host = $('#players-list');
  if (!host) return;
  host.innerHTML = `<div class="player-head"><span>#</span><span>PLAYER</span><span>SEC</span><span>G/R</span><span>AST/W</span><span>APP</span><span>YC/W</span></div>` +
    (scope.playerStats.map((p, i) => {
      const x = model.get('player', p.player);
      const label = p.sport === 'cricsal' ? 'CRICSAL RUNS' : `${sportLabel(p.sport)} GOALS`;
      return `<a class="player-row" href="player.html?id=${encodeURIComponent(p.player)}"><b>${String(i + 1).padStart(2, '0')}</b><div><strong>${esc(x?.name || p.player)}</strong><small>${esc(p.club)} · ${label}</small></div><span>${esc(x?.sector || p.sector || '—')}</span><span>${p.primary ?? '—'}</span><span>${p.secondary ?? '—'}</span><span>${p.apps ?? '—'}</span><span>${p.discipline ?? '—'}</span></a>`;
    }).join('') || '<div class="empty-state">No player production rows in this scope.</div>');
}

function renderResults(model, scope) {
  const host = $('#results-list');
  if (!host) return;
  host.innerHTML = scope.results.map(r => {
    const home = model.get('club', r.home);
    const away = model.get('club', r.away);
    return `<a class="result" href="matches.html?sector=${encodeURIComponent(scope.id === 'ALL' ? '' : scope.id)}"><small>${esc(r.status)}<br>${esc(r.competition)} · ${esc(r.round)}</small><strong>${esc(home?.name || r.home)}<br>${esc(away?.name || r.away)}</strong><b>${esc(r.score)}</b><small>${esc(r.duration)}</small><em>${icon[r.sport] || ''}</em></a>`;
  }).join('') || '<div class="empty-state">No results in this scope.</div>';
}

function renderCompetitions(model, scope) {
  const host = $('#competition-list');
  if (!host) return;
  const count = $('#competition-count');
  if (count) count.textContent = `${scope.competitions.length} REGISTERED`;
  host.innerHTML = scope.competitions.map(c => {
    const linked = scope.results.filter(r => String(r.competition) === c.nickname).length;
    return `<a class="comp-row" href="competition.html?id=${encodeURIComponent(c.nickname)}"><b>${esc(c.nickname)}</b><div><strong>${esc(c.name)}</strong><small>${esc(c.sector)} · ${sportLabel(c.sport)} · ${esc(c.status).toUpperCase()}</small></div><span>${linked}</span><span>${esc(c.season)}</span><span>${esc(c.type).toUpperCase()}</span></a>`;
  }).join('') || '<div class="empty-state">No competitions in this scope.</div>';
}

function renderRecords(scope) {
  const host = $('#record-list');
  if (host) host.innerHTML = scope.records.map(r => `<div><small>${esc(r.label)}</small><b>${esc(r.value)}</b><span>${esc(r.note || scope.label)}</span></div>`).join('') || '<div class="empty-state">No records in this scope.</div>';
  const form = $('#form-list');
  if (form) form.innerHTML = scope.form.map(x => `<div><b>${esc(x.sector)}</b><strong>${esc(x.form)}</strong><span>FOOTBALL · ${Number(x.average || 0).toFixed(2)} GF/M</span></div>`).join('') || '<div class="empty-state">No form rows.</div>';
}

function renderSwitcher(model, active) {
  const host = $('#sector-switch');
  if (!host) return;
  const items = [{ id: 'ALL', name: 'ALL SECTORS' }, ...model.sectors.map(s => ({ id: s.nickname, name: s.nickname }))];
  host.innerHTML = items.map(s => `<button type="button" class="chip${s.id === active ? ' active' : ''}" data-sector="${esc(s.id)}">${esc(s.name)}</button>`).join('');
}

function renderHealth(model) {
  document.querySelector('.data-health')?.remove();
  const el = document.createElement('div');
  el.className = 'data-health';
  el.textContent = model.ok ? (model.mock ? 'DATA PIPELINE · VALID · MOCK' : 'DATA PIPELINE · VALID') : `DATA PIPELINE · ${model.errors.length} ERRORS`;
  el.title = [...model.errors, ...model.warnings].join('\n') || 'All registry references passed validation';
  document.body.appendChild(el);
}

function currentSector() {
  return new URLSearchParams(location.search).get('sector') || 'ALL';
}

function renderAll(model) {
  const requested = currentSector();
  const scope = model.scope(requested) || model.scope('ALL');
  renderSwitcher(model, scope.id);
  renderMast(scope);
  renderStats(scope);
  renderSectors(model, scope);
  renderClubs(model, scope);
  renderPlayers(model, scope);
  renderResults(model, scope);
  renderCompetitions(model, scope);
  renderRecords(scope);
  const ticker = $('#ticker-copy');
  if (ticker) ticker.textContent = model.sectors.map(s => `${s.nickname} ${s.name.toUpperCase()}`).join(' · ');
}

(async () => {
  try {
    const model = await CASPER_DATA.load();
    renderHealth(model);
    renderAll(model);
    $('#sector-switch')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-sector]');
      if (!btn) return;
      const sector = btn.dataset.sector;
      const url = new URL(location.href);
      if (!sector || sector === 'ALL') url.searchParams.delete('sector');
      else url.searchParams.set('sector', sector);
      history.replaceState({}, '', url);
      renderAll(model);
    });
    if (!model.ok) console.error('CASPER data validation errors', model.errors);
  } catch (e) {
    console.error(e);
    const host = $('#top');
    if (host) host.insertAdjacentHTML('afterbegin', `<div class="data-error">CASPER DATA ERROR · ${esc(e.message)}</div>`);
  }
})();
