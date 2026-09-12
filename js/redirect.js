(function () {
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '').toLowerCase();
  const q = new URLSearchParams(location.search);
  const routes = {
    index: '/',
    sectors: '/sectors',
    sector: '/sector/' + encodeURIComponent(q.get('id') || ''),
    clubs: '/clubs',
    club: '/club/' + encodeURIComponent(q.get('id') || ''),
    players: '/players',
    player: '/player/' + encodeURIComponent(q.get('id') || ''),
    competitions: '/competitions',
    competition: '/competition/' + encodeURIComponent(q.get('id') || ''),
    matches: '/matches',
    records: '/records',
    docs: q.get('doc') ? '/docs/' + encodeURIComponent(q.get('doc')) : '/docs'
  };
  const extra = new URLSearchParams();
  if (q.get('sector')) extra.set('sector', q.get('sector'));
  if (q.get('sport')) extra.set('sport', q.get('sport'));
  const path = (routes[file] || '/').replace(/\/$/, '') || '/';
  const qs = extra.toString();
  const base = location.pathname.replace(/[^/]+$/, '') + 'index.html';
  location.replace(base + '#' + path + (qs ? '?' + qs : ''));
})();
