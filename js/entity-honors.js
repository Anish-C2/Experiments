(function () {
  const key = v => String(v || '').trim().toLowerCase();
  const LABEL = { ch: 'Champion', ru: 'Runner-up', '3p': 'Third Place', gb: 'Golden Boot', bd: 'Best Defence', gk: 'Best Goalkeeper', pot: 'Player of the Tournament', gg: 'Golden Glove', sg: 'Golden Strike', tr: 'Top Runs', tw: 'Top Wickets' };

  function awardLabel(code) {
    const raw = String(code || '').trim();
    const hit = LABEL[raw.toLowerCase()];
    if (hit) return hit;
    return raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function resolve(model, raw) {
    const id = String(raw || '').trim();
    if (!id || !model) return { id, kind: '', name: id };
    const kid = key(id);
    const player = model.get && model.get('player', id);
    if (player) return { id: player.nickname || id, kind: 'player', name: player.name || player.nickname || id };
    const club = model.get && model.get('club', id);
    if (club) return { id: club.nickname || id, kind: 'club', name: club.name || club.nickname || id };
    const players = (model.players || []);
    const clubs = (model.clubs || []);
    const pName = players.find(p => key(p.name) === kid || key(p.nickname) === kid);
    if (pName) return { id: pName.nickname || id, kind: 'player', name: pName.name || pName.nickname || id };
    const cName = clubs.find(c => key(c.name) === kid || key(c.nickname) === kid);
    if (cName) return { id: cName.nickname || id, kind: 'club', name: cName.name || cName.nickname || id };
    return { id, kind: '', name: id };
  }

  function flatten(model) {
    const rows = [];
    const seen = new Set();
    const comps = []
      .concat((model && model.seasonCompetitions) || [])
      .concat((model && model.ledger && model.ledger.competitions) || []);
    comps.forEach(c => {
      Object.keys(c.awards || {}).forEach(code => {
        const winnerRaw = String(c.awards[code] || '').trim();
        if (!winnerRaw) return;
        const resolved = resolve(model, winnerRaw);
        const stamp = key((c.id || c.nickname || '') + '|' + code + '|' + resolved.id);
        if (seen.has(stamp)) return;
        seen.add(stamp);
        rows.push({
          competition: c.id || c.nickname,
          name: c.name || c.id,
          sport: c.sport,
          sector: c.sector,
          season: c.season,
          code: code,
          award: awardLabel(code),
          winner: resolved.id,
          winnerName: resolved.name,
          winnerKind: resolved.kind,
          seasonal: c.type === 'seasonal' || /^seasonal/i.test(c.name || '')
        });
      });
    });
    return rows;
  }

  function forEntity(model, kind, id) {
    const resolved = resolve(model, id);
    const kid = key(resolved.id);
    if (!kid || !model) return [];
    return flatten(model).filter(a => {
      if (key(a.winner) !== kid) return false;
      if (kind === 'player') return a.winnerKind === 'player' || !a.winnerKind;
      if (kind === 'club') return a.winnerKind === 'club';
      return true;
    }).map(a => ({
      source: a.seasonal ? 'season' : 'csn',
      label: a.award,
      award: a.award,
      note: [a.name, a.sport, a.sector, a.season].filter(Boolean).join(' \u00b7 ')
    }));
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function render(host, model, sectorId) {
    if (!host) return;
    const wanted = !sectorId || sectorId === 'ALL' ? 'ALL' : sectorId;
    const rows = flatten(model).filter(a => wanted === 'ALL' || a.sector === wanted);
    host.innerHTML = `<section class="box"><header><div><small>CSN aw()</small><h2>${rows.length} OFFICIAL AWARDS</h2></div><span>NO AUTO HONORS</span></header>${rows.map(a => `<div class="list-row"><b>${esc(String(a.sport || (a.seasonal ? 'season' : '')).toUpperCase())}</b><strong>${esc(a.award)}</strong><span>${esc(a.name || a.competition || '')} \u00b7 ${esc(a.sector || '')}</span><small>${esc(a.winnerName || a.winner)}</small></div>`).join('') || '<div class="empty-state">No aw() blocks in the loaded CSN files.</div>'}</section>`;
  }

  window.CASPER_AWARDS = window.CASPER_AWARDS || {};
  CASPER_AWARDS.forEntity = forEntity;
  CASPER_AWARDS.fromCsn = flatten;
  CASPER_AWARDS.render = render;
  CASPER_AWARDS.enhance = async function (model) {
    model.csnAwards = flatten(model);
    if (model.network) {
      model.network.records = model.csnAwards.map(a => ({
        label: a.award,
        value: a.winnerName || a.winner,
        note: [a.name, a.sport, a.sector].filter(Boolean).join(' \u00b7 ')
      }));
    }
    return model;
  };
})();
