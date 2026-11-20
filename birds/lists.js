(async function () {
  const { h, headerHTML, loadSpecies, toggleBird, subscribe, bharat, thumb, iucnCode, birdCard } = Birds;
  document.getElementById('head').replaceWith(headerHTML('lists'));
  const main = document.getElementById('main');
  let all;
  try { all = await loadSpecies(); } catch (e) {
    main.replaceChildren(h('p', { class: 'error', text: 'Could not load bird data. Please retry.' }));
    return;
  }
  const byId = new Map(all.map((s) => [s.id, s]));
  const plural = (n) => `${n} bird${n === 1 ? '' : 's'}`;

  function card(s) {
    const c = birdCard({ href: 'bird.html?id=' + encodeURIComponent(s.id), common: s.common, scientific: s.scientific, family: s.family, thumb: thumb(s), iucn: iucnCode(s.status) });
    const name = s.common || s.scientific;
    const remove = h('button', { class: 'pick', type: 'button', 'aria-pressed': 'true', 'aria-label': `Remove ${name} from My Bharatpur birds`, text: '✓', disabled: bharat.pending.has(s.id), onclick: () => toggleBird(s.id) });
    return h('div', { class: 'bwrap sel' }, c, remove);
  }

  function render() {
    const birds = bharat.ids.map((id) => byId.get(id)).filter(Boolean);
    const n = birds.length;
    main.replaceChildren(
      h('section', { class: 'lhead' },
        h('div', {},
          h('p', { class: 'eyebrow', text: 'Keoladeo National Park' }),
          h('h1', { text: 'My Bharatpur birds' }),
          h('p', { class: 'muted', text: n ? `${plural(n)} · tap ✓ to remove` : 'Nothing here yet.' }))),
      n
        ? h('div', { class: 'grid' }, birds.map(card))
        : h('p', { class: 'empty' }, 'Tap + on any bird in the ', h('a', { href: 'index.html', text: 'checklist' }), ' to add it here.'));
  }

  subscribe(render);
  render();
  Birds.loadBharatpur();
})();

