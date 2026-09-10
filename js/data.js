const CASPER_DATA = (() => {
  const files = {
    sectors: 'data/sectors.json',
    clubs: 'data/clubs.json',
    players: 'data/player-registry.json',
    competitions: 'data/competitions.json',
    dashboard: 'data/dashboard.json'
  };
  const cache = new Map();
  const fetchJSON = async key => {
    if (cache.has(key)) return cache.get(key);
    const res = await fetch(files[key], {cache:'no-store'});
    if (!res.ok) throw new Error(`DATA ${key.toUpperCase()} HTTP ${res.status}`);
    const value = await res.json();
    cache.set(key, value);
    return value;
  };
  const unique = (items, field) => {
    const seen = new Set();
    const dupes = [];
    for (const item of items) {
      const value = item[field];
      if (seen.has(value)) dupes.push(value); else seen.add(value);
    }
    return dupes;
  };
  async function load(){
    const [sectors,clubs,players,competitions,dashboard] = await Promise.all([
      fetchJSON('sectors'),fetchJSON('clubs'),fetchJSON('players'),fetchJSON('competitions'),fetchJSON('dashboard')
    ]);
    const errors=[];
    for (const [label,obj,key] of [['sectors',sectors,'sectors'],['clubs',clubs,'clubs'],['players',players,'players'],['competitions',competitions,'competitions']]) {
      if (!obj || !Array.isArray(obj[key])) errors.push(`${label}: missing ${key} array`);
      else if (unique(obj[key], 'nickname').length) errors.push(`${label}: duplicate General IDs`);
    }
    const sectorIds=new Set(sectors.sectors.map(x=>x.nickname));
    const clubIds=new Set(clubs.clubs.map(x=>x.nickname));
    const playerIds=new Set(players.players.map(x=>x.nickname));
    const competitionIds=new Set(competitions.competitions.map(x=>x.nickname));
    clubs.clubs.forEach(x=>{if(!sectorIds.has(x.sector))errors.push(`club ${x.nickname}: unknown sector ${x.sector}`)});
    players.players.forEach(x=>{if(!clubIds.has(x.club))errors.push(`player ${x.nickname}: unknown club ${x.club}`);if(!sectorIds.has(x.sector))errors.push(`player ${x.nickname}: unknown sector ${x.sector}`);if(!playerIds.has(x.nickname))errors.push(`player ${x.nickname}: invalid General ID`)});
    competitions.competitions.forEach(x=>{if(!sectorIds.has(x.sector))errors.push(`competition ${x.nickname}: unknown sector ${x.sector}`);if(!['football','futsal','cricsal'].includes(x.sport))errors.push(`competition ${x.nickname}: invalid sport ${x.sport}`)});
    if (dashboard.sports.football.goals < 0 || dashboard.sports.futsal.goals < 0 || dashboard.sports.cricsal.runs < 0 || dashboard.sports.cricsal.wickets < 0) errors.push('dashboard: negative sport statistic');
    return {sectors:sectors.sectors,clubs:clubs.clubs,players:players.players,competitions:competitions.competitions,dashboard,errors,ok:errors.length===0,ids:{sectorIds,clubIds,playerIds,competitionIds}};
  }
  return {load};
})();
