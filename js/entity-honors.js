(function () {
  const key = v => String(v || '').trim().toLowerCase();
  const LABEL = { ch: 'Champion', ru: 'Runner-up', '3p': 'Third Place', gb: 'Golden Boot', bd: 'Best Defence', gk: 'Best Goalkeeper', pot: 'Player of the Tournament', gg: 'Golden Glove', sg: 'Golden Strike' };
  function awardLabel(code) {
    const raw = String(code || '').trim();
    return LABEL[raw.toLowerCase()] || raw.replace(/[_-]+/g, ' ');
  }
  function flatten(model) {
    if (model && Array.isArray(model.csnAwards) && model.csnAwards.length) return model.csnAwards;
    const rows = [];
    const seen = new Set();
    const push = a => {
      const stamp = key((a.competition || '') + '|' + (a.award || '') + '|' + (a.winner || ''));
      if (!a.winner || seen.has(stamp)) return;
      seen.add(stamp);
      rows.push(a);
    };
    ((model && model.seasonCompetitions) || []).forEach(c => {
      Object.keys(c.awards || {}).forEach(code => {
        push({
          competition: c.id || c.nickname,
          name: c.name || c.id,
          sport: c.sport,
          sector: c.sector,
          season: c.season,
          code: code,
          award: awardLabel(code),
          winner: String(c.awards[code] || '').trim(),
          seasonal: c.type === 'seasonal'
        });
      });
    });
    return rows;
  }
  function forEntity(model, kind, id) {
    const kid = key(id);
    if (!kid || !model) return [];
    return flatten(model).filter(a => {
      if (key(a.winner) !== kid) return false;
      const isPlayer = !!(model.get && model.get('player', a.winner));
      const isClub = !!(model.get && model.get('club', a.winner));
      if (kind === 'player') return isPlayer;
      if (kind === 'club') return isClub;
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
    const nameOf = id => {
      const p = model.get && model.get('player', id);
      const c = model.get && model.get('club', id);
      return (p && p.name) || (c && c.name) || id;
    };
    host.innerHTML = `<section class="box"><header><div><small>CSN aw()</small><h2>${rows.length} OFFICIAL AWARDS</h2></div><span>NO AUTO HONORS</span></header>${rows.map(a => `<div class="list-row"><b>${esc(String(a.sport || '').toUpperCase())}</b><strong>${esc(a.award)}</strong><span>${esc(a.name || a.competition || '')} \u00b7 ${esc(a.sector || '')}</span><small>${esc(nameOf(a.winner))}</small></div>`).join('') || '<div class="empty-state">No aw() blocks in the loaded CSN files.</div>'}</section>`;
  }
  window.CASPER_AWARDS = window.CASPER_AWARDS || {};
  CASPER_AWARDS.forEntity = forEntity;
  CASPER_AWARDS.fromCsn = flatten;
  CASPER_AWARDS.render = render;
  CASPER_AWARDS.enhance = async function (model) {
    model.csnAwards = flatten(model);
    if (model.network) model.network.records = model.csnAwards.map(a => ({ label: a.award, value: a.winner, note: [a.name, a.sport, a.sector].filter(Boolean).join(' \u00b7 ') }));
    return model;
  };
  if (window.CASPER_DATA && CASPER_DATA.load) {
    const orig = CASPER_DATA.load.bind(CASPER_DATA);
    CASPER_DATA.load = async function () {
      const model = await orig();
      model.csnAwards = flatten(model);
      return model;
    };
  }
})();
