/* CSN parser — Competition Serialization Notation
   Faithful to Anish-C2/CASPER assets/casper-core.js, with safer cricket
   score handling and unknown-field preservation. */
(function (root) {
  'use strict';

  var STAGE = {
    F: 'Final', SF: 'Semi-final', QF: 'Quarter-final',
    R16: 'Round of 16', R32: 'Round of 32', R64: 'Round of 64',
    '3P': 'Third Place', TP: 'Third Place', GS: 'Group Stage',
    FINAL: 'Final', SEMI: 'Semi-final', QUARTER: 'Quarter-final'
  };

  function oversToBalls(ov) {
    if (ov == null || ov === '') return null;
    var s = String(ov).trim();
    if (/^\d+b$/i.test(s)) return parseInt(s, 10);
    var n = Number(s);
    if (!isFinite(n)) return null;
    var whole = Math.floor(n + 1e-9);
    return whole * 6 + Math.round((n - whole) * 10);
  }

  function parseGoalList(s) {
    var out = [];
    if (!s) return out;
    String(s).split('+').forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var m = part.match(/^(.+)\*(\d+)$/);
      if (m) out.push({ name: m[1].trim(), n: parseInt(m[2], 10) });
      else out.push({ name: part, n: 1 });
    });
    return out;
  }

  function parseExtras(extraStr, match) {
    var extras = { et: false, p: null, y: null, r: null, gh: [], ga: [], ah: [], aa: [], unknownExtras: [] };
    if (!extraStr) return extras;
    extraStr.split(',').forEach(function (e) {
      e = e.trim();
      if (!e) return;
      if (e === 'et') extras.et = true;
      else if (/^p\d+-\d+$/.test(e)) {
        var pm = e.match(/p(\d+)-(\d+)/);
        extras.p = [+pm[1], +pm[2]];
      } else if (/^y\d+-\d+$/.test(e)) {
        var ym = e.match(/y(\d+)-(\d+)/);
        extras.y = [+ym[1], +ym[2]];
      } else if (/^r\d+-\d+$/.test(e)) {
        var rm = e.match(/r(\d+)-(\d+)/);
        extras.r = [+rm[1], +rm[2]];
      } else if (e.indexOf('gh=') === 0) extras.gh = parseGoalList(e.slice(3));
      else if (e.indexOf('ga=') === 0) extras.ga = parseGoalList(e.slice(3));
      else if (e.indexOf('ah=') === 0) extras.ah = parseGoalList(e.slice(3));
      else if (e.indexOf('aa=') === 0) extras.aa = parseGoalList(e.slice(3));
      else if (STAGE[e.toUpperCase()]) {
        match.stage = e.toUpperCase();
        match.stageLabel = STAGE[e.toUpperCase()];
      } else extras.unknownExtras.push(e);
    });
    return extras;
  }

  function parseMatch(raw) {
    var work = String(raw || '').trim();
    if (!work) return null;
    var stageFromHash = null;
    var hashM = work.match(/#([A-Za-z0-9]+)\s*$/);
    if (hashM) {
      stageFromHash = hashM[1].toUpperCase();
      work = work.slice(0, hashM.index).trim();
    }

    var match = null;
    var extraStr = null;

    var cric = work.match(/^([A-Za-z0-9]+)-([A-Za-z0-9]+):(\d+)\s*\/\s*(\d+)(?:\(([^)]+)\))?-(\d+)\s*\/\s*(\d+)(?:\(([^)]+)\))?(?:\(([^)]*)\))?$/);
    if (cric) {
      match = {
        kind: 'cricket',
        home: cric[1], away: cric[2],
        sh: +cric[3], hw: +cric[4],
        sa: +cric[6], aw: +cric[7],
        ho: cric[5] || null, ao: cric[8] || null,
        hb: oversToBalls(cric[5]), ab: oversToBalls(cric[8]),
        raw: raw
      };
      extraStr = cric[9] || null;
    } else {
      var goal = work.match(/^([A-Za-z0-9]+)-([A-Za-z0-9]+):(\d+)-(\d+)(?:\((.*)\))?$/);
      if (!goal) return { kind: 'unparsed', raw: raw };
      match = { kind: 'goals', home: goal[1], away: goal[2], sh: +goal[3], sa: +goal[4], raw: raw };
      extraStr = goal[5] || null;
    }

    var extras = parseExtras(extraStr, match);
    Object.assign(match, extras);
    if (!match.stage && stageFromHash) {
      match.stage = stageFromHash;
      match.stageLabel = STAGE[stageFromHash] || stageFromHash;
    }
    return match;
  }

  function parseCSN(text) {
    if (!text || typeof text !== 'string') return [];
    var cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned.split('\n').map(function (line) {
      return line.trim().indexOf('#') === 0 ? '' : line;
    }).join('\n');

    var tournaments = [];
    var i = 0, len = cleaned.length;
    function skipWS() { while (i < len && /\s/.test(cleaned[i])) i++; }
    function peek() { return cleaned[i]; }
    function next() { return cleaned[i++]; }

    function parseValue() {
      skipWS();
      if (peek() === '(') {
        next();
        var depth = 1, start = i;
        while (i < len && depth > 0) {
          if (cleaned[i] === '(') depth++;
          else if (cleaned[i] === ')') depth--;
          if (depth > 0) i++;
        }
        var inner = cleaned.slice(start, i).trim();
        if (peek() === ')') next();
        return { type: 'func', body: inner };
      }
      var val = '';
      while (i < len && cleaned[i] !== ';' && cleaned[i] !== ']') val += cleaned[i++];
      return { type: 'val', body: val.trim() };
    }

    function parseTournament() {
      var t = { meta: {}, unknown: {}, n: {}, grp: {}, m: [], aw: {}, sq: {}, ranks: [], nt: '', rawKeys: [] };
      skipWS();
      if (peek() !== '[') return null;
      next();
      while (i < len) {
        skipWS();
        if (peek() === ']') { next(); break; }
        if (peek() === ';' || peek() === ',') { next(); continue; }
        var key = '';
        while (i < len && /[a-zA-Z0-9_]/.test(cleaned[i])) key += cleaned[i++];
        if (!key) { next(); continue; }
        skipWS();
        var val;
        if (peek() === '=') { next(); skipWS(); val = parseValue(); }
        else if (peek() === '(') val = parseValue();
        else continue;
        if (peek() === ';') next();
        t.rawKeys.push(key);
        if (val.type === 'val') t.meta[key] = val.body;
        else {
          var body = val.body;
          if (key === 'n') {
            body.split(',').forEach(function (p) {
              p = p.trim(); if (!p) return;
              var m = p.match(/^([^=]+)=([^\[\]]+)(?:\[([^\]]*)\])?/);
              if (m) t.n[m[1].trim()] = { name: m[2].trim(), player: (m[3] || '').trim() };
            });
          } else if (key === 'm') {
            body.split(';').forEach(function (raw) {
              var match = parseMatch(raw);
              if (match && match.kind !== 'unparsed') t.m.push(match);
              else if (match && match.kind === 'unparsed' && String(raw).trim()) t.m.push(match);
            });
          } else if (key === 'aw') {
            body.split(';').forEach(function (pair) {
              pair = pair.trim(); if (!pair) return;
              var eq = pair.indexOf('=');
              if (eq > 0) t.aw[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
            });
          } else if (key === 'sq') {
            body.split(';').forEach(function (line) {
              line = line.trim(); if (!line) return;
              var m = line.match(/^([^=]+)=(.*)$/); if (!m) return;
              var parts = m[2].split('|');
              function stripRole(s) {
                s = s.trim();
                var rm = s.match(/^(.+?)(?:\(([^)]+)\))?$/);
                return rm ? { name: rm[1].trim(), role: rm[2] || '' } : { name: s, role: '' };
              }
              t.sq[m[1].trim()] = {
                start: (parts[0] || '').split(',').map(stripRole).filter(function (x) { return x.name; }),
                bench: (parts[1] || '').split(',').map(stripRole).filter(function (x) { return x.name; })
              };
            });
          } else if (key === 'grp') {
            body.split(';').forEach(function (g) {
              g = g.trim(); if (!g) return;
              var m = g.match(/^([A-Za-z0-9]+)>(.*)/);
              if (m) t.grp[m[1].trim()] = m[2].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            });
          } else if (key === 'ranks' || key === 'vote') {
            body.split(',').forEach(function (part, idx) {
              part = part.trim(); if (!part) return;
              var rank = idx + 1, name = part, points = null;
              var m1 = part.match(/^(\d+)\s*=\s*(.+)$/);
              if (m1) { rank = parseInt(m1[1], 10); name = m1[2].trim(); }
              var pts = name.match(/^(.+?)\s*[:=]\s*(\d+)\s*$/);
              if (pts) { name = pts[1].trim(); points = parseInt(pts[2], 10); }
              t.ranks.push({ rank: rank, name: name, points: points });
            });
          } else if (key === 'nt') t.nt = body.trim();
          else t.unknown[key] = body;
        }
      }
      return t;
    }

    while (i < len) {
      skipWS();
      if (i >= len) break;
      if (peek() === '[') {
        var t = parseTournament();
        if (t && (t.meta.id || t.meta.e || t.m.length)) tournaments.push(t);
      } else i++;
    }
    return tournaments;
  }

  root.CSN = { parse: parseCSN, parseMatch: parseMatch, oversToBalls: oversToBalls, STAGE: STAGE };
})(typeof window !== 'undefined' ? window : global);
