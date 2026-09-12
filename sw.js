/* Studio Sozzo, guardiano della pagina.
   Tiene una copia dell'app sul telefono, cosi' si apre anche senza campo. */
const NOME = 'sozzo-20260912-1319';
const ROBA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icona-192.png',
  './icona-512.png',
  './icona-maskable-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(NOME).then(c => c.addAll(ROBA).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== NOME).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;

  const u = new URL(r.url);

  /* le chiamate a Firebase passano sempre dalla rete, se ne occupa lui */
  if (u.hostname.indexOf('googleapis.com') >= 0 ||
      u.hostname.indexOf('firebaseio.com') >= 0 ||
      u.hostname.indexOf('firebaseapp.com') >= 0 ||
      u.hostname.indexOf('accounts.google.com') >= 0) return;

  /* apertura della pagina: prima la rete, se manca la copia */
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(risp => {
        const copia = risp.clone();
        caches.open(NOME).then(c => c.put('./index.html', copia)).catch(() => {});
        return risp;
      }).catch(() => caches.match('./index.html').then(x => x || caches.match('./')))
    );
    return;
  }

  /* tutto il resto: prima la copia, poi la rete */
  e.respondWith(
    caches.match(r).then(c => c || fetch(r).then(risp => {
      if (risp && risp.status === 200 && (risp.type === 'basic' || risp.type === 'cors')) {
        const copia = risp.clone();
        caches.open(NOME).then(x => x.put(r, copia)).catch(() => {});
      }
      return risp;
    }).catch(() => c))
  );
});
