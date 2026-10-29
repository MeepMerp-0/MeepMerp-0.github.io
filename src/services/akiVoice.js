// Aki voice input: the browser's own speech recognition, or where it has none a recording the Worker transcribes,
// plus a guess at whether the visitor has finished speaking.
const Recognition = typeof window === 'undefined' ? undefined : window.SpeechRecognition || window.webkitSpeechRecognition;

// Brave ships the API but no speech service behind it, so every turn fails with "network": it records, as Firefox does.
export const VOICE_SUPPORTED = Boolean(Recognition) && !navigator.brave;

// The first container both the browser can record and the Worker accepts.
const RECORD_TYPE = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia
  ? ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
  : '';

// 'speech' (the browser transcribes), 'record' (the Worker does) or null (no mic).
export const VOICE_MODE = VOICE_SUPPORTED ? 'speech' : RECORD_TYPE ? 'record' : null;

// How long a silence ends the turn, by how the words so far end.
export const END_MS = { done: 900, plain: 1400, pausing: 2500 };

// ponytail: English fillers and joining words only; other languages fall back to punctuation and the plain wait.
// Upgrade path if it misfires: a semantic end-of-turn check.
const PAUSING = /(?:^|\s)(?:u+m+|u+h+|e+r+m*|h+m+|a+h+|and|but|or|so|because|cause|like|the|a|an|to|of|with|for|about|in|on|at|from|my|his|your|is|are|was|if|then|than|that|which|who|what|when|where|how|i|i'm|you know|i mean)$/i;

export function endDelay(text) {
  const t = text.trim();
  // CJK and Arabic commas count too, like their sentence ends below.
  if (/(?:[,\uFF0C\u3001\u060C]|\.\.\.|\u2026|[-\u2013\u2014])$/.test(t)) return END_MS.pausing;
  // Whisper ends nearly every phrase with a full stop: "projects and." is still mid-thought, "what is it about?" is not.
  if (PAUSING.test(t.replace(/[.\u3002]+$/, ''))) return END_MS.pausing;
  return /[.?!\u3002\uFF1F\uFF01\u061F]$/.test(t) ? END_MS.done : END_MS.plain;
}

// How strongly a normal speaking voice moves the wave; raise it if the line barely moves on a quiet mic.
const GAIN = 6;

// Mic level for the wave, 0..1: measured from the audio where a second capture is safe, else a pulse per recognized word.
// ponytail: phones and tablets (coarse pointer) skip the second capture, which can starve their speech recognizer.
// Upgrade path: one shared stream through recognition.start(track) once browsers support it.
function meter() {
  let pulse = 0;
  let at = 0;
  let ctx = null;
  let stream = null;
  let analyser = null;
  let buf = null;
  let closed = false;
  if (!matchMedia('(pointer: coarse)').matches && navigator.mediaDevices?.getUserMedia) {
    try {
      // Made inside the tap, so the browser lets it run.
      ctx = new AudioContext();
      // Unprocessed: Chromium's gain control on this second capture could turn down the recognizer's mic level.
      const raw = { autoGainControl: false, echoCancellation: false, noiseSuppression: false };
      navigator.mediaDevices.getUserMedia({ audio: raw }).then((s) => {
        if (closed) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        buf = new Uint8Array(analyser.fftSize);
        // Analysed only: never connected to the speakers, never recorded.
        ctx.createMediaStreamSource(s).connect(analyser);
      }, () => { /* no second capture: word pulses only */ });
    } catch { ctx = null; }
  }
  return {
    word: () => { pulse = 1; at = performance.now(); },
    // The louder of the two: the measured voice moves at once, and the word pulses still move the line
    // if the browser hands the second capture silence while the recognizer has the mic.
    level: () => {
      const words = pulse * Math.exp(-(performance.now() - at) / 400);
      if (!analyser) return words;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      return Math.max(words, Math.min(1, Math.sqrt(sum / buf.length) * GAIN));
    },
    close: () => {
      if (closed) return;
      closed = true;
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => { /* already closed */ });
    },
  };
}

// One voice turn. onText gets the words so far; a long enough silence, stop() or the browser ending the session
// calls onDone with the final words (possibly empty). abort() ends it with no further callback. level() feeds the wave.
// Record mode uploads through transcribe(blob, signal), which resolves { text } or { error: code }.
export function listen({ onText, onDone, onError, transcribe }) {
  if (VOICE_MODE === 'record') return record({ onText, onDone, onError, transcribe });
  const rec = new Recognition();
  const wave = meter();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = navigator.language;
  let text = '';
  let timer;
  let ending = false;
  let failed = null;
  let cancelled = false;
  let done = false;
  const stop = () => { ending = true; clearTimeout(timer); rec.stop(); };
  // Runs once, from the error or the end event: Safari sends no end after a permission or service error.
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    wave.close();
    if (cancelled) return;
    // No speech at all is a quiet end, not a failure.
    if (failed && failed !== 'no-speech' && failed !== 'aborted') onError(failed);
    else onDone(text);
  };
  rec.onresult = (e) => {
    if (cancelled || done) return;
    wave.word();
    // Chrome starts later results with a space, Safari does not.
    text = Array.from(e.results, (r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
    onText(text);
    // Results that arrive after stop() update the words but never restart the wait; onText may have aborted.
    if (ending || cancelled) return;
    clearTimeout(timer);
    timer = setTimeout(stop, endDelay(text));
  };
  rec.onerror = (e) => { failed = e.error; finish(); };
  rec.onend = finish;
  try {
    rec.start();
  } catch {
    queueMicrotask(() => { failed = 'start'; finish(); });
  }
  return { stop, level: wave.level, abort: () => { cancelled = true; clearTimeout(timer); wave.close(); rec.abort(); } };
}

// Record mode. Pause detection starting points, not measurements: with noise suppression on, a quiet room sits well
// under MIN_RMS and a voice well over it. Speech is louder than MIN_RMS and three times the room's noise floor, which
// drops at once to any quieter moment and creeps up over seconds, so a steady hum stops counting as speech.
// Raise MIN_RMS if a quiet room counts as speech, lower it if a soft voice is missed.
const MIN_RMS = 0.01;
// Silence after new speech that sends what was said so far.
const PAUSE_MS = 700;
// Whisper's marks make most partials END_MS.done: the shortest silence that ends a recorded turn.
const MIN_RECORD_END_MS = 1200;
const NO_SPEECH_MS = 8000;
// About MAX_CHARS of speech, and at 32 kbps far under the Worker's 1 MiB cap.
const MAX_RECORD_MS = 30000;

// The browser records, the Worker transcribes. A pause sends the whole recording so far; words that end mid-thought keep
// the mic on, others are the final words and nothing more is sent. Audio with no speech in it is never uploaded:
// Whisper invents "Thank you." on silence.
// ponytail: loudness, not a voice detector; a busy room's chatter can read as speech, and then only stop() or the
// 30 s cap ends the turn. Nor can loudness single out the nearer of two speakers: a voice 10 dB farther off peaks as
// loud as the near one's softer words. Tried and dropped: gating the audio on it cut the visitor's own words, and
// timing pauses on it still let the other voice in. Upgrade path: a real VAD, and a speaker-aware one for a second
// voice.
function record({ onText, onDone, onError, transcribe }) {
  const chunks = [];
  const buf = new Float32Array(2048);
  let ctx = null;
  let stream = null;
  let rec = null;
  let analyser = null;
  let tick;
  let t0 = 0;
  let floor = 0;
  let heardAt = 0; // the latest moment of speech; 0 until there is some
  let partial = null; // the newest transcription: { at: the speech moment it covers, text }
  let pending = null; // the one request in flight: { at, ctrl }
  let stopping = false;
  let ended = false;
  let cancelled = false;

  const rms = () => {
    if (!analyser) return 0;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    return Math.sqrt(sum / buf.length);
  };
  // Once per turn, for done, fail and abort alike: true the first time.
  const end = () => {
    if (ended) return false;
    ended = true;
    clearInterval(tick);
    pending?.ctrl.abort();
    if (rec && rec.state !== 'inactive') rec.stop();
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close().catch(() => { /* already closed */ });
    analyser = null;
    return true;
  };
  const done = (text) => {
    if (!end()) return;
    onText(text);
    // onText may have aborted (too long for the box).
    if (!cancelled) onDone(text);
  };
  const fail = (code) => { if (end()) onError(code); };
  // Always the whole recording so far, covering the speech up to `at`. A cancelled answer is dropped.
  const send = (at) => {
    if (ended) return;
    const ctrl = new AbortController();
    pending = { at, ctrl };
    transcribe(new Blob(chunks, { type: RECORD_TYPE }), ctrl.signal).catch(() => ({ error: 'failed' })).then((r) => {
      if (ctrl.signal.aborted) return;
      pending = null;
      if (r.error) return fail(r.error);
      partial = { at, text: r.text };
      // stop() waited for this one because it covers the latest speech: it is the final.
      if (stopping) done(r.text);
      else onText(r.text);
    });
  };
  const stop = () => {
    if (stopping || ended) return;
    stopping = true;
    clearInterval(tick);
    if (pending?.at === heardAt) return;
    pending?.ctrl.abort();
    pending = null;
    if (!heardAt) return done('');
    if (partial?.at === heardAt) return done(partial.text);
    // The recorder hands over its last chunk before its stop event.
    if (rec.state === 'inactive') send(heardAt);
    else { rec.onstop = () => send(heardAt); rec.stop(); }
  };
  const step = () => {
    const now = Date.now();
    const level = rms();
    floor = level < floor ? level : floor + (level - floor) * 0.005;
    if (level > Math.max(MIN_RMS, floor * 3)) heardAt = now;
    if (now - t0 >= MAX_RECORD_MS) return stop();
    if (!heardAt) { if (now - t0 >= NO_SPEECH_MS) done(''); return; }
    const quiet = now - heardAt;
    if (partial?.at !== heardAt) { if (!pending && quiet >= PAUSE_MS) send(heardAt); return; }
    // A partial with no words in it (a cough, a click) waits like no speech at all.
    if (quiet >= (partial.text ? Math.max(MIN_RECORD_END_MS, endDelay(partial.text)) : NO_SPEECH_MS)) done(partial.text);
  };

  try {
    // Made inside the tap, so the browser lets it run.
    ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* reads as silence: no speech, no upload */ });
    // Processed audio: noise suppression and gain control help Whisper and the pause detection alike.
    navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    }).then((s) => {
      // stop() or abort() came first.
      if (ended) { s.getTracks().forEach((t) => t.stop()); return; }
      stream = s;
      rec = new MediaRecorder(s, { mimeType: RECORD_TYPE, audioBitsPerSecond: 32000 });
      rec.ondataavailable = (e) => chunks.push(e.data);
      analyser = ctx.createAnalyser();
      analyser.fftSize = buf.length;
      // Analysed only: never connected to the speakers.
      ctx.createMediaStreamSource(s).connect(analyser);
      rec.start(250);
      t0 = Date.now();
      tick = setInterval(step, 50);
    }, (e) => fail(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'not-allowed' : 'audio-capture'))
      .catch(() => fail('audio-capture'));
  } catch {
    queueMicrotask(() => fail('audio-capture'));
  }
  return { stop, level: () => Math.min(1, rms() * GAIN), abort: () => { cancelled = true; end(); } };
}
