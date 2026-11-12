/* CoverMe — voice button (WhatsApp-style).
   Hold to record and release to send, or tap to start and tap again to send.
   Slide left while holding to cancel. Live waveform, 60 s cap with countdown.
   The audio Blob goes straight to POST /cases/voice and is never stored. */
window.CM = window.CM || {};
CM.voice = (function () {
  const MAX = 60, HOLD_MS = 350, CANCEL_PX = 80;

  function init(o) {
    const wrap = o.wrap, btn = o.button, panel = o.panel, canvas = o.canvas, timeEl = o.time, cancelEl = o.cancel, idle = o.idle;
    let rec = null, stream = null, ctx = null, analyser = null, raf = 0, tick = 0, chunks = [];
    let state = 'idle'; // idle | starting | recording
    let mode = null;    // hold | tap
    let pressAt = 0, startX = 0, armed = false, startedAt = 0, pressing = false;

    function setUi(on) {
      wrap.classList.toggle('recording', on);
      panel.hidden = !on; if (idle) idle.hidden = on;
      btn.innerHTML = CM.icon(on ? 'send' : 'mic');
      btn.setAttribute('aria-label', CM.t(on ? 'home.voice.stopAria' : 'home.voice.aria'));
      btn.setAttribute('aria-pressed', String(on));
    }
    function draw() {
      if (!analyser) return;
      const c2 = canvas.getContext('2d'); const W = canvas.width = canvas.clientWidth * devicePixelRatio; const H = canvas.height = canvas.clientHeight * devicePixelRatio;
      const data = new Uint8Array(analyser.frequencyBinCount); analyser.getByteTimeDomainData(data);
      c2.clearRect(0, 0, W, H);
      const bars = 36, gap = 3 * devicePixelRatio, bw = (W - gap * (bars - 1)) / bars;
      c2.fillStyle = '#FFE3E3'; // drawn on the green hero
      for (let i = 0; i < bars; i++) {
        let peak = 0; const step = Math.floor(data.length / bars);
        for (let j = 0; j < step; j++) peak = Math.max(peak, Math.abs(data[i * step + j] - 128));
        const h = Math.max(4 * devicePixelRatio, (peak / 128) * H * 1.6);
        const x = i * (bw + gap), y = (H - Math.min(H, h)) / 2;
        c2.beginPath(); if (c2.roundRect) c2.roundRect(x, y, bw, Math.min(H, h), bw / 2); else c2.rect(x, y, bw, Math.min(H, h)); c2.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    function updateTime() {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      timeEl.textContent = '0:' + String(Math.max(0, MAX - s)).padStart(2, '0');
      if (s >= MAX) { CM.ui.toast(CM.t('home.voice.limit'), 'timer'); stop(true); }
    }
    function cleanup() {
      cancelAnimationFrame(raf); clearInterval(tick);
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (ctx) ctx.close().catch(function () {});
      stream = ctx = analyser = rec = null; state = 'idle'; mode = null; armed = false;
      cancelEl.classList.remove('armed'); cancelEl.querySelector('span').textContent = CM.t('home.voice.slide');
      setUi(false);
    }
    async function start() {
      if (state !== 'idle') return;
      if (!navigator.mediaDevices || !window.MediaRecorder) { denied(); return; }
      state = 'starting';
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch (e) { state = 'idle'; denied(); return; }
      if (state !== 'starting') { cleanup(); return; } // released before permission resolved
      chunks = [];
      const type = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); });
      rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 24000 } : undefined);
      rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      rec.start(250);
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); analyser = ctx.createAnalyser(); analyser.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(analyser); } catch (e) {}
      state = 'recording'; startedAt = Date.now();
      setUi(true); updateTime(); tick = setInterval(updateTime, 250); draw();
      if (navigator.vibrate) navigator.vibrate(20);
    }
    function stop(send) {
      if (state === 'starting') { state = 'idle'; return; }
      if (state !== 'recording') return;
      const dur = (Date.now() - startedAt) / 1000; const r = rec;
      r.onstop = function () {
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
        chunks = [];
        if (!send) { CM.ui.toast(CM.t('home.voice.cancelled'), 'x'); if (o.onCancel) o.onCancel(); return; }
        if (dur < 1) { CM.ui.toast(CM.t('home.voice.short'), 'info'); return; }
        o.onDone({ blob, durationSec: Math.round(dur), mimeType: blob.type });
      };
      r.stop(); cleanup();
    }
    function denied() { CM.ui.toast(CM.t('home.voice.denied'), 'mic'); if (o.onDenied) o.onDenied(); }

    btn.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      pressing = true; pressAt = Date.now(); startX = e.clientX; armed = false;
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      if (state === 'idle') { mode = null; start(); }
    });
    btn.addEventListener('pointermove', function (e) {
      if (!pressing || state !== 'recording' || mode === 'tap') return;
      const dx = e.clientX - startX;
      armed = dx < -CANCEL_PX;
      cancelEl.classList.toggle('armed', armed);
      cancelEl.querySelector('span').textContent = CM.t(armed ? 'home.voice.release' : 'home.voice.slide');
    });
    function release() {
      if (!pressing) return; pressing = false;
      const held = Date.now() - pressAt;
      if (mode === 'tap') { stop(true); return; }               // second tap in tap mode: send
      if (held >= HOLD_MS) { mode = 'hold'; stop(!armed); return; } // hold mode: release sends (or cancels)
      mode = 'tap';                                              // quick tap: keep recording
      if (state === 'starting') { /* permission prompt open: keep tap mode */ }
    }
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', function () { if (pressing) { pressing = false; if (mode !== 'tap') stop(false); } });
    btn.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (state === 'idle') { mode = 'tap'; start(); } else stop(true);
    });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    o.cancelBtn && o.cancelBtn.addEventListener('click', function () { stop(false); });
    setUi(false);
    return { stop };
  }
  return { init };
})();
