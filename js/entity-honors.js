(function () {
  if (typeof CASPER_AWARDS === 'undefined') return;
  const key = v => String(v || '').trim().toLowerCase();
  const asList = v => Array.isArray(v) ? v.filter(Boolean).map(String) : (v == null || v === '' ? [] : [String(v)]);
  CASPER_AWARDS.forEntity = function (model, kind, id) {
    const rows = [];
    const kid = key(id);
    if (!kid || !model) return rows;
    const seen = new Set();
    const push = row => {
      const stamp = key((row.source || '') + '|' + (row.label || '') + '|' + (row.note || ''));
      if (seen.has(stamp)) return;
      seen.add(stamp);
      rows.push(row);
    };
    (((model.officialAwards && model.officialAwards.awards) || [])).forEach(a => {
      const winner = key(a.winner);
      const nameParts = String(a.winnerName || '').split(/[\/,|]+/).map(s => key(s.trim())).filter(Boolean);
      const isClub = !!(model.get && model.get('club', a.winner));
      const isPlayer = !!(model.get && model.get('player', a.winner));
      const note = [a.name, a.sport, a.competition].filter(Boolean).join(' \u00b7 ');
      if (kind === 'club' && isClub && winner === kid) push({ source: 'official', label: a.award, award: a.award, note: note });
      if (kind === 'player' && ((isPlayer && winner === kid) || nameParts.includes(kid))) push({ source: 'official', label: a.award, award: a.award, note: note });
    });
    const honors = model.honors;
    if (!honors) return rows;
    const hit = honor => honor && key(honor.id) === kid && (!honor.kind || honor.kind === kind);
    (honors.sectors || []).forEach(s => {
      if (kind === 'club' && s.sweep && key(s.sweep.id) === kid) push({ source: 'computed', label: s.name + ' Golden Sweep', note: s.season || '' });
      if (hit(s.attacker)) push({ source: 'computed', label: s.name + ' Golden Attacker', note: s.season || '' });
      if (hit(s.defence)) push({ source: 'computed', label: s.name + ' Golden Defense', note: s.season || '' });
      Object.keys(s.bySport || {}).forEach(sport => {
        const h = s.bySport[sport] || {};
        if (kind === 'club' && h.prestige && key(h.prestige.champion) === kid) push({ source: 'computed', label: String(sport).toUpperCase() + ' champion', note: ((h.prestige && h.prestige.name) || sport) + ' \u00b7 ' + s.sector });
        if (hit(h.topScorer)) push({ source: 'computed', label: String(sport).toUpperCase() + ' top scorer', note: s.sector });
        if (kind === 'club' && h.bestDefence && key(h.bestDefence.id) === kid) push({ source: 'computed', label: String(sport).toUpperCase() + ' best defence', note: s.sector });
        if (kind === 'club' && h.bestGk && key(h.bestGk.id) === kid) push({ source: 'computed', label: String(sport).toUpperCase() + ' best goalkeeper', note: s.sector });
      });
    });
    Object.keys(honors.tsars || {}).forEach(sport => {
      const t = honors.tsars[sport];
      if (t && key(t.id) === kid) push({ source: 'computed', label: 'CASPER ' + sport + ' Tsar', note: honors.season || '' });
    });
    if (kind === 'club' && honors.bestClub && key(honors.bestClub.id) === kid) push({ source: 'computed', label: 'CASPER Best Club', note: honors.season || '' });
    const dec = honors.decadian || {};
    (dec.grandSlam || []).forEach(x => { if (key(x.id) === kid) push({ source: 'computed', label: 'CASPER Grand Slam', note: asList(x.sectors).join(', ') }); });
    (dec.radioactiveBoot || []).forEach(x => { if (key(x.id) === kid) push({ source: 'computed', label: 'CASPER Radioactive Boot', note: asList(x.sectors).join(', ') }); });
    (dec.radioactiveShield || []).forEach(x => { if (key(x.id) === kid) push({ source: 'computed', label: 'CASPER Radioactive Shield', note: asList(x.sectors).join(', ') }); });
    return rows;
  };
})();
