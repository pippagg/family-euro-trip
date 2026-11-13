const locations = {
  jaipur: {
    name: 'The County Inn · Vaishali Nagar',
    address: '285, Vaishali Marg, Hanuman Nagar, Vaishali Nagar, Jaipur, Rajasthan 302021',
    map: 'https://maps.app.goo.gl/Em7unSCTbvThjQBdA?g_st=ic',
    routeQuery: 'The County Inn, 285 Vaishali Marg, Vaishali Nagar, Jaipur, Rajasthan 302021'
  },
  bharatpur: {
    name: 'Club Mahindra Bharatpur',
    address: '3CV5+RXG, Uchain, Uchchain, Rajasthan 321302',
    map: 'https://maps.app.goo.gl/ePXHBLRifHKAMJ199?g_st=ic',
    routeQuery: '3CV5+RXG Club Mahindra bharatpur, Uchain, Uchchain, Rajasthan 321302'
  },
  ranthambore: {
    name: 'Maa Ashapura Farm Stay',
    address: 'Ranthambhore Road, Kutalpura Maliyan, Sherpur, Rajasthan 322001',
    map: 'https://maps.app.goo.gl/Nxu2yCU94gQg5V9j8?g_st=ic',
    routeQuery: 'Maa Ashapura Farm Stay, Ranthambhore Road, Kutalpura Maliyan, Sherpur, Rajasthan 322001'
  },
  jaipurHome: {
    name: 'Jaipur home',
    address: '26.9133115, 75.7477555',
    map: 'https://maps.app.goo.gl/dZgqQAceR4SWJbwn6?g_st=ic'
  }
};

const drivingDirections = (origin, destination) => {
  const params = new URLSearchParams({ api: '1', origin: origin.routeQuery, destination: destination.routeQuery, travelmode: 'driving' });
  return `https://www.google.com/maps/dir/?${params}`;
};
const carIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 11l1.5-4h11L19 11M4 11h16v6H4zM7 17v2m10-2v2M7 14h.01M17 14h.01"/></svg>';

const events = [
  {
    type: 'flight',
    start: '2026-11-12',
    end: '2026-11-13',
    icon: '✈',
    label: 'International flight · Air India AI 130',
    title: 'London → Mumbai',
    meta: '12 Nov · 20:30 → 13 Nov · 11:40',
    summary: 'Heathrow to Mumbai',
    details: [
      ['Airline', 'Air India · AI 130'],
      ['Departure', 'London · 12 Nov at 20:30'],
      ['Arrival', 'Mumbai · 13 Nov at 11:40'],
      ['Connection', 'Mumbai airport · allow time for transfer'],
      ['Next flight', 'Mumbai → Jaipur · AI 2635'],
      ['Note', 'Times are taken from the supplied itinerary image']
    ],
    map: 'https://www.google.com/maps/search/?api=1&query=Mumbai+International+Airport'
  },
  {
    type: 'flight',
    start: '2026-11-13',
    end: '2026-11-13',
    icon: '✈',
    label: 'Domestic connection · Air India AI 2635',
    title: 'Mumbai → Jaipur',
    meta: '13 Nov · 16:20 → 18:10',
    summary: 'Arrive in Jaipur for five nights',
    details: [
      ['Airline', 'Air India · AI 2635'],
      ['Departure', 'Mumbai · 13 Nov at 16:20'],
      ['Arrival', 'Jaipur International Airport (JAI) · 18:10'],
      ['Stay', 'Jaipur · 13–18 Nov'],
      ['Note', 'Allow for baggage collection and the domestic connection']
    ],
    map: 'https://www.google.com/maps/search/?api=1&query=Jaipur+International+Airport'
  },
  {
    type: 'stay',
    start: '2026-11-13',
    end: '2026-11-18',
    icon: '🏨',
    city: 'Jaipur',
    country: 'Rajasthan, India',
    title: 'Jaipur',
    meta: '13–18 Nov · 5 nights',
    hotel: locations.jaipur.name,
    room: 'Five-night base for exploring Jaipur. Booking reference and check-in details are still to be added.',
    address: locations.jaipur.address,
    home: locations.jaipurHome,
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85',
    about: 'The Pink City combines royal forts, palace courtyards, colourful bazaars and modern cafés. Grouping each day by area keeps driving efficient and leaves time to explore on foot.',
    facts: ['Language · Hindi / English', 'Currency · INR', 'November · warm days, cool evenings'],
    highlights: ['Pink City', 'Amer Fort', 'Royal palaces', 'Local markets'],
    nearby: [
      { name: 'City Palace', type: 'Old City', note: 'Royal courtyards and galleries in the heart of the walled city.', mapQuery: 'City Palace Jaipur' },
      { name: 'Hawa Mahal', type: 'Old City', note: 'Start early for the façade, then explore the nearby lanes and markets.', mapQuery: 'Hawa Mahal Jaipur' },
      { name: 'Amber Fort', type: 'Amer', note: 'Arrive early for the hilltop palace and cooler temperatures.', mapQuery: 'Amber Fort Jaipur' },
      { name: 'Jaigarh Fort', type: 'Amer', note: 'A short uphill drive from Amber with broad views and historic armoury.', mapQuery: 'Jaigarh Fort Jaipur' },
      { name: 'Albert Hall Museum', type: 'Central Jaipur', note: 'A striking Indo-Saracenic museum beside Ram Niwas Garden.', mapQuery: 'Albert Hall Museum Jaipur' },
      { name: 'Jal Mahal', type: 'North Jaipur', note: 'A quick lakeside photo stop on the road to or from Amer.', mapQuery: 'Jal Mahal Jaipur' },
      { name: 'Nahargarh Fort', type: 'Aravalli hills', note: 'Best kept for late afternoon views over the city; allow extra road time.', mapQuery: 'Nahargarh Fort Jaipur' }
    ],
    plans: [
      ['13 Nov', 'Arrive at Jaipur at 18:10, head to the hotel and rest'],
      ['14 Nov · Old City', 'Hawa Mahal early, City Palace, Jantar Mantar, Johari Bazaar and Bapu Bazaar. Sites are clustered within the Pink City; walk between nearby stops.'],
      ['15 Nov · Amer', 'Amber Fort early, Jaigarh Fort, Panna Meena ka Kund and Jal Mahal photo stop. Allow ~30–45 min each way from central Jaipur, plus 15 min between the forts.'],
      ['16 Nov · Central & southern Jaipur', 'Albert Hall Museum, Ram Niwas Garden, Birla Mandir and relaxed shopping around MI Road. Allow ~15–30 min between areas by car.'],
      ['17 Nov · Hills & markets', 'Nahargarh Fort for city views, Gaitore cenotaphs, then a flexible afternoon for cafés, textiles or a return to the Pink City. Allow ~30–45 min up to Nahargarh.']
    ],
    map: locations.jaipur.map
  },
  {
    type: 'transfer',
    start: '2026-11-18',
    end: '2026-11-18',
    icon: carIcon,
    label: 'Personal drive',
    title: 'Jaipur → Bharatpur',
    meta: '18 Nov · ~2h 30m–3h',
    summary: 'Allow extra time for traffic and stops',
    details: [
      ['Leave', 'The County Inn, Jaipur after breakfast'],
      ['Arrive', 'Club Mahindra Bharatpur'],
      ['Route', 'Check the driving directions before setting off'],
      ['Tip', 'Leave early enough to settle in and visit the sanctuary later']
    ],
    map: drivingDirections(locations.jaipur, locations.bharatpur)
  },
  {
    type: 'stay',
    start: '2026-11-18',
    end: '2026-11-20',
    icon: '🏨',
    city: 'Bharatpur',
    country: 'Rajasthan, India',
    title: 'Bharatpur',
    meta: '18–20 Nov · 2 nights',
    hotel: locations.bharatpur.name,
    room: 'Club Mahindra resort · booking and room details TBC',
    address: locations.bharatpur.address,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/002_Asian_green_bee-eaters_in_Keoladeo_National_Park_Photo_by_Giles_Laurent.jpg/1280px-002_Asian_green_bee-eaters_in_Keoladeo_National_Park_Photo_by_Giles_Laurent.jpg',
    imageCredit: 'https://commons.wikimedia.org/wiki/File:002_Asian_green_bee-eaters_in_Keoladeo_National_Park_Photo_by_Giles_Laurent.jpg',
    about: 'Bharatpur is the gateway to Keoladeo National Park, one of India’s best birding landscapes. November is a strong month for migratory birds, so early starts are worthwhile.',
    facts: ['Language · Hindi / English', 'Currency · INR', 'Keoladeo · roughly 7:00–17:30 in November'],
    highlights: ['Bird sanctuary', 'Agra', 'Fatehpur Sikri', 'Wetlands'],
    nearby: [
      { name: 'Keoladeo National Park', type: 'Birding', note: 'Explore by cycle, on foot, e-rickshaw or with a trained local guide. Private cars do not enter the park.', mapQuery: 'Keoladeo National Park Bharatpur' },
      { name: 'Fatehpur Sikri', type: 'Mughal history', note: 'The abandoned imperial city is roughly 45 minutes from Bharatpur.', mapQuery: 'Fatehpur Sikri' },
      { name: 'Taj Mahal', type: 'World heritage', note: 'A long but worthwhile day trip from Bharatpur; check the weekly closure before booking.', mapQuery: 'Taj Mahal Agra' },
      { name: 'Lohagarh Fort', type: 'Local history', note: 'A compact Bharatpur stop if time remains after birding.', mapQuery: 'Lohagarh Fort Bharatpur' }
    ],
    plans: [
      ['18 Nov', 'Drive from Jaipur, check in, then a relaxed late-afternoon orientation at Keoladeo if energy and light allow.'],
      ['19 Nov · Agra loop', 'Early Keoladeo birding, then Bharatpur → Fatehpur Sikri (~45 min), Fatehpur Sikri → Agra (~1h), Taj Mahal visit, and return to Bharatpur (~1h 30m–2h). This is a full, demanding day; confirm Taj opening day and entry in advance.'],
      ['20 Nov', 'Breakfast and check out, then drive to Ranthambore. Allow time for a comfort stop.']
    ],
    map: locations.bharatpur.map
  },
  {
    type: 'transfer',
    start: '2026-11-20',
    end: '2026-11-20',
    icon: carIcon,
    label: 'Personal drive',
    title: 'Bharatpur → Ranthambore',
    meta: '20 Nov · ~4½–5½h',
    summary: 'Allow time for stops along the way',
    details: [
      ['Leave', 'Club Mahindra Bharatpur after breakfast'],
      ['Arrive', 'Maa Ashapura Farm Stay'],
      ['Route', 'Allow a comfort stop and daylight buffer'],
      ['Tip', 'Do not schedule a tight evening safari until the safari zone is confirmed']
    ],
    map: drivingDirections(locations.bharatpur, locations.ranthambore)
  },
  {
    type: 'stay',
    start: '2026-11-20',
    end: '2026-11-24',
    icon: '🏨',
    city: 'Ranthambore',
    country: 'Rajasthan, India',
    title: 'Ranthambore',
    meta: '20–24 Nov · 4 nights',
    hotel: locations.ranthambore.name,
    room: 'Booking reference and room details to be added.',
    address: locations.ranthambore.address,
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1200&q=85',
    about: 'A wildlife-focused finish to the journey, with tiger-reserve safaris and a possible Chambal river excursion. Safari timings and availability should be confirmed before finalising the day plan.',
    facts: ['Language · Hindi / English', 'Currency · INR', 'Safaris · book official slots early'],
    highlights: ['Tiger reserve', 'Jeep safari', 'Chambal River', 'Wildlife'],
    nearby: [
      { name: 'Ranthambore National Park', type: 'Wildlife safari', note: 'Plan morning and/or afternoon jeep or canter safaris through the official booking system.', mapQuery: 'Ranthambore National Park' },
      { name: 'Ranthambore Fort', type: 'History', note: 'A dramatic hill fort inside the wider reserve landscape; check access and timing with your operator.', mapQuery: 'Ranthambore Fort' },
      { name: 'National Chambal Sanctuary', type: 'River safari', note: 'Boat safaris near Dholpur focus on gharials, crocodiles and birdlife. It is a separate day trip, not inside Ranthambore.', mapQuery: 'National Chambal Sanctuary Dholpur' },
      { name: 'Sawai Madhopur', type: 'Local area', note: 'The nearest town for supplies, cafés and the railway station.', mapQuery: 'Sawai Madhopur Rajasthan' }
    ],
    plans: [
      ['20 Nov', 'Arrive from Bharatpur, check in and confirm safari bookings with the resort.'],
      ['21 Nov', 'Morning Ranthambore safari; rest during the hotter middle of the day; optional afternoon safari if booked.'],
      ['22 Nov', 'National Chambal Sanctuary river safari day trip near Dholpur. Allow roughly 2–2½ hours each way from Ranthambore, plus the boat slot; confirm water level, operator and return timing.'],
      ['23 Nov', 'Second dedicated Ranthambore safari day, with a morning or afternoon slot and a flexible reserve/fort visit.'],
      ['24 Nov', 'Final breakfast and departure arrangements TBC. Add the outbound flight or onward transfer when confirmed.']
    ],
    map: locations.ranthambore.map
  }
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateOf = value => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const today = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};
const eventStatus = (event, now) => dateOf(event.end) < now ? 'complete' : dateOf(event.start) <= now && dateOf(event.end) >= now ? 'current' : 'upcoming';
const mapLink = (url, label = 'Open in Google Maps') => `<a class="map-link" href="${url}" target="_blank" rel="noopener">${label} <span>↗</span></a>`;
const formatShortDate = value => {
  const date = dateOf(value);
  return `${String(date.getDate()).padStart(2, '0')} ${monthNames[date.getMonth()]}`;
};
const formatDateRange = (start, end) => start === end ? formatShortDate(start) : `${formatShortDate(start)} - ${formatShortDate(end)}`;
const placeMapLink = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

function travelCard(event, status) {
  return `<details class="timeline-event travel-event ${status}"><summary><span class="event-logo ${event.type}">${event.icon}</span><span class="summary-copy"><small>${event.label}</small><strong>${event.title}</strong><span class="summary-dates">${formatDateRange(event.start, event.end)}</span><span>${event.meta} · ${event.summary}</span></span><span class="chevron">⌄</span></summary><div class="travel-details">${event.details.map(([label, value]) => `<div><small>${label}</small><strong>${value}</strong></div>`).join('')}</div><div class="event-actions">${mapLink(event.map, event.type === 'transfer' ? 'Open driving directions' : 'Open airport map')}</div></details>`;
}

function stayCard(event, status, index) {
  return `<article class="timeline-event city-event ${status}"><button class="city-visual" data-city="${index}" style="background-image:linear-gradient(90deg,rgba(8,31,38,.76),rgba(8,31,38,.08)),url('${event.image}')" aria-label="Open ${event.city} city guide"><span><small>${event.country}</small><strong>${event.city}</strong><em>Discover the city ↗</em></span></button><div class="city-body"><div class="stay-meta"><span class="stay-chip">Stay</span><strong>${event.meta}</strong></div><div class="hotel-summary"><small>${event.city} · Accommodation</small><strong>${event.hotel}</strong><span class="address-container">${event.address}</span>${mapLink(event.map, 'Open stay location')}</div>${event.home ? `<div class="home-address"><small>Home address</small><strong>${event.home.name}</strong><span>${event.home.address}</span>${mapLink(event.home.map, 'Open home location')}</div>` : ''}<details class="hotel-details"><summary class="stay-header">View stay details & daily plans <span class="chevron">⌄</span></summary><div class="hotel-expanded"><p>${event.room}</p><div class="plan-list">${event.plans.map(([date, plan]) => `<div><time>${date}</time><span>${plan}</span></div>`).join('')}</div></div></details>${event.imageCredit ? `<p class="image-credit">Photo: <a href="${event.imageCredit}" target="_blank" rel="noopener">Giles Laurent / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></p>` : ''}</div></article>`;
}

function renderTimeline() {
  const now = today();
  const hidePast = document.querySelector('#hidePast').checked;
  const query = document.querySelector('#searchInput').value.toLowerCase().trim();
  let shown = 0;
  document.querySelector('#timeline').innerHTML = events.map((event, index) => {
    const status = eventStatus(event, now);
    const searchable = `${event.type} ${event.label || ''} ${event.title} ${event.hotel || ''} ${event.address || ''} ${event.home?.name || ''} ${event.summary || ''} ${(event.plans || []).flat().join(' ')} ${(event.nearby || []).map(place => `${place.name} ${place.note}`).join(' ')}`.toLowerCase();
    const hidden = (hidePast && status === 'complete') || (query && !searchable.includes(query));
    if (!hidden) shown++;
    return `<div class="timeline-row ${status}" ${hidden ? 'hidden' : ''}>${event.type === 'stay' ? stayCard(event, status, index) : travelCard(event, status)}</div>`;
  }).join('');
  document.querySelector('#emptyState').hidden = shown > 0;
  document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => openCity(Number(button.dataset.city))));
  updateStatus(now);
}

function updateStatus(now) {
  const next = events.find(event => dateOf(event.end) >= now);
  const completed = events.filter(event => dateOf(event.end) < now).length;
  const current = events.find(event => eventStatus(event, now) === 'current');
  const percent = Math.round(completed / events.length * 100);
  const nextDetails = next?.meta.split(' · ').slice(1).join(' · ');
  document.querySelector('#todayLabel').textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  document.querySelector('#status-title').textContent = current ? `Now: ${current.title}` : now < dateOf(events[0].start) ? 'The adventure begins soon' : 'Journey complete';
  document.querySelector('#nextUp').textContent = next?.title || 'Journey complete';
  document.querySelector('#nextUpDate').textContent = next ? `${formatDateRange(next.start, next.end)}${nextDetails ? ` · ${nextDetails}` : ''}` : 'Until next time';
  document.querySelector('#progressLabel').textContent = `${percent}% complete`;
  document.querySelector('#progressBar').style.width = `${percent}%`;
}

function openCity(index) {
  const city = events[index];
  document.querySelector('#dialogImage').style.backgroundImage = `url('${city.image}')`;
  document.querySelector('#dialogCountry').textContent = city.country;
  document.querySelector('#dialogTitle').textContent = city.city;
  document.querySelector('#dialogDates').textContent = `${formatDateRange(city.start, city.end)} · Staying at ${city.hotel}`;
  document.querySelector('#dialogAbout').textContent = city.about;
  document.querySelector('#dialogFacts').innerHTML = city.facts.map(fact => {
    const [label, value] = fact.split(' · ');
    return `<span class="fact-bubble"><strong>${label}:</strong> ${value}</span>`;
  }).join('');
  document.querySelector('#dialogHighlights').innerHTML = `<small>Worth knowing</small><div class="highlights-wrap">${city.highlights.map(item => `<span>${item}</span>`).join('')}</div>`;
  document.querySelector('#dialogPlaces').innerHTML = city.nearby.map(place => `<article class="place-card"><div><small>${place.type}</small><strong>${place.name}</strong><p>${place.note}</p></div><a href="${placeMapLink(place.mapQuery)}" target="_blank" rel="noopener" class="place-link">Open map ↗</a></article>`).join('');
  document.querySelector('#dialogMap').href = city.map;
  document.querySelector('#cityDialog').showModal();
}

document.querySelector('#searchInput').addEventListener('input', renderTimeline);
document.querySelector('#hidePast').addEventListener('change', renderTimeline);
document.querySelector('.dialog-close').addEventListener('click', () => document.querySelector('#cityDialog').close());
document.querySelector('#cityDialog').addEventListener('click', event => {
  if (event.target.id === 'cityDialog') event.target.close();
});
document.querySelector('#shareButton').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    toast('Itinerary link copied');
  } catch {
    toast('Copy the page address to share');
  }
});

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  setTimeout(() => element.classList.remove('visible'), 2500);
}

renderTimeline();
