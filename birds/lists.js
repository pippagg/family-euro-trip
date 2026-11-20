(async function () {
  const { h, api, birdCard, headerHTML } = Birds;
  document.getElementById('head').replaceWith(headerHTML('lists'));
  const main = document.getElementById('main');
  const id = new URLSearchParams(location.search).get('id');
  const plural = (n) => `${n} bird${n === 1 ? '' : 's'}`;
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const errorP = (msg) => h('p', { class: 'error', text: msg });

  async function showList(listId) {
    let list;
    try { list = await api('/lists/' + encodeURIComponent(listId)); } catch (e) {
      const notFound = e.status === 404;
      return main.replaceChildren(
        h('p', { class: 'crumbs' }, h('a', { href: 'lists.html', text: '← All saved lists' })),
        notFound ? h('p', { class: 'empty', text: 'This list no longer exists.' }) : errorP(e.message));
    }
    document.title = `${list.name} · Birds of Keoladeo`;
    const status = h('p', { class: 'status err', role: 'status' });
    const del = h('button', { class: 'btn danger', type: 'button', text: 'Delete list' });
    del.addEventListener('click', async () => {
      if (!confirm(`Delete “${list.name}”? This can't be undone.`)) return;
      del.disabled = true;
      status.textContent = '';
      try {
        await api('/lists/' + encodeURIComponent(list.id), { method: 'DELETE' });
        location.href = 'lists.html';
      } catch (e) {
        status.textContent = e.message;
        del.disabled = false;
      }
    });
    const shown = list.birds.length;
    main.replaceChildren(
      h('p', { class: 'crumbs' }, h('a', { href: 'lists.html', text: '← All saved lists' })),
      h('section', { class: 'lhead' },
        h('div', {},
          h('p', { class: 'eyebrow', text: 'Saved list' }),
          h('h1', { text: list.name }),
          h('p', { class: 'muted', text: `${plural(list.count)} · saved ${fmtDate(list.created_at)}` + (shown < list.count ? ` · ${shown} still in the checklist` : '') })),
        h('div', { class: 'lactions' }, del)),
      status,
      shown
        ? h('div', { class: 'grid' }, list.birds.map((b) => birdCard({ href: b.bird_url, common: b.common, scientific: b.scientific, family: b.family, thumb: b.photo })))
        : h('p', { class: 'empty', text: 'None of the birds in this list are in the current checklist.' }));
  }

  async function showAll() {
    main.replaceChildren(h('section', { class: 'lhead' },
      h('div', {}, h('p', { class: 'eyebrow', text: 'Bird lists' }), h('h1', { text: 'Saved lists' }),
        h('p', { class: 'muted', text: 'Lists saved from the checklist.' }))));
    let lists;
    try { lists = await api('/lists'); } catch (e) {
      return main.append(errorP(e.message));
    }
    if (!lists.length) {
      return main.append(h('p', { class: 'empty' }, 'No saved lists yet. Tick birds on the ',
        h('a', { href: 'index.html', text: 'checklist' }), ' and press “Save list”.'));
    }
    main.append(h('div', { class: 'lists' }, lists.map((l) => h('a', { class: 'lcard', href: 'lists.html?id=' + encodeURIComponent(l.id) },
      h('div', {}, h('strong', { text: l.name }), h('small', { text: `${plural(l.count)} · ${fmtDate(l.created_at)}` })),
      h('span', { class: 'arrow', 'aria-hidden': 'true', text: '›' })))));
  }

  if (id) await showList(id); else await showAll();
})();
