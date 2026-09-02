var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ctx = { console: console };
ctx.global = ctx; ctx.window = ctx;
function load(p) { vm.runInNewContext(fs.readFileSync(p, 'utf8'), ctx, p); }
load(__dirname + '/parser.js');
load(__dirname + '/engine.js');
var root = path.join(__dirname, '..');
var sportsCfg = JSON.parse(fs.readFileSync(root + '/sports.json', 'utf8'));
var registry = JSON.parse(fs.readFileSync(root + '/player-registry.json', 'utf8'));
delete registry._comment;
var config = JSON.parse(fs.readFileSync(root + '/config.json', 'utf8'));
var raw = {};
sportsCfg.sports.forEach(function (cfg) {
  var files = JSON.parse(fs.readFileSync(path.join(root, cfg.manifest), 'utf8'));
  raw[cfg.id] = [];
  files.forEach(function (f) {
    raw[cfg.id] = raw[cfg.id].concat(ctx.CSN.parse(fs.readFileSync(path.join(root, cfg.dataDir, f), 'utf8')));
  });
});
var world = ctx.SPAEngine.build({ sportsCfg: sportsCfg, registry: registry, config: config, misc: {}, raw: raw });
function assert(cond, msg) { if (!cond) { console.error('FAIL', msg); process.exitCode = 1; } else console.log('OK', msg); }
assert(raw.futsal.length === 12, 'futsal tournaments');
assert(raw.futsal[0].m.length === 20, 'pioneer 20');
assert(raw.football[0].m.length === 7, 'football 7');
assert(raw.cricket[0].m[0].kind === 'cricket', 'cricket kind');
assert(raw.cricket[0].m[0].sh === 26 && raw.cricket[0].m[0].ao === '0.1', 'cricket score/overs');
assert(world.sports.futsal.matches.length === 56, 'futsal 56 got ' + world.sports.futsal.matches.length);
assert(world.players.anish.bySport.football.goals >= 13, 'anish football goals');
assert(world.players.anish.bySport.cricket.runs === 44, 'anish cricket runs');
assert(world.teams['futsal:bbu'] && world.teams['football:bbu'], 'bbu split');
assert(world.competitions.some(function (c) { return c.rawId === 'tc26a'; }), 'titan cup');
assert(isFinite(world.teams['cricket:bbu'].stats.nrr), 'nrr');
console.log('issues', world.issues.length);
console.log(process.exitCode ? 'FAIL' : 'ALL ASSERTIONS PASSED');
