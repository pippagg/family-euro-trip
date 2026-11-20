(async function () {
  const { h, norm, thumb, isRare, THREATENED, headerHTML, loadSpecies, iucnCode } = Birds;
  document.getElementById('head').replaceWith(headerHTML('list'));
  const $ = (id) => document.getElementById(id);
  const grid = $('grid');
  let all;
  try { all = await loadSpecies(); } catch (e) { $('count').textContent = ''; grid.replaceWith(h('p', { class: 'error', text: 'Could not load bird data. Please retry.' })); return; }

  all.forEach((s, i) => {
    s._i = i;
    s._iucn = iucnCode(s.status);
    s._hay = norm([s.common, s.scientific, s.local_name, s.family, s.order].filter(Boolean).join(' '));
    s._words = [...new Set(s._hay.split(/[\s\-\/(),]+/).filter(Boolean))];
    s._az = norm(s.common || s.scientific);
    s._male = (s.photos || []).some((p) => p.sex === 'male' && p.type !== 'map');
    s._female = (s.photos || []).some((p) => p.sex === 'female' && p.type !== 'map');
  });

  const orders = [...new Set(all.map((s) => s.order).filter(Boolean))];
  for (const o of orders) $('order').append(h('option', { value: o, text: o }));

  function lev1(a, b) { // true when edit distance <= 1
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  function matches(s, tokens) {
    return tokens.every((t) => s._hay.includes(t) || (t.length >= 4 && s._words.some((w) => lev1(t, w.slice(0, t.length)) || lev1(t, w))));
  }
  function score(s, tokens) { // prefer prefix/word-start matches
    let n = 0;
    for (const t of tokens) n += s._words.some((w) => w.startsWith(t)) ? 0 : 1;
    return n;
  }

  const params = new URLSearchParams(location.search);
  const el = { q: $('q'), order: $('order'), rarity: $('rarity'), sort: $('sort'), threat: $('threat'), male: $('male'), female: $('female') };
  el.q.value = params.get('q') || '';
  el.order.value = params.get('order') || '';
  if (el.order.value !== (params.get('order') || '')) el.order.value = '';
  el.rarity.value = params.get('rarity') || '';
  el.sort.value = params.get('sort') || '';
  el.threat.checked = params.get('threatened') === '1';
  el.male.checked = params.get('male') === '1';
  el.female.checked = params.get('female') === '1';

  function card(s) {
    const c = Birds.birdCard({ href: 'bird.html?id=' + encodeURIComponent(s.id), common: s.common, scientific: s.scientific, family: s.family, thumb: thumb(s), iucn: s._iucn });
    const pick = h('button', { class: 'pick', type: 'button', 'aria-pressed': 'false', text: '+', onclick: () => Birds.toggleBird(s.id) });
    return h('div', { class: 'bwrap', 'data-name': s.common || s.scientific }, c, pick);
  }
  const cards = new Map();

  // Shows which cards are in the shared Bharatpur list (state comes from common.js).
  function syncPicks() {
    cards.forEach((wrap, id) => {
      const on = Birds.bharat.ids.includes(id);
      const b = wrap.querySelector('.pick');
      wrap.classList.toggle('sel', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + wrap.dataset.name + (on ? ' from' : ' to') + ' My Bharatpur birds');
      b.textContent = on ? '✓' : '+';
      b.disabled = Birds.bharat.pending.has(id);
    });
  }
  Birds.subscribe(syncPicks);

  function render() {
    const raw = el.q.value.trim();
    const tokens = norm(raw).split(/\s+/).filter(Boolean);
    let list = all.filter((s) =>
      (!el.order.value || s.order === el.order.value) &&
      (!el.threat.checked || THREATENED.includes(s._iucn)) &&
      (!el.male.checked || s._male) && (!el.female.checked || s._female) &&
      (!el.rarity.value || (el.rarity.value === 'rare' ? isRare(s) : !isRare(s))) &&
      (!tokens.length || matches(s, tokens)));
    if (el.sort.value === 'az') list.sort((a, b) => a._az.localeCompare(b._az));
    else if (tokens.length) list.sort((a, b) => score(a, tokens) - score(b, tokens) || a._i - b._i);
    const frag = document.createDocumentFragment();
    for (const s of list) {
      let c = cards.get(s.id);
      if (!c) cards.set(s.id, (c = card(s)));
      frag.append(c);
    }
    grid.replaceChildren(frag);
    syncPicks();
    $('count').textContent = list.length === all.length ? `${all.length} species` : `${list.length} of ${all.length} species`;
    $('empty').hidden = list.length > 0;
    $('clear').hidden = !raw;
    const p = new URLSearchParams();
    if (raw) p.set('q', raw);
    if (el.order.value) p.set('order', el.order.value);
    if (el.rarity.value) p.set('rarity', el.rarity.value);
    if (el.sort.value) p.set('sort', el.sort.value);
    if (el.threat.checked) p.set('threatened', '1');
    if (el.male.checked) p.set('male', '1');
    if (el.female.checked) p.set('female', '1');
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  let t;
  el.q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 60); });
  for (const k of ['order', 'rarity', 'sort', 'threat', 'male', 'female']) el[k].addEventListener('change', render);
  $('clear').addEventListener('click', () => { el.q.value = ''; render(); el.q.focus(); });
  render();
})();
