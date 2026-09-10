const D={
  clubs:[
    ['01','NSR FC','SSN','14','11','2','1','46','12','+34','1518','79%','WWDWW'],
    ['02','EAS UNITED','OSA','12','8','3','1','34','15','+19','1451','67%','WDDWW'],
    ['03','RIV CITY','CFA','10','6','1','3','27','18','+9','1392','60%','LWWDW'],
    ['04','SOU ATH','CSA','8','4','1','3','18','16','+2','1340','50%','WWLWL'],
    ['05','NORTH XI','SSN','9','3','2','4','17','21','−4','1298','33%','WLLDW'],
    ['06','EAST FC','OSA','8','2','1','5','12','24','−12','1241','25%','LLWLL']
  ],
  players:[
    {id:'01',name:'Example Player',club:'NSR',sec:'SSN',primary:'12',secondary:'7',apps:'16',discipline:'1',sport:'⚽',label:'G'},
    {id:'02',name:'Another Player',club:'EAS',sec:'OSA',primary:'9',secondary:'5',apps:'13',discipline:'0',sport:'⚽',label:'G'},
    {id:'03',name:'Third Player',club:'RIV',sec:'CFA',primary:'8',secondary:'4',apps:'11',discipline:'2',sport:'🥅',label:'G'},
    {id:'04',name:'Fourth Player',club:'NSR',sec:'SSN',primary:'7',secondary:'6',apps:'10',discipline:'1',sport:'🥅',label:'G'},
    {id:'05',name:'Fifth Player',club:'EAS',sec:'OSA',primary:'54',secondary:'3',apps:'11',discipline:'0',sport:'🏏',label:'R'},
    {id:'06',name:'Sixth Player',club:'RIV',sec:'CFA',primary:'41',secondary:'2',apps:'8',discipline:'0',sport:'🏏',label:'R'},
    {id:'07',name:'Seventh Player',club:'SOU',sec:'CSA',primary:'6',secondary:'3',apps:'8',discipline:'2',sport:'⚽',label:'G'},
    {id:'08',name:'Eighth Player',club:'NSR',sec:'SSN',primary:'5',secondary:'4',apps:'7',discipline:'1',sport:'🥅',label:'G'}
  ],
  results:[
    ['FT','NSR','SOU','3–1','SSN-FB · MD12','90′','⚽'],
    ['FT','EAS','RIV','2–2','OSA-FB · MD11','90′','⚽'],
    ['FT','NSR','EAS','6–5','SSN-FS · SF','40′','🥅'],
    ['FT','RIV XI','SOU XI','58–44','CSA-CR · MD05','12b','🏏'],
    ['FT','EAS XI','NSR XI','16–18','OSA-CR · F','12b','🏏']
  ],
  competitions:[
    ['SSN-FB','SSN','FOOTBALL','PREMIER DIVISION','12','92','4.31','ACTIVE','GF'],
    ['SSN-FS','SSN','FUTSAL','FUTSAL CUP','8','27','4.40','ACTIVE','GF'],
    ['OSA-CR','OSA','CRICSAL','CRICSAL LEAGUE','11','286','26.0','LIVE','RUNS'],
    ['CFA-FB','CFA','FOOTBALL','COMMUNITY SHIELD','4','19','4.75','ACTIVE','GF'],
    ['CSA-CR','CSA','CRICSAL','COMMUNITY CRICSAL','4','136','34.0','ACTIVE','RUNS']
  ]
};

const $=s=>document.querySelector(s);

$('#club-table').innerHTML=`<div class="club-head"><span>#</span><span>CLUB</span><span>SEC</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>ELO</span><span>WR</span><span>FORM</span></div>`+
D.clubs.map(c=>`<div class="club-row"><b>${c[0]}</b><strong>${c[1]}</strong><span>${c[2]}</span><span>${c[3]}</span><span>${c[4]}</span><span>${c[5]}</span><span>${c[6]}</span><span>${c[9]}</span><span>${c[10]}</span><span>${c[11]}</span><span class="form">${c[12]}</span></div>`).join('');

$('#players-list').innerHTML=`<div class="player-head"><span>#</span><span>PLAYER</span><span>SEC</span><span>G/R</span><span>AST</span><span>APP</span><span>YC/W</span></div>`+
D.players.map(p=>`<div class="player-row"><b>${p.id}</b><div><strong>${p.name}</strong><small>${p.club} · ${p.label==='R'?'CRICSAL RUNS':'SPORT GOALS'}</small></div><span>${p.sec}</span><span>${p.primary}</span><span>${p.secondary}</span><span>${p.apps}</span><span>${p.discipline}</span></div>`).join('');

$('#results-list').innerHTML=D.results.map(r=>`<div class="result"><small>${r[0]}<br>${r[4]}</small><strong>${r[1]}<br>${r[2]}</strong><b>${r[3]}</b><small>${r[5]}</small><em>${r[6]}</em></div>`).join('');

$('#competition-list').innerHTML=D.competitions.map(c=>`<div class="comp-row"><b>${c[0]}</b><div><strong>${c[3]}</strong><small>${c[1]} · ${c[2]} · ${c[7]}</small></div><span>${c[4]} M</span><span>${c[5]} ${c[8]}</span><span>${c[6]} AVG</span></div>`).join('');
