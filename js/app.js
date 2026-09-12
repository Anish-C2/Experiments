(async function boot() {
  const main = document.getElementById('app');
  const health = document.getElementById('data-health');
  if (!main) return;

  function paintHealth(model) {
    if (!health) return;
    health.textContent = model.ok
      ? (model.mock ? 'DATA PIPELINE · VALID · MOCK' : 'DATA PIPELINE · VALID')
      : `DATA PIPELINE · ${model.errors.length} ERRORS`;
    health.title = [...model.errors, ...model.warnings].join('\n') || 'All registry references passed validation';
    health.classList.toggle('bad', !model.ok);
  }

  try {
    const model = await CASPER_DATA.load();
    paintHealth(model);
    CASPER_ROUTER.start(route => {
      CASPER_VIEWS.render(model, route, main).catch(err => {
        main.innerHTML = `<div class="data-error">CASPER RENDER ERROR · ${String(err.message || err)}</div>`;
      });
    });
    if (!model.ok) console.error('CASPER data validation errors', model.errors);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="data-error">CASPER DATA ERROR · ${String(err.message || err)}</div>`;
    if (health) {
      health.textContent = 'DATA PIPELINE · FAILED';
      health.classList.add('bad');
    }
  }
})();
