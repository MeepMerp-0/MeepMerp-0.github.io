import { endDelay } from './endDelay.js';
import { LevelMeter } from './levelMeter.js';

const SPEECH_FFT_SIZE = 512;
const WORD_PULSE_MS = 400;

// The browser's own speech recognition. Each result restarts the wait for the end of the turn (endDelay).
export class SpeechTurn {
  #onText;
  #onDone;
  #onError;
  #Recognition;
  #recognizer = null;
  #meter = null;
  #text = '';
  #timer;
  #ending = false;
  #failed = null;
  #cancelled = false;
  #finished = false;
  #pulse = 0;
  #pulseAt = 0;

  constructor({ onText, onDone, onError }, Recognition) {
    this.#onText = onText;
    this.#onDone = onDone;
    this.#onError = onError;
    this.#Recognition = Recognition;
  }

  start() {
    const rec = new this.#Recognition();
    this.#recognizer = rec;
    this.#meter = this.#openMeter();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language;
    rec.onresult = (e) => this.#onResult(e);
    rec.onerror = (e) => { this.#failed = e.error; this.#finish(); };
    rec.onend = () => this.#finish();
    try {
      rec.start();
    } catch {
      queueMicrotask(() => { this.#failed = 'start'; this.#finish(); });
    }
    return this;
  }

  stop() {
    this.#ending = true;
    clearTimeout(this.#timer);
    this.#recognizer.stop();
  }

  abort() {
    this.#cancelled = true;
    clearTimeout(this.#timer);
    this.#meter?.close();
    this.#recognizer.abort();
  }

  // Mic level for the wave, 0..1: measured from the audio where a second capture is safe, else a pulse per recognized
  // word. The louder of the two: the measured voice moves at once, and the word pulses still move the line if the
  // browser hands the second capture silence while the recognizer has the mic.
  level() {
    const words = this.#pulse * Math.exp(-(performance.now() - this.#pulseAt) / WORD_PULSE_MS);
    return Math.max(words, this.#meter?.level() ?? 0);
  }

  // The second capture: measured for the wave, never recorded.
  // ponytail: phones and tablets (coarse pointer) skip the second capture, which can starve their speech recognizer.
  // Upgrade path: one shared stream through recognition.start(track) once browsers support it.
  #openMeter() {
    if (matchMedia('(pointer: coarse)').matches || !navigator.mediaDevices?.getUserMedia) return null;
    try {
      const meter = new LevelMeter(SPEECH_FFT_SIZE);
      // Unprocessed: Chromium's gain control on this second capture could turn down the recognizer's mic level.
      const raw = { autoGainControl: false, echoCancellation: false, noiseSuppression: false };
      navigator.mediaDevices.getUserMedia({ audio: raw })
        .then((stream) => meter.attach(stream), () => { /* no second capture: word pulses only */ });
      return meter;
    } catch {
      return null;
    }
  }

  #onResult(e) {
    if (this.#cancelled || this.#finished) return;
    this.#pulse = 1;
    this.#pulseAt = performance.now();
    // Chrome starts later results with a space, Safari does not.
    this.#text = Array.from(e.results, (r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
    this.#onText(this.#text);
    // Results that arrive after stop() update the words but never restart the wait; onText may have aborted.
    if (this.#ending || this.#cancelled) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.stop(), endDelay(this.#text));
  }

  // Runs once, from the error or the end event: Safari sends no end after a permission or service error.
  #finish() {
    if (this.#finished) return;
    this.#finished = true;
    clearTimeout(this.#timer);
    this.#meter?.close();
    if (this.#cancelled) return;
    // No speech at all is a quiet end, not a failure.
    if (this.#failed && this.#failed !== 'no-speech' && this.#failed !== 'aborted') this.#onError(this.#failed);
    else this.#onDone(this.#text);
  }
}
