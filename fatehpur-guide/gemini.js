(function () {
  // Ordered best-first. If a model is rate-limited (429) or unavailable, the next one is tried.
  const MODELS = [
    { id: "gemini-4-carbon", label: "Gemini 4 Carbon" },
    { id: "gemini-4-argon", label: "Gemini 4 Argon" },
    { id: "gemini-4-hydrogen", label: "Gemini 4 Hydrogen" },
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
    { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
    { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" }
  ];
  const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";
  const KEY_STORE = "amerGuide.geminiKey";
  const COOL_STORE = "amerGuide.modelCooldown";
  const TIMEOUT_MS = 25000;
  const RETRYABLE = new Set([404, 408, 429, 500, 502, 503, 504]);

  let fileKey;

  function readCooldowns() {
    try { return JSON.parse(sessionStorage.getItem(COOL_STORE) || "{}"); } catch { return {}; }
  }
  function coolDown(modelId, ms) {
    const c = readCooldowns();
    c[modelId] = Date.now() + ms;
    sessionStorage.setItem(COOL_STORE, JSON.stringify(c));
  }

  // Local dev convenience: when served from the repo root, ../gemini.txt is picked up.
  // That file is git-ignored, so on the deployed site the visitor supplies their own key.
  async function getKey() {
    const stored = localStorage.getItem(KEY_STORE);
    if (stored) return stored;
    if (fileKey === undefined) {
      fileKey = await fetch("../gemini.txt", { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : ""))
        .then((t) => (/^[\w.\-]{20,}$/.test(t.trim()) ? t.trim() : ""))
        .catch(() => "");
    }
    return fileKey;
  }

  function cooldownFor(status, body) {
    const msg = body && body.error ? body.error.message || "" : "";
    if (/limit:\s*0\b/.test(msg)) return 3 * 3600 * 1000;
    if (/PerDay|per day/i.test(msg)) return 3600 * 1000;
    const delay = body && body.error && (body.error.details || []).find((d) => d.retryDelay);
    if (delay) {
      const secs = parseFloat(delay.retryDelay);
      if (secs > 0) return Math.min(secs, 600) * 1000;
    }
    return 60 * 1000;
  }

  function buildSystemPrompt(stop, data) {
    const route = data.stops.map((s) => `${s.num}. ${s.title}`).join("; ");
    return [
      "You are a warm, well-informed local guide leading a family on a self-guided walk through Fatehpur Sikri, Emperor Akbar's 16th-century capital near Agra, Uttar Pradesh, India.",
      `The visitor is standing at checkpoint ${stop.num} of ${data.stops.length}: "${stop.title}" (${stop.subtitle}).`,
      "",
      "Background on the site:",
      data.overview,
      "",
      `What the guide card says about this checkpoint:`,
      stop.story.join(" "),
      "Things the visitor was asked to spot here: " + stop.gallery.items.map((it) => `${it.label} (${it.how} ${it.why})`).join(" | "),
      "Facts: " + stop.facts.join(" "),
      "",
      "The full route in order: " + route + ".",
      "",
      "Rules: answer the visitor's question about this place in a friendly, story-like voice, in about 120 words or fewer unless they ask for more. " +
        "Be accurate. If history is uncertain or legendary, say so plainly instead of inventing details. " +
        "If asked about something far from this spot, answer briefly and gently steer back to what they can see here. " +
        "Use plain text with short paragraphs; **bold** is allowed sparingly. Mention practical tips (shade, steps, photography) when useful."
    ].join("\n");
  }

  async function callModel(model, key, systemPrompt, history, signal) {
    const res = await fetch(`${ENDPOINT}${model.id}:generateContent`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { temperature: 0.7 }
      })
    });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON error body */ }
    return { res, body };
  }

  function extractText(body) {
    const parts = (body && body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts) || [];
    return parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("").trim();
  }

  // Resolves { text, model, skipped: [{label, reason}] }. Throws Error with .code = "NO_KEY" | "BAD_KEY" | "ALL_FAILED".
  async function ask({ stop, data, history }) {
    const key = await getKey();
    if (!key) { const e = new Error("No API key"); e.code = "NO_KEY"; throw e; }
    const systemPrompt = buildSystemPrompt(stop, data);
    const cools = readCooldowns();
    const now = Date.now();
    const available = MODELS.filter((m) => !(cools[m.id] > now));
    // If every model is cooling down, still try them all once.
    const candidates = available.length ? available : MODELS;
    const skipped = available.length ? MODELS.filter((m) => cools[m.id] > now).map((m) => ({ label: m.label, reason: "rate limited earlier" })) : [];

    for (const model of candidates) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const { res, body } = await callModel(model, key, systemPrompt, history, ctrl.signal);
        if (res.ok) {
          const text = extractText(body);
          if (text) return { text, model, skipped };
          skipped.push({ label: model.label, reason: "empty reply" });
          continue;
        }
        const message = (body && body.error && body.error.message) || `HTTP ${res.status}`;
        if (res.status === 400 && /API key|API_KEY/i.test(message)) { const e = new Error(message); e.code = "BAD_KEY"; throw e; }
        if (res.status === 401 || res.status === 403) { const e = new Error(message); e.code = "BAD_KEY"; throw e; }
        if (res.status === 429) coolDown(model.id, cooldownFor(res.status, body));
        skipped.push({ label: model.label, reason: res.status === 429 ? "rate limited" : RETRYABLE.has(res.status) ? `unavailable (${res.status})` : `error ${res.status}` });
      } catch (err) {
        if (err.code === "BAD_KEY") throw err;
        skipped.push({ label: model.label, reason: err.name === "AbortError" ? "timed out" : "network error" });
      } finally {
        clearTimeout(timer);
      }
    }
    const e = new Error("All models are busy right now. Please try again in a minute.");
    e.code = "ALL_FAILED";
    e.skipped = skipped;
    throw e;
  }

  window.TourGemini = {
    MODELS,
    ask,
    getKey,
    setKey: (k) => localStorage.setItem(KEY_STORE, k.trim()),
    clearKey: () => localStorage.removeItem(KEY_STORE),
    hasStoredKey: () => !!localStorage.getItem(KEY_STORE)
  };
})();
