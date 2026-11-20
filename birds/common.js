(function () {
  const IUCN = { CR: 'Critically Endangered', EN: 'Endangered', VU: 'Vulnerable', NT: 'Near Threatened', LC: 'Least Concern', DD: 'Data Deficient', EX: 'Extinct', EW: 'Extinct in the Wild' };
  const THREATENED = ['CR', 'EN', 'VU'];
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 30'><rect width='40' height='30' fill='#e8eeeb'/><path d='M12 19c3-6 8-8 14-6l3-2-1 4c-1 5-6 8-12 7z' fill='#b7c6c2'/></svg>");

  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const k in props || {}) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid);
    return e;
  }

  async function loadSpecies() {
    for (const f of ['data/species.json', 'data/sample.json']) {
      try {
        const r = await fetch(f);
        if (!r.ok) continue;
        const d = await r.json();
        if (Array.isArray(d) && d.length) return d;
      } catch (e) { /* try next */ }
    }
    throw new Error('Could not load species data');
  }

  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const thumb = (s) => { const p = (s.photos || []).find((x) => x.type !== 'map' && x.url); return p ? p.url : null; };
  const isRare = (s) => /rare|accidental|vagrant|irregular/i.test(s.rarity || '') && !/^common$/i.test(s.rarity);

  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : null; }

  const IUCN_BY_NAME = Object.fromEntries(Object.entries(IUCN).map(([k, v]) => [v.toLowerCase(), k]));
  // Data stores full names ("Critically endangered"); accept those or codes ("CR").
  function iucnCode(st) {
    if (!st) return null;
    const t = String(st).trim();
    if (IUCN[t.toUpperCase()]) return t.toUpperCase();
    return IUCN_BY_NAME[t.toLowerCase().replace(/-/g, ' ')] || null;
  }

  function statusBadge(st) {
    const c = iucnCode(st);
    if (!c) return null;
    return h('span', { class: 'badge iucn iucn-' + c, title: IUCN[c], text: c });
  }

  // Fetch JSON from the bird API. Throws Error (with .status for HTTP errors) and returns null for 204.
  async function api(path, opts) {
    const base = String((window.BIRDS_CONFIG || {}).API_BASE || '').replace(/\/+$/, '');
    let r;
    try { r = await fetch(base + path, opts); } catch (e) {
      throw new Error('Could not reach the bird API. Check your connection and try again.');
    }
    if (r.status === 204) return null;
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.detail || `Request failed (${r.status})`), { status: r.status });
    return data;
  }

  // The single shared "Bharatpur birds" list. The API is the source of truth;
  // localStorage is only a cache used when the API cannot be reached.
  const CACHE_KEY = 'birds-bharatpur';
  const bharat = { ids: [], offline: false, error: '', pending: new Set() };
  const subscribers = new Set();
  try { bharat.ids = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]').filter((x) => typeof x === 'string'); } catch (e) { /* ignore corrupt cache */ }

  function subscribe(fn) { subscribers.add(fn); }
  function publish() { subscribers.forEach((fn) => fn(bharat)); }
  function setIds(ids) {
    bharat.ids = ids;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(ids)); } catch (e) { /* storage unavailable */ }
    publish();
  }

  async function loadBharatpur() {
    try {
      const list = await api('/bharatpur');
      bharat.offline = false;
      bharat.error = '';
      setIds(list.birds.map((b) => b.id));
    } catch (e) {
      bharat.offline = true;
      publish();
    }
    return bharat;
  }

  // Adds the bird if absent, removes it if present. Server response is authoritative; offline falls back to the cache.
  async function toggleBird(id) {
    if (bharat.pending.has(id)) return bharat;
    const on = bharat.ids.includes(id);
    bharat.pending.add(id);
    bharat.error = '';
    publish();
    try {
      const list = on
        ? await api('/bharatpur/birds/' + encodeURIComponent(id), { method: 'DELETE' })
        : await api('/bharatpur/birds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bird_id: id }) });
      bharat.offline = false;
      setIds(list.birds.map((b) => b.id));
    } catch (e) {
      if (e.status) bharat.error = e.message;
      else {
        bharat.offline = true;
        setIds(on ? bharat.ids.filter((x) => x !== id) : [...bharat.ids, id]);
      }
    } finally {
      bharat.pending.delete(id);
      publish();
    }
    return bharat;
  }

  function headerHTML(active) {
    const count = h('span', { text: String(bharat.ids.length) });
    subscribe(() => { count.textContent = String(bharat.ids.length); });
    return h('header', { class: 'bhead' },
      h('a', { class: 'brand', href: './' }, h('span', { class: 'brand-mark', text: '✦' }), h('span', {}, h('strong', { text: 'Birds of Keoladeo' }), h('small', { text: 'Bharatpur checklist' }))),
      h('nav', {},
        h('a', { href: './', 'aria-current': active === 'list' ? 'page' : null, text: 'Checklist' }),
        h('a', { href: 'identify.html', 'aria-current': active === 'identify' ? 'page' : null, text: '🎙 Identify by sound' }),
        h('a', { href: 'lists.html?id=bharatpur', 'aria-current': active === 'lists' ? 'page' : null }, 'My Bharatpur birds (', count, ')'),
        h('a', { href: '../', text: 'Trip ↗' })));
  }

  // Shows a small notice in #sync-notice (if the page has one) for offline or server errors.
  subscribe(() => {
    const n = document.getElementById('sync-notice');
    if (!n) return;
    const msg = bharat.error || (bharat.offline ? 'Bird server unreachable. Changes are saved on this device only.' : '');
    n.textContent = msg;
    n.hidden = !msg;
  });

  // One bird card for any grid: { href, common, scientific, family, thumb (image URL or null), iucn (code or null) }.
  function birdCard({ href, common, scientific, family, thumb: src, iucn }) {
    const img = h('img', { src: src || PLACEHOLDER, alt: src ? common || '' : '', loading: 'lazy', decoding: 'async', width: 400, height: 300, class: src ? null : 'noph' });
    img.addEventListener('error', () => { img.src = PLACEHOLDER; img.classList.add('noph'); }, { once: true });
    return h('a', { class: 'bcard', href },
      h('div', { class: 'ph' }, img, THREATENED.includes(iucn) ? statusBadge(iucn) : null),
      h('div', { class: 'txt' }, h('strong', { text: common || scientific }), h('span', { class: 'sci', text: scientific || '' }), h('span', { class: 'fam', text: family || '' })));
  }

  window.Birds = { IUCN, THREATENED, PLACEHOLDER, h, loadSpecies, norm, thumb, isRare, safeUrl, iucnCode, statusBadge, headerHTML, api, birdCard, bharat, subscribe, loadBharatpur, toggleBird };
  loadBharatpur();
})();
