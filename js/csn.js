const CASPER_CSN = (() => {
  const key = v => String(v || '').trim().toLowerCase();

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
    return { runs, wickets };
  }

  function parseScorePair(raw) {
    const m = String(raw || '').match(/^(\d+)\s*[-\u2013]\s*(\d+)$/);
    return m ? { home: Number(m[1]), away: Number(m[2]) } : null;
  }

  function parseCreditList(raw) {
    const out = [];
    for (const part of String(raw || '').split('+').map(x => x.trim()).filter(Boolean)) {
      const m = part.match(/^([A-Za-z][A-Za-z0-9'-]{1,19})(?:\*(\d+))?$/);
      if (!m) continue;
      out.push({ player: m[1], n: Number(m[2] || 1) });
    }
    return out;
  }

  function parseEventBag(raw) {
    const bag = { goals: [], assists: [] };
    if (!raw) return bag;
    for (const chunk of String(raw).split(',').map(x => x.trim()).filter(Boolean)) {
      const kv = chunk.match(/^([A-Za-z]+)=(.*)$/);
      if (!kv) continue;
      const code = kv[1].toLowerCase();
      const credits = parseCreditList(kv[2]);
      if (code === 'gh' || code === 'ga' || code === 'og') {
        for (const c of credits) bag.goals.push({ ...c, side: code === 'ga' ? 'away' : 'home' });
      } else if (code === 'ah' || code === 'aa') {
        for (const c of credits) bag.assists.push({ ...c, side: code === 'aa' ? 'away' : 'home' });
      }
    }
    return bag;
  }

  function extractNamedParen(doc, name) {
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
  }

  function parseMatchLine(line, ctx, errors) {
    const raw = String(line || '').trim().replace(/;+\s*$/, '');
    if (!raw || raw.startsWith('#')) return null;

    const cricketBox = raw.match(/^([A-Za-z0-9]{2,6})-([A-Za-z0-9]{2,6}):\[([^\]]*)\]-\[([^\]]*)\](?:\{([^}]*)\})?(?:#([A-Za-z0-9]+))?$/);
    if (cricketBox) {
      const homeIn = parseInnings(cricketBox[3]);
      const awayIn = parseInnings(cricketBox[4]);
      return {
        id: ctx.id, source: ctx.path, sector: ctx.sector, season: ctx.season, competition: ctx.competition,
        sport: 'cricsal', home: cricketBox[1], away: cricketBox[2],
        score: homeIn.runs + '\u2013' + awayIn.runs, homeScore: homeIn.runs, awayScore: awayIn.runs,
        round: cricketBox[6] || 'MD', duration: '12b', status: 'FT',
        runs: homeIn.runs + awayIn.runs, wickets: homeIn.wickets + awayIn.wickets, events: cricketBox[5] || ''
      };
    }

    const cricketSlash = raw.match(/^([A-Za-z0-9]{2,6})-([A-Za-z0-9]{2,6}):(\d+)\/(\d+)(?:\([^)]*\))?-(\d+)\/(\d+)(?:\([^)]*\))?(?:\(([^)]*)\))?(?:#([A-Za-z0-9]+))?$/);
    if (cricketSlash) {
      const hr = Number(cricketSlash[3]), hw = Number(cricketSlash[4]);
      const ar = Number(cricketSlash[5]), aw = Number(cricketSlash[6]);
      return {
        id: ctx.id, source: ctx.path, sector: ctx.sector, season: ctx.season, competition: ctx.competition,
        sport: 'cricsal', home: cricketSlash[1], away: cricketSlash[2],
        score: hr + '\u2013' + ar, homeScore: hr, awayScore: ar,
        round: cricketSlash[8] || 'MD', duration: '1ov', status: 'FT',
        runs: hr + ar, wickets: hw + aw, events: cricketSlash[7] || ''
      };
    }

    const goals = raw.match(/^([A-Za-z0-9]{2,6})-([A-Za-z0-9]{2,6}):(\d+)\s*[-\u2013]\s*(\d+)(?:\(([^)]*)\))?(?:#([A-Za-z0-9]+))?(?:\{([^}]*)\})?(?:\(([^)]*)\))?$/);
    if (goals) {
      const sport = ctx.sport === 'futsal' ? 'futsal' : 'football';
      const note = goals[5] || '';
      const extra = goals[8] || '';
      const dur = (extra.match(/dur=(\d+)/) || [])[1];
      return {
        id: ctx.id, source: ctx.path, sector: ctx.sector, season: ctx.season, competition: ctx.competition,
        sport, home: goals[1], away: goals[2],
        score: goals[3] + '\u2013' + goals[4], homeScore: Number(goals[3]), awayScore: Number(goals[4]),
        round: goals[6] || 'MD', duration: dur ? dur + '\u2032' : (sport === 'futsal' ? '40\u2032' : '90\u2032'),
        status: 'FT', events: goals[7] || '', note, credits: parseEventBag(note)
      };
    }

    errors.push(ctx.path + ': could not parse CSN match ' + (ctx.id || raw));
    return null;
  }

  function parse(text, fileMeta, errors) {
    const meta = Object.assign({}, fileMeta, headerMeta(text));
    const matches = [];
    const body = String(text || '').replace(/\r/g, '');
    const docs = body.split(/\[\s*(?=id\s*=)/i).slice(1);
    docs.forEach((doc, i) => {
      const competition = (doc.match(/^id\s*=\s*([A-Za-z0-9_-]+)/i) || [])[1] || fileMeta.competition || '';
      const mBody = extractNamedParen(doc, 'm');
      if (!mBody) return;
      const lines = mBody.split(/[\n;]+/).map(x => x.trim()).filter(x => x && !x.startsWith('#'));
      lines.forEach((line, j) => {
        const row = parseMatchLine(line, {
          sport: key(meta.sport || fileMeta.sport),
          sector: meta.sector || fileMeta.sector,
          season: meta.season || fileMeta.season,
          competition,
          path: fileMeta.path,
          id: (competition || 'm') + '-' + (i + 1) + '-' + (j + 1)
        }, errors);
        if (row) matches.push(row);
      });
    });
    return { meta, matches };
  }

  return { parse, parseScorePair };
})();
