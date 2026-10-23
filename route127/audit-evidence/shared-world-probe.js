(() => {
  'use strict';
  const key = 'route127-dev-worker-url';
  const endpoint = document.getElementById('endpoint');
  const output = document.getElementById('output');
  endpoint.value = localStorage.getItem(key) || '';
  document.getElementById('clear').addEventListener('click', () => {
    localStorage.removeItem(key); endpoint.value = ''; output.textContent = 'URL cleared.';
  });
  document.getElementById('fetch').addEventListener('click', async () => {
    let url;
    try {
      url = new URL(endpoint.value.trim());
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.workers.dev') || url.username || url.password || url.port || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw Error('Enter the HTTPS workers.dev root URL, without a path or credentials.');
    } catch (e) { output.textContent = 'Invalid Worker URL: ' + e.message; return; }
    localStorage.setItem(key, url.origin);
    output.textContent = 'Contacting development Worker...';
    try {
      const res = await fetch(url.origin + '/players', {method:'GET', mode:'cors', cache:'no-store', credentials:'omit'});
      if (!res.ok) throw Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !Array.isArray(data.players)) throw Error('Unexpected response; expected {players: []}.');
      const players = data.players;
      output.textContent = players.length ? players.map((p, i) => `${i+1}. ${String(p.character_name ?? 'Unknown').slice(0,60)} | Level ${Number(p.level)||1} | ${String(p.location ?? 'Unknown').slice(0,60)} | ${p.online ? 'ONLINE' : 'OFFLINE'}`).join('\n') : 'Connection successful. Development world contains zero players.';
    } catch (e) { output.textContent = 'Scan failed: ' + e.message + '\nCheck Worker URL, D1 binding, and cross-origin permissions.'; }
  });
})();
