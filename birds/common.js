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

  function headerHTML(active) {
    return h('header', { class: 'bhead' },
      h('a', { class: 'brand', href: './' }, h('span', { class: 'brand-mark', text: '✦' }), h('span', {}, h('strong', { text: 'Birds of Keoladeo' }), h('small', { text: 'Bharatpur checklist' }))),
      h('nav', {},
        h('a', { href: './', 'aria-current': active === 'list' ? 'page' : null, text: 'Checklist' }),
        h('a', { href: 'identify.html', 'aria-current': active === 'identify' ? 'page' : null, text: '🎙 Identify by sound' }),
        h('a', { href: '../', text: 'Trip ↗' })));
  }

  window.Birds = { IUCN, THREATENED, PLACEHOLDER, h, loadSpecies, norm, thumb, isRare, safeUrl, iucnCode, statusBadge, headerHTML };
})();
