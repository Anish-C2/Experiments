CASPER_CSN.extractParen = function(doc, name) {
  const hit = String(doc || '').match(new RegExp('\\b' + name + '\\s*\\(', 'i'));
  if (!hit) return '';
  let i = hit.index + hit[0].length, depth = 1, out = '';
  const src = String(doc);
  for (; i < src.length && depth; i++) {
    const ch = src[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') { depth -= 1; if (!depth) break; }
    out += ch;
  }
  return out;
};

CASPER_CSN.parseDate = function(raw) {
  const t = String(raw || '').replace(/\D/g, '');
  if (t.length !== 8) return 0;
  return Date.UTC(Number(t.slice(4)), Number(t.slice(2, 4)) - 1, Number(t.slice(0, 2)));
};

CASPER_CSN.parseSeason = function(text, fileMeta, errors) {
  const parsed = CASPER_CSN.parse(text, fileMeta, errors || []);
  const docs = String(text || '').replace(/\r/g, '').split(/\[\s*(?=id\s*=)/i).slice(1);
  const competitions = docs.map(doc => {
    const field = k => {
      const m = doc.match(new RegExp('(?:^|[\\n;])\\s*' + k + '\\s*=\\s*([^;\\n]+)', 'i'));
      return m ? m[1].trim() : '';
    };
    const awards = {};
    String(CASPER_CSN.extractParen(doc, 'aw') || '').split(/[\n;]+/).forEach(line => {
      const kv = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
      if (kv) awards[kv[1].toLowerCase()] = kv[2].trim();
    });
    const captains = {};
    String(CASPER_CSN.extractParen(doc, 'n') || '').split(/[\n,]+/).forEach(line => {
      const m = line.trim().match(/^([A-Za-z0-9]{2,6})\s*=\s*([^\[\]]+)(?:\[([^\]]+)\])?/);
      if (m) captains[m[1].toLowerCase()] = { club: m[1], name: m[2].trim(), player: (m[3] || '').trim() };
    });
    return {
      id: field('id'),
      name: field('e'),
      season: field('s') || fileMeta.season || '2026A',
      sport: fileMeta.sport,
      sector: fileMeta.sector,
      dos: field('dos'),
      doc: field('doc'),
      status: field('sts'),
      type: field('typ'),
      sort: Math.max(CASPER_CSN.parseDate(field('doc')), CASPER_CSN.parseDate(field('dos'))),
      awards,
      captains,
      path: fileMeta.path
    };
  }).filter(c => c.id && c.type !== 'seasonal' && !/^seasonal/i.test(c.name || ''));
  parsed.competitions = competitions;
  return parsed;
};
