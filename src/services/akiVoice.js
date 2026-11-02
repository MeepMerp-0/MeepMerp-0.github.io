// Aki voice input: the browser's own speech recognition, or where it has none a recording the Worker transcribes,
// plus a guess at whether the visitor has finished speaking.
import { RecordTurn } from './aki/voice/recordTurn.js';
import { SpeechTurn } from './aki/voice/speechTurn.js';

export { END_MS, endDelay } from './aki/voice/endDelay.js';

const Recognition = typeof window === 'undefined' ? undefined : window.SpeechRecognition || window.webkitSpeechRecognition;

// Brave ships the API but no speech service behind it, so every turn fails with "network": it records, as Firefox does.
export const VOICE_SUPPORTED = Boolean(Recognition) && !navigator.brave;

// The first container both the browser can record and the Worker accepts.
const RECORD_TYPE = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia
  ? ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
  : '';

// 'speech' (the browser transcribes), 'record' (the Worker does) or null (no mic).
export const VOICE_MODE = VOICE_SUPPORTED ? 'speech' : RECORD_TYPE ? 'record' : null;

// One voice turn. onText gets the words so far; a long enough silence, stop() or the browser ending the session
// calls onDone with the final words (possibly empty). abort() ends it with no further callback. level() feeds the wave.
// Record mode uploads through transcribe(blob, signal), which resolves { text } or { error: code }.
export function listen(callbacks) {
  return VOICE_MODE === 'record'
    ? new RecordTurn(callbacks, RECORD_TYPE).start()
    : new SpeechTurn(callbacks, Recognition).start();
}
