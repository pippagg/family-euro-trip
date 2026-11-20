(async function () {
  const { h, thumb, IUCN, PLACEHOLDER, headerHTML, loadSpecies, safeUrl, iucnCode } = Birds;
  document.getElementById('head').replaceWith(headerHTML('list'));
  const main = document.getElementById('main');
  const back = h('p', { class: 'crumbs' }, h('a', { href: './', text: '← All birds' }));
  const fail = (msg) => main.replaceChildren(back, h('p', { class: 'error', text: msg }));

  let all;
  try { all = await loadSpecies(); } catch (e) { return fail('Could not load bird data.'); }
  const id = new URLSearchParams(location.search).get('id');
  const i = all.findIndex((s) => s.id === id);
  if (i < 0) return fail('Bird not found.');
  const s = all[i];
  const iucn = iucnCode(s.status);
  document.title = `${s.common || s.scientific} · Birds of Keoladeo`;

  const sexLabel = { male: 'Male', female: 'Female', juvenile: 'Juvenile' };
  const photos = (s.photos || []).filter((p) => p.url);
  const ordered = [...photos.filter((p) => p.type !== 'map'), ...photos.filter((p) => p.type === 'map')];

  function figure(p) {
    const isMap = p.type === 'map';
    const full = safeUrl(p.full) || p.url;
    const img = h('img', { src: p.url, alt: p.caption || s.common || '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });
    const label = isMap ? 'Range map' : sexLabel[p.sex];
    const src = safeUrl(p.source);
    const credit = [p.credit && `Photo: ${p.credit}`, p.license].filter(Boolean).join(' · ');
    return h('figure', { class: isMap ? 'map' : null },
      h('a', { class: 'ph', href: full, target: '_blank', rel: 'noopener' }, img, label ? h('span', { class: 'badge', text: label }) : null),
      h('figcaption', {}, p.caption ? h('span', { class: 'cap', text: p.caption }) : null,
        credit || src ? [credit, src ? h('a', { href: src, target: '_blank', rel: 'noopener', text: credit ? ' (source)' : 'Source' }) : null] : null));
  }

  const sec = (title, body, wide) => body ? h('section', { class: 'sec' + (wide ? ' wide' : '') }, h('h2', { text: title }), h('p', { text: body })) : null;
  const where = [s.where_found, s.habitat && (s.where_found ? `Habitat: ${s.habitat}` : s.habitat)].filter(Boolean).join('\n\n');
  const whereSec = sec('Where found', where, true);
  if (whereSec) whereSec.querySelector('p').style.whiteSpace = 'pre-line';

  const L = s.links || {};
  const learn = [['bow', 'Birds of the World'], ['ebird', 'eBird'], ['macaulay', 'Macaulay Library'], ['avibase', 'Avibase'], ['wikipedia', 'Wikipedia'], ['xenocanto', 'xeno-canto']]
    .filter(([k]) => safeUrl(L[k])).map(([k, t]) => h('a', { class: 'btn', href: L[k], target: '_blank', rel: 'noopener', text: t + ' ↗' }));

  const nav = (o, dir) => o ? h('a', { href: 'bird.html?id=' + encodeURIComponent(o.id), rel: dir }, h('small', { text: dir === 'prev' ? '← Previous' : 'Next →' }), o.common || o.scientific) : h('span');

  main.replaceChildren(back, h('article', { class: 'detail' },
    h('p', { class: 'eyebrow', text: [s.order, s.family].filter(Boolean).join(' · ') }),
    h('h1', { text: s.common || s.scientific }),
    h('p', { class: 'sub' }, h('span', { class: 'sci', text: s.scientific || '' }), s.local_name ? h('span', { class: 'muted', text: ` · ${s.local_name}` }) : null),
    h('div', { class: 'tags' }, iucn ? h('span', { class: 'badge iucn iucn-' + iucn, text: `IUCN: ${IUCN[iucn]}` }) : null, s.rarity ? h('span', { class: 'badge', text: s.rarity }) : null),
    ordered.length ? h('div', { class: 'gallery' }, ordered.map(figure)) : null,
    h('div', { class: 'sections' },
      sec('Overview', s.summary, true), sec('Male', s.male), sec('Female', s.female), whereSec,
      sec('Size', s.size), sec('IUCN status', iucn && IUCN[iucn]), sec('Local name', s.local_name)),
    learn.length ? h('div', {}, h('p', { class: 'eyebrow', text: 'Learn more' }), h('div', { class: 'learn' }, learn)) : null,
    h('div', { class: 'pn' }, nav(all[i - 1], 'prev'), nav(all[i + 1], 'next'))));
})();
