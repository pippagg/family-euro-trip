window.AMER = {
  overview:
    "Amer (Amber) Fort is a hilltop palace-fort of red sandstone and marble above Maota Lake, 11 km from Jaipur, Rajasthan. " +
    "It was the Kachwaha Rajput capital from the 11th century until 1727, when Sawai Jai Singh II moved the court to the new city of Jaipur. " +
    "Raja Man Singh I completed the oldest palace in 1599; Mirza Raja Jai Singh I expanded it through the 17th century. " +
    "It is part of the UNESCO World Heritage 'Hill Forts of Rajasthan' (2013) and is linked to Jaigarh Fort above it by a hidden passage.",

  prep: [
    { icon: "🕗", title: "Go early", text: "Aim to be at the gate soon after it opens (around 8:00 am). The courtyards are calmer, the light is golden and the stone is still cool." },
    { icon: "🥾", title: "Walk or jeep up", text: "The climb is a stone ramp of roughly 10–15 minutes. Jeeps run up to the gate; elephant rides are widely considered unkind to the animals, so we suggest skipping them." },
    { icon: "🎟️", title: "Tickets & guides", text: "Tickets and audio guides are sold near the entrance. Prices and hours change, so confirm on the day. Foreign-visitor tickets cost noticeably more than Indian ones." },
    { icon: "💧", title: "Pack light", text: "Bring water, sun protection and shoes with grip. The floors are polished stone and the stairs are steep. Remove shoes at the temple." },
    { icon: "🌇", title: "Stay for the evening", text: "An evening sound-and-light show is usually held at the fort after dusk. Check the schedule and ticket at the counter." }
  ],

  stops: [
    {
      id: "maota", zone: "The Approach", num: 1, minutes: 10,
      title: "Maota Lake", subtitle: "Where the fort first appears",
      img: "img/maota.jpg", pos: "50% 60%",
      teaser: "Stand at the water's edge and watch a palace float above its own reflection.",
      story: [
        "Every great entrance is a performance, and Amer’s begins at the water. Before you climb a single step, stop at the shore of Maota Lake and let the fort reveal itself: honey-coloured walls stacked up the hillside, towers catching the sun, and a perfect twin hanging upside down in the still water.",
        "This was never just scenery. The lake was the main source of water for the palace, and its calm surface was the first thing a visiting prince, merchant or enemy scout would have seen. The Rajputs understood that power looks best when it is reflected.",
        "Look for the small garden island out on the water. Known as Kesar Kyari Bagh, its name refers to saffron flowerbeds. Then lift your eyes above the fort to the ridge, where a second, grimmer fortress watches over everything. That is Jaigarh, and we will meet it again at the end."
      ],
      lookFor: ["The mirror-image reflection on calm mornings", "The garden island in the lake", "Jaigarh Fort on the ridge high above the palace"],
      facts: ["Maota is said to take its name from the large trees (‘mahavata’) that once grew by the water.", "Amer sits at the mouth of a rocky gorge in the Aravalli hills, which made it easy to defend."],
      tip: "Morning light from behind you makes the best photos. By midday the haze flattens the colours.",
      next: "From the lakeside, follow the crowd up the stone ramp (or take a jeep) towards the large gate on the hill. The gate is the first checkpoint on the ascent.",
      mapQ: "Maota Lake Amer Fort Jaipur"
    },
    {
      id: "ascent", zone: "The Approach", num: 2, minutes: 15,
      title: "The Ramp & the Ramparts", subtitle: "A climb the kings made long on purpose",
      img: "img/ascent.jpg", pos: "50% 55%",
      teaser: "Cobbled switchbacks, watchtowers and the town spread out below.",
      story: [
        "The path to the palace is deliberately slow. Wide cobbled ramps zigzag up the slope under high ramparts, and every bend gives a defender above a clear line of sight on anyone below. A visitor was meant to feel the fort’s height in his legs before he ever saw its king.",
        "Today the ramp is a gentle pilgrimage of its own. Stop at a bend and look back: the roofs and temple spires of Amer town unfold beneath you, with the mountains folding behind them. The town has dozens of temples (eighteen Hindu temples, three Jain temples and three mosques), built over centuries, many by the queen mothers of the court.",
        "Notice how the fort walls do not stand alone. They climb along the ridgelines like a stone serpent, joining the palace to the hilltop fortress above. Amer was never a single building. It was a whole mountain turned into a machine for safety and ceremony."
      ],
      lookFor: ["Bastions and watch-posts that cover each ramp bend", "The cobbles, laid so horses and elephants could climb", "Amer town’s temple spires in the valley"],
      facts: ["The fort is built of red sandstone and white marble, a mix common to Rajput–Mughal architecture.", "Amer was ruled by the Kachwaha dynasty from the 11th century until the capital moved to Jaipur in 1727."],
      tip: "Take the climb slowly and use the bends as photo stops. Please keep clear of animals on the ramp.",
      next: "At the top of the ramp you reach the large east-facing gate, the Suraj Pol (Sun Gate).",
      mapQ: "Amer Fort ramp Jaipur"
    },
    {
      id: "suraj", zone: "The Approach", num: 3, minutes: 5,
      title: "Suraj Pol — the Sun Gate", subtitle: "The ceremonial front door",
      img: "img/suraj.jpg", pos: "35% 40%",
      teaser: "The gate that faces the sunrise, built for victory parades.",
      story: [
        "This is the main entrance, and its name says it all: Suraj Pol, the Sun Gate. It faces east, so that at dawn the first rays of the day pour straight through its arch. For a dynasty that traced its line to the Sun, that was no accident.",
        "Imagine the scene when the army came home from war. Drums, banners and war-booty in a long procession, rolling through this gate into the great courtyard beyond. Royal cavalcades and honoured guests used the same door, and it was always kept under guard.",
        "Walk through it slowly. The gate is angled so that no battering ram can charge in a straight line. You pass from the harsh open slope into a shaded passage, then out again into a vast square of golden light."
      ],
      lookFor: ["The sun-facing orientation: try this at morning", "The thick walls and bent approach", "Guard rooms beside the passage"],
      facts: ["Pol (or pole) is the Rajasthani word for a gate.", "A matching gate on the western side of the fort, the Chand Pol (Moon Gate), is the town-side entrance."],
      tip: "Buy your ticket or audio guide near here before heading into the courtyard.",
      next: "Step through the arch and out into the large open square: Jaleb Chowk.",
      mapQ: "Suraj Pol Amer Fort Jaipur"
    },
    {
      id: "jaleb", zone: "Courtyard I", num: 4, minutes: 12,
      title: "Jaleb Chowk", subtitle: "The courtyard of soldiers and stables",
      img: "img/jaleb.jpg", pos: "50% 50%",
      teaser: "A parade ground where an army once drilled beneath the queens’ windows.",
      story: [
        "You have entered the first courtyard, and it is enormous on purpose. ‘Jaleb’ comes from an Arabic word for a place where soldiers assemble, and that is exactly what this square was: the parade ground of the palace.",
        "Here the Maharaja’s bodyguards drilled under their commander, the Fauj Bakshi, while the ruler inspected the ranks. Horses were stabled along the sides with the guards’ rooms above them. Victory processions also ended here, with the spoils of war paraded across these stones.",
        "Look up at the walls of the upper floors. Behind the latticed stone windows, the royal women watched the spectacle unseen. They could see everything, but nobody could see them. It is the first hint of a theme you will meet again and again in Amer: the architecture of privacy."
      ],
      lookFor: ["Latticed (jali) windows overlooking the square", "Stable arcades along the sides", "The grand staircase at the far end"],
      facts: ["The word ‘Jaleb’ is of Arabic origin, a reminder of the strong Persian and Mughal influence at court.", "Amer has six main sections, each with its own gate and courtyard. This is the first."],
      tip: "This is the busiest square. If you are with children, agree on a meeting point before exploring.",
      next: "Look to the right of the big staircase for the small temple with a silver door: the Shila Devi temple.",
      mapQ: "Jaleb Chowk Amer Fort"
    },
    {
      id: "shila", zone: "Courtyard I", num: 5, minutes: 10,
      title: "Shila Devi Temple", subtitle: "The goddess who came from the sea",
      img: "img/shila.jpg", pos: "50% 40%",
      teaser: "A silver-doored shrine tied to a dream, a battle and a stone slab.",
      story: [
        "Tucked beside the stairs is one of the most beloved shrines in Rajasthan. Its double doors are covered in silver, carved in raised relief, and the goddess inside is flanked by two silver lions. Her name is Shila Devi, the Goddess of the Stone Slab.",
        "The legend goes like this. Before a campaign against the ruler of Jessore in Bengal, Raja Man Singh prayed to the goddess Kali for victory. She appeared in a dream and told him to recover her image from the seabed and worship it. After winning in 1604, he did, and the idol was carved from a single stone slab.",
        "A second story says Man Singh was given a black stone slab once linked, in tradition, to the epic Mahabharata, and gave back the conquered kingdom in exchange. Whichever story you prefer, the kings of Amer prayed here for centuries before every major decision."
      ],
      lookFor: ["The embossed silver doors", "A Ganesha carved from a single piece of coral at the entrance", "Marigold offerings and the sound of bells"],
      facts: ["The Kachwaha kings prayed to Shila Devi until the 20th century. Animal sacrifice once marked Navaratri here, but today the offerings are vegetarian only.", "Jessore is now in Bangladesh."],
      tip: "Remove your shoes and be quiet. Photography inside the sanctum is usually not allowed, so look for the signs.",
      next: "Climb the broad stairway beside the temple to the Singh Pol (Lion Gate) and the pillared hall beyond.",
      mapQ: "Shila Mata Temple Amer Fort Jaipur"
    },
    {
      id: "diwan", zone: "Courtyard II", num: 6, minutes: 12,
      title: "Singh Pol & Diwan-i-Aam", subtitle: "Where a king listened to his people",
      img: "img/diwan.jpg", pos: "50% 30%",
      teaser: "A zig-zag Lion Gate and a hall of 27 columns topped with elephants.",
      story: [
        "At the top of the stairs you pass through the Lion Gate, the Singh Pol. Its path is deliberately zig-zag, a defensive trick so any intruder who got this far had to turn and slow down under the eyes of the guards. Its frescoes remind you, though, that even defence was meant to be beautiful here.",
        "Beyond it is the Diwan-i-Aam, the Hall of Public Audience. It is a raised platform of two rows of pillars, 27 colonnades in all, and many of the capitals are carved as elephant heads. On days of audience, subjects could bring petitions, complaints and gifts to the Raja under this open roof.",
        "Stand where the common petitioner stood and look at the pillars. They support the roof, yes, but they also say something about the ruler: here sits a king strong enough to carry elephants on his shoulders, and generous enough to open his hall to anyone with a grievance."
      ],
      lookFor: ["The sharp bend in the Lion Gate’s passage", "Elephant-shaped capitals on the pillars", "The raised platform where the Raja sat", "The terrace beyond with views of the lake"],
      facts: ["The Diwan-i-Aam’s design shows strong Mughal influence, with open pillared halls resembling those at Mughal courts.", "Open-sided halls like this stay naturally cool, since the breeze flows through."],
      tip: "A great spot for a photo with the lake and the garden island behind the pillars.",
      next: "Head for the tall, ornate three-storey gate at the end of the court: the Ganesh Pol.",
      mapQ: "Diwan-i-Aam Amer Fort Jaipur"
    },
    {
      id: "ganesh", zone: "Courtyard III", num: 7, minutes: 8,
      title: "Ganesh Pol", subtitle: "The gate to the private palace",
      img: "img/ganesh.jpg", pos: "50% 18%",
      teaser: "Painted, mosaiced and watched over by the remover of obstacles.",
      story: [
        "Now the mood changes. Until here the fort was public; beyond this gate it is the Maharaja’s home. The Ganesh Pol is the doorway, and many consider it the most beautiful gate in all of Rajasthan. It rises in three levels, covered in frescoes, mosaics and sculpted detail, commissioned by Mirza Raja Jai Singh I in the 17th century.",
        "Ganesha, the remover of obstacles, sits above it, blessing everyone who passes. The Rajputs believed that a guest who enters under his gaze will meet no barrier on the other side.",
        "Look up. High above the arch is the Suhag Mandir, a small pavilion with marble lattice windows. From here the ladies of the royal family watched ceremonies in the hall below. They were part of every celebration, yet hidden from the crowd."
      ],
      lookFor: ["Painted floral frescoes and mosaic work", "Ganesha above the arch", "The lattice windows of the Suhag Mandir above"],
      facts: ["Mirza Raja Jai Singh I served the Mughal emperors and became one of the most powerful Rajput rulers of the 17th century.", "Passing through a Ganesh gate is considered auspicious, so many visitors pause for a moment before stepping through."],
      tip: "Step back to the middle of the court to take in the whole facade, then walk through slowly.",
      next: "Pass through the gate into the walled garden courtyard, with the mirror palace on the left and a pavilion on the right.",
      mapQ: "Ganesh Pol Amer Fort Jaipur"
    },
    {
      id: "charbagh", zone: "Courtyard III", num: 8, minutes: 12,
      title: "The Charbagh & Sukh Niwas", subtitle: "A garden and a palace with natural air-conditioning",
      img: "img/ganesh.jpg", pos: "50% 85%",
      teaser: "A hexagonal Mughal-style garden and the Hall of Pleasure, cooled by running water.",
      story: [
        "In the middle of the courtyard lies a sunken garden laid out in the Persian-Mughal charbagh style, a hexagonal bed with narrow marble-lined channels, a star-shaped pool and a fountain at the centre. It was built under Mirza Raja Jai Singh I, a ruler who admired the gardens of the Mughal court.",
        "Look to the right, to the building opposite the mirror palace. This is the Sukh Niwas, the Hall of Pleasure. You enter through a sandalwood door. Inside, a channel of water runs through the room and spills out into the garden. Water drawn from the lake flows over carved niches, and the evaporation cools the air.",
        "In a land where summer pushes past forty degrees, this was a genius cooling system: a palace that lowered its own temperature, long before electricity. The royal family retreated here in the hottest months, and the sound of running water was part of the luxury."
      ],
      lookFor: ["The hexagonal sunken garden and star-shaped pool", "The water channel running through the Sukh Niwas", "Chini-khana niches (small arched recesses) in the walls", "The sandalwood doors"],
      facts: ["The word charbagh means ‘four gardens’, a layout inspired by Persian gardens, symbolising the four rivers of paradise.", "Water for the garden flows in a cascade from both the Sukh Niwas and the terrace of the Jai Mandir."],
      tip: "Stand inside the Sukh Niwas and notice the drop in temperature. That is the water channel working.",
      next: "Cross the garden to the mirror palace on the left, the Jai Mandir, better known as the Sheesh Mahal.",
      mapQ: "Sukh Niwas Amer Fort Jaipur"
    },
    {
      id: "sheesh", zone: "Courtyard III", num: 9, minutes: 15,
      title: "Sheesh Mahal — the Mirror Palace", subtitle: "A jewel box lit by a few candles",
      img: "img/sheesh.jpg", pos: "50% 55%",
      teaser: "Thousands of tiny mirrors turn one flame into a night sky.",
      story: [
        "Step inside the Jai Mandir and the walls and ceiling suddenly glitter. This is the Sheesh Mahal, the Palace of Mirrors, and it is Amer’s most famous room. Panels of tiny convex mirrors, backed with coloured foil and paint, are set into the plaster in swirling patterns of flowers and stars.",
        "The design had a purpose beyond beauty. In an age lit only by oil lamps and candles, a handful of flames would be multiplied by hundreds of mirrors, so the whole chamber shimmered like a night sky. Guides still love to show it: lights go down, one small flame is lit, and the ceiling blooms into stars.",
        "Look past the mirrors to the marble below, and to the open arches that frame views of Maota Lake. The hall was a private retreat for the Maharaja, a place to rest, receive close guests and watch the lake light fade into evening."
      ],
      lookFor: ["Convex mirror mosaics in the ceiling", "Carved marble relief panels on the lower walls", "Arches that frame the lake view"],
      facts: ["The mirror work was neglected for decades in the 1970s and 80s and has been restored in stages since.", "The convex shape of the mirrors helps spread each reflection across a wider area."],
      tip: "Don’t touch the glasswork, and avoid flash. Be patient; a guide’s flame demo is worth a short wait.",
      next: "Look at the lower part of the pillars just outside. One carved panel hides a famous trick: the Magic Flower.",
      mapQ: "Sheesh Mahal Amer Fort Jaipur"
    },
    {
      id: "magic", zone: "Courtyard III", num: 10, minutes: 5,
      title: "The Magic Flower", subtitle: "One carving, seven secrets",
      img: "img/magic.jpg", pos: "50% 40%",
      teaser: "Cover part of a marble panel and a new creature appears.",
      story: [
        "Craftsmen of Amer loved a riddle. At the base of one pillar near the Mirror Palace is a small marble panel of two butterflies hovering above a flower. It looks sweet and simple. But try this: cover parts of the carving with your hand, and the ‘flower’ changes into something else.",
        "Tradition counts seven different shapes: a fish’s tail, a lotus, a hooded cobra, an elephant’s trunk, a lion’s tail, an ear of corn and a scorpion. Each one is revealed by hiding a different part of the same carving.",
        "It is a small thing, but it shows you the skill of the sculptors here, who could hide seven pictures inside one. Don’t rush by. Take a minute, find the panel and test it yourself."
      ],
      lookFor: ["Two butterflies above a flower at the base of a pillar", "Cover the parts with your hand to reveal the shapes", "How many of the seven can you find?"],
      facts: ["Local guides will happily point out the exact pillar if you ask.", "If you can’t find the panel, ask a guide or an attendant to show you."],
      tip: "A fun challenge for kids: see who can find the most shapes first.",
      next: "Take the stairs up above the mirror palace to the Jas Mandir terrace.",
      mapQ: "Amer Fort Magic Flower carving"
    },
    {
      id: "jas", zone: "Courtyard III", num: 11, minutes: 10,
      title: "Jas Mandir", subtitle: "The private audience hall with a view",
      img: "img/jas.jpg", pos: "50% 45%",
      teaser: "A hall of lattice, glass flowers and cool breezes above the lake.",
      story: [
        "Climb the stairs above the Mirror Palace and you arrive at the Jas Mandir, the Hall of Private Audience (Diwan-i-Khas). If the public hall below was for petitioners, this was for ministers, nobles and honoured guests: serious conversations in a very beautiful room.",
        "The walls bloom with floral glass inlay and delicate alabaster relief. Marble lattice windows let in a soft light and a breeze, while hiding anyone behind them. Through the stone screens you glimpse Maota Lake far below, framed like a painting.",
        "Here the Maharaja would have heard reports, held discreet meetings and negotiated alliances. Look out at the lake and the ridge opposite and imagine sitting here as a king with the whole valley laid out beneath you."
      ],
      lookFor: ["Floral glass inlay and alabaster relief", "Marble lattice screens (jalis)", "Chhatri-style domed pavilions on the roofline", "The view over the lake"],
      facts: ["Private-audience halls like this were the quiet counterpart to the open public hall below.", "The lattice work lets air through but keeps the sun out, making the terrace comfortable even in heat."],
      tip: "This terrace is often quieter than the courtyards below, and a good place to rest.",
      next: "Return to the courtyard, then follow the passage to the next level, where the royal women lived: the Zenana.",
      mapQ: "Jas Mandir Amer Fort Jaipur"
    },
    {
      id: "zenana", zone: "Courtyard IV", num: 12, minutes: 12,
      title: "The Zenana", subtitle: "Secrets of the queens’ quarters",
      img: "img/zenana.jpg", pos: "50% 60%",
      teaser: "A courtyard of rooms all opening onto one corridor, so no one could tell which door the king chose.",
      story: [
        "You are now in the fourth and most secluded courtyard, the zenana, where the royal women lived with their attendants. The rooms here are ordered and simple, and they are connected by one clever feature: a shared corridor.",
        "Every queen’s room opens onto the same passage. When the Maharaja came to visit, no one could tell whose door he had entered. Jealousy and politics were part of court life, and the architecture protected both the king and the queens from gossip and rivalry.",
        "Folklore adds that Raja Man Singh had twelve queens, and that each had her own room linked by a staircase to his, though the queens could not climb it. Whether or not every detail is true, the lesson is real: in Amer, the layout of a building was also a rulebook for how people lived."
      ],
      lookFor: ["Rooms opening onto a common corridor", "Small windows and lattices for seeing without being seen", "Faded fresco traces on walls and ceilings"],
      facts: ["The queen mothers often funded temples in Amer town, giving women a real hand in the city’s religious life.", "Zenana comes from the Persian word for ‘women’."],
      tip: "Look out over the courtyard from the balcony and imagine where the palace women would have stood.",
      next: "Walk on to the oldest section of the palace, the Man Singh Palace, with its central pavilion.",
      mapQ: "Zenana Amer Fort Jaipur"
    },
    {
      id: "mansingh", zone: "Courtyard IV", num: 13, minutes: 12,
      title: "Man Singh Palace", subtitle: "The oldest heart of the fort",
      img: "img/mansingh.jpg", pos: "50% 55%",
      teaser: "A pavilion in a courtyard, built in 25 years and finished in 1599.",
      story: [
        "This is where it all started. The Man Singh Palace is the oldest part of the fort, begun by Raja Man Singh I, the celebrated general of the Mughal emperor Akbar. It took around 25 years to build and was completed in 1599. Everything you have seen so far grew from this core.",
        "Stand at the centre of the courtyard and look at the pillared pavilion, the baradari. It was once curtained for privacy and used as the meeting place for the queens. Around it rooms open onto small balconies, painted with frescoes and coloured tiles. It was a family home before it was a showpiece.",
        "Notice how simple and sturdy it feels compared with the later, richer Mirror Palace. Man Singh built for strength and permanence. His successors added the poetry. Together they gave Amer its twin personality: a fortress with a jewel inside."
      ],
      lookFor: ["The central pillared baradari pavilion", "Frescoes and coloured tiles in the rooms", "Balconies opening onto the courtyard"],
      facts: ["Man Singh I was one of the most important commanders of the Mughal emperor Akbar.", "This section is the original palace; Jai Singh I and later rulers added the grand halls and gates over the next 150 years."],
      tip: "This courtyard is lovely in the afternoon when the pavilion casts long shadows.",
      next: "Follow signs to the exit passage and, if you wish, the hidden tunnel viewpoint towards Jaigarh.",
      mapQ: "Man Singh Palace Amer Fort Jaipur"
    },
    {
      id: "jaigarh", zone: "The Exit", num: 14, minutes: 15,
      title: "The Secret Passage & Beyond", subtitle: "Back to the town, and up to Jaigarh",
      img: "img/jaigarh.jpg", pos: "50% 40%",
      teaser: "An escape tunnel, a giant cannon and a stroll through Amer’s old town.",
      story: [
        "Amer’s last secret is hidden from view. A subterranean passage once connected the palace to Jaigarh Fort, the fortress above, so the royal family could slip away to safety if the palace fell. The two are still considered one complex, and Jaigarh is a short hike up the hill.",
        "If you have energy, Jaigarh is worth the effort. It stands some 400 metres above the palace and held a cannon foundry where Jaivana, once the world’s largest cannon on wheels, was made. The view of Amer, the lake and the ranges beyond is magnificent.",
        "Otherwise, leave by the exit of the Man Singh Palace and wander into the old town of Amer. Look for the Panna Meena ka Kund stepwell, a short walk away, and the carved temples nearby. Take one last look at the fort from the lake as the evening glow settles. The kings are long gone, but their stage remains."
      ],
      lookFor: ["Jaigarh’s ramparts on the ridge", "The viewpoint over the lake and town", "The stepwell and temples in Amer old town"],
      facts: ["Amer and Jaigarh were the base of a dynasty that moved to Jaipur in 1727.", "In 2013 Amer was listed by UNESCO along with five other forts as the Hill Forts of Rajasthan."],
      tip: "If you’re staying for the evening sound-and-light show, grab tea at a stall in the old town while you wait.",
      next: "You’ve finished the route. Return via jeep, rickshaw or the lakeside path.",
      mapQ: "Jaigarh Fort Jaipur"
    }
  ]
};
