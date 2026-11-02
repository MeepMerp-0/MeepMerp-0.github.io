// How strongly a normal speaking voice moves the wave; raise it if the line barely moves on a quiet mic.
const GAIN = 6;

// The loudness of one mic capture. The constructor throws where there is no Web Audio.
export class LevelMeter {
  #context;
  #samples;
  #stream = null;
  #analyser = null;
  #closed = false;

  constructor(fftSize) {
    // Made inside the tap, so the browser lets it run.
    this.#context = new AudioContext();
    this.#samples = new Float32Array(fftSize);
  }

  resume() {
    if (this.#context.state === 'suspended') {
      this.#context.resume().catch(() => { /* reads as silence: a record turn hears no speech, uploads nothing */ });
    }
  }

  // False, with the tracks stopped, when close() came first.
  attach(stream) {
    if (this.#closed) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    this.#stream = stream;
    this.#analyser = this.#context.createAnalyser();
    this.#analyser.fftSize = this.#samples.length;
    // Analysed only: never connected to the speakers.
    this.#context.createMediaStreamSource(stream).connect(this.#analyser);
    return true;
  }

  // 0 before attach() and after close().
  rms() {
    if (!this.#analyser) return 0;
    this.#analyser.getFloatTimeDomainData(this.#samples);
    let sum = 0;
    for (const v of this.#samples) sum += v * v;
    return Math.sqrt(sum / this.#samples.length);
  }

  // 0..1, for the wave.
  level() {
    return Math.min(1, this.rms() * GAIN);
  }

  close() {
    if (this.#closed) return;
    this.#closed = true;
    this.#stream?.getTracks().forEach((t) => t.stop());
    this.#context.close().catch(() => { /* already closed */ });
    this.#analyser = null;
  }
}
