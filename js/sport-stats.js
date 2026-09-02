(function(root){'use strict';
function balls(ov){return ov==null||ov===''?0:(typeof ov==='number'?Math.floor(ov)*6+Math.round((ov-Math.floor(ov))*10):Number(CSN&&CSN.oversToBalls?CSN.oversToBalls(ov):0)||0)}
function enrich(w){
 Object.values(w.teams||{}).forEach(function(t){t.nrr=null;t.cricket={runsFor:0,runsAgainst:0,ballsFor:0,ballsAgainst:0,wicketsFor:0,wicketsAgainst:0}});
 (w.matches||[]).filter(function(m){return m.kind==='cricket'}).forEach(function(m){
  var sides=[{code:m.home,runsFor:m.sh,runsAgainst:m.sa,ballsFor:balls(m.ho),ballsAgainst:balls(m.ao),wicketsFor:m.hw,wicketsAgainst:m.aw},{code:m.away,runsFor:m.sa,runsAgainst:m.sh,ballsFor:balls(m.ao),ballsAgainst:balls(m.ho),wicketsFor:m.aw,wicketsAgainst:m.hw}];
  sides.forEach(function(x){var t=w.teams['cricket|'+x.code];if(!t)return;t.cricket.runsFor+=x.runsFor;t.cricket.runsAgainst+=x.runsAgainst;t.cricket.ballsFor+=x.ballsFor;t.cricket.ballsAgainst+=x.ballsAgainst;t.cricket.wicketsFor+=x.wicketsFor;t.cricket.wicketsAgainst+=x.wicketsAgainst});
 });
 Object.values(w.teams||{}).forEach(function(t){if(t.sport!=='cricket')return;var f=t.cricket.runsFor/(t.cricket.ballsFor/6||0),a=t.cricket.runsAgainst/(t.cricket.ballsAgainst/6||0);t.nrr=isFinite(f-a)?f-a:null;t.cricket.oversFor=t.cricket.ballsFor/6;t.cricket.oversAgainst=t.cricket.ballsAgainst/6});
 return w;
}
root.SPASportStats={enrich:enrich};})(typeof window!=='undefined'?window:global);
