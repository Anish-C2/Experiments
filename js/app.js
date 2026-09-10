const $ = s => document.querySelector(s);
const icon = {football:'⚽',futsal:'🥅',cricsal:'🏏'};
const sportLabel = s => s==='cricsal' ? 'CRICSAL' : s.toUpperCase();
const clubMap = new Map();
const playerMap = new Map();

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(n){return Number(n||0).toLocaleString('en-IN');}
function setText(sel,text){const el=$(sel);if(el)el.textContent=text;}

function renderStats(d){
  const s=d.dashboard.sports,n=d.dashboard.network;
  setText('.mast-grid span:nth-child(1) strong',String(n.sectors).padStart(2,'0'));
  setText('.mast-grid span:nth-child(2) strong',String(n.active).padStart(2,'0'));
  setText('.mast-grid span:nth-child(3) strong',fmt(n.clubs));
  setText('.mast-grid span:nth-child(4) strong',fmt(n.players));
  const values=[['SECTORS',n.sectors,'ALL ACTIVE'],['COMPETITIONS',n.competitions,'8 SECTORAL'],['CLUBS',n.clubs,'26 SECTORAL'],['PLAYERS',n.players,'207 SECTORAL'],['FOOTBALL GOALS',s.football.goals,`${s.football.average.toFixed(2)} / MATCH`],['FUTSAL GOALS',s.futsal.goals,`${s.futsal.average.toFixed(2)} / MATCH`],['CRICSAL RUNS',s.cricsal.runs,`${s.cricsal.average.toFixed(2)} / MATCH`],['CRICSAL WICKETS',s.cricsal.wickets,'0.63 / MATCH']];
  const box=$('.stats'); if(box) box.innerHTML=values.map(x=>`<div><small>${x[0]}</small><strong>${fmt(x[1])}</strong><span>${x[2]}</span></div>`).join('');
}

function renderSectors(d){
  const host=$('#sectors');if(!host)return;
  host.innerHTML=d.sectors.map((s,i)=>{const st=d.dashboard.sectorStats[s.nickname],sports=st.sports;return `<article class="sector-card"><header><div><small>SECTOR ${String(i+1).padStart(2,'0')} · ${esc(s.nickname)}</small><h2>${esc(s.name)}</h2><p>${esc(s.description)}</p></div><b class="live">${esc(s.status).toUpperCase()}</b></header><div class="sector-meta"><span><small>REGION</small><strong>${esc(s.region)}</strong></span><span><small>CLUBS</small><strong>${st.clubs}</strong></span><span><small>PLAYERS</small><strong>${st.players}</strong></span><span><small>COMPETITIONS</small><strong>${st.competitions}</strong></span></div><div class="sport-split">${Object.entries(sports).map(([sport,x])=>`<div><b>${icon[sport]} ${sportLabel(sport)}</b><strong>${sport==='cricsal'?`${fmt(x.runs)} RUNS · ${x.wickets} W`:`${fmt(x.goals)} GOALS`}</strong><span>${x.matches?`${x.matches} MATCHES · ${Number(x.average).toFixed(2)} ${sport==='cricsal'?'RUN':'AVG'}`:'NO MATCHES YET'}</span></div>`).join('')}</div></article>`}).join('');
}

function renderClubs(d){const host=$('#club-table');if(!host)return;host.innerHTML=`<div class="club-head"><span>#</span><span>CLUB</span><span>SEC</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GF</span><span>GA</span><span>GD</span><span>ELO</span><span>WR</span><span>FORM</span></div>`+d.dashboard.clubTable.map(c=>{const club=clubMap.get(c.club);return `<div class="club-row"><b>${c.rank}</b><strong>${esc(club?.name||c.club)}</strong><span>${esc(club?.sector||'—')}</span><span>${c.p}</span><span>${c.w}</span><span>${c.d}</span><span>${c.l}</span><span>${c.gf}</span><span>${c.ga}</span><span>${c.gd>0?'+':''}${c.gd}</span><span>${c.elo}</span><span>${c.wr}</span><span class="form">${esc(c.form)}</span></div>`}).join('');}

function renderPlayers(d){const host=$('#players-list');if(!host)return;host.innerHTML=`<div class="player-head"><span>#</span><span>PLAYER</span><span>SEC</span><span>G/R</span><span>AST/W</span><span>APP</span><span>YC/W</span></div>`+d.dashboard.playerStats.map((p,i)=>{const x=playerMap.get(p.player);const label=p.sport==='cricsal'?'CRICSAL RUNS':`${sportLabel(p.sport)} GOALS`;return `<div class="player-row"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${esc(x?.name||p.player)}</strong><small>${esc(p.club)} · ${label}</small></div><span>${esc(x?.sector||'—')}</span><span>${p.primary}</span><span>${p.secondary}</span><span>${p.apps}</span><span>${p.discipline}</span></div>`}).join('');}

function renderResults(d){const host=$('#results-list');if(!host)return;host.innerHTML=d.dashboard.results.map(r=>`<div class="result"><small>${esc(r.status)}<br>${esc(r.competition)} · ${esc(r.round)}</small><strong>${esc(r.home)}<br>${esc(r.away)}</strong><b>${esc(r.score)}</b><small>${esc(r.duration)}</small><em>${icon[r.sport]}</em></div>`).join('');}
function renderCompetitions(d){const host=$('#competition-list');if(!host)return;host.innerHTML=d.competitions.map(c=>`<div class="comp-row"><b>${esc(c.nickname)}</b><div><strong>${esc(c.name)}</strong><small>${esc(c.sector)} · ${sportLabel(c.sport)} · ${esc(c.status).toUpperCase()}</small></div><span>—</span><span>—</span><span>${esc(c.type).toUpperCase()}</span></div>`).join('');}
function renderHealth(d){const old=document.querySelector('.data-health');if(old)old.remove();const el=document.createElement('div');el.className='data-health';el.textContent=d.ok?'DATA PIPELINE · VALID':'DATA PIPELINE · '+d.errors.length+' ERRORS';el.title=d.errors.join('\n')||'All registry references passed validation';document.querySelector('main')?.appendChild(el);}

(async()=>{try{const d=await CASPER_DATA.load();d.clubs.forEach(x=>clubMap.set(x.nickname,x));d.players.forEach(x=>playerMap.set(x.nickname,x));renderStats(d);renderSectors(d);renderClubs(d);renderPlayers(d);renderResults(d);renderCompetitions(d);renderHealth(d);if(!d.ok)console.error('CASPER data validation errors',d.errors);}catch(e){console.error(e);const host=$('#top');if(host)host.insertAdjacentHTML('afterbegin',`<div class="data-error">CASPER DATA ERROR · ${esc(e.message)}</div>`);}})();
