(function () {
  const { h, PLACEHOLDER, headerHTML, safeUrl } = Birds;
  document.getElementById('head').replaceWith(headerHTML('identify'));
  const $ = (id) => document.getElementById(id);
  const TARGET_SR = 32000, MAX_S = 60;
  const API = () => String(window.BIRDS_CONFIG.API_BASE).replace(/\/+$/, '');

  let stream, ctx, proc, src, chunks, timerId, startedAt, recording = false, busy = false;

  const status = (msg, err) => { $('status').textContent = msg || ''; $('status').classList.toggle('err', !!err); };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function setBusy(b) { busy = b; $('rec').disabled = b; $('file').disabled = b; }

  async function resampleBuffer(buf) {
    const len = Math.max(1, Math.ceil(buf.duration * TARGET_SR));
    const off = new OfflineAudioContext(1, len, TARGET_SR); // downmixes to mono
    const node = off.createBufferSource();
    node.buffer = buf;
    node.connect(off.destination);
    node.start();
    return (await off.startRendering()).getChannelData(0);
  }

  async function resampleRaw(data, sr) {
    if (sr === TARGET_SR) return data;
    try {
      const b = new AudioBuffer({ length: data.length, numberOfChannels: 1, sampleRate: sr });
      b.copyToChannel(data, 0);
      return await resampleBuffer(b);
    } catch (e) { // linear fallback
      const n = Math.floor(data.length * TARGET_SR / sr), out = new Float32Array(n), r = sr / TARGET_SR;
      for (let i = 0; i < n; i++) { const p = i * r, j = Math.floor(p), f = p - j; out[i] = data[j] * (1 - f) + (data[j + 1] ?? data[j]) * f; }
      return out;
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status('Recording is not supported in this browser (HTTPS required). Try uploading a file.', true); return; }
    status('');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      status(e.name === 'NotFoundError' ? 'No microphone found.' : 'Microphone access was denied. Allow it in your browser settings and try again.', true);
      return;
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    src = ctx.createMediaStreamSource(stream);
    proc = ctx.createScriptProcessor(4096, 1, 1);
    chunks = [];
    let total = 0;
    proc.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      total += d.length;
      let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
      $('level').style.width = Math.min(100, Math.sqrt(sum / d.length) * 300) + '%';
      if (total / ctx.sampleRate >= MAX_S) stopRecording();
    };
    src.connect(proc);
    proc.connect(ctx.destination); // required for onaudioprocess in some browsers; output is silent
    recording = true;
    startedAt = performance.now();
    $('rec').classList.add('on');
    $('recLabel').textContent = 'Stop & identify';
    $('file').disabled = true;
    timerId = setInterval(() => { $('timer').textContent = `${fmt(Math.min(MAX_S, (performance.now() - startedAt) / 1000))} / 1:00`; }, 200);
  }

  async function stopRecording() {
    if (!recording) return;
    recording = false;
    clearInterval(timerId);
    const sr = ctx.sampleRate;
    proc.onaudioprocess = null;
    try { src.disconnect(); proc.disconnect(); } catch (e) {}
    stream.getTracks().forEach((t) => t.stop());
    ctx.close();
    $('rec').classList.remove('on');
    $('recLabel').textContent = 'Start recording';
    $('level').style.width = '0';
    const data = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
    let o = 0; for (const c of chunks) { data.set(c, o); o += c.length; }
    chunks = [];
    setBusy(true);
    try { await identify(await resampleRaw(data, sr)); } finally { setBusy(false); }
  }

  async function onFile(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    status('Reading audio file…');
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = new AC();
      let buf;
      try { buf = await c.decodeAudioData(await f.arrayBuffer()); }
      catch (err) { status('Could not decode that audio file. Try MP3, WAV, M4A or OGG.', true); return; }
      finally { c.close(); }
      const pcm = await resampleBuffer(buf);
      const clipped = pcm.length > MAX_S * TARGET_SR;
      await identify(clipped ? pcm.slice(0, MAX_S * TARGET_SR) : pcm, clipped ? `Using the first ${MAX_S} seconds. ` : '');
    } catch (err) {
      status('Could not process that file: ' + err.message, true);
    } finally { setBusy(false); }
  }

  async function identify(pcm, prefix = '') {
    $('timer').textContent = `0:00 / 1:00`;
    if (pcm.length < TARGET_SR) { status('Recording too short — please record at least a couple of seconds.', true); return; }
    status(prefix + 'Analysing…');
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 90000);
    try {
      const r = await fetch(`${API()}/identify?min_conf=0.05&top_k=10`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength), signal: ctl.signal });
      if (r.status === 413) { status('That recording is too large for the server. Try a shorter clip.', true); return; }
      if (!r.ok) { status(`The identification service returned an error (${r.status}). Please try again.`, true); return; }
      const j = await r.json();
      show(j);
      status(`${prefix}Analysed ${Math.round(j.duration_s || pcm.length / TARGET_SR)} s of audio.`);
    } catch (e) {
      status(e.name === 'AbortError' ? 'The service took too long to respond. Please try again.' : 'Could not reach the identification service. Check your connection and try again.', true);
    } finally { clearTimeout(to); }
  }

  function show(j) {
    const res = j.results || [];
    $('resultsWrap').hidden = false;
    $('results').replaceChildren(...(res.length ? res.map(card) : [h('p', { class: 'empty', text: 'No confident matches. Try a closer, longer recording.' })]));
  }

  function card(r) {
    const pct = Math.round((r.confidence || 0) * 100);
    const on = r.in_checklist && r.bird_id;
    const photo = safeUrl(r.photo);
    const img = h('img', { src: photo || PLACEHOLDER, alt: '', loading: 'lazy' });
    img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });
    const body = h('div', { class: 'rb' },
      h('strong', { text: (on && r.checklist_common) || r.common || r.scientific }),
      h('span', { class: 'sci', text: r.scientific || '' }),
      h('div', { class: 'conf' }, h('div', { class: 'bar' }, h('i', { style: `width:${Math.max(2, pct)}%` })), h('span', { text: pct + '%' })),
      on ? null : h('div', { class: 'note', text: 'Not on Keoladeo list' }));
    const attrs = { class: 'rcard' + (on ? '' : ' off') };
    return on ? h('a', { ...attrs, href: 'bird.html?id=' + encodeURIComponent(r.bird_id) }, img, body) : h('div', attrs, img, body);
  }

  $('rec').addEventListener('click', () => { if (!busy) (recording ? stopRecording() : startRecording()); });
  $('file').addEventListener('change', onFile);
  addEventListener('pagehide', () => { if (recording) { stream.getTracks().forEach((t) => t.stop()); } });
})();
