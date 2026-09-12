const CASPER_ROUTER = (() => {
  const listeners = [];

  function rawHash() {
    return String(location.hash || '').replace(/^#/, '');
  }

  function parse(hash) {
    let raw = String(hash == null ? rawHash() : hash);
    if (raw.charAt(0) === '#') raw = raw.slice(1);
    if (raw && raw.charAt(0) !== '/') raw = '/' + raw;
    if (!raw || raw === '/') return { name: 'home', id: '', sector: 'ALL', sport: 'all', query: {}, path: '/' };
    const cut = raw.split('?');
    const parts = cut[0].replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const query = {};
    new URLSearchParams(cut[1] || '').forEach((v, k) => { query[k] = v; });
    const name = (parts[0] || 'home').toLowerCase();
    return {
      name,
      id: decodeURIComponent(parts[1] || query.id || ''),
      sector: query.sector || 'ALL',
      sport: query.sport || 'all',
      query,
      path: '/' + parts.join('/'),
      parts
    };
  }

  function href(name, id, query) {
    let path = '#/' + String(name || '').replace(/^\/+/, '');
    if (id) path += '/' + encodeURIComponent(id);
    const q = new URLSearchParams();
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v != null && v !== '' && v !== 'ALL' && v !== 'all') q.set(k, v);
    });
    const qs = q.toString();
    return qs ? path + '?' + qs : path;
  }

  function go(name, id, query) {
    const next = href(name, id, query);
    if (location.hash === next.slice(1) || '#' + rawHash() === next) emit();
    else location.hash = next.slice(1);
  }

  function emit() {
    const route = parse();
    listeners.forEach(fn => fn(route));
  }

  function start(onChange) {
    if (onChange) listeners.push(onChange);
    window.addEventListener('hashchange', emit);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const hrefAttr = a.getAttribute('href') || '';
      if (hrefAttr.charAt(0) !== '#') return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      e.preventDefault();
      const next = hrefAttr.charAt(1) === '/' ? hrefAttr.slice(1) : '/' + hrefAttr.slice(1);
      if (rawHash() === next.replace(/^\//, '') || rawHash() === next) emit();
      else location.hash = next.charAt(0) === '/' ? next : '/' + next;
    });
    if (!location.hash) location.replace(location.pathname + location.search + '#/');
    else emit();
  }

  return { parse, href, go, start };
})();
