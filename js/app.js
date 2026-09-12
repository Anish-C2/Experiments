(async function boot() {
  const main = document.getElementById('app');
  const health = document.getElementById('data-health');
  if (!main) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]));
  const href = (...a) => CASPER_ROUTER.href(...a);

  if (typeof CASPER_VIEWS === 'undefined' || typeof CASPER_VIEWS.render !== 'function') {
    window.CASPER_VIEWS = {
      async render(model, route, root) {
        const name = route.name || 'home';
        const scope = model.scope(route.sector || 'ALL');
        document.title = 'CASPER — ' + name.toUpperCase();
        document.querySelectorAll('.topbar nav a').forEach(a => {
          const nav = a.getAttribute('data-nav');
          const mapped = { sector: 'sectors', club: 'clubs', player: 'players', competition: 'competitions' }[name] || name;
          a.classList.toggle('active', nav === mapped);
        });
        const links = (items, kind) => items.map(x => `<a class="list-row" href="${href(kind, x.nickname)}"><b>${esc(x.nickname)}</b><strong>${esc(x.name)}</strong><span>${esc(x.sector || x.sport || '')}</span></a>`).join('') || '<div class="empty-state">None</div>';
        let body = '';
        if (name === 'home') {
          body = `<section class="mast"><div><span class="eyebrow">CASPER // NETWORK</span><h1>SECTOR NETWORK</h1><p>${scope.counts.clubs} clubs · ${scope.counts.players} players · ${scope.results.length} matches from official CSN.</p></div></section>
            <div class="chip-row">${[{nickname:'ALL'},...model.sectors].map(s => `<a class="chip${(s.nickname||'ALL')===scope.id?' active':''}" href="${href('home','',{sector:s.nickname||'ALL'})}">${esc(s.nickname||'ALL SECTORS')}</a>`).join('')}</div>
            <div class="stats"><div><small>SECTORS</small><strong>${scope.counts.sectors}</strong><span>scope</span></div><div><small>CLUBS</small><strong>${scope.counts.clubs}</strong><span>registry</span></div><div><small>PLAYERS</small><strong>${scope.counts.players}</strong><span>registry</span></div><div><small>MATCHES</small><strong>${scope.results.length}</strong><span>csn</span></div></div>
            <div class="directory">${scope.sectors.map(s => `<a class="directory-card" href="${href('sector', s.nickname)}"><div class="directory-kicker">${esc(s.nickname)}</div><h2>${esc(s.name)}</h2><p>${esc(s.description || '')}</p></a>`).join('')}</div>`;
        } else if (name === 'sectors') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>SECTORS</h1></div></section><div class="directory">${links(model.sectors, 'sector')}</div>`;
        else if (name === 'clubs') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>CLUBS</h1></div></section><div class="directory">${links(model.clubs, 'club')}</div>`;
        else if (name === 'players') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>PLAYERS</h1></div></section><div class="directory">${links(model.players, 'player')}</div>`;
        else if (name === 'competitions') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>COMPETITIONS</h1></div></section><div class="directory">${links(model.competitions, 'competition')}</div>`;
        else if (name === 'matches') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>MATCHES</h1></div></section>${scope.results.slice().reverse().map(r => `<div class="result"><small>${esc(r.competition)} · ${esc(r.round)}</small><strong>${esc(r.home)}<br>${esc(r.away)}</strong><b>${esc(r.score)}</b><small>${esc(r.sport)}</small></div>`).join('') || '<div class="empty-state">No matches</div>'}`;
        else if (name === 'records') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>RECORDS</h1></div></section><div id="honor-board"></div>`;
        else if (name === 'docs') body = `<section class="mast"><div><span class="eyebrow">CASPER</span><h1>DOCS</h1></div></section><div class="directory">${['ARCHITECTURE.md','AWARDS.md','CSN.md','DATA_STRUCTURE.md','DATA_VALIDATION.md','STATISTICS.md','COMPETITION_PROFILES.md'].map(d => `<a class="list-row" href="${href('docs', d)}"><b>MD</b><strong>${esc(d)}</strong></a>`).join('')}</div>`;
        else if (['sector','club','player','competition'].includes(name)) {
          const row = model.get(name, route.id);
          body = row ? `<section class="mast"><div><span class="eyebrow">CASPER // ${esc(name.toUpperCase())}</span><h1>${esc(row.name)}</h1><p>${esc(row.nickname)} · ${esc(row.sector || row.region || row.sport || '')}</p></div></section>` : `<section class="mast"><div><h1>NOT FOUND</h1><p>${esc(route.id)}</p></div></section>`;
        } else body = `<section class="mast"><div><h1>NOT FOUND</h1></div></section>`;
        root.innerHTML = body;
        if (name === 'records' && typeof CASPER_AWARDS !== 'undefined') CASPER_AWARDS.render(root.querySelector('#honor-board'), model, route.sector);
        if (name === 'docs' && route.id) {
          try {
            const r = await fetch('docs/' + route.id + '?v=' + Date.now(), { cache: 'no-store' });
            const text = r.ok ? await r.text() : 'Unable to load ' + route.id;
            root.insertAdjacentHTML('beforeend', `<article class="markdown" style="padding:20px;white-space:pre-wrap">${esc(text)}</article>`);
          } catch (e) {}
        }
      }
    };
  }

  function paintHealth(model) {
    if (!health) return;
    health.textContent = model.ok ? (model.mock ? 'DATA PIPELINE · VALID · MOCK' : 'DATA PIPELINE · VALID') : ('DATA PIPELINE · ' + model.errors.length + ' ERRORS');
    health.title = [...model.errors, ...model.warnings].join('\n') || 'All registry references passed validation';
    health.classList.toggle('bad', !model.ok);
  }

  try {
    const model = await CASPER_DATA.load();
    paintHealth(model);
    CASPER_ROUTER.start(route => {
      CASPER_VIEWS.render(model, route, main).catch(err => {
        main.innerHTML = '<div class="data-error">CASPER RENDER ERROR · ' + esc(err.message || err) + '</div>';
      });
    });
  } catch (err) {
    console.error(err);
    main.innerHTML = '<div class="data-error">CASPER DATA ERROR · ' + esc(err.message || err) + '</div>';
    if (health) { health.textContent = 'DATA PIPELINE · FAILED'; health.classList.add('bad'); }
  }
})();
