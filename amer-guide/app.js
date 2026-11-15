(function () {
  const data = window.AMER;
  const stops = data.stops;
  const G = window.AmerGemini;
  const VISITED_KEY = "amerGuide.visited";
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let visited = new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || "[]"));
  let current = -1;
  let lastFocus = null;
  let busy = false;
  const chats = {};

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Tiny, safe markdown: **bold**, *italic*, bullet lists, paragraphs.
  function renderMarkdown(text) {
    const lines = esc(text).split(/\n/);
    let html = "", list = false;
    const inline = (t) => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
    for (const raw of lines) {
      const line = raw.trim();
      const m = line.match(/^[-*•]\s+(.*)/);
      if (m) { if (!list) { html += "<ul>"; list = true; } html += `<li>${inline(m[1])}</li>`; continue; }
      if (list) { html += "</ul>"; list = false; }
      if (line) html += `<p>${inline(line)}</p>`;
    }
    return html + (list ? "</ul>" : "");
  }

  function saveVisited() {
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
    updateProgress();
  }

  function updateProgress() {
    $("visitedCount").textContent = visited.size;
    $("totalCount").textContent = stops.length;
    $("topProgress").style.width = (visited.size / stops.length) * 100 + "%";
    document.querySelectorAll(".stop").forEach((el) => el.classList.toggle("done", visited.has(el.dataset.id)));
    $("finish").classList.toggle("show", visited.size === stops.length);
    const lastIdx = stops.reduce((m, s, i) => (visited.has(s.id) ? i : m), -1);
    const next = stops.slice(lastIdx + 1).find((s) => !visited.has(s.id)) || stops.find((s) => !visited.has(s.id));
    const btn = $("upNext");
    if (next && visited.size > 0) { btn.hidden = false; $("upNextTitle").textContent = `${next.num}. ${next.title}`; btn.dataset.id = next.id; }
    else btn.hidden = true;
  }

  function buildPrep() {
    $("prepGrid").innerHTML = data.prep.map((p) => `<article><span>${p.icon}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join("");
  }

  function buildRoute() {
    let zone = "", html = "";
    stops.forEach((s, i) => {
      if (s.zone !== zone) {
        zone = s.zone;
        html += `<li class="zone" aria-hidden="true"><span>${esc(zone)}</span></li>`;
      }
      html += `<li class="stop ${i % 2 ? "right" : "left"}" data-id="${s.id}" data-index="${i}">
        <span class="node" aria-hidden="true"><b>${s.num}</b><i>✓</i></span>
        <button type="button" class="stop-card" data-index="${i}" aria-label="Open stop ${s.num}: ${esc(s.title)}">
          <span class="stop-photo" style="background-image:url('${s.img}');background-position:${s.pos}"></span>
          <span class="stop-body">
            <small>Stop ${s.num} · ${esc(s.zone)}</small>
            <strong>${esc(s.title)}</strong>
            <em>${esc(s.subtitle)}</em>
            <span class="stop-teaser">${esc(s.teaser)}</span>
            <span class="stop-foot"><span>⏱ ~${s.minutes} min</span><span class="flip-hint">Tap to flip ⟲</span></span>
          </span>
        </button>
      </li>`;
    });
    $("route").innerHTML = html;
    $("route").addEventListener("click", (e) => {
      const card = e.target.closest(".stop-card");
      if (card) openStop(+card.dataset.index, card);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".stop,.zone").forEach((el) => io.observe(el));
  }

  function fillFront(s) {
    $("frontImg").style.backgroundImage = `url('${s.img}')`;
    $("frontImg").style.backgroundPosition = s.pos;
    $("frontNum").textContent = s.num;
    $("frontZone").textContent = s.zone;
    $("frontTitle").textContent = s.title;
  }

  function fillBack(s) {
    $("backHero").style.backgroundImage = `linear-gradient(0deg,rgba(42,29,23,.92),rgba(42,29,23,.2)),url('${s.img}')`;
    $("backHero").style.backgroundPosition = s.pos;
    $("gZone").textContent = `Stop ${s.num} of ${stops.length} · ${s.zone}`;
    $("gTitle").textContent = s.title;
    $("gSub").textContent = s.subtitle;
    $("gTime").textContent = `⏱ Plan ~${s.minutes} min here`;
    $("gMap").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.mapQ);
    $("gStory").innerHTML = s.story.map((p) => `<p>${esc(p)}</p>`).join("");
    $("gLook").innerHTML = s.lookFor.map((t) => `<li>${esc(t)}</li>`).join("");
    $("gFacts").innerHTML = s.facts.map((t) => `<li>${esc(t)}</li>`).join("");
    $("gTip").textContent = s.tip;
    $("gNext").textContent = s.next;
    $("askName").textContent = s.title;
    $("backScroll").scrollTop = 0;
    const prev = stops[current - 1], next = stops[current + 1];
    $("prevBtn").hidden = !prev;
    $("prevLabel").textContent = prev ? `${prev.num}. ${prev.title}` : "";
    $("nextLabel").textContent = next ? `${next.num}. ${next.title}` : "Finish the tour";
    renderChips(s);
    renderChat(s);
  }

  const QUESTIONS = [
    "Tell me a story about this place",
    "What should I look for here?",
    "Any tips for visiting with kids?",
    "How was this built, and who built it?"
  ];

  function renderChips(s) {
    $("chips").innerHTML = QUESTIONS.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("");
  }

  function renderChat(s) {
    const msgs = chats[s.id] || [];
    $("chat").innerHTML = msgs.map(msgHtml).join("");
    $("askNote").textContent = "";
    $("askInput").value = "";
  }

  function msgHtml(m) {
    if (m.role === "user") return `<div class="msg user">${esc(m.text)}</div>`;
    const note = m.model ? `<small class="via">via ${esc(m.model)}${m.skipped && m.skipped.length ? ` · skipped ${m.skipped.map((x) => esc(x.label)).join(", ")}` : ""}</small>` : "";
    return `<div class="msg guide">${m.error ? `<p class="err">${esc(m.text)}</p>` : renderMarkdown(m.text)}${note}</div>`;
  }

  function scrollChatEnd() {
    const chat = $("chat");
    const box = $("backScroll");
    const bottom = chat.getBoundingClientRect().bottom - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTo({ top: Math.max(0, bottom - box.clientHeight + 90), behavior: "smooth" });
  }

  async function sendQuestion(q) {
    q = q.trim();
    if (!q || busy) return;
    const s = stops[current];
    const thread = (chats[s.id] = chats[s.id] || []);
    thread.push({ role: "user", text: q });
    busy = true;
    $("askSend").disabled = true;
    $("askInput").value = "";
    $("chat").innerHTML = thread.map(msgHtml).join("") + `<div class="msg guide typing" id="typing"><span></span><span></span><span></span></div>`;
    scrollChatEnd();
    const history = thread.filter((m) => !m.error).slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
    try {
      const r = await G.ask({ stop: s, data, history });
      thread.push({ role: "model", text: r.text, model: r.model.label, skipped: r.skipped });
    } catch (err) {
      if (err.code === "NO_KEY") {
        thread.pop();
        $("chat").innerHTML = thread.map(msgHtml).join("");
        $("askNote").innerHTML = 'To ask questions, add a Gemini API key in <button type="button" class="linkish" id="openKey">guide settings</button>.';
        $("openKey").addEventListener("click", openSettings);
        $("askInput").value = q;
        busy = false; $("askSend").disabled = false;
        return;
      }
      const msg = err.code === "BAD_KEY" ? "The Gemini API key was rejected. Check it in guide settings." : err.message;
      thread.push({ role: "model", text: msg, error: true });
    }
    busy = false;
    $("askSend").disabled = false;
    if (stops[current] && stops[current].id === s.id) { $("chat").innerHTML = thread.map(msgHtml).join(""); scrollChatEnd(); }
  }

  function openStop(i, origin) {
    current = i;
    lastFocus = origin || document.activeElement;
    const s = stops[i];
    fillFront(s);
    fillBack(s);
    visited.add(s.id);
    saveVisited();
    const stage = $("stage");
    stage.hidden = false;
    document.body.classList.add("locked");
    stage.classList.remove("flipped");
    void stage.offsetWidth;
    stage.classList.add("open");
    setTimeout(() => { stage.classList.add("flipped"); $("closeBtn").focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
  }

  function closeStage() {
    const stage = $("stage");
    if (stage.hidden) return;
    const el = document.querySelector(`.stop[data-index="${current}"]`);
    stage.classList.remove("open", "flipped");
    setTimeout(() => {
      stage.hidden = true;
      document.body.classList.remove("locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      if (el) el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      current = -1;
    }, reduceMotion ? 0 : 350);
  }

  function goTo(i) {
    if (i >= stops.length) { closeStage(); return; }
    if (i < 0) return;
    const stage = $("stage");
    stage.classList.remove("flipped");
    setTimeout(() => {
      current = i;
      const s = stops[i];
      fillFront(s); fillBack(s);
      visited.add(s.id); saveVisited();
      setTimeout(() => stage.classList.add("flipped"), reduceMotion ? 0 : 250);
    }, reduceMotion ? 0 : 500);
  }

  function openSettings() {
    $("keyInput").value = localStorage.getItem("amerGuide.geminiKey") || "";
    if (typeof $("settings").showModal === "function") $("settings").showModal();
  }

  function init() {
    buildPrep();
    buildRoute();
    updateProgress();
    $("modelOrder").innerHTML = G.MODELS.map((m, i) => `${i + 1}. ${esc(m.label)}`).join(" → ");

    $("closeBtn").addEventListener("click", closeStage);
    $("stageBackdrop").addEventListener("click", closeStage);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("stage").hidden && !$("settings").open) closeStage(); });
    $("prevBtn").addEventListener("click", () => goTo(current - 1));
    $("nextBtn").addEventListener("click", () => goTo(current + 1));
    $("askForm").addEventListener("submit", (e) => { e.preventDefault(); sendQuestion($("askInput").value); });
    $("chips").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) sendQuestion(b.dataset.q); });
    $("upNext").addEventListener("click", () => {
      const el = document.querySelector(`.stop[data-id="${$("upNext").dataset.id}"]`);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    $("settingsBtn").addEventListener("click", openSettings);
    $("keySave").addEventListener("click", () => { const v = $("keyInput").value.trim(); if (v) G.setKey(v); $("settings").close(); $("askNote").textContent = v ? "Key saved. Ask away!" : ""; });
    $("keyClear").addEventListener("click", () => { G.clearKey(); $("keyInput").value = ""; });

    const line = document.getElementById("route");
    const onScroll = () => {
      const r = line.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / r.height));
      line.style.setProperty("--p", (p * 100).toFixed(1) + "%");
      $("topbar").classList.toggle("solid", window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  init();
})();
