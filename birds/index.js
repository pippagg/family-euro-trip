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
    const pick = h('button', { class: 'pick', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Select ' + (s.common || s.scientific), text: '+', onclick: () => toggle(s.id) });
    return h('div', { class: 'bwrap' }, c, pick);
  }
  const cards = new Map();

  // Selection persists across visits in localStorage.
  const SEL_KEY = 'birds-selected';
  const byId = new Map(all.map((s) => [s.id, s]));
  let selected = new Set();
  try { selected = new Set(JSON.parse(localStorage.getItem(SEL_KEY) || '[]').filter((id) => byId.has(id))); } catch (e) { /* ignore corrupt value */ }
  const picks = $('picks'), pickCount = $('pickCount'), saveForm = $('saveForm'), listName = $('listName');
  const saveBtn = $('saveBtn'), pickMsg = $('pickMsg');

  function persistSelection() {
    try { localStorage.setItem(SEL_KEY, JSON.stringify([...selected])); } catch (e) { /* storage unavailable */ }
  }
  function setMsg(node, err) {
    pickMsg.className = 'msg' + (err ? ' err' : '');
    pickMsg.replaceChildren(...[].concat(node));
  }
  function syncPicks() {
    cards.forEach((wrap, id) => {
      const on = selected.has(id);
      wrap.classList.toggle('sel', on);
      const b = wrap.querySelector('.pick');
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? '✓' : '+';
    });
    const n = selected.size;
    picks.hidden = n === 0;
    document.body.classList.toggle('has-picks', n > 0);
    pickCount.textContent = `${n} selected`;
  }
  function toggle(id) {
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    persistSelection();
    syncPicks();
    if (!selected.size) setMsg([]);
  }
  $('clearPicks').addEventListener('click', () => {
    selected.clear();
    persistSelection();
    syncPicks();
    setMsg([]);
  });
  saveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = listName.value.trim();
    if (!name) { setMsg('Give the list a name first.', true); listName.focus(); return; }
    if (!selected.size) return;
    saveBtn.disabled = true;
    setMsg('Saving…');
    try {
      const created = await Birds.api('/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bird_ids: [...selected] }),
      });
      listName.value = '';
      setMsg([`Saved “${created.name}”. `, h('a', { href: 'lists.html?id=' + encodeURIComponent(created.id), text: 'View list →' })]);
    } catch (err) {
      setMsg(err.message, true);
    } finally {
      saveBtn.disabled = false;
    }
  });

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
