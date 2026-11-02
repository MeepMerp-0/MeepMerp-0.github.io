import { endDelay } from './endDelay.js';
import { LevelMeter } from './levelMeter.js';

// Record mode. Pause detection starting points, not measurements: with noise suppression on, a quiet room sits well
// under MIN_RMS and a voice well over it. Speech is louder than MIN_RMS and three times the room's noise floor, which
// drops at once to any quieter moment and creeps up over seconds, so a steady hum stops counting as speech.
// Raise MIN_RMS if a quiet room counts as speech, lower it if a soft voice is missed.
const MIN_RMS = 0.01;
const FLOOR_RATIO = 3;
const FLOOR_CREEP = 0.005;
// Silence after new speech that sends what was said so far.
const PAUSE_MS = 700;
// Whisper's marks make most partials END_MS.done: the shortest silence that ends a recorded turn.
const MIN_RECORD_END_MS = 1200;
const NO_SPEECH_MS = 8000;
// About MAX_CHARS of speech, and at 32 kbps far under the Worker's 1 MiB cap.
const MAX_RECORD_MS = 30000;

const TICK_MS = 50;
const CHUNK_MS = 250;
const BITRATE_BPS = 32000;
const FFT_SIZE = 2048;

// One loudness reading against the room's noise floor: the new floor, and whether the reading is speech.
function hearSpeech(floor, level) {
  const next = level < floor ? level : floor + (level - floor) * FLOOR_CREEP;
  return { floor: next, speech: level > Math.max(MIN_RMS, next * FLOOR_RATIO) };
}

// The browser records, the Worker transcribes. A pause sends the whole recording so far; words that end mid-thought keep
// the mic on, others are the final words and nothing more is sent. Audio with no speech in it is never uploaded:
// Whisper invents "Thank you." on silence.
// ponytail: loudness, not a voice detector; a busy room's chatter can read as speech, and then only stop() or the
// 30 s cap ends the turn. Nor can loudness single out the nearer of two speakers: a voice 10 dB farther off peaks as
// loud as the near one's softer words. Tried and dropped: gating the audio on it cut the visitor's own words, and
// timing pauses on it still let the other voice in. Upgrade path: a real VAD, and a speaker-aware one for a second
// voice.
export class RecordTurn {
  #onText;
  #onDone;
  #onError;
  #transcribe;
  #mimeType;
  #meter = null;
  #recorder = null;
  #chunks = [];
  #tick;
  #startedAt = 0;
  #floor = 0;
  #heardAt = 0; // the latest moment of speech; 0 until there is some
  #partial = null; // the newest transcription: { at: the speech moment it covers, text }
  #pending = null; // the one request in flight: { at, ctrl }
  #stopping = false;
  #ended = false;
  #cancelled = false;

  constructor({ onText, onDone, onError, transcribe }, mimeType) {
    this.#onText = onText;
    this.#onDone = onDone;
    this.#onError = onError;
    this.#transcribe = transcribe;
    this.#mimeType = mimeType;
  }

  start() {
    try {
      this.#meter = new LevelMeter(FFT_SIZE);
      this.#meter.resume();
      // Processed audio: noise suppression and gain control help Whisper and the pause detection alike.
      navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      }).then(
        (stream) => this.#attach(stream),
        (e) => this.#fail(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'not-allowed' : 'audio-capture'),
      ).catch(() => this.#fail('audio-capture'));
    } catch {
      queueMicrotask(() => this.#fail('audio-capture'));
    }
    return this;
  }

  stop() {
    if (this.#stopping || this.#ended) return;
    this.#stopping = true;
    clearInterval(this.#tick);
    if (this.#pending?.at === this.#heardAt) return;
    this.#pending?.ctrl.abort();
    this.#pending = null;
    if (!this.#heardAt) return this.#done('');
    if (this.#partial?.at === this.#heardAt) return this.#done(this.#partial.text);
    // The recorder hands over its last chunk before its stop event.
    if (this.#recorder.state === 'inactive') {
      this.#send(this.#heardAt);
    } else {
      this.#recorder.onstop = () => this.#send(this.#heardAt);
      this.#recorder.stop();
    }
  }

  abort() {
    this.#cancelled = true;
    this.#end();
  }

  level() {
    return this.#meter?.level() ?? 0;
  }

  #attach(stream) {
    // stop() or abort() came first.
    if (!this.#meter.attach(stream)) return;
    this.#recorder = new MediaRecorder(stream, { mimeType: this.#mimeType, audioBitsPerSecond: BITRATE_BPS });
    this.#recorder.ondataavailable = (e) => this.#chunks.push(e.data);
    this.#recorder.start(CHUNK_MS);
    this.#startedAt = Date.now();
    this.#tick = setInterval(() => this.#step(), TICK_MS);
  }

  #step() {
    const now = Date.now();
    const { floor, speech } = hearSpeech(this.#floor, this.#meter.rms());
    this.#floor = floor;
    if (speech) this.#heardAt = now;
    if (now - this.#startedAt >= MAX_RECORD_MS) return this.stop();
    if (!this.#heardAt) {
      if (now - this.#startedAt >= NO_SPEECH_MS) this.#done('');
      return;
    }
    const quiet = now - this.#heardAt;
    if (this.#partial?.at !== this.#heardAt) {
      if (!this.#pending && quiet >= PAUSE_MS) this.#send(this.#heardAt);
      return;
    }
    // A partial with no words in it (a cough, a click) waits like no speech at all.
    const endAfter = this.#partial.text ? Math.max(MIN_RECORD_END_MS, endDelay(this.#partial.text)) : NO_SPEECH_MS;
    if (quiet >= endAfter) this.#done(this.#partial.text);
  }

  // Always the whole recording so far, covering the speech up to `at`. A cancelled answer is dropped.
  #send(at) {
    if (this.#ended) return;
    const ctrl = new AbortController();
    this.#pending = { at, ctrl };
    this.#transcribe(new Blob(this.#chunks, { type: this.#mimeType }), ctrl.signal)
      .catch(() => ({ error: 'failed' }))
      .then((r) => {
        if (ctrl.signal.aborted) return;
        this.#pending = null;
        if (r.error) return this.#fail(r.error);
        this.#partial = { at, text: r.text };
        // stop() waited for this one because it covers the latest speech: it is the final.
        if (this.#stopping) this.#done(r.text);
        else this.#onText(r.text);
      });
  }

  #done(text) {
    if (!this.#end()) return;
    this.#onText(text);
    // onText may have aborted (too long for the box).
    if (!this.#cancelled) this.#onDone(text);
  }

  #fail(code) {
    if (this.#end()) this.#onError(code);
  }

  // Once per turn, for done, fail and abort alike: true the first time.
  #end() {
    if (this.#ended) return false;
    this.#ended = true;
    clearInterval(this.#tick);
    this.#pending?.ctrl.abort();
    if (this.#recorder && this.#recorder.state !== 'inactive') this.#recorder.stop();
    this.#meter?.close();
    return true;
  }
}
