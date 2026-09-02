(function(root){'use strict';
function enrich(w){
 Object.values(w.teams||{}).forEach(function(t){t.nrr=null;t.cricket={runsFor:0,runsAgainst:0,oversFor:0,oversAgainst:0,wicketsFor:0,wicketsAgainst:0}});
 (w.matches||[]).filter(function(m){return m.kind==='cricket'}).forEach(function(m){
  [['home',m.home,m.sh,m.hw,m.sa,m.ab,m.hb],['away',m.away,m.sa,m.aw,m.sh,m.hb,m.ab]].forEach(function(x){var t=w.teams['cricket|'+x[1]];if(!t)return;t.cricket.runsFor+=x[2];t.cricket.runsAgainst+=x[4];t.cricket.wicketsFor+=x[3];t.cricket.wicketsAgainst+=x[5]||0;t.cricket.oversFor+=(x[6]||0)/6;t.cricket.oversAgainst+=(x[5]||0)/6});
 });
 Object.values(w.teams||{}).forEach(function(t){if(t.sport==='cricket'){var f=t.cricket.runsFor/(t.cricket.oversFor||0),a=t.cricket.runsAgainst/(t.cricket.oversAgainst||0);t.nrr=isFinite(f-a)?f-a:null}});
 return w;
}
root.SPASportStats={enrich:enrich};})(typeof window!=='undefined'?window:global);
