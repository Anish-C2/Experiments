(function(root){'use strict';
var u={key:function(s){return String(s||'').trim().toLowerCase()},num:function(v){var n=Number(v);return isFinite(n)?n:0},uniq:function(a){var x={};return a.filter(function(v){var k=u.key(v);if(!k||x[k])return false;x[k]=1;return true})}};
function sector(t){return t.meta.sector||t.meta.sec||t.meta.prd||t.meta.region||t.meta.zone||'Unassigned'}
function teamMap(t){var o={};Object.keys(t.n||{}).forEach(function(k){o[k]=t.n[k].name||k});return o}
function expand(a){var o=[];(a||[]).forEach(function(x){for(var i=0;i<(x.n||1);i++)o.push(x.name)});return o}
function stat(map,name){var k=u.key(name);if(!k)return null;if(!map[k])map[k]={key:k,name:name,g:0,a:0,appearances:0,matchSet:{},sports:{},teams:{},contexts:{},registry:null};return map[k]}
function involved(s,m,side){var k=m._id+'|'+side;if(!s.matchSet[k]){s.matchSet[k]=1;s.appearances++}}
function playerContext(s,sc,sec,sea,team){s.sports[sc]=1;s.teams[sc+'|'+team]=1;s.contexts[sec+'|'+sea]=1}
function build(input){
 var cfg=(input.sportsCfg&&input.sportsCfg.sports)||[],reg=input.registry||{},raw=input.raw||{};
 var w={sports:{},players:{},teams:{},competitions:[],matches:[],seasons:{},sectors:{},issues:[],records:[],registry:reg};
 cfg.forEach(function(sc){
  var bucket={id:sc.id,name:sc.name,config:sc,events:[],matches:[],totals:{matches:0,goals:0,runs:0,wickets:0}};
  (raw[sc.id]||[]).forEach(function(t,ti){
   var sec=sector(t),sea=t.meta.s||t.meta.season||'Unknown',ev=t.meta.e||t.meta.event||'Unnamed competition',ed=t.meta.ed||t.meta.edition||'',cid=t.meta.id||sc.id+'-'+ev+'-'+sea+'-'+ti,tm=teamMap(t),sk=sec+'|'+sea;
   w.sectors[sec]=w.sectors[sec]||{name:sec,seasons:{},sports:{}};w.sectors[sec].seasons[sea]=1;w.sectors[sec].sports[sc.id]=1;
   w.seasons[sk]=w.seasons[sk]||{key:sk,sector:sec,season:sea,events:[],sports:{}};w.seasons[sk].events.push(cid);w.seasons[sk].sports[sc.id]=1;
   Object.keys(tm).forEach(function(code){var tk=sc.id+'|'+code;if(!w.teams[tk])w.teams[tk]={key:tk,code:code,name:tm[code],sport:sc.id,matches:[],wins:0,draws:0,losses:0,for:0,against:0,titles:0,sectors:{},seasons:{},events:[]};var q=w.teams[tk];q.sectors[sec]=1;q.seasons[sk]=1;q.events.push(cid)});
   var comp={id:cid,name:ev,edition:ed,season:sea,sector:sec,sport:sc.id,format:t.meta.fmt||'',organization:t.meta.org||'',level:t.meta.lvl||'',status:t.meta.sts||'',venue:t.meta.ven||'',teams:tm,matches:[],awards:t.aw||{},raw:t};w.competitions.push(comp);bucket.events.push(comp);
   if(t.aw&&t.aw.ch){var champ=w.teams[sc.id+'|'+t.aw.ch];if(champ)champ.titles++}
   (t.m||[]).forEach(function(m,mi){m._id=cid+'|'+mi;m.competitionId=cid;m.competition=ev;m.edition=ed;m.season=sea;m.sector=sec;m.sport=sc.id;m.teamNames=tm;m.matchNo=mi+1;w.matches.push(m);bucket.matches.push(m);comp.matches.push(m._id);bucket.totals.matches++;
    if(m.kind==='cricket'){
     bucket.totals.runs+=m.sh+m.sa;bucket.totals.wickets+=m.hw+m.aw;
     [m.home,m.away].forEach(function(code){var q=w.teams[sc.id+'|'+code];if(!q)return;q.matches.push(m._id);q.for+=code===m.home?m.sh:m.sa;q.against+=code===m.home?m.sa:m.sh;var r=code===m.home?(m.sh>m.sa?1:m.sh<m.sa?-1:0):(m.sa>m.sh?1:m.sa<m.sh?-1:0);if(r>0)q.wins++;else if(r<0)q.losses++;else q.draws++})
    }else{
     bucket.totals.goals+=m.sh+m.sa;var h=w.teams[sc.id+'|'+m.home],a=w.teams[sc.id+'|'+m.away];if(h){h.matches.push(m._id);h.for+=m.sh;h.against+=m.sa}if(a){a.matches.push(m._id);a.for+=m.sa;a.against+=m.sh}if(m.sh>m.sa){if(h)h.wins++;if(a)a.losses++}else if(m.sh<m.sa){if(a)a.wins++;if(h)h.losses++}else{if(h)h.draws++;if(a)a.draws++}
     expand(m.gh).forEach(function(p){var s=stat(w.players,p);s.g++;playerContext(s,sc.id,sec,sea,m.home);involved(s,m,'h')});expand(m.ga).forEach(function(p){var s=stat(w.players,p);s.g++;playerContext(s,sc.id,sec,sea,m.away);involved(s,m,'a')});expand(m.ah).forEach(function(p){var s=stat(w.players,p);s.a++;playerContext(s,sc.id,sec,sea,m.home);involved(s,m,'h')});expand(m.aa).forEach(function(p){var s=stat(w.players,p);s.a++;playerContext(s,sc.id,sec,sea,m.away);involved(s,m,'a')});
    }
   });
   Object.keys(t.sq||{}).forEach(function(code){var arr=(t.sq[code].start||[]).concat(t.sq[code].bench||[]);arr.forEach(function(p){var s=stat(w.players,p.name);playerContext(s,sc.id,sec,sea,code)})});
  });w.sports[sc.id]=bucket;
 });
 Object.keys(reg).forEach(function(k){if(k==='_comment')return;var r=reg[k];if(!w.players[k])w.players[k]=stat(w.players,r.name||k);w.players[k].registry=r;w.players[k].clubCodes=r.clubs||[];w.players[k].sports=w.players[k].sports||{};(r.sports||[]).forEach(function(s){w.players[k].sports[s]=1})});
 Object.values(w.players).forEach(function(p){p.gp=p.g+p.a;p.gPerApp=p.appearances?p.g/p.appearances:0;p.aPerApp=p.appearances?p.a/p.appearances:0;p.gaPerApp=p.appearances?p.gp/p.appearances:0;p.contextList=Object.keys(p.contexts||{})});
 Object.values(w.teams).forEach(function(t){t.winRate=t.matches.length?t.wins/t.matches.length*100:0;t.gd=t.for-t.against;t.sectors=Object.keys(t.sectors);t.seasons=Object.keys(t.seasons);t.events=u.uniq(t.events)});
 w.matches.forEach(function(m){if(m.kind==='unparsed')w.issues.push({level:'error',message:'Unparsed match',raw:m.raw});if(!m.home||!m.away)w.issues.push({level:'error',message:'Missing team in match',raw:m.raw})});
 var goalPlayers=Object.values(w.players).filter(function(p){return p.g>0}).sort(function(a,b){return b.g-a.g});if(goalPlayers[0])w.records.push({label:'Top scorer',value:goalPlayers[0].name+' — '+goalPlayers[0].g+' goals'});
 var biggest=w.matches.filter(function(m){return m.kind==='goals'}).sort(function(a,b){return b.sh+b.sa-(a.sh+a.sa)})[0];if(biggest)w.records.push({label:'Highest-scoring match',value:(biggest.teamNames[biggest.home]||biggest.home)+' '+biggest.sh+'–'+biggest.sa+' '+(biggest.teamNames[biggest.away]||biggest.away)});
 w.playersList=Object.values(w.players);w.teamsList=Object.values(w.teams);w.competitionsList=w.competitions.slice();w.matchesList=w.matches.slice();return w;
}
root.SPAEngine={build:build,util:u};})(typeof window!=='undefined'?window:global);
