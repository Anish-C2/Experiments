(function () {
  const key = v => String(v || '').trim().toLowerCase();
  function rowsFromCsn(model) {
    return (model && model.csnAwards) || [];
  }
  function forEntity(model, kind, id) {
    const kid = key(id);
    if (!kid || !model) return [];
    const out = [];
    const seen = new Set();
    rowsFromCsn(model).forEach(a => {
      if (key(a.winner) !== kid) return;
      const isPlayer = !!(model.get && model.get('player', a.winner));
      const isClub = !!(model.get && model.get('club', a.winner));
      if (kind === 'player' && !isPlayer) return;
      if (kind === 'club' && !isClub) return;
      const stamp = key((a.competition || '') + '|' + (a.award || '') + '|' + (a.winner || ''));
      if (seen.has(stamp)) return;
      seen.add(stamp);
      out.push({
        source: a.seasonal ? 'season' : 'csn',
        label: a.award,
        award: a.award,
        note: [a.name, a.sport, a.sector, a.season].filter(Boolean).join(' \u00b7 ')
      });
    });
    return out;
  }
  window.CASPER_AWARDS = window.CASPER_AWARDS || {};
  CASPER_AWARDS.forEntity = forEntity;
  CASPER_AWARDS.fromCsn = rowsFromCsn;
})();
